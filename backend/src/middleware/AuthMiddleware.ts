import { verify } from "jsonwebtoken";
import { UserModel } from "../models/UserModel";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const userModel = new UserModel();

export class AuthMiddleware {
  async verifyAuth(cookie: any) {
    const jwtToken = cookie["next-auth.jwt-token"]?.value;
    
    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication required",
        statusCode: 401
      };
    }
    
    try {
      const payload = verify(jwtToken, JWT_SECRET);
      const userId = typeof payload === "object" && payload !== null ? payload.sub : null;
      
      if (!userId) {
        return {
          success: false,
          message: "Invalid authentication",
          statusCode: 401
        };
      }
      
      return {
        success: true,
        userId
      };
    } catch (error) {
      return {
        success: false,
        message: "Invalid or expired token",
        statusCode: 401
      };
    }
  }
  
  async checkAdminRights(cookie: any) {
    // First verify the user is authenticated
    const authResult = await this.verifyAuth(cookie);
    if (!authResult.success) {
      return authResult;
    }
    
    // Then check if they have admin privileges
    if (!authResult.userId) {
      return {
        success: false,
        message: "Invalid user ID",
        statusCode: 401
      };
    }
    
    const isAdmin = await userModel.isAdmin(authResult.userId);
    
    if (!isAdmin) {
      return {
        success: false,
        message: "Admin privileges required",
        statusCode: 403
      };
    }
    
    return {
      success: true,
      userId: authResult.userId
    };
  }
}