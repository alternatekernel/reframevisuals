import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "../services/mcp/mcpServer";

const router = express.Router();

let transport: SSEServerTransport | null = null;

const checkAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const secretKey = process.env.MCP_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('MCP auth is not configured. Allowing access outside production.');
      return next();
    }
    console.error('MCP auth is not configured in production. Blocking access.');
    return res.status(401).send("MCP Authentication is not configured on this server");
  }

  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader ? authHeader.replace("Bearer ", "").trim() : null;
  const tokenFromQuery = req.query.token as string;
  const providedToken = tokenFromHeader || tokenFromQuery;

  if (!providedToken || providedToken !== secretKey) {
    return res.status(401).send("Invalid or missing MCP token");
  }

  next();
};

// SSE route: client connects here to start the stream
router.get("/sse", checkAuth, async (req, res) => {
  console.log("MCP Client connecting over SSE...");
  transport = new SSEServerTransport("/api/mcp/message", res);
  
  try {
    await server.connect(transport);
    console.log("MCP Server connected to SSE transport.");
  } catch (error) {
    console.error("Failed to connect MCP server to SSE transport:", error);
    res.status(500).end();
    return;
  }

  req.on("close", () => {
    console.log("MCP Client disconnected from SSE.");
    transport = null;
  });
});

// Message route: client sends JSON-RPC messages here via POST
router.post("/message", checkAuth, async (req, res) => {
  if (transport) {
    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error("Error handling MCP post message:", error);
      res.status(500).end();
    }
  } else {
    res.status(400).send("No active SSE session");
  }
});

export default router;
