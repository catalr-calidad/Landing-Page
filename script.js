// Fade-in on scroll.
// threshold: 0 + a negative bottom rootMargin means "reveal as soon as the
// element starts entering the viewport" instead of waiting for 15% of its
// full height to be visible — that previous setting left tall sections
// (Servicios, El riesgo) blank for a noticeable stretch while scrolling.
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
fadeEls.forEach((el) => observer.observe(el));

// Staggered reveals: sections marked .stagger reveal their direct children
// one after another instead of all at once. Capped at 8 steps — past that the
// last item feels laggy rather than choreographed.
const staggerGroups = document.querySelectorAll('.stagger');
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('stagger-active');
    const items = entry.target.querySelectorAll(':scope > *');
    items.forEach((item, i) => {
      item.style.transitionDelay = `${Math.min(i, 8) * 90}ms`;
      item.classList.add('lift-in');
    });
    staggerObserver.unobserve(entry.target);
  });
}, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
staggerGroups.forEach((el) => staggerObserver.observe(el));

// Scroll progress bar
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progressBar.style.width = `${pct}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
}

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle (section links dropdown)
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Cursor spotlight on the dark hero section (mouse-only, respects reduced-motion)
const heroDark = document.querySelector('.hero-dark');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

if (heroDark && !prefersReducedMotion && hasFinePointer) {
  heroDark.addEventListener('mousemove', (event) => {
    const rect = heroDark.getBoundingClientRect();
    heroDark.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    heroDark.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  });
  heroDark.addEventListener('mouseenter', () => heroDark.classList.add('spotlight-active'));
  heroDark.addEventListener('mouseleave', () => heroDark.classList.remove('spotlight-active'));
}

// 3D seal: tilt toward the cursor. The CSS keyframe spin lives on an inner
// element so this tilt transform on the wrapper doesn't fight the animation.
const sealScene = document.getElementById('seal-scene');
if (sealScene && !prefersReducedMotion && hasFinePointer) {
  const sealBand = sealScene.closest('.seal-band') || sealScene;
  sealBand.addEventListener('mousemove', (event) => {
    const rect = sealScene.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (event.clientX - cx) / rect.width;
    const dy = (event.clientY - cy) / rect.height;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    sealScene.style.setProperty('--tilt-y', `${clamp(dx) * 22}deg`);
    sealScene.style.setProperty('--tilt-x', `${clamp(-dy) * 18}deg`);
  });
  sealBand.addEventListener('mouseleave', () => {
    sealScene.style.setProperty('--tilt-y', '0deg');
    sealScene.style.setProperty('--tilt-x', '0deg');
  });
}

// Extrude the holographic check: stack copies of the same SVG along Z. CSS
// can't extrude a path, so the depth you see when it swings is these layers —
// dim cyan at the back fading up to a white, blooming front face.
const holoCheck = document.getElementById('holo-check');
if (holoCheck) {
  const base = holoCheck.querySelector('.holo-check-svg');
  const LAYERS = 16;
  const DEPTH = 30; // total thickness in px
  const frag = document.createDocumentFragment();
  for (let i = 0; i < LAYERS - 1; i++) {
    const t = i / (LAYERS - 1);            // 0 = back, ~1 = just behind front
    const layer = base.cloneNode(true);
    layer.style.transform = `translateZ(${(-DEPTH + t * DEPTH).toFixed(2)}px)`;
    // On the light ground the depth has to be DARKER than the face, not
    // brighter, or the extrusion disappears into the cream. Back slices are
    // deep violet-navy, drifting to a vivid blue just behind the front face.
    layer.style.opacity = '1';
    const hue = 252 - t * 34;                              // 252 violet -> 218 blue
    const light = 26 + t * 16;                             // 26% -> 42%
    layer.style.color = `hsl(${hue.toFixed(0)} ${(64 + t * 18).toFixed(0)}% ${light.toFixed(0)}%)`;
    frag.appendChild(layer);
  }
  holoCheck.insertBefore(frag, base);
  base.classList.add('is-front');
  base.style.transform = 'translateZ(0px)';
}

// Pause the seal's continuous 3D rotation while it's off-screen so it isn't
// burning GPU/battery for something nobody is looking at.
if (sealScene) {
  const sealVisibility = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      sealScene.classList.toggle('seal-paused', !entry.isIntersecting);
    });
  }, { threshold: 0 });
  sealVisibility.observe(sealScene);
}

// Hero decorative orbs: slow scroll drift (decorative layers only — never the
// copy itself, which would hurt reading comfort).
const heroOrbs = document.querySelectorAll('.hero-orb');
if (heroOrbs.length && !prefersReducedMotion) {
  let ticking = false;
  const driftOrbs = () => {
    const y = window.scrollY;
    heroOrbs.forEach((orb, i) => {
      orb.style.setProperty('--drift', `${y * (0.06 + i * 0.04)}px`);
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(driftOrbs);
    }
  }, { passive: true });
}

// Services carousel: scroll by one "page" (however many cards currently fit)
const servicesTrack = document.getElementById('services-track');
const prevArrow = document.querySelector('.carousel-prev');
const nextArrow = document.querySelector('.carousel-next');

const dotsWrap = document.getElementById('carousel-dots');

if (servicesTrack && prevArrow && nextArrow) {
  // Page count depends on how many cards fit at the current breakpoint, so
  // the dots are rebuilt on resize rather than hardcoded.
  let pageCount = 1;

  const buildDots = () => {
    if (!dotsWrap) return;
    pageCount = Math.max(1, Math.round(servicesTrack.scrollWidth / servicesTrack.clientWidth));
    dotsWrap.innerHTML = '';
    for (let i = 0; i < pageCount; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir al grupo ${i + 1} de ${pageCount}`);
      dot.addEventListener('click', () => {
        servicesTrack.scrollTo({ left: i * servicesTrack.clientWidth, behavior: 'smooth' });
      });
      dotsWrap.appendChild(dot);
    }
  };

  const updateUI = () => {
    const maxScroll = servicesTrack.scrollWidth - servicesTrack.clientWidth;
    prevArrow.disabled = servicesTrack.scrollLeft <= 4;
    nextArrow.disabled = servicesTrack.scrollLeft >= maxScroll - 4;
    if (!dotsWrap) return;
    const current = Math.round(servicesTrack.scrollLeft / servicesTrack.clientWidth);
    [...dotsWrap.children].forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  };

  prevArrow.addEventListener('click', () => {
    servicesTrack.scrollBy({ left: -servicesTrack.clientWidth, behavior: 'smooth' });
  });
  nextArrow.addEventListener('click', () => {
    servicesTrack.scrollBy({ left: servicesTrack.clientWidth, behavior: 'smooth' });
  });

  servicesTrack.addEventListener('scroll', updateUI, { passive: true });
  window.addEventListener('resize', () => { buildDots(); updateUI(); });
  buildDots();
  updateUI();
}

// Route map (La Transformación): tap/click toggles the tooltip on touch
// devices, since hover alone doesn't exist there. Desktop still gets the
// CSS :hover reveal for free; this just adds the tap fallback and closes
// any other open tooltip so only one shows at a time.
const routeStops = document.querySelectorAll('.route-stop');
routeStops.forEach((stop) => {
  stop.addEventListener('click', () => {
    const isOpen = stop.classList.contains('show-tip');
    routeStops.forEach((s) => {
      s.classList.remove('show-tip');
      s.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      stop.classList.add('show-tip');
      stop.setAttribute('aria-expanded', 'true');
    }
  });
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.route-stop')) {
    routeStops.forEach((s) => {
      s.classList.remove('show-tip');
      s.setAttribute('aria-expanded', 'false');
    });
  }
});

// Contact form: visual-only demo submission.
// To go live, replace this handler with one of:
//   - Formspree/Getform: change <form> action + method, remove preventDefault.
//   - A fetch() call to your own backend or WhatsApp API.
const form = document.getElementById('contact-form');
const successMessage = document.getElementById('form-success');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  form.reset();
  successMessage.classList.remove('hidden');
  successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
