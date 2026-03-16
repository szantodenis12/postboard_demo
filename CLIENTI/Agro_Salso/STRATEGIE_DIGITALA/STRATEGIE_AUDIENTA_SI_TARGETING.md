---
client: Agro Salso
type: ads-strategy
use-for: [ads, strategy, campaign-planning, social-media]
priority: critical
last-updated: 2026-02-23
summary: "Strategie completă de targeting și optimizare audiențe — 3 faze (imediat, 2-4 săptămâni, 1-2 luni), Custom Audiences, Lookalike, Lead Form Qualification, Offline Conversions, exclusion audiences, feedback loop CRM→Ads, setup Meta + Google pas cu pas"
---

> **Dosarul Agro Salso — Cuprins:**
> [README — Client Brief](./README.md) | [Strategie Vânzări Rapide](./STRATEGIE_VANZARI_RAPIDE_FEB2026.md) | [Strategie Ads Dexwal Mamut](./STRATEGIE_ADS_DEXWAL_MAMUT.md) | **[Strategie Audiență & Targeting](./STRATEGIE_AUDIENTA_SI_TARGETING.md)** | [Sistem CRM](./CRM/SISTEM_CRM_AGRO_SALSO.md) | [Audit Digital](./RESEARCH/AUDIT_DIGITAL/AUDIT_PREZENTA_DIGITALA_AGRO_SALSO.md) | [Analiză Competiție](./RESEARCH/ANALIZA_COMPETITIE/ANALIZA_COMPETITIE_AGRO_SALSO.md) | [Analiză Piață](./RESEARCH/ANALIZA_PIATA/ANALIZA_PIATA_UTILAJE_AGRICOLE_BIHOR.md)

---

# Strategie Audiență & Targeting — Agro Salso

## Cum ne asigurăm că reclamele ajung la oamenii potriviți

**Data:** 23.02.2026
**Pregătit de:** Epic Digital Hub
**Context:** Agro Salso cheltuie ~2.000 RON/săptămână pe reclame fără rezultate concrete. Problema principală: reclamele ajung la oamenii nepotriviți, iar algoritmii Meta și Google nu au date suficiente ca să „învețe" cum arată un client bun.

---

## Problema fundamentală

**Fără date, algoritmii sunt orbi.**

Când Meta sau Google rulează o reclamă, algoritmul lor decide cine o vede. Dar ca să decidă bine, are nevoie de un „model" — adică trebuie să știe: **cum arată un om care cumpără de la Agro Salso?**

Acum, algoritmul nu știe nimic:

- Nu știe cine a cumpărat înainte (nu există bază de date clienți)
- Nu știe care lead-uri au fost bune și care au fost proaste (nu exista CRM)
- Nu știe cine a vizitat sediul sau cine a sunat efectiv
- Nu știe diferența dintre un fermier cu 100 ha și un curios fără tractor

**Rezultat:** Algoritmul arată reclamele la cine e cel mai ieftin de ajuns, nu la cine e cel mai probabil să cumpere. De aceea banii se duc, dar telefonul nu sună.

---

## Soluția: 3 Faze de Optimizare

```
FAZA 1 (Imediat)          FAZA 2 (2-4 săptămâni)       FAZA 3 (1-2 luni)
─────────────────          ──────────────────────        ─────────────────────
Filtrare mai bună          Învață algoritmul            Optimizare continuă
la intrare                 cine sunt clienții           pe bază de date reale
│                          │                            │
├─ Lead Form inteligent    ├─ Custom Audience           ├─ Offline Conversions
├─ Excluderi audiență      │  (clienți existenți)       ├─ Value-Based Lookalike
├─ Interest layering       ├─ Lookalike 1%              ├─ Optimizare automată
├─ Geo-targeting precis    ├─ Retargeting avansat       │  pe „Cumpărare"
└─ Calificare prin         └─ Lead scoring              └─ Excludere automată
   întrebări                                               clienți convertiți
```

---

## FAZA 1 — Imediat (Această săptămână)

### 1.1. Lead Form inteligent — Filtrăm la intrare

Problema actuală: lead form-ul colectează pe oricine. Un student curios completează la fel de ușor ca un fermier cu 200 ha.

**Soluția:** Adăugăm întrebări care califică automat lead-ul. Fermierul real le completează natural. Curiosul renunță.

#### Lead Form NOU (Meta Ads — Instant Form)

| # | Câmp | Tip | Obligatoriu | De ce |
|---|------|-----|-------------|-------|
| 1 | **Nume** | Text (auto-fill din Facebook) | Da | Identificare |
| 2 | **Telefon** | Phone (auto-fill) | Da | Contact principal |
| 3 | **Câte hectare lucrezi?** | Multiple choice | Da | **Filtru calificare #1** |
| 4 | **Ce tractor ai? (Marcă și CP aprox.)** | Text scurt | Da | **Filtru calificare #2** |
| 5 | **Ce utilaj te interesează?** | Multiple choice | Da | Direcționare produs |
| 6 | **Când planifici achiziția?** | Multiple choice | Da | **Filtru urgență** |
| 7 | **Te interesează finanțare AFIR?** | Multiple choice | Nu | Identificare lead AFIR |
| 8 | **Localitatea / Județul** | Text scurt | Nu | Geo-calificare |

#### Opțiuni pentru fiecare întrebare:

**Câte hectare lucrezi?**

| Opțiune | Ce înseamnă pentru noi |
|---------|----------------------|
| Sub 10 ha | 🔴 Necalificat pentru Mamut (dar posibil piese) |
| 10–50 ha | 🟡 Mamut 2.5 (tractor 70-110 CP) |
| 50–150 ha | 🟢 Mamut 2.5–3.0 (tractor 90-130 CP) |
| 150–500 ha | 🟢 Mamut 3.0–4.0 (tractor 100-150 CP) |
| Peste 500 ha | 🟢 Mamut 4.0 / multiple unități |

**Ce utilaj te interesează?**

| Opțiune |
|---------|
| Grapă cu discuri (Dexwal Mamut) |
| Cultivator |
| Subsolier |
| Semănătoare |
| Tocătoare |
| Piese de schimb |
| Alt utilaj |

**Când planifici achiziția?**

| Opțiune | Ce înseamnă | Prioritate follow-up |
|---------|-------------|---------------------|
| Cât mai curând (am nevoie acum) | Lead FIERBINTE | 🔴 Sună în 1 oră |
| În lunile următoare | Lead cald | 🟡 Sună în 2 ore |
| Anul acesta, dar nu urgent | Lead rece-mediu | 🟡 Sună în 24 ore |
| Doar mă informez | Lead informațional | ⚪ Sună în 48 ore |

**Te interesează finanțare AFIR?**

| Opțiune |
|---------|
| Da, pregătesc un proiect AFIR |
| Da, aș vrea mai multe informații |
| Nu, cumpăr direct |
| Nu știu ce e AFIR |

#### De ce funcționează:

- **Câte hectare?** → Fermierul real știe imediat. Curiosul nu are ce scrie.
- **Ce tractor ai?** → Dacă nu are tractor, nu poate folosi implementuri. Filtru natural.
- **Când planifici?** → Separăm urgențele de „window shopping". Prioritizăm follow-up-ul.
- **Mai multe câmpuri = mai puține lead-uri, dar MAI BUNE.** Preferăm 10 lead-uri calificate decât 50 de lead-uri de care 45 nu răspund.

#### Meta Ads: Higher Intent vs. More Volume

| Setare Lead Form | Volume | Calitate | Când folosim |
|-----------------|--------|----------|-------------|
| **More Volume** (Facebook optimizează pentru completări) | Multe lead-uri | Calitate scăzută | ❌ Nu mai folosim |
| **Higher Intent** (Facebook adaugă un pas de confirmare) | Mai puține lead-uri | Calitate ridicată | ✅ Folosim MEREU |

**Setare în Meta Ads Manager:** La crearea Lead Form → Form Type → selectează **„Higher Intent"**. Acest lucru adaugă un ecran de confirmare înainte de trimitere. Oamenii care nu sunt cu adevărat interesați renunță la acest pas.

---

### 1.2. Excluderi de audiență — Oprim risipa

Fiecare persoană greșită care vede reclama = bani aruncați. Adăugăm excluderi clare:

#### Excluderi Meta Ads

| Ce excludem | Cum | De ce |
|-------------|-----|-------|
| **Persoane care au trimis deja lead** | Custom Audience: Lead Form submitters (ultimele 90 zile) | Nu mai plătim pentru oameni deja în CRM |
| **Clienți existenți** (după ce avem lista) | Custom Audience: Upload CSV cu nr. telefon | Clienții existenți îi contactăm direct, nu prin ads |
| **Angajați competiție** | Excludere employer: Titan Machinery, Mewi, DicorLand | Evităm să le arătăm strategia |
| **Vârstă nepotrivită** | Setare vârstă: doar 25-65 ani | Sub 25: foarte rar fermieri activi. Peste 65: rar pe Facebook |
| **Femei** (cu excepții) | Targeting: 90% bărbați | Fermierii activi din Bihor sunt preponderent bărbați. Excepție: soțiile care administrează (păstrăm 10%) |
| **Zone urbane pure** | Excludere: Orașe mari fără zonă rurală | Fermierii sunt în zona rurală/periurbană |

#### Excluderi Google Ads (Negative Keywords)

Lista existentă din strategia de ads + adăugăm:

| Cuvânt negativ NOU | De ce |
|---------------------|-------|
| curs / cursuri agricultură | Studenți, nu cumpărători |
| poze / imagini / wallpaper | Căutări informaționale |
| desen / schiță | Nerelevant |
| jucărie / macheta / miniatura | Colecționari de modele |
| Wikipedia / referat | Căutări educaționale |
| video / film (cu excepția „video demonstrație") | De obicei căutări informaționale |
| forum / discuție (evaluare caz cu caz) | Pot fi relevante dar deseori low-intent |

---

### 1.3. Interest Layering — Nu doar „Agricultură"

**Greșeala comună:** Targetezi pe interes „Agricultură" → ajungi la oricine urmărește o pagină de agricultură, inclusiv profesori, studenți, curioși.

**Soluția:** Combini interese cu AND (intersecție), nu OR (uniune).

#### Audiență optimizată Meta Ads — Fermieri reali

**Audiența CORE (pentru toate campaniile non-retargeting):**

```
Locație: 60 km rază de Mădăras, Bihor
Vârstă: 30-65 ani
Gen: Bărbați (90%)

Interese (MUST MATCH cel puțin 1 din fiecare grup):

GRUP A — Doveadă că e fermier:
  - APIA (Agenția de Plăți și Intervenție pentru Agricultură)
  - Subvenții agricole
  - Fermier

GRUP B — Interes în utilaje/echipamente:
  - Tractoare
  - Utilaje agricole
  - John Deere
  - New Holland
  - Massey Ferguson
  - Fendt
  - Case IH

GRUP C (opțional, pentru lărgire):
  - Porumb
  - Grâu
  - Floarea soarelui
  - Agricultură
```

**Logica:** Cineva care urmărește APIA **ȘI** John Deere = cu siguranță fermier activ. Cineva care urmărește doar „Agricultură" = ar putea fi orice.

#### Cum se setează în Meta Ads Manager:

1. La nivel de Ad Set → Detailed Targeting
2. Adaugă primul grup de interese (APIA, Subvenții, Fermier)
3. Click pe **„Narrow Audience"** (butonul care adaugă AND)
4. Adaugă al doilea grup (Tractoare, Utilaje agricole, branduri)
5. Rezultat: Audiența conține DOAR oameni care sunt ȘI în grupul A ȘI în grupul B

**Estimare audiență:** Cu ambele grupuri + locație + vârstă, audiența probabilă: **5.000 – 25.000 persoane**. Asta e bine — e mult mai targetat decât 200.000 de „interesați de agricultură".

---

### 1.4. Geo-targeting precis

Nu toți fermierii sunt la fel de relevanți din punct de vedere geografic. Un fermier din Suceava nu va veni la Mădăras.

#### Strategie pe zone concentrice:

| Zonă | Rază | Județe | Buget alocat | Bid adjustment | Logica |
|------|------|--------|-------------|----------------|--------|
| **ZONA 1 — Core** | 0-30 km | Bihor (Salonta, Mădăras, Chișineu-Criș) | 40% | +20% | Vin ușor la sediu, cumpără |
| **ZONA 2 — Primară** | 30-60 km | Bihor (Oradea, Beiuș), Arad (Ineu, Pâncota) | 30% | Normal | Vin la sediu cu puțin efort |
| **ZONA 3 — Secundară** | 60-100 km | Arad (oraș), Satu Mare (sud) | 20% | -10% | Vin doar pentru utilaje mari |
| **ZONA 4 — Terțiară** | 100-150 km | Timiș, Cluj, restul Arad/SM | 10% | -20% | Doar AFIR / utilaje premium |

#### Setare în Meta Ads:
- Creează **Ad Set-uri separate** pe zone (nu un singur Ad Set cu zonă mare)
- Alocă bugete diferite per Ad Set conform tabelului
- Monitorizează: care zonă generează cele mai multe lead-uri calificate?

#### Setare în Google Ads:
- Campaign Settings → Locations → Advanced Search
- Adaugă fiecare zonă separat
- Setează **Bid Adjustments** per locație (ex: Bihor +20%, Timiș -20%)
- **IMPORTANT:** Selectează „People IN this location" (nu „People IN or searching FOR this location") — altfel afișezi reclame oamenilor din București care caută „Bihor"

---

### 1.5. Programare anunțuri (Ad Scheduling)

Fermierii nu stau pe Facebook la 3 noaptea. Optimizăm când rulează reclamele:

#### Meta Ads — Program recomandat:

| Interval | Activitate fermieri | Bid adjustment |
|----------|-------------------|----------------|
| 05:00 – 07:00 | Se trezesc, verifică telefonul | Normal |
| 07:00 – 09:00 | Pauză de cafea, scrollează Facebook | **+15%** |
| 09:00 – 12:00 | La câmp, activitate scăzută online | -10% |
| 12:00 – 14:00 | Pauza de prânz, verifică telefonul | **+10%** |
| 14:00 – 17:00 | La câmp | -10% |
| 17:00 – 21:00 | Seara acasă, Facebook activ | **+20%** |
| 21:00 – 05:00 | Doarme | **OPRIT** sau -30% |

**Notă:** Meta Ads nu permite ad scheduling pe Campaign Budget Optimization (CBO). Dacă folosești CBO, nu poți programa pe ore. Soluție: folosește Ad Set Budget (ABO) pentru control pe ore, sau lasă algoritmul să optimizeze (CBO) dacă bugetul e suficient (>50 RON/zi per campanie).

#### Google Ads — Program recomandat:

- **Luni – Sâmbătă:** 05:00 – 21:00 (fermierii lucrează și sâmbăta)
- **Duminică:** 08:00 – 14:00 (activitate mai scăzută, dar unii caută)
- **Bid adjustment:** +20% în intervalele 06:00-09:00 și 18:00-21:00

---

## FAZA 2 — După 2-4 Săptămâni (CRM are 30-50 clienți)

Aceasta este **faza care schimbă totul**. Odată ce CRM-ul are date reale, putem „învăța" algoritmii cine sunt clienții Agro Salso.

### 2.1. Custom Audience din clienți existenți

**Ce este:** Încarci lista de clienți (numere de telefon) în Meta. Meta potrivește aceste numere cu conturi Facebook existente. Rezultat: o audiență formată din clienții tăi reali.

**La ce folosește:**
1. **Retargeting clienți existenți** — le arăți produse noi, upsell, piese de schimb
2. **Baza pentru Lookalike** — Meta găsește oameni similari cu clienții tăi (FAZA CEA MAI IMPORTANTĂ)
3. **Excludere** — nu mai cheltuiești bani pe oameni care deja au cumpărat

#### Pas cu pas — Creare Custom Audience din CRM:

**Pregătire date (în Google Sheets / Excel):**

| Coloană necesară | Format | Exemplu |
|-----------------|--------|---------|
| **Telefon** | Format internațional, fără spații | +40744123456 |
| **Nume** (opțional) | Prenume | Gheorghe |
| **Prenume** (opțional) | Nume familie | Moldovan |
| **Localitate** (opțional) | Oraș/sat | Salonta |
| **Țară** (opțional) | Cod | RO |

**IMPORTANT:** Cu cât mai multe coloane completezi, cu atât rata de potrivire (match rate) e mai mare. Doar telefonul → ~40-60% match. Telefon + nume + localitate → ~60-80% match.

**Pași în Meta Business Manager:**

1. Deschide **Meta Business Manager** → **Audiences**
2. Click **Create Audience** → **Custom Audience**
3. Selectează **Customer List**
4. Alege sursa: **Upload a file (CSV)** sau **Copy and paste**
5. Mapează coloanele: Phone → Phone Number, First Name → First Name, etc.
6. Click **Import & Create**
7. Meta procesează lista (durează 30 min – câteva ore)
8. Audiența apare în lista de Audiences cu indicator de match rate

**Când actualizăm:** La fiecare 2 săptămâni, re-upload lista actualizată din CRM (cu clienți noi adăugați).

---

### 2.2. Lookalike Audience — CEA MAI IMPORTANTĂ AUDIENȚĂ

**Ce este:** Meta analizează Custom Audience-ul tău (clienții existenți) și găsește alte persoane din România care „arată" la fel — aceleași demografice, comportamente, interese.

**De ce funcționează:** Un fermier de 48 de ani din Bihor cu 60 ha care urmărește APIA și John Deere pe Facebook este FOARTE similar cu alt fermier de 51 de ani din Arad cu 75 ha. Meta vede aceste pattern-uri și le găsește pe cele pe care tu nu le-ai găsit niciodată prin interest targeting manual.

#### Tipuri de Lookalike de creat:

| # | Lookalike bazat pe | Dimensiune | Utilizare |
|---|-------------------|-----------|-----------|
| 1 | **Toți clienții existenți** (Custom Audience CRM) | 1% | Campania principală — cei mai similari cu clienții reali |
| 2 | **Clienții care au cumpărat Mamut** (subgrup din CRM) | 1% | Campania Mamut specifică |
| 3 | **Clienții AFIR** (subgrup din CRM) | 1% | Campania AFIR |
| 4 | **Lead-uri calificate din ads** (Custom Audience din lead-uri bune) | 1% | Extindere targetare |
| 5 | **Toți clienții** | 2-3% | Testare audiență mai mare (doar dacă 1% e prea mic) |

**IMPORTANT: Dimensiunea Lookalike**

| Dimensiune | Nr. aproximativ persoane (RO) | Când folosim |
|-----------|-------------------------------|-------------|
| **1%** | ~100.000 | **Întotdeauna ca audiență principală** — cei mai similari |
| **2%** | ~200.000 | Dacă 1% e prea mic sau vrem mai mult volum |
| **3-5%** | ~300.000 – 500.000 | Testare, doar cu buget mai mare |
| **5-10%** | ~500.000 – 1.000.000 | ❌ Prea larg — calitate scade dramatic |

#### Pas cu pas — Creare Lookalike:

1. **Meta Business Manager** → **Audiences** → **Create Audience** → **Lookalike Audience**
2. **Source:** Selectează Custom Audience-ul creat la 2.1 (lista de clienți)
3. **Location:** România (sau mai specific: Bihor, Arad, Satu Mare, Timiș)
4. **Audience size:** **1%** (începem mereu cu 1%)
5. Click **Create Audience**
6. Durează câteva ore până e gata
7. Folosește-o ca audiență în Ad Set-urile tale

#### Cum integrăm Lookalike în structura de campanii existentă:

```
CAMPANIA 1: Lead Gen — Mamut pe Stoc (ACTUALIZATĂ)
│
├── Ad Set A: Fermieri Bihor — Interest Targeting (existent)     → BUGET: 25%
├── Ad Set B: Fermieri Arad + SM — Interest Targeting (existent) → BUGET: 15%
├── Ad Set C: Retargeting (existent)                             → BUGET: 15%
├── Ad Set D: 🆕 LOOKALIKE 1% — Clienți existenți               → BUGET: 30%
└── Ad Set E: 🆕 LOOKALIKE 1% — Lead-uri calificate              → BUGET: 15%
```

**Cel mai important:** Ad Set D (Lookalike din clienți) ar trebui să primească cel mai mare buget odată ce e activ. De ce? Pentru că Meta a „învățat" cum arată un client real și caută altcineva exact la fel. Asta bate orice interest targeting manual.

---

### 2.3. Retargeting avansat

Pe lângă retargeting-ul simplu (engagement pe pagină), adăugăm retargeting mai precis:

#### Audiențe de retargeting pe niveluri:

| Nivel | Audiență | Reclamă specifică | Buget |
|-------|---------|-------------------|-------|
| **Nivel 1 — Fierbinte** | Lead Form openers care NU au trimis (ultimele 7 zile) | „Ai început să ne scrii dar nu ai terminat. Grapa Mamut e încă pe stoc. Sună-ne!" | 30% din retargeting |
| **Nivel 2 — Cald** | Video viewers 50%+ (ultimele 14 zile) | Reclamă cu detalii tehnice + ofertă specifică | 25% din retargeting |
| **Nivel 3 — Interesat** | Page/post engagers (ultimele 30 zile) | Social proof + testimonial + CTA | 25% din retargeting |
| **Nivel 4 — Rece** | Website visitors (dacă funcționează) sau engagers 30-60 zile | Reminder general + urgență sezon | 20% din retargeting |

#### Cum se creează aceste audiențe:

**Meta Business Manager → Audiences → Custom Audience → Engagement:**

1. **Lead Form openers:** Source: Instant Form → „People who opened but didn't submit" → Ultimele 7 zile
2. **Video viewers:** Source: Video → „People who watched at least 50%" → Ultimele 14 zile
3. **Page engagers:** Source: Facebook Page → „Everyone who engaged" → Ultimele 30 zile

---

### 2.4. Lead Scoring — Prioritizare automată în CRM

Cu datele din lead form, creăm un scor automat care ajută Agro Salso să prioritizeze apelurile:

#### Sistem de scoring:

| Criteriu | Punctaj |
|---------|---------|
| **Suprafață > 50 ha** | +3 puncte |
| **Suprafață 10-50 ha** | +2 puncte |
| **Suprafață < 10 ha** | +0 puncte |
| **Are tractor ≥ 70 CP** | +2 puncte |
| **Nu are tractor / nu specifică** | +0 puncte |
| **Interes AFIR: Da, pregătesc proiect** | +3 puncte |
| **Interes AFIR: Da, vreau info** | +1 punct |
| **Când: Cât mai curând** | +3 puncte |
| **Când: Lunile următoare** | +2 puncte |
| **Când: Anul acesta** | +1 punct |
| **Când: Doar mă informez** | +0 puncte |
| **Sursă: Google Search (high intent)** | +2 puncte |
| **Sursă: Meta Ads (mid intent)** | +1 punct |
| **Sursă: Referral** | +3 puncte |
| **Zona 1 (0-30 km)** | +2 puncte |
| **Zona 2 (30-60 km)** | +1 punct |

#### Interpretare:

| Scor | Clasificare | Acțiune |
|------|------------|---------|
| **12-18 puncte** | 🟢 HOT LEAD | Sună în maxim 1 ORĂ |
| **8-11 puncte** | 🟡 WARM LEAD | Sună în maxim 4 ORE |
| **4-7 puncte** | 🟠 COOL LEAD | Sună în 24 ore |
| **0-3 puncte** | ⚪ COLD / NECALIFICAT | WhatsApp informativ sau ignoră |

**Implementare în Google Sheets:** Adăugăm o coloană „Scor" în tab-ul Lead-uri Noi cu formula automată care calculează pe baza răspunsurilor.

---

## FAZA 3 — După 1-2 Luni (Date suficiente pentru optimizare reală)

### 3.1. Offline Conversions — Spune-i lui Meta cine a CUMPĂRAT

**Asta schimbă jocul complet.** Acum, Meta optimizează pentru „cine completează formularul" (lead generation). Dar noi vrem să optimizeze pentru „cine cumpără efectiv" (purchase).

**Cum funcționează:**
1. Un lead vine din Meta Ads → intră în CRM
2. Agro Salso îl sună, vine la sediu, cumpără
3. Noi marcăm în CRM: „Vândut" + valoare vânzare
4. Upload-ăm această informație înapoi în Meta: „lead-ul X a cumpărat utilaj de 45.000 RON"
5. Meta primește semnalul: „AHA — asta e un cumpărător real. Să caut mai mulți ca el."
6. Algoritmul se recalibrează → arată reclamele la oameni mai similari cu cumpărătorii reali

#### Pas cu pas — Setup Offline Conversions:

**Metoda 1: Upload manual CSV (simplu, recomandat pentru început)**

1. Din CRM, exportă lead-urile cu status „Vândut"
2. Fișierul CSV trebuie să conțină:

| Coloană | Descriere | Exemplu |
|---------|-----------|---------|
| event_time | Data vânzării (Unix timestamp sau YYYY-MM-DD) | 2026-03-15 |
| event_name | Tipul evenimentului | Purchase |
| value | Valoarea vânzării (RON) | 45000 |
| currency | Moneda | RON |
| phone | Telefonul lead-ului (format +40...) | +40744123456 |
| fn | Prenume (opțional, crește match rate) | Andrei |
| ln | Nume (opțional) | Pop |

3. **Meta Events Manager** → **Offline Event Sets** → **Upload Offline Events**
4. Upload CSV-ul → mapează coloanele → Submit
5. Meta potrivește evenimentele cu lead-urile din campaniile tale

**Frecvența:** Upload la fiecare 2 săptămâni (sau după fiecare vânzare majoră).

**Metoda 2: Conversions API (avansat, automatizat)**

Dacă se setează un sistem automatizat (Zapier sau Make):
1. Când un lead e marcat „Vândut" în Google Sheet
2. Zapier trimite automat evenimentul către Meta Conversions API
3. Meta primește datele în timp real — optimizare mai rapidă

**Recomandare:** Începe cu Metoda 1 (manual) primele 2-3 luni. Trecem pe Metoda 2 când există volum suficient.

---

### 3.2. Value-Based Lookalike — Cei mai profitabili clienți

Odată ce avem Offline Conversions cu valori, putem crea un Lookalike care nu caută „oameni similari cu clienții noștri" ci „oameni similari cu clienții noștri care au cheltuit CEL MAI MULT".

**Exemplu:** Dacă Marius Crișan (480 ha) a cumpărat Mamut 4.0 la 120.000 RON, iar Gheorghe (45 ha) a cumpărat Mamut 2.5 la 25.000 RON, Value-Based Lookalike va prioritiza oameni similari cu Marius, nu cu Gheorghe.

#### Setare:
1. Meta Business Manager → Audiences → Custom Audience → Offline Activity
2. Selectează evenimentele de Purchase cu valoare
3. Creează Lookalike 1% din această audiență
4. Meta va pondera mai mult oamenii care au generat valoare mai mare

---

### 3.3. Optimizare Google Ads pe baza datelor CRM

**Google funcționează diferit de Meta**, dar datele din CRM ajută la fel de mult:

#### Acțiuni pe baza datelor din CRM:

| Ce afli din CRM | Ce faci în Google Ads |
|----------------|----------------------|
| Cuvintele cheie care aduc lead-uri calificate | Crește bid-ul pe acele cuvinte |
| Cuvintele cheie care aduc lead-uri necalificate | Adaugă ca negative keywords |
| Orele când vin cele mai bune lead-uri | Ajustează ad schedule |
| Zonele geografice cu cele mai multe vânzări | Crește bid-ul pe acele locații |
| Dispozitivele (mobil vs. desktop) | Ajustează device bids |
| Search terms care nu convertesc | Adaugă ca negative keywords |

#### Google Ads Offline Conversion Import:

Similar cu Meta, poți spune Google-ului care lead-uri au devenit vânzări:

1. **Google Ads** → **Tools & Settings** → **Conversions** → **+ New conversion action**
2. Selectează **Import** → **Other data sources or CRMs** → **Track conversions from clicks**
3. Fiecare lead din Google Ads are un **GCLID** (Google Click ID) — acest ID trebuie salvat în CRM
4. Când lead-ul cumpără → upload CSV cu GCLID + valoare + dată
5. Google recalibrează: „Acest cuvânt cheie + această locație + această oră = vânzare reală"

**GCLID — Cum îl captezi:**
- Adaugă `{gclid}` ca parametru URL în tracking template: `{lpurl}?gclid={gclid}`
- Sau folosește auto-tagging (Google Ads Settings → Auto-tagging → ON)
- GCLID apare în URL-ul paginii de destinație → salvează-l în CRM alături de lead

---

### 3.4. Excludere automată clienți convertiți

Odată ce cineva a cumpărat, nu mai vrem să-i arătăm aceeași reclamă (risipă de bani). Dar vrem să-i arătăm reclame de **upsell** (piese, utilaje complementare).

#### Sistem de excluderi dinamice:

| Audiență | Excludem din | Includem în |
|---------|-------------|-------------|
| Lead-uri trimise (form submit) | Campania de Lead Gen inițială | Campania de Retargeting / Nurturing |
| Clienți care au cumpărat (Vândut) | TOATE campaniile de Lead Gen | Campania de Upsell / Piese de schimb |
| Lead-uri pierdute (Pierdut) | Campania de Lead Gen (temporar, 60 zile) | Campania de „Win-back" după 3-6 luni |

---

## Plan de Implementare Complet

### Săptămâna 1 (23.02 – 01.03.2026) — FAZA 1

| Zi | Acțiune | Cine | Timp estimat |
|----|---------|------|-------------|
| **23-24 feb** | Refacere Lead Form cu întrebări de calificare | Epic Digital Hub | 1 oră |
| **23-24 feb** | Setare Higher Intent form type | Epic Digital Hub | 5 min |
| **24-25 feb** | Adăugare excluderi audiență (lead form submitters) | Epic Digital Hub | 30 min |
| **25 feb** | Implementare Interest Layering (APIA AND Tractoare) | Epic Digital Hub | 30 min |
| **25-26 feb** | Creare Ad Sets separate pe zone geografice | Epic Digital Hub | 1 oră |
| **26-27 feb** | Adăugare negative keywords noi în Google Ads | Epic Digital Hub | 30 min |
| **27-28 feb** | Setare ad scheduling Meta + Google | Epic Digital Hub | 30 min |
| **28 feb** | Verificare: toate reclamele active au noul targeting | Epic Digital Hub | 30 min |

### Săptămânile 2-4 (01-21.03.2026) — Pregătire FAZA 2

| Acțiune | Cine | Condiție |
|---------|------|---------|
| Agro Salso completează CRM cu 30+ clienți | Agro Salso | CRM funcțional ✅ |
| Monitorizare calitate lead-uri cu noul form | Epic Digital Hub | Lead-urile intră |
| Clasificare lead-uri: Calificat / Necalificat | Agro Salso (în CRM) | Lead-uri în CRM |
| Pregătire CSV pentru upload Custom Audience | Epic Digital Hub | 30+ clienți în CRM |

### Săptămâna 4-5 (21.03 – 04.04.2026) — FAZA 2 ACTIVARE

| Acțiune | Cine | Condiție |
|---------|------|---------|
| Upload Custom Audience clienți existenți în Meta | Epic Digital Hub | 30+ numere telefon |
| Creare Lookalike 1% din clienți existenți | Epic Digital Hub | Custom Audience procesată |
| Creare Lookalike 1% din lead-uri calificate | Epic Digital Hub | 20+ lead-uri calificate |
| Lansare Ad Set nou cu Lookalike | Epic Digital Hub | Lookalike gata |
| A/B test: Lookalike vs. Interest Targeting | Epic Digital Hub | Ambele active |
| Setup retargeting pe niveluri (Hot / Warm / Cool) | Epic Digital Hub | Suficient engagement |

### Luna 2 (Aprilie 2026) — FAZA 3 ÎNCEPE

| Acțiune | Cine | Condiție |
|---------|------|---------|
| Primul upload Offline Conversions (vânzări reale) | Epic Digital Hub | Minim 5 vânzări din ads |
| Analiză: care audiență performează cel mai bine | Epic Digital Hub | Date din 4+ săptămâni |
| Realocarea bugetului pe audiența câștigătoare | Epic Digital Hub | Date suficiente |
| Creare Value-Based Lookalike (dacă sunt destule vânzări) | Epic Digital Hub | 10+ vânzări cu valoare |
| Google Ads: import offline conversions (GCLID) | Epic Digital Hub | GCLID-uri salvate |

### Luna 3+ (Mai 2026 →) — Optimizare continuă

| Acțiune | Frecvență |
|---------|-----------|
| Re-upload Custom Audience actualizată | La 2 săptămâni |
| Upload Offline Conversions (vânzări noi) | La 2 săptămâni |
| Refresh Lookalike Audiences | Lunar |
| Analiză lead quality per sursă/campanie | Săptămânal |
| Ajustare negative keywords Google | Săptămânal |
| Review ad scheduling pe baza datelor | Lunar |
| Excludere clienți convertiți din Lead Gen | La fiecare vânzare |

---

## Cum se leagă totul — Ciclul complet

```
                    ┌──────────────────────────────────┐
                    │                                  │
                    ▼                                  │
    ┌───────────────────────────┐                      │
    │   RECLAME META + GOOGLE   │                      │
    │  (cu targeting optimizat) │                      │
    └──────────┬────────────────┘                      │
               │                                       │
               ▼                                       │
    ┌───────────────────────────┐                      │
    │   LEAD FORM INTELIGENT    │                      │
    │ (filtru: ha, tractor, urg)│                      │
    └──────────┬────────────────┘                      │
               │                                       │
               ▼                                       │
    ┌───────────────────────────┐                      │
    │   CRM (Google Sheets)     │                      │
    │  Lead scoring automat     │                      │
    │  Status: Nou→...→Vândut   │                      │
    └──────────┬────────────────┘                      │
               │                                       │
               ▼                                       │
    ┌───────────────────────────┐                      │
    │   FOLLOW-UP TELEFONIC     │                      │
    │  (conform procedurii)     │                      │
    └──────────┬────────────────┘                      │
               │                                       │
               ▼                                       │
    ┌───────────────────────────┐         ┌────────────┴──────────────┐
    │   VÂNZARE (sau pierdut)   │────────►│  OFFLINE CONVERSIONS      │
    │                           │         │  Upload vânzări → Meta    │
    └───────────────────────────┘         │  Upload GCLID → Google    │
                                          └────────────┬──────────────┘
                                                       │
                                                       ▼
                                          ┌────────────────────────────┐
                                          │  ALGORITMUL ÎNVAȚĂ:         │
                                          │  „Asta e un cumpărător      │
                                          │   real. Caută alții la fel."│
                                          └────────────┬───────────────┘
                                                       │
                                                       │ Lookalike +
                                                       │ Optimization
                                                       │
                                                       └──────────────┘
                                                    (înapoi la Reclame)
```

**Fiecare vânzare face algoritmul mai deștept. Cu cât vinde mai mult Agro Salso, cu atât reclamele devin mai precise. Acesta e ciclul virtuos.**

---

## Metrici de succes — Cum știm că funcționează

### Comparație: Înainte vs. După

| Metric | Înainte (feb 2026) | După Faza 1 (1 săpt.) | După Faza 2 (1 lună) | După Faza 3 (2-3 luni) |
|--------|--------------------|-----------------------|----------------------|----------------------|
| **Cost per lead** | Necunoscut (nu se urmăreau) | < 30 RON | < 20 RON | < 15 RON |
| **Lead-uri calificate (% din total)** | ~20% (estimare) | 40-50% | 55-65% | 65-75% |
| **Rata de răspuns la telefon** | Necunoscută | 60-70% | 70-80% | 75-85% |
| **Vizite la sediu din ads** | ~0 | 3-5/săpt. | 5-10/săpt. | 8-15/săpt. |
| **Vânzări din ads** | 0 | 1-2/lună | 3-5/lună | 5-8/lună |
| **ROI pe buget ads** | Negativ | Break-even | 200-400% | 400-800% |

---

## De reținut

1. **Faza 1 e gratuită** — nu costă nimic în plus, doar schimbăm setările în conturile de ads
2. **Faza 2 depinde de CRM** — de aceea am construit CRM-ul înainte. Fără date despre clienți, nu avem pe ce construi Lookalike
3. **Faza 3 e unde se vede ROI-ul mare** — algoritmii care știu cine cumpără efectiv sunt de 3-5x mai eficienți decât interest targeting manual
4. **Totul e un ciclu** — fiecare vânzare face următoarea reclamă mai bună. Primele 2-3 luni sunt cele mai grele. După, sistemul se auto-optimizează
5. **Cel mai important lucru rămâne telefonul** — cea mai bună targeting din lume nu ajută dacă nimeni nu sună lead-urile în 2 ore

---

*Document pregătit de Epic Digital Hub — 23.02.2026*
*Strategia se construiește pe: Buyer Personas Agro Salso, Audit Digital, Analiza Competiției, Strategia Ads Dexwal Mamut, și Sistemul CRM.*
