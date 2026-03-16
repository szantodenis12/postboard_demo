/* ============================================================
   thermX — Nanoceramic Microsphere System v4
   CSS-based glass spheres (DOM elements, not canvas)
   Real glass look with backdrop-filter, box-shadow, gradients
   ============================================================ */

(function () {
  // Container for all spheres
  const container = document.createElement('div');
  container.id = 'microsphere-layer';
  container.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;';
  document.body.prepend(container);

  let W = window.innerWidth;
  let H = window.innerHeight;
  let mouse = { x: W / 2, y: H / 2 };
  let scrollSpeed = 0;
  let lastScrollY = 0;
  let currentScrollY = 0;
  let rafId;

  window.addEventListener('resize', () => {
    W = window.innerWidth;
    H = window.innerHeight;
  });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    mouse.x = W / 2;
    mouse.y = H / 2;
  });

  window.addEventListener('scroll', () => {
    currentScrollY = window.scrollY;
  }, { passive: true });

  // Responsive count — fewer, larger, more visible
  const COUNT = Math.min(Math.floor(W / 80), 18);
  const MOUSE_RADIUS = 250;

  // Size distribution — NO tiny ones. All readable as spheres.
  function pickSize() {
    const roll = Math.random();
    if (roll < 0.2) return 30 + Math.random() * 25;   // Large: 30-55px
    if (roll < 0.6) return 18 + Math.random() * 14;    // Medium: 18-32px
    return 10 + Math.random() * 8;                      // Small: 10-18px
  }

  class Microsphere {
    constructor() {
      this.el = document.createElement('div');
      this.el.className = 'microsphere';
      container.appendChild(this.el);

      // Create inner structure for glass effect
      this.el.innerHTML = '<div class="microsphere__highlight"></div><div class="microsphere__reflection"></div>';

      this.reset(true);
      this.applyStyle();
    }

    reset(initial) {
      this.radius = pickSize();
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : -this.radius * 3;

      // Opacity scales with size
      const sizeRatio = this.radius / 55;
      this.baseAlpha = 0.15 + sizeRatio * 0.25;
      this.alpha = this.baseAlpha;

      // Speed — larger = slower
      const speedFactor = 1 - sizeRatio * 0.6;
      this.vx = (Math.random() - 0.5) * 0.08 * speedFactor;
      this.vy = (0.04 + Math.random() * 0.1) * speedFactor;

      // Wobble
      this.wobblePhase = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.0008 + Math.random() * 0.002;
      this.wobbleAmp = 0.06 + Math.random() * 0.12;

      this.fadeIn = initial ? 1 : 0;

      // Depth (parallax factor)
      this.depth = 0.3 + Math.random() * 0.7;

      this.applyStyle();
    }

    applyStyle() {
      const size = this.radius * 2;
      this.el.style.width = size + 'px';
      this.el.style.height = size + 'px';
    }

    update(dt, scrollVel) {
      this.fadeIn = Math.min(this.fadeIn + 0.012, 1);

      this.wobblePhase += this.wobbleSpeed * dt;
      const wobble = Math.sin(this.wobblePhase) * this.wobbleAmp;

      // Scroll parallax
      const scrollInfluence = scrollVel * (0.005 + this.depth * 0.015);

      this.x += (this.vx + wobble) * dt * 0.025;
      this.y += (this.vy - scrollInfluence) * dt * 0.025;

      // Mouse repulsion — smooth push away
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0) {
        const force = (1 - dist / MOUSE_RADIUS) * 0.6;
        this.x += (dx / dist) * force * 1.8;
        this.y += (dy / dist) * force * 1.8;
        this.alpha = Math.min(this.baseAlpha + force * 0.25, 0.6);
      } else {
        this.alpha += (this.baseAlpha - this.alpha) * 0.03;
      }

      // Scroll glow
      const scrollGlow = Math.min(Math.abs(scrollVel) * 0.003, 0.08);
      this.alpha = Math.min(this.alpha + scrollGlow, 0.6);

      // Recycle
      const margin = this.radius * 3;
      if (this.y > H + margin || this.y < -margin * 2 || this.x < -margin || this.x > W + margin) {
        this.reset(false);
        if (Math.random() > 0.4) {
          this.x = Math.random() > 0.5 ? -this.radius * 2 : W + this.radius * 2;
          this.y = Math.random() * H;
        }
      }

      // Apply transform (GPU-accelerated)
      const a = this.alpha * this.fadeIn;
      this.el.style.transform = `translate3d(${this.x - this.radius}px, ${this.y - this.radius}px, 0)`;
      this.el.style.opacity = a;
    }
  }

  // Inject sphere styles
  const style = document.createElement('style');
  style.textContent = `
    .microsphere {
      position: absolute;
      top: 0;
      left: 0;
      border-radius: 50%;
      will-change: transform, opacity;
      background: radial-gradient(
        circle at 35% 30%,
        rgba(255, 255, 255, 0.35) 0%,
        rgba(210, 225, 240, 0.18) 25%,
        rgba(180, 200, 220, 0.08) 50%,
        rgba(150, 175, 200, 0.04) 70%,
        rgba(120, 150, 180, 0.02) 85%,
        transparent 100%
      );
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow:
        inset 0 -4px 8px rgba(0, 0, 0, 0.15),
        inset 0 2px 4px rgba(255, 255, 255, 0.1),
        0 0 20px rgba(200, 220, 240, 0.06),
        0 0 40px rgba(200, 220, 240, 0.03);
    }

    .microsphere__highlight {
      position: absolute;
      width: 40%;
      height: 40%;
      top: 12%;
      left: 18%;
      border-radius: 50%;
      background: radial-gradient(
        circle at 50% 50%,
        rgba(255, 255, 255, 0.7) 0%,
        rgba(255, 255, 255, 0.3) 40%,
        transparent 100%
      );
    }

    .microsphere__reflection {
      position: absolute;
      width: 18%;
      height: 18%;
      bottom: 18%;
      right: 22%;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.25) 0%,
        transparent 100%
      );
    }
  `;
  document.head.appendChild(style);

  // Create spheres
  const spheres = [];
  for (let i = 0; i < COUNT; i++) {
    spheres.push(new Microsphere());
  }

  let lastTime = performance.now();

  function animate(now) {
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;

    const newScrollSpeed = currentScrollY - lastScrollY;
    scrollSpeed += (newScrollSpeed - scrollSpeed) * 0.1;
    lastScrollY = currentScrollY;

    for (const s of spheres) {
      s.update(dt, scrollSpeed);
    }

    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  // Pause when tab not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      lastTime = performance.now();
      rafId = requestAnimationFrame(animate);
    }
  });
})();
