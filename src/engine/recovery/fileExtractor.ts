/**
 * File Extractor
 * Reconstructs files from device by following cluster/extent chains
 */

import { Logger } from '../../utils/logger';
import type { FileEntry } from '../parsers/filesystemParser';

const logger = new Logger('DRG.FileExtractor');

export interface ExtractionResult {
  fileId: string;
  fileName: string;
  extractedBytes: number;
  success: boolean;
  error?: string;
}

export class FileExtractor {
  /**
   * Extract file from device using cluster/extent information
   */
  async extractFile(
    deviceBuffer: Buffer,
    fileEntry: FileEntry,
    clusterSize: number = 4096,
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    logger.info(`Extracting file: ${fileEntry.name} (clusters: ${fileEntry.clusters?.join(',')})`);

    try {
      if (!fileEntry.clusters || fileEntry.clusters.length === 0) {
        logger.warn(`No cluster information for ${fileEntry.name}`);
        return {
          fileId: fileEntry.id,
          fileName: fileEntry.name,
          extractedBytes: 0,
          success: false,
          error: 'No cluster information available',
        };
      }

      // Reconstruct file from clusters
      const chunks: Buffer[] = [];
      let totalBytes = 0;

      for (const cluster of fileEntry.clusters) {
        // Calculate byte offset in device
        const byteOffset = cluster * clusterSize;
        const chunk = deviceBuffer.slice(byteOffset, byteOffset + clusterSize);

        if (chunk.length === 0) {
          logger.warn(`Cluster ${cluster} out of bounds for ${fileEntry.name}`);
          break;
        }

        chunks.push(chunk);
        totalBytes += chunk.length;

        // Limit extraction to reasonable sizes (1GB max for safety)
        if (totalBytes > 1073741824) {
          logger.warn(`File ${fileEntry.name} exceeds 1GB limit, truncating`);
          break;
        }
      }

      if (chunks.length === 0) {
        return {
          fileId: fileEntry.id,
          fileName: fileEntry.name,
          extractedBytes: 0,
          success: false,
          error: 'Could not read clusters',
        };
      }

      // Combine chunks
      const fileBuffer = Buffer.concat(chunks);

      const duration = Date.now() - startTime;
      logger.info(`Extracted ${fileEntry.name}: ${fileBuffer.length} bytes in ${duration}ms`);

      return {
        fileId: fileEntry.id,
        fileName: fileEntry.name,
        extractedBytes: fileBuffer.length,
        success: true,
      };
    } catch (error) {
      logger.error(`Failed to extract ${fileEntry.name}`, error);
      return {
        fileId: fileEntry.id,
        fileName: fileEntry.name,
        extractedBytes: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Batch extract multiple files
   */
  async extractMultiple(
    deviceBuffer: Buffer,
    files: FileEntry[],
    clusterSize: number = 4096,
    onProgress?: (current: number, total: number) => void,
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    logger.info(`Starting batch extraction of ${files.length} files`);

    for (let i = 0; i < files.length; i++) {
      const result = await this.extractFile(deviceBuffer, files[i], clusterSize);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    const successful = results.filter((r) => r.success).length;
    const totalBytes = results.reduce((sum, r) => sum + r.extractedBytes, 0);

    logger.info(`Batch extraction complete: ${successful}/${files.length} successful, ${totalBytes} bytes total`);

    return results;
  }

  /**
   * Estimate extraction time
   */
  estimateExtractionTime(files: FileEntry[], bytesPerSecond: number = 100000000): number {
    // Estimate: assume 100MB/s read speed
    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
    return Math.ceil(totalBytes / bytesPerSecond);
  }
}
