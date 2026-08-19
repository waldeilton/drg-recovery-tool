# DRG Recovery Tool — Architecture Design Document

**Last Updated:** August 18, 2026  
**Version:** 1.0 (v1.0 MVP)  
**Status:** Implementation in progress (Week 2)

---

## Table of Contents

1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [Filesystem Parser Framework](#filesystem-parser-framework)
4. [Device Abstraction Layer](#device-abstraction-layer)
5. [Recovery Service Pipeline](#recovery-service-pipeline)
6. [Escalation Service](#escalation-service)
7. [Design Patterns](#design-patterns)
8. [Data Flow](#data-flow)

---

## Overview

DRG Recovery Tool is a cross-platform data recovery engine built with TypeScript and Node.js. The architecture prioritizes:

- **Modularity**: Filesystem parsers and platform device managers are pluggable
- **Extensibility**: New filesystems and platforms add without modifying core
- **Testability**: Dependency injection and clear service boundaries
- **Performance**: Layered scanning (Quick = signatures, Deep = byte-match)

### Key Constraints

- **Windows-first** MVP (Sep 9, 2026)
- **Multi-filesystem** support: NTFS, FAT32, HFS+, Ext4
- **Two recovery modes**: Quick Scan (30s) and Deep Scan (2–4h)
- **Professional escalation**: Seamless Labs integration for high-value cases

---

## Core Architecture

### Service Layers

```
┌──────────────────────────────────────┐
│   User Interface (TBD: Qt/React)     │
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│     Recovery Orchestrator Layer      │
│  • RecoveryService                   │
│  • ScanController                    │
│  • FileRecoveryManager               │
└──────────────────────────────────────┘
         ↓
┌─────────────────────┬─────────────────────┐
│  Parser Framework   │  Device Abstraction │
│  • FilesystemParser │  • WindowsDevice    │
│  • NTFSParser       │  • MacOSDevice      │
│  • FAT32Parser      │  • LinuxDevice      │
│  • HFS+Parser       │                     │
│  • Ext4Parser       │                     │
└─────────────────────┴─────────────────────┘
         ↓
┌──────────────────────────────────────┐
│   Platform I/O (Stubbed)             │
│  • Win32 API (WMI, DeviceIoControl)  │
│  • IOKit (macOS)                     │
│  • sysfs/lsblk (Linux)               │
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│       Storage Devices                │
│  • Hard Drives (HDD/SSD)             │
│  • USB Drives                        │
│  • Memory Cards                      │
│  • Optical Media (future)            │
└──────────────────────────────────────┘
```

### Application Lifecycle

```typescript
// Startup
const app = await initializeApp();
await app.start();

// Services available
const deviceMgr = app.getDeviceManager();
const recoverySvc = app.getRecoveryService();
const escalationSvc = app.getEscalationService();

// Shutdown (pauses active scans, closes resources)
await app.stop();
```

---

## Filesystem Parser Framework

### Design Pattern: Factory + Strategy

**Intent**: Support multiple filesystems without tight coupling

**Implementation**:
- **Abstract Base**: `FilesystemParser` defines interface for all parsers
- **Concrete Strategies**: `NTFSParser`, `FAT32Parser`, `HFS+Parser`, `Ext4Parser`
- **Factory**: `FilesystemParserFactory` manages registration, creation, identification

### Parser Interface

```typescript
abstract class FilesystemParser {
  // Identification
  identify(buffer: Buffer): boolean;

  // Parsing
  parseFileSystem(buffer: Buffer): Promise<FileSystemMetadata | null>;

  // Enumeration
  listFiles(path?: string): Promise<FileEntry[]>;
  scanDeletedFiles(): Promise<FileEntry[]>;

  // Access
  getFileMetadata(path: string): Promise<FileEntry | null>;
  extractFile(entry: FileEntry, outputPath: string): Promise<boolean>;
}
```

### Filesystem Support Matrix (v1.0)

| Filesystem | Windows | macOS | Linux | Status |
|------------|---------|-------|-------|--------|
| NTFS       | ✅      | ⚠️*   | ⚠️*   | Stubbed |
| FAT32      | ✅      | ✅    | ✅    | Stubbed |
| HFS+       | —       | ✅    | —     | Stubbed |
| Ext4       | —       | —     | ✅    | Stubbed |

*NTFS on macOS/Linux: Read-only in future versions

### Parser Stubs (Week 2–3)

Each parser stub includes:
1. **Signature Detection**: Magic number identification
2. **Metadata Parsing**: Boot sector/superblock extraction
3. **Method Stubs**: TODO markers for Week 2–3 implementation

#### Example: NTFS Parser

- **Signature**: `0x4E54465320202020` ("NTFS    ") at offset 3
- **Boot Sector**: Cluster size, MFT location, sector size
- **MFT Parsing**: TODO in Week 2 (master file table enumeration)
- **Deleted Recovery**: Scan MFT for deleted entries + signature matching

#### Example: FAT32 Parser

- **Signature**: `0x55AA` at offset 510 + media descriptor check
- **Boot Sector**: Cluster size, FAT location, sector size
- **FAT Chain**: TODO in Week 2 (file cluster reconstruction)
- **Deleted Recovery**: Scan for `0xE5` directory markers + signatures

---

## Device Abstraction Layer

### Design Pattern: Strategy (Platform-Specific)

**Intent**: Abstract platform differences (Windows/macOS/Linux) behind common interface

**Implementation**:
- **Common Interface**: Methods for enumeration, reading, geometry
- **Platform Classes**: `WindowsDeviceManager`, `MacOSDeviceManager`, `LinuxDeviceManager`
- **Runtime Detection**: Select platform-specific manager at app startup

### Device Manager Interface

```typescript
static async enumerateDevices(): Promise<StorageDevice[]>;
static async readSectors(devicePath: string, startSector: number, sectorCount: number): Promise<Buffer | null>;
static async getDeviceGeometry(devicePath: string): Promise<Geometry | null>;
static async isDeviceMounted(devicePath: string): Promise<boolean>;
static async getSMARTData(devicePath: string): Promise<SMART | null>;
```

### Platform-Specific TODO (Week 2–3)

#### Windows
- **Device Enumeration**: WMI `Win32_LogicalDisk`, `Win32_DiskDrive`
- **Sector Reading**: `CreateFileA(\\.\PhysicalDriveX)` → `ReadFile`
- **Geometry**: `IOCTL_DISK_GET_DRIVE_GEOMETRY`

#### macOS
- **Device Enumeration**: IOKit, `diskutil list`
- **Sector Reading**: `/dev/rdiskX` with IOKit
- **Mount Status**: DADisk framework

#### Linux
- **Device Enumeration**: `/sys/block`, `lsblk`
- **Sector Reading**: `/dev/sdX` direct I/O
- **Geometry**: sysfs `/sys/block/sdX/size`

---

## Recovery Service Pipeline

### Scan Workflow

```
User Request
    ↓
[Quick Scan | Deep Scan]
    ↓
Device Enumeration
    ↓
Filesystem Identification (factory → parser)
    ↓
Boot Sector/Superblock Parse
    ↓
[Signature Search | Byte Scanning]
    ↓
File List Building
    ↓
Scan Results (display to user)
    ↓
User Selects Files
    ↓
File Extraction (via parser)
    ↓
Save to Output Path
```

### Scan State Machine

```
┌─────────┐
│ IDLE    │
└────┬────┘
     │ startQuickScan() / startDeepScan()
     ↓
┌─────────┐
│ RUNNING │ ← resumeScan()
├─────────┤
└────┬────┘
     │ pauseScan()
     ↓
┌─────────┐
│ PAUSED  │
└────┬────┘
     │ resumeScan() or cancelScan()
     ↓
┌─────────────┐
│ COMPLETED   │ or FAILED or CANCELLED
└─────────────┘
```

### Recovery Service Structure

```typescript
class RecoveryService {
  private scans: Map<string, ScanResult> = new Map();

  // Scan lifecycle
  async startQuickScan(deviceId: string): Promise<ScanResult>;
  async startDeepScan(deviceId: string): Promise<ScanResult>;
  pauseScan(scanId: string): boolean;
  resumeScan(scanId: string): boolean;
  cancelScan(scanId: string): boolean;

  // Results
  getScanResult(scanId: string): ScanResult | undefined;
  getScans(): ScanResult[];

  // Recovery
  async recoverFiles(scanId: string, fileIds: string[]): Promise<string>;
}
```

---

## Escalation Service

### Labs Integration Workflow

```
Scan Complete
    ↓
High-Value Data Detected? (estimated value > threshold)
    ↓
Offer Professional Escalation
    ↓
User Submits Case
    ↓
Labs API: submitCase(caseData)
    ↓
Case Status: submitted → assessed → quoted
    ↓
User Reviews Quote (€200–500)
    ↓
acceptQuote() or reject
    ↓
Labs Performs Recovery
```

### Escalation Case Structure

```typescript
interface EscalationCase {
  caseId: string;
  status: 'submitted' | 'assessed' | 'quoted' | 'accepted' | 'rejected';
  urgency: 'low' | 'normal' | 'high';
  quote?: {
    amount: number;
    currency: 'EUR';
    estimatedTurnaround: string;
  };
}
```

---

## Design Patterns

### 1. Factory Pattern (Filesystem Parsers)

```typescript
FilesystemParserFactory.register('NTFS', NTFSParser);
FilesystemParserFactory.register('FAT32', FAT32Parser);

const fsType = FilesystemParserFactory.identify(buffer);
const parser = await FilesystemParserFactory.createParser(fsType);
```

**Benefit**: Parsers can be added/removed without touching factory code (open/closed principle)

### 2. Strategy Pattern (Device Managers)

```typescript
// Platform detection at startup
const isMac = process.platform === 'darwin';
const deviceMgr = isMac ? MacOSDeviceManager : WindowsDeviceManager;

// Uniform interface across all platforms
const devices = await deviceMgr.enumerateDevices();
```

**Benefit**: Platform-specific code isolated; same API across all platforms

### 3. Template Method (Scan Orchestration)

```typescript
abstract class ScanEngine {
  async run(device: StorageDevice): Promise<FileEntry[]> {
    const buffer = await this.readBootSector(device);
    const parser = await this.identifyFilesystem(buffer);
    const files = await parser.scanDeletedFiles();
    return this.filterResults(files);
  }

  protected abstract async scanForFiles(...): Promise<FileEntry[]>;
}
```

**Benefit**: Quick and Deep scans follow same skeleton with different algorithms

### 4. Dependency Injection (App Initialization)

```typescript
export async function initializeApp(): Promise<DRGRecoveryApp> {
  const deviceManager = new DeviceManager();
  const recoveryService = new RecoveryService(deviceManager);
  const escalationService = new EscalationService();

  return new DRGRecoveryApp(deviceManager, recoveryService, escalationService);
}
```

**Benefit**: Services are loosely coupled; easy to mock for testing

---

## Data Flow

### Device Enumeration Flow

```
1. User calls: deviceMgr.enumerateDevices()
2. Platform-specific code runs:
   - Windows: WMI query → device list
   - macOS: diskutil parse → device list
   - Linux: sysfs scan → device list
3. Each device: StorageDevice interface
   {
     id: 'device-1',
     name: 'Samsung SSD 860 EVO',
     type: 'external',
     sizeBytes: 1099511627776,
     sectorSize: 512,
     isRemovable: true,
     isMounted: true,
     mountPoints: ['/media/drive']
   }
4. Return: StorageDevice[]
```

### File Parsing Flow

```
1. Start scan: recoveryService.startQuickScan('device-1')
2. Device manager reads boot sector (first 1024 bytes)
3. Factory identify(buffer) → tries each parser
4. NTFSParser.identify() checks for "NTFS    " signature → match!
5. NTFSParser.parseFileSystem() extracts metadata
6. NTFSParser.scanDeletedFiles() finds recoverable files
7. Results: FileEntry[]
   {
     id: 'file-1',
     name: 'document.docx',
     path: '/Documents/document.docx',
     size: 51234,
     type: 'file',
     isDeleted: true,
     recoveryConfidence: 95,
     clusters: [100, 101, 102, ...]
   }
8. Present to user for selection
```

### Recovery Flow

```
1. User selects files from scan results
2. Call: recoveryService.recoverFiles('scan-123', ['file-1', 'file-2'])
3. For each file:
   - Get file metadata from parser
   - Read clusters/sectors via device manager
   - Write to output path
   - Verify integrity (checksum if available)
4. Return: recoveryId (tracking ID for export job)
5. Export package ready at user-selected path
```

---

## Testing Strategy

### Unit Tests (70% coverage target)

- **Parser Tests**: Identification, metadata parsing, file operations
- **Service Tests**: Scan lifecycle, state management, error handling
- **Device Tests**: Platform stubs behavior, error handling

### Integration Tests

- **Parser Integration**: Device → Parser → File extraction
- **Recovery Workflow**: Device enum → Scan → Recovery → Export
- **Platform Consistency**: Same results across Windows/macOS/Linux

### E2E Tests (Week 3+)

- **UI Workflow**: User interaction → Results display → File recovery
- **Real Devices**: Physical USB drives, USB-attached external drives
- **Error Cases**: Corrupted filesystems, permission errors, disk errors

---

## Performance Targets (v1.0)

| Operation | Target | Notes |
|-----------|--------|-------|
| Device Enumeration | < 2s | WMI/IOKit/lsblk queries |
| Boot Sector Read | < 100ms | First 1024 bytes from device |
| Filesystem ID | < 50ms | Magic number checks |
| Quick Scan | 20–60s | Signature-based (10K–100K files) |
| Deep Scan | 2–4h | Full byte-read (100GB+ drives) |
| File Extraction | Disk-limited | Sequential reads |

---

## Security Considerations

### Input Validation

- ✅ Device paths sanitized (no path traversal)
- ✅ File sizes validated (prevent excessive allocation)
- ✅ Buffer sizes bounded (prevent OOM)
- ⚠️ User file selection rate-limited (prevent abuse)

### Privilege Escalation

- ⚠️ Sector reading may require root/admin (documented)
- ✅ No arbitrary code execution (file types validated)
- ✅ Extracted files quarantined until user confirms

### Data Privacy (Professional Labs)

- ✅ Case data encrypted in transit (HTTPS)
- ✅ Optional: Anonymize device S/N, file paths
- ✅ User consent required before case submission

---

## Future Extensibility (v1.1+)

### New Filesystems

Add new parser in `src/engine/parsers/`:

```typescript
export class XFSParser extends FilesystemParser {
  identify(buffer: Buffer): boolean { /* XFS magic check */ }
  async parseFileSystem(buffer: Buffer) { /* implementation */ }
  // ... other methods
}

// Register in app initialization
FilesystemParserFactory.register('XFS', XFSParser);
```

### New Platforms

Add new device manager:

```typescript
export class FreeBSDDeviceManager {
  static async enumerateDevices(): Promise<StorageDevice[]> { /* */ }
  // ... other methods
}

// Conditionally load at startup
if (process.platform === 'freebsd') {
  deviceMgr = FreeBSDDeviceManager;
}
```

### New Recovery Modes

Extend `RecoveryService`:

```typescript
async startRAIDRecovery(devices: string[]): Promise<ScanResult>;
async startEncryptedRecovery(deviceId: string, password: string): Promise<ScanResult>;
```

---

## References

- **Filesystems**:
  - NTFS: [Wikipedia NTFS](https://en.wikipedia.org/wiki/NTFS)
  - FAT32: [Wikipedia FAT](https://en.wikipedia.org/wiki/File_Allocation_Table)
  - HFS+: [Apple Technical Note](https://developer.apple.com/library/archive/technotes/tn/tn1150.html)
  - Ext4: [Linux Kernel Documentation](https://www.kernel.org/doc/html/latest/filesystems/ext4/)

- **Design Patterns**:
  - Factory: https://refactoring.guru/design-patterns/factory-method
  - Strategy: https://refactoring.guru/design-patterns/strategy
  - Template Method: https://refactoring.guru/design-patterns/template-method

---

**Document Version History**

| Date | Author | Change |
|------|--------|--------|
| Aug 18, 2026 | Claude (Autonomous) | Initial architecture document for v1.0 MVP |
