document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const body = document.body;
  const nav = document.querySelector('.lab-nav');
  const progress = document.querySelector('.lab-progress');
  const sections = Array.from(document.querySelectorAll('.lab-section'));
  const navLinks = Array.from(document.querySelectorAll('.lab-links a'));
  const mobileLinks = Array.from(document.querySelectorAll('.lab-mobile a'));
  const railItems = Array.from(document.querySelectorAll('.lab-rail__item'));
  const indicatorLabel = document.querySelector('.lab-indicator__label');

  const sectionNames = {
    a01: 'Hero',
    a02: 'Logică',
    a03: 'nZEB',
    a04: 'Versus',
    a05: 'Cifre',
    a06: 'Aplicații',
    acalc: 'Calcul',
    afaq: 'FAQ',
    a20: 'Contact'
  };

  const navMap = {
    a01: '#a01',
    a02: '#a02',
    a03: '#a03',
    a04: '#a04',
    a05: '#a05',
    a06: '#a05',
    acalc: '#acalc',
    afaq: '#afaq',
    a20: '#a20'
  };

  const scrollToSection = (hash) => {
    if (!hash || !hash.startsWith('#')) {
      return;
    }

    const target = document.querySelector(hash);
    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  const navToggle = document.querySelector('.lab-nav__toggle');
  const mobileNav = document.querySelector('.lab-mobile');

  const closeMobile = () => {
    if (!navToggle || !mobileNav) {
      return;
    }

    navToggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
  };

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      mobileNav.classList.toggle('is-open');
      mobileNav.setAttribute('aria-hidden', String(isOpen));
      body.style.overflow = isOpen ? '' : 'hidden';
    });
  }

  [...navLinks, ...mobileLinks].forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) {
        return;
      }

      event.preventDefault();
      closeMobile();
      scrollToSection(href);
    });
  });

  railItems.forEach((item) => {
    item.addEventListener('click', () => {
      scrollToSection(`#${item.dataset.target}`);
    });
  });

  if (hasFinePointer && !prefersReduced) {
    body.classList.add('has-pointer');
    window.addEventListener('pointermove', (event) => {
      body.style.setProperty('--lab-cursor-x', `${event.clientX}px`);
      body.style.setProperty('--lab-cursor-y', `${event.clientY}px`);
    }, { passive: true });
  }

  const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && !prefersReduced) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.14,
      rootMargin: '0px 0px -40px 0px'
    });

    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  const animateCounter = (node) => {
    if (node.dataset.done === 'true') {
      return;
    }

    node.dataset.done = 'true';

    const target = Number(node.dataset.target || 0);
    const suffix = node.dataset.suffix || '';

    if (prefersReduced) {
      node.textContent = `${target}${suffix}`;
      return;
    }

    const startedAt = performance.now();
    const duration = 1700;

    const frame = (now) => {
      const progressRatio = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progressRatio, 3);
      const value = Math.round(target * eased);

      node.textContent = `${value}${suffix}`;

      if (progressRatio < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  };

  const counterNodes = Array.from(document.querySelectorAll('[data-target]'));
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    counterNodes.forEach((node) => counterObserver.observe(node));
  } else {
    counterNodes.forEach((node) => animateCounter(node));
  }

  const barItems = Array.from(document.querySelectorAll('.lab-bars__item'));
  const fillBars = () => {
    barItems.forEach((item, index) => {
      const fill = item.querySelector('.lab-bars__fill');
      const width = item.dataset.bar;

      if (!fill || !width) {
        return;
      }

      if (prefersReduced) {
        fill.style.width = `${width}%`;
        return;
      }

      setTimeout(() => {
        fill.style.width = `${width}%`;
      }, index * 120);
    });
  };

  const barsSection = document.getElementById('a05');
  if (barsSection && 'IntersectionObserver' in window && !prefersReduced) {
    const barsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        fillBars();
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.22 });

    barsObserver.observe(barsSection);
  } else {
    fillBars();
  }

  const bridgeButtons = Array.from(document.querySelectorAll('.lab-bridge__item'));
  const bridgeDots = Array.from(document.querySelectorAll('.lab-bridge__dot'));
  const bridgeCopy = document.getElementById('bridgeCopy');

  const bridgeTexts = [
    'La coamă, două planuri se întâlnesc într-o zonă unde plăcile rigide lasă ușor goluri. Un strat fluid urmărește geometria și reduce discontinuitatea.',
    'În colțurile de acoperiș apar rapid zone de ajustare și tăiere. Aici, continuitatea este mai greu de păstrat cu sisteme rigide.',
    'Conturul tâmplăriei rămâne una dintre cele mai sensibile zone de pierdere. Un strat continuu poate închide mai bine racordul.',
    'La intersecția perete–planșeu, detaliul structural rupe frecvent continuitatea termoizolației clasice.',
    'Zona de fundație combină transfer termic și expunere la umiditate, ceea ce cere un sistem stabil pe suport mineral.',
    'Balconul funcționează ca zonă de transfer direct către exterior. Detaliul contează mai mult decât suprafața totală.'
  ];

  const setBridge = (index) => {
    bridgeButtons.forEach((button, buttonIndex) => {
      button.classList.toggle('active', buttonIndex === index);
    });

    bridgeDots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === index);
    });

    if (bridgeCopy) {
      bridgeCopy.textContent = bridgeTexts[index] || bridgeTexts[0];
    }
  };

  bridgeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setBridge(Number(button.dataset.hotspot || 0));
    });
  });
  setBridge(0);

  const compareRange = document.getElementById('compareRange');
  const compareClassic = document.getElementById('compareClassic');
  const compareThermx = document.getElementById('compareThermx');
  const compareLevel = document.getElementById('compareLevel');
  const compareClassicText = document.getElementById('compareClassicText');
  const compareThermxText = document.getElementById('compareThermxText');
  const compareDelta = document.getElementById('compareDelta');
  const compareNarrative = document.getElementById('compareNarrative');

  const compareStates = {
    1: {
      level: 'Redus',
      classic: 72,
      thermx: 68,
      classicText: 'În zone simple, sistemul clasic rămâne previzibil, dar cere volum și stratificare mai mare.',
      thermxText: 'În detalii simple, thermX aduce avantaj mai ales prin masă redusă și aplicare rapidă.',
      delta: '-4 puncte',
      narrative: 'În scenarii simple, diferența nu vine dintr-un salt spectaculos, ci din execuție mai curată și încărcare redusă pe sistem.'
    },
    2: {
      level: 'Mediu',
      classic: 52,
      thermx: 78,
      classicText: 'Detaliul începe să consume timp și ajustări de montaj.',
      thermxText: 'Avantajul crește prin capacitatea de a acoperi continuu contururile.',
      delta: '+26 puncte',
      narrative: 'La complexitate medie, diferența vine din controlul continuității în zonele în care montajul clasic începe să piardă precizie.'
    },
    3: {
      level: 'Ridicat',
      classic: 28,
      thermx: 92,
      classicText: 'La detalii dificile, riscul de discontinuitate și compromis de execuție crește vizibil.',
      thermxText: 'În geometrii complexe, membrana fluidă devine semnificativ mai eficientă în controlul continuității.',
      delta: '+64 puncte',
      narrative: 'Când crește complexitatea de detaliu, avantajul se mută clar către un strat care urmărește suprafața fără tăieri și fără rosturi.'
    }
  };

  const updateCompare = () => {
    if (!compareRange) {
      return;
    }

    const state = compareStates[Number(compareRange.value)] || compareStates[2];

    if (compareLevel) {
      compareLevel.textContent = state.level;
    }
    if (compareClassic) {
      compareClassic.style.width = `${state.classic}%`;
    }
    if (compareThermx) {
      compareThermx.style.width = `${state.thermx}%`;
    }
    if (compareClassicText) {
      compareClassicText.textContent = state.classicText;
    }
    if (compareThermxText) {
      compareThermxText.textContent = state.thermxText;
    }
    if (compareDelta) {
      compareDelta.textContent = state.delta;
    }
    if (compareNarrative) {
      compareNarrative.textContent = state.narrative;
    }
  };

  if (compareRange) {
    compareRange.addEventListener('input', updateCompare);
    updateCompare();
  }

  document.querySelectorAll('[data-tabs]').forEach((tabsRoot) => {
    const buttons = Array.from(tabsRoot.querySelectorAll('.lab-tabs__btn'));
    const panels = Array.from(tabsRoot.querySelectorAll('.lab-tabs__panel'));

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.tab;

        buttons.forEach((item) => item.classList.remove('active'));
        panels.forEach((panel) => panel.classList.remove('active'));

        button.classList.add('active');

        const panel = document.getElementById(targetId || '');
        if (panel) {
          panel.classList.add('active');
        }
      });
    });
  });

  const initAccordion = () => {
    const items = Array.from(document.querySelectorAll('[data-acc-item]'));

    items.forEach((item) => {
      if (item.dataset.bound === 'true') {
        return;
      }

      item.dataset.bound = 'true';

      const trigger = item.querySelector('[data-acc-trigger]');
      const content = item.querySelector('[data-acc-content]');

      if (!trigger || !content) {
        return;
      }

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        const group = Array.from(item.parentElement?.querySelectorAll('[data-acc-item]') || []);

        group.forEach((other) => {
          const otherTrigger = other.querySelector('[data-acc-trigger]');
          const otherContent = other.querySelector('[data-acc-content]');

          other.classList.remove('is-open');
          if (otherTrigger) {
            otherTrigger.setAttribute('aria-expanded', 'false');
          }
          if (otherContent) {
            otherContent.style.maxHeight = '0px';
          }
        });

        if (isOpen) {
          return;
        }

        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = `${content.scrollHeight}px`;

        if (window.lucide) {
          lucide.createIcons();
        }
      });
    });
  };

  initAccordion();

  const calcBuilding = document.getElementById('labCalcBuilding');
  const calcSurface = document.getElementById('labCalcSurface');
  const calcRange = document.getElementById('labCalcRange');
  const calcSubstrate = document.getElementById('labCalcSubstrate');
  const calcClimate = document.getElementById('labCalcClimate');
  const calcThickness = Array.from(document.querySelectorAll('input[name="lab-thickness"]'));

  const resultThermal = document.getElementById('labCalcThermal');
  const resultSavings = document.getElementById('labCalcSavings');
  const resultCost = document.getElementById('labCalcCost');
  const resultPayback = document.getElementById('labCalcPayback');
  const resultWeight = document.getElementById('labCalcWeight');
  const resultTime = document.getElementById('labCalcTime');
  const resultSignal = document.getElementById('labCalcSignal');
  const resultSignalFill = document.getElementById('labCalcSignalFill');
  const resultSummary = document.getElementById('labCalcSummary');

  const buildingMult = {
    casa: { cost: 1, savings: 1 },
    bloc: { cost: 0.85, savings: 0.9 },
    hala: { cost: 0.75, savings: 0.8 },
    publica: { cost: 0.9, savings: 0.95 }
  };

  const climateMult = { I: 0.85, II: 1, III: 1.15, IV: 1.35 };
  const thicknessMult = {
    '0.5': { thermal: 0.7, cost: 0.6, weight: 0.5 },
    '1': { thermal: 1, cost: 1, weight: 1 },
    '2': { thermal: 1.3, cost: 1.8, weight: 2 }
  };
  const substrateMult = {
    beton: 1,
    metal: 0.9,
    lemn: 1.1,
    caramida: 1.05,
    tencuiala: 1.15
  };

  const formatRON = (value) =>
    value.toLocaleString('ro-RO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' RON';

  const updateCalculator = () => {
    if (!calcBuilding || !calcSurface || !calcSubstrate || !calcClimate) {
      return;
    }

    const building = calcBuilding.value || 'casa';
    const surface = Math.max(10, Math.min(5000, Number(calcSurface.value) || 150));
    const substrate = calcSubstrate.value || 'beton';
    const climate = calcClimate.value || 'II';
    const thickness = (calcThickness.find((radio) => radio.checked) || {}).value || '1';

    calcSurface.value = String(surface);
    if (calcRange) {
      calcRange.value = String(surface);
    }

    const bm = buildingMult[building] || buildingMult.casa;
    const cm = climateMult[climate] || 1;
    const tm = thicknessMult[thickness] || thicknessMult['1'];
    const sm = substrateMult[substrate] || 1;

    const baseThermalReduction = 40;
    const baseCostPerM2 = 200; // RON (~40 EUR)
    const baseSavingsPerM2 = 12;
    const baseWeightPerM2 = 0.4;
    const speedPerDay = 50;

    const thermalReduction = Math.min(baseThermalReduction * tm.thermal, 55);
    const annualSavings = surface * baseSavingsPerM2 * cm * tm.thermal * bm.savings;
    const applicationCost = surface * baseCostPerM2 * tm.cost * sm * bm.cost;
    const payback = annualSavings > 0 ? applicationCost / annualSavings : 0;
    const weightAdded = surface * baseWeightPerM2 * tm.weight;
    const classicWeight = surface * 2.5;
    const days = Math.max(1, Math.ceil(surface / speedPerDay));

    let signal = 'Echilibru optim';
    let signalWidth = 64;
    let summary = 'Configurație bună pentru o estimare inițială de cost și economie.';

    if (thermalReduction >= 40 && payback <= 4.5) {
      signal = 'Randament ridicat';
      signalWidth = 86;
      summary = 'Scenariul indică un profil bun între reducerea pierderilor și intervalul de amortizare.';
    } else if (payback > 7 || surface > 1500 || thickness === '2') {
      signal = 'Necesită analiză';
      signalWidth = 42;
      summary = 'Scenariul merită verificat în detaliu înainte de o decizie de buget sau de strat.';
    }

    if (resultThermal) {
      resultThermal.textContent = `${Math.round(thermalReduction)}%`;
    }
    if (resultSavings) {
      resultSavings.textContent = formatRON(Math.round(annualSavings));
    }
    if (resultCost) {
      resultCost.textContent = formatRON(Math.round(applicationCost));
    }
    if (resultPayback) {
      resultPayback.textContent = `${payback.toFixed(1).replace('.', ',')} ani`;
    }
    if (resultWeight) {
      resultWeight.textContent = `${Math.round(weightAdded)} kg (vs clasic: ${Math.round(classicWeight)} kg)`;
    }
    if (resultTime) {
      resultTime.textContent = `${days} ${days === 1 ? 'zi' : 'zile'}`;
    }
    if (resultSignal) {
      resultSignal.textContent = signal;
    }
    if (resultSignalFill) {
      resultSignalFill.style.width = `${signalWidth}%`;
    }
    if (resultSummary) {
      resultSummary.textContent = summary;
    }
  };

  if (calcRange && calcSurface) {
    calcRange.addEventListener('input', () => {
      calcSurface.value = calcRange.value;
      updateCalculator();
    });

    calcSurface.addEventListener('input', updateCalculator);
  }

  [calcBuilding, calcSubstrate, calcClimate].forEach((input) => {
    if (input) {
      input.addEventListener('change', updateCalculator);
    }
  });

  calcThickness.forEach((radio) => {
    radio.addEventListener('change', updateCalculator);
  });

  updateCalculator();

  const form = document.getElementById('labForm');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = document.getElementById('labName');
      const email = document.getElementById('labEmail');

      if (!name || !email) {
        return;
      }

      form.querySelectorAll('.lab-form__field').forEach((field) => {
        field.classList.remove('is-error');
      });

      let hasError = false;

      if (!name.value.trim()) {
        name.closest('.lab-form__field')?.classList.add('is-error');
        hasError = true;
      }

      if (!email.value.trim() || !email.value.includes('@')) {
        email.closest('.lab-form__field')?.classList.add('is-error');
        hasError = true;
      }

      if (hasError) {
        return;
      }

      const phone = document.getElementById('labPhone')?.value.trim() || '';
      const project = document.getElementById('labProject')?.value || '';
      const message = document.getElementById('labMessage')?.value.trim() || '';

      const subject = encodeURIComponent('thermX — Solicitare calcul termic');
      let bodyText = `Nume: ${name.value.trim()}\nEmail: ${email.value.trim()}`;

      if (phone) {
        bodyText += `\nTelefon: ${phone}`;
      }
      if (project) {
        bodyText += `\nTip proiect: ${project}`;
      }
      if (message) {
        bodyText += `\n\nMesaj:\n${message}`;
      }

      form.classList.add('is-success');
      window.location.href = `mailto:contact@nanorevolution.ro?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    });
  }

  const updateScrollUi = () => {
    const scrollTop = window.scrollY;
    const fullHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = fullHeight > 0 ? scrollTop / fullHeight : 0;

    if (progress) {
      progress.style.width = `${ratio * 100}%`;
    }

    if (nav) {
      nav.classList.toggle('is-scrolled', scrollTop > 30);
    }

    let activeId = sections[0]?.id || 'a01';
    const pivot = scrollTop + (window.innerHeight * 0.35);

    sections.forEach((section) => {
      if (section.offsetTop <= pivot) {
        activeId = section.id;
      }
    });

    const activeHash = navMap[activeId] || '#a01';

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === activeHash);
    });

    railItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.target === activeId);
    });

    if (indicatorLabel) {
      indicatorLabel.textContent = sectionNames[activeId] || 'Hero';
    }
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(() => {
      updateScrollUi();
      ticking = false;
    });
  }, { passive: true });

  updateScrollUi();
});
