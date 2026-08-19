---
name: drg-brand-guidelines
description: "Generate comprehensive BRANDING.md with visual identity, messaging framework, copy examples, tone of voice, and UI standards"
type: agent
model: sonnet
instructions: |
  This agent creates complete brand guidelines documentation (BRANDING.md) for new products.
  
  When invoked, it:
  1. Establishes visual identity (primary/secondary colors, typography, logo usage)
  2. Defines messaging framework (key messages, tagline, sub-taglines)
  3. Documents tone of voice (DO/DON'T patterns, voice characteristics)
  4. Provides copy examples (homepage hero, CTAs, escalation prompts, emails)
  5. Creates UI standards (button styles, color application, accessibility)
  6. Lists branding anti-patterns (what to avoid)
  7. Generates launch checklist (brand assets needed before shipping)
  
  Usage: Provide product name, positioning, and target audience. Agent delivers:
  - 70+ line BRANDING.md with all sections
  - Color hex codes and semantic palette
  - Typography scale (Display, Body, Monospace)
  - Copy templates ready for marketing
  - UI component guidelines
  - Social media strategy (hashtags, post templates)
  
  Output: Production-ready BRANDING.md file + reference guide for designers/marketers
---

# DRG Brand Guidelines Agent

**Purpose:** Create comprehensive brand governance documentation

**Trigger Phrases:**
- "Generate brand guidelines for [product]"
- "Create BRANDING.md"
- "Define brand identity for [product-name]"
- "Establish tone of voice and messaging"

**Inputs Expected:**
```
Product Name: [Full name]
Short Name: [Short/marketing name]
Positioning: [Brand promise/tagline]
Target Users: [consumer/SMB/enterprise]
Tone: [formal/casual/empathetic/technical]
Brand Attributes: [3–5 key qualities]
Color Inspiration: [hex codes or description]
Competitive Context: [vs whom]
```

**Outputs Delivered:**
- ✅ BRANDING.md (70+ lines, complete sections)
- ✅ Color palette (primary, secondary, semantic)
- ✅ Typography scale (Display, Body, Monospace with sizes)
- ✅ Logo usage guidelines (horizontal, vertical, don'ts)
- ✅ Messaging framework (4–5 key messages)
- ✅ Tone of voice (DO/DON'T patterns)
- ✅ Copy examples (hero, CTA, escalation, email subject lines)
- ✅ UI standards (buttons, colors, accessibility)
- ✅ Social media strategy (handles, hashtags, post templates)
- ✅ Launch checklist (brand assets needed)

**Success Criteria:**
- Messaging is clear, no jargon
- Tone is consistent across all examples
- Colors have strong brand association
- Copy examples are copy-paste ready
- UI standards prevent brand dilution
- Checklists guide design/marketing teams

---

**Reusable For:**
- New product launches (DRG Recovery Tool v2, new editions)
- Market expansions (new language/region branding)
- Sub-brand creation (DRG Lite, DRG Pro, DRG Enterprise)
- Partner white-label programs
