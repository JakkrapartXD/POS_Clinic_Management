import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

export class ReportService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate Sales Reports automatically
   * Should be called daily via cron job or manually
   */
  async generateSalesReports(reportDate: Date, userId?: string, username?: string): Promise<any[]> {
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get all completed orders for the date
      const orders = await this.prisma.order.findMany({
        where: {
          order_date: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'completed'
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      // Aggregate sales by product
      const productSales = new Map<string, {
        productId: string;
        product_name: string;
        quantity_sold: number;
        total_sales: number;
      }>();

      orders.forEach(order => {
        order.orderItems.forEach(item => {
          const existingSales = productSales.get(item.productId);
          
          if (existingSales) {
            existingSales.quantity_sold += item.quantity;
            existingSales.total_sales += item.total_price;
          } else {
            productSales.set(item.productId, {
              productId: item.productId,
              product_name: item.product.product_name,
              quantity_sold: item.quantity,
              total_sales: item.total_price
            });
          }
        });
      });

      // Create sales reports
      const salesReports = [];
      
      for (const [productId, salesData] of productSales) {
        // Check if report already exists
        const existingReport = await this.prisma.salesReport.findFirst({
          where: {
            productId,
            report_date: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        if (!existingReport) {
          const salesReport = await this.prisma.salesReport.create({
            data: {
              report_date: reportDate,
              productId,
              quantity_sold: salesData.quantity_sold,
              total_sales: salesData.total_sales,
              createdByUserId: userId,
              created_by_username: username
            },
            include: {
              product: {
                select: {
                  product_name: true,
                  unit: true
                }
              }
            }
          });

          salesReports.push(salesReport);
        }
      }

      logger.info(`Generated ${salesReports.length} sales reports for ${reportDate.toDateString()}`);
      return salesReports;

    } catch (error) {
      logger.error('Error generating sales reports', error);
      throw error;
    }
  }

  /**
   * Generate Stock Alerts based on reorder points
   */
  async generateStockAlerts(userId?: string, username?: string): Promise<any[]> {
    try {
      // Find products with low stock
      const lowStockProducts = await this.prisma.product.findMany({
        where: {
          stock_quantity: {
            lte: this.prisma.product.fields.reorder_point
          },
          status: 'active'
        }
      });

      const alerts = [];

      for (const product of lowStockProducts) {
        // Check if alert already exists and not acknowledged
        const existingAlert = await this.prisma.stockAlert.findFirst({
          where: {
            productId: product.id,
            acknowledged: false
          }
        });

        if (!existingAlert) {
          let alertType = 'low_stock';
          let alertMessage = `Product "${product.product_name}" is running low. Current stock: ${product.stock_quantity}, Reorder point: ${product.reorder_point}`;

          if (product.stock_quantity === 0) {
            alertType = 'out_of_stock';
            alertMessage = `Product "${product.product_name}" is out of stock!`;
          }

          const alert = await this.prisma.stockAlert.create({
            data: {
              productId: product.id,
              alert_type: alertType,
              alert_message: alertMessage,
              acknowledged: false,
              createdByUserId: userId,
              created_by_username: username
            },
            include: {
              product: {
                select: {
                  product_name: true,
                  stock_quantity: true,
                  reorder_point: true
                }
              }
            }
          });

          alerts.push(alert);
        }
      }

      logger.info(`Generated ${alerts.length} stock alerts`);
      return alerts;

    } catch (error) {
      logger.error('Error generating stock alerts', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive daily report with sales reports
   */
  async generateComprehensiveDailyReport(reportDate: Date, userId?: string, username?: string) {
    try {
      // Generate daily report
      const dailyReport = await this.generateDailyReport(reportDate, userId, username);
      
      // Generate sales reports for the same date
      const salesReports = await this.generateSalesReports(reportDate, userId, username);
      
      // Generate stock alerts
      const stockAlerts = await this.generateStockAlerts(userId, username);

      return {
        dailyReport,
        salesReports,
        stockAlerts,
        summary: {
          total_sales: dailyReport.total_sales,
          total_orders: dailyReport.total_orders,
          total_patients: dailyReport.total_patients,
          products_sold: salesReports.length,
          new_alerts: stockAlerts.length
        }
      };

    } catch (error) {
      logger.error('Error generating comprehensive daily report', error);
      throw error;
    }
  }

  private async generateDailyReport(reportDate: Date, userId?: string, username?: string) {
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if report already exists
    const existingReport = await this.prisma.dailyReport.findFirst({
      where: {
        report_date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (existingReport) {
      return existingReport;
    }

    // Calculate metrics for the day
    const [orders, totalSales, patientCount] = await Promise.all([
      this.prisma.order.count({
        where: {
          order_date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      this.prisma.order.aggregate({
        where: {
          order_date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        _sum: {
          total_amount: true
        }
      }),
      this.prisma.patient.count({
        where: {
          created_at: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
    ]);

    const dailyReport = await this.prisma.dailyReport.create({
      data: {
        report_date: reportDate,
        total_sales: totalSales._sum.total_amount || 0,
        total_orders: orders,
        total_patients: patientCount,
        createdByUserId: userId,
        created_by_username: username
      }
    });

    return dailyReport;
  }
}

