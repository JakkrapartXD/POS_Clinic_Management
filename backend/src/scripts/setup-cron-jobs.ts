#!/usr/bin/env ts-node

/**
 * Setup Cron Jobs for Automated Report Generation
 * 
 * This script demonstrates how to set up automated report generation
 * using node-cron or a similar scheduling library.
 * 
 * Usage:
 * npm run setup-cron
 * 
 * Or in production with PM2:
 * pm2 start ecosystem.config.js
 */

import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { getSchedulerService } from '../services/SchedulerService';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

async function setupCronJobs() {
  const schedulerService = getSchedulerService(prisma);

  logger.info('Setting up automated report generation cron jobs...');

  // Daily report generation - every day at 11:59 PM
  cron.schedule('59 23 * * *', async () => {
    logger.info('Starting scheduled daily report generation...');
    try {
      await schedulerService.runDailyReportGeneration();
      logger.info('Completed scheduled daily report generation');
    } catch (error) {
      logger.error('Failed scheduled daily report generation', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Bangkok" // Adjust to your timezone
  });

  // Hourly stock check - every hour during business hours (8 AM - 8 PM)
  cron.schedule('0 8-20 * * *', async () => {
    logger.info('Starting scheduled hourly stock check...');
    try {
      await schedulerService.runHourlyStockCheck();
      logger.info('Completed scheduled hourly stock check');
    } catch (error) {
      logger.error('Failed scheduled hourly stock check', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Bangkok"
  });

  // Weekly report generation - every Sunday at 11:30 PM
  cron.schedule('30 23 * * 0', async () => {
    logger.info('Starting scheduled weekly report generation...');
    try {
      await schedulerService.runWeeklyReportGeneration();
      logger.info('Completed scheduled weekly report generation');
    } catch (error) {
      logger.error('Failed scheduled weekly report generation', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Bangkok"
  });

  // Monthly cleanup - first day of month at 2 AM
  cron.schedule('0 2 1 * *', async () => {
    logger.info('Starting scheduled monthly cleanup...');
    try {
      await schedulerService.cleanupOldReports(90); // Keep 90 days
      logger.info('Completed scheduled monthly cleanup');
    } catch (error) {
      logger.error('Failed scheduled monthly cleanup', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Bangkok"
  });

  // Critical stock check - every 30 minutes during business hours
  cron.schedule('*/30 8-20 * * *', async () => {
    logger.info('Starting critical stock check...');
    try {
      await schedulerService.runHourlyStockCheck();
    } catch (error) {
      logger.error('Failed critical stock check', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Bangkok"
  });

  logger.info('All cron jobs have been scheduled successfully');
  logger.info('Cron jobs schedule:');
  logger.info('- Daily reports: Every day at 11:59 PM');
  logger.info('- Hourly stock check: Every hour (8 AM - 8 PM)');
  logger.info('- Weekly reports: Every Sunday at 11:30 PM');
  logger.info('- Monthly cleanup: First day of month at 2 AM');
  logger.info('- Critical stock check: Every 30 minutes (8 AM - 8 PM)');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Manual run functions for testing
async function runManualTests() {
  const schedulerService = getSchedulerService(prisma);

  logger.info('Running manual tests for report generation...');

  try {
    // Test daily report generation
    logger.info('Testing daily report generation...');
    await schedulerService.runDailyReportGeneration();
    
    // Test stock check
    logger.info('Testing stock alert generation...');
    await schedulerService.runHourlyStockCheck();
    
    logger.info('Manual tests completed successfully');
  } catch (error) {
    logger.error('Manual tests failed', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'start':
    setupCronJobs();
    break;
  case 'test':
    runManualTests().then(() => process.exit(0));
    break;
  default:
    console.log('Usage:');
    console.log('  npm run cron start  - Start automated cron jobs');
    console.log('  npm run cron test   - Run manual tests');
    process.exit(1);
}

export default setupCronJobs;

