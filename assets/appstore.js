/* App Store auto-switch.
 *
 * While Cutz is in App Store review every store CTA says "Coming soon" and
 * points at download.html. This script asks Apple's public lookup API whether
 * the app is live yet; once it is, the whole site flips on its own:
 *   - <html data-app-live> is set, so [data-live-only] shows and [data-soon-only] hides
 *   - every <a data-store> goes to the App Store (also links rendered later by JS,
 *     via the delegated click handler)
 * No code change is needed when Apple approves the app.
 *
 * The result is cached in localStorage (6h while not live, 7 days once live) and
 * applied synchronously from the <head>, so returning visitors see no flash.
 * Pages that render links in JS can use window.cutzAppStore.isLive()/onChange().
 */
(function () {
  var URL_ = 'https://apps.apple.com/app/cutz/id6811618000';
  var APP_ID = '6811618000';
  var KEY = 'cutz.appLive.v1';
  var NOT_LIVE_TTL = 6 * 3600e3, LIVE_TTL = 7 * 864e5;
  var live = false, listeners = [];
  var root = document.documentElement;

  var css = document.createElement('style');
  css.textContent = '[data-live-only]{display:none!important}html[data-app-live] [data-live-only]{display:revert!important}html[data-app-live] [data-soon-only]{display:none!important}';
  (document.head || root).appendChild(css);

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify({ live: v, at: Date.now() })); } catch (e) {} }

  function wire() {
    if (!live) return;
    var links = document.querySelectorAll('a[data-store]');
    for (var i = 0; i < links.length; i++) {
      links[i].href = URL_; links[i].target = '_blank'; links[i].rel = 'noopener';
    }
  }
  function setLive(v) {
    var changed = v !== live;
    live = v;
    if (v) root.setAttribute('data-app-live', '1'); else root.removeAttribute('data-app-live');
    wire();
    if (changed) for (var i = 0; i < listeners.length; i++) { try { listeners[i](live); } catch (e) {} }
  }

  window.cutzAppStore = {
    url: URL_,
    isLive: function () { return live; },
    onChange: function (fn) { listeners.push(fn); }
  };

  // Links built after load (find, map, salon, barber) still go to the store when live.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-store]');
    if (!a) return;
    if (live) {
      if (a.getAttribute('href') !== URL_) { e.preventDefault(); window.open(URL_, '_blank', 'noopener'); }
    } else if (/(^|\/)download\.html$/.test(location.pathname) && /download\.html$/.test(a.getAttribute('href') || '')) {
      e.preventDefault(); // already here; nothing to download yet
    }
  });
  document.addEventListener('DOMContentLoaded', wire);

  var c = read();
  if (c && c.live) setLive(true);
  var fresh = c && typeof c.at === 'number' && Date.now() - c.at < (c.live ? LIVE_TTL : NOT_LIVE_TTL);
  if (fresh) return;

  // iTunes lookup has no CORS headers, but it supports JSONP.
  var countries = ['dk', 'us'], idx = 0, done = false;
  var timer = setTimeout(function () { done = true; }, 6000); // timeout: not live, not cached
  function lookup() {
    var cb = '__cutzAppLookup' + idx;
    var s = document.createElement('script');
    window[cb] = function (d) {
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      s.remove();
      if (done) return;
      if (d && d.resultCount > 0) { done = true; clearTimeout(timer); write(true); setLive(true); return; }
      if (++idx < countries.length) return lookup();
      done = true; clearTimeout(timer); write(false); setLive(false);
    };
    s.src = 'https://itunes.apple.com/lookup?id=' + APP_ID + '&country=' + countries[idx] + '&callback=' + cb;
    s.async = true;
    s.onerror = function () { done = true; clearTimeout(timer); };
    (document.head || root).appendChild(s);
  }
  lookup();
})();
