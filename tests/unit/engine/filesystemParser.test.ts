/**
 * Unit Tests: Filesystem Parser Framework
 * Tests the parser base class and factory pattern
 */

import { FilesystemParser, FilesystemParserFactory, type FileEntry, type FileSystemMetadata } from '../../../src/engine/parsers/filesystemParser';
import { NTFSParser } from '../../../src/engine/parsers/ntfsParser';
import { FAT32Parser } from '../../../src/engine/parsers/fat32Parser';
import { HFSPlusParser } from '../../../src/engine/parsers/hfspluspParser';
import { Ext4Parser } from '../../../src/engine/parsers/ext4Parser';

describe('FilesystemParser Base Class', () => {
  class TestParser extends FilesystemParser {
    identify(buffer: Buffer): boolean {
      return buffer.length > 0;
    }

    async parseFileSystem(buffer: Buffer): Promise<FileSystemMetadata | null> {
      return {
        type: 'TestFS',
        sizeBytes: 1000000,
        usedBytes: 500000,
        freeBytes: 500000,
        blockSize: 4096,
        blockCount: 244,
      };
    }

    async listFiles(path?: string): Promise<FileEntry[]> {
      return [];
    }

    async scanDeletedFiles(): Promise<FileEntry[]> {
      return [];
    }

    async getFileMetadata(path: string): Promise<FileEntry | null> {
      return null;
    }

    async extractFile(entry: FileEntry, outputPath: string): Promise<boolean> {
      return false;
    }
  }

  it('should initialize with filesystem type', () => {
    const parser = new TestParser();
    expect(parser.getFileSystemType()).toBe('TestFS');
  });

  it('should parse filesystem and store metadata', async () => {
    const parser = new TestParser();
    const buffer = Buffer.alloc(1024);
    const metadata = await parser.parseFileSystem(buffer);

    expect(metadata).not.toBeNull();
    expect(metadata?.type).toBe('TestFS');
    expect(metadata?.sizeBytes).toBe(1000000);
  });

  it('should retrieve stored metadata', async () => {
    const parser = new TestParser();
    const buffer = Buffer.alloc(1024);
    await parser.parseFileSystem(buffer);

    const stored = parser.getMetadata();
    expect(stored).not.toBeNull();
    expect(stored?.type).toBe('TestFS');
  });

  it('should search files by pattern', async () => {
    const parser = new TestParser();

    // Manually add files for testing
    const files: FileEntry[] = [
      { id: '1', name: 'document.txt', path: '/document.txt', size: 1024, type: 'file', isDeleted: false, recoveryConfidence: 100 },
      { id: '2', name: 'photo.jpg', path: '/photo.jpg', size: 2048, type: 'file', isDeleted: false, recoveryConfidence: 100 },
      { id: '3', name: 'readme.txt', path: '/readme.txt', size: 512, type: 'file', isDeleted: true, recoveryConfidence: 80 },
    ];

    files.forEach((file) => {
      (parser as any).files.set(file.id, file);
    });

    const results = parser.searchFiles('.*\\.txt$');
    expect(results.length).toBe(2);
    expect(results.some((r) => r.name === 'document.txt')).toBe(true);
    expect(results.some((r) => r.name === 'readme.txt')).toBe(true);
  });
});

describe('FilesystemParserFactory', () => {
  beforeEach(() => {
    // Register parsers before tests
    FilesystemParserFactory.register('NTFS', NTFSParser);
    FilesystemParserFactory.register('FAT32', FAT32Parser);
    FilesystemParserFactory.register('HFS+', HFSPlusParser);
    FilesystemParserFactory.register('Ext4', Ext4Parser);
  });

  it('should register and retrieve parsers', () => {
    const ntfsParser = FilesystemParserFactory.getParser('NTFS');
    expect(ntfsParser).toBeDefined();
    expect(ntfsParser).toBe(NTFSParser);
  });

  it('should return undefined for unregistered parsers', () => {
    const unknown = FilesystemParserFactory.getParser('UnknownFS');
    expect(unknown).toBeUndefined();
  });

  it('should create parser instances', async () => {
    const parser = await FilesystemParserFactory.createParser('NTFS');
    expect(parser).not.toBeNull();
    expect(parser?.getFileSystemType()).toBe('NTFS');
  });

  it('should identify NTFS filesystem', () => {
    // Create a mock NTFS boot sector
    const buffer = Buffer.alloc(1024);
    buffer.write('NTFS    ', 3, 8);

    const fsType = FilesystemParserFactory.identify(buffer);
    expect(fsType).toBe('NTFS');
  });

  it('should identify FAT32 filesystem', () => {
    // Create a mock FAT32 boot sector
    const buffer = Buffer.alloc(1024);
    buffer.writeUInt16LE(0x55AA, 510); // Signature
    buffer.writeUInt8(0xF8, 21); // Media descriptor

    const fsType = FilesystemParserFactory.identify(buffer);
    expect(fsType).toBe('FAT32');
  });

  it('should identify HFS+ filesystem', () => {
    // Create a mock HFS+ volume header
    const buffer = Buffer.alloc(2048);
    buffer.writeUInt16BE(0x482B, 1024); // HFS+ signature

    const fsType = FilesystemParserFactory.identify(buffer);
    expect(fsType).toBe('HFS+');
  });

  it('should identify Ext4 filesystem', () => {
    // Create a mock Ext4 superblock
    const buffer = Buffer.alloc(2048);
    buffer.writeUInt16LE(0xEF53, 1024 + 56); // Ext4 magic at offset 1080

    const fsType = FilesystemParserFactory.identify(buffer);
    expect(fsType).toBe('Ext4');
  });

  it('should return null for unidentified filesystem', () => {
    const buffer = Buffer.alloc(1024);
    const fsType = FilesystemParserFactory.identify(buffer);
    expect(fsType).toBeNull();
  });

  it('should handle parser creation errors gracefully', async () => {
    // Register a parser that throws on instantiation
    class FailingParser extends FilesystemParser {
      constructor() {
        throw new Error('Initialization failed');
      }

      identify(buffer: Buffer): boolean {
        return false;
      }

      async parseFileSystem(buffer: Buffer): Promise<FileSystemMetadata | null> {
        return null;
      }

      async listFiles(path?: string): Promise<FileEntry[]> {
        return [];
      }

      async scanDeletedFiles(): Promise<FileEntry[]> {
        return [];
      }

      async getFileMetadata(path: string): Promise<FileEntry | null> {
        return null;
      }

      async extractFile(entry: FileEntry, outputPath: string): Promise<boolean> {
        return false;
      }
    }

    FilesystemParserFactory.register('FailingFS', FailingParser as any);
    const parser = await FilesystemParserFactory.createParser('FailingFS');
    expect(parser).toBeNull();
  });
});

describe('NTFS Parser Identification', () => {
  const parser = new NTFSParser();

  it('should identify valid NTFS boot sector', () => {
    const buffer = Buffer.alloc(1024);
    buffer.write('NTFS    ', 3, 8);
    expect(parser.identify(buffer)).toBe(true);
  });

  it('should reject buffer without NTFS signature', () => {
    const buffer = Buffer.alloc(1024);
    expect(parser.identify(buffer)).toBe(false);
  });

  it('should reject small buffers', () => {
    const buffer = Buffer.alloc(512);
    expect(parser.identify(buffer)).toBe(false);
  });
});

describe('FAT32 Parser Identification', () => {
  const parser = new FAT32Parser();

  it('should identify valid FAT32 boot sector', () => {
    const buffer = Buffer.alloc(1024);
    buffer.writeUInt16LE(0x55AA, 510);
    buffer.writeUInt8(0xF8, 0x15); // Valid media descriptor
    expect(parser.identify(buffer)).toBe(true);
  });

  it('should reject buffer without FAT32 signature', () => {
    const buffer = Buffer.alloc(1024);
    buffer.writeUInt8(0xF8, 0x15);
    expect(parser.identify(buffer)).toBe(false);
  });

  it('should reject invalid media descriptor', () => {
    const buffer = Buffer.alloc(1024);
    buffer.writeUInt16LE(0x55AA, 510);
    buffer.writeUInt8(0xFF, 0x15); // Invalid media descriptor
    expect(parser.identify(buffer)).toBe(false);
  });
});

describe('HFS+ Parser Identification', () => {
  const parser = new HFSPlusParser();

  it('should identify valid HFS+ volume header', () => {
    const buffer = Buffer.alloc(2048);
    buffer.writeUInt16BE(0x482B, 1024); // HFS+ signature
    expect(parser.identify(buffer)).toBe(true);
  });

  it('should identify valid HFSX volume header', () => {
    const buffer = Buffer.alloc(2048);
    buffer.writeUInt16BE(0x4858, 1024); // HFSX signature
    expect(parser.identify(buffer)).toBe(true);
  });

  it('should reject invalid HFS+ header', () => {
    const buffer = Buffer.alloc(2048);
    expect(parser.identify(buffer)).toBe(false);
  });
});

describe('Ext4 Parser Identification', () => {
  const parser = new Ext4Parser();

  it('should identify valid Ext4 superblock', () => {
    const buffer = Buffer.alloc(2048);
    buffer.writeUInt16LE(0xEF53, 1024 + 56); // Ext4 magic
    expect(parser.identify(buffer)).toBe(true);
  });

  it('should reject invalid Ext4 superblock', () => {
    const buffer = Buffer.alloc(2048);
    expect(parser.identify(buffer)).toBe(false);
  });

  it('should reject small buffers', () => {
    const buffer = Buffer.alloc(512);
    expect(parser.identify(buffer)).toBe(false);
  });
});
