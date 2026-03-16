---
client: _TEMPLATE
type: brand-alignment
use-for: [all]
priority: high
last-updated: 2026-03-05
summary: "Audit of all 13 client READMEs against the new template standard — what's real data, what's AI filler, what's missing"
---

# Audit — READMEs Existente vs. Template Nou

Acest document analizează toate cele 13 README-uri existente pe baza noului template.

**Legendă:**
- **REAL** = Date reale, specifice, care vin din cunoașterea clientului. De păstrat.
- **AI-SMELL** = Text vag, generic, care sună a output AI. De rescris cu date reale.
- **MISSING** = Secțiune lipsă. De completat la următorul call cu clientul.
- **STRONG** = Secțiune excepțional de bine făcută. Model pentru alte README-uri.

---

## Scor General per Client

| Client | REAL | AI-SMELL | MISSING | Scor Total |
|--------|------|----------|---------|------------|
| DentalNet | 12 | 1 | 5 | A- |
| Agro Salso | 11 | 2 | 4 | B+ |
| AutoSiena | 10 | 3 | 5 | B+ |
| Philatopo | 7 | 2 | 6 | B- |
| ThermX | 5 | 2 | 8 | C+ |
| Hotel Maxim | 3 | 2 | 9 | C- |
| Marius Șinca | 3 | 1 | 10 | C- |
| Agro Salso | — | — | — | (inclus mai sus) |
| TLP | 1 | 1 | 12 | D |
| XpertAudio | 1 | 1 | 12 | D |
| HarmonyGarden | 1 | 1 | 12 | D |
| FundatiaSinca | 1 | 1 | 12 | D |
| Contabilitate | 1 | 1 | 12 | D |
| ProiectCarina | 1 | 1 | 12 | D |

---

## Audit Detaliat per Secțiune

### SECȚIUNEA 1: Informații Generale

**Ce evaluăm:** Nume juridic, CUI, contact, website, social, pachet, ore lucru.

| Client | Verdict | Note |
|--------|---------|------|
| DentalNet | **REAL** | CUI, adrese (2 locații), telefon, email, program, Instagram, Facebook — toate reale |
| Agro Salso | **REAL** | CUI, CAEN, locație specifică (DN79 Mădăras), website, Autoline, angajați — verificabil |
| AutoSiena | **REAL** | CUI, director general, director vânzări, manager comercial — 3 persoane de contact cu rol |
| Philatopo | **REAL** | Adresă, email, telefon, Google Drive — reale |
| Hotel Maxim | **MISSING** | Doar www.hotel-maxim.ro. Lipsesc: CUI, persoane contact, email, telefon, adresă |
| ThermX | **REAL** | Companie, adresă, telefon, email, website — dar fără CUI |
| Marius Șinca | **REAL** | Contact + Google Drive |
| TLP | **MISSING** | Zero date de contact |
| XpertAudio | **MISSING** | Zero date de contact |
| HarmonyGarden | **REAL partial** | Contact Robert Babinszki + Google Drive, dar fără restul |
| FundatiaSinca | **REAL partial** | Contact + Google Drive |
| Contabilitate | **MISSING** | Contactul e literalmente „-" |
| ProiectCarina | **REAL partial** | Contact Norbi & Ale + Google Drive |

---

### SECȚIUNEA 2: Obiective & KPI-uri

**Ce evaluăm:** Ce vrem să obținem, ce a funcționat/nefuncționat anterior.

| Client | Verdict | Note |
|--------|---------|------|
| **TOATE** | **MISSING** | Niciun README nu conține obiective de business, KPI-uri, sau metrici de succes. Aceasta e cea mai mare lipsă din toate dosarele. |

**Excepție parțială:**
- AutoSiena are „Priorități strategice" (7 puncte) — dar sunt acțiuni ale agenției, nu obiective de business ale clientului
- Agro Salso are „Priorități strategice" — similar, acțiuni nu obiective
- DentalNet nu are deloc

**Acțiune:** La următorul call cu fiecare client activ, întreabă: „Care e obiectivul #1 pentru următoarele 3 luni? Cum arată succesul?"

---

### SECȚIUNEA 3: Ce Vinde / Servicii

**Ce evaluăm:** Catalog produse/servicii, prețuri, ce NU vinde.

| Client | Verdict | Note |
|--------|---------|------|
| DentalNet | **STRONG** | Pachete cu prețuri, vârste, discount multi-copil. Plus „Ce vindem / Ce NU vindem" clar |
| Agro Salso | **STRONG** | Categorii produse, branduri, prețuri, + explicit ce NU vinde (tractoare, combine) |
| AutoSiena | **STRONG** | 3 portofolii (Stellantis, KGM, Chery) cu game, prețuri, USP-uri per brand |
| Philatopo | **REAL** | Servicii listate în Brand Context, dar fără prețuri (deși prețurile sunt publice pe site!) |
| ThermX | **REAL partial** | Date tehnice cheie (Lambda, grosime, garanție) dar fără pricing |
| Hotel Maxim | **AI-SMELL** | „Focus pe confort, locație și ospitalitate locală" — generic, fără servicii/prețuri/camere |
| Toate celelalte | **MISSING** | Fără catalog de produse/servicii |

**Model de urmat:** DentalNet — tabel cu pachete, vârste, prețuri. Simplu și clar.

---

### SECȚIUNEA 4: Brand Voice

**Ce evaluăm:** Trăsături definite, Do/Don't, spectru vocal, ton per platformă.

#### A. Trăsături de voce

| Client | Conținut actual | Verdict |
|--------|----------------|---------|
| DentalNet | „Calm, clar, concret, educativ" + „Cum sună: Ca un medic bun care explică pe înțelesul tău" | **REAL** — descrierea „cum sună" e excelentă |
| Philatopo | „Inginer tânăr, experimentat dar accesibil — direct, fără ocolișuri, pasionat de precizie" | **REAL** — personalitate specifică, nu generic |
| Hotel Maxim | „Primitor, Elegant, Gazdă Locală, Relaxat." | **AI-SMELL** — 4 adjective fără context |
| ThermX | „Inovator, Tehnic-Accesibil, Premium, Eco-smart." | **AI-SMELL** — „Eco-smart" și „Premium" sunt goale |
| XpertAudio | „Expert, Tehnic, Puternic, De încredere." | **AI-SMELL** — 4 adjective generice |
| HarmonyGarden | „Visător, Estival, Distractiv, Comunitar." | **AI-SMELL** — 4 adjective generice |
| FundatiaSinca | „Empatic, Emoționant, Serios, Mobilizator." | **AI-SMELL** — 4 adjective generice |
| Contabilitate | „Sobru, Profesionist, Clar, Sigur." | **AI-SMELL** — 4 adjective generice |
| Marius Șinca | „Autentic, Inspirațional, Lider, Transparent, Calm si calduros" | **AI-SMELL partial** — 5 adjective, dar „calm și călduros" e real |
| ProiectCarina | „Drăgălaș, Wonder-filled, Amuzant, Natural, Talentat." | **AI-SMELL partial** — „Talentat" nu e voce, e descriere |
| TLP | „Energetic, Cool, Hype, Cultural (Maghiar)." | **REAL partial** — „Hype" e specific |
| Agro Salso | Ton complet pe platformă + identitate 4 puncte | **REAL** — specific, cu context |
| AutoSiena | Ton per canal + mesaje cheie per brand | **REAL** — bine structurat |

**Concluzie:** Majoritatea README-urilor au Brand Voice = 4 adjective separate prin virgulă. Asta e exact pattern-ul AI pe care l-ai identificat. Noul template cere: spectru 1-5, perechi „suntem/nu suntem", tabel Do/Don't cu exemple reale.

#### B. Subiecte interzise

| Client | Conținut actual | Verdict |
|--------|----------------|---------|
| DentalNet | 7 reguli specifice + tabel „Nu spunem / Spunem" | **STRONG** — cel mai bun din toate README-urile |
| Philatopo | 5 reguli specifice | **REAL** — „Nu promitem termene OCPI (nu le controlăm)" e concret |
| Hotel Maxim | „Fără oază de liniște, vă așteptăm cu drag, confort sporit" | **REAL** — clișee specifice industriei hoteliere |
| ThermX | „Fără soluție revoluționară sau game-changer. Nu folosi metafore." | **REAL** — specific |
| XpertAudio | „Fără calitate superioară sau sunet cristalin. Specificații tehnice. Fii arogant-profesionist." | **STRONG** — tonul „arogant-profesionist" e foarte specific |
| Contabilitate | „Fără navigăm hățișul sau partenerul tău de încredere. Zero marketing." | **REAL** — concret |
| FundatiaSinca | „Fără melodramă ieftină. Fără haideți să. Demnitate și acțiune, nu milă." | **REAL** |
| Marius Șinca | „Fără liste cu bullet points. Scrie brut, vulnerabil, ca un fragment de jurnal." | **STRONG** — stil foarte specific |
| ProiectCarina | „Nu scrie ca un adult care imită un copil. Propoziții scurte." | **REAL** |
| TLP | „Fără limbaj formal. Folosește slang tineresc, fii Hype." | **REAL** |
| Agro Salso | 4 reguli specifice: nu tractoare, nu corporatist, nu ignora fermierii mici | **REAL** |
| AutoSiena | 5 reguli specifice: nu compara cu BMW, nu prezenta Chery ca ieftin | **REAL** |
| HarmonyGarden | Vag — doar „fără clișee" | **AI-SMELL** |

**Concluzie:** Ironic — secțiunea „Subiecte interzise" e cea mai reală și utilă din README-urile actuale. Asta pentru că e imposibil să generezi interdicții specifice fără să cunoști clientul. **Aceasta e secțiunea pe care o păstrăm intactă.**

#### C. Ton per platformă

| Client | Verdict | Note |
|--------|---------|------|
| Philatopo | **REAL** | FB/IG conversațional (tu), LinkedIn profesional (dvs.), WhatsApp rapid |
| AutoSiena | **REAL** | FB prietenos, TikTok energic, IG vizual, Website profesional |
| Agro Salso | **REAL** | FB/IG informal (tu), LinkedIn profesional (dvs.) |
| DentalNet | **MISSING** | Surprinzător — cel mai detaliat README nu are ton per platformă |
| Toate celelalte | **MISSING** | |

---

### SECȚIUNEA 5: Public Țintă

**Ce evaluăm:** Segmente cu demografie, psihografie, comportament, obiecții, JTBD.

| Client | Conținut actual | Verdict |
|--------|----------------|---------|
| DentalNet | 4 segmente comportamentale (Cautătorii, Amânătorii, Reactivii, Proactivii) cu „Ce le spunem" | **STRONG** — segmentare pe comportament, nu pe demografie |
| Agro Salso | 4 buyer personas cu nume, vârstă, hectare, profil, + zone geografice 3 nivele | **STRONG** — personas reale cu detalii |
| AutoSiena | 5 segmente cu vârstă, profil, brand preferat + zone geografice + comportament cumpărare | **REAL** — incluzând „procesul de decizie durează 2-6 luni" |
| Philatopo | B2C (proprietari, constructori, moștenitori) + B2B (dezvoltatori, arhitecți, notari) | **REAL** — dar superficial, fără nevoi/obiecții |
| ThermX | „Proprietari case, dezvoltatori, constructori" | **AI-SMELL** — exact pattern-ul generic |
| Hotel Maxim | „Turiști city-break, business travelers, organizatori, cupluri 35-55" | **AI-SMELL** — o linie, zero profunzime |
| Marius Șinca | „Persoane care au nevoie să audă un mesaj călduros, cei singuri și triști" | **REAL** — specific emoțional, neconvențional |
| Toate celelalte | 1 linie generică | **AI-SMELL** |

**Ce lipsește la TOȚI:**
- Obiecții la cumpărare (ce îi oprește?)
- Declanșator achiziție (ce eveniment îi pune în mișcare?)
- Surse de informare (unde caută?)
- JTBD (când ___, vreau să ___, ca să ___)

---

### SECȚIUNEA 6: Mesaje Cheie / Messaging Pillars

**Ce evaluăm:** Positioning statement, value prop, piloni de mesaj cu dovezi.

| Client | Conținut actual | Verdict |
|--------|----------------|---------|
| DentalNet | „Ce vând toți: Fără durere, fără frică. Ce vindem noi: Fără carii." | **STRONG** — positioning perfect |
| Agro Salso | 5 mesaje cheie specifice cu context local | **REAL** — „Pe DN79, în Mădăras — treci pe la noi" |
| AutoSiena | Mesaje cheie per brand (KGM, Chery, Stellantis) | **REAL** — dar fără piloni unificați |
| Philatopo | Diferentiatori: prețuri publice, răspuns 30 min, dosar OCPI 24h, GNSS | **REAL** — dar nestructurați ca piloni |
| ThermX | Doar tagline implicit din dosar tehnic | **MISSING** |
| Toate celelalte | **MISSING** | |

**Acțiune:** Folosește formula de positioning statement pentru fiecare client activ:
> Pentru [public] care [nevoie], [brand] este [categoria] care [beneficiu] pentru că [dovadă].

---

### SECȚIUNEA 7: Content Pillars

**Ce evaluăm:** Teme recurente care structurează tot conținutul.

| Client | Verdict | Note |
|--------|---------|------|
| Agro Salso | **REAL** | Calendar editorial are 5 piloni: AFIR DR-14, demo utilaje, prețuri/stoc, testimoniale, educație |
| AutoSiena | **MISSING** | Menționează „6 piloni definiți" dar nu îi listează |
| DentalNet | **MISSING** | Conținutul există dar pilonii nu sunt expliciți |
| Toate celelalte | **MISSING** | |

---

### SECȚIUNEA 8: Competiție

**Ce evaluăm:** Competitori cu analiză, nu doar liste.

| Client | Conținut actual | Verdict |
|--------|----------------|---------|
| DentalNet | 5 competitori cu poziționare + punct slab fiecare | **STRONG** |
| Agro Salso | Direcți (2) + indirecți (3) cu observații și amenințare | **STRONG** |
| AutoSiena | 3 competitori cu distanță fizică și prezență digitală | **REAL** |
| Philatopo | În „Studiu de piață" separat, nu în README | **MISSING din README** |
| Toate celelalte | **MISSING** | |

---

### SECȚIUNEA 9: Sezonalitate

| Client | Verdict | Note |
|--------|---------|------|
| Agro Salso | **REAL** | „Sezon principal feb-apr și sep-oct" — în Note pentru echipă |
| AutoSiena | **REAL** | „Vânzările cresc primăvara și toamna" + Programul Rabla |
| Toate celelalte | **MISSING** | |

---

### SECȚIUNEA 10: Prezență Digitală Actuală

| Client | Verdict | Note |
|--------|---------|------|
| AutoSiena | **STRONG** | Fiecare canal cu followeri, status, probleme (2 conturi fragmentate, 3 site-uri) |
| Agro Salso | **STRONG** | Tabel cu statusul fiecărui canal |
| DentalNet | **REAL** | Link-uri Facebook, Instagram, Google Business |
| Philatopo | **REAL partial** | Menționează „de creat" pentru social |
| Hotel Maxim | **MISSING** | Doar URL-ul site-ului |
| Toate celelalte | **MISSING** | |

---

## REZUMAT: Top 5 Acțiuni Prioritare

### 1. Adaugă Obiective & KPI-uri la TOȚI clienții activi
Zero README-uri conțin obiective de business. Fără obiective, conținutul nu are direcție. La următorul call cu fiecare client, întreabă:
- „Care e cel mai important lucru pe care vrei să-l obții în următoarele 3 luni?"
- „Cum arată succesul pentru tine — mai mulți clienți, mai multă vizibilitate, mai multe vânzări?"

### 2. Înlocuiește listele de adjective cu Voice Chart Do/Don't
Majoritatea brandurilor au „4 adjective, virgulă, punct." Asta nu ajută pe nimeni. Transformă-le în:
- Perechi „Suntem X, dar nu Y"
- Tabel Do/Don't cu propoziții reale
- Spectru 1-5 pe cele 4 axe

### 3. Adâncește Public Țintă cu obiecții, trigger-e, și surse
Chiar și cele mai bune README-uri (DentalNet) lipsesc:
- Ce îi oprește să cumpere?
- Ce eveniment îi pune în mișcare?
- Unde caută informații?

### 4. Structurează Messaging Pillars pentru fiecare brand
DentalNet e singurul cu positioning clar. Philatopo și Agro Salso au elementele dar nestructurate. Restul — nimic.

### 5. Păstrează intact secțiunea „Subiecte Interzise"
E cea mai autentică secțiune din toate README-urile. Informația din „Subiecte interzise" vine direct din cunoașterea clientului și nu poate fi generată de AI. E aurul din dosarele actuale.

---

## BONUS: Ce e AI-generated și trebuie RESCRIS cu date reale

Cele mai evidente fragmente AI din dosarele actuale:

| Client | Fragment | De ce e AI |
|--------|----------|-----------|
| ThermX | „Inovator, Tehnic-Accesibil, Premium, Eco-smart" | „Eco-smart" nu e un cuvânt real, „Premium" e gol |
| ThermX | „Proprietari case (renovări), dezvoltatori imobiliari, constructori" | Exact pattern-ul ChatGPT pentru target audience |
| ThermX | „Tehnologie nanoceramică revoluționară" | Tocmai ce zice în „Subiecte interzise" să nu spunem „revoluționar" |
| Hotel Maxim | „Focus pe confort, locație și ospitalitate locală" | Generic, ar putea fi despre orice hotel |
| Hotel Maxim | „Turiști de city-break, Business travelers, Organizatori evenimente" | Lista standard a oricărui hotel |
| HarmonyGarden | „Visător, Estival, Distractiv, Comunitar" | 4 adjective fără exemplu |
| XpertAudio | „Expert, Tehnic, Puternic, De încredere" | Describe orice firmă de echipamente |
| Contabilitate | „Sobru, Profesionist, Clar, Sigur" | Describe orice firmă de contabilitate |
| FundatiaSinca | „Empatic, Emoționant, Serios, Mobilizator" | Describe orice ONG |
| ProiectCarina | „Drăgălaș, Wonder-filled, Amuzant, Natural, Talentat" | „Talentat" nu e trăsătură de voce |
| MariusSinca | „Autentic, Inspirațional, Lider" | Primele 3 sunt cuvinte de coachin generice |

**Pattern-ul:** Toate listele de 4-5 adjective separate prin virgulă sunt suspect AI. Soluția nu e să le rescrii cu adjective mai bune — e să le înlocuiești cu structura din noul template (spectru, Do/Don't, exemple).

---

*Generat: 05.03.2026*
*Pe baza cercetării: Ogilvy DO Brief, BBDO GET/WHO/TO/BY, NN/g 4 Dimensions, Aaker's 5 Dimensions, DigitalMarketer Customer Avatar, Adele Revella 5 Rings of Buying Insight, Mailchimp Style Guide*
