import { Elysia } from 'elysia';
import { DatabaseBackupService } from '../services/databaseBackup';
import { GoogleDriveBackupService } from '../services/googleDriveBackup';
import { BackupScheduler } from '../services/backupScheduler';
import { logger } from '../lib/logger';
import { jwt } from '@elysiajs/jwt';
import { bearer } from '@elysiajs/bearer';
import { SecurityService } from '../graphql/security';
import * as fs from 'fs/promises';
import * as path from 'path';

// Global services
let googleDriveService: GoogleDriveBackupService | undefined;
let backupService: DatabaseBackupService;
let backupScheduler: BackupScheduler;

// Configuration file path
const GOOGLE_DRIVE_CONFIG_PATH = path.join(process.cwd(), 'data', 'google-drive-config.json');

// Load Google Drive configuration on startup
async function loadGoogleDriveConfig() {
  try {
    await fs.mkdir(path.dirname(GOOGLE_DRIVE_CONFIG_PATH), { recursive: true });
    const configData = await fs.readFile(GOOGLE_DRIVE_CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    if (config.web && config.refresh_token) {
      googleDriveService = new GoogleDriveBackupService(config);
      backupService.setGoogleDriveService(googleDriveService);
      logger.info('[BACKUP] Google Drive configuration loaded from file');
    }
  } catch (error) {
    logger.debug('[BACKUP] No existing Google Drive configuration found');
  }
}

// Save Google Drive configuration to file
async function saveGoogleDriveConfig(config: any) {
  try {
    await fs.mkdir(path.dirname(GOOGLE_DRIVE_CONFIG_PATH), { recursive: true });
    await fs.writeFile(GOOGLE_DRIVE_CONFIG_PATH, JSON.stringify(config, null, 2));
    logger.info('[BACKUP] Google Drive configuration saved to file');
  } catch (error) {
    logger.error('[BACKUP] Failed to save Google Drive configuration:', error as Error, 'BACKUP');
  }
}

// Initialize backup service
backupService = new DatabaseBackupService();

// Initialize scheduler with default config
backupScheduler = new BackupScheduler(backupService, {
  enabled: false,
  frequency: 'daily',
  time: '02:00',
  uploadToGoogleDrive: false,
  keepLocalCopy: true,
  retentionDays: 30,
});

// Load Google Drive configuration on startup
loadGoogleDriveConfig();

// Helper function to verify admin authentication
async function verifyAdmin(bearer: string | undefined, jwt: any, cookie: any) {
  let token = bearer;
  if (!token && cookie['next-auth.jwt-token']) {
    const cookieValue = cookie['next-auth.jwt-token'];
    token = typeof cookieValue === 'object' ? cookieValue.value : cookieValue;
  }

  if (!token) {
    throw new Error('Unauthorized - No token provided');
  }

  const payload = await jwt.verify(token);
  if (!payload || payload.role !== 'admin') {
    throw new Error('Unauthorized - Admin access required');
  }

  return payload;
}

// OAuth callback route (outside of /backup prefix)
export const oauthRoutes = new Elysia()
  .get('/auth/google/callback', async ({ query }) => {
    try {
      const { code, state } = query;
      
      if (!code) {
        return new Response(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
              <h2 style="color: #dc2626;">❌ ข้อผิดพลาด</h2>
              <p>ไม่พบรหัสยืนยันจาก Google</p>
              <p style="color: #6b7280; font-size: 14px;">กรุณาลองใหม่อีกครั้ง</p>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // แสดงหน้าให้ผู้ใช้คัดลอกรหัส
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">✅ การยืนยันสำเร็จ!</h2>
            <p>กรุณาคัดลอกรหัสด้านล่างและวางในช่องยืนยันของระบบ:</p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>รหัสยืนยัน:</strong>
              <div style="font-family: monospace; font-size: 14px; background: white; padding: 10px; margin-top: 10px; border: 1px solid #d1d5db; border-radius: 4px; word-break: break-all;">
                ${code}
              </div>
            </div>
            
            <button onclick="navigator.clipboard.writeText('${code}')" 
                    style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
              📋 คัดลอกรหัส
            </button>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              หลังจากวางรหัสแล้ว กรุณากลับไปที่หน้าตั้งค่าและกดปุ่ม "ยืนยัน"
            </p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
      
    } catch (error) {
      logger.error('[OAUTH] Callback error:', error as Error, 'OAUTH');
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h2 style="color: #dc2626;">❌ เกิดข้อผิดพลาด</h2>
            <p>ไม่สามารถประมวลผลการยืนยันได้</p>
            <p style="color: #6b7280; font-size: 14px;">กรุณาลองใหม่อีกครั้ง</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  });

export const backupRoutes = (redisClient?: any) => new Elysia({ prefix: '/backup' })
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET! }))
  .use(bearer())
  
  // Configure Google Drive
  .post('/configure-google-drive', async ({ body, bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      const config = body as any;
      
      // Validate config structure
      if (!config.web || !config.web.client_id || !config.web.client_secret) {
        return { error: 'Invalid Google OAuth configuration' };
      }

      // Create Google Drive service
      googleDriveService = new GoogleDriveBackupService(config);
      backupService.setGoogleDriveService(googleDriveService);
      
      // Update scheduler with new Google Drive service
      const schedulerConfig = backupScheduler.getConfig();
      backupScheduler = new BackupScheduler(backupService, schedulerConfig);
      if (schedulerConfig.enabled) {
        backupScheduler.start();
      }

      // Save configuration to file (without tokens initially)
      await saveGoogleDriveConfig(config);

      // Generate authorization URL
      const authUrl = googleDriveService.generateAuthUrl();

      logger.info(`[BACKUP_API] Google Drive configured by admin: ${payload.email}`);

      // Log security tracking for Google Drive configuration
      await SecurityService.logSensitiveOperation(
        payload.sub,
        'CONFIGURE_GOOGLE_DRIVE',
        'Backup',
        'google-drive-config',
        { 
          clientId: config.web.client_id,
          configuredBy: payload.email 
        },
        redisClient
      );

      return {
        success: true,
        authUrl,
        message: 'Google Drive configured successfully. Please complete authorization.',
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Configure Google Drive failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Complete Google Drive authorization
  .post('/authorize-google-drive', async ({ body, bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      if (!googleDriveService) {
        logger.error('[BACKUP_API] Google Drive service not configured', {}, 'BACKUP_API');
        return { success: false, error: 'Google Drive not configured' };
      }

      const { code } = body as any;
      
      if (!code) {
        logger.error('[BACKUP_API] Authorization code missing', {}, 'BACKUP_API');
        return { success: false, error: 'Authorization code is required' };
      }

      logger.debug('[BACKUP_API] Starting Google Drive authorization', { 
        user: payload.email,
        codeLength: code.length 
      });

      // Exchange code for tokens
      const tokens = await googleDriveService.getTokens(code);
      
      // Update service with tokens and save to file
      const currentConfig = (googleDriveService as any).config;
      currentConfig.refresh_token = tokens.refresh_token;
      currentConfig.access_token = tokens.access_token;
      
      // Reinitialize service with tokens
      googleDriveService = new GoogleDriveBackupService(currentConfig);
      backupService.setGoogleDriveService(googleDriveService);
      
      // Update scheduler with connected Google Drive service
      const schedulerConfig = backupScheduler.getConfig();
      backupScheduler = new BackupScheduler(backupService, schedulerConfig);
      if (schedulerConfig.enabled) {
        backupScheduler.start();
      }

      // Save configuration with tokens to file
      await saveGoogleDriveConfig(currentConfig);

      // Get user info to confirm connection
      const userInfo = await googleDriveService.getUserInfo();

      logger.info(`[BACKUP_API] Google Drive authorized by admin: ${payload.email}`, { userInfo });

      // Log security tracking for Google Drive authorization
      await SecurityService.logSensitiveOperation(
        payload.sub,
        'AUTHORIZE_GOOGLE_DRIVE',
        'Backup',
        'google-drive-auth',
        { 
          userInfo,
          authorizedBy: payload.email 
        },
        redisClient
      );

      return {
        success: true,
        userInfo,
        message: 'Google Drive authorization completed successfully.',
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Authorize Google Drive failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Check Google Drive connection status
  .get('/google-drive-status', async ({ bearer, jwt, cookie }) => {
    try {
      await verifyAdmin(bearer, jwt, cookie);
      
      if (!googleDriveService) {
        return {
          success: true,
          connected: false,
          configured: false,
        };
      }

      const connected = await googleDriveService.isConnected();
      let userInfo = null;
      let storageInfo = null;

      if (connected) {
        try {
          [userInfo, storageInfo] = await Promise.all([
            googleDriveService.getUserInfo(),
            googleDriveService.getStorageInfo(),
          ]);
        } catch (error) {
          logger.error('[BACKUP_API] Failed to get Google Drive info:', error, 'BACKUP_API');
        }
      }

      return {
        success: true,
        connected,
        configured: true,
        userInfo,
        storageInfo,
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Google Drive status check failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Create manual backup
  .post('/create', async ({ body, bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      const options = body as any;
      const result = await backupService.createBackup({
        uploadToGoogleDrive: options.uploadToGoogleDrive || false,
        keepLocalCopy: options.keepLocalCopy !== false, // default true
      });

      logger.info(`[BACKUP_API] Manual backup created by admin: ${payload.email}`, { 
        backupId: result.id,
        status: result.status,
        size: result.size,
      });

      // Log security tracking for backup creation
      await SecurityService.logSensitiveOperation(
        payload.sub,
        'CREATE_BACKUP',
        'Backup',
        result.id,
        { 
          backupId: result.id,
          status: result.status,
          size: result.size,
          uploadToGoogleDrive: options.uploadToGoogleDrive,
          createdBy: payload.email 
        },
        redisClient
      );

      return {
        success: result.status === 'completed',
        backup: result,
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Create backup failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // List all backups
  .get('/list', async ({ bearer, jwt, cookie }) => {
    try {
      await verifyAdmin(bearer, jwt, cookie);

      const [localBackups, googleDriveBackups, stats] = await Promise.all([
        backupService.listLocalBackups(),
        backupService.listGoogleDriveBackups(),
        backupService.getBackupStats(),
      ]);

      return {
        success: true,
        local: localBackups,
        googleDrive: googleDriveBackups,
        stats,
      };
    } catch (error) {
      logger.error(`[BACKUP_API] List backups failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Download local backup
  .get('/download/local/:filename', async ({ params, bearer, jwt, cookie, set }) => {
    try {
      await verifyAdmin(bearer, jwt, cookie);
      
      const { filename } = params;
      const backupDir = path.join(process.cwd(), 'backups');
      const filePath = path.join(backupDir, filename);
      
      // Security check - ensure file is in backup directory
      if (!filePath.startsWith(backupDir)) {
        set.status = 403;
        return { error: 'Access denied' };
      }

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        set.status = 404;
        return { error: 'Backup file not found' };
      }

      // Read file and return
      const fileBuffer = await fs.readFile(filePath);
      
      set.headers['Content-Type'] = 'application/octet-stream';
      set.headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      
      return fileBuffer;
    } catch (error) {
      logger.error(`[BACKUP_API] Download backup failed:`, error, 'BACKUP_API');
      set.status = 500;
      return { error: (error as Error).message };
    }
  })

  // Delete backup
  .delete('/:type/:id', async ({ params, bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      const { type, id } = params;

      if (type === 'google-drive') {
        await backupService.deleteGoogleDriveBackup(id);
      } else if (type === 'local') {
        // For local backups, id is the filename
        const backupDir = path.join(process.cwd(), 'backups');
        const filePath = path.join(backupDir, id);
        
        // Security check
        if (!filePath.startsWith(backupDir)) {
          return { error: 'Access denied' };
        }
        
        await backupService.deleteLocalBackup(filePath);
      } else {
        return { error: 'Invalid backup type' };
      }

      logger.info(`[BACKUP_API] Backup deleted: ${type}/${id} by ${payload.email}`);

      // Log security tracking for backup deletion
      await SecurityService.logSensitiveOperation(
        payload.sub,
        'DELETE_BACKUP',
        'Backup',
        id,
        { 
          backupType: type,
          backupId: id,
          deletedBy: payload.email 
        },
        redisClient
      );

      return { success: true };
    } catch (error) {
      logger.error(`[BACKUP_API] Delete backup failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Restore from backup
  .post('/restore/:type/:id', async ({ params, bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      const { type, id } = params;

      if (type === 'google-drive') {
        await backupService.restoreFromGoogleDrive(id);
      } else if (type === 'local') {
        // For local backups, id is the filename
        const backupDir = path.join(process.cwd(), 'backups');
        const filePath = path.join(backupDir, id);
        
        // Security check
        if (!filePath.startsWith(backupDir)) {
          return { error: 'Access denied' };
        }
        
        await backupService.restoreBackup(filePath);
      } else {
        return { error: 'Invalid backup type' };
      }

      logger.info(`[BACKUP_API] Database restored from: ${type}/${id} by ${payload.email}`);

      // Log security tracking for backup restoration
      await SecurityService.logSensitiveOperation(
        payload.sub,
        'RESTORE_BACKUP',
        'Backup',
        id,
        { 
          backupType: type,
          backupId: id,
          restoredBy: payload.email 
        },
        redisClient
      );

      return { 
        success: true,
        message: 'Database restored successfully',
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Restore backup failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Clean old backups
  .post('/clean', async ({ body, bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      const { keepCount = 5 } = body as any;
      
      await backupService.cleanOldBackups(keepCount);

      logger.info(`[BACKUP_API] Old backups cleaned by admin: ${payload.email}`, { keepCount });

      return { 
        success: true,
        message: `Old backups cleaned, keeping ${keepCount} most recent`,
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Clean backups failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Get backup statistics
  .get('/stats', async ({ bearer, jwt, cookie }) => {
    try {
      await verifyAdmin(bearer, jwt, cookie);

      const stats = await backupService.getBackupStats();

      return {
        success: true,
        stats,
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Get backup stats failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Update scheduler configuration
  .post('/schedule/config', async ({ body, bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      const config = body as any;
      backupScheduler.updateConfig(config);

      logger.info(`[BACKUP_API] Scheduler config updated by admin: ${payload.email}`, config);

      return {
        success: true,
        message: 'Scheduler configuration updated successfully',
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Update scheduler config failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Get scheduler status
  .get('/schedule/status', async ({ bearer, jwt, cookie }) => {
    try {
      await verifyAdmin(bearer, jwt, cookie);

      const status = backupScheduler.getStatus();
      const config = backupScheduler.getConfig();

      return {
        success: true,
        status,
        config,
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Get scheduler status failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Start scheduler
  .post('/schedule/start', async ({ bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      backupScheduler.updateConfig({ enabled: true });

      logger.info(`[BACKUP_API] Scheduler started by admin: ${payload.email}`);

      return {
        success: true,
        message: 'Backup scheduler started successfully',
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Start scheduler failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Stop scheduler
  .post('/schedule/stop', async ({ bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      backupScheduler.updateConfig({ enabled: false });

      logger.info(`[BACKUP_API] Scheduler stopped by admin: ${payload.email}`);

      return {
        success: true,
        message: 'Backup scheduler stopped successfully',
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Stop scheduler failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  })

  // Trigger manual scheduled backup
  .post('/schedule/trigger', async ({ bearer, jwt, cookie }) => {
    try {
      const payload = await verifyAdmin(bearer, jwt, cookie);
      
      await backupScheduler.triggerManualBackup();

      logger.info(`[BACKUP_API] Manual scheduled backup triggered by admin: ${payload.email}`);

      return {
        success: true,
        message: 'Manual backup triggered successfully',
      };
    } catch (error) {
      logger.error(`[BACKUP_API] Trigger manual backup failed:`, error, 'BACKUP_API');
      return { error: (error as Error).message };
    }
  });
