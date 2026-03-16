/* ============================================================
   thermX — Interactive Product Site
   Complete JS: Components, Animations, Calculator, Slider
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Lucide Icons ──
  if (window.lucide) {
    lucide.createIcons();
  }

  // ── Theme Toggle ──
  // Restore saved preference before anything renders
  const savedTheme = localStorage.getItem('thermx-theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('theme-light');
    document.querySelectorAll('img[src*="thermx-logo-white"]').forEach(img => {
      img.src = img.src.replace('thermx-logo-white.png', 'thermx-logo.png');
    });
  }

  function handleThemeToggle() {
    document.documentElement.classList.add('theme-transitioning');
    document.documentElement.classList.toggle('theme-light');
    const isLight = document.documentElement.classList.contains('theme-light');
    localStorage.setItem('thermx-theme', isLight ? 'light' : 'dark');

    document.querySelectorAll('img[src*="thermx-logo"]').forEach(img => {
      if (isLight) {
        img.src = img.src.replace('thermx-logo-white.png', 'thermx-logo.png');
      } else {
        img.src = img.src.replace('thermx-logo.png', 'thermx-logo-white.png');
      }
    });

    if (window.lucide) lucide.createIcons();
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 500);
  }

  // Attach after Lucide has replaced icons
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.onclick = handleThemeToggle;
  }

  // ── Elements ──
  const nav = document.querySelector('.nav');
  const sections = document.querySelectorAll('.section');
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger, .reveal-scale, .reveal-fade, .reveal-blur');
  const dividers = document.querySelectorAll('.act-divider');
  const dots = document.querySelectorAll('.progress-dot');
  const counters = document.querySelectorAll('[data-target]');

  // ════════════════════════════════════════════
  // 1. MOBILE NAVIGATION
  // ════════════════════════════════════════════
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isOpen);
      mobileNav.classList.toggle('open');
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }


  // ════════════════════════════════════════════
  // 2. NAV SCROLL EFFECT
  // ════════════════════════════════════════════
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });


  // ════════════════════════════════════════════
  // 3. SCROLL REVEAL OBSERVER
  // ════════════════════════════════════════════
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -60px 0px'
  });

  reveals.forEach(el => revealObserver.observe(el));


  // ════════════════════════════════════════════
  // 4. DIVIDER OBSERVER
  // ════════════════════════════════════════════
  const dividerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  dividers.forEach(el => dividerObserver.observe(el));


  // ════════════════════════════════════════════
  // 5. SECTION TRACKING + PROGRESS DOTS
  // ════════════════════════════════════════════
  let currentSection = 0;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = Array.from(sections).indexOf(entry.target);
        if (index !== -1) {
          currentSection = index;
          updateDots(index);
        }
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => sectionObserver.observe(s));

  function updateDots(index) {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  // Dot click → scroll to section
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const sectionId = dot.dataset.section;
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  // ════════════════════════════════════════════
  // 6. KEYBOARD NAVIGATION
  // ════════════════════════════════════════════
  document.addEventListener('keydown', (e) => {
    // Don't hijack keyboard when user is in a form field or interactive control
    const tag = document.activeElement.tagName.toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button' || document.activeElement.getAttribute('role') === 'tab') return;

    if (e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      const next = Math.min(currentSection + 1, sections.length - 1);
      sections[next].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(currentSection - 1, 0);
      sections[prev].scrollIntoView({ behavior: 'smooth' });
    }
  });


  // ════════════════════════════════════════════
  // 7. COUNTER ANIMATION
  // ════════════════════════════════════════════
  const countedSet = new Set();

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCounter(el) {
    if (countedSet.has(el)) return;
    countedSet.add(el);

    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = parseInt(el.dataset.duration || '2400', 10);
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = eased * target;

      if (decimals > 0) {
        el.textContent = prefix + current.toFixed(decimals).replace('.', ',') + suffix;
      } else {
        el.textContent = prefix + Math.round(current) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const els = entry.target.querySelectorAll('[data-target]');
        els.forEach((el, i) => {
          setTimeout(() => animateCounter(el), i * 300);
        });
      }
    });
  }, { threshold: 0.25 });

  const counterSections = new Set();
  counters.forEach(c => {
    const sec = c.closest('.section');
    if (sec && !counterSections.has(sec)) {
      counterSections.add(sec);
      counterObserver.observe(sec);
    }
  });


  // ════════════════════════════════════════════
  // 8. ACCORDION COMPONENT
  // ════════════════════════════════════════════
  function initAccordions() {
    // Find all accordion groups (sections containing accordion items)
    const accordionGroups = new Map();

    document.querySelectorAll('[data-accordion-item]').forEach(item => {
      // Skip already-initialized items
      if (item.dataset.accordionReady) return;
      item.dataset.accordionReady = 'true';

      const parent = item.parentElement;
      if (!accordionGroups.has(parent)) {
        accordionGroups.set(parent, []);
      }
      accordionGroups.get(parent).push(item);
    });

    accordionGroups.forEach((items, parent) => {
      // Combine with any previously initialized siblings
      const allSiblings = Array.from(parent.querySelectorAll('[data-accordion-item]'));

      items.forEach(item => {
        const trigger = item.querySelector('[data-accordion-trigger]');
        if (!trigger) return;

        trigger.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');

          // Close all in this group (single-open mode)
          allSiblings.forEach(other => {
            other.classList.remove('open');
            const content = other.querySelector('[data-accordion-content]');
            if (content) content.style.maxHeight = '0px';
          });

          // Open clicked if it was closed
          if (!isOpen) {
            item.classList.add('open');
            const content = item.querySelector('[data-accordion-content]');
            if (content) {
              content.style.maxHeight = content.scrollHeight + 'px';
            }
          }
        });
      });
    });
  }

  initAccordions();


  // ════════════════════════════════════════════
  // 9. TABS COMPONENT
  // ════════════════════════════════════════════
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(tabsEl => {
      const buttons = tabsEl.querySelectorAll('[data-tab]');
      const panels = tabsEl.querySelectorAll('.tabs__panel');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.dataset.tab;

          // Deactivate all
          buttons.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));

          // Activate clicked
          btn.classList.add('active');
          const panel = document.getElementById(targetId);
          if (panel) panel.classList.add('active');

          // Re-init accordions in new panel (for FAQ tabs)
          initAccordions();

          // Re-init Lucide icons for newly visible content
          if (window.lucide) {
            lucide.createIcons();
          }
        });
      });
    });
  }

  initTabs();


  // ════════════════════════════════════════════
  // 10. LAMBDA BAR CHART ANIMATION
  // ════════════════════════════════════════════
  const lambdaBars = document.querySelectorAll('[data-lambda-bar]');

  if (lambdaBars.length) {
    const lambdaObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bars = entry.target.querySelectorAll('[data-lambda-bar]');
          bars.forEach((bar, i) => {
            setTimeout(() => {
              const percent = bar.dataset.percent;
              bar.style.setProperty('--bar-width', percent + '%');
              bar.classList.add('animated');
            }, i * 200);
          });
          lambdaObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const lambdaContainer = lambdaBars[0]?.closest('.section');
    if (lambdaContainer) {
      lambdaObserver.observe(lambdaContainer);
    }
  }


  // ════════════════════════════════════════════
  // 11. TYPEWRITER ANIMATION
  // ════════════════════════════════════════════
  const typewriterEl = document.querySelector('[data-typewriter]');

  if (typewriterEl) {
    const text = typewriterEl.textContent;
    typewriterEl.textContent = '';

    const typeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          let i = 0;
          const interval = setInterval(() => {
            typewriterEl.textContent = text.slice(0, i + 1);
            i++;
            if (i >= text.length) {
              clearInterval(interval);
              // Show subtitle after typing done
              setTimeout(() => {
                typewriterEl.classList.add('done');
                const sub = document.querySelector('.typewriter-sub');
                if (sub) sub.classList.add('visible');
              }, 400);
            }
          }, 120);
          typeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    typeObserver.observe(typewriterEl.closest('.section'));
  }


  // ════════════════════════════════════════════
  // 12. BEFORE / AFTER SLIDER
  // ════════════════════════════════════════════
  document.querySelectorAll('[data-ba-slider]').forEach(slider => {
    const afterEl = slider.querySelector('.ba-slider__after');
    const handle = slider.querySelector('.ba-slider__handle');
    let isDragging = false;

    function updatePosition(clientX) {
      const rect = slider.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const percent = (x / rect.width) * 100;

      afterEl.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
      handle.style.left = percent + '%';
    }

    slider.addEventListener('mousedown', (e) => {
      isDragging = true;
      updatePosition(e.clientX);
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        updatePosition(e.clientX);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch support
    slider.addEventListener('touchstart', (e) => {
      isDragging = true;
      updatePosition(e.touches[0].clientX);
    }, { passive: true });

    slider.addEventListener('touchmove', (e) => {
      if (isDragging) {
        updatePosition(e.touches[0].clientX);
      }
    }, { passive: true });

    slider.addEventListener('touchend', () => {
      isDragging = false;
    });
  });


  // ════════════════════════════════════════════
  // 13. COST SAVINGS CALCULATOR
  // ════════════════════════════════════════════
  const calcBuilding = document.getElementById('calc-building');
  const calcSurface = document.getElementById('calc-surface');
  const calcSurfaceRange = document.getElementById('calc-surface-range');
  const calcSubstrate = document.getElementById('calc-substrate');
  const calcClimate = document.getElementById('calc-climate');
  const thicknessRadios = document.querySelectorAll('input[name="calc-thickness"]');

  // Result elements
  const rThermal = document.getElementById('calc-r-thermal');
  const rSavings = document.getElementById('calc-r-savings');
  const rCost = document.getElementById('calc-r-cost');
  const rPayback = document.getElementById('calc-r-payback');
  const rWeight = document.getElementById('calc-r-weight');
  const rTime = document.getElementById('calc-r-time');

  // Multiplier tables
  const buildingMult = {
    casa:    { cost: 1.0,  savings: 1.0  },
    bloc:    { cost: 0.85, savings: 0.9  },
    hala:    { cost: 0.75, savings: 0.8  },
    publica: { cost: 0.9,  savings: 0.95 }
  };

  const climateMult = {
    'I':  0.85,
    'II': 1.0,
    'III': 1.15,
    'IV': 1.35
  };

  const thicknessMult = {
    '0.5': { thermal: 0.7, cost: 0.6, weight: 0.5 },
    '1':   { thermal: 1.0, cost: 1.0, weight: 1.0 },
    '2':   { thermal: 1.3, cost: 1.8, weight: 2.0 }
  };

  const substrateMult = {
    beton:     1.0,
    metal:     0.9,
    lemn:      1.1,
    caramida:  1.05,
    tencuiala: 1.15
  };

  function formatRON(value) {
    return value.toLocaleString('ro-RO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' RON';
  }

  function calculateResults() {
    const building = calcBuilding?.value || 'casa';
    const surface = parseFloat(calcSurface?.value) || 150;
    const substrate = calcSubstrate?.value || 'beton';
    const climate = calcClimate?.value || 'II';
    let thickness = '1';
    thicknessRadios.forEach(r => { if (r.checked) thickness = r.value; });

    const bm = buildingMult[building] || buildingMult.casa;
    const cm = climateMult[climate] || 1.0;
    const tm = thicknessMult[thickness] || thicknessMult['1'];
    const sm = substrateMult[substrate] || 1.0;

    // Base values
    const baseThermalReduction = 40; // % at 1mm
    const baseCostPerM2 = 200; // RON (~40 EUR)
    const baseEnergySavingsPerM2 = 12; // RON/m²/year
    const applicationSpeedM2PerDay = 50;
    const baseWeightPerM2 = 0.4; // kg at 1mm

    // Calculations
    const thermalReduction = Math.min(baseThermalReduction * tm.thermal, 55);
    const annualSavings = surface * baseEnergySavingsPerM2 * cm * tm.thermal * bm.savings;
    const applicationCost = surface * baseCostPerM2 * tm.cost * sm * bm.cost;
    const paybackYears = annualSavings > 0 ? applicationCost / annualSavings : 0;
    const weightAdded = surface * baseWeightPerM2 * tm.weight;
    const weightEPS = surface * 2.5;
    const applicationDays = Math.ceil(surface / applicationSpeedM2PerDay);

    // Update UI
    if (rThermal) rThermal.textContent = Math.round(thermalReduction) + '%';
    if (rSavings) rSavings.textContent = formatRON(Math.round(annualSavings));
    if (rCost) rCost.textContent = formatRON(Math.round(applicationCost));
    if (rPayback) rPayback.textContent = paybackYears.toFixed(1).replace('.', ',') + ' ani';
    if (rWeight) rWeight.textContent = Math.round(weightAdded) + ' kg (vs EPS: ' + Math.round(weightEPS) + ' kg)';
    if (rTime) rTime.textContent = applicationDays + (applicationDays === 1 ? ' zi' : ' zile');
  }

  // Sync range ↔ number input
  if (calcSurfaceRange && calcSurface) {
    calcSurfaceRange.addEventListener('input', () => {
      calcSurface.value = calcSurfaceRange.value;
      calculateResults();
    });

    calcSurface.addEventListener('input', () => {
      let val = parseInt(calcSurface.value) || 10;
      val = Math.max(10, Math.min(5000, val));
      calcSurfaceRange.value = val;
      calculateResults();
    });
  }

  // Bind all calc inputs
  [calcBuilding, calcSubstrate, calcClimate].forEach(el => {
    if (el) el.addEventListener('change', calculateResults);
  });

  thicknessRadios.forEach(r => {
    r.addEventListener('change', calculateResults);
  });

  // Initial calculation
  calculateResults();


  // ════════════════════════════════════════════
  // 14. CONTACT FORM
  // ════════════════════════════════════════════
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    // Float labels for select
    contactForm.querySelectorAll('.form-field__select').forEach(sel => {
      sel.addEventListener('change', () => {
        if (sel.value) sel.classList.add('has-value');
        else sel.classList.remove('has-value');
      });
    });

    // Ensure inputs show/hide placeholder for label floating
    contactForm.querySelectorAll('.form-field__input').forEach(input => {
      if (input.tagName !== 'SELECT') {
        input.setAttribute('placeholder', ' ');
      }
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Clear previous errors
      contactForm.querySelectorAll('.form-field').forEach(f => f.classList.remove('error'));

      // Validate
      const name = document.getElementById('cf-name');
      const email = document.getElementById('cf-email');
      let hasError = false;

      if (!name.value.trim()) {
        name.closest('.form-field').classList.add('error');
        hasError = true;
      }

      if (!email.value.trim() || !email.value.includes('@')) {
        email.closest('.form-field').classList.add('error');
        hasError = true;
      }

      if (hasError) return;

      // Build mailto
      const phone = document.getElementById('cf-phone')?.value || '';
      const project = document.getElementById('cf-project')?.value || '';
      const surface = document.getElementById('cf-surface')?.value || '';
      const message = document.getElementById('cf-message')?.value || '';

      const subject = encodeURIComponent('thermX — Solicitare calcul termic');
      let body = `Nume: ${name.value}\nEmail: ${email.value}`;
      if (phone) body += `\nTelefon: ${phone}`;
      if (project) body += `\nTip proiect: ${project}`;
      if (surface) body += `\nSuprafață estimată: ${surface} m²`;
      if (message) body += `\n\nMesaj:\n${message}`;

      const mailtoUrl = `mailto:contact@nanorevolution.ro?subject=${subject}&body=${encodeURIComponent(body)}`;

      // Show success state
      contactForm.classList.add('success');

      // Open mailto
      window.location.href = mailtoUrl;
    });
  }


  // ════════════════════════════════════════════
  // 15. SMOOTH SCROLL ANCHORS
  // ════════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  // ════════════════════════════════════════════
  // 16. COMBINED SCROLL HANDLER (rAF-throttled)
  // ════════════════════════════════════════════
  const progressBar = document.querySelector('.scroll-progress');
  const progressLineFill = document.querySelector('.progress-line__fill');
  const navLinks = document.querySelectorAll('.nav__links a');
  const nzebYear = document.querySelector('.nzeb-year');

  const sectionToNav = {
    's01': '#s01',
    's02': '#s02',
    's03': '#s04', 's04': '#s04', 's05': '#s04', 's06': '#s04',
    's07': '#s07', 's08': '#s07',
    's09': '#s09', 's10': '#s09', 'scalc': '#s09', 's12': '#s09', 's13': '#s09',
    's14': '#s14', 's15': '#s14', 's16': '#s14', 's17': '#s14', 's18': '#s14', 'sfaq': '#s14',
    's19': '#s20', 's20': '#s20', 's21': '#s20', 's22': '#s20'
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

        // Scroll progress bar
        if (progressBar) {
          progressBar.style.width = (scrollPercent * 100) + '%';
        }

        // Progress line fill
        if (progressLineFill) {
          progressLineFill.style.height = (scrollPercent * 100) + '%';
        }

        // Active nav link
        let activeId = 's01';
        const scrollY = scrollTop + window.innerHeight * 0.35;
        sections.forEach(section => {
          if (section.offsetTop <= scrollY) {
            activeId = section.id;
          }
        });
        const navHref = sectionToNav[activeId] || '#s01';
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === navHref);
        });

        // Parallax
        if (nzebYear) {
          const rect = nzebYear.closest('.section').getBoundingClientRect();
          nzebYear.style.setProperty('--py', (rect.top * 0.12) + 'px');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });


  // ════════════════════════════════════════════
  // 17. HEAT TRANSFER FLIP CARDS + CANVAS PARTICLE SYSTEM
  // ════════════════════════════════════════════
  (function initHeatFlipCards() {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // ── Color helpers ──
    function lerpRGB(a, b, t) {
      return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t)
      ];
    }
    function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

    const ORANGE = [255, 107, 53];
    const BLUE   = [59, 130, 246];
    const PURPLE = [168, 85, 247];
    const WARM2  = [255, 140, 90];
    const WARM3  = [255, 170, 128];

    // ── Particle factory ──
    function makeParticle(overrides) {
      return Object.assign({
        x: 0, y: 0, vx: 0, vy: 0,
        r: 2, life: 1, maxLife: 1,
        color: ORANGE, opacity: 1
      }, overrides);
    }

    // ════════════════════════════
    //  CONDUCTION SIMULATION
    // ════════════════════════════
    function createConductionSim(ctx, w, h) {
      const particles = [];
      const trails = [];
      const WALL_X = w * 0.12;
      const WALL_W = w * 0.76;
      const WALL_Y = h * 0.10;
      const WALL_H = h * 0.72;
      const COUNT = 60;
      const GRID_ROWS = 5;

      function spawn() {
        const life = 3 + Math.random() * 2;
        const row = Math.floor(Math.random() * GRID_ROWS);
        const rowY = WALL_Y + 12 + row * ((WALL_H - 24) / (GRID_ROWS - 1));
        particles.push(makeParticle({
          x: WALL_X + 6,
          y: rowY + (Math.random() - 0.5) * 8,
          vx: (WALL_W / life) / 60,
          vy: (Math.random() - 0.5) * 0.15,
          r: 2 + Math.random() * 2.5,
          life: life,
          maxLife: life,
          color: ORANGE,
          trail: []
        }));
      }

      // Pre-fill
      for (let i = 0; i < COUNT; i++) {
        spawn();
        const p = particles[particles.length - 1];
        const skip = Math.random() * p.maxLife;
        p.life -= skip;
        p.x += p.vx * skip * 60;
        p.y += p.vy * skip * 60;
      }

      let time = 0;

      return function tick() {
        ctx.clearRect(0, 0, w, h);
        time += 1 / 60;

        // Wall material layers
        const layers = 4;
        for (let l = 0; l < layers; l++) {
          const lx = WALL_X + (l / layers) * WALL_W;
          const lw = WALL_W / layers;
          const warmth = 1 - l / (layers - 1);
          const r = Math.round(255 * warmth + 30 * (1 - warmth));
          const g = Math.round(107 * warmth + 80 * (1 - warmth));
          const b = Math.round(53 * warmth + 246 * (1 - warmth));
          ctx.fillStyle = `rgba(${r},${g},${b},0.06)`;
          ctx.beginPath();
          ctx.roundRect(lx, WALL_Y, lw + 1, WALL_H, l === 0 ? [6,0,0,6] : l === layers-1 ? [0,6,6,0] : 0);
          ctx.fill();

          // Layer divider lines
          if (l > 0) {
            ctx.strokeStyle = `rgba(${r},${g},${b},0.12)`;
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(lx, WALL_Y + 4);
            ctx.lineTo(lx, WALL_Y + WALL_H - 4);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Outer border gradient
        const borderGrad = ctx.createLinearGradient(WALL_X, 0, WALL_X + WALL_W, 0);
        borderGrad.addColorStop(0, 'rgba(255,107,53,0.4)');
        borderGrad.addColorStop(0.5, 'rgba(168,85,247,0.2)');
        borderGrad.addColorStop(1, 'rgba(59,130,246,0.35)');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(WALL_X, WALL_Y, WALL_W, WALL_H, 6);
        ctx.stroke();

        // Temperature indicators on sides
        const tempBarH = WALL_H * 0.6;
        const tempBarY = WALL_Y + (WALL_H - tempBarH) / 2;

        // Warm side bar
        const warmGrad = ctx.createLinearGradient(0, tempBarY, 0, tempBarY + tempBarH);
        warmGrad.addColorStop(0, 'rgba(255,107,53,0.5)');
        warmGrad.addColorStop(0.5, 'rgba(255,140,90,0.3)');
        warmGrad.addColorStop(1, 'rgba(255,107,53,0.5)');
        ctx.fillStyle = warmGrad;
        ctx.beginPath();
        ctx.roundRect(WALL_X - 6, tempBarY, 3, tempBarH, 2);
        ctx.fill();

        // Cold side bar
        const coldGrad = ctx.createLinearGradient(0, tempBarY, 0, tempBarY + tempBarH);
        coldGrad.addColorStop(0, 'rgba(59,130,246,0.5)');
        coldGrad.addColorStop(0.5, 'rgba(59,130,246,0.3)');
        coldGrad.addColorStop(1, 'rgba(59,130,246,0.5)');
        ctx.fillStyle = coldGrad;
        ctx.beginPath();
        ctx.roundRect(WALL_X + WALL_W + 3, tempBarY, 3, tempBarH, 2);
        ctx.fill();

        // Labels
        ctx.font = '600 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,107,53,0.55)';
        ctx.fillText('CALD', WALL_X / 2, h * 0.50);
        ctx.fillStyle = 'rgba(59,130,246,0.55)';
        ctx.fillText('RECE', WALL_X + WALL_W + (w - WALL_X - WALL_W) / 2, h * 0.50);

        // Flow arrow (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        const arrowY = WALL_Y + WALL_H + 10;
        ctx.beginPath();
        ctx.moveTo(WALL_X + 20, arrowY);
        ctx.lineTo(WALL_X + WALL_W - 20, arrowY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(WALL_X + WALL_W - 28, arrowY - 3);
        ctx.lineTo(WALL_X + WALL_W - 20, arrowY);
        ctx.lineTo(WALL_X + WALL_W - 28, arrowY + 3);
        ctx.stroke();

        // Particles with trails
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 1 / 60;
          p.x += p.vx;
          p.y += p.vy + Math.sin(time * 2 + i * 0.5) * 0.02;

          if (p.life <= 0) { particles.splice(i, 1); continue; }

          const progress = 1 - (p.life / p.maxLife);
          const c = progress < 0.35
            ? lerpRGB(ORANGE, WARM2, progress / 0.35)
            : progress < 0.65
            ? lerpRGB(WARM2, PURPLE, (progress - 0.35) / 0.3)
            : lerpRGB(PURPLE, BLUE, (progress - 0.65) / 0.35);
          const alpha = progress < 0.08 ? progress * 12 : Math.max(0, 1 - progress * 0.8);
          const radius = Math.max(0.5, p.r * (1 - progress * 0.4));

          // Trail
          if (p.trail) {
            p.trail.push({ x: p.x, y: p.y, a: alpha });
            if (p.trail.length > 8) p.trail.shift();
            for (let t = 0; t < p.trail.length - 1; t++) {
              const ta = p.trail[t].a * (t / p.trail.length) * 0.15;
              ctx.beginPath();
              ctx.arc(p.trail[t].x, p.trail[t].y, radius * 0.6, 0, Math.PI * 2);
              ctx.fillStyle = rgba(c, ta);
              ctx.fill();
            }
          }

          // Outer glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = rgba(c, alpha * 0.05);
          ctx.fill();

          // Mid glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 2, 0, Math.PI * 2);
          ctx.fillStyle = rgba(c, alpha * 0.12);
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = rgba(c, alpha * 0.9);
          ctx.fill();
        }

        while (particles.length < COUNT) spawn();
      };
    }

    // ════════════════════════════
    //  CONVECTION SIMULATION
    // ════════════════════════════
    function createConvectionSim(ctx, w, h) {
      const particles = [];
      const GAP_X = w * 0.38;
      const GAP_W = w * 0.24;
      const PANEL_W = w * 0.26;
      const PANEL_Y = h * 0.06;
      const PANEL_H = h * 0.84;
      const LEFT_X = w * 0.06;
      const RIGHT_X = GAP_X + GAP_W + w * 0.04;
      const COUNT = 65;

      function spawn() {
        const life = 2.5 + Math.random() * 2;
        const startX = GAP_X + 6 + Math.random() * (GAP_W - 12);
        particles.push(makeParticle({
          x: startX,
          y: PANEL_Y + PANEL_H - 4,
          vx: 0,
          vy: -(PANEL_H / life) / 60,
          r: 1.5 + Math.random() * 2.5,
          life: life,
          maxLife: life,
          phase: Math.random() * Math.PI * 2,
          wiggle: 0.4 + Math.random() * 0.6,
          color: Math.random() < 0.5 ? ORANGE : (Math.random() < 0.5 ? WARM2 : WARM3),
          trail: []
        }));
      }

      // Pre-fill
      for (let i = 0; i < COUNT; i++) {
        spawn();
        const p = particles[particles.length - 1];
        const skip = Math.random() * p.maxLife;
        p.life -= skip;
        p.y += p.vy * skip * 60;
      }

      let time = 0;

      return function tick() {
        ctx.clearRect(0, 0, w, h);
        time += 1 / 60;

        // Left panel (warm) — inner glow
        const warmInner = ctx.createLinearGradient(LEFT_X, PANEL_Y, LEFT_X + PANEL_W, PANEL_Y);
        warmInner.addColorStop(0, 'rgba(255,107,53,0.04)');
        warmInner.addColorStop(1, 'rgba(255,107,53,0.10)');
        ctx.fillStyle = warmInner;
        ctx.beginPath();
        ctx.roundRect(LEFT_X, PANEL_Y, PANEL_W, PANEL_H, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,107,53,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(LEFT_X, PANEL_Y, PANEL_W, PANEL_H, 6);
        ctx.stroke();

        // Warm panel heat shimmer lines
        ctx.strokeStyle = 'rgba(255,107,53,0.06)';
        ctx.lineWidth = 0.5;
        for (let l = 0; l < 4; l++) {
          const ly = PANEL_Y + 20 + l * (PANEL_H - 40) / 3;
          ctx.beginPath();
          for (let sx = LEFT_X + 8; sx < LEFT_X + PANEL_W - 8; sx += 2) {
            const sy = ly + Math.sin(time * 1.5 + sx * 0.05 + l) * 3;
            sx === LEFT_X + 8 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }

        // Right panel (cold)
        const coldInner = ctx.createLinearGradient(RIGHT_X, PANEL_Y, RIGHT_X + PANEL_W, PANEL_Y);
        coldInner.addColorStop(0, 'rgba(59,130,246,0.10)');
        coldInner.addColorStop(1, 'rgba(59,130,246,0.04)');
        ctx.fillStyle = coldInner;
        ctx.beginPath();
        ctx.roundRect(RIGHT_X, PANEL_Y, PANEL_W, PANEL_H, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(59,130,246,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(RIGHT_X, PANEL_Y, PANEL_W, PANEL_H, 6);
        ctx.stroke();

        // Gap — subtle gradient showing airflow
        const gapGrad = ctx.createLinearGradient(GAP_X, PANEL_Y + PANEL_H, GAP_X, PANEL_Y);
        gapGrad.addColorStop(0, 'rgba(255,107,53,0.04)');
        gapGrad.addColorStop(0.5, 'rgba(255,255,255,0.02)');
        gapGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = gapGrad;
        ctx.beginPath();
        ctx.roundRect(GAP_X, PANEL_Y, GAP_W, PANEL_H, 3);
        ctx.fill();

        // Gap border lines (dashed)
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(GAP_X, PANEL_Y + 4);
        ctx.lineTo(GAP_X, PANEL_Y + PANEL_H - 4);
        ctx.moveTo(GAP_X + GAP_W, PANEL_Y + 4);
        ctx.lineTo(GAP_X + GAP_W, PANEL_Y + PANEL_H - 4);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow up in gap
        const arrowX = GAP_X + GAP_W / 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(arrowX, PANEL_Y + PANEL_H - 12);
        ctx.lineTo(arrowX, PANEL_Y + 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arrowX - 4, PANEL_Y + 22);
        ctx.lineTo(arrowX, PANEL_Y + 16);
        ctx.lineTo(arrowX + 4, PANEL_Y + 22);
        ctx.stroke();

        // Labels
        ctx.font = '600 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,107,53,0.5)';
        ctx.fillText('CALD', LEFT_X + PANEL_W / 2, h * 0.50);
        ctx.fillStyle = 'rgba(59,130,246,0.5)';
        ctx.fillText('RECE', RIGHT_X + PANEL_W / 2, h * 0.50);

        // Particles with trails
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 1 / 60;
          p.y += p.vy;
          const wiggleX = Math.sin(time * 2 + p.phase) * p.wiggle;
          p.x += wiggleX * 0.25;

          p.x = Math.max(GAP_X + 4, Math.min(GAP_X + GAP_W - 4, p.x));

          if (p.life <= 0 || p.y < PANEL_Y) { particles.splice(i, 1); continue; }

          const progress = 1 - (p.life / p.maxLife);
          const alpha = progress < 0.06 ? progress * 16 : Math.max(0, 1 - progress * 1.0);
          const radius = Math.max(0.5, p.r * (0.7 + 0.3 * Math.sin(progress * Math.PI)));

          // Trail
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 6) p.trail.shift();
          for (let t = 0; t < p.trail.length - 1; t++) {
            const ta = alpha * (t / p.trail.length) * 0.12;
            ctx.beginPath();
            ctx.arc(p.trail[t].x, p.trail[t].y, radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = rgba(p.color, ta);
            ctx.fill();
          }

          // Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = rgba(p.color, alpha * 0.04);
          ctx.fill();

          // Mid
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 2, 0, Math.PI * 2);
          ctx.fillStyle = rgba(p.color, alpha * 0.1);
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = rgba(p.color, alpha * 0.85);
          ctx.fill();
        }

        while (particles.length < COUNT) spawn();
      };
    }

    // ════════════════════════════
    //  RADIATION SIMULATION
    // ════════════════════════════
    function createRadiationSim(ctx, w, h) {
      const arcs = [];
      const sparks = [];
      const SURFACE_Y = h * 0.76;
      const SURFACE_H = h * 0.12;
      const CX = w / 2;
      const ARC_COUNT = 8;
      const SPARK_COUNT = 35;

      function spawnArc() {
        const life = 2.5 + Math.random() * 1;
        arcs.push({
          r: 6,
          maxR: h * 0.65,
          life: life,
          maxLife: life,
          color: Math.random() < 0.4 ? ORANGE : (Math.random() < 0.5 ? WARM2 : WARM3),
          offset: (Math.random() - 0.5) * w * 0.08
        });
      }

      function spawnSpark() {
        const angle = -Math.PI * (0.1 + Math.random() * 0.8);
        const speed = 0.4 + Math.random() * 0.8;
        const life = 1.5 + Math.random() * 1.5;
        sparks.push(makeParticle({
          x: CX + (Math.random() - 0.5) * w * 0.4,
          y: SURFACE_Y - 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1 + Math.random() * 2,
          life: life,
          maxLife: life,
          color: Math.random() < 0.4 ? ORANGE : (Math.random() < 0.5 ? WARM2 : WARM3),
          trail: []
        }));
      }

      // Pre-fill
      for (let i = 0; i < ARC_COUNT; i++) {
        spawnArc();
        const a = arcs[arcs.length - 1];
        const skip = (i / ARC_COUNT) * a.maxLife * 0.8;
        a.life = Math.max(0.2, a.life - skip);
      }
      for (let i = 0; i < SPARK_COUNT; i++) {
        spawnSpark();
        const s = sparks[sparks.length - 1];
        const skip = Math.random() * s.maxLife * 0.6;
        s.life = Math.max(0.1, s.life - skip);
        s.x += s.vx * skip * 60;
        s.y += s.vy * skip * 60;
      }

      let arcTimer = 0;
      let time = 0;

      return function tick() {
        ctx.clearRect(0, 0, w, h);
        time += 1 / 60;

        // Warm surface with pulsing glow
        const pulse = 0.9 + Math.sin(time * 2) * 0.1;
        const surfGrad = ctx.createLinearGradient(w * 0.08, SURFACE_Y, w * 0.08, SURFACE_Y + SURFACE_H);
        surfGrad.addColorStop(0, `rgba(255,107,53,${0.2 * pulse})`);
        surfGrad.addColorStop(1, `rgba(255,107,53,${0.06 * pulse})`);
        ctx.fillStyle = surfGrad;
        ctx.beginPath();
        ctx.roundRect(w * 0.08, SURFACE_Y, w * 0.84, SURFACE_H, 6);
        ctx.fill();

        // Surface glow halo
        const haloGrad = ctx.createRadialGradient(CX, SURFACE_Y, 0, CX, SURFACE_Y, w * 0.5);
        haloGrad.addColorStop(0, `rgba(255,107,53,${0.08 * pulse})`);
        haloGrad.addColorStop(1, 'rgba(255,107,53,0)');
        ctx.fillStyle = haloGrad;
        ctx.fillRect(0, SURFACE_Y - h * 0.12, w, h * 0.12);

        // Surface border
        ctx.strokeStyle = `rgba(255,107,53,${0.35 * pulse})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(w * 0.08, SURFACE_Y, w * 0.84, SURFACE_H, 6);
        ctx.stroke();

        // Surface label
        ctx.font = '600 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,107,53,0.55)';
        ctx.fillText('SUPRAFAȚĂ CALDĂ', CX, SURFACE_Y + SURFACE_H * 0.65);

        // IR label with wave symbol
        ctx.font = '600 9px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,107,53,0.25)';
        ctx.fillText('〰 IR 〰', CX, h * 0.10);

        // Expanding arcs (semicircles) with varying widths
        for (let i = arcs.length - 1; i >= 0; i--) {
          const a = arcs[i];
          a.life -= 1 / 60;

          if (a.life <= 0) { arcs.splice(i, 1); continue; }

          const progress = Math.max(0, 1 - (a.life / a.maxLife));
          const radius = Math.max(1, 6 + progress * a.maxR);

          const alpha = progress < 0.06 ? progress * 14 : Math.max(0, (1 - progress) * 0.6);
          const lineW = Math.max(0.3, 2 * (1 - progress));

          // Main arc
          ctx.beginPath();
          ctx.arc(CX + a.offset, SURFACE_Y, radius, Math.PI, 0);
          ctx.strokeStyle = rgba(a.color, alpha);
          ctx.lineWidth = lineW;
          ctx.stroke();

          // Softer glow arc
          ctx.beginPath();
          ctx.arc(CX + a.offset, SURFACE_Y, radius, Math.PI, 0);
          ctx.strokeStyle = rgba(a.color, alpha * 0.3);
          ctx.lineWidth = lineW * 4;
          ctx.stroke();
        }

        // Sparks with trails
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life -= 1 / 60;
          s.x += s.vx;
          s.y += s.vy;
          s.vy -= 0.004;

          if (s.life <= 0) { sparks.splice(i, 1); continue; }

          const progress = Math.max(0, 1 - (s.life / s.maxLife));
          const alpha = progress < 0.08 ? progress * 12 : Math.max(0, 1 - progress * 1.0);
          const radius = Math.max(0.5, s.r * (1 - progress * 0.3));

          // Trail
          s.trail.push({ x: s.x, y: s.y });
          if (s.trail.length > 5) s.trail.shift();
          for (let t = 0; t < s.trail.length - 1; t++) {
            const ta = alpha * (t / s.trail.length) * 0.15;
            ctx.beginPath();
            ctx.arc(s.trail[t].x, s.trail[t].y, radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = rgba(s.color, ta);
            ctx.fill();
          }

          // Outer glow
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = rgba(s.color, alpha * 0.04);
          ctx.fill();

          // Mid glow
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius * 2, 0, Math.PI * 2);
          ctx.fillStyle = rgba(s.color, alpha * 0.1);
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = rgba(s.color, alpha * 0.8);
          ctx.fill();
        }

        // Respawn
        arcTimer += 1 / 60;
        if (arcTimer > 0.3 && arcs.length < ARC_COUNT) {
          spawnArc();
          arcTimer = 0;
        }
        while (sparks.length < SPARK_COUNT) spawnSpark();
      };
    }

    // ── Init all canvases ──
    const simCreators = {
      conduction: createConductionSim,
      convection: createConvectionSim,
      radiation:  createRadiationSim
    };

    document.querySelectorAll('.heat-flip').forEach(flipCard => {
      const canvas = flipCard.querySelector('.heat-flip__canvas');
      if (!canvas) return;

      const simType = canvas.dataset.sim;
      const createSim = simCreators[simType];
      if (!createSim) return;

      // Size canvas
      function sizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width  = Math.round(rect.width * DPR);
        canvas.height = Math.round(rect.height * DPR);
      }
      sizeCanvas();

      const ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);

      const logicalW = canvas.width / DPR;
      const logicalH = canvas.height / DPR;
      const tick = createSim(ctx, logicalW, logicalH);

      let rafId = null;
      let running = false;

      function loop() {
        if (!running) return;
        tick();
        rafId = requestAnimationFrame(loop);
      }

      // Start/stop based on visibility
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !flipCard.classList.contains('flipped')) {
          running = true;
          loop();
        } else {
          running = false;
          if (rafId) cancelAnimationFrame(rafId);
        }
      }, { threshold: 0.1 });
      observer.observe(flipCard);

      // Flip toggle
      flipCard.addEventListener('click', () => {
        flipCard.classList.toggle('flipped');
        const isFlipped = flipCard.classList.contains('flipped');
        if (isFlipped) {
          running = false;
          if (rafId) cancelAnimationFrame(rafId);
        } else {
          running = true;
          loop();
        }
      });

      flipCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          flipCard.click();
        }
      });
    });

    // Resize handling
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        document.querySelectorAll('.heat-flip__canvas').forEach(c => {
          const rect = c.getBoundingClientRect();
          c.width  = Math.round(rect.width * DPR);
          c.height = Math.round(rect.height * DPR);
          const ctx = c.getContext('2d');
          ctx.scale(DPR, DPR);
        });
      }, 250);
    });
  })();


  // ════════════════════════════════════════════
  // 17b. PERFORMANCE FLIP CARDS
  // ════════════════════════════════════════════
  document.querySelectorAll('.perf-flip').forEach(flipCard => {
    flipCard.addEventListener('click', () => {
      flipCard.classList.toggle('flipped');
    });
    flipCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flipCard.click();
      }
    });
  });


  // ════════════════════════════════════════════
  // 18. CARD TILT EFFECT (subtle 3D on hover)
  // ════════════════════════════════════════════
  document.querySelectorAll('.perf-card:not(.perf-flip__front):not(.perf-flip__back), .card:not(.card--light):not(.heat-flip__front):not(.heat-flip__back), .pkg-card').forEach(card => {

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-4px) perspective(600px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });


  // ════════════════════════════════════════════
  // 19. PRESENTATION MODE
  // ════════════════════════════════════════════
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'present') {
    document.documentElement.style.scrollSnapType = 'y mandatory';
    document.querySelectorAll('.section').forEach(s => {
      s.style.scrollSnapAlign = 'start';
    });
    document.body.requestFullscreen?.();
  }

});
