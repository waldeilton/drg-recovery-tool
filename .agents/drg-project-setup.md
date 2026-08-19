---
name: drg-project-setup
description: "Scaffold DRG Recovery Tool project with complete folder structure, 14 documentation files, and development guidelines"
type: agent
model: sonnet
instructions: |
  This agent initializes a new DRG-based project using the validated project structure template.
  
  When invoked, it:
  1. Creates folder hierarchy (src, tests, docs, config, web, assets, scripts)
  2. Generates 14 core documentation files (README, BRANDING, ROADMAP, CONTRIBUTING, etc.)
  3. Sets up configuration templates (development.env.example, production.env.example, settings.json)
  4. Establishes git rules (.gitignore, LICENSE)
  5. Creates technical guides (src/README.md, tests/README.md)
  
  Usage: Ask to initialize a new project by providing:
  - Project name (e.g., "DRG Data Recovery Tool")
  - Short description
  - Target audience (consumer/SMB/enterprise)
  - URL/domain
  - Key features (max 10 for MVP)
  - Pricing strategy
  
  Output: Complete project scaffold ready for Week 1 development.
---

# DRG Project Setup Agent

**Purpose:** Rapidly scaffold new projects following Digital Recovery Group standards

**Trigger Phrases:**
- "Initialize new DRG project"
- "Create project structure for..."
- "Setup DRG [product-name]"
- "Generate project scaffold"

**Inputs Expected:**
```
Project Name: [Name]
Description: [Brief description]
Target Users: [consumer/SMB/enterprise]
URL: [digitalrecovery.com/tools/...]
Core Features: [List 10 max]
Pricing: [€X one-time or model]
Timeline: [weeks to launch]
```

**Outputs Delivered:**
- ✅ Complete folder structure
- ✅ 14 documentation files
- ✅ Config templates (dev/prod)
- ✅ Git rules and license
- ✅ Development standards
- ✅ Memory artifacts for future reference

**Success Criteria:**
- Project ready for Day 1 development
- Team can start coding without strategy docs blocking
- All guidelines documented and centralized

---

**Reusable For:**
- New DRG product lines (Recovery Tool v2, Labs software, etc.)
- Partner integrations (white-label versions)
- Enterprise tier solutions
