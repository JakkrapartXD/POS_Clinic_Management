import { PrismaClient } from "@prisma/client";

// Create a single shared Prisma instance
export const prisma = new PrismaClient({
  log: ['warn', 'error'],
  errorFormat: 'minimal',
});

// Helper function to ensure connection is ready
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

// Graceful disconnect
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log("Database disconnected successfully");
  } catch (error) {
    console.error("Error disconnecting database:", error);
  }
} 