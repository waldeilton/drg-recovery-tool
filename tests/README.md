# DRG Recovery Tool — Testing Guide

**Location:** `tests/`  
**Framework:** Jest (JavaScript), Google Test (C++)  
**Coverage Target:** 70%+

---

## 📁 Test Structure

```
tests/
├── unit/                   # Unit tests (isolated components)
│   ├── engine/            # C++ engine tests
│   ├── parsers/           # File system parser tests
│   │   ├── ntfs.test.js
│   │   ├── fat.test.js
│   │   └── ...
│   ├── ui/                # UI component tests
│   └── utils/             # Utility function tests
│
├── integration/           # Integration tests (components working together)
│   ├── scanning.test.js   # Scan → parse → recover flow
│   ├── escalation.test.js # MVP → Labs escalation
│   └── workflows.test.js  # End-to-end workflows
│
├── e2e/                   # End-to-end tests (full user flows)
│   ├── recovery.e2e.js    # User recovery scenario
│   └── ui.e2e.js          # UI interaction testing
│
└── fixtures/              # Test data
    ├── fs-images/        # Mock file system images
    ├── data-files/       # Sample files for recovery
    └── mock-api/         # Mock API responses
```

---

## 🧪 Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm run test -- tests/unit/parsers/ntfs.test.js
```

---

## ✍️ Writing Tests

### Unit Test Example (JavaScript)
```javascript
// tests/unit/parsers/fat.test.js
import FAT32Parser from '../../../src/engine/parsers/fat';
import fs from 'fs';

describe('FAT32 Parser', () => {
  let parser;
  let testImage;

  beforeEach(() => {
    parser = new FAT32Parser();
    testImage = fs.readFileSync('./tests/fixtures/fs-images/fat32-test.img');
  });

  test('should detect FAT32 file system', () => {
    const result = parser.identify(testImage);
    expect(result.type).toBe('FAT32');
    expect(result.clusterSize).toBe(4096);
  });

  test('should recover deleted files', () => {
    const recovered = parser.recover(testImage);
    expect(recovered).toHaveLength(42);
    expect(recovered[0].name).toBe('document.docx');
  });

  test('should handle corrupted sectors', () => {
    const corrupted = testImage.slice(0, 100);
    expect(() => parser.identify(corrupted)).toThrow();
  });
});
```

### Integration Test Example
```javascript
// tests/integration/scanning.test.js
import RecoveryWorkflow from '../../../src/services/recovery';
import MockDevice from '../fixtures/mock-api/device';

describe('Recovery Workflow', () => {
  test('should complete quick scan then deep scan', async () => {
    const device = new MockDevice('test-device');
    const workflow = new RecoveryWorkflow(device);

    // Quick scan
    const quickResults = await workflow.quickScan();
    expect(quickResults.filesFound).toBeGreaterThan(0);

    // Deep scan (should find more)
    const deepResults = await workflow.deepScan();
    expect(deepResults.filesFound).toBeGreaterThanOrEqual(quickResults.filesFound);
  });
});
```

### UI Component Test Example
```javascript
// tests/unit/ui/ScanProgress.test.js
import { render, screen } from '@testing-library/react';
import ScanProgress from '../../../src/ui/components/ScanProgress';

describe('ScanProgress Component', () => {
  test('should display scan progress percentage', () => {
    render(<ScanProgress progress={65} filesFound={1234} />);
    
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('1,234 files found')).toBeInTheDocument();
  });

  test('should show pause button during scan', () => {
    render(<ScanProgress progress={50} isScanning={true} />);
    
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    expect(pauseBtn).toBeEnabled();
  });
});
```

---

## 🎯 Testing Best Practices

### Do's ✅
- Write tests for public APIs and critical paths
- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies (API calls, file system)
- Keep tests isolated and independent
- Use fixtures for test data
- Test user-facing behavior (not implementation details)

### Don'ts ❌
- Don't test third-party libraries (trust they work)
- Don't hardcode test data in test files
- Don't test implementation details that users don't see
- Don't have tests that depend on other tests
- Don't skip flaky tests without fixing root cause
- Don't have tests that randomly pass/fail

---

## 📊 Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| **Utility Functions** | 100% | — |
| **Business Logic** | 80%+ | — |
| **Parsers** | 85%+ | — |
| **UI Components** | 60%+ | — |
| **Integration** | 70%+ | — |
| **Overall** | 70%+ | — |

Generate coverage report:
```bash
npm run test:coverage
```

View HTML report:
```bash
open coverage/index.html
```

---

## 🔧 Debugging Tests

### Run Single Test
```bash
npm run test -- --testNamePattern="should recover deleted files"
```

### Run with Debug Output
```bash
DEBUG=* npm run test
```

### Run in Watch Mode
```bash
npm run test:watch
```

### Use Node Debugger
```bash
node --inspect-brk ./node_modules/.bin/jest tests/unit/parsers/fat.test.js
```

Then open Chrome DevTools: `chrome://inspect`

---

## 📚 Test Data & Fixtures

### Mock File System Images
Located in `tests/fixtures/fs-images/`:
- `ntfs-healthy.img` — Clean NTFS volume
- `ntfs-deleted-files.img` — NTFS with deleted files
- `fat32-test.img` — FAT32 test image
- `hfs-damaged.img` — Corrupted HFS+ volume

### Mock API Responses
Located in `tests/fixtures/mock-api/`:
- `device-list.json` — Mock device enumeration
- `escalation-success.json` — Mock lab acceptance
- `labs-api.js` — Mock Labs API server

### Sample Data Files
Located in `tests/fixtures/data-files/`:
- Various file types (doc, jpg, pdf, etc.)
- Different sizes (small, medium, large)
- Corrupted files

---

## 🚀 CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to `develop` and `main`
- Pull requests
- Scheduled nightly runs

### Test Results
- ✅ All tests must pass before merge
- ✅ Coverage must not decrease
- ✅ No lint errors allowed

### Pre-commit Hook
```bash
npm run pre-commit
# Runs: lint + test + coverage check
```

---

## 🐛 Known Test Issues

| Issue | Status | Workaround |
|-------|--------|-----------|
| E2E tests flaky on CI | Investigating | Rerun on failure |
| Large image tests slow | Open | Use smaller fixtures locally |
| Encryption tests need keys | Blocked | Add test keys to CI secrets |

---

## 📋 Test Checklist

Before submitting a PR:
- [ ] New features have test coverage (70%+ target)
- [ ] All existing tests pass
- [ ] No decrease in overall coverage
- [ ] Edge cases tested (empty files, large volumes, corrupted data)
- [ ] Error cases handled gracefully
- [ ] Mocks are used for external dependencies
- [ ] Tests are fast (< 100ms per unit test)

---

## 📞 Help & Questions

- **GitHub Issues:** Questions about testing
- **Discussions:** Testing strategy
- **Email:** `qa@digitalrecovery.com`

---

**Last Updated:** August 12, 2026  
**Maintained by:** QA Team
