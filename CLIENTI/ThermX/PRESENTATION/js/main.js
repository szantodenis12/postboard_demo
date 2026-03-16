/* ============================================================
   thermX — Product Launch Presentation
   Smooth scroll reveals, counters, keyboard nav, progress dots
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── Lucide Icons ──
  if (window.lucide) {
    lucide.createIcons();
  }

  // ── Elements ──
  const nav = document.querySelector('.nav');
  const sections = document.querySelectorAll('.section');
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger, .reveal-scale, .reveal-fade, .reveal-blur');
  const dividers = document.querySelectorAll('.act-divider');
  const dots = document.querySelectorAll('.progress-dot');
  const counters = document.querySelectorAll('[data-target]');
  const lambdaSection = document.getElementById('s08');

  // ── Nav scroll effect ──
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // ── Scroll Reveal Observer — low threshold for early, gentle trigger ──
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

  // ── Divider Observer ──
  const dividerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  dividers.forEach(el => dividerObserver.observe(el));

  // ── Current Section Tracking ──
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

  // ── Progress Dots ──
  function updateDots(index) {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      sections[i]?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ── Keyboard Navigation ──
  document.addEventListener('keydown', (e) => {
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

  // ── Counter Animation — smooth easeOutExpo ──
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

  // Observe parent sections of counters
  const counterSections = new Set();
  counters.forEach(c => {
    const sec = c.closest('.section');
    if (sec && !counterSections.has(sec)) {
      counterSections.add(sec);
      counterObserver.observe(sec);
    }
  });

  // ── Lambda Climax Staged Reveal — slower, more dramatic ──
  if (lambdaSection) {
    const lambdaObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const rows = lambdaSection.querySelectorAll('.lambda-row');
          const hero = lambdaSection.querySelector('.lambda-hero');

          rows.forEach((row, i) => {
            setTimeout(() => row.classList.add('active'), i * 800);
          });

          if (hero) {
            setTimeout(() => hero.classList.add('active'), rows.length * 800 + 600);
          }

          lambdaObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    lambdaObserver.observe(lambdaSection);
  }

  // ── Smooth Scroll Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ── Scroll Progress Bar ──
  const progressBar = document.querySelector('.scroll-progress');

  // ── Active Nav Tracking ──
  const navLinks = document.querySelectorAll('.nav__links a');
  const sectionToNav = {
    's01': '#s01', 's02': '#s01',
    's03': '#s03', 's04': '#s03', 's05': '#s03',
    's06': '#s06', 's07': '#s06', 's08': '#s06',
    's09': '#s09', 's10': '#s09', 's11': '#s09', 's12': '#s09', 's13': '#s09',
    's14': '#s14', 's15': '#s14', 's16': '#s14', 's17': '#s14', 's18': '#s14',
    's19': '#s20', 's20': '#s20', 's21': '#s20', 's22': '#s20'
  };

  // ── Parallax Elements ──
  const nzebYear = document.querySelector('.nzeb-year');
  const thickBg = document.querySelector('.thick-bg-number');

  // ── Combined Scroll Handler (rAF-throttled) ──
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // Progress bar
        if (progressBar && docHeight > 0) {
          progressBar.style.width = (scrollTop / docHeight * 100) + '%';
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

        // Parallax on decorative background elements
        if (nzebYear) {
          const rect = nzebYear.closest('.section').getBoundingClientRect();
          nzebYear.style.setProperty('--py', (rect.top * 0.12) + 'px');
        }
        if (thickBg) {
          const rect = thickBg.closest('.section').getBoundingClientRect();
          thickBg.style.setProperty('--py', (rect.top * 0.1) + 'px');
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ── Presentation Mode (optional: ?mode=present) ──
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'present') {
    document.documentElement.style.scrollSnapType = 'y mandatory';
    document.querySelectorAll('.section').forEach(s => {
      s.style.scrollSnapAlign = 'start';
    });
    document.body.requestFullscreen?.();
  }
});
