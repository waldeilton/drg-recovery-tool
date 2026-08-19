/**
 * Integration Tests: End-to-End Recovery Workflow
 * Tests the complete recovery flow from device detection to file extraction
 */

import { DRGRecoveryApp, initializeApp } from '../../src/app';
import type { StorageDevice, FileSystemInfo } from '../../src/engine/device/deviceManager';
import type { ScanResult, RecoveredFile } from '../../src/services/recovery/recoveryService';
import type { EscalationCase } from '../../src/services/escalation/escalationService';

describe('End-to-End Recovery Workflow', () => {
  let app: DRGRecoveryApp;

  beforeEach(async () => {
    app = await initializeApp();
    await app.start();
  });

  afterEach(async () => {
    await app.stop();
  });

  describe('Device Detection → Scanning → Recovery', () => {
    it('should detect devices', async () => {
      const deviceManager = app.getDeviceManager();
      const devices = deviceManager.getDevices();

      // On test systems, we may have 0 devices, which is OK
      expect(Array.isArray(devices)).toBe(true);
    });

    it('should handle scanning workflow', async () => {
      const recoveryService = app.getRecoveryService();

      // Start quick scan on hypothetical device
      const scan = await recoveryService.startQuickScan('test-device');

      expect(scan.scanType).toBe('quick');
      expect(scan.status).toBe('running');

      // Verify we can pause/resume
      const paused = recoveryService.pauseScan(scan.scanId);
      expect(paused).toBe(true);

      const resumed = recoveryService.resumeScan(scan.scanId);
      expect(resumed).toBe(true);

      // Cleanup
      recoveryService.cancelScan(scan.scanId);
    });

    it('should handle escalation workflow', async () => {
      const escalationService = app.getEscalationService();

      const escalationCase = await escalationService.submitCase({
        userId: 'test-user',
        deviceInfo: {
          type: 'HDD',
          size: 1099511627776, // 1TB
          fileSystem: 'NTFS',
        },
        issue: 'Accidental formatting',
        estimatedDataValue: 5000,
        urgency: 'high',
      });

      expect(escalationCase.caseId).toBeDefined();
      expect(escalationCase.status).toBe('submitted');
      expect(escalationCase.urgency).toBe('high');
    });
  });

  describe('Quick Scan vs Deep Scan', () => {
    it('should support both scan types simultaneously', async () => {
      const recoveryService = app.getRecoveryService();

      const quickScan = await recoveryService.startQuickScan('device-1');
      const deepScan = await recoveryService.startDeepScan('device-2');

      expect(quickScan.scanType).toBe('quick');
      expect(deepScan.scanType).toBe('deep');
      expect(quickScan.scanId).not.toBe(deepScan.scanId);

      // Both can run independently
      recoveryService.pauseScan(quickScan.scanId);
      expect(quickScan.status).toBe('paused');
      expect(deepScan.status).toBe('running');

      recoveryService.cancelScan(quickScan.scanId);
      recoveryService.cancelScan(deepScan.scanId);
    });
  });

  describe('Recovery Initiation', () => {
    it('should initiate file recovery from scan', async () => {
      const recoveryService = app.getRecoveryService();

      const scan = await recoveryService.startQuickScan('test-device');
      const recoveryId = await recoveryService.recoverFiles(scan.scanId, ['file1', 'file2', 'file3']);

      expect(recoveryId).toBeDefined();
      expect(recoveryId.startsWith('recovery_')).toBe(true);
    });
  });

  describe('Service Lifecycle', () => {
    it('should maintain service availability throughout workflow', async () => {
      const deviceManager = app.getDeviceManager();
      const recoveryService = app.getRecoveryService();
      const escalationService = app.getEscalationService();

      expect(app.isApplicationRunning()).toBe(true);

      // Services should be accessible
      expect(deviceManager).toBeDefined();
      expect(recoveryService).toBeDefined();
      expect(escalationService).toBeDefined();

      // Shutdown should clean up gracefully
      await app.stop();
      expect(app.isApplicationRunning()).toBe(false);
    });
  });
});

describe('Error Handling in Workflow', () => {
  let app: DRGRecoveryApp;

  beforeEach(async () => {
    app = await initializeApp();
    await app.start();
  });

  afterEach(async () => {
    await app.stop();
  });

  it('should handle non-existent device gracefully', async () => {
    const recoveryService = app.getRecoveryService();

    // Should handle invalid device gracefully
    const scan = await recoveryService.startQuickScan('non-existent-device');
    expect(scan.scanType).toBe('quick');
    expect(scan.status).toBe('running');
  });

  it('should handle escalation for non-existent cases', async () => {
    const escalationService = app.getEscalationService();

    const status = escalationService.getCaseStatus('non-existent-case');
    expect(status).toBeUndefined();
  });

  it('should prevent invalid scan operations', async () => {
    const recoveryService = app.getRecoveryService();

    // Should handle gracefully
    const paused = recoveryService.pauseScan('non-existent-scan');
    expect(paused).toBe(false);

    const resumed = recoveryService.resumeScan('non-existent-scan');
    expect(resumed).toBe(false);
  });
});
