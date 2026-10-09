/* Shared page behaviour: mobile menu, nav border on scroll, reveal-on-scroll,
 * copy buttons ([data-copy]), footer year ([data-year]) and the LAUNCH code
 * status ([data-launch-status]). Loaded with `defer` on every page. */
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

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  var status = document.querySelectorAll('[data-launch-status]');
  if (status.length) {
    var SB_URL = 'https://ukoovhgmbqfocalykhyx.supabase.co';
    // Public anon key: only reaches RLS-protected public views and RPCs.
    var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrb292aGdtYnFmb2NhbHlraHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTIxMzksImV4cCI6MjA5NzM4ODEzOX0.sgPaplaU840VLD89UgV1fIlQcfDXMOVonhMXdvjlzl4';
    fetch(SB_URL + '/rest/v1/rpc/check_referral_code', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: 'LAUNCH' })
    }).then(function (r) { return r.json(); }).then(function (d) {
      status.forEach(function (el) {
        el.hidden = false;
        var t = el.querySelector('.txt');
        if (d && d.valid) t.textContent = 'Live: still available';
        else { el.classList.add('off'); t.textContent = 'All 10 spots have been claimed'; }
      });
    }).catch(function () {});
  }
})();
