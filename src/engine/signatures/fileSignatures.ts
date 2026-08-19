/**
 * File Signature Database
 * Common file type signatures (magic bytes) for Quick Scan recovery
 */

export interface FileSignature {
  name: string;
  extension: string;
  signature: Buffer;
  offset?: number; // Offset where signature appears (default 0)
  confidence: number; // 0-100 confidence level
}

/**
 * Comprehensive file signature database
 * Signatures are ordered by frequency/importance
 */
export const FILE_SIGNATURES: FileSignature[] = [
  // Documents
  {
    name: 'PDF',
    extension: 'pdf',
    signature: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
    confidence: 100,
  },
  {
    name: 'Microsoft Word',
    extension: 'docx',
    signature: Buffer.from([0x50, 0x4b, 0x03, 0x04]), // PK.. (ZIP format)
    offset: 0,
    confidence: 80, // Shared with other ZIP formats
  },
  {
    name: 'Microsoft Excel',
    extension: 'xlsx',
    signature: Buffer.from([0x50, 0x4b, 0x03, 0x04]), // PK.. (ZIP format)
    offset: 0,
    confidence: 75,
  },
  {
    name: 'Microsoft PowerPoint',
    extension: 'pptx',
    signature: Buffer.from([0x50, 0x4b, 0x03, 0x04]), // PK.. (ZIP format)
    offset: 0,
    confidence: 75,
  },
  {
    name: 'Rich Text Format',
    extension: 'rtf',
    signature: Buffer.from([0x7b, 0x5c, 0x72, 0x74, 0x66]), // {\rtf
    confidence: 95,
  },

  // Images
  {
    name: 'JPEG Image',
    extension: 'jpg',
    signature: Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // JPEG SOI + APP0
    confidence: 100,
  },
  {
    name: 'JPEG Image (EXIF)',
    extension: 'jpg',
    signature: Buffer.from([0xff, 0xd8, 0xff, 0xe1]), // JPEG SOI + APP1 (EXIF)
    confidence: 100,
  },
  {
    name: 'PNG Image',
    extension: 'png',
    signature: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    confidence: 100,
  },
  {
    name: 'GIF Image',
    extension: 'gif',
    signature: Buffer.from([0x47, 0x49, 0x46, 0x38]), // GIF8
    confidence: 100,
  },
  {
    name: 'BMP Image',
    extension: 'bmp',
    signature: Buffer.from([0x42, 0x4d]), // BM
    confidence: 95,
  },
  {
    name: 'TIFF Image (Little-endian)',
    extension: 'tiff',
    signature: Buffer.from([0x49, 0x49, 0x2a, 0x00]), // II*
    confidence: 100,
  },
  {
    name: 'TIFF Image (Big-endian)',
    extension: 'tiff',
    signature: Buffer.from([0x4d, 0x4d, 0x00, 0x2a]), // MM.*
    confidence: 100,
  },

  // Audio/Video
  {
    name: 'MP3 Audio',
    extension: 'mp3',
    signature: Buffer.from([0x49, 0x44, 0x33]), // ID3 tag
    confidence: 90,
  },
  {
    name: 'MP4 Video',
    extension: 'mp4',
    signature: Buffer.from([0x66, 0x74, 0x79, 0x70]), // ftyp
    offset: 4,
    confidence: 85,
  },
  {
    name: 'AVI Video',
    extension: 'avi',
    signature: Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
    confidence: 80,
  },
  {
    name: 'WAV Audio',
    extension: 'wav',
    signature: Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
    confidence: 75,
  },
  {
    name: 'FLAC Audio',
    extension: 'flac',
    signature: Buffer.from([0x66, 0x4c, 0x61, 0x43]), // fLaC
    confidence: 100,
  },

  // Archives
  {
    name: 'ZIP Archive',
    extension: 'zip',
    signature: Buffer.from([0x50, 0x4b, 0x03, 0x04]), // PK..
    confidence: 95,
  },
  {
    name: 'RAR Archive',
    extension: 'rar',
    signature: Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]), // Rar!..
    confidence: 100,
  },
  {
    name: 'GZIP Archive',
    extension: 'gz',
    signature: Buffer.from([0x1f, 0x8b]), // ..
    confidence: 95,
  },
  {
    name: '7z Archive',
    extension: '7z',
    signature: Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]), // 7z..
    confidence: 100,
  },

  // Executables
  {
    name: 'Windows Executable (PE)',
    extension: 'exe',
    signature: Buffer.from([0x4d, 0x5a]), // MZ
    confidence: 90,
  },
  {
    name: 'Windows DLL',
    extension: 'dll',
    signature: Buffer.from([0x4d, 0x5a]), // MZ
    confidence: 85,
  },
  {
    name: 'ELF Executable (Linux)',
    extension: 'elf',
    signature: Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // .ELF
    confidence: 100,
  },
  {
    name: 'Mach-O Executable (macOS)',
    extension: 'macho',
    signature: Buffer.from([0xfe, 0xed, 0xfa, 0xce]), // ..
    confidence: 100,
  },

  // System/Database
  {
    name: 'SQLite Database',
    extension: 'db',
    signature: Buffer.from([0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66]), // SQLite f
    confidence: 100,
  },
  {
    name: 'Registry Hive (Windows)',
    extension: 'hive',
    signature: Buffer.from([0x72, 0x65, 0x67, 0x66]), // regf
    confidence: 100,
  },
];

/**
 * Signature lookup index for quick matching
 */
export class SignatureMatcher {
  private signatureMap: Map<string, FileSignature[]> = new Map();

  constructor() {
    // Index signatures by first byte for quick lookup
    for (const sig of FILE_SIGNATURES) {
      const firstByte = sig.signature[0];
      const key = `${firstByte}`;

      if (!this.signatureMap.has(key)) {
        this.signatureMap.set(key, []);
      }

      this.signatureMap.get(key)!.push(sig);
    }
  }

  /**
   * Find matching file signatures in buffer
   * Returns array of matching signatures with confidence scores
   */
  findSignatures(buffer: Buffer, maxResults: number = 5): Array<FileSignature & { matchPosition: number }> {
    const matches: Array<FileSignature & { matchPosition: number }> = [];

    // Quick lookup by first byte
    if (buffer.length === 0) {
      return matches;
    }

    const firstByte = buffer[0];
    const candidates = this.signatureMap.get(`${firstByte}`) || [];

    for (const sig of candidates) {
      const offset = sig.offset || 0;

      if (buffer.length >= offset + sig.signature.length) {
        const chunk = buffer.slice(offset, offset + sig.signature.length);

        if (chunk.equals(sig.signature)) {
          matches.push({
            ...sig,
            matchPosition: offset,
          });

          if (matches.length >= maxResults) {
            break;
          }
        }
      }
    }

    return matches;
  }

  /**
   * Find all signature matches in a buffer (full scan)
   */
  findAllMatches(buffer: Buffer): Array<{ signature: FileSignature; position: number }> {
    const matches: Array<{ signature: FileSignature; position: number }> = [];

    for (const sig of FILE_SIGNATURES) {
      const offset = sig.offset || 0;

      // Search through buffer for signature
      for (let i = 0; i <= buffer.length - offset - sig.signature.length; i++) {
        const chunk = buffer.slice(i + offset, i + offset + sig.signature.length);

        if (chunk.equals(sig.signature)) {
          matches.push({
            signature: sig,
            position: i,
          });
        }
      }
    }

    return matches;
  }
}
