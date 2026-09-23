(function () {
  'use strict';

  function initScrollReveal() {
    var revealSelector = [
      '.reveal-section',
      '.reveal-card',
      '.reveal-left',
      '.reveal-right',
      '.reveal-up',
      '.reveal-fade'
    ].join(',');
    var revealElements = Array.prototype.slice.call(document.querySelectorAll(revealSelector));

    if (!revealElements.length) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(function (element) {
        element.classList.add('is-visible');
      });
      return;
    }

    document.documentElement.classList.add('reveal-ready');

    var staggerParents = document.querySelectorAll(
      '.stage-flow, .process-grid, .problem-grid, .comparison-grid, .proof-grid, .help-grid, .product-grid'
    );

    staggerParents.forEach(function (parent) {
      var cards = parent.querySelectorAll('.reveal-card');
      cards.forEach(function (card, index) {
        card.style.setProperty('--reveal-delay', Math.min(index, 5) * 90 + 'ms');
      });
    });

    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.01
    });

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var isPast = !entry.isIntersecting && entry.boundingClientRect.bottom <= window.innerHeight * 0.18;
        entry.target.classList.toggle('is-past', isPast);
      });
    }, {
      rootMargin: '-18% 0px -72% 0px',
      threshold: 0
    });

    document.querySelectorAll('.reveal-section').forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  initScrollReveal();
})();
