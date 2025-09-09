# 📊 Reports System Setup Guide

## Overview

This guide explains how to set up the automated report generation system that creates:
- **Daily Reports**: Sales summary, order counts, patient counts
- **Sales Reports**: Product-wise sales data 
- **Stock Alerts**: Low stock and out-of-stock notifications
- **Stock Movements**: Automatic tracking of inventory changes

## 🏗️ Architecture

### Data Generation Sources

| Report Type | Source | Generation Method |
|-------------|--------|-------------------|
| **Daily Reports** | Backend Service | ✅ Automated + Manual |
| **Sales Reports** | Backend Service | ✅ Automated + Manual |
| **Stock Movements** | Backend Triggers | ✅ Automatic on operations |
| **Stock Alerts** | Backend Service | ✅ Automated + Manual |

### Why Backend Generation?

1. **Performance**: Large data aggregation is faster on server
2. **Consistency**: Ensures data integrity and accuracy
3. **Automation**: Can run scheduled jobs
4. **Security**: Sensitive calculations on secure server
5. **Scalability**: Handles large datasets efficiently

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install node-cron
npm install --save-dev @types/node-cron
```

### 2. Database Schema

The reports system uses existing tables:
- `dailyReport` - Daily summaries
- `salesReport` - Product sales data
- `stockMovement` - Inventory movements
- `stockAlert` - Stock alerts

No additional migrations needed!

### 3. Service Configuration

The system includes:

- **ReportService** (`/src/services/ReportService.ts`)
  - Generate sales reports from order data
  - Create stock alerts based on reorder points
  - Generate comprehensive daily reports

- **SchedulerService** (`/src/services/SchedulerService.ts`)
  - Automated daily report generation
  - Hourly stock monitoring
  - Weekly summary reports
  - Old report cleanup

### 4. GraphQL API

New mutations available:

```graphql
# Generate sales reports for a specific date
mutation GenerateSalesReports($date: DateTime!) {
  generateSalesReports(date: $date) {
    success
    message
    reports {
      id
      product_name
      quantity_sold
      total_sales
    }
    count
  }
}

# Generate stock alerts
mutation GenerateStockAlerts {
  generateStockAlerts {
    success
    message
    alerts {
      id
      alert_type
      alert_message
      product {
        product_name
        stock_quantity
      }
    }
    count
  }
}

# Generate comprehensive daily report
mutation GenerateComprehensiveDailyReport($date: DateTime!) {
  generateComprehensiveDailyReport(date: $date) {
    dailyReport {
      id
      total_sales
      total_orders
      total_patients
    }
    salesReports {
      id
      product_name
      quantity_sold
    }
    stockAlerts {
      id
      alert_type
    }
    summary {
      total_sales
      products_sold
      new_alerts
    }
  }
}
```

## ⏰ Automated Scheduling

### Option 1: Node Cron (Development)

```bash
# Start cron jobs
npm run cron start

# Test manually
npm run cron test
```

### Option 2: PM2 (Production)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'reports-scheduler',
      script: './src/scripts/setup-cron-jobs.ts',
      interpreter: 'ts-node',
      cron_restart: '0 0 * * *', // Daily restart
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
```

### Option 3: System Cron

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily reports at 11:59 PM
59 23 * * * cd /path/to/backend && npm run generate-daily-report

# Hourly stock check during business hours
0 8-20 * * * cd /path/to/backend && npm run check-stock-alerts
```

## 📅 Schedule Overview

| Task | Frequency | Time | Purpose |
|------|-----------|------|---------|
| Daily Reports | Daily | 11:59 PM | End of day summary |
| Stock Alerts | Hourly | 8 AM - 8 PM | Business hours monitoring |
| Critical Stock Check | Every 30 min | 8 AM - 8 PM | Urgent alerts |
| Weekly Summary | Weekly | Sunday 11:30 PM | Week-end analysis |
| Cleanup Old Reports | Monthly | 1st day 2 AM | Maintenance |

## 🔄 Data Flow

```
1. Orders Created → Stock Movements Generated (Automatic)
2. Stock Changes → Stock Alerts Checked (Automatic)
3. End of Day → Daily Reports Generated (Scheduled)
4. Daily Reports → Sales Reports Generated (Scheduled)
5. Frontend → Queries Reports (On-demand)
```

## 🧪 Testing

### Manual Testing

```bash
# Test daily report generation
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { generateDailyReport(date: \"2024-01-15T00:00:00Z\") { id total_sales total_orders } }"
  }'

# Test sales report generation  
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { generateSalesReports(date: \"2024-01-15T00:00:00Z\") { success count } }"
  }'
```

### Automated Testing

```typescript
// Example test
import { ReportService } from '../services/ReportService';

describe('Report Generation', () => {
  it('should generate daily reports correctly', async () => {
    const reportService = new ReportService(prisma);
    const result = await reportService.generateSalesReports(new Date());
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});
```

## 🔧 Configuration

### Environment Variables

```env
# Report generation settings
REPORTS_ENABLED=true
REPORTS_TIMEZONE=Asia/Bangkok
REPORTS_RETENTION_DAYS=90

# Stock alert thresholds
CRITICAL_STOCK_THRESHOLD=5
LOW_STOCK_MULTIPLIER=1.5

# Scheduling
CRON_DAILY_REPORTS="59 23 * * *"
CRON_STOCK_CHECK="0 8-20 * * *"
```

### Performance Tuning

```typescript
// Adjust batch sizes in ReportService
const BATCH_SIZE = 1000; // Process 1000 orders at a time
const MAX_CONCURRENT = 5; // Max 5 concurrent operations
```

## 🚨 Monitoring

### Log Monitoring

```bash
# Watch report generation logs
tail -f logs/reports.log | grep "REPORT_GENERATION"

# Monitor critical alerts
tail -f logs/reports.log | grep "CRITICAL_STOCK_ALERT"
```

### Health Checks

```typescript
// Add to health check endpoint
app.get('/health/reports', async (req, res) => {
  const lastReport = await prisma.dailyReport.findFirst({
    orderBy: { created_at: 'desc' }
  });
  
  const isHealthy = lastReport && 
    (Date.now() - lastReport.created_at.getTime()) < 48 * 60 * 60 * 1000; // 48 hours
    
  res.json({ healthy: isHealthy, lastReport: lastReport?.created_at });
});
```

## 🔐 Security

### Permissions

- Only `admin` and `staff` roles can generate reports
- Rate limiting applied to prevent abuse
- All operations logged for audit trail

### Data Privacy

- Reports contain aggregated data only
- Personal patient information excluded
- Sensitive operations logged with user context

## 🆘 Troubleshooting

### Common Issues

1. **Reports not generating**
   - Check cron job status: `ps aux | grep cron`
   - Verify database connectivity
   - Check logs for errors

2. **Missing sales data**
   - Ensure orders have `completed` status
   - Check date range filters
   - Verify order items exist

3. **Stock alerts not working**
   - Check product `reorder_point` values
   - Verify product `status` is `active`
   - Review stock movement logs

### Debug Commands

```bash
# Check recent reports
SELECT * FROM dailyReport ORDER BY created_at DESC LIMIT 5;

# Check stock movements
SELECT * FROM stockMovement WHERE created_at > NOW() - INTERVAL 1 DAY;

# Check pending alerts
SELECT * FROM stockAlert WHERE acknowledged = false;
```

## 📚 API Documentation

### Frontend Integration

The frontend already includes GraphQL queries for:
- `getDailyReports()`
- `getSalesReports()`  
- `getStockAlerts()`
- `getStockMovements()`

See `/frontend/src/clients/graphql.ts` for full API.

### Real-time Updates

Consider adding WebSocket subscriptions for:
- New stock alerts
- Report generation completion
- Critical inventory updates

## 🎯 Next Steps

1. **Implement push notifications** for critical alerts
2. **Add email reports** for weekly summaries  
3. **Create dashboard widgets** for real-time metrics
4. **Set up data backup** for report archives
5. **Add more granular permissions** for different report types

---

**Need Help?** Check the logs first, then review this guide. For complex issues, examine the service code in `/src/services/`.

