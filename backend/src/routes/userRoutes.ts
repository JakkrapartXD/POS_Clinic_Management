import { Elysia } from "elysia";
import { userController } from "../controllers/UserController";

export const userRoutes = new Elysia()
  .group("/auth", app => app.use(userController));