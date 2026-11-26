'use strict';
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ═══════════════════════════════════════════════════
     1. AMBIENT BACKGROUND CANVAS (Subtle Theme Motion)
     ═══════════════════════════════════════════════════ */
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas && !prefersReducedMotion) {
    const bctx = bgCanvas.getContext('2d');
    let bw = 0, bh = 0;
    let mouse = { x: -9999, y: -9999 };
    let dots = [];

    function initBg() {
      bw = bgCanvas.width = window.innerWidth;
      bh = bgCanvas.height = window.innerHeight;
      const count = Math.min(48, Math.max(20, Math.floor((bw * bh) / 36000)));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * bw,
        y: Math.random() * bh,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.8,
        alpha: Math.random() * 0.28 + 0.1
      }));
    }

    initBg();
    window.addEventListener('resize', initBg);

    if (isFinePointer) {
      window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }, { passive: true });
      window.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
      });
    }

    function drawBg() {
      if (document.hidden) {
        requestAnimationFrame(drawBg);
        return;
      }
      bctx.clearRect(0, 0, bw, bh);

      // Subtle mouse spotlight glow on background
      if (mouse.x > 0 && mouse.y > 0) {
        const grad = bctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 260);
        grad.addColorStop(0, 'rgba(208, 241, 164, 0.045)');
        grad.addColorStop(1, 'rgba(208, 241, 164, 0)');
        bctx.fillStyle = grad;
        bctx.fillRect(0, 0, bw, bh);
      }

      // Subtle drifting theme particles & faint links
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.x += d.vx;
        d.y += d.vy;

        if (d.x < 0) d.x = bw;
        if (d.x > bw) d.x = 0;
        if (d.y < 0) d.y = bh;
        if (d.y > bh) d.y = 0;

        const dxm = d.x - mouse.x;
        const dym = d.y - mouse.y;
        const distM = Math.hypot(dxm, dym);
        if (distM < 130 && distM > 0) {
          d.x += (dxm / distM) * 0.45;
          d.y += (dym / distM) * 0.45;
        }

        bctx.beginPath();
        bctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        bctx.fillStyle = `rgba(208, 241, 164, ${d.alpha})`;
        bctx.fill();

        for (let j = i + 1; j < dots.length; j++) {
          const d2 = dots[j];
          const dist = Math.hypot(d.x - d2.x, d.y - d2.y);
          if (dist < 130) {
            bctx.beginPath();
            bctx.moveTo(d.x, d.y);
            bctx.lineTo(d2.x, d2.y);
            bctx.strokeStyle = `rgba(182, 204, 170, ${(1 - dist / 130) * 0.08})`;
            bctx.lineWidth = 1;
            bctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawBg);
    }
    requestAnimationFrame(drawBg);
  }

  /* ═══════════════════════════════════════════════════
     2. SCROLL-TRIGGERED ENTRANCE ANIMATIONS
     ═══════════════════════════════════════════════════ */
  const animElements = document.querySelectorAll(
    '.anim-fade-up, .anim-scale-in, .anim-tilt-in, .anim-slide-left, .anim-spin, .anim-split-text'
  );

  function animateSplitText(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = 'true';
    const originalHTML = el.innerHTML;
    const tokens = originalHTML.split(/(\s+|<[^>]+>)/);
    let html = '';
    let charIdx = 0;
    tokens.forEach(token => {
      if (!token) return;
      if (token.startsWith('<') || /^\s+$/.test(token)) {
        html += token;
      } else {
        html += `<span class="split-word">`;
        for (const ch of token) {
          html += `<span class="split-char" style="animation-delay:${charIdx * 24}ms">${ch}</span>`;
          charIdx++;
        }
        html += `</span>`;
      }
    });
    el.innerHTML = html;
    el.classList.add('split-active');
    setTimeout(() => {
      el.innerHTML = originalHTML;
      el.classList.remove('split-active');
    }, charIdx * 24 + 520);
  }

  if (!prefersReducedMotion) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0', 10);
          setTimeout(() => {
            entry.target.classList.add('is-visible');
            if (entry.target.classList.contains('anim-split-text')) {
              animateSplitText(entry.target);
            }
          }, delay);
          animObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.12 });

    animElements.forEach(el => animObserver.observe(el));

    function observeNewCards() {
      const cards = document.querySelectorAll('.featured-card, .archive-card, .career-item, .path-row, .c-box, .approach-grid article');
      cards.forEach(card => {
        if (card.dataset.animObserved) return;
        card.dataset.animObserved = 'true';
        card.classList.add('anim-card-enter');
        const cardObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const siblings = Array.from(entry.target.parentElement.children);
              const idx = siblings.indexOf(entry.target);
              setTimeout(() => entry.target.classList.add('is-visible'), Math.min(idx, 6) * 55);
              cardObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
        cardObserver.observe(card);
      });
    }

    const gridObserver = new MutationObserver(() => requestAnimationFrame(observeNewCards));
    ['featured-grid', 'archive-grid', 'career-list'].forEach(id => {
      const el = document.getElementById(id);
      if (el) gridObserver.observe(el, { childList: true });
    });
    setTimeout(observeNewCards, 80);
  } else {
    animElements.forEach(el => el.classList.add('is-visible'));
  }

  /* ═══════════════════════════════════════════════════
     3. HEADING HOVER COLOR FROM CURSOR ORIGIN
        (Stays strictly in theme, zero extra motion)
     ═══════════════════════════════════════════════════ */
  const HEADING_SELECTOR = 'h1, h2, h3, h4';

  if (isFinePointer) {
    let activeHeading = null;

    document.addEventListener('mousemove', (e) => {
      const heading = e.target.closest(HEADING_SELECTOR);
      if (activeHeading && activeHeading !== heading) {
        activeHeading.classList.remove('heading-hover-active');
        activeHeading = null;
      }
      if (!heading) return;

      const rect = heading.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      heading.style.setProperty('--hx', `${x}px`);
      heading.style.setProperty('--hy', `${y}px`);
      if (!heading.classList.contains('heading-hover-active')) {
        heading.classList.add('heading-hover-active');
      }
      activeHeading = heading;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      if (activeHeading) {
        activeHeading.classList.remove('heading-hover-active');
        activeHeading = null;
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     4. CODEVOPER-STYLE SIMPLE CUSTOM CURSOR
        (Visible everywhere including inside open projects)
     ═══════════════════════════════════════════════════ */
  const cursor = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('custom-cursor-dot');

  if (cursor && cursorDot && isFinePointer && !prefersReducedMotion) {
    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let cursorVisible = false;

    document.body.classList.add('has-custom-cursor');

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!cursorVisible) {
        ringX = mouseX;
        ringY = mouseY;
        cursorVisible = true;
        cursor.classList.add('is-active');
        cursorDot.classList.add('is-active');
      }
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      cursorVisible = false;
      cursor.classList.remove('is-active');
      cursorDot.classList.remove('is-active');
    });

    function animateCursorRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursor.style.left = `${ringX}px`;
      cursor.style.top = `${ringY}px`;
      requestAnimationFrame(animateCursorRing);
    }
    requestAnimationFrame(animateCursorRing);

    const INTERACTIVE = 'a, button, summary, input, [role="button"], .showcase-frame, .c-box, .featured-card, .archive-card, .cs-video-card, .cs-screenshot-card, .cs-pager-card, .filter-button';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(INTERACTIVE)) cursor.classList.add('hovering');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(INTERACTIVE) && !e.relatedTarget?.closest(INTERACTIVE)) {
        cursor.classList.remove('hovering');
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     5. SIMPLE CODEVOPER-STYLE CLICK RIPPLE & PARTICLES
     ═══════════════════════════════════════════════════ */
  const rippleContainer = document.getElementById('click-ripple-container');

  if (rippleContainer && !prefersReducedMotion) {
    document.addEventListener('click', (e) => {
      if (e.clientX === 0 && e.clientY === 0) return;

      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      rippleContainer.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());

      for (let i = 0; i < 6; i++) {
        const dot = document.createElement('span');
        dot.className = 'click-particle';
        const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.4;
        const distance = 28 + Math.random() * 24;
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;
        dot.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        dot.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        rippleContainer.appendChild(dot);
        dot.addEventListener('animationend', () => dot.remove());
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     6. SUBTLE MAGNETIC CTA BUTTONS & HERO PLAYING-CARD FAN
        (Auto gentle float + click gathers cards close / spreads back)
     ═══════════════════════════════════════════════════ */
  if (isFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.16;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.16;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  const heroShowcase = document.getElementById('hero-deck') || document.querySelector('.hero-showcase');
  if (heroShowcase) {
    const frames = Array.from(heroShowcase.querySelectorAll('.showcase-frame'));

    function toggleGatherCards() {
      const gathered = heroShowcase.classList.toggle('is-gathered');
      frames.forEach(f => f.setAttribute('aria-pressed', String(gathered)));
    }

    frames.forEach(frame => {
      frame.setAttribute('aria-pressed', 'false');
      frame.addEventListener('click', (e) => {
        e.preventDefault();
        toggleGatherCards();
      });
      frame.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleGatherCards();
        }
      });
    });

    // Automatic subtle floating motion + smooth mouse parallax
    if (!prefersReducedMotion) {
      let targetMX = 0, targetMY = 0;
      let currentMX = 0, currentMY = 0;

      if (isFinePointer) {
        heroShowcase.addEventListener('mousemove', (e) => {
          const rect = heroShowcase.getBoundingClientRect();
          targetMX = (e.clientX - rect.left) / rect.width - 0.5;
          targetMY = (e.clientY - rect.top) / rect.height - 0.5;
        }, { passive: true });
        heroShowcase.addEventListener('mouseleave', () => {
          targetMX = 0;
          targetMY = 0;
        });
      }

      const phases = [0, 2.1, 4.2];
      function animateHeroDeck(now) {
        if (!document.hidden) {
          const t = now * 0.001;
          currentMX += (targetMX - currentMX) * 0.08;
          currentMY += (targetMY - currentMY) * 0.08;

          frames.forEach((frame, i) => {
            const ph = phases[i % phases.length];
            const depth = (i + 1) * 5;
            const fy = Math.sin(t * 1.25 + ph) * 6.5;
            const fx = Math.cos(t * 0.9 + ph) * 3.0;
            const fr = Math.sin(t * 0.75 + ph) * 0.85;

            frame.style.setProperty('--fx', `${(fx + currentMX * depth).toFixed(2)}px`);
            frame.style.setProperty('--fy', `${(fy + currentMY * depth).toFixed(2)}px`);
            frame.style.setProperty('--fr', `${fr.toFixed(2)}deg`);
          });
        }
        requestAnimationFrame(animateHeroDeck);
      }
      requestAnimationFrame(animateHeroDeck);
    }
  }

  /* ═══════════════════════════════════════════════════
     7. SCROLL PROGRESS BAR & HEADER SCROLL BEHAVIOR
     ═══════════════════════════════════════════════════ */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  const header = document.querySelector('.site-header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
    progressBar.style.transform = `scaleX(${progress})`;

    if (header) {
      if (scrollTop > 100) {
        header.classList.add('header-scrolled');
        if (scrollTop > lastScroll && scrollTop > 280) {
          header.classList.add('header-hidden');
        } else {
          header.classList.remove('header-hidden');
        }
      } else {
        header.classList.remove('header-scrolled', 'header-hidden');
      }
    }
    lastScroll = scrollTop;
  }, { passive: true });

  /* ═══════════════════════════════════════════════════
     8. ARCHIVE FILTER TRANSITION
     ═══════════════════════════════════════════════════ */
  const archiveGrid = document.getElementById('archive-grid');
  if (archiveGrid && !prefersReducedMotion) {
    const filterObserver = new MutationObserver(() => {
      const cards = archiveGrid.querySelectorAll('.archive-card');
      cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, Math.min(i, 8) * 35);
      });
    });
    filterObserver.observe(archiveGrid, { childList: true });
  }

  /* ═══════════════════════════════════════════════════
     9. INITIAL PAGE REVEAL
     ═══════════════════════════════════════════════════ */
  function revealHero() {
    document.body.classList.add('loaded');
    setTimeout(() => {
      document.querySelectorAll('.hero .anim-fade-up, .hero .anim-scale-in, .hero .anim-tilt-in, .hero .anim-split-text').forEach(el => {
        const delay = parseInt(el.dataset.delay || '0', 10);
        setTimeout(() => {
          el.classList.add('is-visible');
          if (el.classList.contains('anim-split-text') && !prefersReducedMotion) {
            animateSplitText(el);
          }
        }, delay);
      });
    }, 120);
  }

  if (document.readyState === 'complete') {
    revealHero();
  } else {
    window.addEventListener('load', revealHero);
  }
})();
