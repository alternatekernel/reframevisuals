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

// Ensure the connection pool is large enough for concurrent users.
// Default Prisma pool is 5 — far too small for production. Append
// connection_limit if the DATABASE_URL doesn't already set one.
const rawUrl = process.env.DATABASE_URL || '';
const pooledUrl = rawUrl && !rawUrl.includes('connection_limit')
  ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}connection_limit=25`
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

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
