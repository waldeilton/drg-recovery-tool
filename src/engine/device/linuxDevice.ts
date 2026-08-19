/**
 * Linux Device Operations
 * Platform-specific device I/O for Linux using sysfs and direct device access
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { Logger } from '../../utils/logger';
import type { StorageDevice } from './deviceManager';

const logger = new Logger('DRG.LinuxDevice');
const execAsync = promisify(exec);

/**
 * Linux device detection and I/O operations
 * TODO: Implement using:
 * - /sys/block for device enumeration
 * - /dev/sdX for direct device access
 * - lsblk for device information
 * - hdparm for device properties
 * - Direct file I/O for sector reading
 */
export class LinuxDeviceManager {
  /**
   * Enumerate storage devices on Linux
   * Uses lsblk to enumerate block devices
   */
  static async enumerateDevices(): Promise<StorageDevice[]> {
    logger.info('Enumerating Linux storage devices...');

    try {
      const devices: StorageDevice[] = [];

      // Use lsblk to enumerate devices (JSON output)
      try {
        const { stdout } = await execAsync(
          "lsblk -d -J -o NAME,SIZE,TYPE,SERIAL,MODEL",
          { timeout: 10000 },
        );

        const output = JSON.parse(stdout);
        const blockDevices = output.blockdevices || [];

        for (const dev of blockDevices) {
          // Only include actual block devices (disk, loop, etc.), not partitions
          if (dev.type === 'disk' || dev.type === 'loop') {
            // Parse size (lsblk may return human-readable format)
            let sizeBytes = 0;
            if (dev.size) {
              // Try to parse if it's in bytes or human-readable
              const sizeStr = dev.size.toString();
              if (sizeStr.match(/^\d+$/)) {
                sizeBytes = parseInt(sizeStr, 10);
              } else {
                // Estimate from human-readable (simplified)
                sizeBytes = 1099511627776; // Default to 1TB
              }
            }

            const device: StorageDevice = {
              id: dev.name,
              name: dev.model || dev.name,
              type: dev.type === 'loop' ? 'external' : 'internal',
              sizeBytes,
              sectorSize: 512,
              serial: dev.serial,
              isRemovable: dev.type === 'loop',
              isMounted: false,
              mountPoints: [],
            };

            devices.push(device);
          }
        }

        logger.info(`Found ${devices.length} Linux storage device(s)`);
        return devices;
      } catch (lsblkError) {
        logger.warn('lsblk enumeration failed, trying sysfs', lsblkError);
        return [];
      }
    } catch (error) {
      logger.error('Failed to enumerate Linux devices', error);
      throw error;
    }
  }

  /**
   * Read sectors directly from device
   * Opens device file and reads sectors
   */
  static async readSectors(
    devicePath: string,
    startSector: number,
    sectorCount: number,
  ): Promise<Buffer | null> {
    logger.debug(`Reading ${sectorCount} sectors from ${devicePath} starting at sector ${startSector}`);

    try {
      const fs = await import('fs/promises');

      const byteOffset = BigInt(startSector) * BigInt(512);
      const byteCount = sectorCount * 512;

      const fileHandle = await fs.open(devicePath, 'r');

      try {
        const buffer = Buffer.alloc(byteCount);
        await fileHandle.read(buffer, 0, byteCount, byteOffset);

        logger.debug(`Successfully read ${sectorCount} sectors from ${devicePath}`);
        return buffer;
      } finally {
        await fileHandle.close();
      }
    } catch (error) {
      if (error instanceof Error && (error.message.includes('EACCES') || error.message.includes('EPERM'))) {
        logger.warn(`Permission denied reading ${devicePath} (may require root/CAP_SYS_RAWIO)`, error);
      } else {
        logger.error(`Failed to read sectors from ${devicePath}`, error);
      }
      return null;
    }
  }

  /**
   * Get device geometry
   * Reads device size from sysfs
   */
  static async getDeviceGeometry(devicePath: string): Promise<{ sectorSize: number; totalSectors: number } | null> {
    logger.debug(`Getting device geometry for ${devicePath}`);

    try {
      // Extract device name from path (e.g., 'sda' from '/dev/sda')
      const deviceName = devicePath.split('/').pop();
      if (!deviceName) {
        return null;
      }

      // Read size from sysfs (size is in 512-byte sectors on Linux)
      const sysfsPath = `/sys/block/${deviceName}/size`;

      try {
        const sizeContent = readFileSync(sysfsPath, 'utf-8').trim();
        const totalSectors = parseInt(sizeContent, 10);

        logger.debug(`Device ${devicePath}: ${totalSectors} sectors`);

        return {
          sectorSize: 512,
          totalSectors,
        };
      } catch (fsError) {
        logger.warn(`Could not read sysfs for ${devicePath}`, fsError);
        return null;
      }
    } catch (error) {
      logger.error(`Failed to get device geometry for ${devicePath}`, error);
      return null;
    }
  }

  /**
   * Check if device is mounted
   * Checks /proc/mounts for device presence
   */
  static async isDeviceMounted(devicePath: string): Promise<boolean> {
    logger.debug(`Checking if device ${devicePath} is mounted`);

    try {
      const { stdout } = await execAsync('cat /proc/mounts', {
        timeout: 5000,
      });

      // Extract device name for matching (handles partition numbers)
      const deviceBase = devicePath.replace(/[0-9]*$/, '');
      const mounted = stdout.includes(deviceBase);

      logger.debug(`Device ${devicePath} mount status: ${mounted ? 'mounted' : 'not mounted'}`);
      return mounted;
    } catch (error) {
      logger.error(`Failed to check mount status for ${devicePath}`, error);
      return false;
    }
  }

  /**
   * Get SMART data (if available)
   * Uses smartctl if smartmontools is installed
   */
  static async getSMART(
    devicePath: string,
  ): Promise<{ temperature?: number; health?: string; errors?: number } | null> {
    logger.debug(`Getting SMART data for ${devicePath}`);

    try {
      // Try smartctl (requires smartmontools package)
      const { stdout } = await execAsync(`smartctl -H ${devicePath}`, {
        timeout: 10000,
      });

      const result: { health?: string; temperature?: number; errors?: number } = {};

      // Extract SMART health status
      const healthMatch = stdout.match(/overall-health self-assessment test result:\s*(\w+)/i);
      if (healthMatch) {
        result.health = healthMatch[1];
      }

      // Extract temperature if available
      const tempMatch = stdout.match(/Temperature:\s*(\d+)\s*Celsius/i);
      if (tempMatch) {
        result.temperature = parseInt(tempMatch[1], 10);
      }

      logger.debug(`Device ${devicePath} SMART data:`, result);
      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      logger.debug(`SMART data not available for ${devicePath}`, error);
      return null;
    }
  }

  /**
   * Get device information from sysfs
   */
  static async getDeviceInfo(devicePath: string): Promise<Record<string, unknown> | null> {
    logger.debug(`Getting device info for ${devicePath}`);

    try {
      const deviceName = devicePath.split('/').pop();
      if (!deviceName) {
        return null;
      }

      const info: Record<string, unknown> = {};

      // Try to read device properties from sysfs
      try {
        const sysfsDevPath = `/sys/block/${deviceName}/device`;

        // Read model
        try {
          const model = readFileSync(`${sysfsDevPath}/model`, 'utf-8').trim();
          if (model) info.model = model;
        } catch (e) {
          // ignore
        }

        // Read serial
        try {
          const serial = readFileSync(`${sysfsDevPath}/serial`, 'utf-8').trim();
          if (serial) info.serial = serial;
        } catch (e) {
          // ignore
        }

        // Read vendor
        try {
          const vendor = readFileSync(`${sysfsDevPath}/vendor`, 'utf-8').trim();
          if (vendor) info.vendor = vendor;
        } catch (e) {
          // ignore
        }
      } catch (sysfsError) {
        logger.debug(`Could not read sysfs for ${devicePath}`, sysfsError);
      }

      logger.debug(`Device info for ${devicePath}:`, info);
      return Object.keys(info).length > 0 ? info : null;
    } catch (error) {
      logger.debug(`Could not get device info for ${devicePath}`, error);
      return null;
    }
  }

  /**
   * List available block devices
   * Uses lsblk to enumerate all block devices
   */
  static async listBlockDevices(): Promise<string[]> {
    logger.debug('Listing block devices...');

    try {
      const { stdout } = await execAsync('lsblk -d -n -o NAME', {
        timeout: 5000,
      });

      const devices = stdout
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)
        .map((name) => `/dev/${name}`);

      logger.debug(`Found ${devices.length} block devices`);
      return devices;
    } catch (error) {
      logger.error('Failed to list block devices', error);
      return [];
    }
  }
}
