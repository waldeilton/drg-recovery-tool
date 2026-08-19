# Getting Started — DRG Recovery Tool

**Version:** 1.0 MVP (Week 2 Autonomous Development Complete)  
**Status:** ✅ Core infrastructure ready, awaiting Git initialization

---

## Quick Start (5 minutes)

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- npm 9+ (included with Node.js)
- Git ([download](https://git-scm.com/))
- GitHub account (optional, for CI/CD)

### Step 1: Install Dependencies

```bash
cd DRGRecoveryTool
npm install
```

**Expected output:**
```
up to date, audited 42 packages in 2s
```

### Step 2: Run Tests (Optional)

```bash
npm test
```

**Expected output:**
```
 PASS  tests/unit/app.test.ts
 PASS  tests/unit/services/recoveryService.test.ts
 ...
 Test Suites: 8 passed, 8 total
 Tests:       120+ passed, 120+ total
```

### Step 3: Initialize Git & GitHub (Required for CI/CD)

```bash
# Make script executable
chmod +x scripts/init-github.sh

# Run initialization
./scripts/init-github.sh
```

**What this does:**
- ✅ Initializes Git repository
- ✅ Creates initial commit
- ✅ Sets up GitHub remote
- ✅ Pushes code to GitHub
- ✅ Triggers GitHub Actions CI/CD

### Step 4: Verify CI/CD Pipeline

Once pushed to GitHub:

1. Go to your repository: `https://github.com/YOUR_USERNAME/drg-recovery-tool`
2. Click **Actions** tab
3. Monitor the workflow runs
4. Wait for all checks to pass (Linux, macOS, Windows)

---

## Development Workflow

### Run in Development Mode

```bash
npm run dev
```

Starts the TypeScript compiler in watch mode with source maps.

### Run Tests

```bash
# All tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Lint & Format

```bash
# Check for lint errors
npm run lint

# Auto-fix and format
npm run format
```

### Build for Production

```bash
npm run build:prod
```

Creates optimized bundles in `dist/` directory.

---

## Project Structure

```
DRGRecoveryTool/
├── src/
│   ├── app.ts                      # Main application entry
│   ├── index.ts                    # CLI entry point
│   ├── utils/
│   │   └── logger.ts               # Structured logging
│   ├── engine/
│   │   ├── device/                 # Device I/O layer
│   │   │   ├── deviceManager.ts    # Interface
│   │   │   ├── windowsDevice.ts    # Windows implementation
│   │   │   ├── macosDevice.ts      # macOS implementation
│   │   │   └── linuxDevice.ts      # Linux implementation
│   │   ├── parsers/                # Filesystem parsers
│   │   │   ├── filesystemParser.ts # Base class & factory
│   │   │   ├── ntfsParser.ts       # NTFS
│   │   │   ├── fat32Parser.ts      # FAT32
│   │   │   ├── hfspluspParser.ts   # HFS+
│   │   │   └── ext4Parser.ts       # Ext4
│   │   ├── signatures/             # File signature database
│   │   │   └── fileSignatures.ts   # 35+ file types
│   │   └── scanning/               # Recovery algorithms
│   │       ├── quickScan.ts        # 30-60s signature scan
│   │       └── deepScan.ts         # 2-4h byte scan
│   └── services/
│       ├── recovery/
│       │   ├── recoveryService.ts  # Scan orchestration
│       │   └── fileExtractor.ts    # File reconstruction
│       └── escalation/
│           └── escalationService.ts # Labs integration
├── tests/
│   ├── unit/                       # Unit tests
│   └── integration/                # Integration tests
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions pipeline
├── config/
│   ├── settings.json               # App configuration
│   └── [development|production].env.example
├── scripts/
│   ├── setup.sh                    # Initial setup
│   └── init-github.sh              # GitHub initialization
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
├── .prettierrc.json
└── README.md
```

---

## Architecture Overview

### Three-Tier Recovery Pipeline

```
┌─────────────────────────────────────┐
│  User Interface (TBD: Qt/React)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Device & Filesystem Layer         │
│  • Device Enumeration (21 methods)  │
│  • Filesystem Parsing (4 types)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Recovery Algorithms                │
│  • Quick Scan (30-60s)              │
│  • Deep Scan (2-4h)                 │
│  • File Extraction                  │
└─────────────────────────────────────┘
```

### Device I/O (Cross-Platform)

| Platform | Implementation | Status |
|----------|---|---|
| Windows | PowerShell WMI queries | ✅ Live |
| macOS | diskutil + IOKit | ✅ Live |
| Linux | lsblk + sysfs | ✅ Live |

### Supported Filesystems

| Filesystem | Detection | Parsing | Status |
|---|---|---|---|
| NTFS | ✅ Boot sector | ✅ MFT enumeration | ✅ Live |
| FAT32 | ✅ Boot sector | ✅ FAT chain | ✅ Live |
| HFS+ | ✅ Volume header | ✅ Allocation bitmap | ✅ Live |
| Ext4 | ✅ Superblock | ✅ Inode table | ✅ Live |

### Supported File Types (35+)

**Documents:** PDF, DOCX, XLSX, PPTX, RTF  
**Images:** JPG, PNG, GIF, BMP, TIFF  
**Media:** MP3, MP4, AVI, WAV, FLAC  
**Archives:** ZIP, RAR, 7z, GZIP  
**Executables:** EXE, DLL, ELF, Mach-O  
**Databases:** SQLite  
**System:** Windows Registry hives

---

## Common Tasks

### Run a Quick Scan

```typescript
import { initializeApp } from './src/app';

const app = await initializeApp();
await app.start();

const recovery = app.getRecoveryService();
const scan = await recovery.startQuickScan('physicaldrive0');

console.log(`Found ${scan.filesFound || 0} files in 30-60s`);
```

### Extract Recovered Files

```typescript
const extractor = new FileExtractor();
const results = await extractor.extractMultiple(
  deviceBuffer,
  foundFiles,
  4096, // cluster size
);
```

### Add Support for New Filesystem

1. Create `src/engine/parsers/newfsParser.ts`
2. Extend `FilesystemParser` base class
3. Implement 6 abstract methods
4. Register in app initialization:
   ```typescript
   FilesystemParserFactory.register('NEWFS', NewFSParser);
   ```

---

## Configuration

### Environment Variables

Development (`.env.local`):
```env
LOG_LEVEL=debug
NODE_ENV=development
```

Production (`.env.production`):
```env
LOG_LEVEL=info
NODE_ENV=production
```

### Settings

Edit `config/settings.json`:
- Recovery timeouts
- Cluster size defaults
- UI preferences
- API endpoints

---

## Testing Strategy

### Unit Tests (80+ cases)
Focus: Individual components (parsers, device managers, services)

```bash
npm run test:unit
```

### Integration Tests (40+ cases)
Focus: Full recovery pipeline (device → parse → scan → extract)

```bash
npm run test:integration
```

### Coverage Report
```bash
npm run test:coverage
```

**Target:** 85%+ code coverage

---

## CI/CD Pipeline

### GitHub Actions Workflow

Triggered on:
- `push` to `main` or `develop`
- `pull_request` to any branch
- Scheduled nightly builds

### Workflow Steps

1. **Lint** — ESLint + Prettier check
2. **Type Check** — TypeScript strict mode
3. **Test** — Jest on Ubuntu/macOS/Windows
4. **Build** — Production bundling
5. **Security** — npm audit + Snyk
6. **Release** — Semantic versioning (on main push)

### View Status

```bash
# Local check
npm run lint
npm run type-check
npm test

# Remote status
https://github.com/YOUR_USERNAME/drg-recovery-tool/actions
```

---

## Troubleshooting

### "npm install fails"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Tests timeout on large scans"
Edit `jest.config.js`:
```javascript
testTimeout: 30000 // 30 seconds
```

### "Device enumeration returns empty"
- **Windows:** Run as Administrator
- **macOS:** Check mount permissions
- **Linux:** Ensure user has CAP_SYS_RAWIO or run with sudo

### "GitHub Actions fails"
- Check `.github/workflows/ci.yml`
- View logs in Actions tab
- Verify Node.js 18+ available on runner

---

## Next Steps

### Week 3 (Aug 19–25)
- [ ] Verify GitHub Actions passing
- [ ] Select UI framework (Qt or React)
- [ ] Begin UI implementation
- [ ] Integration testing on real devices

### Week 4 (Aug 26–Sep 2)
- [ ] Complete UI build
- [ ] Create Windows installer (NSIS)
- [ ] Package for macOS/Linux
- [ ] Release v1.0 MVP

### v1.1+ (Sep 2026+)
- [ ] RAID recovery
- [ ] Encryption key handling
- [ ] Enhanced UI/UX
- [ ] Performance optimizations

---

## Support & Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

**License:** MIT  
**Repository:** https://github.com/YOUR_USERNAME/drg-recovery-tool  
**Issues:** Report via GitHub Issues  
**Email:** waldeilton@gmail.com

---

## Quick Links

- 📖 [Architecture Guide](ARCHITECTURE.md)
- 🚀 [Product Roadmap](ROADMAP.md)
- 🎨 [Brand Guidelines](BRANDING.md)
- ✅ [Development Status](DEV_STATUS.md)
- 🔄 [Changelog](CHANGELOG.md)

---

**Ready to build?** Start with:
```bash
./scripts/init-github.sh
```

**Questions?** Check the Architecture guide or open an issue.
