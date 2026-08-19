/**
 * macOS Device Operations
 * Platform-specific device I/O for macOS using IOKit framework
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../utils/logger';
import type { StorageDevice } from './deviceManager';

const logger = new Logger('DRG.MacOSDevice');
const execAsync = promisify(exec);

/**
 * macOS device detection and I/O operations
 * TODO: Implement using:
 * - IOKit framework for device enumeration
 * - DADisk for mounted volume detection
 * - IOBlockStorageDevice for sector reading
 * - diskutil for device information
 */
export class MacOSDeviceManager {
  /**
   * Enumerate storage devices on macOS
   * Uses diskutil list to enumerate physical drives
   */
  static async enumerateDevices(): Promise<StorageDevice[]> {
    logger.info('Enumerating macOS storage devices...');

    try {
      const devices: StorageDevice[] = [];

      // Use diskutil list to get all disks
      try {
        const { stdout } = await execAsync('diskutil list -plist', {
          timeout: 10000,
        });

        // Parse plist output (simplified parsing)
        const diskMatch = stdout.match(/\/dev\/(disk\d+)/g) || [];

        for (const diskPath of diskMatch) {
          const diskName = diskPath.replace('/dev/', '');

          // Get disk info
          try {
            const infoResult = await execAsync(`diskutil info -plist ${diskPath}`, {
              timeout: 5000,
            });

            // Simple extraction of size (in real implementation, parse XML plist)
            const sizeMatch = infoResult.stdout.match(/TotalSize<\/key>\s*<integer>(\d+)<\/integer>/);
            const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;

            // Check if removable (external)
            const removableMatch = infoResult.stdout.match(/Removable<\/key>\s*<(true|false)\/>/);
            const isRemovable = removableMatch ? removableMatch[1] === 'true' : false;

            const device: StorageDevice = {
              id: diskName,
              name: diskName,
              type: isRemovable ? 'external' : 'internal',
              sizeBytes: size,
              sectorSize: 512,
              isRemovable,
              isMounted: false,
              mountPoints: [],
            };

            devices.push(device);
          } catch (diskError) {
            logger.debug(`Could not get info for ${diskPath}`, diskError);
          }
        }

        logger.info(`Found ${devices.length} macOS storage device(s)`);
        return devices;
      } catch (diskutilError) {
        logger.warn('diskutil enumeration failed', diskutilError);
        return [];
      }
    } catch (error) {
      logger.error('Failed to enumerate macOS devices', error);
      throw error;
    }
  }

  /**
   * Read sectors directly from device
   * Opens raw device and reads sectors
   */
  static async readSectors(
    devicePath: string,
    startSector: number,
    sectorCount: number,
  ): Promise<Buffer | null> {
    logger.debug(`Reading ${sectorCount} sectors from ${devicePath} starting at sector ${startSector}`);

    try {
      const fs = await import('fs/promises');

      // macOS uses /dev/rdiskX for raw access
      const rawPath = devicePath.startsWith('/dev/rdisk') ? devicePath : devicePath.replace('/dev/disk', '/dev/rdisk');

      const byteOffset = BigInt(startSector) * BigInt(512);
      const byteCount = sectorCount * 512;

      const fileHandle = await fs.open(rawPath, 'r');

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
        logger.warn(`Permission denied reading ${devicePath} (may require sudo)`, error);
      } else {
        logger.error(`Failed to read sectors from ${devicePath}`, error);
      }
      return null;
    }
  }

  /**
   * Get device geometry
   * Uses diskutil info to query device size
   */
  static async getDeviceGeometry(devicePath: string): Promise<{ sectorSize: number; totalSectors: number } | null> {
    logger.debug(`Getting device geometry for ${devicePath}`);

    try {
      const { stdout } = await execAsync(`diskutil info -plist ${devicePath}`, {
        timeout: 5000,
      });

      // Extract total size from plist
      const sizeMatch = stdout.match(/TotalSize<\/key>\s*<integer>(\d+)<\/integer>/);
      const totalSize = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;

      const totalSectors = Math.floor(totalSize / 512);

      logger.debug(`Device ${devicePath}: ${totalSize} bytes (${totalSectors} sectors)`);

      return {
        sectorSize: 512,
        totalSectors,
      };
    } catch (error) {
      logger.error(`Failed to get device geometry for ${devicePath}`, error);
      return null;
    }
  }

  /**
   * Check if device is mounted
   * Checks mount output for device presence
   */
  static async isDeviceMounted(devicePath: string): Promise<boolean> {
    logger.debug(`Checking if device ${devicePath} is mounted`);

    try {
      const { stdout } = await execAsync('mount', {
        timeout: 5000,
      });

      const mounted = stdout.includes(devicePath);

      logger.debug(`Device ${devicePath} mount status: ${mounted ? 'mounted' : 'not mounted'}`);
      return mounted;
    } catch (error) {
      logger.error(`Failed to check mount status for ${devicePath}`, error);
      return false;
    }
  }

  /**
   * Get device SMART data (if available)
   * Uses diskutil info to get health status
   */
  static async getSMART(
    devicePath: string,
  ): Promise<{ temperature?: number; health?: string; errors?: number } | null> {
    logger.debug(`Getting SMART data for ${devicePath}`);

    try {
      const { stdout } = await execAsync(`diskutil info -plist ${devicePath}`, {
        timeout: 5000,
      });

      // Extract SMART status if available
      const healthMatch = stdout.match(/SMARTStatus<\/key>\s*<string>([^<]+)<\/string>/);
      const health = healthMatch ? healthMatch[1] : undefined;

      logger.debug(`Device ${devicePath} health status: ${health || 'Unknown'}`);

      return health ? { health } : null;
    } catch (error) {
      logger.debug(`SMART data not available for ${devicePath}`, error);
      return null;
    }
  }

  /**
   * Get device information via diskutil
   */
  static async getDeviceInfo(devicePath: string): Promise<Record<string, unknown> | null> {
    logger.debug(`Getting device info for ${devicePath}`);

    try {
      const { stdout } = await execAsync(`diskutil info ${devicePath}`, {
        timeout: 5000,
      });

      // Parse text output (simplified)
      const info: Record<string, unknown> = {};

      const modelMatch = stdout.match(/Device Identifier:\s+([^\n]+)/);
      if (modelMatch) info.identifier = modelMatch[1].trim();

      const sizeMatch = stdout.match(/Total Size:\s+([^\n]+)/);
      if (sizeMatch) info.totalSize = sizeMatch[1].trim();

      const typeMatch = stdout.match(/Device Block Size:\s+([^\n]+)/);
      if (typeMatch) info.blockSize = typeMatch[1].trim();

      logger.debug(`Device info for ${devicePath}:`, info);
      return Object.keys(info).length > 0 ? info : null;
    } catch (error) {
      logger.debug(`Could not get device info for ${devicePath}`, error);
      return null;
    }
  }
}
