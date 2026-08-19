# Contributing to DRG Recovery Tool

Thank you for your interest in contributing to **DRG Recovery Tool**! This document outlines how to contribute to the project.

---

## 🤝 Code of Conduct

- Be respectful and professional
- No spam, harassment, or offensive language
- Focus on the project's goals
- Respect intellectual property rights

---

## 🐛 Reporting Bugs

### Before Submitting
1. Check existing GitHub issues (no duplicates)
2. Test on latest development build
3. Gather system info (OS, version, hardware)

### Bug Report Template
```
**Environment:**
- OS: [Windows 10/11, macOS Monterey, Ubuntu 22.04, etc.]
- DRG Version: [e.g., 1.0.0-dev]
- Device: [Internal SSD/HDD, External USB, etc.]
- File System: [NTFS, FAT32, HFS+, Ext4]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Logs/Screenshots:**
[Attach debug logs, screenshots]
```

---

## ✨ Proposing Features

### Before Submitting
1. Check roadmap (`docs/ROADMAP.md`)
2. Ensure feature aligns with v1.0 scope
3. Consider impact on 4-week timeline

### Feature Request Template
```
**Feature Name:** [Concise title]

**Use Case:**
[Who needs this? Why?]

**Proposed Solution:**
[How should it work?]

**Alternatives Considered:**
[Other approaches]

**Priority:**
[Critical / High / Medium / Low]

**v1.0 Scope?**
[Yes / Defer to v1.1+]
```

---

## 💻 Development Setup

### 1. Clone & Branch
```bash
git clone https://github.com/digitalrecoverygroup/DRGRecoveryTool.git
cd DRGRecoveryTool
git checkout -b feature/your-feature-name
```

### 2. Install Dependencies
```bash
npm install
npm run setup
```

### 3. Development Workflow
```bash
# Start dev server
npm run dev

# Run tests (after each change)
npm run test

# Lint code
npm run lint

# Build for testing
npm run build:dev
```

### 4. Commit Standards
**Message Format:** `[type]: description`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Test additions/fixes
- `chore:` Build, CI, config changes

**Examples:**
```
feat: Add NTFS quick scan engine
fix: Resolve memory leak in deep scan
docs: Update API documentation
refactor: Simplify file tree rendering
test: Add unit tests for FAT32 parser
```

### 5. Pull Request Process
1. **Branch:** Feature branch from `develop`
2. **Tests:** All tests pass locally
3. **Linting:** Code passes lint checks
4. **Documentation:** Update relevant docs
5. **PR Title:** Clear, follows convention
6. **Description:** Explain what & why
7. **Link:** Reference related issues

**PR Template:**
```markdown
## Description
[What does this PR do?]

## Related Issue
Closes #[issue number]

## Testing
[How was this tested?]

## Checklist
- [ ] Tests pass
- [ ] Code linted
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## 📝 Documentation Standards

### Code Comments
- Explain WHY, not WHAT
- One line max per section
- Use meaningful variable names

```javascript
// Good
const daysUntilExpiry = expiryDate - Date.now(); // Check license validity

// Avoid
const x = d - n; // compute x
```

### Documentation Files
- Markdown format (.md)
- Clear headings (H1, H2, H3)
- Code examples where relevant
- Keep lines < 100 characters

### API Documentation
- Parameters, return types, examples
- Error conditions
- Performance notes

---

## 🧪 Testing Requirements

### Coverage Targets
- Utility functions: 100%
- Business logic: 80%+
- UI components: 60%+ (visual testing)
- Integration: 70%+

### Test Types
```bash
npm run test:unit      # Unit tests
npm run test:integration # Integration tests
npm run test:e2e       # End-to-end tests
npm run test:coverage  # Coverage report
```

### Adding Tests
Place in `tests/` matching source structure:
```
tests/
├── unit/
│   ├── engines/
│   └── parsers/
├── integration/
│   └── workflows/
└── e2e/
    └── ui/
```

---

## 🚀 Deployment & Release

### Pre-Release Checklist
- [ ] All tests pass
- [ ] No lint errors
- [ ] CHANGELOG.md updated
- [ ] Version bumped (MAJOR.MINOR.PATCH)
- [ ] Documentation updated
- [ ] Release notes written

### Release Process
```bash
# Ensure develop is up-to-date
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v1.0.0

# Update version & CHANGELOG
npm run bump:version

# Commit & push
git add CHANGELOG.md package.json
git commit -m "chore: Release v1.0.0"
git push origin release/v1.0.0

# Create GitHub Release & tag
# (CI/CD will build & upload artifacts)
```

---

## 📚 Learning Resources

- **Architecture:** See `docs/ARCHITECTURE.md`
- **API Reference:** See `docs/API.md`
- **Deployment:** See `docs/DEPLOYMENT.md`
- **Roadmap:** See `docs/ROADMAP.md`

---

## ❓ Questions?

- **GitHub Issues:** Use discussions for questions
- **Email:** `dev@digitalrecovery.com`
- **Slack:** `#drg-recovery-tool` (team only)

---

## 📋 Development Checklist (Before PR)

- [ ] Feature complete & tested
- [ ] All tests pass (`npm run test`)
- [ ] Code linted (`npm run lint`)
- [ ] Documentation updated
- [ ] Commit messages follow standard
- [ ] No breaking changes
- [ ] Related issues linked
- [ ] Screenshots/GIFs if UI changed

---

Thank you for contributing to **DRG Recovery Tool**! 🙌

**Last Updated:** August 12, 2026
