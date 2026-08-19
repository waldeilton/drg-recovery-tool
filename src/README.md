# DRG Recovery Tool — Source Code

**Location:** `src/`  
**Primary Languages:** C++, JavaScript/TypeScript (UI)  
**Build System:** CMake + Node.js

---

## 📁 Directory Structure

```
src/
├── engine/                  # Core recovery engine (C++)
│   ├── device/             # Device I/O layer
│   ├── parsers/            # File system parsers
│   │   ├── ntfs/
│   │   ├── fat/
│   │   ├── hfs/
│   │   └── ext4/
│   ├── scanning/           # Scan engines (Quick, Deep)
│   └── utils/              # Utilities (hashing, conversion)
│
├── ui/                      # User interface (Qt/Web)
│   ├── desktop/            # Qt desktop application
│   ├── web/                # Web interface
│   └── components/         # Reusable UI components
│
├── api/                     # API layer
│   ├── local/              # Local IPC APIs
│   └── remote/             # Remote lab escalation APIs
│
├── services/               # Business logic services
│   ├── recovery/           # Recovery orchestration
│   ├── escalation/         # Lab escalation service
│   └── licensing/          # License validation
│
└── config/                 # Configuration loading
```

---

## 🔨 Build & Development

### Prerequisites
- **C++ Compiler:** GCC 11+ or Clang 14+
- **CMake:** 3.20+
- **Node.js:** 18+
- **Qt:** 6.0+ (for desktop UI)

### Build Commands

#### Development Build
```bash
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Debug ..
make
```

#### Production Build
```bash
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
```

#### Web UI Development
```bash
cd src/ui/web
npm install
npm run dev
```

---

## 📝 Code Style & Standards

### C++ Conventions
- **Naming:** `CamelCase` for classes, `snake_case` for functions/variables
- **Indentation:** 2 spaces
- **Comments:** Explain WHY, not WHAT
- **Error Handling:** Exceptions for exceptional cases only

### JavaScript/TypeScript Conventions
- **Naming:** `camelCase` for variables/functions, `PascalCase` for components
- **Indentation:** 2 spaces
- **Linting:** ESLint + Prettier
- **Type Safety:** TypeScript for type checking

---

## 🧪 Testing

### Unit Tests
```bash
cd build
ctest --output-on-failure
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

---

## 🔐 Security Guidelines

- Never hardcode secrets (use env vars)
- Validate all file system operations
- Use platform-provided crypto (not custom)
- Log security events, not sensitive data
- Regular dependency updates (`npm audit`)

---

## 📚 Module Documentation

### Engine Modules
Each C++ module should have a README.md explaining:
- Purpose
- Public API
- Usage examples
- Known limitations

### UI Components
Each React/Vue component should have:
- JSDoc comments
- PropTypes/TypeScript interfaces
- Usage examples

---

## 🚀 Getting Started

1. **Clone repository**
   ```bash
   git clone https://github.com/digitalrecoverygroup/DRGRecoveryTool.git
   cd DRGRecoveryTool
   ```

2. **Set up development environment**
   ```bash
   cp config/development.env.example .env.development
   ```

3. **Build engine**
   ```bash
   mkdir build && cd build
   cmake -DCMAKE_BUILD_TYPE=Debug ..
   make
   ```

4. **Start UI development server**
   ```bash
   cd src/ui/web
   npm install
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

---

## 📋 Code Review Checklist

Before submitting a PR:
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No hardcoded secrets
- [ ] Documentation updated
- [ ] Error messages are helpful
- [ ] Performance impact considered

---

## 🆘 Troubleshooting

### Build Issues
- **CMake not found:** `sudo apt install cmake` (Linux) or `brew install cmake` (macOS)
- **Qt not found:** Install from `https://www.qt.io`
- **Node modules:** `npm install` or `npm ci`

### Runtime Issues
- **File system detection fails:** Check device permissions
- **Memory issues:** Reduce scan parallelization in config
- **Slow scans:** Enable caching, check disk health

---

## 📞 Help & Questions

- **GitHub Issues:** Bug reports, feature requests
- **Discussions:** General questions
- **Email:** `dev@digitalrecovery.com`

---

**Last Updated:** August 12, 2026  
**Maintained by:** DRG Recovery Tool Development Team
