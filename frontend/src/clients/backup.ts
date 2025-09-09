import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { getCookie } from '@/utils/common';
import { APP_CONSTANTS } from '@/constants';


// Helper function for API requests - using same pattern as other clients
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    // Get token using same method as other clients
    const token = getCookie(APP_CONSTANTS.COOKIES.AUTH_TOKEN);
    
    console.log('🚀 [BACKUP] Making API request to:', endpoint);
    console.log('🚀 [BACKUP] Token found:', token ? 'Yes' : 'No');
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Important for cookie-based auth
      headers: {
        ...getAuthHeaders(token || undefined), // Use same auth headers as other clients
        ...options.headers,
      },
    });

    console.log('📡 [BACKUP] Response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ [BACKUP] API error:', data);
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    console.log('✅ [BACKUP] API success');
    return data;
  } catch (error) {
    console.error('💥 [BACKUP] API request failed:', error);
    throw error;
  }
}

export interface GoogleDriveConfig {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
    javascript_origins: string[];
  };
}

export interface BackupResult {
  id: string;
  localPath: string;
  googleDriveId?: string;
  googleDriveUrl?: string;
  size: number;
  timestamp: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'failed';
  error?: string;
}

export interface BackupFile {
  id: string;
  name: string;
  size: number;
  created: string;
  webViewLink?: string;
  type: 'full' | 'incremental';
  path?: string; // for local files
}

export interface GoogleDriveStatus {
  connected: boolean;
  configured: boolean;
  userInfo?: {
    name: string;
    email: string;
  };
  storageInfo?: {
    usage: string;
    limit: string;
    usageInDrive: string;
  };
}

export interface BackupStats {
  totalLocalBackups: number;
  totalGoogleDriveBackups: number;
  totalLocalSize: number;
  lastBackupTime?: string;
}

export interface SchedulerConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  uploadToGoogleDrive: boolean;
  keepLocalCopy: boolean;
  retentionDays: number;
}

export interface SchedulerStatus {
  enabled: boolean;
  frequency: string;
  time: string;
  nextRun?: string;
  isRunning: boolean;
}

export const BackupAPI = {
  /**
   * Configure Google Drive with OAuth JSON
   */
  async configureGoogleDrive(config: GoogleDriveConfig): Promise<{
    success: boolean;
    authUrl?: string;
    message: string;
  }> {
    return apiRequest('/backup/configure-google-drive', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /**
   * Complete Google Drive authorization with code
   */
  async authorizeGoogleDrive(code: string): Promise<{
    success: boolean;
    userInfo?: any;
    message: string;
  }> {
    return apiRequest('/backup/authorize-google-drive', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  /**
   * Check Google Drive connection status
   */
  async getGoogleDriveStatus(): Promise<GoogleDriveStatus> {
    const response = await apiRequest('/backup/google-drive-status');
    return response;
  },

  /**
   * Create manual backup
   */
  async createBackup(options: {
    uploadToGoogleDrive?: boolean;
    keepLocalCopy?: boolean;
  } = {}): Promise<{
    success: boolean;
    backup?: BackupResult;
    error?: string;
  }> {
    return apiRequest('/backup/create', {
      method: 'POST',
      body: JSON.stringify({
        uploadToGoogleDrive: options.uploadToGoogleDrive || false,
        keepLocalCopy: options.keepLocalCopy !== false, // default true
      }),
    });
  },

  /**
   * List all backups (local and Google Drive)
   */
  async listBackups(): Promise<{
    success: boolean;
    local: BackupFile[];
    googleDrive: BackupFile[];
    stats: BackupStats;
  }> {
    return apiRequest('/backup/list');
  },

  /**
   * Download local backup file
   */
  async downloadBackup(filename: string): Promise<Blob> {
    const token = getCookie(APP_CONSTANTS.COOKIES.AUTH_TOKEN);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/backup/download/local/${filename}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.blob();
  },

  /**
   * Delete backup file
   */
  async deleteBackup(type: 'local' | 'google-drive', id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    return apiRequest(`/backup/${type}/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Restore from backup
   */
  async restoreBackup(type: 'local' | 'google-drive', id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiRequest(`/backup/restore/${type}/${id}`, {
      method: 'POST',
    });
  },

  /**
   * Clean old backups
   */
  async cleanOldBackups(keepCount: number = 5): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiRequest('/backup/clean', {
      method: 'POST',
      body: JSON.stringify({ keepCount }),
    });
  },

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    success: boolean;
    stats: BackupStats;
  }> {
    return apiRequest('/backup/stats');
  },

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format date to Thai locale
   */
  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  },

  /**
   * Calculate duration between two dates
   */
  formatDuration(startDate: string, endDate?: string): string {
    if (!endDate) return '-';
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const diff = end - start;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Update scheduler configuration
   */
  async updateSchedulerConfig(config: Partial<SchedulerConfig>): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiRequest('/backup/schedule/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /**
   * Get scheduler status and configuration
   */
  async getSchedulerStatus(): Promise<{
    success: boolean;
    status: SchedulerStatus;
    config: SchedulerConfig;
  }> {
    return apiRequest('/backup/schedule/status');
  },

  /**
   * Start backup scheduler
   */
  async startScheduler(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiRequest('/backup/schedule/start', {
      method: 'POST',
    });
  },

  /**
   * Stop backup scheduler
   */
  async stopScheduler(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiRequest('/backup/schedule/stop', {
      method: 'POST',
    });
  },

  /**
   * Trigger manual scheduled backup
   */
  async triggerScheduledBackup(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiRequest('/backup/schedule/trigger', {
      method: 'POST',
    });
  },

  /**
   * Download backup file and trigger browser download
   */
  async triggerDownload(filename: string): Promise<void> {
    try {
      const blob = await this.downloadBackup(filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },
};
