import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

// Create a single shared Prisma instance
export const prisma = new PrismaClient({
  log: ['warn', 'error'],
  errorFormat: 'minimal',
});

// Helper function to ensure connection is ready
export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.database.connected();
  } catch (error) {
    logger.database.error('Connection failed', error);
  }
}

// Graceful disconnect
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.database.disconnected();
  } catch (error) {
    logger.database.error('Disconnect failed', error);
  }
} 