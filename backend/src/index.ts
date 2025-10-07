import { bearer } from "@elysiajs/bearer";
import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { yoga } from "@elysiajs/graphql-yoga";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { staticPlugin } from "@elysiajs/static";
import { createClient } from "redis";

// Import GraphQL components
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { createGraphQLContext, SecurityService } from "./graphql/security";

// Import routes
import { AuthRoutes } from "./routes/authRoutes";
import { userRoutes } from "./routes/userRoutes";
import { uploadRoutes } from "./routes/uploadRoutes";
import { backupRoutes, oauthRoutes } from "./routes/backupRoutes";
import { clinicRoutes } from "./routes/clinicRoutes";

// Import logger
import { logger } from "./lib/logger";

// Initialize Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379",
});

redisClient.on("error", (err) => {
  logger.redis.error('Redis client error', err);
});

// Connect to Redis
await redisClient.connect();

logger.redis.connected();

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
      origin: [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        process.env.FRONTEND_URL || "http://localhost:3000"
      ].filter(Boolean),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Content-Type", 
        "Authorization", 
        "Cookie",
        "X-Requested-With",
        "Accept",
        "Origin"
      ],
      exposeHeaders: ["Content-Length", "X-Request-Id"],
      maxAge: 86400, // 24 hours
    })
  )
  // Add explicit OPTIONS handler for GraphQL endpoint
  .options("/graphql", ({ set }) => {
    set.headers = {
      "Access-Control-Allow-Origin": "http://localhost:3000",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie, X-Requested-With, Accept, Origin",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400"
    };
    return "";
  })
  .use(
    yoga({
      typeDefs,
      resolvers: resolvers as any,
      context: async ({ request, ...elysiaCtx }: any) => {
        try {
          // Extract authorization from different possible sources
          const authHeader = request.headers?.get?.('authorization') || 
                           request.headers?.authorization ||
                           request.headers?.Authorization;

          // Extract cookies from request headers
          const cookieHeader = request.headers?.get?.('cookie') || 
                              request.headers?.cookie ||
                              request.headers?.Cookie || '';
          
          // Parse cookies from header string
          const parsedCookies: Record<string, string> = {};
          if (cookieHeader) {
            cookieHeader.split(';').forEach((cookie: string) => {
              const [name, ...rest] = cookie.trim().split('=');
              if (name && rest.length > 0) {
                parsedCookies[name] = rest.join('=');
              }
            });
          }
          
          // Try to also get from Elysia context as fallback
          const elysiaContextCookies = elysiaCtx.cookie || {};
          
          // Debug: Log cookies information
          console.log('=== GraphQL Context Debug ===');
          console.log('Cookie header:', cookieHeader);
          console.log('Parsed cookies:', parsedCookies);
          console.log('Elysia context cookie:', elysiaContextCookies);
          console.log('JWT token from parsed:', parsedCookies['next-auth.jwt-token']);
          console.log('JWT token from Elysia:', elysiaContextCookies['next-auth.jwt-token']?.value || elysiaContextCookies['next-auth.jwt-token']);
          console.log('================================');
          
          // Create a compatible request object for GraphQL context
          const contextRequest = {
            headers: {
              authorization: authHeader,
              // Convert Headers object to plain object if needed
              ...(request.headers?.entries ? 
                  Object.fromEntries(request.headers.entries()) : 
                  request.headers || {})
            },
            cookies: {
              'next-auth.jwt-token': parsedCookies['next-auth.jwt-token'] || 
                                   elysiaContextCookies['next-auth.jwt-token']?.value || 
                                   elysiaContextCookies['next-auth.jwt-token'],
              'next-auth.session-token': parsedCookies['next-auth.session-token'] || 
                                       elysiaContextCookies['next-auth.session-token']?.value || 
                                       elysiaContextCookies['next-auth.session-token'],
            },
            url: request.url,
            method: request.method
          };

          // Create GraphQL context with authentication and security
          const graphqlContext = await createGraphQLContext(contextRequest, redisClient);

          // Add rate limiting check for GraphQL endpoint
          if (graphqlContext.isAuthenticated) {
            await SecurityService.checkRateLimit(graphqlContext.userId!, "query", redisClient);
          }

          return graphqlContext;
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
  
  
  // Static file serving for uploads
  .use(staticPlugin({
    assets: "public/uploads",
    prefix: "/uploads"
  }))

  // Health check endpoint
  .get("/health", async () => {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        redis: redisClient.isReady ? "connected" : "disconnected",
        graphql: "active",
        database: "unknown"
      },
    };

    // Try to check database connectivity
    try {
      const { PrismaClient } = require("@prisma/client");
      const testPrisma = new PrismaClient();
      await testPrisma.$queryRaw`SELECT 1`;
      health.services.database = "connected";
      await testPrisma.$disconnect();
    } catch (error) {
      console.error('Database health check failed:', error);
      health.services.database = "disconnected";
      health.status = "degraded";
    }

    return health;
  })

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
  .get("/test-jwt", async ({ headers, jwt, set }: { headers: any; jwt: any; set: any }) => {
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
  .use(AuthRoutes)
  .use(userRoutes(redisClient))
  .use(uploadRoutes(redisClient))
  .use(oauthRoutes)
  .use(backupRoutes(redisClient))
  .use(clinicRoutes(redisClient))

  // Default route
  .get("/", () => ({
    message: "SN Medical API Server",
    graphql: "/graphql",
    documentation: "/swagger",
    health: "/health",
  }))

  // Global error handler
  .onError(({ code, error, set }: { code: any; error: any; set: any }) => {
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

  .listen({
    hostname: "0.0.0.0",
    port: 4000,
  });

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
