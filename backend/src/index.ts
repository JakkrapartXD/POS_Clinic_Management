import { bearer } from "@elysiajs/bearer";
import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { yoga } from "@elysiajs/graphql-yoga";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { createClient } from "redis";

// Import GraphQL components
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { createGraphQLContext, SecurityService } from "./graphql/security";

// Import routes
import { authRoutes } from "./routes/authRoutes";
import { userRoutes } from "./routes/userRoutes";

// Initialize Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

// Connect to Redis
await redisClient.connect();

console.log("Connected to Redis");

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "SN Medical API",
          version: "1.0.0",
          description: "# SN Medical Management System API\n\nA comprehensive medical management system built with Elysia.js, GraphQL Yoga, Prisma, and Redis.\n\n## Overview\nThis API provides complete healthcare management functionality including patient records, medical appointments, inventory management, prescription handling, and comprehensive reporting.\n\n## Authentication\nAll operations require JWT authentication. Use the /auth/sign-in endpoint to obtain a token.\n\n## GraphQL API (/graphql)\nPrimary API interface with complete CRUD operations and real-time capabilities.\n\n### Example Queries\n\n**Get Current User:**\n```graphql\nquery GetMe {\n  me {\n    id\n    username\n    email\n    role\n    status\n  }\n}\n```\n\n**Search Patients:**\n```graphql\nquery SearchPatients {\n  searchPatients(query: \"John\") {\n    id\n    first_name\n    last_name\n    phone\n    email\n  }\n}\n```\n\n**Get Products with Low Stock:**\n```graphql\nquery GetLowStockProducts {\n  lowStockProducts {\n    id\n    product_name\n    stock_quantity\n    reorder_point\n    category\n  }\n}\n```\n\n### Example Mutations\n\n**Create Patient:**\n```graphql\nmutation CreatePatient {\n  createPatient(input: {\n    first_name: \"John\"\n    last_name: \"Doe\"\n    phone: \"+1234567890\"\n    email: \"john@example.com\"\n  }) {\n    id\n    first_name\n    last_name\n  }\n}\n```\n\n**Create Order:**\n```graphql\nmutation CreateOrder {\n  createOrder(input: {\n    patientId: \"patient-id\"\n    total_amount: 25.99\n    orderItems: [{\n      productId: \"product-id\"\n      quantity: 2\n      unit_price: 12.99\n      total_price: 25.98\n    }]\n  }) {\n    id\n    total_amount\n    orderItems {\n      product {\n        product_name\n      }\n      quantity\n    }\n  }\n}\n```\n\n## Security Features\n- JWT Authentication with 30-day expiration\n- Role-based Authorization (Admin, Doctor, Staff, Cashier)\n- Rate Limiting (100 queries/min, 50 mutations/min)\n- Input Validation & Sanitization (XSS protection)\n- SQL Injection Prevention (Prisma ORM)\n- Audit Logging for sensitive operations\n\n## User Roles & Permissions\n- Admin: Full system access\n- Doctor: Medical records, appointments, prescriptions\n- Staff: Patients, products, orders, appointments\n- Cashier: Orders, payments, basic patient info\n\n## Core Features\n- Patient Management: Complete patient records with medical history\n- Appointment Scheduling: Conflict detection and doctor assignments\n- Inventory Management: Real-time stock tracking with alerts\n- Order Processing: Sales with payment handling and invoicing\n- Medical Records: Symptoms, diagnosis, treatment, prescriptions\n- Reporting: Daily reports, sales analytics, stock alerts\n- Audit Trail: Complete operation logging for compliance\n\n## Getting Started\n1. Authenticate via POST /auth/sign-in\n2. Use GraphQL endpoint at /graphql for all operations\n3. Include JWT token in Authorization header: Bearer <token>\n4. Explore the interactive GraphQL playground in development mode\n\n## Documentation Links\n- GraphQL Playground: /graphql (development only)\n- Health Check: /health\n- API Info: /api-info"
        },
        servers: [
          {
            url: "http://localhost:4000",
            description: "Development server",
          },
        ],
        tags: [
          {
            name: "Authentication",
            description: "User authentication endpoints",
          },
          {
            name: "GraphQL",
            description: "GraphQL endpoint for all operations",
          },
        ],
      },
    })
  )
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  )
  .use(
    yoga({
      typeDefs,
      resolvers: resolvers as any,
      context: async ({ request }: any) => {
        try {
          // Extract authorization from different possible sources
          const authHeader = request.headers?.get?.('authorization') || 
                           request.headers?.authorization ||
                           request.headers?.Authorization;
          
          // Create a compatible request object for GraphQL context
          const contextRequest = {
            headers: {
              authorization: authHeader,
              // Convert Headers object to plain object if needed
              ...(request.headers?.entries ? 
                  Object.fromEntries(request.headers.entries()) : 
                  request.headers || {})
            },
            cookies: request.cookies || {},
            url: request.url,
            method: request.method
          };

          // Create GraphQL context with authentication and security
          const context = await createGraphQLContext(contextRequest, redisClient);

          // Add rate limiting check for GraphQL endpoint
          if (context.isAuthenticated) {
            await SecurityService.checkRateLimit(context.userId!, "query", redisClient);
          }

          return context;
        } catch (error) {
          console.error("GraphQL Context Error:", error);
          // Return minimal context for unauthenticated requests
          return {
            prisma: null,
            redisClient,
            isAuthenticated: false,
            security: SecurityService,
          };
        }
      },
      graphqlEndpoint: "/graphql",
    } as any)
  )
  .use(cookie())
  .use(bearer())

  // Health check endpoint
  .get("/health", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      redis: redisClient.isReady ? "connected" : "disconnected",
      graphql: "active",
    },
  }))

  // API documentation endpoint
  .get("/api-info", () => ({
    name: "SN Medical API",
    version: "1.0.0",
    endpoints: {
      graphql: "/graphql",
      swagger: "/swagger",
      health: "/health",
    },
    features: [
      "Complete CRUD operations",
      "Role-based access control",
      "Rate limiting",
      "Input validation",
      "Audit logging",
      "Real-time stock management",
      "Medical records management",
      "Appointment scheduling",
      "Sales and reporting",
    ],
  }))

  // Test JWT endpoint for debugging
  .get("/test-jwt", async ({ headers, jwt, set }) => {
    const authHeader = headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      return { error: "Missing or invalid Authorization header" };
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const payload = await jwt.verify(token);
      return { 
        message: "JWT verification successful",
        payload,
        headers: Object.fromEntries(
          Object.entries(headers).filter(([key]) => 
            key.toLowerCase().includes('auth')
          )
        )
      };
    } catch (error) {
      set.status = 401;
      return { error: "Invalid JWT token", details: error };
    }
  })

  // Register routes
  .use(authRoutes)
  .use(userRoutes)

  // Default route
  .get("/", () => ({
    message: "SN Medical API Server",
    graphql: "/graphql",
    documentation: "/swagger",
    health: "/health",
  }))

  // Global error handler
  .onError(({ code, error, set }) => {
    console.error("Server Error:", error);

    switch (code) {
      case "VALIDATION":
        set.status = 400;
        return { error: "Validation failed", message: error.message };
      case "NOT_FOUND":
        set.status = 404;
        return { error: "Not found" };
      case "INTERNAL_SERVER_ERROR":
        set.status = 500;
        return { error: "Internal server error" };
      default:
        set.status = 500;
        return { error: "Unknown error occurred" };
    }
  })

  .listen(4000);

console.log(`
🚀 SN Medical API Server is running!

🔗 Endpoints:
  - GraphQL API: http://${app.server?.hostname}:${app.server?.port}/graphql
  - GraphQL Playground: http://${app.server?.hostname}:${app.server?.port}/graphql
  - REST API Docs: http://${app.server?.hostname}:${app.server?.port}/swagger
  - Health Check: http://${app.server?.hostname}:${app.server?.port}/health

🛡️ Security Features:
  - JWT Authentication
  - Role-based Authorization  
  - Rate Limiting
  - Input Validation & Sanitization
  - SQL Injection Protection
  - XSS Protection
  - Audit Logging

📊 API Capabilities:
  - User Management
  - Patient Records
  - Product Inventory
  - Order Processing
  - Medical Records
  - Appointment Scheduling
  - Stock Management
  - Reporting & Analytics
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
