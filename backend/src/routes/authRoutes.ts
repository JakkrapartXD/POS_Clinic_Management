import { Elysia } from "elysia";
import { authController } from "../controllers/AuthController";

export const authRoutes = new Elysia()
  .group("/auth", app => app.use(authController));