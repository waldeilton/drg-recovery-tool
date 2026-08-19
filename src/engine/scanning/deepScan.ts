/**
 * Deep Scan Engine
 * Byte-by-byte file recovery (2–4 hour target)
 */

import { Logger } from '../../utils/logger';
import { SignatureMatcher } from '../signatures/fileSignatures';
import type { FileEntry } from '../parsers/filesystemParser';

const logger = new Logger('DRG.DeepScan');

export interface DeepScanProgress {
  bytesScanned: number;
  filesFound: number;
  percentComplete: number;
  estimatedTimeRemaining: number; // milliseconds
}

export class DeepScanEngine {
  private matcher = new SignatureMatcher();
  private isCancelled = false;

  /**
   * Perform deep scan on device buffer
   * Exhaustive byte-by-byte search for file signatures
   */
  async scan(
    buffer: Buffer,
    startCluster: number = 0,
    clusterSize: number = 4096,
    onProgress?: (progress: DeepScanProgress) => void,
  ): Promise<FileEntry[]> {
    const startTime = Date.now();
    const files: FileEntry[] = [];
    this.isCancelled = false;

    logger.info(`Starting Deep Scan on ${buffer.length} bytes`);

    try {
      let lastReportTime = startTime;
      let lastReportPosition = 0;

      for (let i = 0; i < buffer.length; i++) {
        // Check for cancellation
        if (this.isCancelled) {
          logger.warn('Deep Scan cancelled by user');
          break;
        }

        // Create small buffer around current position for matching
        const searchBuffer = buffer.slice(i, Math.min(i + 512, buffer.length));

        // Find signatures
        const matches = this.matcher.findSignatures(searchBuffer, 1);

        if (matches.length > 0) {
          const match = matches[0];
          const filePosition = i + match.matchPosition;
          const clusterId = Math.floor(filePosition / clusterSize) + startCluster;

          // Avoid duplicate entries
          if (!files.some((f) => f.clusters?.[0] === clusterId)) {
            const fileEntry: FileEntry = {
              id: `deep_${clusterId}_${match.extension}`,
              name: `${match.name}_${clusterId}.${match.extension}`,
              path: `/${match.extension}/${match.name}_${clusterId}.${match.extension}`,
              size: 0, // Size unknown in Deep Scan
              type: 'file',
              isDeleted: true,
              recoveryConfidence: match.confidence,
              clusters: [clusterId],
            };

            files.push(fileEntry);
          }

          // Skip ahead to avoid duplicate matches nearby
          i += Math.max(1, match.signature.length - 1);
        }

        // Report progress every 100MB or 5 seconds
        const now = Date.now();
        const bytesScanned = i - lastReportPosition;

        if (bytesScanned > 104857600 || now - lastReportTime > 5000) {
          if (onProgress) {
            const _elapsed = now - startTime;
            const percentComplete = Math.floor((i / buffer.length) * 100);
            const bytesPerMs = (i - lastReportPosition) / (now - lastReportTime);
            const bytesRemaining = buffer.length - i;
            const estimatedTimeRemaining = Math.ceil(bytesRemaining / bytesPerMs);

            onProgress({
              bytesScanned: i,
              filesFound: files.length,
              percentComplete,
              estimatedTimeRemaining,
            });
          }

          lastReportTime = now;
          lastReportPosition = i;

          logger.debug(
            `Deep Scan: ${Math.floor((i / buffer.length) * 100)}% complete, ${files.length} files found`,
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Deep Scan complete: ${files.length} files found in ${duration}ms`);

      return files;
    } catch (error) {
      logger.error('Deep Scan failed', error);
      throw error;
    }
  }

  /**
   * Cancel ongoing deep scan
   */
  cancel(): void {
    logger.info('Deep Scan cancellation requested');
    this.isCancelled = true;
  }

  /**
   * Check if scan is running
   */
  isRunning(): boolean {
    return !this.isCancelled;
  }
}
