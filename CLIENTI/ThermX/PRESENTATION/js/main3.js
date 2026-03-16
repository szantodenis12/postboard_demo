/* thermX — Premium Presentation (index3) */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('.nav');
  const sections = Array.from(document.querySelectorAll('.section'));
  const dots = document.querySelectorAll('.progress-dot');
  const progressBar = document.querySelector('.scroll-progress');
  const progressLineFill = document.querySelector('.progress-line__fill');
  const navLinks = document.querySelectorAll('.nav__links a');

  // Mobile nav
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      mobileNav.classList.toggle('open');
      mobileNav.setAttribute('aria-hidden', String(isOpen));
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // Reveal observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

  // Counters
  const counters = document.querySelectorAll('[data-target]');
  const counted = new Set();
  function animateCounter(el) {
    if (counted.has(el) || prefersReduced) return;
    counted.add(el);
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2200;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const value = Math.round(eased * target);
      el.textContent = value + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('[data-target]').forEach((el, i) => {
          setTimeout(() => animateCounter(el), i * 180);
        });
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(c => {
    const sec = c.closest('.section');
    if (sec) counterObserver.observe(sec);
  });

  // Lambda bars
  const lambdaBars = document.querySelectorAll('[data-lambda-bar]');
  if (lambdaBars.length) {
    const lambdaObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('[data-lambda-bar]').forEach((bar, i) => {
            setTimeout(() => {
              bar.querySelector('.lambda-bar__fill')?.style.setProperty('width', bar.dataset.percent + '%');
            }, i * 160);
          });
          lambdaObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    const container = lambdaBars[0].closest('.section');
    if (container) lambdaObserver.observe(container);
  }

  // Accordions
  function initAccordions() {
    document.querySelectorAll('[data-accordion-item]').forEach(item => {
      if (item.dataset.ready) return;
      item.dataset.ready = 'true';
      const trigger = item.querySelector('[data-accordion-trigger]');
      const content = item.querySelector('[data-accordion-content]');
      if (!trigger || !content) return;
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        const group = item.parentElement?.querySelectorAll('[data-accordion-item]') || [];
        group.forEach(other => {
          other.classList.remove('open');
          const c = other.querySelector('[data-accordion-content]');
          if (c) c.style.maxHeight = '0px';
          const t = other.querySelector('[data-accordion-trigger]');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          content.style.maxHeight = content.scrollHeight + 'px';
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
  initAccordions();

  // Tabs
  document.querySelectorAll('[data-tabs]').forEach(tabs => {
    const buttons = tabs.querySelectorAll('[data-tab]');
    const panels = tabs.querySelectorAll('.tabs__panel');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        buttons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById(id);
        if (panel) panel.classList.add('active');
        initAccordions();
        if (window.lucide) lucide.createIcons();
      });
    });
  });

  // Typewriter
  const typeEl = document.querySelector('[data-typewriter]');
  if (typeEl && !prefersReduced) {
    const text = typeEl.textContent;
    typeEl.textContent = '';
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        let i = 0;
        const start = performance.now();
        const speed = 70;
        function step(now) {
          const elapsed = now - start;
          const next = Math.min(text.length, Math.floor(elapsed / speed));
          if (next !== i) {
            i = next;
            typeEl.textContent = text.slice(0, i);
          }
          if (i < text.length) requestAnimationFrame(step);
          else typeEl.classList.add('done');
        }
        requestAnimationFrame(step);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    observer.observe(typeEl.closest('.section'));
  }

  // Smooth scroll for dots
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = document.getElementById(dot.dataset.section);
      if (target) target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  // Scroll handling
  let ticking = false;
  const sectionToNav = {
    s01: '#s01', s02: '#s01', s03: '#s03', s04: '#s03',
    s06: '#s06', s08: '#s08', s09: '#s09', scalc: '#s09',
    sfaq: '#s09', s20: '#s20', s21: '#s20'
  };

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? scrollTop / docHeight : 0;

    if (progressBar) progressBar.style.width = (percent * 100) + '%';
    if (progressLineFill) progressLineFill.style.height = (percent * 100) + '%';

    if (nav) nav.classList.toggle('scrolled', scrollTop > 40);

    let activeId = 's01';
    const pivot = scrollTop + window.innerHeight * 0.35;
    sections.forEach(s => { if (s.offsetTop <= pivot) activeId = s.id; });
    const navHref = sectionToNav[activeId] || '#s01';
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === navHref));

    dots.forEach(dot => dot.classList.toggle('active', dot.dataset.section === activeId));
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  onScroll();

  // Calculator
  const calcBuilding = document.getElementById('calc-building');
  const calcSurface = document.getElementById('calc-surface');
  const calcSurfaceRange = document.getElementById('calc-surface-range');
  const calcSubstrate = document.getElementById('calc-substrate');
  const calcClimate = document.getElementById('calc-climate');
  const thicknessRadios = document.querySelectorAll('input[name="calc-thickness"]');

  const rThermal = document.getElementById('calc-r-thermal');
  const rSavings = document.getElementById('calc-r-savings');
  const rCost = document.getElementById('calc-r-cost');
  const rPayback = document.getElementById('calc-r-payback');
  const rWeight = document.getElementById('calc-r-weight');
  const rTime = document.getElementById('calc-r-time');

  const buildingMult = { casa: { cost: 1.0, savings: 1.0 }, bloc: { cost: 0.85, savings: 0.9 }, hala: { cost: 0.75, savings: 0.8 }, publica: { cost: 0.9, savings: 0.95 } };
  const climateMult = { I: 0.85, II: 1.0, III: 1.15, IV: 1.35 };
  const thicknessMult = { '0.5': { thermal: 0.7, cost: 0.6, weight: 0.5 }, '1': { thermal: 1.0, cost: 1.0, weight: 1.0 }, '2': { thermal: 1.3, cost: 1.8, weight: 2.0 } };
  const substrateMult = { beton: 1.0, metal: 0.9, lemn: 1.1, caramida: 1.05, tencuiala: 1.15 };

  function formatRON(value) {
    return value.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' RON';
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

    const baseThermalReduction = 40; // % la 1 mm
    const baseCostPerM2 = 200; // RON (~40 EUR)
    const baseEnergySavingsPerM2 = 12; // RON/m2/an
    const applicationSpeedM2PerDay = 50;
    const baseWeightPerM2 = 0.4; // kg la 1 mm

    const thermalReduction = Math.min(baseThermalReduction * tm.thermal, 55);
    const annualSavings = surface * baseEnergySavingsPerM2 * cm * tm.thermal * bm.savings;
    const applicationCost = surface * baseCostPerM2 * tm.cost * sm * bm.cost;
    const paybackYears = annualSavings > 0 ? applicationCost / annualSavings : 0;
    const weightAdded = surface * baseWeightPerM2 * tm.weight;
    const weightEPS = surface * 2.5;
    const applicationDays = Math.ceil(surface / applicationSpeedM2PerDay);

    if (rThermal) rThermal.textContent = Math.round(thermalReduction) + '%';
    if (rSavings) rSavings.textContent = formatRON(Math.round(annualSavings));
    if (rCost) rCost.textContent = formatRON(Math.round(applicationCost));
    if (rPayback) rPayback.textContent = paybackYears.toFixed(1).replace('.', ',') + ' ani';
    if (rWeight) rWeight.textContent = Math.round(weightAdded) + ' kg (vs EPS: ' + Math.round(weightEPS) + ' kg)';
    if (rTime) rTime.textContent = applicationDays + (applicationDays === 1 ? ' zi' : ' zile');
  }

  if (calcSurfaceRange && calcSurface) {
    calcSurfaceRange.addEventListener('input', () => { calcSurface.value = calcSurfaceRange.value; calculateResults(); });
    calcSurface.addEventListener('input', () => {
      let val = parseInt(calcSurface.value) || 10;
      val = Math.max(10, Math.min(5000, val));
      calcSurfaceRange.value = val;
      calculateResults();
    });
  }

  [calcBuilding, calcSubstrate, calcClimate].forEach(el => { if (el) el.addEventListener('change', calculateResults); });
  thicknessRadios.forEach(r => r.addEventListener('change', calculateResults));
  calculateResults();

  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.querySelectorAll('.form-field__select').forEach(sel => {
      sel.addEventListener('change', () => {
        if (sel.value) sel.classList.add('has-value');
        else sel.classList.remove('has-value');
      });
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      contactForm.querySelectorAll('.form-field').forEach(f => f.classList.remove('error'));

      const name = document.getElementById('cf-name');
      const email = document.getElementById('cf-email');
      let hasError = false;

      if (!name.value.trim()) { name.closest('.form-field').classList.add('error'); hasError = true; }
      if (!email.value.trim() || !email.value.includes('@')) { email.closest('.form-field').classList.add('error'); hasError = true; }
      if (hasError) return;

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
      contactForm.classList.add('success');
      window.location.href = mailtoUrl;
    });
  }
});
