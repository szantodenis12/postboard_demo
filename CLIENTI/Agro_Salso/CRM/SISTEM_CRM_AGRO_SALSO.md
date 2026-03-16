---
client: Agro Salso
type: digital-strategy
use-for: [strategy, reports, campaign-planning, ads, all]
priority: critical
last-updated: 2026-02-23
summary: "Sistem CRM Google Sheets pentru Agro Salso — 5 tab-uri (Clienți Existenți, Lead-uri Noi, Pipeline AFIR, Follow-up Zilnic, Raport Lunar), instrucțiuni completare, automatizare Meta Ads → Sheet, proceduri follow-up"
---

> **Dosarul Agro Salso — Cuprins:**
> [README — Client Brief](../README.md) | [Strategie Vânzări Rapide](../STRATEGIE_VANZARI_RAPIDE_FEB2026.md) | [Strategie Ads Dexwal Mamut](../STRATEGIE_ADS_DEXWAL_MAMUT.md) | **[Sistem CRM](./SISTEM_CRM_AGRO_SALSO.md)** | [Audit Digital](../RESEARCH/AUDIT_DIGITAL/AUDIT_PREZENTA_DIGITALA_AGRO_SALSO.md) | [Analiză Competiție](../RESEARCH/ANALIZA_COMPETITIE/ANALIZA_COMPETITIE_AGRO_SALSO.md) | [Analiză Piață](../RESEARCH/ANALIZA_PIATA/ANALIZA_PIATA_UTILAJE_AGRICOLE_BIHOR.md)

---

# Sistem CRM — Agro Salso

**Data:** 23.02.2026
**Pregătit de:** Epic Digital Hub
**Context:** Agro Salso nu deține o bază de date digitală cu clienții. Toate informațiile sunt pe agende, hârtii și în telefon. Acest lucru înseamnă:

- Nu există o listă clară cu clienții din ultimii 13 ani
- Lead-urile din reclame se pierd (nimeni nu le urmărește sistematic)
- Nu există follow-up structurat
- Nu se știe care clienți ar putea cumpăra din nou (upsell/cross-sell)
- Nu se pot măsura rezultatele campaniilor publicitare

**Soluția:** Un sistem CRM simplu, bazat pe Google Sheets, cu 5 tab-uri.

---

## De ce Google Sheets și nu altceva

| Opțiune | Pro | Contra | Verdict |
|---------|-----|--------|---------|
| **Google Sheets** | Gratuit, accesibil de pe telefon, partajabil, ușor de folosit, se poate automatiza | Nu are funcții CRM avansate | **Recomandat** — perfect pentru 2 angajați |
| Excel (local) | Familiar | Nu e partajabil, nu merge pe telefon, nu se automatizează | ❌ Nu |
| HubSpot / Pipedrive | Funcții CRM profesionale | Complicat, plan gratuit limitat, curbă de învățare | ❌ Prea mult pentru 2 oameni |
| Notion | Flexibil, vizual | Curbă de învățare, nu e intuitiv pentru fermieri | ❌ Nu |

**Google Sheets e alegerea corectă** — e gratuit, funcționează pe telefon (important: Agro Salso stă în curte/câmp, nu la birou), și poate fi conectat automat la formularele de Lead din Meta Ads.

---

## Structura CRM-ului: 5 Tab-uri

### Tab 1: CLIENȚI EXISTENȚI

**Scopul:** Digitalizarea bazei de clienți din ultimii 13 ani. Aici intră TOȚI clienții care au cumpărat vreodată de la Agro Salso.

**De unde completăm:**
- Agende vechi
- Facturi emise (se pot cere de la contabil)
- Contacte din telefon
- Memorie (începe cu cei pe care îi știe cel mai bine)

**Coloane:**

| Coloană | Ce completezi | Exemplu |
|---------|--------------|---------|
| **Nume** | Numele complet al clientului | Gheorghe Moldovan |
| **Telefon** | Număr mobil principal | 07XX XXX XXX |
| **Localitate** | Satul/orașul clientului | Salonta |
| **Județ** | Județul | Bihor |
| **Suprafață fermă (ha)** | Câte hectare lucrează | 45 |
| **Tractor(e) deținute** | Ce tractoare are (important pentru compatibilitate) | UTB 650 + Landini 85 CP |
| **Utilaje cumpărate** | Ce a cumpărat de la Agro Salso | Grapă Mamut 2.5 |
| **Data ultimei achiziții** | Când a cumpărat ultima dată | 2024-03 |
| **Ultimul contact** | Când ai vorbit ultima dată cu el | 2025-11 |
| **Potențial upsell** | Ar putea cumpăra altceva? Da/Nu | Da |
| **Ce ar putea cumpăra** | Ce produs i-ar trebui | Cultivator sau semănătoare |
| **Email** | Dacă are | — |
| **Recomandat de cineva?** | Cine l-a trimis la tine | Nu / Da — Vecinul Marin |
| **Note** | Orice altceva relevant | Client fidel, vorbește cu vecinul Ion |

**Cum completezi:**
1. Stai jos cu o agendă veche
2. Treci fiecare client cunoscut
3. **Nu trebuie să completezi TOATE coloanele** — numele și telefonul sunt suficiente pentru început
4. Restul se completează pe parcurs, la fiecare apel sau vizită

**Prioritate:** Începe cu cei mai importanți 20-30 de clienți. Apoi adaugă pe măsură ce îți amintești sau găsești facturi vechi.

---

### Tab 2: LEAD-URI NOI

**Scopul:** Aici intră ORICE persoană care a arătat interes — din reclame, grupuri Facebook, referral-uri, apeluri telefonice, vizite spontane.

**De unde vin lead-urile:**
- **Meta Ads (Lead Forms)** — se pot importa automat (vezi secțiunea Automatizare)
- **Google Ads (apeluri, formulare)** — se trec manual
- **Grupuri Facebook** — cineva comentează/scrie mesaj
- **Referral** — recomandat de un client existent
- **Marketplace** — cineva contactează pe un anunț
- **Telefon direct** — sună cineva care a auzit de Agro Salso
- **Vizită spontană** — vine cineva pe DN79

**Coloane cheie:**

| Coloană | Importanță |
|---------|------------|
| **Data lead** | Când a intrat lead-ul — important pentru viteza de răspuns |
| **Sursă** | De unde a venit — Meta Ads / Google Ads / Referral / Telefon / Grup FB / Vizită |
| **Campanie** | Care campanie specifică (C1 Mamut pe Stoc / C2 AFIR / Organică / etc.) |
| **Status** | **CEL MAI IMPORTANT CÂMP** — vezi statusurile mai jos |
| **Următorul follow-up** | Când trebuie sunat din nou |
| **Calitate lead** | Calificat / Necalificat / De evaluat |

**Statusuri lead (cu culori în Google Sheets):**

| Status | Culoare | Ce înseamnă |
|--------|---------|-------------|
| **Nou** | 🔴 Roșu | Tocmai a intrat — TREBUIE SUNAT în maxim 2 ore |
| **Contactat** | 🟡 Galben | Am vorbit, dar nu s-a decis încă |
| **Interesat** | 🟢 Verde deschis | A confirmat interes, discutăm detalii |
| **Ofertă trimisă** | 🔵 Albastru | A primit oferta, așteptăm răspuns |
| **Vizită programată** | 🟣 Mov | Vine pe DN79 să vadă utilajul |
| **Vândut** | 🟢 Verde închis | A cumpărat! |
| **Pierdut** | ⚫ Gri | Nu a cumpărat — notează DE CE |
| **Nu răspunde** | 🟤 Maro | Am sunat de 3+ ori, nu răspunde |

**Regula de aur:** Un lead cu status „Nou" mai vechi de 24 ore = **problemă**. Fermierii nu așteaptă.

---

### Tab 3: PIPELINE AFIR

**Scopul:** Urmărirea separată a lead-urilor AFIR — sunt cele mai valoroase (un proiect AFIR = vânzare de zeci de mii de RON).

**De ce un tab separat:**
- Procesul AFIR are pași specifici (ofertă conformă, factură proformă, fișă tehnică)
- Termenele sunt stricte (sesiunea DR-14)
- Valoarea per lead este mult mai mare
- Trebuie urmărit și consultantul AFIR, nu doar fermierul

**Coloane importante specifice:**
- **Consultant AFIR** — cine îl ajută pe fermier cu proiectul
- **Ofertă conformă trimisă** — Da/Nu + dată
- **Factură proformă** — Da/Nu
- **Fișă tehnică** — Da/Nu
- **Status proiect AFIR** — În pregătire / Depus / Evaluare / Aprobat / Respins
- **Valoare estimată (RON)** — cât ar valora vânzarea

---

### Tab 4: FOLLOW-UP ZILNIC

**Scopul:** Lista de acțiuni pentru FIECARE ZI. Cine trebuie sunat, de ce, și ce s-a întâmplat.

**Cum se folosește:**
1. Dimineața la 07:00 — deschizi tab-ul și vezi ce ai de făcut azi
2. Suni pe fiecare persoană din listă
3. După fiecare apel, completezi „Rezultat apel" și „Următoarea acțiune"
4. Seara, adaugi apelurile de mâine

**De ce e important:** Fără acest tab, follow-up-ul se face „când îmi aduc aminte" — adică rar. Cu el, nu se pierde niciun lead.

**Prioritizare:**
- **Urgentă** — Lead-uri noi din ads (maxim 2 ore), proiecte AFIR cu deadline
- **Normală** — Follow-up la oferte trimise, clienți existenți
- **Scăzută** — Lead-uri reci, clienți vechi pentru upsell exploratoriu

---

### Tab 5: RAPORT LUNAR

**Scopul:** Vedere de ansamblu — câte lead-uri, câte vânzări, cât a costat fiecare canal.

**Se completează:** O dată pe lună, de preferință în prima zi a lunii noi.

**Metrici cheie:**
- **Lead-uri noi total** — câte persoane noi au arătat interes
- **Din fiecare sursă** — Meta Ads, Google Ads, Referral, Grupuri FB, AFIR
- **Lead-uri contactate** — câte am sunat efectiv
- **Lead-uri calificate** — câte erau relevante (au pământ, au tractor, vor să cumpere)
- **Vizite la sediu** — câți au venit pe DN79
- **Vânzări închise** — câte au rezultat în cumpărare
- **Valoare vânzări (RON)** — câți bani au intrat
- **Buget ads** — câți bani s-au cheltuit pe reclame
- **Cost per lead** — buget ÷ lead-uri
- **Cost per vânzare** — buget ÷ vânzări

---

## Automatizare: Meta Ads → Google Sheets

**Lead-urile din Meta Ads (Lead Forms) pot fi trimise AUTOMAT în Google Sheets.** Asta înseamnă:
- Când un fermier completează un formular pe Facebook → apare automat în tab-ul „Lead-uri Noi"
- Nu mai trebuie să intri manual în Meta Business Manager să cauți lead-uri
- Primești notificare pe email sau telefon când intră un lead nou

### Cum se configurează (3 opțiuni):

**Opțiunea 1 — Zapier (Recomandat)**
1. Creează cont gratuit pe [zapier.com](https://zapier.com)
2. Conectează Facebook Lead Ads → Google Sheets
3. Mapează câmpurile: Nume → Coloană Nume, Telefon → Coloană Telefon, etc.
4. Gratuit pentru primele 100 lead-uri/lună (suficient pentru Agro Salso)

**Opțiunea 2 — Facebook Lead Ads direct**
1. Din Meta Business Manager → Integrări → Google Sheets
2. Conectează direct, fără intermediar
3. Mai simplu, dar mai puține opțiuni de customizare

**Opțiunea 3 — Manual (temporar)**
1. Intri zilnic în Meta Business Manager → Lead Center
2. Descarci lead-urile ca CSV
3. Le lipești în Google Sheet

**Recomandare:** Începe cu Opțiunea 3 (manual) pentru prima săptămână, apoi treci pe Opțiunea 1 (Zapier) odată ce sistemul e stabil.

---

## Procedura de Follow-Up (CRITICĂ)

Cel mai important lucru din tot acest sistem nu e spreadsheet-ul — e **ce faci cu lead-urile care intră**.

### Reguli de follow-up:

| Regulă | Detalii |
|--------|---------|
| **Lead nou din ads** | Sună în maxim **2 ore**. Dacă nu poți suna, trimite SMS: „Salut, am văzut că te interesează [produs]. Te sun în [oră]. — Agro Salso" |
| **Nu răspunde prima dată** | Sună din nou după **4 ore**, apoi a doua zi dimineață |
| **3 apeluri fără răspuns** | Trimite WhatsApp cu poză utilajul și text scurt. Marchează „Nu răspunde" |
| **Lead AFIR** | Sună în maxim **1 oră**. Aceștia sunt cei mai valoroși lead-uri |
| **După vizită la sediu** | Sună a doua zi: „Ce ai decis? Pot să te ajut cu ceva?" |
| **După ofertă trimisă** | Sună după **3 zile** dacă nu a revenit |
| **Client existent** | Sună o dată la **3 luni** — upsell, piese, recomandări |

### Script apel lead nou (exemplu):

> „Bună ziua, sunt [Nume] de la Agro Salso din Mădăras. Am văzut că te-a interesat grapa Dexwal Mamut. O avem pe stoc aici la noi, pe DN79. Ai putea trece pe la noi să o vezi? ...Câte hectare lucrezi?... Ce tractor ai?... Perfect, modelul [X] ți se potrivește. Când ai putea veni?"

---

## Plan de Implementare

### Săptămâna 1 (23.02 – 01.03.2026) — SETUP

| Zi | Acțiune | Cine |
|----|---------|------|
| **23-24 feb** | Creează Google Sheet-ul cu cele 5 tab-uri (importă CSV-urile) | Epic Digital Hub |
| **24-25 feb** | Adaugă conditional formatting (culori pe statusuri) | Epic Digital Hub |
| **25-26 feb** | Agro Salso completează primii 20 clienți existenți din memorie/agendă | Agro Salso |
| **27 feb** | Configurează Zapier / import manual lead-uri Meta | Epic Digital Hub |
| **28 feb** | Test complet: creează lead test, verifică flow | Epic Digital Hub + Agro Salso |

### Săptămâna 2 (01-07.03.2026) — DIGITALIZARE

| Acțiune | Detalii |
|---------|---------|
| Agro Salso trece prin TOATE agendele vechi | Adaugă clienți existenți (obiectiv: 50+ clienți) |
| Cere lista de facturi de la contabil | Completează cu clienți uitați |
| Primele lead-uri reale din ads intră în CRM | Follow-up conform procedurii |

### Săptămâna 3-4 (08-21.03.2026) — RUTINĂ

| Acțiune | Detalii |
|---------|---------|
| Follow-up zilnic devine rutină | Dimineața la 07:00: deschide tab Follow-up |
| Revizuire săptămânală | Câte lead-uri au intrat? Câte au fost sunate? Câte vizite? |
| Ajustări | Ce coloane lipsesc? Ce nu funcționează? |

### Luna 2 (Aprilie 2026) — OPTIMIZARE

- Primul raport lunar complet
- Identificare: care sursă aduce cele mai bune lead-uri?
- Ajustare buget ads pe baza datelor reale din CRM
- Lansare program de referral bazat pe clienți existenți din Tab 1

---

## Cum ajută CRM-ul la îmbunătățirea strategiei de ads

**Fără CRM:**
- Nu știi care campanie aduce vânzări
- Nu poți calcula ROI-ul pe fiecare canal
- Bugetul se alocă „la sentiment"
- Lead-urile se pierd

**Cu CRM:**
- Știi exact: „Campania C1 Mamut pe Stoc a adus 15 lead-uri, 8 calificate, 3 vânzări = ROI 500%"
- Poți dubla bugetul pe ce funcționează și opri ce nu funcționează
- Știi câți clienți existenți au cumpărat din nou (upsell)
- Știi câte referral-uri au venit (program de recomandări)
- Poți construi audiențe Lookalike pe baza clienților reali

---

## Fișierele CSV incluse

Toate template-urile sunt în folderul `CRM/` și pot fi importate direct în Google Sheets:

| Fișier | Tab |
|--------|-----|
| `01_CLIENTI_EXISTENTI.csv` | Tab 1 — Clienți existenți |
| `02_LEADURI_NOI.csv` | Tab 2 — Lead-uri noi |
| `03_PIPELINE_AFIR.csv` | Tab 3 — Pipeline AFIR |
| `04_FOLLOW_UP_ZILNIC.csv` | Tab 4 — Follow-up zilnic |
| `05_RAPORT_LUNAR.csv` | Tab 5 — Raport lunar |

### Instrucțiuni import în Google Sheets:
1. Deschide [Google Sheets](https://sheets.google.com) → New Blank Spreadsheet
2. Pentru fiecare CSV: File → Import → Upload → alege fișierul CSV
3. La import, selectează: **„Insert new sheet"** (nu Replace)
4. Redenumește fiecare tab conform numelui
5. Șterge rândurile cu exemplele după ce ai înțeles structura
6. Adaugă Conditional Formatting pe coloana Status (Tab 2) pentru culori

---

## Ce urmează după CRM

Odată ce CRM-ul funcționează (2-4 săptămâni), următorii pași strategici sunt:

1. **Program de referral structurat** — clienții existenți primesc reducere la piese dacă recomandă pe cineva care cumpără
2. **Segmentare clienți** — grupează clienții pe: fermă mică / medie / mare → comunicare diferită
3. **Campanie de reactivare** — sună TOȚI clienții din Tab 1 care n-au mai cumpărat de 2+ ani
4. **Rapoarte automate** — configurare Google Sheets cu formule care calculează automat KPI-urile
5. **WhatsApp Business** — canal oficial de comunicare cu confirmări automate

---

*Document pregătit de Epic Digital Hub — 23.02.2026*
*Acest sistem CRM este construit specific pentru o microîntreprindere cu 2 angajați, fără experiență cu software CRM.*
