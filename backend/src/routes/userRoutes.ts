import { Elysia } from "elysia";
import { userController } from "../controllers/UserController";

// Change from '/auth' to '/users' for better separation of concerns
export const userRoutes = new Elysia()
  .group("/users", app => app.use(userController));