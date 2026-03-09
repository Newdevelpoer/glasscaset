/* ═══════════════════════════════════════════════════
   ABOUT.JS  —  About Her page logic
═══════════════════════════════════════════════════ */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Parallax hero background on scroll
    const heroBgImg = document.querySelector('.hbg img');
    if (heroBgImg) {
      window.addEventListener('scroll', () => {
        heroBgImg.style.transform = 'scale(1.05) translateY(' + (window.scrollY * 0.2) + 'px)';
      }, { passive: true });
    }
  });
})();
