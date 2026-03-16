// --- DESIGN TOKENS ---
#let accent = rgb("#1a1a2e")
#let accent-light = rgb("#3a3a5e")
#let warm = rgb("#c4956a")
#let subtle = luma(130)
#let bg-light = rgb("#f7f5f2")

#set page(
  paper: "a4",
  margin: (top: 1.8cm, bottom: 1.6cm, left: 2cm, right: 2cm),
  numbering: none,
)

#set text(
  font: "Helvetica Neue",
  size: 9pt,
  lang: "ro",
  fill: accent,
)

#set par(
  justify: true,
  leading: 0.58em,
)

// --- HELPERS ---

#let section-header(number, title) = {
  v(0.45cm)
  block(width: 100%)[
    #box(
      width: 1.8cm,
      height: 1.8cm,
      fill: accent,
      radius: 2pt,
      inset: 0pt,
    )[
      #align(center + horizon)[
        #text(font: "Helvetica Neue", size: 18pt, weight: "bold", fill: white)[#number]
      ]
    ]
    #h(0.4cm)
    #box(baseline: -0.55cm)[
      #text(size: 13pt, weight: "bold", tracking: 0.5pt, fill: accent)[#upper(title)]
    ]
  ]
  v(0.15cm)
}

#let framing(body) = {
  text(size: 8.5pt, fill: subtle, style: "italic")[#body]
  v(0.15cm)
}

#let q(body) = {
  v(0.12cm)
  block(
    width: 100%,
    inset: (left: 0.35cm, y: 0.12cm),
    stroke: (left: 1.5pt + warm),
  )[
    #text(size: 9pt, weight: "medium", fill: accent)[#body]
  ]
  v(0.12cm)
}

// ============================================
// PAGE 1
// ============================================

// --- HEADER BLOCK ---
#block(
  width: 100%,
  fill: accent,
  radius: 3pt,
  inset: (x: 1.2cm, y: 1cm),
)[
  #set text(fill: white)
  #text(size: 22pt, weight: "bold", tracking: 1pt)[EXERCIȚIU DE\
  REFLECȚIE PERSONALĂ]
  #v(0.4cm)
  #line(length: 3cm, stroke: 1pt + warm)
  #v(0.3cm)
  #text(size: 9.5pt, fill: rgb("#b0b0c8"))[Pentru: ] #text(size: 9.5pt, weight: "bold")[George Marius Șinca]
  #h(1.5cm)
  #text(size: 9.5pt, fill: rgb("#b0b0c8"))[De la: ] #text(size: 9.5pt, weight: "bold")[Roland]
]

#v(0.4cm)

// --- INTRO ---
#block(
  width: 100%,
  inset: (x: 0.3cm, y: 0.3cm),
  fill: bg-light,
  radius: 2pt,
)[
  #text(size: 9pt, fill: accent)[
    *Marius,* asta nu e un chestionar. Înainte să putem spune lumii cine ești, trebuie să-ți spui ție. Nu CV-ul, nu titlurile --- răspunsul adevărat, cel pe care poate nu l-ai formulat niciodată cu voce tare. Ai construit ROUA, Armonia, cursurile, munca din poliție, fundația. Ce le leagă pe toate? Asta căutăm aici. Scrie cum îți vine. Nu există răspunsuri greșite --- doar oneste.
  ]
]

// --- SECTIONS 1-3 ---

#section-header("01", "Originea")
#framing[Fiecare om are un moment care l-a pus pe drumul pe care merge. Nu neapărat dramatic. Poate o conversație, o absență, ceva ce ai văzut și n-ai putut uita.]

#q[Când te uiți înapoi la tot ce ai construit, există un moment din copilărie sau tinerețe care a plantat sămânța? Povestește-l ca la o cafea, nu la un interviu.]

#q[Ce lipsea în lumea ta de atunci? Ce ai căutat și n-ai găsit --- și ai ajuns să construiești singur mai târziu?]

#q[A fost cineva care te-a tratat într-un fel care te-a marcat? Poate tocmai lipsa acelui om te-a motivat.]

#section-header("02", "Firul roșu")
#framing[Polițist, CISO, profesor, fondator de ONG, creator de programe educaționale. Lumea vede funcții diferite. Eu cred că faci același lucru peste tot --- doar în forme diferite.]

#q[Dacă ar trebui să explici unui copil de 10 ani ce faci tu de fapt --- nu unde lucrezi, ci CE FACI --- cum ai spune?]

#q[La ROUA ai putut să le dai refugiaților mâncare și să pleci acasă. Dar i-ai învățat limba, le-ai găsit locuri de muncă, le-ai dat suport psihologic. De ce? Ce te deranjează la ideea de a ajuta pe cineva doar pe jumătate?]

#q[Armonia: „activitate socială prin muzică". Ce se întâmplă concret cu un copil care intră acolo și iese un an mai târziu?]

#q[Gen Z Security Dilemma: ai fi putut face o campanie care sperie. N-ai făcut-o. Ce ai ales și de ce?]

#q[Ca CISO construiești sisteme de securitate. La universitate, capacitate de gândire critică. La fundație, autonomie. Aceeași persoană sau trei diferite?]

#section-header("03", "Convingeri")
#framing[Puțini oameni au convingeri pentru care ar lupta. Nu cele de pe perete --- ci cele care te fac să te cerți cu oameni și să te bagi unde nu te cheamă nimeni.]

#q[Ce te scoate din minți? Nu ce te deranjează ușor --- ce te face să nu poți tăcea?]

#q[Ai funcție, titlu de doctor, ONG respectat. Ai fi putut să stai confortabil. De ce nu stai?]

// ============================================
// PAGE 2
// ============================================

#q[Care e cea mai importantă minciună pe care o crede societatea românească astăzi?]

#q[Dacă ai putea să înveți fiecare copil din România un singur lucru --- nu o materie, ci o convingere --- care ar fi?]

#section-header("04", "Ce vezi tu și alții nu")
#framing[Securitate națională, cercetare academică, comunități vulnerabile, educație. Puțini oameni stau la intersecția asta. Asta înseamnă că vezi lucruri pe care alții nu le pot vedea.]

#q[Ce știi din munca ta din MAI care ar schimba felul în care românii înțeleg securitatea, dacă ar ști?]

#q[Ce vezi la studenții de la Babeș-Bolyai pe care media nu-l spune? Ce e diferit la generația asta?]

#q[Din munca cu refugiații --- ce ai învățat despre oameni care te-a surprins? Ceva ce n-ai fi crezut înainte.]

#q[Cybersecurity e văzut ca subiect tehnic. Tu ai doctorat în Relații Internaționale. Ce vede cineva cu perspectiva ta pe care un inginer pur nu o vede?]

#section-header("05", "Viziunea")
#framing[Nu te întreb ce vrei să faci. Te întreb ce vezi --- ca cineva care privește din interiorul sistemului.]

#q[Cum arată România peste 10 ani dacă nu se schimbă nimic? Concret, nu abstract.]

#q[Și cum arată dacă se schimbă ce trebuie? Ce e diferit?]

#q[Ai încercat să construiești ceva --- în MAI, la universitate, prin fundație --- și ai fost oprit? De cine și de ce?]

#q[Dacă ai avea putere reală de decizie mâine, care e primul lucru pe care l-ai face? Nu cel mai mare --- cel dintâi.]

#section-header("06", "Omul")
#framing[Până acum am vorbit despre ce faci și ce crezi. Acum: cine ești când nu performezi pentru nimeni.]

#q[Ce te ține treaz noaptea? Nu profesional --- personal. Ce gând nu pleacă?]

#q[Există momente în care te îndoiești de tine? Când tot ce ai construit ți se pare insuficient?]

// ============================================
// PAGE 3
// ============================================

#q[De ce ți-e frică, sincer? Nu de pericole abstracte --- de ce ți-e frică ție, ca om?]

#q[Cum arată o zi bună pentru tine? Nu una productivă --- una bună.]

#section-header("07", "Prin ochii altora")
#framing[Cum te vezi tu și cum te văd alții sunt rareori același lucru. Diferența e exact spațiul în care construim.]

#q[Ce cred oamenii despre tine care nu e adevărat? Ce imagine au care nu te reprezintă?]

#q[Dacă l-ai întreba pe cel mai bun prieten al tău „Cine e Marius, de fapt?", ce ar spune? Și ar avea dreptate?]

#q[Există o latură a ta pe care lumea n-o vede pentru că nu o arăți? De ce o ascunzi?]

#q[Cum te descrie lumea de obicei? Și cum ai vrea să te descrie?]

#section-header("08", "O singură propoziție")

#text(size: 9pt)[Ultimul exercițiu. Cel mai greu. Uită-te la tot ce ai gândit citind întrebările de mai sus --- la origini, la fir, la convingeri, la viziune, la cine ești fără mască.]

#v(0.1cm)

#block(
  width: 100%,
  inset: (x: 0.5cm, y: 0.35cm),
  fill: accent,
  radius: 2pt,
)[
  #text(size: 10pt, weight: "bold", fill: white)[Scrie o singură propoziție care spune cine ești. Nu ce faci. Cine ești.]
]

#v(0.05cm)
#text(size: 8.5pt, fill: subtle)[Nu trebuie să fie perfectă. Poate să fie stângace, ciudată. Dar trebuie să fie adevărată. Dacă ai răspunde altfel mâine, scrie și varianta aia.]

// --- CLOSING QUOTE ---

#v(1fr)

#line(length: 100%, stroke: 0.3pt + luma(210))

#v(0.25cm)

#align(center)[
  #block(width: 85%)[
    #set par(justify: false, leading: 0.65em)
    #align(center)[
      #text(size: 10pt, style: "italic", fill: accent-light)[
        „Privește înăuntrul tău. Acolo e izvorul binelui ---
        un izvor care nu se usucă niciodată, dacă nu încetezi să sapi."
      ]
      #v(0.15cm)
      #text(size: 8.5pt, fill: subtle)[--- Marcus Aurelius, _Meditații_]
    ]
  ]
]

#v(0.15cm)
