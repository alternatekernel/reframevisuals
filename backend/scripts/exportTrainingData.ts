import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Reframe LLM Training Exporter
 * This script exports high-quality user-assistant interactions from the database
 * and formats them into a JSONL dataset (OpenAI / Llama-3 format) for fine-tuning.
 */
async function exportTrainingData() {
  console.log('🚀 Starting Reframe LLM Dataset Extraction...');

  try {
    // 1. Fetch conversations with their messages, ordered chronologically
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const dataset: any[] = [];

    // 2. Format conversations into ChatML / OpenAI JSONL format
    conversations.forEach(conv => {
      // We only want conversations that have actual interaction
      if (conv.messages.length >= 2) {
        const messagesLine = [
          {
            role: "system",
            content: "You are Reframe CS, a premium Creative Success Partner acting as a concierge for an elite photo editing platform. Use 'Anti-Gravity' concise communication. Always output strict JSON containing 'content' and optional 'agentCall' or 'aiData'."
          }
        ];

        let isValid = true;

        conv.messages.forEach(msg => {
          let content = msg.content;
          
          // STRICT FILTERING: Reject bad test data
          if (msg.role === 'assistant') {
             // 1. Filter out API Key errors and Fallback 429 errors
             if (msg.content.includes('[SYSTEM ERROR]') || msg.content.includes('[FALLBACK]')) {
               isValid = false;
               return;
             }
             // 2. Filter out empty responses
             if (!msg.content || msg.content.trim() === '') {
               isValid = false;
               return;
             }

             try {
                // Parse metadata if exists
                const metadata = msg.metadata ? JSON.parse(msg.metadata) : {};
                const assistantPayload = {
                  content: msg.content,
                  ...(Object.keys(metadata).length > 0 ? { aiData: metadata } : {})
                };
                content = JSON.stringify(assistantPayload);
             } catch(e) {
                // If metadata parsing fails, skip this conversation to keep dataset clean
                isValid = false; 
             }
          }

          messagesLine.push({
            role: msg.role, // 'user' or 'assistant'
            content: content
          });
        });

        // Final check: ensure the last message was actually from the assistant
        if (messagesLine.length > 0 && messagesLine[messagesLine.length - 1].role === 'user') {
           isValid = false; // Cuts off abruptly
        }

        if (isValid) {
          dataset.push({ messages: messagesLine });
        }
      }
    });

    if (dataset.length === 0) {
      console.log('⚠️ No valid conversations found to export.');
      return;
    }

    // 3. Write to a JSONL file
    const exportPath = path.join(__dirname, '../../reframe_training_dataset.jsonl');
    const jsonlContent = dataset.map(d => JSON.stringify(d)).join('\n');
    
    fs.writeFileSync(exportPath, jsonlContent, 'utf-8');

    console.log(`✅ Successfully exported ${dataset.length} training examples to:`);
    console.log(`📁 ${exportPath}`);
    console.log('\n🧠 Next Steps for Fine-Tuning:');
    console.log('1. Review the JSONL file to ensure the data represents "perfect" assistant behavior.');
    console.log('2. Upload this file to your training platform (Together AI, Replicate, or Vertex AI).');
    console.log('3. Select your base model (e.g., Llama-3-8B-Instruct).');
    console.log('4. Run the LoRA fine-tuning job.');

  } catch (error) {
    console.error('❌ Failed to export training data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportTrainingData();
