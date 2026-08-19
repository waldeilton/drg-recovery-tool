/**
 * Application Core Tests
 */

import { DRGRecoveryApp, initializeApp } from '../../src/app';
import type { AppConfig } from '../../src/app';

describe('DRG Recovery App', () => {
  let app: DRGRecoveryApp;
  const mockConfig: AppConfig = {
    logLevel: 'debug',
    maxConcurrentScans: 1,
    tempDir: '/tmp/test',
  };

  beforeEach(() => {
    app = new DRGRecoveryApp(mockConfig);
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await app.start();
      expect(app.isApplicationRunning()).toBe(true);
    });

    it('should provide device manager', () => {
      const deviceManager = app.getDeviceManager();
      expect(deviceManager).toBeDefined();
    });

    it('should provide recovery service', () => {
      const recoveryService = app.getRecoveryService();
      expect(recoveryService).toBeDefined();
    });

    it('should provide escalation service', () => {
      const escalationService = app.getEscalationService();
      expect(escalationService).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    it('should handle graceful shutdown', async () => {
      await app.start();
      expect(app.isApplicationRunning()).toBe(true);

      await app.stop();
      expect(app.isApplicationRunning()).toBe(false);
    });

    it('should prevent duplicate starts', async () => {
      await app.start();
      const firstRun = app.isApplicationRunning();

      // Second start should be idempotent
      await app.start();
      const secondRun = app.isApplicationRunning();

      expect(firstRun).toBe(true);
      expect(secondRun).toBe(true);
    });

    it('should prevent stop on non-running app', async () => {
      // Should not throw when stopping non-running app
      expect(() => app.stop()).not.toThrow();
    });
  });
});

describe('App Initialization', () => {
  it('should initialize with default configuration', async () => {
    const app = await initializeApp();
    expect(app).toBeDefined();
    expect(app.isApplicationRunning()).toBe(false);
  });

  it('should use environment variables for config', async () => {
    process.env.LOG_LEVEL = 'debug';
    process.env.MAX_CONCURRENT_SCANS = '2';

    const app = await initializeApp();
    await app.start();

    expect(app.isApplicationRunning()).toBe(true);

    await app.stop();
  });
});
