/* Shared page behaviour: mobile menu, nav border on scroll, reveal-on-scroll,
 * copy buttons ([data-copy]), footer year ([data-year]) and the "Log in" label.
 * Loaded with `defer` on every page. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nav = document.getElementById('nav'), btn = document.getElementById('menuBtn');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', scrollY > 4); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  if (nav && btn) {
    var close = function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Open menu'); };
    btn.addEventListener('click', function () {
      var o = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', o); btn.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', close); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });

  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var label = b.textContent;
      function done() { b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = label; }, 1800); }
      if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, done); else done();
    });
  });

  // Signed-in customers (supabase-js keeps the session in localStorage) see
  // "My account" instead of "Log in"; both go to mybookings.html.
  try {
    if (localStorage.getItem('sb-ukoovhgmbqfocalykhyx-auth-token'))
      document.querySelectorAll('[data-login]').forEach(function (a) { a.textContent = 'My account'; });
  } catch (e) {}

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
