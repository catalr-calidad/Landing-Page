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

const navScrim = document.getElementById('nav-scrim');

if (navToggle && mainNav) {
  // The dropdown alone read as "half-finished overlay" in testing, because the
  // page kept showing through underneath it. The scrim makes it read as a
  // deliberate menu and gives a tap target for dismissing it.
  const setNav = (open) => {
    mainNav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    if (navScrim) navScrim.hidden = !open;
    document.body.classList.toggle('nav-open', open);
  };

  navToggle.addEventListener('click', () => setNav(!mainNav.classList.contains('open')));
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNav(false));
  });
  if (navScrim) navScrim.addEventListener('click', () => setNav(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mainNav.classList.contains('open')) setNav(false);
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

// Emblem: tilt toward the cursor. This is the only motion it has at rest —
// the skill's guidance is explicit that infinite animation belongs on loaders,
// not decorative marks, so the seal reveals once and then responds to hover.
const emblemWrap = document.getElementById('emblem-wrap');
if (emblemWrap && !prefersReducedMotion && hasFinePointer) {
  const band = emblemWrap.closest('.seal-band') || emblemWrap;
  const tiltTarget = emblemWrap.querySelector('.emblem-tilt');
  band.addEventListener('mousemove', (event) => {
    const rect = emblemWrap.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
    const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    tiltTarget.style.setProperty('--tilt-y', `${clamp(dx) * 16}deg`);
    tiltTarget.style.setProperty('--tilt-x', `${clamp(-dy) * 13}deg`);
  });
  band.addEventListener('mouseleave', () => {
    tiltTarget.style.setProperty('--tilt-y', '0deg');
    tiltTarget.style.setProperty('--tilt-x', '0deg');
  });
}

// Emblem draws itself in once when it first enters view, then rests.
if (emblemWrap) {
  const emblemObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      emblemObserver.unobserve(entry.target);
    });
  }, { threshold: 0.25 });
  emblemObserver.observe(emblemWrap);
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
  // Paging is measured from the cards themselves, not from the track width.
  // Deriving it from scrollWidth/clientWidth produced 5 dots for 6 cards on
  // mobile — the sixth service was reachable only with the arrow — because a
  // partially visible "peek" card makes that ratio fractional.
  let pageCount = 1;
  let perView = 1;
  let step = 0;

  const measure = () => {
    const cards = servicesTrack.querySelectorAll('.service-card');
    if (!cards.length) return;
    const gap = parseFloat(getComputedStyle(servicesTrack).gap) || 0;
    const cardOuter = cards[0].getBoundingClientRect().width + gap;
    perView = Math.max(1, Math.floor((servicesTrack.clientWidth + gap) / cardOuter));
    step = perView * cardOuter;
    pageCount = Math.max(1, Math.ceil(cards.length / perView));
  };

  const buildDots = () => {
    measure();
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (let i = 0; i < pageCount; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir al grupo ${i + 1} de ${pageCount}`);
      dot.addEventListener('click', () => {
        servicesTrack.scrollTo({ left: i * step, behavior: 'smooth' });
      });
      dotsWrap.appendChild(dot);
    }
  };

  const hint = document.getElementById('carousel-hint');
  const cards = servicesTrack.querySelectorAll('.service-card');

  const updateUI = () => {
    const maxScroll = servicesTrack.scrollWidth - servicesTrack.clientWidth;
    prevArrow.disabled = servicesTrack.scrollLeft <= 4;
    nextArrow.disabled = servicesTrack.scrollLeft >= maxScroll - 4;

    // Say which of the six are on screen. Testing showed visitors assumed the
    // three visible cards were the whole offer and never touched the arrows.
    if (hint && cards.length) {
      const trackLeft = servicesTrack.getBoundingClientRect().left;
      const trackRight = trackLeft + servicesTrack.clientWidth;
      const shown = [...cards]
        .map((card, i) => ({ i, box: card.getBoundingClientRect() }))
        .filter(({ box }) => box.left >= trackLeft - 8 && box.right <= trackRight + 8)
        .map(({ i }) => i + 1);
      if (shown.length) {
        const range = shown.length > 1
          ? `${shown[0]}–${shown[shown.length - 1]}`
          : `${shown[0]}`;
        hint.textContent = `Viendo ${range} de ${cards.length} servicios`;
      }
    }

    if (!dotsWrap || !step) return;
    const current = Math.min(pageCount - 1, Math.round(servicesTrack.scrollLeft / step));
    [...dotsWrap.children].forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  };

  prevArrow.addEventListener('click', () => {
    servicesTrack.scrollBy({ left: -(step || servicesTrack.clientWidth), behavior: 'smooth' });
  });
  nextArrow.addEventListener('click', () => {
    servicesTrack.scrollBy({ left: step || servicesTrack.clientWidth, behavior: 'smooth' });
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

// Contact form: real delivery, no backend.
// The site is a static page on GitHub Pages, so there is nothing to POST to.
// Instead the form composes the visitor's answers into a WhatsApp message and
// opens the chat with it pre-written — the same channel every other CTA uses,
// and the one this audience actually replies on. The mailto fallback in the
// markup covers anyone without WhatsApp.
const WHATSAPP_NUMBER = '573112468627';
const form = document.getElementById('contact-form');
const successMessage = document.getElementById('form-success');

if (form && successMessage) {
  const showError = (field, message) => {
    const slot = form.querySelector(`.field-error[data-for="${field.id}"]`);
    if (slot) slot.textContent = message;
    field.classList.toggle('has-error', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  // Clear a field's error as soon as the visitor starts fixing it, rather than
  // making them submit again to find out whether it's resolved.
  ['name', 'establishment', 'phone'].forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('input', () => showError(field, ''));
    field.addEventListener('change', () => showError(field, ''));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameField = document.getElementById('name');
    const establishmentField = document.getElementById('establishment');
    const phoneField = document.getElementById('phone');
    const messageField = document.getElementById('message');

    const name = nameField.value.trim();
    const phone = phoneField.value.trim();
    const note = messageField.value.trim();

    let firstInvalid = null;
    const require = (field, ok, message) => {
      showError(field, ok ? '' : message);
      if (!ok && !firstInvalid) firstInvalid = field;
    };

    require(nameField, name.length > 1, 'Escribe tu nombre para saber cómo llamarte.');
    require(establishmentField, establishmentField.value !== '', 'Selecciona el tipo de establecimiento.');
    // Colombian mobile numbers are 10 digits; accept anything with at least 7
    // so landlines and pasted formats with spaces or +57 still go through.
    require(phoneField, (phone.match(/\d/g) || []).length >= 7, 'Déjanos un número al que podamos escribirte.');

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const establishment = establishmentField.options[establishmentField.selectedIndex].text;
    const lines = [
      `Hola Catalina, soy ${name}.`,
      `Tipo de establecimiento: ${establishment}`,
      `Mi WhatsApp: ${phone}`,
    ];
    if (note) lines.push(`Mi situación: ${note}`);
    lines.push('Quiero agendar el diagnóstico.');

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener');

    form.reset();
    successMessage.classList.remove('hidden');
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// The floating WhatsApp button sits over the copy while you read. Hide it while
// the contact section — which carries the same action, larger — is on screen,
// so it stops covering words exactly where the page is asking to be read.
const whatsappFloat = document.querySelector('.whatsapp-float');
const contactSection = document.getElementById('contacto');
if (whatsappFloat) {
  let overContact = false;

  if (contactSection) {
    const floatObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        overContact = entry.isIntersecting;
        whatsappFloat.classList.toggle('is-tucked', overContact);
      });
    }, { threshold: 0 });
    floatObserver.observe(contactSection);
  }

  // Reading down the page is when the button is in the way, so it steps aside
  // while you scroll forward and comes back the moment you scroll up — the
  // header CTA stays available the whole time either way.
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const goingDown = y > lastY + 6;
    const goingUp = y < lastY - 6;
    if (goingDown || goingUp) {
      if (!overContact) whatsappFloat.classList.toggle('is-tucked', goingDown && y > 400);
      lastY = y;
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
}
