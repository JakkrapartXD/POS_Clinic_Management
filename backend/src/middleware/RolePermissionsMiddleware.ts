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

// Role-based permissions matching frontend configuration
export const ROLE_PERMISSIONS = {
  admin: {
    allowedEndpoints: [
      'notifications',
      'pos', 
      'inventory',
      'patients',
      'visits',
      'queue',
      'queue/triage',
      'queue/doctor',
      'queue/cashier',
      'documents',
      'users',
      'orders',
      'reports',
      'settings',
      'admin',
      'admin/users'
    ]
  },
  cashier: {
    allowedEndpoints: [
      'notifications',
      'pos',
      'inventory',
      'queue/cashier',
      'orders'
    ]
  },
  pharmacist: {
    allowedEndpoints: [
      'notifications',
      'pos',
      'inventory'
    ]
  },
  doctor: {
    allowedEndpoints: [
      'notifications',
      'pos',
      'inventory',
      'patients',
      'visits',
      'queue/doctor',
      'documents',
      'users'
    ]
  },
  staff: {
    allowedEndpoints: [
      'notifications',
      'patients',
      'visits',
      'queue',
      'queue/triage',
      'queue/doctor',
      'orders',
      'reports'
    ]
  },
  nurse: {
    allowedEndpoints: [
      'notifications',
      'patients',
      'queue/triage'
    ]
  }
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;

export class RolePermissionsMiddleware {
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

  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const user = await userModel.findById(userId);
      if (!user || !user.role) {
        return null;
      }
      return user.role as UserRole;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  async checkEndpointPermission(cookie: CookieObject, endpoint: string): Promise<PermissionResult> {
    // First verify the user is authenticated
    const authResult = await this.verifyAuth(cookie);
    if (!authResult.success) {
      return authResult;
    }
    
    if (!authResult.userId) {
      return {
        success: false,
        message: "Invalid user ID",
        statusCode: 401
      };
    }
    
    // Get user role
    const userRole = await this.getUserRole(authResult.userId);
    if (!userRole) {
      return {
        success: false,
        message: "Unable to determine user role",
        statusCode: 403
      };
    }
    
    // Check if user has permission for this endpoint
    const userPermissions = ROLE_PERMISSIONS[userRole];
    if (!userPermissions.allowedEndpoints.includes(endpoint as any)) {
      return {
        success: false,
        message: `Access denied. Role '${userRole}' does not have permission to access '${endpoint}'`,
        statusCode: 403
      };
    }
    
    return {
      success: true,
      userId: authResult.userId,
      role: userRole
    };
  }

  // Specific permission checks for queue endpoints
  async checkQueuePermission(cookie: CookieObject, station: string): Promise<PermissionResult> {
    const endpoint = `queue/${station}`;
    return await this.checkEndpointPermission(cookie, endpoint);
  }

  // Check if user can access any queue endpoint
  async checkAnyQueuePermission(cookie: CookieObject): Promise<PermissionResult> {
    const authResult = await this.verifyAuth(cookie);
    if (!authResult.success) {
      return authResult;
    }
    
    if (!authResult.userId) {
      return {
        success: false,
        message: "Invalid user ID",
        statusCode: 401
      };
    }
    
    const userRole = await this.getUserRole(authResult.userId);
    if (!userRole) {
      return {
        success: false,
        message: "Unable to determine user role",
        statusCode: 403
      };
    }
    
    const userPermissions = ROLE_PERMISSIONS[userRole];
    const hasQueueAccess = userPermissions.allowedEndpoints.some((endpoint: string) => 
      endpoint.startsWith('queue/') || endpoint === 'queue'
    );
    
    if (!hasQueueAccess) {
      return {
        success: false,
        message: `Access denied. Role '${userRole}' does not have queue access`,
        statusCode: 403
      };
    }
    
    return {
      success: true,
      userId: authResult.userId,
      role: userRole
    };
  }

  // Check admin rights (for user management, etc.)
  async checkAdminRights(cookie: CookieObject): Promise<PermissionResult> {
    const authResult = await this.verifyAuth(cookie);
    if (!authResult.success) {
      return authResult;
    }
    
    if (!authResult.userId) {
      return {
        success: false,
        message: "Invalid user ID",
        statusCode: 401
      };
    }
    
    const userRole = await this.getUserRole(authResult.userId);
    if (userRole !== 'admin') {
      return {
        success: false,
        message: "Admin privileges required",
        statusCode: 403
      };
    }
    
    return {
      success: true,
      userId: authResult.userId,
      role: userRole
    };
  }
}
