---
name: drg-dev-standards
description: "Generate CONTRIBUTING.md with development workflow, commit standards, PR process, testing requirements, and code style guidelines"
type: agent
model: sonnet
instructions: |
  This agent creates comprehensive development standards documentation (CONTRIBUTING.md).
  
  When invoked, it:
  1. Defines commit message standards (type: description format)
  2. Creates PR template with checklist
  3. Establishes code style guidelines (indentation, naming, comments)
  4. Documents testing requirements (coverage targets, test types)
  5. Specifies development workflow (branch, test, lint, deploy)
  6. Provides bug report and feature request templates
  7. Creates pre-PR checklist
  8. Defines release process (versioning, tag, publish)
  
  Usage: Provide tech stack and team size. Agent delivers:
  - 120+ line CONTRIBUTING.md with all sections
  - Commit message templates
  - PR template (copy-paste ready)
  - Bug/feature request templates
  - Code style guide (language-specific)
  - Testing expectations
  - Release checklist
  
  Output: Production-ready CONTRIBUTING.md that reduces onboarding friction and prevents code review thrash
---

# DRG Development Standards Agent

**Purpose:** Create comprehensive development workflow and code standards documentation

**Trigger Phrases:**
- "Generate development standards for [project]"
- "Create CONTRIBUTING.md"
- "Define code style and commit standards"
- "Setup PR workflow"

**Inputs Expected:**
```
Tech Stack: [languages, frameworks]
Team Size: [solo/small/medium/large]
Testing Framework: [Jest, pytest, Google Test, etc.]
CI/CD Platform: [GitHub Actions, etc.]
Deployment Target: [web, desktop, mobile, hybrid]
Code Style: [eslint, black, clang-format, etc.]
Target Coverage: [60%, 70%, 80%+]
```

**Outputs Delivered:**
- ✅ CONTRIBUTING.md (120+ lines, complete sections)
- ✅ Commit message standard (feat:, fix:, docs:, refactor:, test:, chore:)
- ✅ Branch naming convention (feature/, fix/, release/)
- ✅ PR template (description, testing, checklist)
- ✅ Bug report template (environment, steps, expected vs actual)
- ✅ Feature request template (use case, solution, alternatives)
- ✅ Code style guide (indentation, naming, comments)
- ✅ Testing requirements (unit, integration, e2e coverage targets)
- ✅ Linting and formatting rules
- ✅ Pre-PR checklist (tests pass, lint clean, docs updated)
- ✅ Release process (version bump, changelog, tag, publish)
- ✅ Development workflow diagram (branch → test → lint → PR → merge)

**Success Criteria:**
- Standards are specific (not generic)
- Examples are included for clarity
- Templates are copy-paste ready
- Checklist prevents common mistakes
- Coverage targets are realistic given timeline
- Release process is fully documented
- New developers can onboard without questions

---

**Reusable For:**
- Onboarding new developers (self-service learning)
- Code review consistency (shared standards prevent debate)
- Release automation (clear process reduces human error)
- Quality gates (coverage, lint, security checks)
- Post-launch maintenance (hotfixes, patches follow same standards)
