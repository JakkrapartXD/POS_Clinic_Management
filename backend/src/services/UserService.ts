import { hash } from "bcrypt";
import { UserModel, UserCreateInput } from "../models/UserModel";

const userModel = new UserModel();

export class UserService {
  async createUser(userData: UserCreateInput) {
    // Check if username exists
    const existingUser = await userModel.findByUsername(userData.username);
    if (existingUser) {
      return {
        success: false,
        message: "Username already exists",
      };
    }

    // Hash password
    const hashedPassword = await hash(userData.password, 10);
    
    // Create user with default role if not specified
    const newUser = await userModel.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || "user",
    });

    return {
      success: true,
      message: "User created successfully",
      user: newUser,
    };
  }

  async updateRole(userId: string, role: string) {
    try {
      const updatedUser = await userModel.updateRole(userId, role);
      
      return {
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
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