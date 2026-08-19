/**
 * Device Manager Tests
 */

import { DeviceManager, type StorageDevice } from '../../../src/engine/device/deviceManager';

describe('DeviceManager', () => {
  let deviceManager: DeviceManager;

  beforeEach(() => {
    deviceManager = new DeviceManager();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await deviceManager.initialize();
      expect(deviceManager.isReady()).toBe(true);
    });

    it('should enumerate devices on initialization', async () => {
      await deviceManager.initialize();
      const devices = deviceManager.getDevices();
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('Device Enumeration', () => {
    beforeEach(async () => {
      await deviceManager.initialize();
    });

    it('should return all detected devices', async () => {
      const devices = await deviceManager.enumerateDevices();
      expect(Array.isArray(devices)).toBe(true);
    });

    it('should provide access to devices after enumeration', () => {
      const devices = deviceManager.getDevices();
      expect(Array.isArray(devices)).toBe(true);
    });

    it('should return undefined for non-existent device', () => {
      const device = deviceManager.getDevice('non-existent-id');
      expect(device).toBeUndefined();
    });
  });

  describe('File System Identification', () => {
    beforeEach(async () => {
      await deviceManager.initialize();
    });

    it('should handle non-existent device gracefully', async () => {
      const fsInfo = await deviceManager.identifyFileSystem('non-existent-id');
      expect(fsInfo).toBeNull();
    });
  });

  describe('Sector Reading', () => {
    beforeEach(async () => {
      await deviceManager.initialize();
    });

    it('should handle non-existent device gracefully', async () => {
      const sectors = await deviceManager.readSectors('non-existent-id', 0, 8);
      expect(sectors).toBeNull();
    });

    it('should validate sector parameters', async () => {
      // Should handle gracefully without errors
      const sectors = await deviceManager.readSectors('test-device', 0, 0);
      expect(sectors).toBeNull();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await deviceManager.initialize();
      expect(deviceManager.isReady()).toBe(true);

      await deviceManager.shutdown();
      expect(deviceManager.isReady()).toBe(false);
    });
  });
});
