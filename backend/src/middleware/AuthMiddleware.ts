import { verify } from "jsonwebtoken";
import { UserModel } from "../models/UserModel";
import { 
  type CookieObject, 
  type AuthResult, 
  type PermissionResult,
  extractJwtToken 
} from "../types/auth";
import { getAuthConfig, getCookieNames } from "../config/auth";

const userModel = new UserModel();

export class AuthMiddleware {
  async verifyAuth(cookie: CookieObject): Promise<AuthResult> {
    const cookieNames = getCookieNames();
    const jwtToken = extractJwtToken(cookie, cookieNames.jwtToken);
    
    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication required",
        statusCode: 401
      };
    }
    
    try {
      const config = getAuthConfig();
      const payload = verify(jwtToken, config.jwt.secret);
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
  
  async checkAdminRights(cookie: CookieObject): Promise<PermissionResult> {
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