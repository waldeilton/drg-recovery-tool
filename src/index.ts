/**
 * DRG Recovery Tool - Main Entry Point
 * Professional-grade data recovery. Consumer-simple price.
 *
 * Version: 1.0.0
 * Platform: Windows, macOS, Linux
 */

import { initializeApp } from './app';
import { Logger } from './utils/logger';

const logger = new Logger('DRG.Main');

async function main(): Promise<void> {
  try {
    logger.info('🚀 Starting DRG Recovery Tool v1.0.0');
    logger.info(`📅 Build Date: ${new Date().toISOString()}`);
    logger.info(`🖥️  Platform: ${process.platform}`);

    const app = await initializeApp();
    await app.start();

    logger.info('✅ Application started successfully');
  } catch (error) {
    logger.error('❌ Failed to start application', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.warn('⚠️  Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.warn('⚠️  Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('💥 Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('💥 Unhandled Rejection', reason);
  process.exit(1);
});

// Run application
main();

export default main;
