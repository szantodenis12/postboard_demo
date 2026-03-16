---
client: ThermX
type: website-assets
use-for: [website]
priority: medium
last-updated: 2026-02-24
summary: "Specificații și instrucțiuni construire site thermX — priorități fișiere, assets vizuale, copy secțiuni, instrucțiuni AI pentru website build"
---

> **Dosarul thermX — Cuprins:**
> [README](../README.md) | [Dosar Tehnic](../BRAND_STRATEGY/DOSAR%20TEHNIC%20DE%20BRAND%20thermX.md) | [Identitate Vizuală](../BRAND_STRATEGY/IDENTITATE_VIZUALA_THERMX.md) | [Aliniere Tehnică](../BRAND_STRATEGY/ALINIERE_DATE_TEHNICE_THERMX.md) | [Strategie Marketing](../STRATEGIE_DIGITALA/STRATEGIE_MARKETING_DIGITAL_THERMX.md) | [SEO](../SEO/STRATEGIE_SEO_THERMX.md) | [Analiză Piață](../RESEARCH/ANALIZA_PIATA/ANALIZA_PIATA_TERMOIZOLATIE_RO.md) | [Competiție](../RESEARCH/ANALIZA_COMPETITIE/ANALIZA_COMPETITIE_THERMX.md) | [Personas](../RESEARCH/BUYER_PERSONAS/BUYER_PERSONAS_THERMX.md) | [Arhitecți](../RESEARCH/TARGETING_ARHITECTI/RESEARCH_ARHITECTI_THERMX.md) | [Calendar Martie](../CONTENT/CALENDAR_EDITORIAL_MARTIE_2026.md) | [Campanie Lansare](../CAMPANII/CAMPANIE_TEASER_LANSARE_26MARTIE2026.md)

---

# thermX — Brand Assets for Website Build

**Client:** Nano Revolution SRL
**Product:** thermX — Nanoceramic thermal insulation membrane
**Website:** nanorevolution.ro/thermx
**Date:** 21.02.2026

---

## ⚙️ INSTRUCTIONS FOR AI (READ FIRST)

You are building a website for **thermX**, a nanoceramic thermal insulation product. You have received the following files:

### Files & Priority

| File | Role | Priority |
|------|------|----------|
| **This document** (`BRAND_ASSETS_FOR_SITE_BUILD.md`) | **Primary brief** — all rules, specs, colors, typography, UI system, tone of voice | 🔴 **Mandatory — follow exactly** |
| **Logo SVGs** (`thermX – PN 1.svg`, `thermX – Negru.svg`) | Actual logo files to embed in the site | 🔴 **Mandatory — use as provided** |
| **A5 Presentation** (PDF) | **Visual style reference only** — use for layout feel, graphic treatments, section styling | 🟡 **Reference only** |

### Critical Rules

1. **This document overrides everything.** If the A5 presentation or any other file contradicts this document, **this document wins**.
2. **A5 Presentation = visual reference only.** Use it to understand the design mood, layout patterns, and graphic style. **DO NOT copy any text/copy from the presentation** — some of it contains unapproved wording.
3. **All website copy must be written in Romanian** with correct diacritics (ă, â, î, ș, ț). Use "tu" (informal) for general pages, "dumneavoastră" (formal) for B2B-focused sections.
4. **Tone = "The Expert Engineer"** — technical, analytical, data-driven. Every section needs at least one verifiable numerical specification. No marketing fluff, no emotional language, no forbidden words (see Section 5.3).
5. **Only use the approved technical values** from Section 6.1. Do not invent, round, or modify any numbers.
6. **Color usage is strict.** Orange `#FF4500` is accent only (3-5% of page). Blue `#00509E` is the primary action color. Follow the WCAG contrast pairs in Section 2.3.
7. **Fonts are Exo 2 (headlines/stats) + Inter (everything else).** No other fonts. See Section 3 for the full type scale.

---

## 1. BRAND IDENTITY

### 1.1 Company Info
- **Legal name:** Nano Revolution SRL
- **Address:** Str. Ogorului, Nr 3, Oradea, Bihor 410554, Romania
- **Phone:** +40 771 445 577
- **Email:** contact@nanorevolution.ro
- **Brand tagline:** NANO REVOLUTION
- **Brand slogan:** "TRANSFORMING THE FUTURE — ONE BREAKTHROUGH AT A TIME"

### 1.2 Logo
| Version | File | Usage |
|---------|------|-------|
| **Primary logo** | `thermX – PN 1.svg` | Light backgrounds, standard materials |
| **Dark/black logo** | `thermX – Negru.svg` | Dark backgrounds, footer, dark sections |

**Logo construction:**
- "therm" — lowercase, geometric font, precision and stability
- "X" — uppercase, differentiator, suggests chemical formula / thermal transfer variable

**Logo rules:**
- Protection zone: minimum height of letter "X" on all sides
- Minimum size: 80px width (digital), 25mm (print)
- Allowed backgrounds: white, black, brand gradient — never on saturated colored backgrounds
- NO shadow, glow, bevel, emboss effects
- NO color changes outside official versions
- NO distortion (rotate, stretch, compress)
- NO placement on busy or low-contrast backgrounds

---

## 2. COLOR PALETTE

### 2.1 Official Colors (5 colors)
Source: `coolors.co/ff4500-ffffff-4a4a4a-121212-00509e`

| Name | Hex | RGB | Role |
|------|-----|-----|------|
| **thermX Orange** | `#FF4500` | 255, 69, 0 | **Accent only** — CTA buttons, key data highlights, hover states. Use sparingly (3-5% of page) |
| **White** | `#FFFFFF` | 255, 255, 255 | Backgrounds, text on dark, negative space (~50-60%) |
| **Anthracite Gray** | `#4A4A4A` | 74, 74, 74 | Body text, secondary text, neutral UI (~10-15%) |
| **Deep Black** | `#121212` | 18, 18, 18 | Dark mode backgrounds, navbar, footer, headings on white (~20-25%) |
| **thermX Blue** | `#00509E` | 0, 80, 158 | Primary buttons, headings, links, icons (~15-20%) |

### 2.2 Usage Hierarchy
- **White (#FFFFFF):** Main background, cards, breathing space
- **Deep Black (#121212):** Main text on white, dark sections, navbar, footer
- **thermX Blue (#00509E):** Headings, primary buttons, links, accents, icons
- **Anthracite Gray (#4A4A4A):** Body paragraphs, captions, subtle borders, metadata
- **thermX Orange (#FF4500):** Urgent CTAs, badges, key data highlights, hover states

**Rule:** Orange `#FF4500` is used **ONLY as accent** — never on large surfaces. It's visual "salt": a little = impact; too much = disaster.

### 2.3 Approved Color Pairs (WCAG Compliance)
| Background | Text/Element | Contrast | Use |
|------------|-------------|----------|-----|
| `#FFFFFF` | `#121212` | 17.3:1 ✅ AAA | Main body text |
| `#FFFFFF` | `#00509E` | 6.1:1 ✅ AA | Headings, links, CTA |
| `#FFFFFF` | `#4A4A4A` | 6.9:1 ✅ AA | Secondary text, paragraphs |
| `#FFFFFF` | `#FF4500` | 4.0:1 ⚠️ AA Large | Buttons/text only at 18px+ bold |
| `#121212` | `#FFFFFF` | 17.3:1 ✅ AAA | Text on dark backgrounds |
| `#121212` | `#FF4500` | 4.3:1 ✅ AA Large | Large elements, buttons, icons only |
| `#00509E` | `#FFFFFF` | 6.1:1 ✅ AA | Primary buttons, banners, badges |
| `#121212` | `#00509E` | 2.8:1 ❌ | **DO NOT USE** — insufficient contrast |

### 2.4 Brand Gradients
```css
/* Premium gradient — hero sections, banners, headers */
background: linear-gradient(135deg, #121212 0%, #00509E 100%);

/* Overlay gradient — on images/video */
background: linear-gradient(180deg, rgba(18,18,18,0.85) 0%, rgba(18,18,18,0.2) 100%);

/* Accent gradient — CTA hover, small impact elements ONLY */
background: linear-gradient(90deg, #00509E 0%, #FF4500 100%);
```

### 2.5 Derived Colors (Opacities)
```css
/* Light backgrounds */
rgba(0, 80, 158, 0.10)   /* Blue 10% — alternate section backgrounds, light hover */
rgba(0, 80, 158, 0.20)   /* Blue 20% — text highlight, selected state */
rgba(18, 18, 18, 0.05)   /* Black 5% — card backgrounds, subtle separators */
rgba(255, 69, 0, 0.10)   /* Orange 10% — alert background, technical data highlight */

/* Shadows */
box-shadow: 0 1px 3px rgba(18, 18, 18, 0.08);   /* Default card shadow */
box-shadow: 0 4px 12px rgba(18, 18, 18, 0.12);   /* Hover card shadow */
```

---

## 3. TYPOGRAPHY

### 3.1 Font Stack
| Font | Role | Weights | Source |
|------|------|---------|--------|
| **Exo 2** | Display / Headlines / Large numbers | Regular (400), Medium (500), Black (900) | Google Fonts |
| **Inter** | Body text / UI / Everything else | Regular (400), Medium (500), SemiBold (600), ExtraBold (800), Black (900) | Google Fonts |

### 3.2 Type Scale
```
H1 — Exo 2 Black (900) / 48-64px / line-height: 1.1
     Use: Hero sections, page titles

H2 — Exo 2 Medium (500) / 32-40px / line-height: 1.2
     Use: Section titles

H3 — Inter ExtraBold (800) / 24-28px / line-height: 1.3
     Use: Subtitles, card titles

H4 — Inter SemiBold (600) / 18-20px / line-height: 1.4
     Use: Paragraph titles, labels

Body — Inter Regular (400) / 16px / line-height: 1.6
       Use: Paragraphs, descriptions

Body Small — Inter Regular (400) / 14px / line-height: 1.5
             Use: Captions, footnotes, metadata

Label/Overline — Inter SemiBold (600) / 12-13px / letter-spacing: 1.5px / UPPERCASE
                 Use: Categories, tags, small labels

Data/Numbers — Exo 2 Medium (500) / 36-56px
               Use: Impact statistics, KPIs
               Examples: "85%" / "0,001 W/mK" / "20 year warranty"
```

### 3.3 CSS Font Fallbacks
```css
/* Display */
font-family: 'Exo 2', 'Arial Black', 'Helvetica Neue', sans-serif;

/* Body */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 3.4 Typography Rules
- **Exo 2** ONLY for headlines and large stats — never for paragraphs
- **Inter** for all other content
- Technical data (Lambda, temps, percentages) always in **Inter SemiBold (600)** or **Exo 2**
- NO serif, script, or decorative fonts — ever
- Letter-spacing: +0.5px on Exo 2 at small sizes
- Units of measure: always with space: `0,001 W/mK` (not `0,001W/mK`)

---

## 4. UI DESIGN SYSTEM

### 4.1 Buttons
```css
/* PRIMARY */
.btn-primary {
  background: #00509E;
  color: #FFFFFF;
  font: 600 14-16px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 4-8px;
  padding: 12px 24px;
}
.btn-primary:hover { background: #003D7A; }

/* PRIMARY URGENT (strong CTA — use only for conversion: request quote, download datasheet) */
.btn-cta {
  background: #FF4500;
  color: #FFFFFF;
  font: 600 14-16px/1 'Inter', sans-serif;
  text-transform: uppercase;
  border-radius: 4-8px;
  padding: 12px 24px;
}
.btn-cta:hover { background: #E03D00; }

/* SECONDARY */
.btn-secondary {
  background: transparent;
  border: 1.5px solid #00509E;
  color: #00509E;
  font: 600 14-16px/1 'Inter', sans-serif;
}
.btn-secondary:hover { background: #00509E; color: #FFFFFF; }

/* GHOST (on dark #121212 backgrounds) */
.btn-ghost {
  background: transparent;
  border: 1.5px solid #FFFFFF;
  color: #FFFFFF;
  font: 600 14-16px/1 'Inter', sans-serif;
}
.btn-ghost:hover { background: #FFFFFF; color: #121212; }
```

### 4.2 Cards
```css
.card {
  background: #FFFFFF;
  border: 1px solid rgba(18, 18, 18, 0.08);
  border-radius: 8-12px;
  box-shadow: 0 1px 3px rgba(18, 18, 18, 0.08);
  padding: 24-32px;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(18, 18, 18, 0.12);
}
```

### 4.3 Spacing System (8px grid)
```
xs:   4px   — minimal internal spacing
sm:   8px   — gap between small elements
md:   16px  — standard gap
lg:   24px  — gap between small sections
xl:   32px  — section padding
2xl:  48px  — gap between large sections
3xl:  64px  — page section margins
4xl:  96px  — hero/main section spacing
```

### 4.4 Icons
- Style: Outline (line), stroke width 1.5–2px
- Corners: Rounded (consistent border-radius)
- Standard sizes: 24×24px (UI), 48×48px (feature icons), 64×64px (sections)
- Colors: Monochrome — Black `#121212` on white, White on black, or Blue `#00509E`
- General style: Minimalist, geometric, technical — no ornaments

---

## 5. TONE OF VOICE (for website copy)

### 5.1 Archetype: "The Expert Engineer"
- **Technical, Analytical, Normative**
- Convince through verifiable physical data, not adjectives
- Every claim must be supported by SNiP or ASTM/ASHRAE calculation
- Address rationality, not emotion

### 5.2 Content Structure (mandatory for every page section)
```
1. PHYSICAL PROBLEM    → Describe the thermal phenomenon (conduction, convection, radiation)
2. TECHNICAL SOLUTION  → Explain thermX mechanism (microspheres, IR reflection, polymerization)
3. SPECIFICATION/DATA  → Provide verifiable parameters (Lambda, %, °C, MPa)
4. CTA                 → Direct to technical datasheet or consultation
```

### 5.3 FORBIDDEN Words & Expressions
Never use on the website:
- "magic", "miracle", "incredible", "amazing" / "magic", "minune", "incredibil", "uimitor"
- "revolutionary", "game-changer", "unmatched" / "revoluționar", "game-changer", "inegalabil"
- "paint", "washable" / "vopsea", "lavabilă", "var"
- Emotional metaphors: "oasis of comfort", "happy walls", "the wall breathes"
- Personifications: the wall "feels", the house "dresses up"
- Filler adjectives without data: "superior", "exceptional" (without numbers = forbidden)
- Subjective comparisons without data: "much better than X"

### 5.4 Required Vocabulary
| Category | USE | DON'T USE |
|----------|-----|-----------|
| Product | Nanoceramic membrane, fluid composite, thermal barrier, vacuum microspheres | Thermal paint, magic paste, thermal washable |
| Performance | Thermal conductivity (Lambda), Diffuse reflection, Thermal resistance (R), Heat flux (Q) | "Makes it warm", "barrier against cold", "keeps pleasant temperature" |
| Action | Polymerization, IR radiation reflection, thermal bridge elimination, dew point displacement | "The wall breathes", "dries walls", "works miracles" |
| Efficiency | Energy efficiency, convective loss reduction, negligible structural load | "Small bills", "cheap maintenance", "fantastic savings" |

### 5.5 Website Copy Language
- **All website copy must be in Romanian** with proper diacritics: ă, â, î, ș, ț
- Use "tu" (informal) for general website — use "dumneavoastră" only for formal B2B sections
- Every page must contain at least one verifiable numerical specification

---

## 6. TECHNICAL SPECIFICATIONS (Approved Values for Site)

### 6.1 Quick Reference — Approved Numbers
These are the ONLY values approved for use on the website:

```
λ ≤ 0,001 W/(m·K)          — thermal conductivity
85% IR reflection            — after application
-60°C → +260°C              — operating temperature range
0,0014 mg/(m·h·Pa)          — vapor permeability
0,03 g/cm³                  — water absorption
12% elasticity               — relative elongation at break
~0,4 kg/m²                  — weight at 1mm thickness
1,53 / 1,84 / 1,84 MPa     — adhesion: metal / concrete / wood
20 year warranty             — manufacturer
35+ year lifespan            — estimated
40% heat loss reduction      — at 1mm thickness
30% installation cost saving — vs. conventional insulation
80% faster installation      — vs. conventional
Applied in multiple sectors   — petrochemical, naval, automotive, residential
Class C flammability         — MSZ-EN 15824:2009
```

### 6.2 Product Definition
- **Category:** Fluid thermal and waterproof insulation membrane, nanoceramic composite
- **Format:** Water-based liquid dispersion (styrene-acrylic latex), applied exclusively via specialized airless spray equipment
- **Layer thickness:** 0.5–1 mm (standard construction) / up to 3.5 mm (industrial)
- **Mechanism:** Insulation via conductive barrier (vacuum ceramic microspheres) + thermal radiation reflection (infrared) and radiative dispersion

### 6.3 Energy Performance Table
| Layer Thickness | Heat Loss Reduction |
|----------------|-------------------|
| 0.50 mm | ~25% |
| 1.00 mm | up to 40% |

### 6.4 Key Competitive Advantages (vs. mineral wool / EPS)
1. **Structural Integrity** — No dowels or mechanical fixing; doesn't perforate facade
2. **Weight** — ~0.4 kg/m² at 1mm — negligible structural load, ideal for heritage buildings
3. **Thermal Continuity** — Continuous monolithic application eliminates linear thermal bridges
4. **Maintenance** — Allows visual inspection of substrate without removing insulation
5. **Chemical & UV Resistance** — Acrylic polymer resists UV and weather; no additional protective render needed

### 6.5 Certifications & Standards
- СНиП 41-103-2000 (Russia) — thickness calculation formulas
- ASTM/ASHRAE/ANSI (USA) — alternative formulas
- MSZ-EN 15824:2009 — Flammability classification: Class C
- REACH compliant — not classified as hazardous mixture
- Used by: Gazprom, Rosneft, Lukoil

---

## 7. PHOTOGRAPHY & VISUAL STYLE

### 7.1 Photo Categories
| Category | Style |
|----------|-------|
| **Product** | Clean, neutral background, studio lighting, high-res |
| **Application** | Documentary on-site, natural light, authentic |
| **Thermal imaging** | Thermal camera images — before/after |
| **Projects** | Architectural photography, professional, before/after |
| **Team** | Professional portraits, industrial/lab setting |

### 7.2 Photo Rules
- **YES:** Real, authentic images from real projects
- **YES:** Thermal imaging (thermal camera) — most powerful visual asset
- **YES:** Technical close-ups (microsphere structure, product layer)
- **NO:** Generic stock photos with happy houses
- **NO:** Excessive filters or artificial saturation
- **NO:** Photomontages that distort real results

### 7.3 Thermal Imaging Colors
- Hot zones: Use `#FF4500` (naturally aligns with thermal camera imagery)
- Cold/insulated zones: Use `#00509E` (blue/orange contrast reflects thermographic scale)

---

## 8. SUGGESTED SITE STRUCTURE

Based on the brand strategy, here's a recommended page structure:

```
/                          → Homepage (hero + key stats + product intro + CTA)
/despre                    → About (Nano Revolution SRL, mission, team)
/produs                    → Product page (technical specs, mechanism, datasheet download)
/aplicatii                 → Applications (construction, industrial, pipes, heritage)
  /aplicatii/constructii
  /aplicatii/industrial
  /aplicatii/conducte
/avantaje                  → Advantages (vs. conventional insulation, comparison table)
/proiecte                  → Projects/Portfolio (before-after, thermal imaging)
/certificari               → Certifications & testing results
/intrebari-frecvente       → FAQ
/contact                   → Contact (form, phone, address, map)
/blog                      → Blog/Knowledge base (SEO content, technical articles)
```

### 8.1 Key Pages Content Guide

**Homepage Hero:**
- Gradient background `#121212 → #00509E`
- Headline in Exo 2 Black: e.g., "MEMBRANA NANOCERAMICĂ TERMOIZOLANTĂ"
- 3-4 key stats in Exo 2 Medium with orange accent: λ ≤ 0,001 | 85% reflexie IR | 40% reducere pierderi | 20 ani garanție
- Ghost CTA button: "SOLICITĂ OFERTĂ" / Primary CTA: "DESCARCĂ FIȘA TEHNICĂ"

**Product Page:**
- Structure: Problem → Solution → Specification → CTA (per section)
- Sections: thermal bridges, condensation control, energy efficiency at thin layers
- Include thermal imaging before/after
- Technical data table with all approved specs

**Contact:**
- Nano Revolution SRL
- Str. Ogorului, Nr 3, Oradea, Bihor 410554
- +40 771 445 577
- contact@nanorevolution.ro

---

## 9. ACCESSIBILITY REQUIREMENTS

- All text/background combinations must meet **WCAG 2.1 Level AA** minimum (4.5:1 normal text, 3:1 large text)
- Use the approved color pairs from Section 2.3
- Ensure all images have descriptive alt text
- Maintain proper heading hierarchy (H1 → H2 → H3 → body)

---

*This document is the single source of truth for the thermX website build.*
*All technical values sourced from the Technical Data Sheet (TDS) — verified 21.02.2026.*
*Brand assets compiled from: Identitate Vizuală, Dosar Tehnic de Brand, and Aliniere Date Tehnice.*
