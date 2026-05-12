(function () {
  'use strict';

  var btn = document.getElementById('hamburger-btn');
  var nav = document.getElementById('site-nav');

  if (!btn || !nav) return;

  function openMenu() {
    nav.classList.add('is-open');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (nav.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Toggle on hamburger click
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking outside the header
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && e.target !== btn) {
      closeMenu();
    }
  });

  // Close when a nav link is tapped
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      closeMenu();
    });
  });

  // Close menu if viewport grows past mobile breakpoint
  var mq = window.matchMedia('(min-width: 768px)');
  function handleBreakpoint(e) {
    if (e.matches) closeMenu();
  }
  if (mq.addEventListener) {
    mq.addEventListener('change', handleBreakpoint);
  } else if (mq.addListener) {
    mq.addListener(handleBreakpoint);
  }
})();
