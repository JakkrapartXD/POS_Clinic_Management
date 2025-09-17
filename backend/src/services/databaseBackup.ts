import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../lib/logger';
import { GoogleDriveBackupService } from './googleDriveBackup';

const execAsync = promisify(exec);

interface BackupOptions {
  uploadToGoogleDrive?: boolean;
  keepLocalCopy?: boolean;
  compressionLevel?: number;
}

interface BackupResult {
  id: string;
  localPath: string;
  googleDriveId?: string;
  googleDriveUrl?: string;
  size: number;
  timestamp: Date;
  type: 'full' | 'incremental';
  status: 'completed' | 'failed';
  error?: string;
}

export class DatabaseBackupService {
  private googleDriveService?: GoogleDriveBackupService;
  private backupDir: string;
  private pgpassPath: string;

  constructor(googleDriveService?: GoogleDriveBackupService) {
    this.googleDriveService = googleDriveService;
    this.backupDir = path.join(process.cwd(), 'backups');
    this.pgpassPath = path.join(process.cwd(), '.pgpass');
  }

  /**
   * Set Google Drive service
   */
  setGoogleDriveService(service: GoogleDriveBackupService) {
    this.googleDriveService = service;
  }

  /**
   * Create .pgpass file for secure password handling
   */
  private async createPgpassFile(host: string, port: string, database: string, username: string, password: string): Promise<void> {
    try {
      // Format: hostname:port:database:username:password
      const pgpassContent = `${host}:${port}:${database}:${username}:${password}\n`;
      
      // Set restrictive permissions (600 = rw-------)
      await fs.writeFile(this.pgpassPath, pgpassContent, { mode: 0o600 });
      
      logger.debug(`[BACKUP] Created .pgpass file with secure permissions`, { 
        path: this.pgpassPath,
        host,
        port,
        database,
        username: username.substring(0, 3) + '***'
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.warn(`[BACKUP] Failed to create .pgpass file:`, { error: errorObj.message });
      // Continue without .pgpass file, will use environment variables instead
    }
  }

  /**
   * Remove .pgpass file after use
   */
  private async removePgpassFile(): Promise<void> {
    try {
      await fs.unlink(this.pgpassPath);
      logger.debug(`[BACKUP] Removed .pgpass file`);
    } catch (error) {
      // Ignore errors when removing .pgpass file
      logger.debug(`[BACKUP] Could not remove .pgpass file (may not exist)`);
    }
  }

  /**
   * Create database backup
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const backupId = `backup_${Date.now()}`;
    
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `pharmacy_backup_${timestamp}.sql`;
      const filePath = path.join(this.backupDir, fileName);

      logger.info(`[BACKUP] Creating database backup: ${fileName}`, { backupId });

      // Create PostgreSQL dump
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Clean up DATABASE_URL for pg_dump (remove Prisma-specific parameters)
      const cleanDbUrl = dbUrl.split('?')[0]; // Remove query parameters like ?schema=clinic_dev
      
      // Parse DATABASE_URL to extract components safely
      const url = new URL(cleanDbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.substring(1); // Remove leading slash
      const username = decodeURIComponent(url.username);
      const password = decodeURIComponent(url.password);
      
      // Create .pgpass file for secure password handling
      await this.createPgpassFile(host, port, database, username, password);
      
      try {
        // Set environment variables for secure password handling
        const env = {
          ...process.env,
          PGPASSWORD: password,
          PGHOST: host,
          PGPORT: port,
          PGUSER: username,
          PGDATABASE: database
        };
        
        // Use pg_dump with individual parameters (password is now in environment variable)
        const pgDumpCommand = `pg_dump --host="${host}" --port="${port}" --username="${username}" --dbname="${database}" --verbose --clean --no-acl --no-owner`;
        
        logger.info(`[BACKUP] Executing pg_dump command`, { 
          backupId, 
          command: pgDumpCommand,
          host,
          port,
          database,
          username: username.substring(0, 3) + '***' // Mask username in logs
        });
        
        const { stdout, stderr } = await execAsync(pgDumpCommand, { env });
        
        if (stderr) {
          logger.warn(`[BACKUP] pg_dump stderr output:`, { stderr, backupId });
        }
        
        // Write backup to file
        await fs.writeFile(filePath, stdout);
        
        logger.info(`[BACKUP] Backup file written successfully`, { backupId, filePath });
      } finally {
        // Always remove .pgpass file after use
        await this.removePgpassFile();
      }

      // Get file size
      const stats = await fs.stat(filePath);
      logger.info(`[BACKUP] Backup created: ${fileName} (${stats.size} bytes)`, { backupId });

      const result: BackupResult = {
        id: backupId,
        localPath: filePath,
        size: stats.size,
        timestamp: new Date(),
        type: 'full',
        status: 'completed',
      };

      // Upload to Google Drive if requested and service is available
      if (options.uploadToGoogleDrive && this.googleDriveService) {
        try {
          const isConnected = await this.googleDriveService.isConnected();
          if (isConnected) {
            const uploadResult = await this.googleDriveService.uploadBackup(filePath, fileName);
            result.googleDriveId = uploadResult.id;
            result.googleDriveUrl = uploadResult.url;
            logger.info(`[BACKUP] Uploaded to Google Drive: ${uploadResult.id}`, { backupId });
          } else {
            logger.warn('[BACKUP] Google Drive not connected, skipping upload', { backupId });
          }
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          logger.error(`[BACKUP] Google Drive upload failed:`, { error: errorObj, backupId }, 'BACKUP');
          // Continue without failing the entire backup
        }
      }

      // Remove local file if not keeping local copy and Google Drive upload was successful
      if (!options.keepLocalCopy && result.googleDriveId) {
        await fs.unlink(filePath);
        result.localPath = '';
        logger.info(`[BACKUP] Local backup file removed: ${fileName}`, { backupId });
      }

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] Backup creation failed:`, { error: errorObj, backupId }, 'BACKUP');
      
      // Ensure .pgpass file is removed even if backup fails
      await this.removePgpassFile();
      
      return {
        id: backupId,
        localPath: '',
        size: 0,
        timestamp: new Date(),
        type: 'full',
        status: 'failed',
        error: errorObj.message,
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      logger.info(`[BACKUP] Restoring database from: ${backupPath}`);

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Clean up DATABASE_URL for psql (remove Prisma-specific parameters)
      const cleanDbUrl = dbUrl.split('?')[0];
      
      // Parse DATABASE_URL to extract components safely
      const url = new URL(cleanDbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.substring(1); // Remove leading slash
      const username = decodeURIComponent(url.username);
      const password = decodeURIComponent(url.password);

      // Check if file exists
      await fs.access(backupPath);

      // Create .pgpass file for secure password handling
      await this.createPgpassFile(host, port, database, username, password);
      
      try {
        // Set environment variables for secure password handling
        const env = {
          ...process.env,
          PGPASSWORD: password,
          PGHOST: host,
          PGPORT: port,
          PGUSER: username,
          PGDATABASE: database
        };

        // Restore database using psql with individual parameters (password is now in environment variable)
        const restoreCommand = `psql --host="${host}" --port="${port}" --username="${username}" --dbname="${database}" < "${backupPath}"`;
        
        logger.info(`[BACKUP] Executing restore command`, { 
          command: restoreCommand,
          host,
          port,
          database,
          username: username.substring(0, 3) + '***' // Mask username in logs
        });
        
        await execAsync(restoreCommand, { env });
      } finally {
        // Always remove .pgpass file after use
        await this.removePgpassFile();
      }

      logger.info(`[BACKUP] Database restored successfully from: ${backupPath}`);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] Restore failed:`, errorObj);
      // Ensure .pgpass file is removed even if restore fails
      await this.removePgpassFile();
      throw errorObj;
    }
  }

  /**
   * Restore from Google Drive backup
   */
  async restoreFromGoogleDrive(fileId: string): Promise<void> {
    if (!this.googleDriveService) {
      throw new Error('Google Drive service not configured');
    }

    try {
      const tempPath = path.join(this.backupDir, `temp_restore_${Date.now()}.sql`);
      
      // Download from Google Drive
      await this.googleDriveService.downloadBackup(fileId, tempPath);
      
      // Restore from downloaded file
      await this.restoreBackup(tempPath);
      
      // Clean up temp file
      await fs.unlink(tempPath);
      
      logger.info(`[BACKUP] Restored from Google Drive: ${fileId}`);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] Google Drive restore failed:`, errorObj);
      throw errorObj;
    }
  }

  /**
   * List local backup files
   */
  async listLocalBackups(): Promise<Array<{
    id: string;
    name: string;
    path: string;
    size: number;
    created: Date;
    type: 'full' | 'incremental';
  }>> {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });
      
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.sql'));

      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          return {
            id: file.replace('.sql', ''),
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            type: 'full' as const,
          };
        })
      );

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] List local backups failed:`, errorObj);
      return [];
    }
  }

  /**
   * List Google Drive backups
   */
  async listGoogleDriveBackups(): Promise<Array<{
    id: string;
    name: string;
    size: number;
    created: Date;
    webViewLink: string;
    type: 'full' | 'incremental';
  }>> {
    if (!this.googleDriveService) {
      return [];
    }

    try {
      const isConnected = await this.googleDriveService.isConnected();
      if (!isConnected) {
        return [];
      }

      const files = await this.googleDriveService.listBackups();
      
      return files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size || 0,
        created: new Date(file.createdTime),
        webViewLink: file.webViewLink,
        type: 'full' as const,
      }));
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] List Google Drive backups failed:`, errorObj);
      return [];
    }
  }

  /**
   * Delete local backup file
   */
  async deleteLocalBackup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info(`[BACKUP] Local backup deleted: ${filePath}`);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] Delete local backup failed:`, errorObj);
      throw errorObj;
    }
  }

  /**
   * Delete Google Drive backup
   */
  async deleteGoogleDriveBackup(fileId: string): Promise<void> {
    if (!this.googleDriveService) {
      throw new Error('Google Drive service not configured');
    }

    try {
      await this.googleDriveService.deleteBackup(fileId);
      logger.info(`[BACKUP] Google Drive backup deleted: ${fileId}`);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] Delete Google Drive backup failed:`, errorObj);
      throw errorObj;
    }
  }

  /**
   * Clean old backup files
   */
  async cleanOldBackups(keepCount: number = 5): Promise<void> {
    try {
      const localBackups = await this.listLocalBackups();
      
      if (localBackups.length <= keepCount) {
        return;
      }

      const toDelete = localBackups.slice(keepCount);
      
      for (const backup of toDelete) {
        await this.deleteLocalBackup(backup.path);
      }

      logger.info(`[BACKUP] Cleaned ${toDelete.length} old local backups`);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] Clean old backups failed:`, errorObj);
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalLocalBackups: number;
    totalGoogleDriveBackups: number;
    totalLocalSize: number;
    lastBackupTime?: Date;
  }> {
    try {
      const [localBackups, googleDriveBackups] = await Promise.all([
        this.listLocalBackups(),
        this.listGoogleDriveBackups(),
      ]);

      const totalLocalSize = localBackups.reduce((sum, backup) => sum + backup.size, 0);
      
      const allBackups = [...localBackups, ...googleDriveBackups];
      const lastBackupTime = allBackups.length > 0 
        ? allBackups.sort((a, b) => b.created.getTime() - a.created.getTime())[0].created
        : undefined;

      return {
        totalLocalBackups: localBackups.length,
        totalGoogleDriveBackups: googleDriveBackups.length,
        totalLocalSize,
        lastBackupTime,
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`[BACKUP] Get backup stats failed:`, errorObj);
      return {
        totalLocalBackups: 0,
        totalGoogleDriveBackups: 0,
        totalLocalSize: 0,
      };
    }
  }
}
