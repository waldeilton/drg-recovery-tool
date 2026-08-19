/**
 * Application Core
 * Orchestrates initialization and lifecycle
 */

import { Logger } from './utils/logger';
import { DeviceManager } from './engine/device/deviceManager';
import { RecoveryService } from './services/recovery/recoveryService';
import { EscalationService } from './services/escalation/escalationService';

const logger = new Logger('DRG.App');

export interface AppConfig {
  logLevel: string;
  maxConcurrentScans: number;
  tempDir: string;
}

export class DRGRecoveryApp {
  private deviceManager: DeviceManager;
  private recoveryService: RecoveryService;
  private escalationService: EscalationService;
  private isRunning: boolean = false;

  constructor(config: AppConfig) {
    logger.info('Initializing DRG Recovery Tool Application', config);

    this.deviceManager = new DeviceManager();
    this.recoveryService = new RecoveryService(config);
    this.escalationService = new EscalationService();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Application is already running');
      return;
    }

    try {
      logger.info('Starting application components...');

      // Initialize device manager
      await this.deviceManager.initialize();
      logger.info('✓ Device manager initialized');

      // Initialize recovery service
      await this.recoveryService.initialize();
      logger.info('✓ Recovery service initialized');

      // Initialize escalation service
      await this.escalationService.initialize();
      logger.info('✓ Escalation service initialized');

      this.isRunning = true;
      logger.info('✅ Application started successfully');
    } catch (error) {
      logger.error('Failed to start application', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Application is not running');
      return;
    }

    try {
      logger.info('Stopping application components...');

      await this.deviceManager.shutdown();
      await this.recoveryService.shutdown();
      await this.escalationService.shutdown();

      this.isRunning = false;
      logger.info('✅ Application stopped successfully');
    } catch (error) {
      logger.error('Error during application shutdown', error);
      throw error;
    }
  }

  getDeviceManager(): DeviceManager {
    return this.deviceManager;
  }

  getRecoveryService(): RecoveryService {
    return this.recoveryService;
  }

  getEscalationService(): EscalationService {
    return this.escalationService;
  }

  isApplicationRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * Initialize application with default configuration
 */
export async function initializeApp(): Promise<DRGRecoveryApp> {
  const config: AppConfig = {
    logLevel: process.env.LOG_LEVEL || 'info',
    maxConcurrentScans: parseInt(process.env.MAX_CONCURRENT_SCANS || '1', 10),
    tempDir: process.env.TEMP_DIR || '/tmp/drg-recovery',
  };

  const app = new DRGRecoveryApp(config);
  return app;
}
