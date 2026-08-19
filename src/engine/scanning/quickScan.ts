/**
 * Quick Scan Engine
 * Signature-based file recovery (30–60 second target)
 */

import { Logger } from '../../utils/logger';
import { SignatureMatcher, FILE_SIGNATURES } from '../signatures/fileSignatures';
import type { FileEntry } from '../parsers/filesystemParser';

const logger = new Logger('DRG.QuickScan');

export interface QuickScanResult {
  scanId: string;
  filesFound: FileEntry[];
  duration: number; // milliseconds
  clustersScanned: number;
}

export class QuickScanEngine {
  private matcher = new SignatureMatcher();

  /**
   * Perform quick scan on device buffer
   * Searches for file signatures to locate recoverable files
   */
  async scan(buffer: Buffer, startCluster: number = 0, clusterSize: number = 4096): Promise<FileEntry[]> {
    const startTime = Date.now();
    const files: FileEntry[] = [];
    let currentPosition = 0;

    logger.info(`Starting Quick Scan on ${buffer.length} bytes`);

    try {
      // Scan buffer in chunks (cluster-aligned)
      const chunkSize = Math.max(clusterSize, 65536); // At least 64KB chunks
      let chunkIndex = 0;

      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
        currentPosition = i;

        // Find signatures in this chunk
        const matches = this.matcher.findAllMatches(chunk);

        for (const match of matches) {
          const filePosition = i + match.position;
          const clusterId = Math.floor(filePosition / clusterSize) + startCluster;

          const fileEntry: FileEntry = {
            id: `sig_${clusterId}_${match.signature.extension}`,
            name: `${match.signature.name}_${clusterId}.${match.signature.extension}`,
            path: `/${match.signature.extension}/${match.signature.name}_${clusterId}.${match.signature.extension}`,
            size: 0, // Size unknown in Quick Scan
            type: 'file',
            isDeleted: true, // Signature-based recovery assumes deleted files
            recoveryConfidence: match.signature.confidence,
            clusters: [clusterId],
          };

          files.push(fileEntry);
        }

        chunkIndex++;

        // Progress logging every 10% scanned
        if (chunkIndex % 10 === 0) {
          const percentScanned = Math.floor((currentPosition / buffer.length) * 100);
          logger.debug(`Quick Scan: ${percentScanned}% scanned, ${files.length} files found`);
        }

        // Time budget: stop if over 60 seconds
        const elapsed = Date.now() - startTime;
        if (elapsed > 60000) {
          logger.warn(`Quick Scan time limit reached (${elapsed}ms), stopping scan`);
          break;
        }
      }

      const duration = Date.now() - startTime;

      logger.info(`Quick Scan complete: ${files.length} files found in ${duration}ms`);

      return files;
    } catch (error) {
      logger.error('Quick Scan failed', error);
      throw error;
    }
  }

  /**
   * Get supported file types
   */
  getSupportedTypes(): Array<{ extension: string; name: string }> {
    const seen = new Set<string>();
    return FILE_SIGNATURES.filter((sig) => {
      if (seen.has(sig.extension)) {
        return false;
      }
      seen.add(sig.extension);
      return true;
    }).map((sig) => ({
      extension: sig.extension,
      name: sig.name,
    }));
  }
}
