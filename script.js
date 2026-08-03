// Fade-in on scroll
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
fadeEls.forEach((el) => observer.observe(el));

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Cursor spotlight on the hero panel (mouse-only, respects reduced-motion)
const heroPanel = document.querySelector('.hero-panel');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

if (heroPanel && !prefersReducedMotion && hasFinePointer) {
  heroPanel.addEventListener('mousemove', (event) => {
    const rect = heroPanel.getBoundingClientRect();
    heroPanel.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    heroPanel.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  });
  heroPanel.addEventListener('mouseenter', () => heroPanel.classList.add('spotlight-active'));
  heroPanel.addEventListener('mouseleave', () => heroPanel.classList.remove('spotlight-active'));
}

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
