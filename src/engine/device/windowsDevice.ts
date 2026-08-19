/**
 * Windows Device Operations
 * Platform-specific device I/O for Windows using Win32 API
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../utils/logger';
import type { StorageDevice } from './deviceManager';

const logger = new Logger('DRG.WindowsDevice');
const execAsync = promisify(exec);

/**
 * Windows device detection and I/O operations
 * TODO: Implement using:
 * - WMI (Windows Management Instrumentation) for device enumeration
 * - DeviceIoControl for direct disk access
 * - CreateFile/ReadFile for sector reading
 */
export class WindowsDeviceManager {
  /**
   * Enumerate storage devices on Windows
   * Uses PowerShell Get-PhysicalDisk and Get-Volume for device discovery
   */
  static async enumerateDevices(): Promise<StorageDevice[]> {
    logger.info('Enumerating Windows storage devices...');

    try {
      const devices: StorageDevice[] = [];

      // Query physical disks via PowerShell
      const psCmd = `
        Get-PhysicalDisk | Select-Object @{Name='DeviceId';Expression={$_.DeviceId}},@{Name='FriendlyName';Expression={$_.FriendlyName}},@{Name='Size';Expression={$_.Size}},@{Name='MediaType';Expression={$_.MediaType}},@{Name='Serial';Expression={$_.SerialNumber}} | ConvertTo-Json
      `;

      try {
        const { stdout } = await execAsync(`powershell -Command "${psCmd.replace(/"/g, '\\"')}"`, {
          timeout: 10000,
        });

        const diskData = JSON.parse(stdout.trim());
        const diskArray = Array.isArray(diskData) ? diskData : [diskData];

        for (const disk of diskArray) {
          const deviceId = `physicaldrive${disk.DeviceId}`;
          const device: StorageDevice = {
            id: deviceId,
            name: disk.FriendlyName || `Physical Drive ${disk.DeviceId}`,
            type: disk.MediaType === 'SSD' || disk.MediaType === 'HDD' ? 'internal' : 'external',
            sizeBytes: disk.Size || 0,
            sectorSize: 512, // Default sector size
            serial: disk.Serial || undefined,
            isRemovable: disk.MediaType !== 'HDD' && disk.MediaType !== 'SSD',
            isMounted: false,
            mountPoints: [],
          };

          devices.push(device);
        }

        logger.info(`Found ${devices.length} Windows storage device(s)`);
        return devices;
      } catch (psError) {
        logger.warn('PowerShell query failed, returning empty list', psError);
        return [];
      }
    } catch (error) {
      logger.error('Failed to enumerate Windows devices', error);
      throw error;
    }
  }

  /**
   * Read sectors directly from device
   * Opens device handle and reads raw sectors
   */
  static async readSectors(
    devicePath: string,
    startSector: number,
    sectorCount: number,
  ): Promise<Buffer | null> {
    logger.debug(`Reading ${sectorCount} sectors from ${devicePath} starting at sector ${startSector}`);

    try {
      const fs = await import('fs/promises');

      // Normalize device path
      const normalizedPath = devicePath.includes('\\.\\') ? devicePath : `\\.\\.\\${devicePath}`;

      // Calculate byte offsets (sector size = 512)
      const byteOffset = BigInt(startSector) * BigInt(512);
      const byteCount = sectorCount * 512;

      // Open device for reading
      const fileHandle = await fs.open(normalizedPath, 'r');

      try {
        // Allocate buffer for sectors
        const buffer = Buffer.alloc(byteCount);

        // Read sectors
        await fileHandle.read(buffer, 0, byteCount, byteOffset);

        logger.debug(`Successfully read ${sectorCount} sectors from ${devicePath}`);
        return buffer;
      } finally {
        await fileHandle.close();
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('EACCES') || error.message.includes('EPERM'))
      ) {
        logger.warn(`Permission denied reading ${devicePath} (may require admin)`, error);
      } else {
        logger.error(`Failed to read sectors from ${devicePath}`, error);
      }
      return null;
    }
  }

  /**
   * Get device geometry (sector size, total sectors)
   * Uses PowerShell to query disk size
   */
  static async getDeviceGeometry(
    devicePath: string,
  ): Promise<{ sectorSize: number; totalSectors: number } | null> {
    logger.debug(`Getting device geometry for ${devicePath}`);

    try {
      // Extract disk number from path (e.g., "0" from "physicaldrive0")
      const diskMatch = devicePath.match(/physicaldrive(\d+)/i);
      if (!diskMatch) {
        logger.warn(`Could not extract disk number from ${devicePath}`);
        return null;
      }

      const diskNumber = diskMatch[1];
      const psCmd = `Get-Disk -Number ${diskNumber} | Select-Object Size | ConvertTo-Json`;

      try {
        const { stdout } = await execAsync(`powershell -Command "${psCmd.replace(/"/g, '\\"')}"`, {
          timeout: 5000,
        });

        const diskData = JSON.parse(stdout.trim());
        const totalSectors = Math.floor(diskData.Size / 512);

        logger.debug(`Device ${devicePath}: ${diskData.Size} bytes (${totalSectors} sectors)`);

        return {
          sectorSize: 512,
          totalSectors,
        };
      } catch (psError) {
        logger.warn(`PowerShell geometry query failed for ${devicePath}`, psError);
        return null;
      }
    } catch (error) {
      logger.error(`Failed to get device geometry for ${devicePath}`, error);
      return null;
    }
  }

  /**
   * Check if device is mounted
   * Queries volumes to see if device is assigned drive letters or mount points
   */
  static async isDeviceMounted(devicePath: string): Promise<boolean> {
    logger.debug(`Checking if device ${devicePath} is mounted`);

    try {
      // Extract disk number
      const diskMatch = devicePath.match(/physicaldrive(\d+)/i);
      if (!diskMatch) {
        return false;
      }

      const diskNumber = diskMatch[1];
      const psCmd = `Get-Disk -Number ${diskNumber} | Get-Partition | Measure-Object | Select-Object -ExpandProperty Count`;

      try {
        const { stdout } = await execAsync(`powershell -Command "${psCmd.replace(/"/g, '\\"')}"`, {
          timeout: 5000,
        });

        const partitionCount = parseInt(stdout.trim(), 10);
        const mounted = partitionCount > 0;

        logger.debug(`Device ${devicePath} mount status: ${mounted ? 'mounted' : 'not mounted'}`);
        return mounted;
      } catch (psError) {
        logger.warn(`Could not determine mount status for ${devicePath}`, psError);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to check mount status for ${devicePath}`, error);
      return false;
    }
  }

  /**
   * Get SMART data (if available)
   * Queries device health status via PowerShell
   */
  static async getSMARTData(
    devicePath: string,
  ): Promise<{ temperature?: number; health?: string; errors?: number } | null> {
    logger.debug(`Getting SMART data for ${devicePath}`);

    try {
      const diskMatch = devicePath.match(/physicaldrive(\d+)/i);
      if (!diskMatch) {
        return null;
      }

      const diskNumber = diskMatch[1];
      const psCmd = `Get-Disk -Number ${diskNumber} | Select-Object HealthStatus | ConvertTo-Json`;

      try {
        const { stdout } = await execAsync(`powershell -Command "${psCmd.replace(/"/g, '\\"')}"`, {
          timeout: 5000,
        });

        const diskData = JSON.parse(stdout.trim());
        const health = diskData.HealthStatus || 'Unknown';

        logger.debug(`Device ${devicePath} health status: ${health}`);

        return {
          health,
        };
      } catch (psError) {
        logger.debug(`SMART data not available for ${devicePath}`, psError);
        return null;
      }
    } catch (error) {
      logger.debug(`SMART data not available for ${devicePath}`);
      return null;
    }
  }
}
