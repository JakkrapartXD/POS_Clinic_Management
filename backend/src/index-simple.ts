import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createClient } from "redis";

console.log("Starting simplified server...");

// Initialize Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

// Connect to Redis
console.log("Connecting to Redis...");
await redisClient.connect();
console.log("Connected to Redis");

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  )
  // Health check endpoint
  .get("/health", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      redis: redisClient.isReady ? "connected" : "disconnected",
      graphql: "active",
    },
  }))
  
  // Default route
  .get("/", () => ({
    message: "Simplified SN Medical API Server",
    health: "/health",
  }))

  .listen({
    hostname: "0.0.0.0",
    port: 4000,
  });

console.log(`
🚀 Simplified SN Medical API Server is running!

🔗 Endpoints:
  - Health Check: http://0.0.0.0:4000/health
  - Root: http://0.0.0.0:4000/
`);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  try {
    await redisClient.quit();
    console.log("✅ Redis connection closed");
  } catch (error) {
    console.error("❌ Error closing Redis connection:", error);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  try {
    await redisClient.quit();
    console.log("✅ Redis connection closed");
  } catch (error) {
    console.error("❌ Error closing Redis connection:", error);
  }
  process.exit(0);
}); 