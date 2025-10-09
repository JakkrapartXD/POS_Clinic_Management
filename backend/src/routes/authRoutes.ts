import { Elysia } from "elysia";
import { authController } from "../controllers/AuthController";

export const AuthRoutes = (redisClient?: any) => new Elysia()
  .group("/auth", app => app.use(authController(app, redisClient)));