import { GraphQLError } from "graphql";
import { verify } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Rate limiting configuration
const RATE_LIMITS = {
  query: { max: 100, window: 60 * 1000 }, // 100 queries per minute
  mutation: { max: 50, window: 60 * 1000 }, // 50 mutations per minute
  sensitive: { max: 10, window: 60 * 1000 }, // 10 sensitive operations per minute
};

export interface AuthContext {
  userId?: string;
  user?: any;
  isAuthenticated: boolean;
  role?: string;
}

export class SecurityService {
  // Authentication & Authorization
  static async authenticate(context: any): Promise<AuthContext> {
    let token: string | undefined;

    // Try to extract token from multiple sources
    if (context.request) {
      // From Authorization header (Bearer token)
      const authHeader = context.request.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      } 
      // From cookies
      else if (context.request.cookies?.['next-auth.jwt-token']) {
        token = context.request.cookies['next-auth.jwt-token'];
      }
    }

    if (!token) {
      return { isAuthenticated: false };
    }

    try {
      // Verify JWT token
      const payload = verify(token, JWT_SECRET) as any;
      const userId = payload.sub || payload.userId || payload.id;

      if (!userId) {
        console.log('JWT payload missing user ID:', payload);
        return { isAuthenticated: false };
      }

      // Get user from database with role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true
        }
      });

      if (!user || user.status !== 'active') {
        console.log('User not found or inactive:', { userId, user });
        return { isAuthenticated: false };
      }

      return {
        userId: user.id,
        user,
        isAuthenticated: true,
        role: user.role
      };
    } catch (error) {
      console.error('JWT verification failed:', error);
      return { isAuthenticated: false };
    }
  }

  // Role-based authorization
  static requireAuth(context: any) {
    if (!context.isAuthenticated) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    }
  }

  static requireRole(context: any, allowedRoles: string[]) {
    this.requireAuth(context);
    
    if (!allowedRoles.includes(context.role)) {
      throw new GraphQLError('Insufficient permissions', {
        extensions: { code: 'FORBIDDEN' }
      });
    }
  }

  static requireAdmin(context: any) {
    this.requireRole(context, ['admin']);
  }

  static requireDoctor(context: any) {
    this.requireRole(context, ['admin', 'doctor']);
  }

  static requireStaff(context: any) {
    this.requireRole(context, ['admin', 'doctor', 'cashier', 'staff']);
  }

  // Rate limiting - now accepts redisClient as parameter
  static async checkRateLimit(
    key: string, 
    type: 'query' | 'mutation' | 'sensitive' = 'query',
    redisClient?: any
  ): Promise<void> {
    const limit = RATE_LIMITS[type];
    const redisKey = `rate_limit:${type}:${key}`;
    
    // Skip rate limiting if no Redis client is available
    if (!redisClient || !redisClient.isReady) {
      console.warn('Redis client not available, skipping rate limiting');
      return;
    }
    
    try {
      const current = await redisClient.incr(redisKey);
      
      if (current === 1) {
        await redisClient.expire(redisKey, Math.floor(limit.window / 1000));
      }
      
      if (current > limit.max) {
        throw new GraphQLError('Rate limit exceeded', {
          extensions: { 
            code: 'RATE_LIMITED',
            retryAfter: Math.floor(limit.window / 1000)
          }
        });
      }
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      // Log error but don't block request if Redis is down
      console.error('Rate limiting error:', error);
    }
  }

  // Input validation and sanitization
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[0-9\-\(\)\s]{10,15}$/;
    return phoneRegex.test(phone);
  }

  static sanitizeString(input: string): string {
    if (!input) return '';
    
    // Remove potential XSS characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  static validatePagination(pagination: any) {
    if (pagination) {
      if (pagination.take && (pagination.take < 1 || pagination.take > 100)) {
        throw new GraphQLError('Invalid pagination: take must be between 1 and 100');
      }
      if (pagination.skip && pagination.skip < 0) {
        throw new GraphQLError('Invalid pagination: skip must be non-negative');
      }
    }
  }

  // SQL Injection prevention (Prisma handles this, but extra validation)
  static validateId(id: string): string {
    if (!id || typeof id !== 'string') {
      throw new GraphQLError('Invalid ID format');
    }
    
    // CUID validation
    const cuidRegex = /^[a-z0-9]{25}$/;
    if (!cuidRegex.test(id)) {
      throw new GraphQLError('Invalid ID format');
    }
    
    return id;
  }

  // Business logic validation
  static async validateProductStock(productId: string, requestedQuantity: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock_quantity: true, product_name: true }
    });

    if (!product) {
      throw new GraphQLError('Product not found');
    }

    if (product.stock_quantity < requestedQuantity) {
      throw new GraphQLError(
        `Insufficient stock for ${product.product_name}. Available: ${product.stock_quantity}, Requested: ${requestedQuantity}`
      );
    }
  }

  static async validateDoctorPermission(userId: string, doctorId: string) {
    // Allow if user is the doctor or an admin
    if (userId === doctorId) return;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      throw new GraphQLError('Access denied: Can only access own records or admin required');
    }
  }

  // Audit logging - now accepts redisClient as parameter
  static async logSensitiveOperation(
    userId: string,
    operation: string,
    entityType: string,
    entityId: string,
    details?: any,
    redisClient?: any
  ) {
    try {
      // Log to audit table (you may want to create this table)
      console.log('AUDIT LOG:', {
        userId,
        operation,
        entityType,
        entityId,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Store in Redis for recent activity tracking if Redis client is available
      if (redisClient && redisClient.isReady) {
        const auditKey = `audit:${userId}:${Date.now()}`;
        // Use setEx instead of setex for Redis v5 compatibility
        await redisClient.setEx(auditKey, 24 * 60 * 60, JSON.stringify({
          operation,
          entityType,
          entityId,
          details,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Data exposure control
  static filterSensitiveUserData(user: any) {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  // Query complexity analysis (basic)
  static validateQueryComplexity(query: string) {
    const maxDepth = 10;
    const maxSelections = 50;
    
    const depth = (query.match(/\{/g) || []).length;
    const selections = (query.match(/\w+(?=\s*[:{])/g) || []).length;
    
    if (depth > maxDepth) {
      throw new GraphQLError('Query too complex: maximum depth exceeded');
    }
    
    if (selections > maxSelections) {
      throw new GraphQLError('Query too complex: too many selections');
    }
  }

  // Check if user can access patient data
  static async validatePatientAccess(userId: string, patientId: string, role: string) {
    // Admins can access all patient data
    if (role === 'admin') return;
    
    // Doctors can access patients they have appointments with
    if (role === 'doctor') {
      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: patientId,
          doctorId: userId
        }
      });
      
      if (hasAppointment) return;
    }
    
    // Staff can access all patients for basic operations
    if (['staff', 'cashier'].includes(role)) return;
    
    throw new GraphQLError('Access denied: Insufficient permissions to access patient data');
  }
}

// Custom scalar resolvers for security
export const customScalars = {
  DateTime: {
    serialize: (value: any) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        return new Date(value).toISOString();
      }
      throw new GraphQLError('Invalid DateTime format');
    },
    parseValue: (value: any) => {
      if (typeof value !== 'string') {
        throw new GraphQLError('DateTime must be a string');
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError('Invalid DateTime format');
      }
      return date;
    },
    parseLiteral: (ast: any) => {
      if (ast.kind !== 'StringValue') {
        throw new GraphQLError('DateTime must be a string');
      }
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError('Invalid DateTime format');
      }
      return date;
    }
  }
};

// Context creator with security
export async function createGraphQLContext(request: any, redisClient?: any) {
  const auth = await SecurityService.authenticate({ request });
  
  return {
    prisma,
    redisClient,
    ...auth,
    request,
    security: SecurityService
  };
} 