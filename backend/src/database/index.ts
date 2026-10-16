import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables before Prisma client initialization to avoid hoisting issues
const envPath = fs.existsSync(path.resolve(__dirname, '../../.env.production'))
  ? path.resolve(__dirname, '../../.env.production')
  : path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Optimize connection pool size based on runtime.
// On serverless (Vercel), each container should keep a small pool (default 5) to avoid exhausting Supabase.
// In standalone server mode (Docker/VPS), allow a larger pool (default 25).
const rawUrl = process.env.DATABASE_URL || '';
const defaultLimit = process.env.VERCEL ? '5' : '25';
const pooledUrl = rawUrl && !rawUrl.includes('connection_limit')
  ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}connection_limit=${defaultLimit}`
  : rawUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: pooledUrl
      }
    }
  });

// Always store on globalThis so serverless warm execution reuses the connection
globalForPrisma.prisma = prisma;

export default prisma;
