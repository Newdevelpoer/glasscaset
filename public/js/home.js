/* ═══════════════════════════════════════════════════
   HOME.JS  —  Home page specific logic
═══════════════════════════════════════════════════ */
(function () {
  /* Count-up animation for stat numbers */
  function initCountUp() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll('[data-to]').forEach(el => {
          const target = +el.dataset.to;
          let cur = 0;
          const step = target / 45;
          const t = setInterval(() => {
            cur = Math.min(cur + step, target);
            el.textContent = Math.round(cur);
            if (cur >= target) clearInterval(t);
          }, 28);
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stats').forEach(el => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', initCountUp);
})();
