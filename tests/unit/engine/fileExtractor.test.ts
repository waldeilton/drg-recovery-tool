/**
 * Unit Tests: File Extractor
 * Tests file reconstruction from cluster chains
 */

import { FileExtractor } from '../../../src/engine/recovery/fileExtractor';
import type { FileEntry } from '../../../src/engine/parsers/filesystemParser';

describe('FileExtractor', () => {
  let extractor: FileExtractor;

  beforeEach(() => {
    extractor = new FileExtractor();
  });

  describe('Single File Extraction', () => {
    it('should extract file from single cluster', async () => {
      const clusterSize = 4096;
      const deviceBuffer = Buffer.alloc(clusterSize * 2);

      // Write test data in cluster 1
      const testData = Buffer.from('Test file content');
      testData.copy(deviceBuffer, clusterSize);

      const fileEntry: FileEntry = {
        id: 'test_1',
        name: 'test.txt',
        path: '/test.txt',
        size: testData.length,
        type: 'file',
        isDeleted: true,
        recoveryConfidence: 100,
        clusters: [1],
      };

      const result = await extractor.extractFile(deviceBuffer, fileEntry, clusterSize);

      expect(result.success).toBe(true);
      expect(result.extractedBytes).toBe(clusterSize);
      expect(result.fileName).toBe('test.txt');
    });

    it('should extract file from multiple clusters', async () => {
      const clusterSize = 4096;
      const deviceBuffer = Buffer.alloc(clusterSize * 4);

      // Write data in clusters 0, 1, 2
      for (let i = 0; i < 3; i++) {
        deviceBuffer.fill(i + 65, i * clusterSize, (i + 1) * clusterSize); // Fill with ASCII characters
      }

      const fileEntry: FileEntry = {
        id: 'multi',
        name: 'multicluster.bin',
        path: '/multicluster.bin',
        size: clusterSize * 3,
        type: 'file',
        isDeleted: true,
        recoveryConfidence: 95,
        clusters: [0, 1, 2],
      };

      const result = await extractor.extractFile(deviceBuffer, fileEntry, clusterSize);

      expect(result.success).toBe(true);
      expect(result.extractedBytes).toBe(clusterSize * 3);
    });
  });

  describe('Error Handling', () => {
    it('should fail when file has no clusters', async () => {
      const deviceBuffer = Buffer.alloc(8192);

      const fileEntry: FileEntry = {
        id: 'empty',
        name: 'empty.txt',
        path: '/empty.txt',
        size: 0,
        type: 'file',
        isDeleted: true,
        recoveryConfidence: 0,
        clusters: [],
      };

      const result = await extractor.extractFile(deviceBuffer, fileEntry);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No cluster information');
    });

    it('should fail when cluster is out of bounds', async () => {
      const clusterSize = 4096;
      const deviceBuffer = Buffer.alloc(clusterSize);

      const fileEntry: FileEntry = {
        id: 'oob',
        name: 'oob.bin',
        path: '/oob.bin',
        size: 1000,
        type: 'file',
        isDeleted: true,
        recoveryConfidence: 80,
        clusters: [999], // Way out of bounds
      };

      const result = await extractor.extractFile(deviceBuffer, fileEntry, clusterSize);

      expect(result.success).toBe(false);
    });

    it('should handle missing cluster gracefully', async () => {
      const clusterSize = 4096;
      const deviceBuffer = Buffer.alloc(clusterSize * 2);

      const fileEntry: FileEntry = {
        id: 'partial',
        name: 'partial.bin',
        path: '/partial.bin',
        size: clusterSize * 2,
        type: 'file',
        isDeleted: true,
        recoveryConfidence: 75,
        clusters: [0, 999], // 999 is out of bounds
      };

      const result = await extractor.extractFile(deviceBuffer, fileEntry, clusterSize);

      // Should partially succeed and extract what's available
      expect(result.extractedBytes).toBeGreaterThan(0);
    });
  });

  describe('Batch Extraction', () => {
    it('should extract multiple files', async () => {
      const clusterSize = 4096;
      const deviceBuffer = Buffer.alloc(clusterSize * 3);

      const files: FileEntry[] = [
        {
          id: 'file_0',
          name: 'file1.txt',
          path: '/file1.txt',
          size: 100,
          type: 'file',
          isDeleted: true,
          recoveryConfidence: 100,
          clusters: [0],
        },
        {
          id: 'file_1',
          name: 'file2.txt',
          path: '/file2.txt',
          size: 100,
          type: 'file',
          isDeleted: true,
          recoveryConfidence: 95,
          clusters: [1],
        },
      ];

      const results = await extractor.extractMultiple(deviceBuffer, files, clusterSize);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle mixed success/failure in batch', async () => {
      const clusterSize = 4096;
      const deviceBuffer = Buffer.alloc(clusterSize * 2);

      const files: FileEntry[] = [
        {
          id: 'ok',
          name: 'good.txt',
          path: '/good.txt',
          size: 100,
          type: 'file',
          isDeleted: true,
          recoveryConfidence: 100,
          clusters: [0],
        },
        {
          id: 'bad',
          name: 'bad.txt',
          path: '/bad.txt',
          size: 100,
          type: 'file',
          isDeleted: true,
          recoveryConfidence: 50,
          clusters: [999],
        },
      ];

      const results = await extractor.extractMultiple(deviceBuffer, files, clusterSize);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Extraction Estimates', () => {
    it('should estimate time for single file', () => {
      const files: FileEntry[] = [
        {
          id: '1',
          name: 'test.bin',
          path: '/test.bin',
          size: 100000000, // 100MB
          type: 'file',
          isDeleted: true,
          recoveryConfidence: 100,
        },
      ];

      // At 100MB/s
      const estimated = extractor.estimateExtractionTime(files, 100000000);

      expect(estimated).toBe(1); // 100MB at 100MB/s = 1 second
    });

    it('should estimate time for multiple files', () => {
      const files: FileEntry[] = [
        {
          id: '1',
          name: 'file1.bin',
          path: '/file1.bin',
          size: 50000000, // 50MB
          type: 'file',
          isDeleted: true,
          recoveryConfidence: 100,
        },
        {
          id: '2',
          name: 'file2.bin',
          path: '/file2.bin',
          size: 50000000, // 50MB
          type: 'file',
          isDeleted: true,
          recoveryConfidence: 100,
        },
      ];

      // At 100MB/s
      const estimated = extractor.estimateExtractionTime(files, 100000000);

      expect(estimated).toBe(1); // 100MB total at 100MB/s = 1 second
    });

    it('should return 0 for empty file list', () => {
      const estimated = extractor.estimateExtractionTime([], 100000000);

      expect(estimated).toBe(0);
    });
  });

  describe('Large File Handling', () => {
    it('should handle extraction of large files', async () => {
      const clusterSize = 4096;
      const largeBuffer = Buffer.alloc(clusterSize * 100); // 400KB device

      // Create file that spans many clusters
      const clusters = Array.from({ length: 50 }, (_, i) => i);

      const fileEntry: FileEntry = {
        id: 'large',
        name: 'large.bin',
        path: '/large.bin',
        size: 200000,
        type: 'file',
        isDeleted: true,
        recoveryConfidence: 100,
        clusters,
      };

      const result = await extractor.extractFile(largeBuffer, fileEntry, clusterSize);

      expect(result.success).toBe(true);
      expect(result.extractedBytes).toBe(clusterSize * 50);
    });

    it('should truncate extraction for safety limit', async () => {
      const clusterSize = 4096;
      const hugeBuffer = Buffer.alloc(clusterSize * 300000); // 1.2GB

      // Create file exceeding 1GB safety limit
      const clusters = Array.from({ length: 280000 }, (_, i) => i); // ~1.1GB

      const fileEntry: FileEntry = {
        id: 'huge',
        name: 'huge.bin',
        path: '/huge.bin',
        size: 1200000000,
        type: 'file',
        isDeleted: true,
        recoveryConfidence: 100,
        clusters,
      };

      const result = await extractor.extractFile(hugeBuffer, fileEntry, clusterSize);

      expect(result.success).toBe(true);
      expect(result.extractedBytes).toBeLessThanOrEqual(1073741824); // 1GB
    });
  });
});
