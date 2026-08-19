# Changelog

All notable changes to **DRG Recovery Tool** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for v1.0
- Device enumeration and file system detection
- NTFS, FAT32, HFS+, Ext4 parsers
- Quick Scan (signature-based, 30 sec)
- Deep Scan (full byte-by-byte read)
- File preview (images, docs, video)
- Selective recovery and export
- Windows installer
- Basic documentation

---

## [0.1.0] — 2026-08-12 (Project Initialization)

### Added
- Initial project structure
- README with overview and quick start
- Contributing guidelines
- Brand guidelines (BRANDING.md)
- Product roadmap (ROADMAP.md)
- Development environment setup
- Configuration templates (.env.example, settings.json)
- Git workflows (.gitignore)
- Documentation structure

### Infrastructure
- GitHub repository scaffolding
- CI/CD pipeline skeleton (to be configured)
- Build system setup (CMake)
- Testing framework setup

---

## Version History Format

For each release, include:

```markdown
## [Version] — YYYY-MM-DD

### Added
- New features (user-facing)
- New capabilities

### Changed
- Modifications to existing features
- Performance improvements

### Fixed
- Bug fixes
- Security patches

### Deprecated
- Features being phased out
- APIs being removed in future version

### Removed
- Features removed in this version
- APIs removed in this version

### Security
- Security vulnerability fixes
- Security-related changes

### Known Issues
- Outstanding bugs
- Limitations
- Workarounds
```

---

## Changelog Maintenance

### Guidelines
1. **Update on every release** — Keep changelog current
2. **Be specific** — Use clear, user-focused language
3. **Categorize changes** — Use the sections above
4. **Link issues** — Reference GitHub issues/PRs
5. **Version format** — `[Major.Minor.Patch] — YYYY-MM-DD`

### Release Process
1. Update CHANGELOG.md with new version section
2. Update VERSION in source
3. Commit: `chore: Release v1.0.0`
4. Tag: `git tag v1.0.0`
5. Push both commit and tag

### Examples of Good Changelog Entries

**Good:**
```markdown
### Added
- Quick Scan engine with signature-based file detection (#42)
- Windows 10/11 support for NTFS file system parsing
- File preview for common formats (JPG, PNG, PDF)

### Fixed
- Memory leak in Deep Scan with large drives (#55)
- UI freezing during pause/resume of long scans (#38)
```

**Avoid:**
```markdown
### Added
- Fixed stuff
- Updated code
- New features
```

---

## Release Schedule

- **v1.0** — September 2026 (Windows MVP)
- **v1.1** — October 2026 (macOS, Linux, Basic RAID)
- **v1.2** — November 2026 (Advanced RAID, Encryption, Forensics)
- **v2.0** — December 2026+ (Enterprise tier, SOC integration)

---

## Older Versions

Not yet released. This section will document historical versions.

---

**Note:** This project is in active development. Early versions may have significant changes.

**Maintained by:** DRG Recovery Tool Team  
**Last Updated:** August 12, 2026
