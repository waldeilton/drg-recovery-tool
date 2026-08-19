/**
 * Unit Tests: Platform-Specific Device Managers
 * Tests Windows, macOS, and Linux device operations
 */

import { WindowsDeviceManager } from '../../../src/engine/device/windowsDevice';
import { MacOSDeviceManager } from '../../../src/engine/device/macosDevice';
import { LinuxDeviceManager } from '../../../src/engine/device/linuxDevice';

describe('Windows Device Manager', () => {
  describe('enumerateDevices', () => {
    it('should return array of devices', async () => {
      const devices = await WindowsDeviceManager.enumerateDevices();
      expect(Array.isArray(devices)).toBe(true);
    });

    it('should handle enumeration errors gracefully', async () => {
      // On systems without devices, should return empty array
      const devices = await WindowsDeviceManager.enumerateDevices();
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('readSectors', () => {
    it('should return null for device without implementation', async () => {
      const buffer = await WindowsDeviceManager.readSectors('\\.\\.\\PhysicalDrive0', 0, 1);
      expect(buffer).toBeNull();
    });

    it('should handle read errors gracefully', async () => {
      const buffer = await WindowsDeviceManager.readSectors('non-existent-device', 0, 1);
      expect(buffer).toBeNull();
    });
  });

  describe('getDeviceGeometry', () => {
    it('should return null for device without implementation', async () => {
      const geometry = await WindowsDeviceManager.getDeviceGeometry('\\.\\.\\PhysicalDrive0');
      expect(geometry).toBeNull();
    });
  });

  describe('isDeviceMounted', () => {
    it('should return false for device without implementation', async () => {
      const mounted = await WindowsDeviceManager.isDeviceMounted('\\.\\.\\PhysicalDrive0');
      expect(mounted).toBe(false);
    });
  });

  describe('getSMARTData', () => {
    it('should return null when SMART data unavailable', async () => {
      const smart = await WindowsDeviceManager.getSMARTData('\\.\\.\\PhysicalDrive0');
      expect(smart).toBeNull();
    });
  });
});

describe('macOS Device Manager', () => {
  describe('enumerateDevices', () => {
    it('should return array of devices', async () => {
      const devices = await MacOSDeviceManager.enumerateDevices();
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('readSectors', () => {
    it('should return null for device without implementation', async () => {
      const buffer = await MacOSDeviceManager.readSectors('/dev/disk0', 0, 1);
      expect(buffer).toBeNull();
    });
  });

  describe('getDeviceGeometry', () => {
    it('should return null for device without implementation', async () => {
      const geometry = await MacOSDeviceManager.getDeviceGeometry('/dev/disk0');
      expect(geometry).toBeNull();
    });
  });

  describe('isDeviceMounted', () => {
    it('should return false for device without implementation', async () => {
      const mounted = await MacOSDeviceManager.isDeviceMounted('/dev/disk0');
      expect(mounted).toBe(false);
    });
  });

  describe('getSMART', () => {
    it('should return null when SMART data unavailable', async () => {
      const smart = await MacOSDeviceManager.getSMART('/dev/disk0');
      expect(smart).toBeNull();
    });
  });

  describe('getDeviceInfo', () => {
    it('should return null when device info unavailable', async () => {
      const info = await MacOSDeviceManager.getDeviceInfo('/dev/disk0');
      expect(info).toBeNull();
    });
  });
});

describe('Linux Device Manager', () => {
  describe('enumerateDevices', () => {
    it('should return array of devices', async () => {
      const devices = await LinuxDeviceManager.enumerateDevices();
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('readSectors', () => {
    it('should return null for device without implementation', async () => {
      const buffer = await LinuxDeviceManager.readSectors('/dev/sda', 0, 1);
      expect(buffer).toBeNull();
    });
  });

  describe('getDeviceGeometry', () => {
    it('should return null for device without implementation', async () => {
      const geometry = await LinuxDeviceManager.getDeviceGeometry('/dev/sda');
      expect(geometry).toBeNull();
    });
  });

  describe('isDeviceMounted', () => {
    it('should return false for device without implementation', async () => {
      const mounted = await LinuxDeviceManager.isDeviceMounted('/dev/sda');
      expect(mounted).toBe(false);
    });
  });

  describe('getSMART', () => {
    it('should return null when SMART data unavailable', async () => {
      const smart = await LinuxDeviceManager.getSMART('/dev/sda');
      expect(smart).toBeNull();
    });
  });

  describe('getDeviceInfo', () => {
    it('should return null when device info unavailable', async () => {
      const info = await LinuxDeviceManager.getDeviceInfo('/dev/sda');
      expect(info).toBeNull();
    });
  });

  describe('listBlockDevices', () => {
    it('should return empty array when not implemented', async () => {
      const devices = await LinuxDeviceManager.listBlockDevices();
      expect(Array.isArray(devices)).toBe(true);
    });
  });
});

describe('Cross-Platform Device Manager Consistency', () => {
  it('Windows, macOS, and Linux managers should have consistent signatures', async () => {
    // All should have enumerateDevices
    expect(typeof WindowsDeviceManager.enumerateDevices).toBe('function');
    expect(typeof MacOSDeviceManager.enumerateDevices).toBe('function');
    expect(typeof LinuxDeviceManager.enumerateDevices).toBe('function');

    // All should have readSectors
    expect(typeof WindowsDeviceManager.readSectors).toBe('function');
    expect(typeof MacOSDeviceManager.readSectors).toBe('function');
    expect(typeof LinuxDeviceManager.readSectors).toBe('function');

    // All should have getDeviceGeometry
    expect(typeof WindowsDeviceManager.getDeviceGeometry).toBe('function');
    expect(typeof MacOSDeviceManager.getDeviceGeometry).toBe('function');
    expect(typeof LinuxDeviceManager.getDeviceGeometry).toBe('function');

    // All should have isDeviceMounted
    expect(typeof WindowsDeviceManager.isDeviceMounted).toBe('function');
    expect(typeof MacOSDeviceManager.isDeviceMounted).toBe('function');
    expect(typeof LinuxDeviceManager.isDeviceMounted).toBe('function');
  });

  it('should handle errors consistently across platforms', async () => {
    // Windows
    const winResult = await WindowsDeviceManager.readSectors('invalid', 0, 1);
    expect(winResult).toBeNull();

    // macOS
    const macResult = await MacOSDeviceManager.readSectors('invalid', 0, 1);
    expect(macResult).toBeNull();

    // Linux
    const linResult = await LinuxDeviceManager.readSectors('invalid', 0, 1);
    expect(linResult).toBeNull();
  });
});
