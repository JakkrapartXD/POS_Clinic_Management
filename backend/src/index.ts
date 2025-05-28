import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { yoga } from "@elysiajs/graphql-yoga";
import { jwt } from "@elysiajs/jwt";
import { staticPlugin } from "@elysiajs/static";
import { cookie } from "@elysiajs/cookie";
import auth from "./auth";

const app = new Elysia()
  .use(auth)
  .use(cookie())
  .use(auth)
  .use(staticPlugin())
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
  .use(bearer())
  .use(
    swagger({
      documentation: {
        info: {
          title: "SN API Doc",
          version: "0.1.0",
        },
      },
    })
  )
  .get("/", () => "Hello Elysia")
  .get("/hello/:name", ({ params }) => `Hello ${params.name}`)
  .listen(4000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
