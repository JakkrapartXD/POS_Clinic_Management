import { PrismaClient } from '@prisma/client';
import { ReportService } from './ReportService';
import { logger } from '../lib/logger';

export class SchedulerService {
  private prisma: PrismaClient;
  private reportService: ReportService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.reportService = new ReportService(prisma);
  }

  /**
   * Daily automated report generation
   * Should be called every day at end of business (e.g., 11:59 PM)
   */
  async runDailyReportGeneration(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      logger.info('Starting automated daily report generation', { date: today.toDateString() });

      // Generate comprehensive daily report
      const result = await this.reportService.generateComprehensiveDailyReport(
        today,
        'system',
        'automated-scheduler'
      );

      logger.info('Completed automated daily report generation', {
        date: today.toDateString(),
        dailyReportId: result.dailyReport.id,
        salesReportsCount: result.salesReports.length,
        stockAlertsCount: result.stockAlerts.length,
        summary: result.summary
      });

      // Optional: Send notifications for critical alerts
      await this.handleCriticalAlerts(result.stockAlerts);

    } catch (error) {
      logger.error('Failed to run daily report generation', error, 'SCHEDULER');
      throw error;
    }
  }

  /**
   * Hourly stock alert check
   * Should be called every hour during business hours
   */
  async runHourlyStockCheck(): Promise<void> {
    try {
      logger.info('Starting automated stock alert check');

      const alerts = await this.reportService.generateStockAlerts(
        'system',
        'automated-scheduler'
      );

      if (alerts.length > 0) {
        logger.warn(`Generated ${alerts.length} new stock alerts`, {
          alertCount: alerts.length,
          products: alerts.map(alert => ({
            productId: alert.productId,
            alertType: alert.alert_type,
            product: alert.product?.product_name
          }))
        });

        // Handle critical alerts immediately
        await this.handleCriticalAlerts(alerts);
      } else {
        logger.info('No new stock alerts generated');
      }

    } catch (error) {
      logger.error('Failed to run hourly stock check', error, 'SCHEDULER');
      throw error;
    }
  }

  /**
   * Weekly comprehensive report generation
   * Should be called every Sunday at end of week
   */
  async runWeeklyReportGeneration(): Promise<void> {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      logger.info('Starting automated weekly report generation', {
        fromDate: weekAgo.toDateString(),
        toDate: today.toDateString()
      });

      // Generate reports for each day of the week
      const weeklyResults = [];
      
      for (let i = 0; i < 7; i++) {
        const reportDate = new Date(weekAgo);
        reportDate.setDate(weekAgo.getDate() + i);
        
        try {
          const dailyResult = await this.reportService.generateComprehensiveDailyReport(
            reportDate,
            'system',
            'weekly-scheduler'
          );
          weeklyResults.push(dailyResult);
        } catch (error) {
          logger.warn(`Failed to generate report for ${reportDate.toDateString()}`, error);
        }
      }

      // Calculate weekly summary
      const weeklySummary = this.calculateWeeklySummary(weeklyResults);
      
      logger.info('Completed automated weekly report generation', {
        weeklyResults: weeklyResults.length,
        weeklySummary
      });

    } catch (error) {
      logger.error('Failed to run weekly report generation', error, 'SCHEDULER');
      throw error;
    }
  }

  /**
   * Handle critical alerts that need immediate attention
   */
  private async handleCriticalAlerts(alerts: any[]): Promise<void> {
    const criticalAlerts = alerts.filter(alert => 
      alert.alert_type === 'out_of_stock' || 
      (alert.alert_type === 'low_stock' && alert.product?.stock_quantity <= 5)
    );

    if (criticalAlerts.length > 0) {
      logger.error('Critical stock alerts detected!', {
        criticalCount: criticalAlerts.length,
        alerts: criticalAlerts.map(alert => ({
          productName: alert.product?.product_name,
          alertType: alert.alert_type,
          currentStock: alert.product?.stock_quantity,
          reorderPoint: alert.product?.reorder_point
        }))
      });

      // Here you could implement:
      // - Email notifications
      // - Slack/Teams notifications
      // - SMS alerts
      // - Dashboard alerts
      // - Automatic purchase order generation

      // Example: Log critical alerts for external monitoring
      for (const alert of criticalAlerts) {
        logger.error('CRITICAL_STOCK_ALERT', {
          productId: alert.productId,
          productName: alert.product?.product_name,
          alertType: alert.alert_type,
          currentStock: alert.product?.stock_quantity,
          reorderPoint: alert.product?.reorder_point,
          alertId: alert.id
        });
      }
    }
  }

  /**
   * Calculate weekly summary from daily results
   */
  private calculateWeeklySummary(weeklyResults: any[]) {
    const summary = {
      totalSales: 0,
      totalOrders: 0,
      totalPatients: 0,
      totalProductsSold: 0,
      totalAlerts: 0,
      averageDailySales: 0,
      averageDailyOrders: 0,
      daysWithData: weeklyResults.length
    };

    weeklyResults.forEach(result => {
      summary.totalSales += result.summary.total_sales || 0;
      summary.totalOrders += result.summary.total_orders || 0;
      summary.totalPatients += result.summary.total_patients || 0;
      summary.totalProductsSold += result.summary.products_sold || 0;
      summary.totalAlerts += result.summary.new_alerts || 0;
    });

    if (summary.daysWithData > 0) {
      summary.averageDailySales = summary.totalSales / summary.daysWithData;
      summary.averageDailyOrders = summary.totalOrders / summary.daysWithData;
    }

    return summary;
  }

  /**
   * Clean up old reports (optional maintenance task)
   * Remove reports older than specified retention period
   */
  async cleanupOldReports(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      logger.info(`Starting cleanup of reports older than ${retentionDays} days`, {
        cutoffDate: cutoffDate.toDateString()
      });

      // Clean up old daily reports
      const deletedDailyReports = await this.prisma.dailyReport.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        }
      });

      // Clean up old sales reports
      const deletedSalesReports = await this.prisma.salesReport.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        }
      });

      // Clean up acknowledged stock alerts
      const deletedStockAlerts = await this.prisma.stockAlert.deleteMany({
        where: {
          acknowledged: true,
          acknowledged_at: {
            lt: cutoffDate
          }
        }
      });

      logger.info('Completed report cleanup', {
        deletedDailyReports: deletedDailyReports.count,
        deletedSalesReports: deletedSalesReports.count,
        deletedStockAlerts: deletedStockAlerts.count
      });

    } catch (error) {
      logger.error('Failed to cleanup old reports', error, 'SCHEDULER');
      throw error;
    }
  }
}

// Export singleton instance
let schedulerInstance: SchedulerService | null = null;

export const getSchedulerService = (prisma: PrismaClient): SchedulerService => {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService(prisma);
  }
  return schedulerInstance;
};
