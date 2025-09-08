import { google } from 'googleapis';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { logger } from '../lib/logger';

interface GoogleOAuthConfig {
  client_id: string;
  project_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_secret: string;
  redirect_uris: string[];
  javascript_origins: string[];
}

interface GoogleDriveConfig {
  web: GoogleOAuthConfig;
  refresh_token?: string;
  access_token?: string;
  folderId?: string;
}

export class GoogleDriveBackupService {
  private drive: any;
  private auth: any;
  private config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
    this.initializeDrive();
  }

  private initializeDrive() {
    try {
      this.auth = new google.auth.OAuth2(
        this.config.web.client_id,
        this.config.web.client_secret,
        this.config.web.redirect_uris[0]
      );

      if (this.config.refresh_token) {
        this.auth.setCredentials({
          refresh_token: this.config.refresh_token,
          access_token: this.config.access_token,
        });
      }

      this.drive = google.drive({ version: 'v3', auth: this.auth });
    } catch (error) {
      logger.error('[GOOGLE_DRIVE] Initialization failed:', error as Error, 'GOOGLE_DRIVE');
      throw new Error(`Google Drive initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly'
    ];

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      logger.debug('[GOOGLE_DRIVE] Exchanging authorization code for tokens', { code: code.substring(0, 10) + '...' });
      
      const { tokens } = await this.auth.getToken(code);
      
      logger.debug('[GOOGLE_DRIVE] Token exchange successful', { 
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token 
      });
      
      this.auth.setCredentials(tokens);
      
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      };
    } catch (error) {
      logger.error('[GOOGLE_DRIVE] Token exchange failed:', { 
        error: error as Error,
        code: code.substring(0, 10) + '...',
        redirectUri: this.config.web.redirect_uris[0]
      }, 'GOOGLE_DRIVE');
      throw new Error(`Token exchange failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if Google Drive is properly configured and connected
   */
  async isConnected(): Promise<boolean> {
    try {
      if (!this.config.refresh_token) {
        return false;
      }

      await this.drive.about.get({ fields: 'user' });
      return true;
    } catch (error) {
      logger.error('[GOOGLE_DRIVE] Connection check failed:', error as Error, 'GOOGLE_DRIVE');
      return false;
    }
  }

  /**
   * Create backup folder if it doesn't exist
   */
  async ensureBackupFolder(): Promise<string> {
    try {
      const folderName = 'Pharmacy Backups';
      
      // Search for existing folder
      const existingFolders = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (existingFolders.data.files.length > 0) {
        const folderId = existingFolders.data.files[0].id;
        logger.info(`[GOOGLE_DRIVE] Using existing backup folder: ${folderId}`);
        return folderId;
      }

      // Create new folder
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      const folderId = folder.data.id;
      logger.info(`[GOOGLE_DRIVE] Created backup folder: ${folderId}`);
      
      return folderId;
    } catch (error) {
      logger.error('[GOOGLE_DRIVE] Folder creation failed:', error as Error, 'GOOGLE_DRIVE');
      throw new Error(`Backup folder creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Upload backup file to Google Drive
   */
  async uploadBackup(filePath: string, fileName?: string): Promise<{ id: string; url: string }> {
    try {
      const fileStats = await fs.stat(filePath);
      const displayName = fileName || path.basename(filePath);
      
      logger.info(`[GOOGLE_DRIVE] Starting upload: ${displayName} (${fileStats.size} bytes)`);

      // Ensure backup folder exists
      const folderId = await this.ensureBackupFolder();

      const fileMetadata = {
        name: displayName,
        parents: [folderId],
      };

      const fileStream = fsSync.createReadStream(filePath);
      const media = {
        mimeType: 'application/octet-stream',
        body: fileStream,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,size,createdTime,webViewLink',
      });

      logger.info(`[GOOGLE_DRIVE] Upload successful: ${response.data.id}`);
      
      return {
        id: response.data.id,
        url: response.data.webViewLink,
      };
    } catch (error) {
      logger.error(`[GOOGLE_DRIVE] Upload failed:`, error as Error, 'GOOGLE_DRIVE');
      throw new Error(`Google Drive upload failed: ${(error as Error).message}`);
    }
  }

  /**
   * List backup files in Google Drive
   */
  async listBackups(limit: number = 10): Promise<Array<{
    id: string;
    name: string;
    size: number;
    createdTime: string;
    webViewLink: string;
  }>> {
    try {
      const folderId = await this.ensureBackupFolder();
      
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        orderBy: 'createdTime desc',
        pageSize: limit,
        fields: 'files(id,name,size,createdTime,webViewLink)',
      });

      return response.data.files || [];
    } catch (error) {
      logger.error(`[GOOGLE_DRIVE] List failed:`, error as Error, 'GOOGLE_DRIVE');
      throw new Error(`Google Drive list failed: ${(error as Error).message}`);
    }
  }

  /**
   * Delete backup file from Google Drive
   */
  async deleteBackup(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
      
      logger.info(`[GOOGLE_DRIVE] File deleted: ${fileId}`);
    } catch (error) {
      logger.error(`[GOOGLE_DRIVE] Delete failed:`, error as Error, 'GOOGLE_DRIVE');
      throw new Error(`Google Drive delete failed: ${(error as Error).message}`);
    }
  }

  /**
   * Download backup file from Google Drive
   */
  async downloadBackup(fileId: string, destinationPath: string): Promise<void> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });

      await fs.writeFile(destinationPath, response.data);
      
      logger.info(`[GOOGLE_DRIVE] File downloaded: ${destinationPath}`);
    } catch (error) {
      logger.error(`[GOOGLE_DRIVE] Download failed:`, error as Error, 'GOOGLE_DRIVE');
      throw new Error(`Google Drive download failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageInfo(): Promise<{
    usage: string;
    limit: string;
    usageInDrive: string;
  }> {
    try {
      const response = await this.drive.about.get({
        fields: 'storageQuota',
      });

      const quota = response.data.storageQuota;
      
      return {
        usage: quota.usage || '0',
        limit: quota.limit || '0',
        usageInDrive: quota.usageInDrive || '0',
      };
    } catch (error) {
      logger.error(`[GOOGLE_DRIVE] Storage info failed:`, error as Error, 'GOOGLE_DRIVE');
      throw new Error(`Google Drive storage info failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<{ name: string; email: string }> {
    try {
      const response = await this.drive.about.get({
        fields: 'user',
      });

      const user = response.data.user;
      
      return {
        name: user.displayName || 'Unknown',
        email: user.emailAddress || 'Unknown',
      };
    } catch (error) {
      logger.error(`[GOOGLE_DRIVE] User info failed:`, error as Error, 'GOOGLE_DRIVE');
      throw new Error(`Google Drive user info failed: ${(error as Error).message}`);
    }
  }
}
