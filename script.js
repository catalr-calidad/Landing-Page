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

// Services carousel: scroll by one "page" (however many cards currently fit)
const servicesTrack = document.getElementById('services-track');
const prevArrow = document.querySelector('.carousel-prev');
const nextArrow = document.querySelector('.carousel-next');

if (servicesTrack && prevArrow && nextArrow) {
  const updateArrows = () => {
    const maxScroll = servicesTrack.scrollWidth - servicesTrack.clientWidth;
    prevArrow.disabled = servicesTrack.scrollLeft <= 4;
    nextArrow.disabled = servicesTrack.scrollLeft >= maxScroll - 4;
  };

  prevArrow.addEventListener('click', () => {
    servicesTrack.scrollBy({ left: -servicesTrack.clientWidth, behavior: 'smooth' });
  });
  nextArrow.addEventListener('click', () => {
    servicesTrack.scrollBy({ left: servicesTrack.clientWidth, behavior: 'smooth' });
  });

  servicesTrack.addEventListener('scroll', updateArrows);
  window.addEventListener('resize', updateArrows);
  updateArrows();
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
