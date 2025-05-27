import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

const app = new Elysia()
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
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
