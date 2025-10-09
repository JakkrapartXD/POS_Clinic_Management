import { DatabaseBackupService } from './databaseBackup';
import { GoogleDriveBackupService } from './googleDriveBackup';
import { logger } from '../lib/logger';

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  uploadToGoogleDrive: boolean;
  keepLocalCopy: boolean;
  retentionDays: number;
}

interface SchedulerStatus {
  enabled: boolean;
  frequency: string;
  time: string;
  nextRun?: string;
  isRunning: boolean;
}

export class BackupScheduler {
  private backupService: DatabaseBackupService;
  private config: ScheduleConfig;
  private scheduledIntervals: NodeJS.Timeout[] = [];

  constructor(backupService: DatabaseBackupService, config: ScheduleConfig) {
    this.backupService = backupService;
    this.config = config;
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(config: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...config };
    this.restart();
  }

  /**
   * Start the backup scheduler
   */
  start(): void {
    if (!this.config.enabled) {
      logger.info('[SCHEDULER] Backup scheduler is disabled');
      return;
    }

    this.stop(); // Stop any existing schedulers

    const interval = this.calculateInterval();
    const nextRun = this.calculateNextRun();

    logger.info('[SCHEDULER] Starting backup scheduler', {
      frequency: this.config.frequency,
      time: this.config.time,
      nextRun: nextRun.toISOString(),
      interval: interval,
    });

    // Schedule the first backup
    const timeUntilFirstRun = nextRun.getTime() - Date.now();
    
    if (timeUntilFirstRun > 0) {
      const firstRunTimeout = setTimeout(() => {
        this.runScheduledBackup();
        
        // Then set up recurring backups
        const recurringInterval = setInterval(() => {
          this.runScheduledBackup();
        }, interval);
        
        this.scheduledIntervals.push(recurringInterval);
      }, timeUntilFirstRun);
      
      this.scheduledIntervals.push(firstRunTimeout);
    } else {
      // If the time has already passed today, run immediately and then schedule
      this.runScheduledBackup();
      
      const recurringInterval = setInterval(() => {
        this.runScheduledBackup();
      }, interval);
      
      this.scheduledIntervals.push(recurringInterval);
    }
  }

  /**
   * Stop the backup scheduler
   */
  stop(): void {
    this.scheduledIntervals.forEach(interval => {
      clearTimeout(interval);
      clearInterval(interval);
    });
    this.scheduledIntervals = [];
    
    logger.info('[SCHEDULER] Backup scheduler stopped');
  }

  /**
   * Restart the backup scheduler
   */
  restart(): void {
    logger.info('[SCHEDULER] Restarting backup scheduler');
    this.stop();
    this.start();
  }

  /**
   * Run a scheduled backup
   */
  private async runScheduledBackup(): Promise<void> {
    try {
      logger.info('[SCHEDULER] Starting scheduled backup', {
        frequency: this.config.frequency,
        uploadToGoogleDrive: this.config.uploadToGoogleDrive,
      });

      const result = await this.backupService.createBackup({
        uploadToGoogleDrive: this.config.uploadToGoogleDrive,
        keepLocalCopy: this.config.keepLocalCopy,
      });

      if (result.status === 'completed') {
        logger.info('[SCHEDULER] Scheduled backup completed successfully', {
          backupId: result.id,
          size: result.size,
          googleDriveId: result.googleDriveId,
        });

        // Clean up old backups if retention is configured
        if (this.config.retentionDays > 0) {
          await this.cleanupOldBackups();
        }
      } else {
        logger.error('[SCHEDULER] Scheduled backup failed', {
          backupId: result.id,
          error: result.error,
        });
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('[SCHEDULER] Scheduled backup error:', { error: errorObj }, 'SCHEDULER');
    }
  }

  /**
   * Clean up old backup files based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      // Clean up local backups
      const localBackups = await this.backupService.listLocalBackups();
      const oldLocalBackups = localBackups.filter(backup => 
        backup.created < cutoffDate
      );

      for (const backup of oldLocalBackups) {
        try {
          await this.backupService.deleteLocalBackup(backup.path);
          logger.info('[SCHEDULER] Deleted old local backup', {
            backupId: backup.id,
            created: backup.created,
          });
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          logger.error('[SCHEDULER] Failed to delete old local backup', { backupId: backup.id, error: errorObj }, 'SCHEDULER');
        }
      }

      // Clean up Google Drive backups if service is available
      const googleDriveBackups = await this.backupService.listGoogleDriveBackups();
      const oldGoogleDriveBackups = googleDriveBackups.filter(backup => 
        backup.created < cutoffDate
      );

      for (const backup of oldGoogleDriveBackups) {
        try {
          await this.backupService.deleteGoogleDriveBackup(backup.id);
          logger.info('[SCHEDULER] Deleted old Google Drive backup', {
            backupId: backup.id,
            created: backup.created,
          });
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          logger.error('[SCHEDULER] Failed to delete old Google Drive backup', { backupId: backup.id, error: errorObj }, 'SCHEDULER');
        }
      }

      logger.info('[SCHEDULER] Cleanup completed', {
        deletedLocal: oldLocalBackups.length,
        deletedGoogleDrive: oldGoogleDriveBackups.length,
        retentionDays: this.config.retentionDays,
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('[SCHEDULER] Cleanup failed:', { error: errorObj }, 'SCHEDULER');
    }
  }

  /**
   * Calculate the interval in milliseconds based on frequency
   */
  private calculateInterval(): number {
    switch (this.config.frequency) {
      case 'hourly':
        return 60 * 60 * 1000; // 1 hour
      case 'daily':
        return 24 * 60 * 60 * 1000; // 1 day
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 1 week
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  /**
   * Calculate the next run time based on frequency and time
   */
  private calculateNextRun(): Date {
    const now = new Date();
    const [hours, minutes] = this.config.time.split(':').map(Number);

    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (this.config.frequency) {
      case 'hourly':
        // For hourly, ignore the time setting and run every hour
        nextRun.setTime(now.getTime() + (60 * 60 * 1000));
        break;
        
      case 'daily':
        // If the time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case 'weekly':
        // Schedule for the same day next week
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
        
      case 'monthly':
        // Schedule for the same day next month
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    return nextRun;
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    enabled: boolean;
    frequency: string;
    time: string;
    nextRun?: Date;
    isRunning: boolean;
  } {
    return {
      enabled: this.config.enabled,
      frequency: this.config.frequency,
      time: this.config.time,
      nextRun: this.config.enabled ? this.calculateNextRun() : undefined,
      isRunning: this.scheduledIntervals.length > 0,
    };
  }

  /**
   * Get scheduler configuration
   */
  getConfig(): ScheduleConfig {
    return { ...this.config };
  }


  /**
   * Manually trigger a backup (outside of schedule)
   */
  async triggerManualBackup(): Promise<void> {
    logger.info('[SCHEDULER] Manual backup triggered');
    await this.runScheduledBackup();
  }
}
