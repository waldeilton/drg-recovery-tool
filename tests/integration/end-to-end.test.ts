/**
 * End-to-End Integration Tests
 * Complete recovery pipeline: device → parser → scan → extraction
 */

import { DRGRecoveryApp, initializeApp } from '../../src/app';
import { SignatureMatcher } from '../../src/engine/signatures/fileSignatures';
import { QuickScanEngine } from '../../src/engine/scanning/quickScan';
import { FileExtractor } from '../../src/engine/recovery/fileExtractor';

describe('End-to-End Recovery Pipeline', () => {
  let app: DRGRecoveryApp;
  let signatureMatcher: SignatureMatcher;
  let quickScan: QuickScanEngine;
  let fileExtractor: FileExtractor;

  beforeAll(async () => {
    app = await initializeApp();
    await app.start();
    signatureMatcher = new SignatureMatcher();
    quickScan = new QuickScanEngine();
    fileExtractor = new FileExtractor();
  });

  afterAll(async () => {
    await app.stop();
  });

  describe('Full Recovery Workflow', () => {
    it('should detect file signatures in buffer', () => {
      // Create synthetic buffer with known signatures
      const buffer = Buffer.alloc(1000);

      // Write PDF signature
      buffer.write('%PDF', 0, 4);

      const matches = signatureMatcher.findSignatures(buffer);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].name).toBe('PDF');
    });

    it('should perform Quick Scan on mock device buffer', async () => {
      // Create synthetic device buffer with multiple file signatures
      const buffer = Buffer.alloc(10000);

      // Write multiple signatures at different offsets
      buffer.write('%PDF', 100, 4); // PDF at offset 100
      buffer.writeUInt16LE(0xffd8, 500); // JPEG SOI at offset 500
      buffer.writeUInt16LE(0xffd9, 502);
      buffer.write('\x89PNG\r\n\x1a\n', 1000, 8); // PNG at offset 1000

      const files = await quickScan.scan(buffer, 0, 4096);

      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.path.includes('pdf'))).toBe(true);
    });

    it('should extract file from device buffer', async () => {
      // Create synthetic device with file content in cluster 1
      const clusterSize = 4096;
      const deviceBuffer = Buffer.alloc(clusterSize * 3);

      // Write file signature and content in cluster 1
      const fileContent = Buffer.from('Hello, recovered file!');
      fileContent.copy(deviceBuffer, clusterSize);

      // Create file entry pointing to cluster 1
      const fileEntry = {
        id: 'test_1',
        name: 'test.txt',
        path: '/test.txt',
        size: fileContent.length,
        type: 'file' as const,
        isDeleted: true,
        recoveryConfidence: 100,
        clusters: [1],
      };

      const result = await fileExtractor.extractFile(deviceBuffer, fileEntry, clusterSize);

      expect(result.success).toBe(true);
      expect(result.extractedBytes).toBe(clusterSize); // Full cluster extracted
    });

    it('should handle batch extraction', async () => {
      const clusterSize = 4096;
      const deviceBuffer = Buffer.alloc(clusterSize * 5);

      // Create multiple file entries
      const files = [
        {
          id: 'file_0',
          name: 'file1.txt',
          path: '/file1.txt',
          size: 100,
          type: 'file' as const,
          isDeleted: true,
          recoveryConfidence: 100,
          clusters: [0],
        },
        {
          id: 'file_1',
          name: 'file2.txt',
          path: '/file2.txt',
          size: 100,
          type: 'file' as const,
          isDeleted: true,
          recoveryConfidence: 100,
          clusters: [1],
        },
      ];

      const results = await fileExtractor.extractMultiple(deviceBuffer, files, clusterSize);

      expect(results.length).toBe(2);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Integration: Device → Parser → Scan → Extract', () => {
    it('should support full recovery pipeline', async () => {
      // Step 1: Get device manager
      const deviceManager = app.getDeviceManager();
      expect(deviceManager).toBeDefined();

      // Step 2: Enumerate devices (may be empty on test system)
      const devices = deviceManager.getDevices();
      expect(Array.isArray(devices)).toBe(true);

      // Step 3: Recovery service ready for scans
      const recoveryService = app.getRecoveryService();
      expect(recoveryService).toBeDefined();

      // Step 4: Scanning engines initialized
      expect(quickScan).toBeDefined();
      expect(fileExtractor).toBeDefined();

      // Step 5: File signatures available
      const supportedTypes = quickScan.getSupportedTypes();
      expect(supportedTypes.length).toBeGreaterThan(0);
      expect(supportedTypes.some((t) => t.extension === 'pdf')).toBe(true);
    });

    it('should estimate extraction time correctly', () => {
      const files = [
        {
          id: '1',
          name: 'file1.bin',
          path: '/file1.bin',
          size: 1000000, // 1MB
          type: 'file' as const,
          isDeleted: true,
          recoveryConfidence: 100,
        },
      ];

      const estimatedSeconds = fileExtractor.estimateExtractionTime(files, 100000000); // 100MB/s

      expect(estimatedSeconds).toBeLessThan(1); // 1MB should take less than 1 second at 100MB/s
      expect(estimatedSeconds).toBeGreaterThan(0);
    });
  });

  describe('Error Handling in Pipeline', () => {
    it('should handle extraction of file with no clusters', async () => {
      const fileEntry = {
        id: 'invalid',
        name: 'invalid.txt',
        path: '/invalid.txt',
        size: 100,
        type: 'file' as const,
        isDeleted: true,
        recoveryConfidence: 0,
        clusters: [],
      };

      const result = await fileExtractor.extractFile(Buffer.alloc(1000), fileEntry);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle out-of-bounds cluster reads gracefully', async () => {
      const buffer = Buffer.alloc(4096); // Only 1 cluster
      const fileEntry = {
        id: 'oob',
        name: 'oob.txt',
        path: '/oob.txt',
        size: 100,
        type: 'file' as const,
        isDeleted: true,
        recoveryConfidence: 100,
        clusters: [10], // Cluster way out of bounds
      };

      const result = await fileExtractor.extractFile(buffer, fileEntry, 4096);

      expect(result.success).toBe(false);
      expect(result.extractedBytes).toBe(0);
    });

    it('should handle very large files safely', async () => {
      const buffer = Buffer.alloc(100000000); // 100MB
      const fileEntry = {
        id: 'large',
        name: 'large.bin',
        path: '/large.bin',
        size: 2000000000, // 2GB (exceeds 1GB safety limit)
        type: 'file' as const,
        isDeleted: true,
        recoveryConfidence: 100,
        clusters: Array.from({ length: 250 }, (_, i) => i), // 250 clusters = ~1GB
      };

      const result = await fileExtractor.extractFile(buffer, fileEntry, 4096);

      // Should complete but truncate to safety limit
      expect(result.extractedBytes).toBeLessThanOrEqual(1073741824); // 1GB max
    });
  });

  describe('Supported File Types', () => {
    it('should support common document formats', () => {
      const types = quickScan.getSupportedTypes();
      const extensions = types.map((t) => t.extension);

      expect(extensions).toContain('pdf');
      expect(extensions).toContain('docx');
      expect(extensions).toContain('xlsx');
    });

    it('should support common image formats', () => {
      const types = quickScan.getSupportedTypes();
      const extensions = types.map((t) => t.extension);

      expect(extensions).toContain('jpg');
      expect(extensions).toContain('png');
      expect(extensions).toContain('gif');
      expect(extensions).toContain('bmp');
    });

    it('should support common media formats', () => {
      const types = quickScan.getSupportedTypes();
      const extensions = types.map((t) => t.extension);

      expect(extensions).toContain('mp3');
      expect(extensions).toContain('mp4');
    });

    it('should support archive formats', () => {
      const types = quickScan.getSupportedTypes();
      const extensions = types.map((t) => t.extension);

      expect(extensions).toContain('zip');
      expect(extensions).toContain('rar');
      expect(extensions).toContain('7z');
    });
  });
});
