import { bearer } from "@elysiajs/bearer";
import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { yoga } from "@elysiajs/graphql-yoga";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";

// Import routes
import { authRoutes } from "./routes/authRoutes";
import { userRoutes } from "./routes/userRoutes";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "SN API",
          version: "0.1.0",
        },
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
    yoga({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String
        }
      `,
      resolvers: {
        Query: {
          hi: () => "Hello from Elysia",
        },
      },
    })
  )
  .use(cors())
  .use(cookie())
  .use(bearer())
  
  // Register routes
  .use(authRoutes)
  .use(userRoutes)
  
  .get("/", () => "Hello Elysia")
  .listen(4000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
