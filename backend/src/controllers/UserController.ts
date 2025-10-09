import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { hash } from "bcrypt";
import { UserService } from "../services/UserService";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { RolePermissionsMiddleware } from "../middleware/RolePermissionsMiddleware";
import { SecurityService } from "../graphql/security";

const authMiddleware = new AuthMiddleware();
const rolePermissions = new RolePermissionsMiddleware();

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

export const userController = (redisClient?: any) => {
  const userService = new UserService(redisClient);
  
  return new Elysia()
    .use(cookie())
    .post(
      "/users",
      async ({ set, cookie, body }) => {
        // Admin authentication check
        const adminCheck = await rolePermissions.checkAdminRights(cookie as any);
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
        }, adminCheck.userId);
        
        if (!result.success) {
          set.status = 409; // Conflict for duplicate username
          return result;
        }
        
        // Log security tracking for user creation
        if (result.success && result.user) {
          await SecurityService.logSensitiveOperation(
            adminCheck.userId!,
            'CREATE_USER_REST',
            'User',
            result.user.id,
            { 
              createdUsername: body.username, 
              createdEmail: body.email, 
              createdRole: body.role 
            },
            redisClient
          );
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
        const adminCheck = await rolePermissions.checkAdminRights(cookie as any);
        if (!adminCheck.success) {
          set.status = adminCheck.statusCode;
          return { success: false, message: adminCheck.message };
        }
        
        // Update user role
        const result = await userService.updateRole(body.userId, body.role, adminCheck.userId);
        
        if (!result.success) {
          set.status = result.statusCode || 500;
          return { success: false, message: result.message };
        }
        
        // Log security tracking for role update
        await SecurityService.logSensitiveOperation(
          adminCheck.userId!,
          'UPDATE_USER_ROLE_REST',
          'User',
          body.userId,
          { 
            targetUserId: body.userId, 
            newRole: body.role,
            previousRole: result.previousRole 
          },
          redisClient
        );
        
        return result;
      },
      {
        body: roleModel,
      }
    )
    .get("/users", async ({ set, cookie }) => {
      // Admin authentication check
      const adminCheck = await authMiddleware.checkAdminRights(cookie as any);
      if (!adminCheck.success) {
        set.status = adminCheck.statusCode;
        return { success: false, message: adminCheck.message };
      }
      
      // Get all users
      return await userService.getAllUsers();
    })
    .get("/me/role", async ({ set, cookie }) => {
      // User authentication check
      const authCheck = await rolePermissions.verifyAuth(cookie as any);
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
};