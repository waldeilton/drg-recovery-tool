/**
 * File System Parser Interface
 * Base class for all filesystem parsers (NTFS, FAT32, HFS+, Ext4, etc.)
 */

import { Logger } from '../../utils/logger';

export interface FileEntry {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  created?: Date;
  modified?: Date;
  accessed?: Date;
  isDeleted: boolean;
  recoveryConfidence: number; // 0-100
  inode?: string;
  clusters?: number[];
}

export interface FileSystemMetadata {
  type: string;
  sizeBytes: number;
  usedBytes: number;
  freeBytes: number;
  blockSize: number;
  blockCount: number;
  label?: string;
  serial?: string;
  creationDate?: Date;
  lastModified?: Date;
}

const logger = new Logger('DRG.FSParser');

export abstract class FilesystemParser {
  protected fsType: string;
  protected metadata: FileSystemMetadata | null = null;
  protected files: Map<string, FileEntry> = new Map();

  constructor(fsType: string) {
    this.fsType = fsType;
    logger.info(`Initialized ${fsType} parser`);
  }

  /**
   * Parse filesystem from a buffer (boot sector or superblock)
   */
  abstract parseFileSystem(buffer: Buffer): Promise<FileSystemMetadata | null>;

  /**
   * List all files in filesystem
   */
  abstract listFiles(path?: string): Promise<FileEntry[]>;

  /**
   * Scan for deleted files
   */
  abstract scanDeletedFiles(): Promise<FileEntry[]>;

  /**
   * Get file metadata
   */
  abstract getFileMetadata(path: string): Promise<FileEntry | null>;

  /**
   * Extract file content
   */
  abstract extractFile(entry: FileEntry, outputPath: string): Promise<boolean>;

  /**
   * Check if buffer contains this filesystem type
   */
  abstract identify(buffer: Buffer): boolean;

  /**
   * Get filesystem metadata
   */
  getMetadata(): FileSystemMetadata | null {
    return this.metadata;
  }

  /**
   * Get all files found
   */
  getFiles(): FileEntry[] {
    return Array.from(this.files.values());
  }

  /**
   * Search for files by name
   */
  searchFiles(pattern: string): FileEntry[] {
    const regex = new RegExp(pattern, 'i');
    return this.getFiles().filter((file) => regex.test(file.name));
  }

  /**
   * Get filesystem type
   */
  getFileSystemType(): string {
    return this.fsType;
  }
}

/**
 * Factory for creating filesystem parsers
 */
export class FilesystemParserFactory {
  private static parsers: Map<string, typeof FilesystemParser> = new Map();

  static register(fsType: string, parserClass: typeof FilesystemParser): void {
    this.parsers.set(fsType, parserClass);
    logger.info(`Registered parser for ${fsType}`);
  }

  static getParser(fsType: string): typeof FilesystemParser | undefined {
    return this.parsers.get(fsType);
  }

  static identify(buffer: Buffer): string | null {
    for (const [fsType, parserClass] of this.parsers) {
      try {
        // Create temp instance to test identification
        const tempParser = new parserClass();
        if (tempParser.identify(buffer)) {
          return fsType;
        }
      } catch (error) {
        logger.debug(`Failed to identify ${fsType}`, error);
      }
    }
    return null;
  }

  static async createParser(fsType: string): Promise<FilesystemParser | null> {
    const parserClass = this.getParser(fsType);
    if (!parserClass) {
      logger.warn(`No parser found for ${fsType}`);
      return null;
    }

    try {
      return new parserClass();
    } catch (error) {
      logger.error(`Failed to create ${fsType} parser`, error);
      return null;
    }
  }
}
