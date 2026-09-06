/* ================================================================
   47 · RESPONSIVE SHELL — the behaviour half of css/44-responsive.css

   · tablets (≤1180px): the sidebar auto-collapses to the icon rail
     (the user can still expand it; that choice wins while it lasts)
   · phones (≤767px): the sidebar is an off-canvas drawer opened from
     the mobile top bar; it closes on selection, scrim tap or Escape
   · tables rendered inside #usMain get a horizontal-scroll wrapper so a
     wide table scrolls inside its card instead of widening the page
   · the mobile bar shows which module is open

   Loads last (after 45-focus-trap.js). Wraps renderModule/openPatientFile
   by name — they are classic-script globals, so the wrappers apply to
   every caller.
================================================================ */
(function () {
  var uv = document.getElementById('universeView');
  var sb = document.getElementById('universeSidebar');
  if (!uv || !sb) return;

  var mqMobile = window.matchMedia('(max-width: 767px)');
  var mqTablet = window.matchMedia('(max-width: 1180px)');
  var modLabel = document.getElementById('usMobileMod');
  var menuBtn = document.getElementById('usMenuBtn');

  /* ---------- drawer ---------- */
  function openNav() {
    uv.classList.add('nav-open');
    document.body.classList.add('us-nav-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeNav() {
    uv.classList.remove('nav-open');
    document.body.classList.remove('us-nav-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }
  window.toggleMobileNav = function () { uv.classList.contains('nav-open') ? closeNav() : openNav(); };
  window.closeMobileNav = closeNav;

  var nav = document.getElementById('usNav');
  /* capture phase: runs before the phase-demo lock handler on locked modules
     (js/28 stops propagation there), so the drawer closes and the lock toast is visible */
  if (nav) nav.addEventListener('click', function (e) {
    if (e.target.closest('button[data-mod]') && mqMobile.matches) closeNav();
  }, true);
  var brand = sb.querySelector('.us-brand-btn');
  if (brand) brand.addEventListener('click', function () { if (mqMobile.matches) closeNav(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && uv.classList.contains('nav-open')) closeNav();
  });

  /* ---------- module label in the mobile bar ---------- */
  function setLabel(txt) { if (modLabel && txt) modLabel.textContent = txt; }
  if (typeof renderModule === 'function') {
    var _renderModule = renderModule;
    renderModule = function (key) {
      var r = _renderModule.apply(this, arguments);
      var b = nav && nav.querySelector('button[data-mod="' + key + '"]');
      setLabel(b ? (b.dataset.label || b.textContent.trim()) : key);
      return r;
    };
  }
  if (typeof openPatientFile === 'function') {
    var _openPatientFile = openPatientFile;
    openPatientFile = function (id) {
      var r = _openPatientFile.apply(this, arguments);
      var pt = (typeof DATA !== 'undefined' && DATA.patients) ? DATA.patients.find(function (p) { return p.id === id; }) : null;
      setLabel(pt ? pt.name : 'Patient');
      return r;
    };
  }

  /* ---------- collapse on tablets, full drawer on phones ---------- */
  function collapsed() { return sb.classList.contains('collapsed'); }
  function setCollapsed(on) {
    sb.classList.toggle('collapsed', on);
    uv.classList.toggle('sidebar-collapsed', on);
  }
  var state = { autoCollapsed: false, wasCollapsedBeforeMobile: null };

  function apply() {
    if (mqMobile.matches) {
      closeNav();
      if (state.wasCollapsedBeforeMobile === null) {
        state.wasCollapsedBeforeMobile = collapsed();
        if (collapsed()) setCollapsed(false);
      }
      return;
    }
    if (state.wasCollapsedBeforeMobile !== null) {
      setCollapsed(state.wasCollapsedBeforeMobile);
      state.wasCollapsedBeforeMobile = null;
    }
    if (mqTablet.matches) {
      if (!collapsed()) { setCollapsed(true); state.autoCollapsed = true; }
    } else if (state.autoCollapsed) {
      setCollapsed(false); state.autoCollapsed = false;
    }
  }
  /* an explicit click on the collapse button is the user's choice: stop auto-managing */
  var cbtn = sb.querySelector('.us-collapse-btn');
  if (cbtn) cbtn.addEventListener('click', function () { state.autoCollapsed = false; });

  function onChange() { apply(); }
  if (mqMobile.addEventListener) { mqMobile.addEventListener('change', onChange); mqTablet.addEventListener('change', onChange); }
  else { mqMobile.addListener(onChange); mqTablet.addListener(onChange); }
  /* restoreSidebar() in js/26 runs on DOMContentLoaded — apply after it */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(apply, 0); });
  else setTimeout(apply, 0);

  /* ---------- first-time guide (js/46): its "Your modules" step spotlights #usNav,
     which on phones lives in the drawer — open it for that step, close it after ---------- */
  if ('MutationObserver' in window) {
    var ftuOpened = false;
    new MutationObserver(function () {
      if (!mqMobile.matches) return;
      var root = document.querySelector('.ftu-root'), t = document.querySelector('.ftu-title');
      var active = !!(root && !root.hidden && t && /modules/i.test(t.textContent));
      if (active && !ftuOpened) { ftuOpened = true; openNav(); }
      else if (!active && ftuOpened) { ftuOpened = false; closeNav(); }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  }

  /* ---------- wide tables scroll inside their card ---------- */
  var main = document.getElementById('usMain');
  function wrapTables(root) {
    var tables = root.querySelectorAll ? root.querySelectorAll('table') : [];
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      if (t.closest('.rs-table-wrap, .pt-list-table-wrap, .scrollx, .table-wrap, .scroller')) continue;
      if (t.parentElement && t.parentElement.closest('table')) continue; /* nested tables ride with their parent */
      var w = document.createElement('div');
      w.className = 'rs-table-wrap';
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    }
  }
  if (main && 'MutationObserver' in window) {
    wrapTables(main);
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; wrapTables(main); });
    }).observe(main, { childList: true, subtree: true });
  }
})();
