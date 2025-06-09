import { Elysia } from "elysia";
import { authController } from "../controllers/AuthController";

export const AuthRoutes = new Elysia()
  .group("/auth", app => app.use(authController));

// export const createAuthRoutes = (redisClient?: any) => 
//   authController(new Elysia(), redisClient);