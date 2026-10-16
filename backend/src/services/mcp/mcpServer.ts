import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import prisma from "../../database";
import { uploadToDropbox } from "../dropboxService";
import { forwardUserToTelegram } from "../telegramService";
import { callGemini } from "../aiService";
import axios from "axios";

const server = new Server(
  {
    name: "reframe-visuals-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Define tools list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_services",
        description: "List all Reframe Visuals photo editing services and their starting prices.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_order",
        description: "Retrieve status and details of an order by its ID or order code.",
        inputSchema: {
          type: "object",
          properties: {
            orderId: {
              type: "string",
              description: "The order ID or order code (e.g., ORD-xxxx or CUID).",
            },
          },
          required: ["orderId"],
        },
      },
      {
        name: "create_order",
        description: "Create a new photo editing order for a customer.",
        inputSchema: {
          type: "object",
          properties: {
            customerId: { type: "string", description: "The customer CUID." },
            title: { type: "string", description: "Title of the order." },
            description: { type: "string", description: "Brief description of editing instructions." },
            services: { 
              type: "array", 
              items: { type: "string" }, 
              description: "List of services to request (e.g. ['Background Removal', 'Color Correction'])." 
            },
            volume: { type: "number", description: "Number of images." },
            outputFormat: { type: "string", description: "PSD, PNG, JPEG, TIFF" },
            background: { type: "string", description: "Transparent, White, Custom" },
            turnaround: { type: "string", description: "12 (express), 24, 48, 72" },
          },
          required: ["customerId", "title", "volume"],
        },
      },
      {
        name: "approve_order",
        description: "Approve a pending order proposal/quote to move it to the production stage.",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "string", description: "The order ID." },
          },
          required: ["orderId"],
        },
      },
      {
        name: "request_revision",
        description: "Request a revision on an active order with specific visual instructions.",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "string", description: "The order ID." },
            comment: { type: "string", description: "Revision instructions detailing what to fix." },
          },
          required: ["orderId", "comment"],
        },
      },
      {
        name: "upload_file",
        description: "Upload an image or asset file to Dropbox and register it in the database.",
        inputSchema: {
          type: "object",
          properties: {
            filename: { type: "string", description: "The name of the file (e.g. product.png)." },
            base64Data: { type: "string", description: "The Base64 encoded file contents." },
            fileUrl: { type: "string", description: "A public URL to download the file from." },
            guestId: { type: "string", description: "Optional guest session identifier." },
            customerCode: { type: "string", description: "Optional customer code (e.g. CLT042)." },
            orderCode: { type: "string", description: "Optional reserved order code." },
          },
          required: ["filename"],
        },
      },
      {
        name: "create_conversation",
        description: "Start a new support chat conversation thread.",
        inputSchema: {
          type: "object",
          properties: {
            customerId: { type: "string", description: "The customer ID starting the thread." },
            title: { type: "string", description: "Optional conversation title." },
          },
          required: ["customerId"],
        },
      },
      {
        name: "list_conversations",
        description: "List all support chat threads for a customer.",
        inputSchema: {
          type: "object",
          properties: {
            customerId: { type: "string", description: "The customer ID." },
          },
          required: ["customerId"],
        },
      },
      {
        name: "get_chat_history",
        description: "Fetch all message history in a support chat conversation.",
        inputSchema: {
          type: "object",
          properties: {
            conversationId: { type: "string", description: "The conversation thread ID." },
          },
          required: ["conversationId"],
        },
      },
      {
        name: "send_chat_message",
        description: "Send a message to a support chat thread and optionally get the AI CS response.",
        inputSchema: {
          type: "object",
          properties: {
            conversationId: { type: "string", description: "The conversation thread ID." },
            content: { type: "string", description: "The chat message content." },
          },
          required: ["conversationId", "content"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_services": {
        const services = await prisma.service.findMany();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(services, null, 2),
            },
          ],
        };
      }
      case "get_order": {
        const orderId = args?.orderId as string;
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { id: orderId },
              { code: orderId }
            ]
          },
          include: {
            images: true,
            customer: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        });

        if (!order) {
          return {
            content: [
              {
                type: "text",
                text: `Order not found for ID or Code: ${orderId}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(order, null, 2),
            },
          ],
        };
      }
      case "create_order": {
        const customerId = args?.customerId as string;
        const title = args?.title as string;
        const description = (args?.description as string) || "";
        const services = args?.services as string[];
        const volume = (args?.volume as number) || 1;
        const outputFormat = (args?.outputFormat as string) || "PNG";
        const background = (args?.background as string) || "Transparent";
        const turnaround = args?.turnaround as string;

        // Generate a random code
        const code = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

        const customer = await prisma.customer.findUnique({
          where: { id: customerId }
        });

        const order = await prisma.order.create({
          data: {
            tenantId: customer?.tenantId || "default",
            code,
            customerId,
            title,
            description,
            serviceType: services && services.length > 0 ? services.join(", ") : "standard",
            volume,
            outputFormat,
            background,
            turnaround,
            priority: turnaround === "12" ? "high" : "medium",
            rush: turnaround === "12",
            status: "new_review",
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `Order successfully created:\n${JSON.stringify(order, null, 2)}`,
            },
          ],
        };
      }
      case "approve_order": {
        const orderId = args?.orderId as string;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
          return {
            content: [{ type: "text", text: `Order not found for ID: ${orderId}` }],
            isError: true,
          };
        }

        const [updatedOrder] = await prisma.$transaction([
          prisma.order.update({ where: { id: orderId }, data: { status: "in_progress" } }),
          prisma.quotation.updateMany({
            where: { orderId, status: "sent" },
            data: { status: "accepted", acceptedAt: new Date() }
          })
        ]);

        await prisma.activity.create({
          data: {
            tenantId: order.tenantId,
            customerId: order.customerId,
            orderId: order.id,
            type: "status_change",
            message: `Order ${order.code} proposal approved programmatically. Status updated to in_progress.`
          }
        });

        return {
          content: [
            {
              type: "text",
              text: `Order approved successfully:\n${JSON.stringify(updatedOrder, null, 2)}`,
            },
          ],
        };
      }
      case "request_revision": {
        const orderId = args?.orderId as string;
        const comment = args?.comment as string;

        const order = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          return {
            content: [
              {
                type: "text",
                text: `Order not found for ID: ${orderId}`,
              },
            ],
            isError: true,
          };
        }

        const revisionNote = `[Customer revision requested via AI Agent ${new Date().toISOString()}]\n${comment}`;
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "revision_needed",
            notes: order.notes ? `${order.notes}\n\n${revisionNote}` : revisionNote,
          },
        });

        await prisma.activity.create({
          data: {
            tenantId: order.tenantId,
            customerId: order.customerId,
            orderId: order.id,
            type: "revision_request",
            message: `Revision requested programmatically for ${order.code}: ${comment.slice(0, 180)}`
          }
        });

        return {
          content: [
            {
              type: "text",
              text: `Order status set to revision_needed:\n${JSON.stringify(updatedOrder, null, 2)}`,
            },
          ],
        };
      }
      case "upload_file": {
        const filename = args?.filename as string;
        const base64Data = args?.base64Data as string;
        const fileUrl = args?.fileUrl as string;
        const guestId = args?.guestId as string;
        const customerCode = args?.customerCode as string;
        const orderCode = args?.orderCode as string;

        let fileBuffer: Buffer;

        if (base64Data) {
          fileBuffer = Buffer.from(base64Data, "base64");
        } else if (fileUrl) {
          const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
          fileBuffer = Buffer.from(response.data);
        } else {
          return {
            content: [{ type: "text", text: "Error: Either base64Data or fileUrl must be provided." }],
            isError: true,
          };
        }

        const result = await uploadToDropbox(fileBuffer, filename, {
          guestId,
          customerCode,
          orderCode,
        });

        if (!result.success) {
          return {
            content: [{ type: "text", text: `Dropbox Upload failed: ${result.error}` }],
            isError: true,
          };
        }


        return {
          content: [
            {
              type: "text",
              text: `File uploaded successfully:\n${JSON.stringify({ path: result.path, url: result.url, filename }, null, 2)}`,
            },
          ],
        };
      }
      case "create_conversation": {
        const customerId = args?.customerId as string;
        const title = (args?.title as string) || "AI Agent Support Thread";

        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) {
          return {
            content: [{ type: "text", text: `Customer not found for ID: ${customerId}` }],
            isError: true,
          };
        }

        const conversation = await prisma.conversation.create({
          data: {
            tenantId: customer.tenantId,
            customerId,
            title,
          },
        });

        return {
          content: [
            {
              type: "text",
              text: `Conversation created:\n${JSON.stringify(conversation, null, 2)}`,
            },
          ],
        };
      }
      case "list_conversations": {
        const customerId = args?.customerId as string;

        const conversations = await prisma.conversation.findMany({
          where: { customerId },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(conversations, null, 2),
            },
          ],
        };
      }
      case "get_chat_history": {
        const conversationId = args?.conversationId as string;

        const messages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: "asc" },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(messages, null, 2),
            },
          ],
        };
      }
      case "send_chat_message": {
        const conversationId = args?.conversationId as string;
        const content = args?.content as string;

        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { customer: true },
        });

        if (!conversation) {
          return {
            content: [{ type: "text", text: `Conversation not found for ID: ${conversationId}` }],
            isError: true,
          };
        }

        // Save AI Agent's message as user role
        const savedMessage = await prisma.message.create({
          data: {
            conversationId,
            role: "user",
            content,
            status: "sent",
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Forward user message to Reframe support via Telegram
        const clientLabel = conversation.customer.customerNumber
          ? `CLT${String(conversation.customer.customerNumber).padStart(3, "0")}`
          : "AI-AGENT";

        await forwardUserToTelegram(conversationId, content, clientLabel).catch((err) =>
          console.error("[MCP Chat] Telegram notify failed:", err.message)
        );

        // If conversation is escalated, Reframe CS AI remains silent
        if (conversation.isEscalated) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "message_sent",
                  message: savedMessage,
                  aiResponse: "Awaiting human specialist take-over (thread is escalated)",
                  escalated: true,
                }, null, 2),
              },
            ],
          };
        }

        // Run Local Rule Engine Response (CS AI replies automatically)
        const prompt = `AI: Hello\nUSER: ${content}`;
        const aiResponse = await callGemini(prompt, "Reframe CS Persona");

        const savedAiMessage = await prisma.message.create({
          data: {
            conversationId,
            role: "assistant",
            content: aiResponse.content,
            status: "sent",
            metadata: JSON.stringify(aiResponse.aiData || {}),
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "message_sent",
                message: savedMessage,
                aiResponse: savedAiMessage,
              }, null, 2),
            },
          ],
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool ${name}: ${error.message || error}`,
        },
      ],
      isError: true,
    };
  }
});

// Setup list resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "services://list",
        name: "Service Catalog",
        description: "Official photo editing services catalog and pricing specifications.",
        mimeType: "application/json",
      },
    ],
  };
});

// Handle reading resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "services://list") {
    const services = await prisma.service.findMany();
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(services, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unsupported resource URI: ${uri}`);
});

// Standalone CLI support for Stdio transport
if (require.main === module || process.argv.includes("--stdio")) {
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error("Failed to connect stdio transport:", err);
  });
}

export { server };
