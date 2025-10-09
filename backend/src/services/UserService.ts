import { hash } from "bcrypt";
import { UserModel, UserCreateInput } from "../models/UserModel";
import { SecurityService } from "../graphql/security";

const userModel = new UserModel();

export class UserService {
  constructor(private redisClient?: any) {}

  async createUser(userData: UserCreateInput, createdByUserId?: string) {
    // Check if username exists
    const existingUser = await userModel.findByUsername(userData.username);
    if (existingUser) {
      return {
        success: false,
        message: "Username already exists",
      };
    }

    // Create user with provided data (password_hash is already hashed)
    const newUser = await userModel.create({
      ...userData,
      role: userData.role || "user",
    });

    // Log security tracking for user creation
    if (createdByUserId) {
      await SecurityService.logSensitiveOperation(
        createdByUserId,
        'CREATE_USER_SERVICE',
        'User',
        newUser.id,
        { 
          createdUsername: userData.username, 
          createdEmail: userData.email, 
          createdRole: userData.role 
        },
        this.redisClient
      );
    }

    return {
      success: true,
      message: "User created successfully",
      user: newUser,
    };
  }

  async updateRole(userId: string, role: string, updatedByUserId?: string) {
    try {
      // Get current user data before update
      const currentUser = await userModel.findById(userId);
      const previousRole = currentUser?.role;
      
      const updatedUser = await userModel.updateRole(userId, role);
      
      // Log security tracking for role update
      if (updatedByUserId) {
        await SecurityService.logSensitiveOperation(
          updatedByUserId,
          'UPDATE_USER_ROLE_SERVICE',
          'User',
          userId,
          { 
            targetUserId: userId,
            previousRole,
            newRole: role
          },
          this.redisClient
        );
      }
      
      return {
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
        previousRole,
      };
    } catch (error) {
      // Check if it's a Prisma not found error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return {
          success: false,
          message: "User not found",
          statusCode: 404,
        };
      }
      
      return {
        success: false,
        message: "Failed to update user role",
        statusCode: 500,
      };
    }
  }

  async getAllUsers() {
    try {
      const users = await userModel.findAll();
      return { success: true, users };
    } catch (error) {
      return {
        success: false, 
        message: "Failed to fetch users",
        statusCode: 500,
      };
    }
  }

  async getUserRole(userId: string) {
    const user = await userModel.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: "User not found",
        statusCode: 404,
      };
    }
    
    return {
      success: true,
      role: user.role,
      isAdmin: user.role === "admin",
    };
  }
}