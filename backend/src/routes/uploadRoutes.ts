import { Elysia } from "elysia";
import { uploadService } from "../middleware/upload";
import { jwt } from "@elysiajs/jwt";
import { SecurityService } from "../graphql/security";

export const uploadRoutes = (redisClient?: any) => new Elysia({ prefix: "/upload" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  
  // Upload image endpoint
  .post("/image/:category", async ({ body, params, headers, set, jwt, cookie }) => {
    try {
      // Check authorization - support both Bearer token and cookie
      let token = null;
      
      // Try Bearer token first
      const authHeader = headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
      // Try cookie if no Bearer token
      else if (cookie && cookie['next-auth.jwt-token']) {
        const cookieToken = cookie['next-auth.jwt-token'];
        token = typeof cookieToken === 'string' ? cookieToken : cookieToken.value;
      }
      
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized - Missing or invalid authorization" };
      }

      // Verify JWT token
      let payload: any = null;
      try {
        payload = await jwt.verify(token);
        if (!payload) {
          set.status = 401;
          return { error: "Unauthorized - Invalid token" };
        }
      } catch (error) {
        set.status = 401;
        return { error: "Unauthorized - Token verification failed" };
      }

      const { category } = params;
      
      // Validate category
      if (!uploadService.validateCategory(category)) {
        set.status = 400;
        return { error: "Invalid category. Allowed: users, patients, products" };
      }

      // Elysia.js parses FormData as plain object, so we need to handle it differently
      const file = (body as any)?.file as File;
      if (!file) {
        set.status = 400;
        return { error: "No file provided in 'file' field" };
      }

      // Validate file
      if (file.size === 0) {
        set.status = 400;
        return { error: "File is empty" };
      }

      const result = await uploadService.saveFile(file, category);
      
      // Log security tracking for file upload
      await SecurityService.logSensitiveOperation(
        payload.sub,
        'UPLOAD_FILE',
        'File',
        result.filename,
        { 
          category, 
          fileSize: file.size, 
          contentType: file.type,
          originalName: file.name 
        },
        redisClient
      );
      
      return {
        success: true,
        data: result,
        message: `File uploaded successfully to ${category}`
      };
      
    } catch (error) {
      console.error('Upload error:', error);
      set.status = 400;
      return { 
        error: error instanceof Error ? error.message : "Upload failed",
        success: false
      };
    }
  })

  // Delete image endpoint
  .delete("/image/:category/:filename", async ({ params, headers, set, jwt, cookie }) => {
    try {
      // Check authorization - support both Bearer token and cookie
      let token = null;
      
      // Try Bearer token first
      const authHeader = headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
      // Try cookie if no Bearer token
      else if (cookie && cookie['next-auth.jwt-token']) {
        const cookieToken = cookie['next-auth.jwt-token'];
        token = typeof cookieToken === 'string' ? cookieToken : cookieToken.value;
      }
      
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized - Missing or invalid authorization" };
      }

      // Verify JWT token
      let payload: any = null;
      try {
        payload = await jwt.verify(token);
        if (!payload) {
          set.status = 401;
          return { error: "Unauthorized - Invalid token" };
        }
      } catch (error) {
        set.status = 401;
        return { error: "Unauthorized - Token verification failed" };
      }

      const { category, filename } = params;
      
      // Validate category
      if (!uploadService.validateCategory(category)) {
        set.status = 400;
        return { error: "Invalid category. Allowed: users, patients, products" };
      }

      // Validate filename
      if (!filename || filename.length === 0) {
        set.status = 400;
        return { error: "Filename is required" };
      }
      
      await uploadService.deleteFile(category, filename);
      
      // Log security tracking for file deletion
      await SecurityService.logSensitiveOperation(
        payload.sub,
        'DELETE_FILE',
        'File',
        filename,
        { 
          category, 
          filename 
        },
        redisClient
      );
      
      return {
        success: true,
        message: `File ${filename} deleted successfully from ${category}`
      };
      
    } catch (error) {
      console.error('Delete error:', error);
      set.status = 400;
      return { 
        error: error instanceof Error ? error.message : "Delete failed",
        success: false
      };
    }
  })

  // Get upload info endpoint
  .get("/info", async ({ headers, set, jwt, cookie }) => {
    try {
      // Check authorization - support both Bearer token and cookie
      let token = null;
      
      // Try Bearer token first
      const authHeader = headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
      // Try cookie if no Bearer token
      else if (cookie && cookie['next-auth.jwt-token']) {
        const cookieToken = cookie['next-auth.jwt-token'];
        token = typeof cookieToken === 'string' ? cookieToken : cookieToken.value;
      }
      
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized - Missing or invalid authorization" };
      }

      // Verify JWT token
      try {
        const payload = await jwt.verify(token);
        if (!payload) {
          set.status = 401;
          return { error: "Unauthorized - Invalid token" };
        }
      } catch (error) {
        set.status = 401;
        return { error: "Unauthorized - Token verification failed" };
      }

      return {
        success: true,
        config: {
          maxFileSize: "5MB",
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'],
          categories: ['users', 'patients', 'products']
        }
      };
      
    } catch (error) {
      console.error('Info error:', error);
      set.status = 500;
      return { 
        error: "Failed to get upload info",
        success: false
      };
    }
  })
  
  // Serve uploaded images
  .get("/image/:category/:filename", async ({ params, set }) => {
    const { category, filename } = params;
    
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const fullPath = path.join(process.cwd(), "public", "uploads", category, filename);
      
      // Check if file exists
      await fs.access(fullPath);
      
      // Read file
      const fileBuffer = await fs.readFile(fullPath);
      
      // Set appropriate content type based on file content, not extension
      const ext = path.extname(filename).toLowerCase();
      
      // Check file header to determine actual image type
      let contentType = 'application/octet-stream';
      if (fileBuffer.length >= 8) {
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4E && fileBuffer[3] === 0x47) {
          contentType = 'image/png';
        }
        // JPEG signature: FF D8 FF
        else if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8 && fileBuffer[2] === 0xFF) {
          contentType = 'image/jpeg';
        }
        // GIF signature: 47 49 46 38
        else if (fileBuffer[0] === 0x47 && fileBuffer[1] === 0x49 && fileBuffer[2] === 0x46 && fileBuffer[3] === 0x38) {
          contentType = 'image/gif';
        }
        // WebP signature: 52 49 46 46 ... 57 45 42 50
        else if (fileBuffer[0] === 0x52 && fileBuffer[1] === 0x49 && fileBuffer[2] === 0x46 && fileBuffer[3] === 0x46 &&
                 fileBuffer[8] === 0x57 && fileBuffer[9] === 0x45 && fileBuffer[10] === 0x42 && fileBuffer[11] === 0x50) {
          contentType = 'image/webp';
        }
        // Fallback to extension-based detection
        else {
          const contentTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          contentType = contentTypes[ext] || 'application/octet-stream';
        }
      }
      
      set.headers['Content-Type'] = contentType;
      set.headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year cache
      
      return fileBuffer;
    } catch (error) {
      set.status = 404;
      return { error: "File not found" };
    }
  });
