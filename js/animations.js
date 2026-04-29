(function () {
  function runBasicReveal() {
    var cards = document.querySelectorAll('.product-card, .ix-review-card, .ix-benefit');
    if (!cards.length || !window.gsap) return;
    window.gsap.from(cards, {
      y: 14,
      opacity: 0,
      duration: 0.35,
      stagger: 0.03,
      ease: 'power1.out',
      clearProps: 'all'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBasicReveal);
  } else {
    runBasicReveal();
  }
})();
