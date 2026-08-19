# 🤖 DRG Recovery Tool — Agent Skills

**Location:** `.agents/` directory in project root

**Purpose:** Reusable agent definitions for common DRG project tasks—initialization, market analysis, branding, roadmap, and development standards

---

## 📋 Available Agents

### 1. **drg-project-setup** 🏗️
Scaffold new projects with complete folder structure, 14 documentation files, and development guidelines.

**Use when:** Starting new DRG product or using template for similar project
**Invoke:** `/drg-project-setup`
**Delivers:** Ready-to-code project structure

### 2. **drg-market-convergence** 📊
Analyze market fit between new MVP software and existing professional services.

**Use when:** Building product that integrates with existing business
**Invoke:** `/drg-market-convergence`
**Delivers:** Convergence analysis + revenue model + go-to-market strategy

### 3. **drg-brand-guidelines** 🎨
Generate comprehensive BRANDING.md with visual identity and messaging framework.

**Use when:** Defining brand for new product or sub-brand
**Invoke:** `/drg-brand-guidelines`
**Delivers:** Production-ready BRANDING.md + color palette + copy examples

### 4. **drg-roadmap-generator** 🗺️
Create 18-month product roadmap with version timelines, features, and revenue projections.

**Use when:** Planning MVP → enterprise expansion
**Invoke:** `/drg-roadmap-generator`
**Delivers:** Strategic roadmap + feature matrix + revenue model + success metrics

### 5. **drg-dev-standards** 📝
Generate CONTRIBUTING.md with workflow, commit standards, PR process, and testing requirements.

**Use when:** Onboarding development team or establishing code standards
**Invoke:** `/drg-dev-standards`
**Delivers:** Production-ready development guidelines + templates

---

## 🚀 Quick Start

### To Use These Agents

Option A: **In Claude Code IDE**
```bash
/drg-project-setup
# Then provide inputs when prompted
```

Option B: **Web UI**
Navigate to Skills → Select agent → Provide inputs

Option C: **CLI**
```bash
claude agents run drg-project-setup --input "Project Name: ..."
```

---

## 📝 How to Invoke

### Example 1: Initialize New Project
```
User: /drg-project-setup

Project Name: DRG Data Recovery Tool
Description: Self-service data recovery software
Target Users: Consumer, SMB
URL: digitalrecovery.com/tools/DRGRecoveryTool
Core Features: Quick Scan, Deep Scan, File Preview, Recovery, Labs Escalation
Pricing: €39.97 (one-time)
Timeline: 4 weeks to MVP
```

### Example 2: Analyze Market Convergence
```
User: /drg-market-convergence

Existing Business: digitalrecovery.com (23-year data recovery labs)
New MVP: €39.97 consumer software with labs escalation
Target Users: 100k–500k Year 1
Questions: Will it cannibalize? Revenue model? Go-to-market timeline?
```

### Example 3: Generate Brand Guidelines
```
User: /drg-brand-guidelines

Product: DRG Recovery Tool
Positioning: Professional-grade data recovery. Consumer-simple price.
Target: Consumer + SMB
Tone: Helpful, clear, no jargon
Brand Attributes: Trustworthy, accessible, professional, transparent
```

### Example 4: Create Product Roadmap
```
User: /drg-roadmap-generator

MVP: 10 features, Windows, €39.97
Timeline: 4 weeks to launch
User Growth: 1k month 1 → 500k year 1
Revenue Model: Software (€39.97) + Lab referrals (€200–500/case)
```

### Example 5: Establish Dev Standards
```
User: /drg-dev-standards

Tech Stack: C++, JavaScript/TypeScript, Qt, CMake
Team Size: 5–10 developers
Testing: Jest + Google Test (70%+ coverage)
Platform: Windows, macOS, Linux
```

---

## 💡 Agent Workflow (Full Cycle)

**Typical project flow using all 5 agents:**

```
Week 0: Setup & Strategy
  1️⃣ /drg-project-setup
     → Creates folder structure + 14 base files
  
  2️⃣ /drg-market-convergence
     → Validates fit with existing business
     → Revenue model + risks
  
  3️⃣ /drg-brand-guidelines
     → Visual identity + messaging
     → Copy templates + UI standards
  
  4️⃣ /drg-roadmap-generator
     → v1.0–v2.0 timeline
     → Feature scoping + metrics
  
  5️⃣ /drg-dev-standards
     → Commit + PR standards
     → Testing requirements + checklist

Week 1: Development Starts
  → Team has everything documented
  → Zero blocker on "what should we build?"
  → Parallel work: Dev codes, Marketing executes, Design refines
```

---

## 🎯 When to Use Each Agent

| Agent | Use When | Output |
|-------|----------|--------|
| **drg-project-setup** | Starting new project | Folder + 14 files |
| **drg-market-convergence** | Building software + services | Revenue model + risks |
| **drg-brand-guidelines** | Defining brand | BRANDING.md + palettes |
| **drg-roadmap-generator** | Planning versions | ROADMAP.md + timeline |
| **drg-dev-standards** | Onboarding team | CONTRIBUTING.md + templates |

---

## 📚 Outputs Reference

Each agent produces Markdown files ready for:
- Direct use in projects
- Team documentation
- Onboarding new members
- Investor presentations
- Partner alignment

### File Locations After Agent Runs

```
DRGRecoveryTool/
├── README.md                  ← from setup agent
├── BRANDING.md               ← from branding agent
├── ROADMAP.md                ← from roadmap agent
├── CONTRIBUTING.md           ← from dev standards agent
└── config/
    ├── development.env.example
    ├── production.env.example
    └── settings.json
```

---

## 🔄 Reusing Agents for Other Projects

### DRG Recovery Tool v2 (macOS/Linux)
```
/drg-roadmap-generator
→ Input: Expand v1.0 (Windows) with v1.1 (macOS/Linux)
→ Output: Roadmap with new platforms, features, timeline
```

### DRG White-Label Partner
```
/drg-brand-guidelines
→ Input: Partner name + branding requirements
→ Output: Partner-specific BRANDING.md + customization rules
```

### New DRG Product Line
```
/drg-project-setup
→ Input: New product (e.g., "DRG Forensics Tool")
→ Output: Complete scaffold with adjusted positioning
```

---

## 📞 Help & Questions

- **Invoke agent:** Use `/[agent-name]` in Claude Code
- **Agent help:** Each agent has `instructions` field with details
- **Combine agents:** Use output from one as input to next
- **Customize:** Modify agent templates in this folder for your needs

---

## 🔐 Important Notes

- Agents are **templates**, not hard rules
- Customize outputs based on your specific context
- Test agent outputs before committing to repository
- Update agents if you discover better patterns

---

**Created:** August 12, 2026  
**Validated:** ✅ Used successfully to initialize DRG Recovery Tool  
**Ready:** ✅ Reusable for all future DRG projects

---

**Next Steps:**
1. Use agents to scaffold your project
2. Review and customize outputs
3. Commit to repository
4. Share with team

**Questions?** Check agent instructions or memory: [[drg-recovery-tool-project]]
