---
client: DentalNet
type: content-template
use-for: [content-creation]
priority: medium
last-updated: 2026-03-09
summary: "Midjourney prompts pentru Carnetul de Sănătate Dentară — model hybrid card fizic A5 8 pagini + pagină digitală QR, ilustrații ZEN, specificații tehnice print, concept și layout + PERSONAJE DINȚI: 18 prompts cu anatomie dentară reală (morfologie corectă cuspizi/rădăcini) + fețe mici drăguțe — character sheets arcade, scene carnet, social media, stickere"
---

> **Dosarul DentalNet Kids — Cuprins:**
> [README — Client Brief](../../README.md) | [Analiză Piață](../../ANALIZA_PIATA_PREVENTIE_DENTARA_PEDIATRICA_ORADEA.md) | [Strategie Brand 2026](../../STRATEGIE_BRAND_DENTALNET_KIDS_2026.md) | [Postări Martie 2026](../SOCIAL_MEDIA/MARTIE_2026_POSTARI.md) | [MJ Prompts Martie](../SOCIAL_MEDIA/MIDJOURNEY_PROMPTS_MARTIE_2026.md) | [Carnet Dentar Prompts](../CARNET_SANATATE_DENTARA/CARNET_DENTAR_MJ_PROMPTS.md)

---

# Carnetul de Sănătate Dentară — DentalNet Kids
# Model Hybrid: Card Fizic (8 pag.) + Pagină Digitală

**Client:** DentalNet Kids
**Creat de:** Epic Digital Hub
**Data:** 21.02.2026
**Versiune:** 2.0 — Hybrid (A+E)

---

## CONCEPT

**Problema:** Un carnet de 28 pagini e scump la tiraj mare și conține informații educative pe care părintele le citește o singură dată.

**Soluția:** Împărțim în două:

| Component | Ce conține | Cost |
|-----------|-----------|------|
| **Card fizic (8 pag.)** | Doar tracking medical — ce completează doctorul | ~2-4 RON/buc |
| **Pagină digitală (QR)** | Tot conținutul educativ + diplome + istoric complet | 0 RON — pe website |

**Rezultat:** Părintele primește un card subțire, ușor de păstrat. Scanează QR-ul și are totul online — ghid periaj, nutriție, urgențe, diplome. Costul scade cu ~60%, iar conținutul digital e nelimitat și actualizabil.

---

# PARTEA 1 — CARD FIZIC (8 PAGINI)

## Specificații Tehnice Print

| Element | Detaliu |
|---------|---------|
| **Format** | A5 (148 × 210 mm) |
| **Pagini** | 8 (o coală A3 pliată în jumătate, capsată) |
| **Legare** | Capsă simplă (1 capsă centru) |
| **Hârtie interior** | 170g couché mat |
| **Hârtie copertă** | 250g couché mat (fără laminare — economie) |
| **Culori print** | CMYK full color |
| **Paletă** | Sage green (#8FA98F), warm beige (#F5E6D3), cream (#FFF8F0), soft mint (#C5E0D0), text gri (#3D3D3D) |
| **Fonturi** | Nunito (titluri) + Poppins (corp text) |
| **Cost estimat** | 2-4 RON/buc la tiraj 500+ |

### Reguli vizuale:
- ZEN apare pe copertă + subtil pe 2-3 pagini interioare (nu pe toate — economie cerneală)
- Design curat, mult spațiu alb — e formular medical, nu carte de povești
- `--no teeth, dental instruments, syringes, needles, blood, crying, neon colors, sharp edges`

---

## PAGINA: COPERTĂ FAȚĂ

### Text:

```
CARNETUL MEU DE SĂNĂTATE DENTARĂ

Numele: _______________________________
Data nașterii: ____/____/________

[Logo DentalNet Kids]

Creștem dinți sănătoși.

Scanează pentru ghidul complet:
[QR CODE → dentalnetkids.ro/carnet]
```

### Midjourney Prompt:

```
A5 booklet cover for a children's dental health card, the character sitting calmly in the lower right corner, warm beige background with subtle sage green rounded border frame, clean minimal design, large empty space in center for title text and QR code, soft natural lighting, matte finish, pediatric healthcare aesthetic, 3D render --ar 2:3 --s 150 --cref [URL_ZEN] --cw 100 --v 7 --no teeth, dental instruments, syringes, needles, blood, crying, neon colors, sharp edges
```

**Variantă minimalistă (fără ZEN pe copertă):**
```
A5 booklet cover background, warm beige base with a soft sage green rounded rectangle border, small decorative leaf and shield motifs in corners, clean minimal professional pediatric design, matte flat style, large empty center space for text and QR code, no text --ar 2:3 --s 150 --v 7 --no teeth, dental instruments, neon colors, sharp edges
```

---

## PAGINA 1 — Datele Copilului + Hartă Dinți

### Text:

```
DATELE MELE

Nume și prenume: ________________________________
Data nașterii: ____/____/________
Alergii: ________________________________________
Medic: Dr. ______________________________________
Prima vizită: ____/____/________

─────────────────────────────────────────────

HARTA DINȚILOR MEI

    Dinți de lapte (20)              Dinți permanenți (28-32)

    [Diagrama arcadă sus]           [Diagrama arcadă sus]
    [Diagrama arcadă jos]           [Diagrama arcadă jos]

    Legendă:
    🟢 Sănătos  🟡 De urmărit  🔴 Tratat  ✕ Extras  S Sigilat

Doctorul actualizează harta la fiecare vizită.
```

### Midjourney Prompt — Diagrame dinți (ambele pe aceeași pagină):

```
Two simplified dental arch diagrams side by side on warm cream background, left diagram smaller with 20 rounded cartoon teeth labeled baby teeth, right diagram slightly larger with 28 rounded cartoon teeth labeled permanent, both shown as soft U-shaped arches in light sage green outlines, clean minimal vector-like style, no realistic anatomy, compact medical form aesthetic, soft pastel tones --ar 3:2 --s 100 --v 7 --no realistic teeth, scary, blood, instruments, sharp edges
```

---

## PAGINILE 2-7 — Fișe de Vizită (6 vizite)

### Text (identic pe fiecare pagină):

```
VIZITA NR. ___

Data: ____/____/________              Vârsta: ___ ani ___ luni

Proceduri efectuate:
☐ Control preventiv          ☐ Igienizare profesională
☐ Fluorizare                 ☐ Sigilare molari
☐ Radiografie                ☐ Tratament: ________________

Evaluare risc carii:  ☐ Scăzut 🟢   ☐ Moderat 🟡   ☐ Crescut 🔴

Observații:
_______________________________________________________________
_______________________________________________________________

Recomandări:
_______________________________________________________________

Următoarea programare: ____/____/________

Semnătura medic: ______________     [Loc sticker ZEN]
```

### Midjourney Prompt — Background pagină vizită:

```
Clean minimal form page background for children's health booklet, warm cream base with very subtle sage green thin line border, tiny ZEN character watermark in bottom right corner at 10% opacity, professional medical form aesthetic with warm pediatric touch, matte flat design, no text, space for form fields --ar 2:3 --s 100 --v 7 --no teeth, dental instruments, neon colors, sharp edges
```

### Midjourney Prompt — ZEN stickere (set de 6 pentru vizite):

```
The character in a proud pose with a tiny golden star above, warm beige background, sticker-ready circular composition, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

```
The character giving a gentle thumbs-up, calm happy expression, warm beige background, sticker-ready circular composition, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

```
The character sitting next to a tiny translucent mint-green shield, proud pose, warm beige background, sticker-ready, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

```
The character wearing a tiny sage green cape, standing confidently, warm beige background, sticker-ready, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

```
The character with a tiny green checkmark floating beside it, accomplished pose, warm beige background, sticker-ready, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

```
The character standing on a tiny soft green podium, champion pose, warm beige background, sticker-ready, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

---

## PAGINA: COPERTĂ SPATE

### Text:

```
[Logo DentalNet Kids]

Prevenim. Nu reparăm.

━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Str. Mihail Kogălniceanu 49a, Oradea 410074
📱 0259 418 757 / 0723 336 320
📧 scdentalnetsrl@yahoo.com

@dentalnet.kids          Dentalnet KIDS

Program: Luni-Vineri 8:00-20:00

━━━━━━━━━━━━━━━━━━━━━━━━━

Când se termină cele 6 vizite,
solicită un carnet nou la recepție.

Ghid complet periaj, nutriție,
urgențe și diplomele copilului:
[QR CODE → dentalnetkids.ro/carnet]

[ZEN mic — face cu mâna]
```

### Midjourney Prompt:

```
The character waving gently with one small arm, warm friendly pose, warm beige background with soft sage green gradient at bottom, clean minimal composition, soft lighting, 3D render --ar 2:3 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

---

## REZUMAT CARD FIZIC

| Pagina | Conținut | ZEN? |
|--------|----------|------|
| Copertă față | Titlu + nume + QR | Da (colț) |
| P1 | Date copil + hartă dinți (ambele seturi) | Nu |
| P2 | Vizita 1 | Sticker spot |
| P3 | Vizita 2 | Sticker spot |
| P4 | Vizita 3 | Sticker spot |
| P5 | Vizita 4 | Sticker spot |
| P6 | Vizita 5 | Sticker spot |
| P7 | Vizita 6 | Sticker spot |
| Copertă spate | Contact + QR + „cere carnet nou" | Da (mic) |

**Total print:** 1 coală A3 pliată = 8 pagini
**Total prompts MJ:** ~10 (copertă, hartă dinți, fundal vizită, 6 stickere, copertă spate)
**Stickere:** Coală separată A4, 6 stickere rotunde Ø 40mm

---

# PARTEA 2 — PAGINĂ DIGITALĂ (dentalnetkids.ro/carnet)

> Tot conținutul educativ care era în carnetul de 28 pagini
> trece online. E gratuit, actualizabil și nelimitat.

## Structura Paginii Web

Părintele scanează QR-ul din carnet → ajunge pe pagină.

### Secțiunea 1: Ghid de Periaj

**Text:**

```
Cum Îl Spălăm pe Dinți pe Copilul Tău

Periajul corect este cea mai simplă metodă de prevenție.

PASUL 1: Pune pastă cât un bob de mazăre
PASUL 2: Ține periuța la 45° spre gingie
PASUL 3: Mișcări mici, circulare
PASUL 4: Nu uita dinții din spate!
PASUL 5: Periază și limba — ușor
PASUL 6: Scuipă, dar NU clăti cu apă

⏱ 2 minute, de 2 ori pe zi
🌅 Dimineața — după micul dejun
🌙 Seara — înainte de culcare (cel mai important!)

Cine periază?
• Până la 6 ani → părintele
• 6-9 ani → copilul periază, părintele verifică
• De la 9 ani → copilul periază singur
```

**Midjourney Prompt — Hero image:**

```
Cute 3D illustration of a large soft rounded toothbrush in mint green and cream, the character standing next to it looking up curiously, warm beige background, clean minimal, soft pastel tones, warm lighting, friendly pediatric dental hygiene aesthetic, 3D soft render --ar 16:9 --s 150 --cref [URL_ZEN] --cw 100 --v 7 --no realistic teeth, blood, dental instruments, syringes, neon colors, sharp edges
```

**Midjourney Prompt — Step icons (set de 6):**

```
Set of 6 minimal rounded icons for toothbrushing steps, soft 3D style, each in a sage green circle on cream background: toothpaste tube, angled toothbrush, circular arrows, back teeth symbol, tongue, spitting, flat design with subtle 3D depth, pediatric friendly, warm pastel tones, arranged in grid --ar 3:2 --s 150 --v 7 --no realistic teeth, blood, sharp edges
```

---

### Secțiunea 2: Alimente Prietene vs. Alimente Viclene

**Text:**

```
Ce Mâncăm Pentru Dinți Sănătoși?

ALIMENTE PRIETENE 💚
🥕 Morcovi, mere, castraveți — curăță dinții natural
🧀 Brânză, iaurt — calciu pentru dinți puternici
💧 Apă — cel mai bun prieten al dinților
🥚 Ouă, pește — proteine pentru creștere
🥜 Nuci, semințe — minerale esențiale

ALIMENTE VICLENE 🟡
🍬 Bomboane, jeleuri — zahăr care se lipește
🥤 Sucuri, sifon — acid + zahăr
🍪 Biscuiți, cereale dulci — zahăr ascuns
🧃 Sucuri „naturale" din cutie — tot zahăr

3 REGULI SIMPLE:
1. Dulciurile — DOAR la masă, niciodată între mese
2. După dulce — clătește gura cu apă
3. Gustarea ideală: un măr + brânză + apă
```

**Midjourney Prompt:**

```
Cute 3D render of healthy foods on left and unhealthy snacks on right separated by a soft green line, healthy: green apple, cheese, glass of water, carrot, unhealthy: candy, juice box, cookie, all in muted tones, warm cream background, clean minimal, pediatric nutrition education, friendly --ar 16:9 --s 150 --v 7 --no teeth, dental instruments, neon colors, realistic, sharp edges
```

---

### Secțiunea 3: Când Apar Dinții — Calendar Complet

**Text:**

```
Când Apar Dinții Copilului Tău?

DINȚI DE LAPTE (20 dinți)
Incisivii centrali (jos)       6-10 luni
Incisivii centrali (sus)       8-12 luni
Incisivii laterali (sus)       9-13 luni
Incisivii laterali (jos)       10-16 luni
Primii molari                  13-19 luni
Caninii                        16-23 luni
Al doilea molar                23-33 luni

DINȚI PERMANENȚI (28-32 dinți)
Primul molar (de 6 ani)        6-7 ani    ⭐
Incisivii centrali             6-8 ani
Incisivii laterali             7-8 ani
Primul premolar                9-11 ani
Caninul                        9-12 ani
Al doilea premolar             10-12 ani
Al doilea molar                11-13 ani
Molarul de minte               17-25 ani

⭐ ATENȚIE: Molarul de 6 ani apare ÎN SPATELE dinților de lapte.
Mulți părinți nu îl observă. Este cel mai expus la carii
și trebuie sigilat imediat ce a ieșit complet.
```

**Midjourney Prompt:**

```
Cute timeline infographic illustration showing tooth eruption from baby to teenager, soft rounded milestone dots on a gentle ascending sage green curve, warm cream background, tiny simplified tooth icons at each milestone, clean minimal pediatric education style, 3D soft render --ar 16:9 --s 150 --v 7 --no realistic teeth, scary, blood, instruments, sharp edges
```

---

### Secțiunea 4: Ce Facem în Urgență

**Text:**

```
Ce Fac Dacă Copilul Se Lovește la Dinți?

CÂND SUNI IMEDIAT:
• Copilul a căzut și s-a lovit la gură/dinți
• Un dinte permanent a ieșit complet din loc
• Sângerare care nu se oprește după 15 minute
• Durere intensă care nu cedează

DINTE PERMANENT CĂZUT DIN ACCIDENT:
1. Găsește dintele — NU îl ține de rădăcină, doar de coroană
2. Clătește ușor cu lapte sau ser fiziologic
3. Dacă poți, pune-l la loc în alveolă ușor
4. Dacă nu, păstrează-l în lapte rece
5. Vino la cabinet CÂT MAI REPEDE — ideal sub 30 de minute!

📱 Urgențe: 0723 336 320
📍 Str. Mihail Kogălniceanu 49a, Oradea 410074
🕐 Luni-Vineri: 8:00-20:00
```

**Midjourney Prompt:**

```
The character standing alert next to a tiny soft pastel phone, helpful caring pose, warm beige background, subtle soft red-orange accent suggesting urgency but not alarming, clean minimal, 3D render --ar 16:9 --s 150 --cref [URL_ZEN] --cw 100 --v 7 --no teeth, dental instruments, blood, neon colors, sharp edges
```

---

### Secțiunea 5: Diplomele Mele (Interactiv)

> Această secțiune poate fi interactivă pe website —
> doctorul bifează realizarea → apare diploma cu ZEN.
> Sau simplu: imagini statice pe care părintele le poate salva/printa.

**Text:**

```
Diplomele DentalNet Kids

⭐ PRIMA VIZITĂ COMPLETATĂ
  „Am fost curajos/curajoasă la prima mea vizită!"

⭐ CAMPION LA PERIAJ
  „Mă spăl pe dinți de 2 ori pe zi!"

⭐ PRIMUL AN FĂRĂ CARII
  „Un an întreg cu dinți sănătoși!"

⭐ TOȚI DINȚII DE LAPTE SĂNĂTOȘI
  „20 din 20 — toți sunt bine!"

⭐ PRIMII MOLARI SIGILAȚI
  „Dinții mei au scutul de protecție!"

⭐ 3 ANI FĂRĂ CARII
  „Trei ani de zâmbet sănătos!"

⭐ ABSOLVENT DENTALNET KIDS
  „Am crescut cu dinți sănătoși!"
```

**Midjourney Prompt — Diplomă template:**

```
Children's achievement diploma certificate template, A4 landscape, soft warm cream background with sage green rounded decorative border, subtle golden star accents in corners, the character wearing a tiny graduation cap standing proudly at bottom center, space for title and child name in center, clean minimal pediatric design, celebratory but calm, matte style, 3D render --ar 3:2 --s 150 --cref [URL_ZEN] --cw 100 --v 7 --no teeth, dental instruments, neon colors, sharp edges
```

**ZEN pose variante pentru fiecare diplomă:**

```
The character holding a tiny golden trophy, proud calm pose, warm beige background, sticker-ready, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

```
The character with a tiny shield floating above, protector pose, warm beige background, sticker-ready, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

```
The character wearing graduation cap with tiny diploma scroll, calm accomplished pose, warm beige background, sticker-ready, 3D render --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7
```

---

### Secțiunea 6: Termenii Noștri pentru Copii

**Text:**

```
Cum Vorbim la DentalNet Kids

La noi, nu există cuvinte care să sperie.
Iată cum numim lucrurile:

Anestezie → „Picături de somn pentru dinte"
Aspirator → „Elefănțelul aspirator"
Sigilant → „Scutul dintelui"
Fluor → „Vitamine pentru dinți"
Radiografie → „Poza magică"
Detartraj → „Dușul dinților"

Puteți folosi acești termeni și acasă
pentru a pregăti copilul înainte de vizită.
```

**Midjourney Prompt:**

```
The character surrounded by tiny floating soft icons representing child-friendly dental concepts: a small shield, tiny water droplets, a small camera, small vitamins, all in soft pastel sage green and cream tones, warm beige background, clean minimal whimsical composition, 3D render --ar 16:9 --s 150 --cref [URL_ZEN] --cw 100 --v 7 --no teeth, dental instruments, syringes, scary, neon colors, sharp edges
```

---

### Secțiunea 7: Despre Pachetele Noastre

**Text:**

```
Pachete Preventive DentalNet Kids

START — Prima Vizită (de la primul dinte)
GRATUIT
✓ Examinare blândă
✓ Evaluare inițială a riscului
✓ Sfaturi igienă + alimentație
✓ Carnetul de Sănătate Dentară

CREȘTERE — Abonament Anual (3-6 ani)
500 RON/an
✓ 2 controale preventive/an
✓ 2 igienizări profesionale/an
✓ 1 fluorizare/an
✓ Actualizare evaluare risc
✓ Consiliere nutrițională

SCUT — Prevenție Completă (6-14 ani)
900 RON/an
✓ 2 controale + 2 igienizări + fluorizare/an
✓ Sigilare molari (inclusă la erupție)
✓ Screening ortodontic anual (de la 7 ani)
✓ Plan nutrițional personalizat
✓ -15% la tratamente dacă e nevoie
✓ Programare prioritară

Reduceri familie: al 2-lea copil -15%, al 3-lea copil -25%

📱 Programare: 0259 418 757
```

**Midjourney Prompt:**

```
Three soft rounded package cards arranged side by side in graduating sizes small to large, in light mint green, medium sage green, and deeper sage green, on warm cream background, clean minimal pricing tier design, subtle shield motif on the largest card, matte flat style with 3D depth, no text, pediatric healthcare aesthetic --ar 16:9 --s 150 --v 7 --no teeth, dental instruments, neon colors, sharp edges
```

---

# ELEMENTE SUPLIMENTARE

## Poster „Harta Dinților Mei" — Insert detașabil A4

> Pagina cu harta dinților NU mai e în carnetul de 8 pagini.
> Devine un **insert A4 separat** pliat în jumătate, pus în interiorul carnetului.
> Când carnetul se termină, părintele scoate insert-ul, îl desface → poster A4 pentru peretele din camera copilului.

**Format:** A4 (210 × 297 mm), pliat la A5 (încape în carnet)
**Hârtie:** 200g couché mat (mai gros decât interiorul — rezistă pe perete)
**Print:** Full color față, spate alb sau cu pattern subtle
**Cost suplimentar:** ~0,50-1 RON/buc la tiraj 500+

**Ce conține posterul:**
- Titlu mare: „Harta Dinților Mei" + câmp pentru numele copilului
- Ambele arcade dentare (lapte + permanenți) cu FDI numbering
- Sub fiecare dinte: spațiu mic pentru data erupției
- Tabel erupție: când apar dinții de lapte + permanenți (cu spațiu pentru data reală)
- Legendă color (sănătos/de urmărit/tratat/extras/sigilat)
- 6 milestone-uri cu stele (prima vizită, 1 an fără carii, molari sigilați, etc.)
- ZEN × 2 (colț dreapta sus + colț stânga jos)
- Callout special: molarul de 6 ani
- Logo + contact DentalNet Kids + QR
- Bordură decorativă cu colțuri sage green, stele, scuturi subtile
- Tonuri calde, pastel, poster-quality — ceva ce un copil VREA pe perete

**De ce funcționează:**
- DentalNet Kids rămâne pe peretele din camera copilului **ani de zile** = branding gratuit
- Părintele vede zilnic harta și își amintește de programare
- Copilul e mândru de realizările marcate pe poster
- Nimeni din Oradea nu oferă asta

### Midjourney Prompt — Poster background:

```
A4 children's wall poster background for dental health chart, warm cream base with decorative sage green rounded border frame with ornate rounded corners, subtle scattered decorative elements: tiny stars, small shield shapes, small leaf motifs in very light sage green and soft gold, clean minimal design with warm pediatric feel, space for charts and text in center, poster-quality print aesthetic, soft pastel tones, matte finish, no text --ar 2:3 --s 150 --v 7 --no teeth, dental instruments, syringes, neon colors, sharp edges, blood
```

### Midjourney Prompt — ZEN cu periuță (colț dreapta sus):

```
The character standing proudly holding a tiny soft mint-green toothbrush, happy calm pose, warm beige background, clean minimal composition, 3D soft render, sticker-ready --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7 --no teeth, dental instruments, neon colors
```

### Midjourney Prompt — ZEN cu scut (colț stânga jos):

```
The character sitting calmly with a tiny translucent sage-green shield floating above, protector guardian pose, warm beige background, clean minimal, 3D soft render, sticker-ready --ar 1:1 --s 150 --cref [URL_ZEN] --cw 100 --v 7 --no teeth, dental instruments, neon colors
```

### Midjourney Prompt — Tooth arch illustrations (cute, poster-style):

```
Two cute dental arch diagrams side by side for children's wall poster, left arch smaller with 20 soft rounded cartoon teeth for baby teeth, right arch larger with 28 teeth for permanent teeth, each tooth is a simple rounded white shape with subtle sage green outline, arranged in U-shaped arches, warm cream background, friendly illustrated educational style with subtle 3D depth, clean minimal pediatric dental art, poster quality --ar 3:2 --s 150 --v 7 --no realistic teeth, scary, blood, metal, instruments, sharp edges
```

---

## Coală Stickere ZEN (print separat)

**Format:** Coală A4 cu 6 stickere rotunde Ø 40mm
**Print:** Hârtie autoadezivă, laminare mată
**Cost:** ~0,50-1 RON/coală la tiraj 500+

Fiecare sticker = o poză ZEN diferită (prompt-urile de la secțiunea „Fișe de Vizită")
Sub fiecare: text mic „DentalNet Kids"

**Midjourney Prompt — Sticker sheet:**

```
A4 sticker sheet with 6 circular sticker designs in a 2x3 grid, each circle shows a different pose of the same character on warm beige background: with star, thumbs up, with shield, with cape, with checkmark, on podium, clean minimal sage green tones, print-ready, 3D render --ar 3:4 --s 150 --cref [URL_ZEN] --cw 100 --v 7 --no teeth, dental instruments, neon colors
```

---

# PARAMETRI MIDJOURNEY

| Parametru | Valoare | Folosit pentru |
|-----------|---------|----------------|
| `--v 7` | Model V7 | Toate prompt-urile |
| `--ar 2:3` | Portrait | Paginile cardului fizic (A5) |
| `--ar 3:2` | Landscape | Diagrame, diplome |
| `--ar 16:9` | Wide | Imagini website (hero sections) |
| `--ar 1:1` | Pătrat | Stickere ZEN |
| `--s 100-150` | Stylize | Sweet spot V7 |
| `--cref [URL]` | Character ref | **Obligatoriu** la orice prompt cu ZEN |
| `--cw 100` | Character weight | Consistență maximă |
| `--no` | Exclude | `teeth, dental instruments, syringes, needles, blood, crying, neon colors, sharp edges` |

---

# COMPARAȚIE COST: VECHI vs. NOU

| | Carnet 28 pag. (vechi) | Card 8 pag. + Digital (nou) |
|---|---|---|
| **Print/buc** | ~8-15 RON | ~2-4 RON |
| **Stickere** | 12/coală (~1,50 RON) | 6/coală (~0,80 RON) |
| **Total/copil** | ~10-17 RON | ~3-5 RON |
| **La 500 copii** | 5.000-8.500 RON | 1.500-2.500 RON |
| **Conținut educativ** | Fix, nu se poate schimba | Actualizabil oricând |
| **Diplome** | Pe hârtie, se pierd | Online, permanente |
| **Economie** | — | **~60-70%** |

---

# WORKFLOW

### Card fizic:
1. Generează prompt-urile MJ pentru copertă + hartă dinți + stickere
2. Compune în Canva/Figma — adaugă text + formular
3. Generează QR code → dentalnetkids.ro/carnet
4. Export PDF print-ready, CMYK, 300 DPI, bleed 3mm
5. Trimite la tipografie

### Pagina digitală:
1. Generează prompt-urile MJ (hero images, icons, diplome)
2. Construiește pagina pe website (când e gata)
3. Conținutul poate fi adăugat și ca highlight-uri Instagram între timp

---

# REZUMAT TOTAL PROMPTS MJ

| Element | Nr. prompts |
|---------|-------------|
| Card fizic — copertă față | 2 variante |
| Card fizic — hartă dinți | 1 |
| Card fizic — fundal vizită | 1 |
| Card fizic — copertă spate | 1 |
| Stickere ZEN (6 pose) | 6 |
| Web — periaj (hero + icons) | 2 |
| Web — nutriție | 1 |
| Web — calendar erupție | 1 |
| Web — urgențe | 1 |
| Web — termeni copii | 1 |
| Web — pachete | 1 |
| Web — diplome (template + 3 ZEN) | 4 |
| **Subtotal ZEN** | **~22 prompts** |
| Personaje dinți — character sheets | 4 |
| Personaje dinți — scene carnet | 7 |
| Personaje dinți — social media | 4 |
| Personaje dinți — stickere | 3 |
| **Subtotal Personaje Dinți** | **18 prompts** |
| **TOTAL GENERAL** | **~40 prompts** |

---

---

# PERSONAJE DINȚI — Midjourney Prompts

> **Direcție creativă:** Dinți cu formă anatomică reală (morfologie corectă — cuspizi, rădăcini, proporții ca în atlasul dentar) dar cu fețe mici kawaii pictate pe suprafața coroanei. NU Pixar, NU cartoon, NU clay. Gândește: manual de anatomie dentară care a prins viață.
> Folosit pentru: carnet digital, social media, stickere/print.

## Stil & Reguli

**Stil:** Realistic 3D dental anatomy + kawaii face painted on the enamel surface
**Tehnica MJ:** Fața e descrisă ca „painted on" / „drawn on" suprafața dintelui — asta spune MJ să adauge fața CA DETALIU pe un obiect real, nu să transforme obiectul în personaj cartoon
**Paletă fundal:** Sage green (#8FA98F), beige (#F5E6D3), cream (#FFF8F0), mint (#C5E0D0)
**Dinții:** Alb-perlat natural cu nuanțe calde — exact ca un dinte real
**Fețe:** Kawaii face painted on — ochi mici punctiformi + gură subtilă pe suprafața vestibulară
**Negative prompt standard:** `--no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks`

### Tipuri de Dinți — Morfologie Reală

| Tip Dinte | Morfologie Corectă | Față | Nr. |
|---|---|---|---|
| **Incisiv central** | Coroană lată plată, o rădăcină dreaptă, margine incizală | Zâmbet larg | 4 |
| **Incisiv lateral** | Mai mic/îngust, rădăcină subțire | Ochi curioși | 4 |
| **Canin** | Conică, cusp pronunțat, rădăcină lungă | Zâmbet ștrengăresc | 4 |
| **Premolar** | 2 cuspizi, 1-2 rădăcini | Expresie calmă | 8 |
| **Molar** | 4-5 cuspizi, 2-3 rădăcini divergente | Privire protectoare | 8 |
| **Molar de 6 ani** | 5 cuspizi, 3 rădăcini robuste, cel mai mare | Expresie mândră | 4 |
| **Dinte de lapte** | Versiune mică, coroană bulbată, rădăcini scurte | Ochi mari inocenți | 20 |
| **Molar de minte** | Formă variabilă, rădăcini fuzionate | Somnoros | 4 |

---

## CHARACTER SHEETS (4 prompts)

### 1. Full Mouth — Arcadă Completă

Arcadă dentară completă (sus + jos) văzută ocluzal (top-down), fiecare dinte cu formă reală și față mică kawaii pe coroană.

**Prompt (16:9 — carnet digital):**
```
Occlusal top-down view of a complete human dental arch, upper and lower jaw, anatomically correct tooth morphology, each tooth a realistic 3D render with natural pearlescent enamel — chisel-shaped incisors, conical canines, bicuspid premolars, wide multi-cusped molars — with a tiny kawaii face painted on each tooth's crown surface, soft pink gingiva, warm cream background, dental anatomy illustration style, soft studio lighting --ar 16:9 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

**Prompt (1:1 — social media):**
```
Occlusal view of a complete human dental arch, upper and lower jaw, anatomically correct 3D teeth with natural pearlescent enamel — incisors canines premolars molars — with a tiny kawaii face painted on each crown, soft pink gingiva, warm cream background, dental anatomy illustration, soft lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 2. Dinți de Lapte — Arcadă Primară (20 dinți)

20 dinți deciduali — mai mici, coroane bulbate, rădăcini scurte. Fiecare cu față inocentă.

```
3D dental anatomy illustration of 20 primary deciduous teeth in a U-shaped arch, proportionally smaller with bulbous crowns and short thin roots, natural milky-white enamel, each small tooth has a tiny innocent kawaii face drawn on its labial surface with round dot eyes, soft pink gingiva, warm beige background with mint green accents, medical education style, soft warm lighting --ar 3:2 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 3. Dinți Permanenți — Arcadă Definitivă (28-32 dinți)

Setul adult complet — mai mari, rădăcini dezvoltate, fețe mai serioase/încrezătoare.

```
3D dental anatomy illustration of the full permanent dentition 28-32 teeth in a dental arch, accurate morphology — tall incisors, conical canines with prominent cusps, two-cusped premolars, broad molars with 4-5 cusps and divergent roots — natural pearlescent enamel, each tooth has a small confident kawaii face drawn on the crown surface, soft pink gingiva, warm cream background, medical illustration quality, soft studio lighting --ar 3:2 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 4. Character Lineup — Comparație Tipuri

Dinții aliniați lateral cu rădăcini vizibile sub linia gingivală — planșă comparativă de mărime. Fiecare tip cu personalitate diferită.

```
Side-by-side comparison chart of all human tooth types with roots visible below a gumline, anatomically accurate 3D render: lateral incisor, central incisor, canine, first premolar, second premolar, first molar, second molar, wisdom tooth — ascending size left to right, natural enamel texture, each tooth has a unique tiny kawaii face painted on its surface — incisor smiling, canine grinning, molar looking strong, warm cream background, dental education chart aesthetic, soft lighting --ar 3:2 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

## SCENE CARNET — Prompts pentru Secțiunile Carnetului Digital (7 prompts)

### 5. Brushing Party → Ghid Periaj

Dinți reali în spumă de pasta de dinți — unii acoperiți parțial, unii strălucind curați. Periuță alături.

**Prompt (16:9 — carnet digital):**
```
Anatomically accurate 3D teeth standing upright surrounded by soft toothpaste foam and tiny bubbles, correct morphology — incisors canines premolars molars — some covered in white foam, some sparkling clean, a mint-green toothbrush resting beside them, each tooth has a tiny happy kawaii face painted on its enamel surface, natural pearlescent white teeth, warm cream background with sage green accents, dental hygiene education illustration, soft warm lighting --ar 16:9 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

**Prompt (1:1 — social media):**
```
Anatomically accurate 3D teeth in toothpaste foam, correct morphology, some foam-covered some sparkling clean, mint-green toothbrush nearby, each tooth has a tiny happy kawaii face painted on its surface, pearlescent enamel, warm cream background sage green accents, dental hygiene theme, soft lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 6. Food Friends → Alimente Prietene

Dinți sănătoși strălucitori lângă alimente prietenoase. Totul 3D realist.

**Prompt (16:9 — carnet digital):**
```
Healthy gleaming anatomically accurate 3D teeth standing proudly alongside oversized healthy foods — a carrot, a cheese wheel, a green apple, a glass of water — each tooth with correct morphology and a tiny proud kawaii face painted on its crown, natural pearlescent enamel, realistic 3D foods, warm beige background with sage green undertones, educational illustration style, warm studio lighting --ar 16:9 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

**Prompt (1:1 — social media):**
```
Gleaming anatomically accurate 3D teeth standing with oversized carrot, cheese, apple, water glass, correct morphology, tiny proud kawaii faces painted on crowns, pearlescent enamel, realistic foods, warm beige background sage green tones, educational style, warm lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 7. Food Enemies → Alimente Viclene

Dinți cu fețe îngrijorate, alimente dăunătoare în fundal proiectând umbre.

**Prompt (16:9 — carnet digital):**
```
Anatomically accurate 3D teeth with worried kawaii faces painted on their crowns — nervous dot eyes looking sideways — standing close together as oversized sugary foods loom behind them casting soft shadows: lollipop, gummy bears, soda bottle, chocolate, cookie, correct tooth morphology, subtle yellowish discoloration on the teeth nearest the sweets, warm cream background with amber warning tones, educational dental nutrition illustration, dramatic but friendly lighting --ar 16:9 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks, scary, gore
```

**Prompt (1:1 — social media):**
```
Anatomically accurate 3D teeth with worried kawaii faces painted on crowns, nervous dot eyes, standing together as oversized lollipop gummy bears soda chocolate loom behind casting shadows, correct morphology, subtle discoloration on nearest teeth, warm cream background amber tones, educational, dramatic but friendly lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks, scary, gore
```

---

### 8. The Big Arrival → Calendar Erupție

Secțiune anatomică: dinte permanent se ridică prin gingie, dinte de lapte se clatină lângă el. Rădăcini vizibile.

**Prompt (16:9 — carnet digital):**
```
Anatomical cross-section of dental eruption: a large permanent tooth emerging upward through soft pink gingival tissue, a smaller wobbly deciduous tooth tilting to the side with resorbed short roots, the permanent tooth has a bright confident kawaii face painted on its crown looking upward, the baby tooth has a gentle sleepy kawaii face with half-closed eyes, roots visible below gumline — accurate dental anatomy, warm cream background with sage green accents, educational dental illustration, soft warm lighting --ar 16:9 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

**Prompt (1:1 — social media):**
```
Anatomical cross-section: large permanent tooth emerging through pink gingiva, small deciduous tooth tilting aside with resorbed roots, permanent tooth with confident kawaii face looking up, baby tooth with sleepy kawaii face, roots visible, accurate dental anatomy, cream background sage green accents, educational illustration, warm lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 9. Molarul de 6 Ani Spotlight → Calendar Erupție (callout special)

Primul molar permanent — mare, 5 cuspizi, 3 rădăcini — evidențiat cu lumină specială, apărând în spatele dinților de lapte.

**Prompt (16:9 — carnet digital):**
```
The first permanent molar (6-year molar) as a large anatomically accurate 3D tooth with 5 distinct cusps and 3 strong roots, illuminated by a warm golden spotlight, with a proud confident kawaii face painted on its crown, a subtle sage green glow around it, surrounding smaller teeth in a dental arch looking toward it with tiny admiring kawaii faces, scientifically accurate proportions, warm cream background, dental education illustration, soft dramatic lighting --ar 16:9 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

**Prompt (1:1 — social media):**
```
First permanent molar (6-year molar), large 3D anatomically accurate tooth with 5 cusps and 3 roots, golden spotlight, proud kawaii face painted on crown, sage green glow, smaller teeth around with admiring kawaii faces, accurate proportions, warm cream background, dental education style, soft dramatic lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 10. Emergency Rescue → Urgențe

Dinte permanent căzut pus într-un pahar cu lapte — prim ajutor dentar corect medical.

**Prompt (16:9 — carnet digital):**
```
Dental first aid scene: an anatomically accurate 3D permanent incisor tooth lying on its side with a dazed kawaii face painted on its crown — spiral eyes — next to a clean glass of white milk, a large sturdy molar stands nearby with a calm determined kawaii face overseeing the situation, correct dental anatomy showing intact crown and root on the fallen tooth, warm cream background with sage green and soft red-cross accents, educational emergency dental care illustration, warm lighting --ar 16:9 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks, scary, blood, gore
```

**Prompt (1:1 — social media):**
```
Dental first aid: anatomically accurate 3D incisor lying on its side with dazed kawaii face, next to a glass of milk, sturdy molar nearby with calm kawaii face, correct anatomy intact crown and root, warm cream background sage green red-cross accents, educational emergency illustration, warm lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks, scary, blood, gore
```

---

### 11. Graduation Day → Diplome

Arcadă permanentă completă — toți strălucitori, stele aurii deasupra, momentul „setul complet sănătos".

**Prompt (16:9 — carnet digital):**
```
A complete healthy permanent dentition standing in a perfect 3D dental arch, every tooth gleaming with pristine pearlescent enamel, anatomically accurate morphology, each tooth has a tiny proud kawaii face painted on its crown — dot eyes looking upward contentedly — tiny golden stars floating above like achievement badges, the 6-year molar at center with the biggest star, warm cream background with sage green and gold accents, celebratory dental education illustration, warm studio lighting --ar 16:9 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

**Prompt (1:1 — social media):**
```
Complete healthy permanent dentition in a perfect 3D arch, gleaming pearlescent enamel, anatomically accurate, each tooth with tiny proud kawaii face painted on crown, golden stars floating above, 6-year molar center with biggest star, warm cream background sage green gold accents, celebratory dental illustration, warm lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

## SOCIAL MEDIA STANDALONE (4 prompts)

### 12. Tooth Squad — Grup

Toate tipurile dintr-un cadran, vedere vestibulară (frontal) cu rădăcini vizibile. Fiecare cu expresie diferită.

```
Front view of all human tooth types from one quadrant side by side with roots visible, anatomically accurate 3D render: central incisor, lateral incisor, canine, first premolar, second premolar, first molar, second molar, wisdom tooth — each with correct anatomy and a unique kawaii face painted on its labial surface, natural pearlescent enamel, warm cream background, dental education aesthetic, soft lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 13. Superhero Molar — Molarul de 6 Ani

Primul molar permanent — centru, iluminat dramatic, scut verde translucid în jurul lui, celelalte dinți în semicercul de onoare.

```
The first permanent molar as a large anatomically accurate 3D tooth with 5 cusps and 3 robust roots, centered with warm golden heroic backlighting, a translucent sage-green protective aura around it, surrounding teeth of different types in a semicircle with small admiring kawaii faces painted on their crowns, the molar has a strong confident kawaii face on its surface, natural enamel texture, warm cream background, dental education composition, soft lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 14. Bedtime — Dinți Curați Seara

Dinți proaspăt periați strălucind în lumină de noapte, unii cu ochi pe jumătate închiși. Periuță și pastă de dinți alături.

```
A row of anatomically accurate 3D teeth freshly brushed and gleaming, reflecting soft warm golden moonlight, each with a tiny peaceful kawaii face painted on its crown — some with half-closed sleepy eyes, some with content small smiles — a mint-green toothbrush and toothpaste tube resting nearby, natural pearlescent enamel, warm dim beige background with blue-twilight undertones and tiny star sparkles, calming nighttime dental hygiene illustration --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 15. Tooth Knight — Scutul de Fluor

Un molar mare cu un scut translucid de fluor protejând dinții mai mici din spate. Vizualizare protecție fluor.

```
An anatomically accurate 3D first molar tooth standing in front of a group of smaller teeth, a large translucent mint-green fluoride shield glowing softly in front of it, faint sugar crystal particles dissolving on contact with the shield, the molar has a strong determined kawaii face painted on its crown, smaller teeth behind it with relieved kawaii faces on their surfaces, correct dental morphology with natural enamel, warm cream background sage green accents, dental protection education illustration, warm lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

## STICKERE / PRINT (3 prompts)

### 16. Individual Tooth Stickers Set

6 dinți individuali în cadre circulare — anatomie corectă, fiecare cu față diferită.

```
Sticker sheet 2x3 grid of 6 individual anatomically accurate 3D teeth in circular frames on warm beige background: central incisor with happy kawaii face, canine with cheeky winking kawaii face, premolar with calm kawaii face, first molar with proud strong kawaii face, tiny deciduous baby tooth with big innocent kawaii eyes, 6-year molar with confident kawaii face and small golden star above — each with correct crown and root anatomy, natural pearlescent enamel, sticker-ready print quality, soft lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 17. Tooth Emoji Set

9 dinți-molar cu emoții diferite — grid 3x3. Anatomie identică, doar fața kawaii se schimbă.

```
3x3 grid of 9 anatomically accurate 3D molar teeth showing different kawaii emotions painted on their crown surfaces, each on warm cream circular background: happy wide smile, proud closed eyes, sleepy droopy eyes, worried wide eyes, brave determined squint, excited sparkle eyes, calm peaceful eyes, silly tongue out, strong furrowed brow — all with identical correct molar morphology 4-5 cusps and roots, natural pearlescent enamel, clean emoji sticker set, soft lighting --ar 1:1 --s 100 --v 7 --no cartoon, pixar, clay, plasticine, neon, text, labels, watermarks
```

---

### 18. Tooth + ZEN Together — Crossover Sticker

ZEN (mascota blob verde-salvie) lângă un molar anatomic mare și un incisor — cele două lumi de personaje.

```
ZEN the small round sage-green plush blob mascot with tiny black dot eyes standing next to a large anatomically accurate first permanent molar tooth and a tall incisor tooth, each tooth with a gentle kawaii face painted on its crown, ZEN's soft plush texture contrasting with the teeth's natural pearlescent enamel, visible roots on both teeth, warm beige background, sage green and cream palette, sticker-ready circular composition, soft warm lighting --ar 1:1 --s 100 --cref [URL_ZEN] --cw 80 --v 7 --no cartoon, pixar, plasticine, neon, text, labels, watermarks
```

---

## MAPARE PERSONAJE DINȚI → SECȚIUNI CARNET

| Secțiune Carnet | Prompt Primar | Prompt Secundar |
|---|---|---|
| Ghid Periaj | #5 Brushing Party | #14 Bedtime |
| Alimente Prietene | #6 Food Friends | — |
| Alimente Viclene | #7 Food Enemies | — |
| Calendar Erupție | #8 The Big Arrival | #9 Molar de 6 Ani |
| Urgențe | #10 Emergency Rescue | #15 Tooth Knight |
| Diplome | #11 Graduation Day | — |
| Social Media | #12, #13, #14 | #16 stickere |
| Print Stickere | #16, #17 | #18 crossover ZEN |

---

## PARAMETRI MIDJOURNEY — PERSONAJE DINȚI

| Parametru | Valoare | Folosit pentru |
|---|---|---|
| `--v 7` | V7 | Toate prompt-urile |
| `--ar 1:1` | Pătrat | Social media + stickere |
| `--ar 16:9` | Wide | Secțiuni carnet digital |
| `--ar 3:2` | Landscape | Character sheets |
| `--s 100` | Stylize | Mai scăzut = mai multă acuratețe anatomică |
| `--cref [URL_ZEN]` | Character ref | **Doar** la prompt #18 (crossover cu ZEN) |
| `--cw 80` | Character weight | Redus la 80 pentru crossover — ZEN + dinți |
| `--no` | Negative | `cartoon, pixar, clay, plasticine, neon, text, labels, watermarks` |

### Notă despre tehnica „kawaii face painted on"

MJ interpretează diferit:
- ❌ `tooth character with a face` → MJ transformă dintele în personaj cartoon
- ✅ `tooth with a kawaii face painted on its surface` → MJ păstrează forma reală a dintelui și adaugă fața ca un detaliu pe suprafața obiectului

Dacă rezultatele nu sunt suficient de realiste, încearcă:
- Scade `--s` la 50 pentru mai mult realism
- Adaugă `dental anatomy textbook` sau `Netter's atlas style` ca ancoră de stil
- Folosește `--sref [URL]` cu o imagine de referință dintr-un atlas dentar real

---

*Document creat de Epic Digital Hub — 21.02.2026*
*Actualizat: 09.03.2026 — Secțiune nouă „Personaje Dinți" (18 prompts) — anatomie dentară reală cu fețe kawaii*
*Pentru: DentalNet Kids — Dr. Șipoș Lucian Roman*
