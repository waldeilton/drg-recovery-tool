/**
 * Recovery Service Tests
 */

import { RecoveryService, type ScanResult } from '../../../src/services/recovery/recoveryService';
import type { AppConfig } from '../../../src/app';

describe('RecoveryService', () => {
  let recoveryService: RecoveryService;
  const mockConfig: AppConfig = {
    logLevel: 'debug',
    maxConcurrentScans: 1,
    tempDir: '/tmp/test',
  };

  beforeEach(async () => {
    recoveryService = new RecoveryService(mockConfig);
    await recoveryService.initialize();
  });

  describe('Quick Scan', () => {
    it('should start a quick scan', async () => {
      const scan = await recoveryService.startQuickScan('test-device');

      expect(scan).toBeDefined();
      expect(scan.scanType).toBe('quick');
      expect(scan.status).toBe('running');
      expect(scan.deviceId).toBe('test-device');
      expect(scan.progress).toBe(0);
    });

    it('should generate unique scan IDs', async () => {
      const scan1 = await recoveryService.startQuickScan('device-1');
      const scan2 = await recoveryService.startQuickScan('device-2');

      expect(scan1.scanId).not.toBe(scan2.scanId);
    });

    it('should retrieve scan by ID', async () => {
      const scan = await recoveryService.startQuickScan('test-device');
      const retrieved = recoveryService.getScanResult(scan.scanId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.scanId).toBe(scan.scanId);
    });
  });

  describe('Deep Scan', () => {
    it('should start a deep scan', async () => {
      const scan = await recoveryService.startDeepScan('test-device');

      expect(scan).toBeDefined();
      expect(scan.scanType).toBe('deep');
      expect(scan.status).toBe('running');
      expect(scan.deviceId).toBe('test-device');
    });

    it('should support both quick and deep scans simultaneously', async () => {
      const quickScan = await recoveryService.startQuickScan('device-1');
      const deepScan = await recoveryService.startDeepScan('device-2');

      expect(quickScan.scanType).toBe('quick');
      expect(deepScan.scanType).toBe('deep');
      expect(quickScan.scanId).not.toBe(deepScan.scanId);
    });
  });

  describe('Scan Control', () => {
    let scan: ScanResult;

    beforeEach(async () => {
      scan = await recoveryService.startQuickScan('test-device');
    });

    it('should pause a running scan', () => {
      const paused = recoveryService.pauseScan(scan.scanId);
      expect(paused).toBe(true);

      const updated = recoveryService.getScanResult(scan.scanId);
      expect(updated?.status).toBe('paused');
    });

    it('should resume a paused scan', () => {
      recoveryService.pauseScan(scan.scanId);
      const resumed = recoveryService.resumeScan(scan.scanId);

      expect(resumed).toBe(true);

      const updated = recoveryService.getScanResult(scan.scanId);
      expect(updated?.status).toBe('running');
    });

    it('should cancel a scan', () => {
      const cancelled = recoveryService.cancelScan(scan.scanId);
      expect(cancelled).toBe(true);

      const updated = recoveryService.getScanResult(scan.scanId);
      expect(updated?.status).toBe('failed');
      expect(updated?.endTime).toBeDefined();
    });

    it('should handle operations on non-existent scans', () => {
      const paused = recoveryService.pauseScan('non-existent');
      const resumed = recoveryService.resumeScan('non-existent');
      const cancelled = recoveryService.cancelScan('non-existent');

      expect(paused).toBe(false);
      expect(resumed).toBe(false);
      // Cancel returns false for non-existent, but logs a warning
      expect(cancelled).toBe(false);
    });
  });

  describe('File Recovery', () => {
    it('should initiate file recovery', async () => {
      const scan = await recoveryService.startQuickScan('test-device');
      const recoveryId = await recoveryService.recoverFiles(scan.scanId, ['file1', 'file2']);

      expect(recoveryId).toBeDefined();
      expect(recoveryId.startsWith('recovery_')).toBe(true);
    });

    it('should handle recovery from non-existent scan', async () => {
      await expect(recoveryService.recoverFiles('non-existent', ['file1'])).rejects.toThrow(
        'Scan not found',
      );
    });
  });

  describe('Shutdown', () => {
    it('should shutdown and pause running scans', async () => {
      const scan = await recoveryService.startQuickScan('test-device');
      expect(scan.status).toBe('running');

      await recoveryService.shutdown();

      const updated = recoveryService.getScanResult(scan.scanId);
      expect(updated?.status).toBe('paused');
    });
  });
});
