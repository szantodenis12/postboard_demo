---
client: ThermX
type: campaign
use-for: [campaign-planning, content-creation, strategy]
priority: high
last-updated: 2026-03-02
summary: "Referință #1 — Prezentare video Remotion 'Nano Revolution' (30 min, 21 slide-uri, 6 acte). Structura completă, fișiere sursă, status curent, note vizuale."
---

> **Dosarul thermX — Cuprins:**
> [README](../README.md) | [Dosar Tehnic](../BRAND_STRATEGY/DOSAR%20TEHNIC%20DE%20BRAND%20thermX.md) | [Identitate Vizuală](../BRAND_STRATEGY/IDENTITATE_VIZUALA_THERMX.md) | [Aliniere Tehnică](../BRAND_STRATEGY/ALINIERE_DATE_TEHNICE_THERMX.md) | [Outline 31 Slides](./PREZENTARE_LANSARE_26MARTIE2026.md) | [Script Prezentare](./SCRIPT_PREZENTARE_LANSARE_26MARTIE2026.md)

---

# REFERINȚĂ #1 — Prezentare Video „Nano Revolution"

**Tip:** Prezentare video Remotion (React)
**Durată:** 30 minute (54.000 frame-uri @ 30fps)
**Rezoluție:** 1920 × 1080 (Full HD)
**Composition ID:** `ThermX-NanoRevolution`
**Status:** Draft v1 — în lucru

---

## Locație fișiere sursă

```
my-video/src/thermx/nano-revolution/
├── data-nr.ts              → Date centrale (durații, specificații, comparații)
├── NanoRevolution.tsx       → Compoziție principală (TransitionSeries)
└── scenes/
    ├── S01_Cover.tsx        → Logo + titlu eveniment
    ├── S02_Agenda.tsx       → Roadmap vizual (6 puncte)
    ├── S03_Context.tsx      → 90% clădiri neizolate, cifre context
    ├── S04_RealLosses.tsx   → Termografie simulată
    ├── S05_Limitations.tsx  → Limitări izolație clasică
    ├── S06_WhatIf.tsx       → Punte dramatică „Ce-ar fi dacă..."
    ├── S07_Reveal.tsx       → ★ PEAK #1 — Reveal produs + „1mm"
    ├── S08_Principle.tsx    → Principiu funcționare (microsfere + IR)
    ├── S09_Composition.tsx  → Compoziție chimică (donut chart)
    ├── S10_Application.tsx  → Proces aplicare (3 pași)
    ├── S11_ThermalPerformance.tsx → Dashboard 2×2 performanță termică
    ├── S12_MaterialProperties.tsx → Proprietăți fizice (4 carduri)
    ├── S13_MechanicalStrength.tsx → ★ PEAK #2 — Rezistență + aging reveal
    ├── S14_Comparison.tsx   → Tabel comparativ (thermX vs EPS vs Vată)
    ├── S15_LossReduction.tsx → Reducere pierderi termice
    ├── S16_SpeedCost.tsx    → Viteză + cost aplicare
    ├── S17_Durability.tsx   → Garanție 20 ani, durată viață 35+ ani
    ├── S18_Industries.tsx   → Domenii validate (grid 3×2)
    ├── S19_ForArchitect.tsx → Mesaj direct pentru arhitecți
    ├── S20_CTA.tsx          → Call to action + contact
    └── S21_QA.tsx           → Întrebări
```

---

## Structură narativă — 6 acte, 21 slide-uri

### ACT I — SOSIREA (3 min)
| # | Slide | Durată | Descriere |
|---|-------|--------|-----------|
| 01 | Cover | 45s | Logo thermX animat + „26 MARTIE 2026 • ORADEA" |
| 02 | Agenda | 45s | Roadmap vizual cu 6 etape și iconuri Lucide |
| 03 | Context | 90s | Counter animat → 90%, 3 carduri context (308 kWh, PNRR, subvenții) |

### ACT II — PROBLEMA (4 min)
| # | Slide | Durată | Descriere |
|---|-------|--------|-----------|
| 04 | Pierderi reale | 2 min | Termografie simulată (ThermalGrid), contur clădire SVG |
| 05 | Limitări clasice | 60s | 3 carduri: GROS, PUNȚI TERMICE, LENT |
| 06 | „Ce-ar fi dacă..." | 60s | Punte dramatică spre soluție |

### ACT III — PRODUSUL (6 min)
| # | Slide | Durată | Descriere |
|---|-------|--------|-----------|
| 07 | **REVEAL** ★ | 2 min | Peak #1 — Logo dramatic, „1mm", 3 statistici preview |
| 08 | Principiu | 90s | Microsfere ceramice + reflexie IR (SVG animat) |
| 09 | Compoziție | 60s | Donut chart (20% stiren / 80% acrilic), ~75% microsfere |
| 10 | Aplicare | 90s | Timeline 3 pași + substraturi compatibile |

### ACT IV — DOVADA (9 min)
| # | Slide | Durată | Descriere |
|---|-------|--------|-----------|
| 11 | Performanță termică | 3 min | Dashboard 2×2: conductivitate, reflexie IR, emisie, temperatură |
| 12 | Proprietăți material | 2 min | 4 carduri: permeabilitate, absorbție, greutate, capacitate termică |
| 13 | **Rezistență** ★ | 2,5 min | Peak #2 — Aderență + aging reveal (2,0 → 3,0 MPa, +50%) |
| 14 | Comparație | 90s | Tabel 10 rânduri: thermX vs EPS vs Vată minerală |

### ACT V — IMPACTUL (5 min)
| # | Slide | Durată | Descriere |
|---|-------|--------|-----------|
| 15 | Reducere pierderi | 75s | 40% reducere pierderi termice |
| 16 | Viteză + cost | 75s | 80% mai rapid, 30% mai economic |
| 17 | Durabilitate | 75s | Garanție 20 ani, viață 35+ ani, timeline vizual |
| 18 | Domenii | 75s | Grid 3×2 industrii validate |

### ACT VI — ACȚIUNE (3 min)
| # | Slide | Durată | Descriere |
|---|-------|--------|-----------|
| 19 | Pentru arhitect | 75s | 6 beneficii checklist, mesaj direct |
| 20 | CTA | 60s | „SOLICITAȚI DEMONSTRAȚIE" + contact |
| 21 | Q&A | 45s | Logo + contact |

---

## Stil vizual

- **Background:** Premium dark (#000000 → gradient #121212)
- **Culori accent:** Orange #FF4500 + Blue #00509E
- **Fonturi:** Orbitron (headings, cifre) + Exo2 (body, diacritice românești)
- **Logo:** `thermx-logo-white.png` (din `/public/thermx/`)
- **Animații:** Spring physics (smooth, snappy, bouncy, heavy)
- **Tranziții:** Fade, slide, wipe între slide-uri
- **Elemente vizuale:** ParticleGrid, NoiseBackground, AccentLine, AnimatedCounter
- **Iconuri:** Lucide React (standard Epic Digital Hub)

---

## Note tehnice

- Exo2 cu latin-ext pentru diacritice românești corecte (ă, â, î, ș, ț)
- Fără `<Sequence>` în layout-uri grid (cauza bug-uri position:absolute)
- Date tehnice extrase din documentația oficială thermX
- Compoziția e înregistrată în `Root.tsx` ca `ThermX-NanoRevolution`

---

## Următorii pași

- [ ] Review complet al fiecărui slide în Remotion Studio
- [ ] Ajustare timing și pacing pe baza feedback-ului
- [ ] Adăugare imagini reale produs (Midjourney/fotografii)
- [ ] Sincronizare cu scriptul prezentatorului
- [ ] Export video final (MP4)
