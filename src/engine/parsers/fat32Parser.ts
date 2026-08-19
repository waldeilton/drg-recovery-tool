/**
 * FAT32 Parser
 * Handles FAT32 file system parsing
 */

import { FilesystemParser, type FileEntry, type FileSystemMetadata } from './filesystemParser';
import { Logger } from '../../utils/logger';

const logger = new Logger('DRG.FAT32Parser');

export class FAT32Parser extends FilesystemParser {
  private bytesPerSector: number = 512;
  private sectorsPerCluster: number = 8;
  private reservedSectors: number = 0;
  private fatCount: number = 2;
  private fatSize: number = 0;

  constructor() {
    super('FAT32');
  }

  identify(buffer: Buffer): boolean {
    if (buffer.length < 512) {
      return false;
    }

    // Check for FAT32 signature
    const signature = buffer.slice(510, 512);
    if (!signature.equals(Buffer.from([0x55, 0xAA]))) {
      return false;
    }

    // Check media descriptor
    const mediaDescriptor = buffer.readUInt8(0x15);
    if (mediaDescriptor !== 0xF8 && mediaDescriptor !== 0xF9 && mediaDescriptor !== 0xFA && mediaDescriptor !== 0xFB) {
      return false;
    }

    return true;
  }

  async parseFileSystem(buffer: Buffer): Promise<FileSystemMetadata | null> {
    try {
      if (!this.identify(buffer)) {
        logger.warn('Buffer does not contain valid FAT32 boot sector');
        return null;
      }

      logger.info('Parsing FAT32 file system...');

      // Parse boot sector
      this.bytesPerSector = buffer.readUInt16LE(0x0B);
      this.sectorsPerCluster = buffer.readUInt8(0x0D);
      this.reservedSectors = buffer.readUInt16LE(0x0E);
      this.fatCount = buffer.readUInt8(0x10);
      this.fatSize = buffer.readUInt32LE(0x24);

      const totalSectors = buffer.readUInt32LE(0x20) || buffer.readUInt32LE(0x32);
      const clusterSize = this.bytesPerSector * this.sectorsPerCluster;

      // Calculate used/free clusters (simplified - count non-free entries in FAT)
      let usedClusters = 0;
      const fatOffset = this.reservedSectors * this.bytesPerSector;
      const fatSize = this.fatSize * this.bytesPerSector;

      try {
        const fatBuffer = buffer.slice(fatOffset, Math.min(fatOffset + fatSize, buffer.length));
        const entryCount = Math.min(Math.floor(fatBuffer.length / 4), 50000);

        for (let i = 0; i < entryCount; i++) {
          const entry = fatBuffer.readUInt32LE(i * 4);
          if (entry !== 0x00000000 && entry !== 0xffffffff) {
            usedClusters++;
          }
        }
      } catch (e) {
        logger.debug('Could not calculate used clusters', e);
      }

      const totalClusters = Math.floor(totalSectors / this.sectorsPerCluster);
      const usedBytes = usedClusters * clusterSize;
      const freeBytes = (totalClusters - usedClusters) * clusterSize;

      this.metadata = {
        type: 'FAT32',
        sizeBytes: totalSectors * this.bytesPerSector,
        usedBytes,
        freeBytes,
        blockSize: clusterSize,
        blockCount: totalClusters,
      };

      logger.debug(`FAT32: ${this.bytesPerSector} bytes/sector, ${this.sectorsPerCluster} sectors/cluster, ${totalClusters} total clusters`);
      logger.info('FAT32 file system parsed successfully');
      return this.metadata;
    } catch (error) {
      logger.error('Failed to parse FAT32 file system', error);
      return null;
    }
  }

  async listFiles(path?: string): Promise<FileEntry[]> {
    try {
      logger.info(`Listing files in FAT32 (path: ${path || 'root'})`);

      // TODO: Implement root directory and subdirectory parsing
      // Parse directory entries to get file list
      return [];
    } catch (error) {
      logger.error('Failed to list FAT32 files', error);
      throw error;
    }
  }

  async scanDeletedFiles(): Promise<FileEntry[]> {
    try {
      logger.info('Scanning for deleted files in FAT32...');

      // TODO: Implement deleted file detection
      // Scan directory entries for deleted markers (0xE5)
      // Look for file signatures in unallocated clusters
      return [];
    } catch (error) {
      logger.error('Failed to scan for deleted FAT32 files', error);
      throw error;
    }
  }

  async getFileMetadata(path: string): Promise<FileEntry | null> {
    try {
      logger.debug(`Getting metadata for FAT32 file: ${path}`);

      // TODO: Implement directory entry parsing
      return null;
    } catch (error) {
      logger.error(`Failed to get FAT32 file metadata: ${path}`, error);
      throw error;
    }
  }

  async extractFile(entry: FileEntry, outputPath: string): Promise<boolean> {
    try {
      logger.info(`Extracting FAT32 file: ${entry.path} → ${outputPath}`);

      // TODO: Implement file extraction using FAT chain
      return false;
    } catch (error) {
      logger.error(`Failed to extract FAT32 file: ${entry.path}`, error);
      throw error;
    }
  }

  /**
   * Parse FAT (File Allocation Table) to get cluster chains
   * FAT contains cluster allocation information
   */
  private async parseFAT(buffer: Buffer): Promise<Map<number, number>> {
    logger.debug('Parsing FAT...');

    try {
      const fatChains = new Map<number, number>();

      // FAT starts after reserved sectors
      const fatOffset = this.reservedSectors * this.bytesPerSector;
      const fatBuffer = buffer.slice(fatOffset, fatOffset + this.fatSize * this.bytesPerSector);

      // Each FAT entry is 4 bytes for FAT32
      const entrySize = 4;
      const entryCount = Math.floor(fatBuffer.length / entrySize);

      for (let i = 0; i < entryCount && i < 100000; i++) {
        // Limit for performance
        const clusterEntry = fatBuffer.readUInt32LE(i * entrySize);

        // Store cluster chain (cluster i points to cluster clusterEntry)
        if (clusterEntry !== 0x00000000 && clusterEntry !== 0xffffffff) {
          fatChains.set(i, clusterEntry);
        }
      }

      logger.debug(`Parsed ${fatChains.size} FAT cluster chains`);
      return fatChains;
    } catch (error) {
      logger.error('Failed to parse FAT', error);
      return new Map();
    }
  }

  /**
   * Parse directory entries
   */
  private async parseDirectoryEntries(startCluster: number): Promise<FileEntry[]> {
    logger.debug(`Parsing directory entries starting at cluster ${startCluster}`);

    // TODO: Implement directory entry parsing
    return [];
  }
}
