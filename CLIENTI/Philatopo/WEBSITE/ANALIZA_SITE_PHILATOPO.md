---
client: Philatopo
type: digital-audit
use-for: [website, ads, content-creation, strategy, reports, all]
priority: critical
last-updated: 2026-02-28
summary: "Audit complet philatopo.ro — tech stack (Next.js/Tailwind), stiluri implementate, prețuri live, servicii, SEO, testimoniale, discrepanțe față de brand identity"
---

> **Dosarul Philatopo — Cuprins:**
> [README — Fișă Client](../README.md) | [Identitate de Brand](../BRAND_STRATEGY/BRAND_IDENTITY_PHILATOPO.md) | [Studiu de Piață & Strategie](../RESEARCH/Studiu%20de%20Piata%20Philatopo%20-%20Strategie%20si%20Pozicionare.md) | [Research Subiecte](../RESEARCH/RESEARCH_SUBIECTE_POSTARI.md) | [Calendar Editorial](../CONTENT/CALENDAR_EDITORIAL_FEB_MAR_2026.md) | **[Analiză Site](./ANALIZA_SITE_PHILATOPO.md)**

---

# Analiză Site — philatopo.ro

**URL:** https://philatopo.ro
**Data auditului:** 28.02.2026
**Pregătit de:** Epic Digital Hub

---

## 1. TECH STACK

| Componentă | Tehnologie |
|-----------|------------|
| **Framework** | Next.js (App Router) |
| **UI Framework** | React |
| **CSS** | Tailwind CSS + shadcn/ui components |
| **Fonturi** | Google Fonts — Inter (400, 500, 600), Poppins (700, 800) |
| **Hosting** | Vercel (implicit din _next static assets) |
| **Hartă** | Google Maps embed (secțiunea Contact) |
| **Contact form** | Redirect către WhatsApp |

---

## 2. STRUCTURA SITE

### Navigare principală

| Pagină | URL | Status |
|--------|-----|--------|
| Acasă | `/` | Activ |
| Servicii | `/servicii` | Activ — conținut minimal (doar titluri categorii) |
| Prețuri | `/preturi` | Activ — tabel cu prețuri orientative |
| Despre noi | `#` | Placeholder — nu funcționează |
| Contact | `#contact` | Activ — formular + hartă + date contact |
| Cariere | `#` | Placeholder — nu funcționează |

### Secțiuni Homepage (ordinea apariției)

1. **Hero** — Titlu + subtitlu + CTA "Cere oferta" + imagine echipament topografic
2. **Principii Fundamentale** — Slider cu 5 principii: Precizie, Profesionalism, Promptitudine, Tehnologie, Suport
3. **Servicii** — 3 carduri vizibile: Documentații Cadastrale, Trasări Topografice, Ridicări și Planuri
4. **Prețuri CTA** — Două carduri: "Vezi prețurile" + "Cere o estimare"
5. **Testimoniale** — Marquee cu 6 review-uri (format card cu avatar, nume, citat)
6. **Contact** — Formular (Nume, Email, Mesaj) + Google Maps + date firmă
7. **Footer** — Logo, descriere, link-uri servicii/companie, social (Facebook + WhatsApp)

---

## 3. STILURI IMPLEMENTATE PE SITE

### 3.1 Paletă de culori — Ce folosește efectiv site-ul

| Rol | Culoare | Valoare | Observație |
|-----|---------|---------|------------|
| **Fundal principal** | Alb pur | `#FFFFFF` / `rgb(255,255,255)` | — |
| **Fundal secțiuni** | Gri foarte deschis | `#F5F5F5` / `rgb(245,245,245)` | Secțiunea principii |
| **Fundal footer** | Aproape negru | `#1A1A1A` / `rgb(26,26,26)` | — |
| **Fundal butoane/hero overlay** | Negru pur | `#000000` / `rgb(0,0,0)` | CTA-uri, overlay mobil |
| **Fundal carduri** | Alb | `#FFFFFF` | Border `#E5E5E5` |
| **Text headings** | Gri închis | `#333333` / `rgb(51,51,51)` | — |
| **Text body** | Gri mediu | `#737373` / `rgb(115,115,115)` | — |
| **Text footer** | Alb cald | `#FAFAFA` / `rgb(250,250,250)` | — |
| **Text secundar footer** | Gri | `rgba(250,250,250,0.8)` | — |
| **Text muted** | Gri | `#6B7280` / `rgb(107,114,128)` | — |
| **Borduri** | Gri deschis | `#E5E5E5` / `rgb(229,229,229)` | Carduri, inputs |
| **Separator hero** | Aproape alb | `#FAFAFA` / `rgb(250,250,250)` | Linia sub heading |

### 3.2 Tipografie implementată

| Element | Font | Greutate | Dimensiune | Line-height | Letter-spacing |
|---------|------|----------|-----------|-------------|----------------|
| **H1** | Poppins | 800 (ExtraBold) | 48px | 48px (1.0) | normal |
| **H2** | Poppins | 700 (Bold) | 36px | 40px (1.11) | -0.9px |
| **H3** | Inter | 700 (Bold) | 24px | 36px (1.5) | normal |
| **Body** | Inter | 400 (Regular) | 16px | 24px (1.5) | normal |
| **Caption** | Inter | 400 | 14px | — | normal |
| **Buton CTA** | Inter | 400 | 16px | 24px | normal |
| **Input** | Inter | 400 | 14px | — | normal |

### 3.3 Componente UI

| Component | Stil |
|-----------|------|
| **Buton CTA principal** | `bg-black text-white rounded-full px-7 py-1.5` — pill shape, negru |
| **Carduri servicii** | `rounded-lg border shadow-sm` — 8px border-radius, border `#E5E5E5`, hover: shadow-xl + translate-y |
| **Carduri testimoniale** | `rounded-xl border p-4` — 12px border-radius, hover: bg-accent |
| **Avatare testimoniale** | `rounded-full` — complet rotunde |
| **Inputs formular** | `rounded-md border` — 6px border-radius, border `#E5E5E5`, padding 8px 12px |
| **Footer** | `bg-[#1A1A1A] text-[#FAFAFA] p-8` |

### 3.4 Layout & Spacing

- Container max-width: responsive Tailwind defaults
- Secțiuni: `py-20 sm:py-32` (80px / 128px vertical padding)
- Hero: full viewport height (`h-[100vh]`)
- Grid servicii: 3 coloane pe desktop
- Testimoniale: marquee cu animație continuă (scroll automat)
- Mobile: overlay `bg-black/70` pe hero

---

## 4. SERVICII PE SITE (9 categorii)

| # | Serviciu | Descriere pe site |
|---|----------|-------------------|
| 1 | **Documentații Cadastrale** | Intabulări de imobile și construcții (noi, existente, extinderi), radieri, și înscrieri în cartea funciară |
| 2 | **Dezmembrări și Alipiri** | — (doar titlu, fără descriere pe pagina servicii) |
| 3 | **Trasări Topografice** | Trasări de înaltă precizie pentru construcții, limite de proprietate și proiecte de infrastructură |
| 4 | **Ridicări și Planuri Topografice** | Ridicări topografice detaliate și planuri pentru Autorizații de Construire, PUD, PUZ, PUG |
| 5 | **Consultanță & Suport Tehnic** | — (doar titlu) |
| 6 | **Actualizare Date Funciară** | — (doar titlu) |
| 7 | **Apartamentări** | — (doar titlu) |
| 8 | **Relevee Clădiri** | — (doar titlu) |
| 9 | **Scoatere din Circuitul Agricol** | — (doar titlu) |

**Observație:** Pagina `/servicii` are conținut minimal — doar titluri fără descrieri detaliate. Doar homepage-ul afișează descrieri pentru 3 servicii principale.

---

## 5. PREȚURI PE SITE (pagina /preturi)

| Serviciu | Preț (RON) | Observații |
|----------|-----------|------------|
| Întabulare imobil | 1.200 – 1.500 | — |
| Întabulare construcție | 1.500 – 2.000 | Variază în funcție de complexitate |
| Întabulare imobil + construcție | 1.800 – 2.500 | — |
| Alipire | 500 – 600 / lot | Planuri urbanistice incluse la 3+ parcele |
| Dezmembrare | 500 – 600 / lot | Planuri incluse la 3+ parcele |
| Apartamentare | 500 – 600 / unitate | — |
| Actualizare date / înscriere ANCPI | 1.500 – 1.800 | Depinde de specificul proiectului și suprafață |
| Repoziționare | 1.200 – 1.500 | — |
| Plan topografic | 800 – 1.000 | Suprafață, tip teren, densitate construcții/vegetație |
| Pichetare limite proprietate | 50 – 70 / punct | Preț negociabil separat pentru perimetru complet |
| Planuri curbe de nivel | 800 – 1.000 | Suprafață, teren, vegetație, nivel detaliere |
| Relevee clădiri | 500 – 800 | Preț aferent proiectului de bază |

**Disclaimer site:** "Prețurile afișate sunt orientative și pot varia în funcție de complexitatea proiectului. Prețurile nu includ taxele percepute de ANCPI."

**Notă vs. Studiu de Piață:** Prețurile de pe site sunt mai mari decât cele din studiul de piață (studiul menționează 920-1.120 RON pentru apartamente, site-ul arată 1.200-1.500 RON pentru întabulare imobil).

---

## 6. TESTIMONIALE PE SITE

| Nume | Review |
|------|--------|
| Popescu Andrei | Profesionalism și promptitudine! Echipa a livrat documentația cadastrală mai repede decât mă așteptam și a fost mereu disponibilă pentru întrebări. |
| Ionescu Maria | Servicii de topografie de înaltă calitate. Măsurătorile au fost extrem de precise, ceea ce a fost esențial pentru proiectul nostru de construcție. |
| Georgescu Vasile | Am apelat la ei pentru o dezmembrare și procesul a fost mult mai simplu decât anticipam. Recomand cu încredere! |
| Stan Gabriela | Consultanța oferită a fost de neprețuit. Ne-au ghidat prin tot procesul birocratic pentru autorizația de construire. |
| Dumitru Cristian | Ridicarea topografică a fost realizată cu echipamente moderne și rezultatele au fost impecabile. O echipă de profesioniști. |
| Radu Elena | Apartamentarea a fost gestionată eficient și fără bătăi de cap. Comunicare excelentă și servicii de calitate. |

**Observație:** Avatarele folosesc imagini placeholder de la `picsum.photos` — nu sunt fotografii reale ale clienților.

---

## 7. SEO & META

| Tag | Valoare |
|-----|---------|
| **Title** | Philatopo - Topografie Oradea |
| **Meta description** | Servicii de topografie si cadastru in Oradea. Philatopo ofera masuratori de precizie, intabulari, dezmembrari, si consultanta. Cauti un topograf ieftin in Oradea? Cere o oferta acum! |
| **Meta keywords** | topografie oradea, cadastru oradea, topograf oradea, topograf ieftin oradea, intabulare oradea, dezmembrari terenuri, alipire terenuri, planuri topografice, ridicari topografice, trasari constructii |
| **Viewport** | width=device-width, initial-scale=1 |

**Probleme SEO:**
- Meta description fără diacritice (lipsă ă, ș, ț)
- Keyword "topograf ieftin" — contradicție cu poziționarea brandului ("nu concurăm pe preț")
- Pagina `/servicii` are conținut prea subțire (thin content) — doar titluri fără descrieri
- Paginile Despre Noi și Cariere sunt placeholder-uri (`#`)

---

## 8. DISCREPANȚE MAJORE: BRAND IDENTITY vs. SITE IMPLEMENTAT

### 8.1 Culori — Discrepanță critică

| Element | Brand Identity spune | Site-ul folosește | Gravitate |
|---------|---------------------|-------------------|-----------|
| **Culoare primară dark** | Slate Profund `#1B2A3D` | Negru pur `#000000` | CRITICA |
| **Accent de brand** | Portocaliu Topo `#E8792B` | Nu există pe site | CRITICA |
| **Accent secundar** | Nisip Cald `#C49A6C` | Nu există pe site | CRITICA |
| **Text headings** | Slate `#1B2A3D` | Gri `#333333` | Medie |
| **Text body** | Nu specificat exact | Gri `#737373` | — |
| **Fundal light** | Alb Cartografic `#F8F9FA` | Alb pur `#FFFFFF` | Mică |
| **Butoane CTA** | Portocaliu Topo `#E8792B` cu text alb | Negru `#000` cu text alb | CRITICA |
| **Footer** | Slate Profund `#1B2A3D` | Negru `#1A1A1A` | Medie |

**Concluzie:** Site-ul este complet monocrom (negru-alb-gri). Niciunul din accentele definite în brand identity (portocaliu, nisip) nu apare pe site. Identitatea vizuală a brandului nu este implementată.

### 8.2 Tipografie — Parțial conformă

| Element | Brand Identity | Site | Discrepanță |
|---------|---------------|------|-------------|
| H1 weight | Bold 700 | ExtraBold 800 | Mică |
| H3 font | Poppins | Inter | Medie |
| CTA font | Poppins SemiBold 600 | Inter Regular 400 | Medie |
| Font cifre/prețuri | Space Grotesk | Nu este încărcat pe site | Mare |

### 8.3 Conținut — Lipsuri

| Element | Status |
|---------|--------|
| Tagline "Precizie la fiecare punct" | NU apare pe site |
| Descriptor "TOPOGRAFIE · ORADEA" sub logo | NU vizibil |
| Pagina Despre Noi | Placeholder — nu funcționează |
| Descrieri servicii detaliate | Lipsesc pe pagina /servicii |
| Separare onorariu vs. taxe OCPI | NU (doar disclaimer generic) |
| Blog / conținut educativ | NU există secțiune blog |
| Instagram link | NU (doar Facebook + WhatsApp) |
| LinkedIn link | NU |

---

## 9. CONTACT & SOCIAL

| Canal | Detalii |
|-------|---------|
| **Telefon** | +40733777762 |
| **Email** | philatopo@gmail.com |
| **Adresă** | str. Vlădeasa, nr. 76, bl. D6, Oradea |
| **Facebook** | facebook.com/PhilaTopoSRL |
| **WhatsApp** | wa.me/40733777762 |
| **Instagram** | Nu există pe site |
| **LinkedIn** | Nu există pe site |

---

## 10. REZUMAT & RECOMANDĂRI PRIORITARE

### Ce funcționează bine
- Tech stack modern (Next.js + Tailwind) — ușor de actualizat
- Prețuri publice pe site — aliniat cu valorile brandului
- Formular contact simplu cu redirect WhatsApp
- Responsive design functional
- Testimoniale vizibile pe homepage

### Ce necesită atenție urgentă

1. **Implementare paletă de brand** — site-ul ignoră complet culorile definite (portocaliu, slate, nisip)
2. **Adăugare Space Grotesk** — fontul pentru prețuri și cifre lipsește
3. **Completare pagina Servicii** — descrieri detaliate pentru toate cele 9 servicii
4. **Corectare meta description** — adăugare diacritice, eliminare "topograf ieftin"
5. **Activare pagini placeholder** — Despre Noi, Cariere
6. **Înlocuire avatare testimoniale** — imagini reale sau eliminare avatare
7. **Adăugare tagline** — "Precizie la fiecare punct." nu apare nicăieri pe site
8. **Adăugare link-uri Instagram/LinkedIn** — când conturile vor fi active
9. **Separare vizuală onorariu vs. taxe OCPI** pe pagina de prețuri
10. **Creare secțiune blog** — esențial pentru strategia SEO și conținutul educativ

---

*Audit realizat de Epic Digital Hub. Toate observațiile sunt bazate pe accesarea site-ului la data 28.02.2026.*
