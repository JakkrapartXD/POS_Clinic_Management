import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => ({ message: "Hello from test server!" }))
  .get("/health", () => ({ status: "healthy", timestamp: new Date().toISOString() }))
  .listen({
    hostname: "0.0.0.0",
    port: 4000,
  });

console.log("🚀 Test server running on http://0.0.0.0:4000"); 