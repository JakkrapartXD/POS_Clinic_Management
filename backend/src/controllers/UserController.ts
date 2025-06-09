import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { hash } from "bcrypt";
import { UserService } from "../services/UserService";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const userService = new UserService();
const authMiddleware = new AuthMiddleware();

// Validation schemas
const userCreateModel = t.Object({
  username: t.String(),
  password: t.String({ minLength: 8 }),
  email: t.String({ format: 'email' }),
  name: t.Optional(t.String()),
  role: t.Optional(t.String()),
});

const roleModel = t.Object({
  userId: t.String(),
  role: t.String(),
});

export const userController = (app: Elysia) =>
  app
    .use(cookie())
    .post(
      "/users",
      async ({ set, cookie, body }) => {
        // Admin authentication check
        const adminCheck = await authMiddleware.checkAdminRights(cookie);
        if (!adminCheck.success) {
          set.status = adminCheck.statusCode;
          return { success: false, message: adminCheck.message };
        }
        
        // Hash password before creating user
        const hashedPassword = await hash(body.password, 10);
        
        // Create user with proper data structure
        const result = await userService.createUser({
          username: body.username,
          password_hash: hashedPassword,
          email: body.email,
          name: body.name,
          role: body.role,
        });
        
        if (!result.success) {
          set.status = 409; // Conflict for duplicate username
          return result;
        }
        
        return result;
      },
      {
        body: userCreateModel,
      }
    )
    .put(
      "/users/role",
      async ({ set, cookie, body }) => {
        // Admin authentication check
        const adminCheck = await authMiddleware.checkAdminRights(cookie);
        if (!adminCheck.success) {
          set.status = adminCheck.statusCode;
          return { success: false, message: adminCheck.message };
        }
        
        // Update user role
        const result = await userService.updateRole(body.userId, body.role);
        
        if (!result.success) {
          set.status = result.statusCode || 500;
          return { success: false, message: result.message };
        }
        
        return result;
      },
      {
        body: roleModel,
      }
    )
    .get("/users", async ({ set, cookie }) => {
      // Admin authentication check
      const adminCheck = await authMiddleware.checkAdminRights(cookie);
      if (!adminCheck.success) {
        set.status = adminCheck.statusCode;
        return { success: false, message: adminCheck.message };
      }
      
      // Get all users
      return await userService.getAllUsers();
    })
    .get("/me/role", async ({ set, cookie }) => {
      // User authentication check
      const authCheck = await authMiddleware.verifyAuth(cookie);
      if (!authCheck.success) {
        set.status = authCheck.statusCode;
        return { success: false, message: authCheck.message };
      }
      
      if (!authCheck.userId) {
        set.status = 401;
        return { success: false, message: "User ID not found in authentication" };
      }
      
      // Get user role
      const result = await userService.getUserRole(authCheck.userId);
      
      if (!result.success) {
        set.status = result.statusCode || 500;
        return { success: false, message: result.message };
      }
      
      return result;
    });