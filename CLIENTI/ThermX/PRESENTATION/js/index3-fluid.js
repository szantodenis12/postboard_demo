document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const body = document.body;
  const nav = document.querySelector('.nav');
  const sections = Array.from(document.querySelectorAll('.section'));
  const navLinks = Array.from(document.querySelectorAll('.nav__links a'));
  const mobileNavLinks = Array.from(document.querySelectorAll('.nav__mobile a'));
  const dots = Array.from(document.querySelectorAll('.progress-dot'));
  const progressBar = document.querySelector('.scroll-progress');
  const progressLineFill = document.querySelector('.progress-line__fill');
  const indicatorLabel = document.querySelector('.section-indicator__label');

  const labelMap = Object.fromEntries(
    dots.map((dot) => [dot.dataset.section, dot.dataset.label || dot.dataset.section])
  );

  const navTargetMap = {
    s01: '#s01',
    s02: '#s02',
    s03: '#s03',
    s04: '#s04',
    s05: '#s05',
    s06: '#s06',
    scalc: '#scalc',
    sfaq: '#sfaq',
    s20: '#s20',
    s21: '#s20'
  };

  const scrollToHash = (hash) => {
    if (!hash || !hash.startsWith('#')) {
      return;
    }

    const target = document.querySelector(hash);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  };

  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');

  const closeMobileNav = () => {
    if (!hamburger || !mobileNav) {
      return;
    }

    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
  };

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      mobileNav.classList.toggle('open');
      mobileNav.setAttribute('aria-hidden', String(isOpen));
      body.style.overflow = isOpen ? '' : 'hidden';
    });
  }

  [...navLinks, ...mobileNavLinks].forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) {
        return;
      }

      event.preventDefault();
      closeMobileNav();
      scrollToHash(href);
    });
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      scrollToHash(`#${dot.dataset.section}`);
    });
  });

  const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));

  if (!prefersReduced && 'IntersectionObserver' in window) {
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
      rootMargin: '0px 0px -48px 0px'
    });

    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  const typewriter = document.querySelector('[data-typewriter]');
  if (typewriter && !prefersReduced) {
    const originalText = typewriter.textContent || '';
    typewriter.textContent = '';

    const typeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const startedAt = performance.now();
        const stepDuration = 70;

        const draw = (now) => {
          const nextLength = Math.min(
            originalText.length,
            Math.floor((now - startedAt) / stepDuration)
          );

          typewriter.textContent = originalText.slice(0, nextLength);

          if (nextLength < originalText.length) {
            requestAnimationFrame(draw);
            return;
          }

          typewriter.classList.add('done');
        };

        requestAnimationFrame(draw);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    const hostSection = typewriter.closest('.section');
    if (hostSection) {
      typeObserver.observe(hostSection);
    }
  }

  const animateCounter = (element) => {
    if (element.dataset.counted === 'true') {
      return;
    }

    element.dataset.counted = 'true';

    const target = Number(element.dataset.target || 0);
    const suffix = element.dataset.suffix || '';

    if (prefersReduced) {
      element.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 1800;
    const startedAt = performance.now();

    const frame = (now) => {
      const elapsed = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const value = Math.round(target * eased);

      element.textContent = `${value}${suffix}`;

      if (elapsed < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  };

  const counterTargets = Array.from(document.querySelectorAll('[data-target]'));
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

    counterTargets.forEach((target) => counterObserver.observe(target));
  } else {
    counterTargets.forEach((target) => animateCounter(target));
  }

  const lambdaBars = Array.from(document.querySelectorAll('[data-lambda-bar]'));
  if (lambdaBars.length) {
    const fillBars = () => {
      lambdaBars.forEach((bar, index) => {
        const fill = bar.querySelector('.lambda-bar__fill');
        if (!fill) {
          return;
        }

        if (prefersReduced) {
          fill.style.width = `${bar.dataset.percent}%`;
          return;
        }

        setTimeout(() => {
          fill.style.width = `${bar.dataset.percent}%`;
        }, index * 120);
      });
    };

    if ('IntersectionObserver' in window && !prefersReduced) {
      const lambdaSection = document.getElementById('s06');
      if (lambdaSection) {
        const lambdaObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            fillBars();
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.26 });

        lambdaObserver.observe(lambdaSection);
      } else {
        fillBars();
      }
    } else {
      fillBars();
    }
  }

  const initAccordions = () => {
    const items = Array.from(document.querySelectorAll('[data-accordion-item]'));

    items.forEach((item) => {
      if (item.dataset.ready === 'true') {
        return;
      }

      item.dataset.ready = 'true';

      const trigger = item.querySelector('[data-accordion-trigger]');
      const content = item.querySelector('[data-accordion-content]');

      if (!trigger || !content) {
        return;
      }

      trigger.addEventListener('click', () => {
        const group = Array.from(item.parentElement?.querySelectorAll('[data-accordion-item]') || []);
        const willOpen = !item.classList.contains('open');

        group.forEach((other) => {
          const otherTrigger = other.querySelector('[data-accordion-trigger]');
          const otherContent = other.querySelector('[data-accordion-content]');

          other.classList.remove('open');
          if (otherTrigger) {
            otherTrigger.setAttribute('aria-expanded', 'false');
          }
          if (otherContent) {
            otherContent.style.maxHeight = '0px';
          }
        });

        if (!willOpen) {
          return;
        }

        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = `${content.scrollHeight}px`;
      });
    });
  };

  initAccordions();

  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const buttons = Array.from(tabs.querySelectorAll('[data-tab]'));
    const panels = Array.from(tabs.querySelectorAll('.tabs__panel'));

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.tab;

        buttons.forEach((item) => item.classList.remove('active'));
        panels.forEach((panel) => panel.classList.remove('active'));

        button.classList.add('active');

        const targetPanel = document.getElementById(targetId || '');
        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        initAccordions();
        if (window.lucide) {
          lucide.createIcons();
        }
      });
    });
  });

  if (hasFinePointer && !prefersReduced) {
    body.classList.add('has-pointer');

    window.addEventListener('pointermove', (event) => {
      body.style.setProperty('--cursor-x', `${event.clientX}px`);
      body.style.setProperty('--cursor-y', `${event.clientY}px`);
    }, { passive: true });

    const tiltTargets = Array.from(document.querySelectorAll('[data-tilt]'));

    tiltTargets.forEach((target) => {
      target.addEventListener('pointermove', (event) => {
        const rect = target.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 8;
        const rotateX = (0.5 - py) * 8;

        target.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(0,-3px,0)`;
      });

      target.addEventListener('pointerleave', () => {
        target.style.transform = '';
      });
    });
  }

  const updateScrollState = () => {
    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = documentHeight > 0 ? scrollTop / documentHeight : 0;

    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }

    if (progressLineFill) {
      progressLineFill.style.height = `${progress * 100}%`;
    }

    body.style.setProperty('--scroll-progress', progress.toFixed(4));

    if (nav) {
      nav.classList.toggle('scrolled', scrollTop > 40);
    }

    let activeSectionId = sections[0]?.id || 's01';
    const pivot = scrollTop + (window.innerHeight * 0.36);

    sections.forEach((section) => {
      if (section.offsetTop <= pivot) {
        activeSectionId = section.id;
      }
    });

    const dotMatch = dots.find((dot) => dot.dataset.section === activeSectionId);
    const indicatorText =
      labelMap[activeSectionId] ||
      (dotMatch ? dotMatch.dataset.label : '') ||
      labelMap.s20 ||
      'Hero';

    dots.forEach((dot) => {
      dot.classList.toggle('active', dot.dataset.section === activeSectionId);
    });

    const navHref = navTargetMap[activeSectionId] || '#s01';
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === navHref);
    });

    if (indicatorLabel) {
      indicatorLabel.textContent = indicatorText;
    }
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(() => {
      updateScrollState();
      ticking = false;
    });
  }, { passive: true });

  updateScrollState();

  const calcBuilding = document.getElementById('calc-building');
  const calcSurface = document.getElementById('calc-surface');
  const calcSurfaceRange = document.getElementById('calc-surface-range');
  const calcSubstrate = document.getElementById('calc-substrate');
  const calcClimate = document.getElementById('calc-climate');
  const thicknessRadios = Array.from(document.querySelectorAll('input[name="calc-thickness"]'));

  const resultThermal = document.getElementById('calc-r-thermal');
  const resultSavings = document.getElementById('calc-r-savings');
  const resultCost = document.getElementById('calc-r-cost');
  const resultPayback = document.getElementById('calc-r-payback');
  const resultWeight = document.getElementById('calc-r-weight');
  const resultTime = document.getElementById('calc-r-time');
  const resultSignal = document.getElementById('calc-r-signal');
  const resultSignalFill = document.getElementById('calc-r-signal-fill');
  const resultSummary = document.getElementById('calc-r-summary');

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

  const calculateResults = () => {
    if (!calcBuilding || !calcSurface || !calcSubstrate || !calcClimate) {
      return;
    }

    const building = calcBuilding.value || 'casa';
    const surface = Math.max(10, Math.min(5000, Number(calcSurface.value) || 150));
    const substrate = calcSubstrate.value || 'beton';
    const climate = calcClimate.value || 'II';
    const thickness = (thicknessRadios.find((item) => item.checked) || {}).value || '1';

    calcSurface.value = String(surface);
    if (calcSurfaceRange) {
      calcSurfaceRange.value = String(surface);
    }

    const bm = buildingMult[building] || buildingMult.casa;
    const cm = climateMult[climate] || 1;
    const tm = thicknessMult[thickness] || thicknessMult['1'];
    const sm = substrateMult[substrate] || 1;

    const baseThermalReduction = 40;
    const baseCostPerM2 = 200; // RON (~40 EUR)
    const baseSavingsPerM2 = 12;
    const baseWeightPerM2 = 0.4;
    const applicationSpeedPerDay = 50;

    const thermalReduction = Math.min(baseThermalReduction * tm.thermal, 55);
    const annualSavings = surface * baseSavingsPerM2 * cm * tm.thermal * bm.savings;
    const applicationCost = surface * baseCostPerM2 * tm.cost * sm * bm.cost;
    const paybackYears = annualSavings > 0 ? applicationCost / annualSavings : 0;
    const weightAdded = surface * baseWeightPerM2 * tm.weight;
    const weightClassic = surface * 2.5;
    const applicationDays = Math.max(1, Math.ceil(surface / applicationSpeedPerDay));

    let signalLabel = 'Echilibru optim';
    let signalWidth = 62;
    let summaryText = 'Configurație standard pentru o estimare inițială.';

    if (paybackYears <= 4.5 && thermalReduction >= 40) {
      signalLabel = 'Randament ridicat';
      signalWidth = 86;
      summaryText = 'Scenariu favorabil pentru reducere de pierderi și amortizare relativ rapidă.';
    } else if (paybackYears > 7 || surface > 1500 || thickness === '2') {
      signalLabel = 'Analiză detaliată';
      signalWidth = 42;
      summaryText = 'Configurația merită verificare tehnică extinsă, mai ales pentru cost și strat necesar.';
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
      resultPayback.textContent = `${paybackYears.toFixed(1).replace('.', ',')} ani`;
    }
    if (resultWeight) {
      resultWeight.textContent = `${Math.round(weightAdded)} kg (vs clasic: ${Math.round(weightClassic)} kg)`;
    }
    if (resultTime) {
      resultTime.textContent = `${applicationDays} ${applicationDays === 1 ? 'zi' : 'zile'}`;
    }
    if (resultSignal) {
      resultSignal.textContent = signalLabel;
    }
    if (resultSignalFill) {
      resultSignalFill.style.width = `${signalWidth}%`;
    }
    if (resultSummary) {
      resultSummary.textContent = summaryText;
    }
  };

  if (calcSurfaceRange && calcSurface) {
    calcSurfaceRange.addEventListener('input', () => {
      calcSurface.value = calcSurfaceRange.value;
      calculateResults();
    });

    calcSurface.addEventListener('input', () => {
      calculateResults();
    });
  }

  [calcBuilding, calcSubstrate, calcClimate].forEach((input) => {
    if (!input) {
      return;
    }
    input.addEventListener('change', calculateResults);
  });

  thicknessRadios.forEach((radio) => {
    radio.addEventListener('change', calculateResults);
  });

  calculateResults();

  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    const projectSelect = contactForm.querySelector('.form-field__select');

    if (projectSelect) {
      const syncSelectState = () => {
        projectSelect.classList.toggle('has-value', Boolean(projectSelect.value));
      };

      syncSelectState();
      projectSelect.addEventListener('change', syncSelectState);
    }

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = document.getElementById('cf-name');
      const email = document.getElementById('cf-email');

      if (!name || !email) {
        return;
      }

      contactForm.querySelectorAll('.form-field').forEach((field) => {
        field.classList.remove('error');
      });

      let hasError = false;

      if (!name.value.trim()) {
        name.closest('.form-field')?.classList.add('error');
        hasError = true;
      }

      if (!email.value.trim() || !email.value.includes('@')) {
        email.closest('.form-field')?.classList.add('error');
        hasError = true;
      }

      if (hasError) {
        return;
      }

      const phone = document.getElementById('cf-phone')?.value.trim() || '';
      const project = document.getElementById('cf-project')?.value || '';
      const surface = document.getElementById('cf-surface')?.value || '';
      const message = document.getElementById('cf-message')?.value.trim() || '';

      const subject = encodeURIComponent('thermX — Solicitare calcul termic');
      let bodyText = `Nume: ${name.value.trim()}\nEmail: ${email.value.trim()}`;

      if (phone) {
        bodyText += `\nTelefon: ${phone}`;
      }
      if (project) {
        bodyText += `\nTip proiect: ${project}`;
      }
      if (surface) {
        bodyText += `\nSuprafață estimată: ${surface} m²`;
      }
      if (message) {
        bodyText += `\n\nMesaj:\n${message}`;
      }

      contactForm.classList.add('success');
      window.location.href = `mailto:contact@nanorevolution.ro?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    });
  }
});
