/* ================================================================
   FTU — first-time-user guide for EVO Connect (spotlight tour)
   ----------------------------------------------------------------
   Loaded after js/35: a consumer of the page, never a provider. It
   reads STELLA_HANDOFF, CURRENT_PT / CURRENT_PT_TAB and the DOM that
   js/15, js/25, js/35 and js/44 render; it calls only public entry
   points (openPatientFile, setPatientTab, renderModule, the real
   Calculate button). Nothing here writes to a case, a decision or an
   order, and nothing crosses to STELLA.

   Two guides:
     · "handoff" — the case arrived from STELLA (body.sh-handoff-active).
       Walks circuit 1 end to end: pinned case reference → locked STELLA
       recommendation → pre-filled inputs → choose methods → calculate →
       compare → record the decision → order in STELLA → the order
       returns.
     · "direct" — EVO Connect opened on its own: modules → registry →
       open a file → journey → inputs → methods → calculate → compare →
       decision → order in STELLA.

   Behaviour: starts once per browser (localStorage `evo_ftu_v1`),
   always skippable, relaunchable from the "Guide" beacon, keyboard
   complete (→ / Enter next, ← back, Esc leaves), announces each step
   to assistive tech, honours prefers-reduced-motion. URL switches for
   rehearsals: ?ftu=1 resets and starts · ?ftu=0 quiet for this load ·
   ?ftu=off never auto-start on this browser · ?ftu=on re-enable.
================================================================ */
(function () {
  'use strict';

  var KEY = 'evo_ftu_v1';
  var CARD_W = 380, GAP = 14, PAD = 8, MARGIN = 16;

  /* ---------- URL switch (read before anything strips the query) ---------- */
  var urlFlag = null;
  try { urlFlag = new URLSearchParams(location.search).get('ftu'); } catch (e) {}

  /* ---------- storage ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(patch) {
    var s = load(); Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  if (urlFlag === '1') { try { localStorage.removeItem(KEY); } catch (e) {} }
  if (urlFlag === 'off') save({ auto: false });
  if (urlFlag === 'on') save({ auto: true });

  /* ---------- small helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function visible(n) {
    if (!n || !n.getClientRects().length) return false;
    var cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    var r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0;
  }
  function isHandoff() { return document.body.classList.contains('sh-handoff-active') && !!$('.sh-strip'); }
  function ptOpen() { return !!$('#ptMainContent'); }
  function listOpen() { return !!$('.pt-list-hero'); }
  function stepSection(n) {
    var hit = $$('#ptMainContent .sf-step-num').filter(function (x) { return x.textContent.trim() === String(n); })[0];
    return hit ? hit.closest('.pd-section') : null;
  }
  function scrollParent(n) {
    var p = n && n.parentElement;
    while (p && p !== document.body) {
      var cs = getComputedStyle(p);
      if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) return p;
      p = p.parentElement;
    }
    return null;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function waitFor(test, timeout) {
    timeout = timeout || 2500;
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function tick() {
        var v = null; try { v = test(); } catch (e) {}
        if (v) return resolve(v);
        if (Date.now() - t0 > timeout) return resolve(null);
        setTimeout(tick, 60);
      })();
    });
  }
  function hand() { return window.STELLA_HANDOFF || null; }
  function handEye() { var h = hand(); if (!h) return ''; return (h.eyes.indexOf(h.ui && h.ui.eye) >= 0 ? h.ui.eye : h.eyes[0]) || ''; }
  function handSize() { var h = hand(); if (!h) return ''; var E = handEye(); return (h.stella && h.stella[E] && h.stella[E].size) || ''; }
  function peekBeacon() { document.body.classList.add('ftu-peek'); }
  /* once a file is open, land on its sizing tab (where the circuit lives) */
  function sizingTab() {
    return waitFor(ptOpen, 2500).then(function () {
      if (typeof window.setPatientTab === 'function' && window.CURRENT_PT_TAB !== 'sizing') window.setPatientTab('sizing');
      return waitFor(function () { return $('.sf-run-btn'); }, 2500);
    });
  }
  function resultsShown() { var r = $('#sfResults'); return visible(r) && !!$('#sfResultsList .sf-comp-grid, #sfResultsList .sh-grid, #sfResultsList [class*="card"]'); }

  /* ---------- SVG glyphs (no emoji as icons) ---------- */
  var ICO = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 015.4.9c0 1.9-2.7 2.3-2.7 4"/><path d="M12 17.6h.01"/></svg>'
  };

  /* ================================================================
     THE TWO GUIDES
     step = { id, tag, title, body, why, target, placement, scroll,
              holeMax, when, before, interactive, primary, action,
              ready }
     target: selector or function → element (null = centred card)
  ================================================================ */
  var TOURS = {};

  TOURS.handoff = {
    doneKey: 'handoff',
    steps: [
      { id: 'welcome', tag: 'Welcome', target: null,
        title: 'Welcome to EVO Connect',
        body: function () {
          var h = hand();
          return 'Your case from STELLA came with you — <b>' + esc(h ? h.caseId : 'the case') + ' · ' + esc(h ? h.eyes.join(' / ') : '') +
            '</b>, its inputs and STELLA’s <b>' + esc(handSize()) + ' mm</b> recommendation.</p><p>This short guide walks the whole circuit: compare, decide, and order back in STELLA. About two minutes.';
        },
        why: 'Nothing you do here is written back to STELLA. STELLA stays the system of record.',
        primary: 'Start the guide' },

      { id: 'strip', tag: 'Your case', target: '.sh-strip', placement: 'bottom',
        title: 'The case reference stays pinned',
        body: function () {
          var h = hand();
          return '<b>From STELLA · ' + esc(h ? h.caseId : '') + ' · ' + esc(handEye()) + ' · STELLA ' + esc(handSize()) + ' mm</b>. This bar follows you while you scroll, so you always know which case — and which eye — you are working on.';
        },
        why: 'It is the wrong-patient safeguard the brief asks for, and a reminder that you are now in an external service.' },

      { id: 'panel', tag: 'Reference', target: '.sh-panel', placement: 'left', scroll: 'start',
        title: 'STELLA’s recommendation, locked',
        body: 'Calculated by STAAR, inside STELLA, with its own parameters. It is the reference for everything on this page: it cannot be edited, hidden or reordered — and nothing EVO Connect does can influence it.',
        why: 'Open <b>from STELLA · 11 inputs</b> to see exactly what travelled: the minimum data set, each value with its modality and source device.' },

      { id: 'eyes', tag: 'Reference', target: '.sh-panel .sh-eyes', placement: 'left',
        when: function () { var h = hand(); return !!(h && h.eyes.length > 1 && $('.sh-panel .sh-eyes')); },
        title: 'Two eyes arrived separately',
        body: 'Switch <b>OD / OS</b> here. Each eye keeps its own inputs, its own STELLA recommendation and its own decision.' },

      { id: 'inputs', tag: 'Inputs', target: function () { return stepSection(1); }, placement: 'bottom', scroll: 'start', holeMax: 380,
        title: 'Inputs arrived pre-filled',
        body: 'Every value STELLA sent is tagged <b>from STELLA</b>, with its source: manifest refraction, IOLMaster keratometry and biometry, Pentacam pachymetry. K-mean is derived here from STELLA’s K1 / K2.',
        why: 'You may edit a value. It is then marked <b>Edited by surgeon</b> and one click resets it to STELLA’s. The edit never travels back.' },

      { id: 'methods', tag: 'Compare', target: '.sf-formulas-grid', placement: 'bottom', scroll: 'start',
        title: 'Choose what to compare',
        body: 'Tick any of <b>ICL Guru, ICLFIT and CASIA2</b> — one, two or all three. The STELLA recommendation is always included and always shown first.',
        why: 'No method is ranked, favoured or pre-selected for you. Comparing is optional; judging is yours.' },

      { id: 'calculate', tag: 'Compare', target: '.sf-run-btn', placement: 'right', scroll: 'center', interactive: true,
        title: 'Run the comparison',
        body: 'Press <b>Calculate</b> and every selected method runs on the same inputs, next to STELLA. Nothing is sent anywhere — the methods run here.',
        primary: function () { return resultsShown() ? null : 'Run it now'; },
        action: function () { var b = $('.sf-run-btn'); if (b) b.click(); return waitFor(resultsShown, 3000); },
        ready: resultsShown },

      { id: 'results', tag: 'Compare', target: '#sfResults', placement: 'bottom', scroll: 'start', holeMax: 430,
        title: 'Read the results side by side',
        body: 'Each card shows the recommended size, the predicted vault when the method provides one, the source and device behind it, and <b>Δ vs STELLA</b>. STELLA’s own card comes first and stays locked.',
        why: 'Nothing here is a verdict. Click a card to go to your decision with that method in mind.' },

      { id: 'decision', tag: 'Decide', target: '#shDecision', placement: 'bottom', scroll: 'start', holeMax: 400,
        title: 'Record your decision',
        body: 'Accept STELLA’s size or prefer another lens; enter the planned lens; say which method influenced you, and why. Accepting STELLA is one click — method and reason are recorded for you.',
        why: 'This record stays in EVO Connect only. It captures agreement exactly like an override — both are equally valuable data. STELLA never sees it.' },

      { id: 'order', tag: 'Order', target: '#shReturn', placement: 'top', scroll: 'center',
        title: 'Order — in STELLA, and only there',
        body: '<b>Order Lens</b> opens STELLA on this case’s ordering screen. <b>Order Lens (in Stella)</b> opens STELLA’s ordering surface right here, loaded with STELLA’s own case data. Either way you enter and confirm the lens yourself. <b>Go back to STELLA</b> simply returns.',
        why: 'EVO Connect cannot change STELLA’s inputs, pick a lens, select a device or place an order. If your lens differs from STELLA’s recommendation, STELLA asks you to confirm the difference.' },

      { id: 'close', tag: 'Full circle', target: '.ftu-beacon', placement: 'left', before: peekBeacon,
        title: 'The circuit closes here',
        body: 'Once the order is confirmed in STELLA it comes back to this case record and completes the trail: <b>STELLA recommendation → methods compared → your decision and reason → the final order</b>. Post-op vault and the implanted lens will attach to the same record.',
        why: 'This <b>Guide</b> button reopens the tour at any time.',
        primary: 'Done' }
    ]
  };

  TOURS.direct = {
    doneKey: 'direct',
    /* the circuit lives in Patients: from any other module, go there first */
    prepare: function () {
      if (!listOpen() && !ptOpen() && typeof window.renderModule === 'function') { try { window.renderModule('patients'); } catch (e) {} }
    },
    steps: [
      { id: 'welcome', tag: 'Welcome', target: null,
        title: 'Welcome to EVO Connect',
        body: 'The sizing companion that works around STELLA. A case moves in four steps: <b>open a patient → compare sizing methods → record your decision → order in STELLA</b>.</p><p>This guide takes about two minutes and you can leave it at any point.',
        why: 'Orders are only ever created in STELLA, the STAAR system of record. EVO Connect never places one.',
        primary: 'Start the guide' },

      { id: 'nav', tag: 'Orientation', target: '#usNav', placement: 'right', when: listOpen,
        title: 'Your modules',
        body: 'In Phase 1 everything happens in <b>Patients</b>. The padlocks mark modules that arrive in later phases — order tracking, analytics, community, training and live support.' },

      { id: 'registry', tag: 'Patients', target: '.pt-list-hero', placement: 'bottom', scroll: 'start', when: listOpen,
        before: function () { var m = $('#usMain'); if (m) m.scrollTop = 0; },
        title: 'The patient registry',
        body: 'Search by name, ID or refraction, or add a <b>New patient</b>. The counters below split the clinic by stage — pre-op, sizing, scheduled, post-op — and flag who carries a risk.' },

      { id: 'card', tag: 'Patients', target: function () { return $('#patientsListGrid .pt-card') || $('.pt-card'); }, placement: 'right', scroll: 'center', when: listOpen, interactive: true,
        title: 'Open a file',
        body: 'Every card shows eye, power, journey progress, risk score and the next action. <b>Open file</b> takes you into the case — sizing is its first step.',
        primary: 'Open this file',
        action: function () {
          var c = $('#patientsListGrid .pt-card') || $('.pt-card'); if (!c) return;
          var m = /openPatientFile\('([^']+)'\)/.exec(c.getAttribute('onclick') || '');
          if (m && typeof window.openPatientFile === 'function') window.openPatientFile(m[1]);
          else c.click();
          return sizingTab();
        },
        after: sizingTab,
        ready: function () { return ptOpen() && $('.sf-run-btn'); } },

      { id: 'journey', tag: 'The case', target: '.pt-stepper', placement: 'bottom', scroll: 'start',
        before: function () {
          if (!ptOpen()) return;
          if (typeof window.setPatientTab === 'function' && window.CURRENT_PT_TAB !== 'sizing') window.setPatientTab('sizing');
          return waitFor(function () { return $('.sf-run-btn'); }, 2000);
        },
        title: 'The journey of a case',
        body: 'Step 1 is <b>ICL selection</b> — where sizing happens. The post-op visits at 1, 3, 6 and 12 months come after surgery and feed the same record.' },

      { id: 'inputs', tag: 'Inputs', target: function () { return stepSection(1); }, placement: 'bottom', scroll: 'start', holeMax: 380,
        title: 'Load the data once',
        body: 'Refractions, keratometry and biometry — typed in, or imported from <b>EHR, UBM, OCT or Pentacam</b> without re-typing. Every value keeps where it came from.',
        why: 'Less double entry means fewer transcription errors — the quiet benefit the brief asks EVO Connect to demonstrate.' },

      { id: 'methods', tag: 'Compare', target: '.sf-formulas-grid', placement: 'bottom', scroll: 'start',
        title: 'Choose which methods to run',
        body: 'Tick the sizing methods you want side by side. The <b>STAAR nomogram</b> is always included — it is the reference here.',
        why: 'No ranking, no pre-selection. Comparing is optional; deciding is yours.' },

      { id: 'calculate', tag: 'Compare', target: '.sf-run-btn', placement: 'right', scroll: 'center', interactive: true,
        title: 'Run the comparison',
        body: 'Press <b>Calculate</b> and every selected method runs on the same inputs, side by side.',
        primary: function () { return resultsShown() ? null : 'Run it now'; },
        action: function () { var b = $('.sf-run-btn'); if (b) b.click(); return waitFor(resultsShown, 3000); },
        ready: resultsShown },

      { id: 'results', tag: 'Compare', target: '#sfResults', placement: 'bottom', scroll: 'start', holeMax: 430,
        title: 'Read the results side by side',
        body: 'The summary answers first: size, vault, and how many methods agree. Each card then shows its recommended size, its predicted vault when available, and its source. <b>Select</b> the method you are actually using — it is recorded with your decision.' },

      { id: 'decision', tag: 'Decide', target: '#ptDecision', placement: 'bottom', scroll: 'start', holeMax: 380,
        title: 'Record your decision',
        body: 'Accept the reference or prefer another lens; the planned lens; the method that influenced you; the reason. Stored against this case, in EVO Connect.',
        why: 'Agreement is recorded exactly like an override — both teach the models.' },

      { id: 'order', tag: 'Order', target: '#ptOrder', placement: 'top', scroll: 'center',
        title: 'Order — in STELLA',
        body: '<b>Order Lens (in Stella)</b> opens STELLA’s ordering surface with this case. You enter and confirm the lens there — the order is created in STELLA, and only there.' },

      { id: 'close', tag: 'One more thing', target: '.ftu-beacon', placement: 'left', before: peekBeacon,
        title: 'Coming from STELLA?',
        body: 'When a case is launched from STELLA, EVO Connect opens straight on it: STELLA’s recommendation locked in as the reference, the inputs pre-filled and tagged, and nothing ever written back.',
        why: 'This <b>Guide</b> button reopens the tour at any time.',
        primary: 'Done' }
    ]
  };

  /* ================================================================
     ENGINE
  ================================================================ */
  var st = { tour: null, id: null, plan: [], i: -1, active: false, target: null, step: null, raf: 0, lastRect: '', restoreFocus: null, busy: false, dir: 1 };
  var ui = null;

  function build() {
    if (ui) return ui;
    var root = el('<div class="ftu-root" hidden></div>');
    var blocks = ['t', 'l', 'r', 'b', 'hole'].map(function (k) { var d = el('<div class="ftu-block ' + k + '"></div>'); root.appendChild(d); return d; });
    var spot = el('<div class="ftu-spot"></div>');
    var card = el('<div class="ftu-card" role="dialog" aria-modal="true" aria-labelledby="ftuTitle" aria-describedby="ftuBody" tabindex="-1">' +
      '<div class="ftu-arrow"></div>' +
      '<button type="button" class="ftu-close" aria-label="Leave the guide" title="Leave the guide (Esc)">' + ICO.close + '</button>' +
      '<div class="ftu-eyebrow"><span class="ftu-tag"></span><span class="ftu-dot" aria-hidden="true"></span><span class="ftu-count"></span></div>' +
      '<h2 class="ftu-title" id="ftuTitle"></h2>' +
      '<div class="ftu-body" id="ftuBody"></div>' +
      '<div class="ftu-why" hidden></div>' +
      '<div class="ftu-foot">' +
        '<button type="button" class="ftu-btn ghost skip">Skip guide</button>' +
        '<div class="ftu-progress" aria-hidden="true"><i></i></div>' +
        '<button type="button" class="ftu-btn ghost back">' + ICO.back + 'Back</button>' +
        '<button type="button" class="ftu-btn primary next">Next' + ICO.next + '</button>' +
      '</div></div>');
    var live = el('<div class="ftu-live" aria-live="polite" aria-atomic="true"></div>');
    root.appendChild(spot); root.appendChild(card); root.appendChild(live);
    document.body.appendChild(root);
    ui = { root: root, blocks: blocks, spot: spot, card: card, live: live,
           tag: card.querySelector('.ftu-tag'), count: card.querySelector('.ftu-count'), title: card.querySelector('.ftu-title'),
           body: card.querySelector('.ftu-body'), why: card.querySelector('.ftu-why'), bar: card.querySelector('.ftu-progress i'),
           skip: card.querySelector('.skip'), back: card.querySelector('.back'), next: card.querySelector('.next'), close: card.querySelector('.ftu-close'),
           arrow: card.querySelector('.ftu-arrow') };
    ui.next.addEventListener('click', function () { if (!st.busy) advance(1); });
    ui.back.addEventListener('click', function () { if (!st.busy) advance(-1); });
    ui.skip.addEventListener('click', function () { finish('skipped'); });
    ui.close.addEventListener('click', function () { finish('skipped'); });
    /* capture phase, on the document: while the guide is open, Escape must not
       reach the page's own handlers (js/23 closes the patient file on Escape) */
    document.addEventListener('keydown', onKey, true);
    /* clicks on the dark area do nothing (the tour is modal); clicking
       the hole on a non-interactive step nudges forward — the most
       common intent when someone taps the thing being explained */
    blocks[4].addEventListener('click', function () { if (!st.busy) advance(1); });
    return ui;
  }

  function onKey(e) {
    if (!st.active) return;
    var inCard = !!(e.target && e.target.closest && e.target.closest('.ftu-card'));
    var onPage = e.target === document.body || e.target === document.documentElement;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish('skipped'); return; }
    if (!inCard && !onPage) return;                       // typing in a field of an interactive step
    if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.target.closest('button'))) { e.preventDefault(); e.stopPropagation(); if (!st.busy) advance(1); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); if (!st.busy) advance(-1); return; }
    /* Tab stays inside the card: the card is a [role=dialog][aria-modal] and
       js/45 (the generic focus containment) already cycles it */
  }

  /* `when` is a planning question, answered once when the guide starts, so
     the step count never changes under the reader's feet. A planned step
     whose anchor turns out to be missing at show time is skipped quietly. */
  function stepOk(s) { try { return !s.when || !!s.when(); } catch (e) { return false; } }
  function resolveTarget(s) {
    if (!s.target) return null;
    var n = typeof s.target === 'function' ? s.target() : $(s.target);
    return visible(n) ? n : null;
  }
  function eligible(i) {
    var s = st.plan[i]; if (!s) return false;
    if (s.target && !resolveTarget(s) && !s.before && !s.action) return false;   // static anchor missing right now
    return true;
  }
  function findIndex(from, dir) {
    var i = from;
    while (i >= 0 && i < st.plan.length) { if (eligible(i)) return i; i += dir; }
    return -1;
  }

  function start(id) {
    if (!TOURS[id]) return false;
    if (st.active) finish('skipped', true);
    build();
    st.tour = TOURS[id]; st.id = id; st.i = -1; st.active = true; st.dir = 1;
    if (st.tour.prepare) { try { st.tour.prepare(); } catch (e) {} }
    st.plan = st.tour.steps.filter(stepOk);
    if (!st.plan.length) { st.active = false; return false; }
    st.restoreFocus = document.activeElement;
    document.body.classList.add('ftu-active');
    ui.root.hidden = false;
    /* focus goes into the dialog synchronously, before js/45's observer
       sees it appear — otherwise its 30 ms fallback lands on the close button */
    try { ui.card.focus({ preventScroll: true }); } catch (e) {}
    ui.spot.classList.add('no-anim');
    st.raf = requestAnimationFrame(track);
    show(findIndex(0, 1), 1);
    return true;
  }

  function advance(dir) {
    if (!st.active) return;
    var s = st.step;
    if (dir > 0 && s && s.action && s.ready && !s.ready()) {
      /* the step wants the real thing to happen first (e.g. Calculate) */
      st.busy = true; ui.next.classList.add('busy');
      Promise.resolve().then(s.action).then(function () {
        st.busy = false; ui.next.classList.remove('busy');
        show(findIndex(st.i + 1, 1), 1);
      });
      return;
    }
    var ni = findIndex(st.i + dir, dir);
    if (ni < 0) { if (dir > 0) finish('done'); return; }
    show(ni, dir);
  }

  function show(i, dir) {
    if (i < 0) { finish('done'); return; }
    var s = st.plan[i];
    st.dir = dir; st.busy = true;
    ui.card.classList.remove('in'); ui.card.classList.add('out');
    Promise.resolve(s.before ? s.before() : null).then(function () {
      if (!st.active) return;
      var target = resolveTarget(s);
      if (s.target && !target) {           // the step's anchor is not on screen after all — skip it
        st.busy = false;
        var n = findIndex(i + dir, dir);
        if (n >= 0 && n !== i) { show(n, dir); return; }
        if (dir > 0) { finish('done'); return; }
        if (st.i >= 0) { show(st.i, 1); } else { finish('skipped', true); }   // nothing before it: stay put
        return;
      }
      unwatchTarget();
      st.i = i; st.step = s; st.target = target;
      if (s.before !== peekBeacon) document.body.classList.remove('ftu-peek');
      if (s.interactive && target) watchTarget(target, s);
      render(s, i);
      /* hide the card while we scroll so it never crosses the screen */
      ui.card.classList.add('out');
      return bring(target, s).then(function () {
        if (!st.active) return;
        st.lastRect = '';
        place(true);
        ui.card.classList.remove('out');
        ui.card.classList.add('in');
        st.busy = false;
        try { ui.card.focus({ preventScroll: true }); } catch (e) { ui.card.focus(); }
        ui.live.textContent = 'Step ' + (i + 1) + ' of ' + st.plan.length + ': ' + ui.title.textContent + '. ' + ui.body.textContent;
        setTimeout(function () { ui.spot.classList.remove('no-anim'); }, 50);
      });
    });
  }


  function render(s, i) {
    var body = typeof s.body === 'function' ? s.body() : s.body;
    var isLast = i === st.plan.length - 1;
    var primary = typeof s.primary === 'function' ? s.primary() : s.primary;
    ui.tag.textContent = s.tag || '';
    ui.count.textContent = 'Step ' + (i + 1) + ' of ' + st.plan.length;
    ui.title.textContent = s.title;
    ui.body.innerHTML = '<p>' + body + '</p>';
    if (s.why) { ui.why.hidden = false; ui.why.innerHTML = '<span class="ftu-why-l">Why it matters</span>' + s.why; } else { ui.why.hidden = true; ui.why.innerHTML = ''; }
    ui.bar.style.width = Math.round(((i + 1) / st.plan.length) * 100) + '%';
    ui.back.hidden = i === 0;
    ui.skip.hidden = isLast;
    var label = primary || (isLast ? 'Done' : 'Next');
    var icon = isLast ? ICO.check : (s.action && primary ? ICO.play : ICO.next);
    ui.next.innerHTML = esc(label) + icon;
    ui.next.setAttribute('aria-label', label + (isLast ? '' : ' step'));
    ui.card.className = 'ftu-card';
    ui.spot.classList.toggle('center', !s.target);
    ui.blocks[4].style.display = s.interactive ? 'none' : '';
  }

  /* an interactive step lets the reader use the real control; when they do, the
     guide waits for the page to catch up and moves on by itself */
  function watchTarget(target, s) {
    var h = function () {
      if (!st.active || st.step !== s || st.busy) return;
      st.busy = true; ui.next.classList.add('busy');
      Promise.resolve(s.after ? s.after() : null)
        .then(function () { return s.ready ? waitFor(s.ready, 3000) : wait(250); })
        .then(function () {
          if (!st.active || st.step !== s) return;
          st.busy = false; ui.next.classList.remove('busy');
          var n = findIndex(st.i + 1, 1);
          if (n < 0) finish('done'); else show(n, 1);
        });
    };
    target.addEventListener('click', h, true);
    st.watch = { node: target, fn: h };
  }
  function unwatchTarget() {
    if (st.watch) { try { st.watch.node.removeEventListener('click', st.watch.fn, true); } catch (e) {} st.watch = null; }
  }

  /* scroll the target into view inside whatever scrolls it, then wait for it to settle */
  function bring(target, s) {
    if (!target) return Promise.resolve();
    var behavior = reduced() ? 'auto' : 'smooth';
    var sp = scrollParent(target);
    var r = target.getBoundingClientRect();
    var clip = sp ? sp.getBoundingClientRect() : { top: 0, bottom: innerHeight };
    var want = s.scroll || 'center';
    if (want === 'start') {
      var offset = (st.id === 'handoff' ? 96 : 24);          // keep clear of the pinned strip
      var top = (sp ? sp.scrollTop : window.scrollY) + (r.top - clip.top) - offset;
      if (sp) sp.scrollTo({ top: Math.max(0, top), behavior: behavior }); else window.scrollTo({ top: Math.max(0, top), behavior: behavior });
    } else {
      try { target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: behavior }); } catch (e) { target.scrollIntoView(); }
    }
    if (behavior === 'auto') return wait(30);
    return new Promise(function (resolve) {
      var last = null, same = 0, t0 = Date.now();
      (function tick() {
        var rr = target.getBoundingClientRect(), key = Math.round(rr.top) + ':' + Math.round(rr.left);
        same = key === last ? same + 1 : 0; last = key;
        if (same >= 3 || Date.now() - t0 > 900) return resolve();
        requestAnimationFrame(tick);
      })();
    });
  }

  /* hole = target ∩ its scroll clip ∩ viewport, trimmed to holeMax for tall sections */
  function holeRect(target, s) {
    var r = target.getBoundingClientRect();
    var sp = scrollParent(target), c = sp ? sp.getBoundingClientRect() : null;
    var top = Math.max(r.top, c ? c.top : 0, 0), left = Math.max(r.left, c ? c.left : 0, 0);
    var bottom = Math.min(r.bottom, c ? c.bottom : innerHeight, innerHeight), right = Math.min(r.right, c ? c.right : innerWidth, innerWidth);
    var h = { x: left - PAD, y: top - PAD, w: (right - left) + PAD * 2, h: (bottom - top) + PAD * 2 };
    if (s.holeMax && h.h > s.holeMax) h.h = s.holeMax;
    return h;
  }

  function place(animate) {
    var s = st.step; if (!s) return;
    var vw = innerWidth, vh = innerHeight;
    ui.card.style.width = Math.min(CARD_W, vw - MARGIN * 2) + 'px';
    var cw = ui.card.offsetWidth, ch = ui.card.offsetHeight;

    if (!st.target) {
      // centred card, whole screen dimmed
      setBox(ui.spot, { x: vw / 2, y: vh / 2, w: 0, h: 0 }, animate);
      ui.card.classList.add('center'); ui.card.style.left = ''; ui.card.style.top = '';
      blocksAround({ x: vw / 2, y: vh / 2, w: 0, h: 0 });
      return;
    }
    var h = holeRect(st.target, s);
    setBox(ui.spot, h, animate);
    blocksAround(h);

    var order = { right: ['right', 'left', 'bottom', 'top'], left: ['left', 'right', 'bottom', 'top'],
                  bottom: ['bottom', 'top', 'right', 'left'], top: ['top', 'bottom', 'right', 'left'] }[s.placement || 'bottom'];
    var fits = {
      right:  h.x + h.w + GAP + cw <= vw - MARGIN,
      left:   h.x - GAP - cw >= MARGIN,
      bottom: h.y + h.h + GAP + ch <= vh - MARGIN,
      top:    h.y - GAP - ch >= MARGIN
    };
    /* a tall section: trim the hole so the card fits underneath, rather than floating over it */
    if (s.holeMax && (s.placement || 'bottom') === 'bottom' && !fits.bottom) {
      var trimmed = vh - MARGIN - ch - GAP - h.y;
      if (trimmed >= 170) { h.h = trimmed; setBox(ui.spot, h, animate); blocksAround(h); fits.bottom = true; }
    }
    var p = order.filter(function (k) { return fits[k]; })[0] || 'float';
    var x, y, ax, ay;
    var cx = h.x + h.w / 2, cy = h.y + h.h / 2;
    if (p === 'right' || p === 'left') {
      x = p === 'right' ? h.x + h.w + GAP : h.x - GAP - cw;
      y = clamp(cy - ch / 2, MARGIN, vh - MARGIN - ch);
      ay = clamp(cy - y - 7, 14, ch - 28); ax = null;
    } else if (p === 'bottom' || p === 'top') {
      y = p === 'bottom' ? h.y + h.h + GAP : h.y - GAP - ch;
      x = clamp(cx - cw / 2, MARGIN, vw - MARGIN - cw);
      ax = clamp(cx - x - 7, 14, cw - 28); ay = null;
    } else {
      // nothing fits (tiny viewport): float over the darkest free corner
      x = clamp(h.x + h.w + GAP, MARGIN, vw - MARGIN - cw);
      y = clamp(h.y + h.h + GAP, MARGIN, vh - MARGIN - ch);
      if (y + ch > vh - MARGIN) y = MARGIN;
    }
    ui.card.classList.remove('center', 'p-right', 'p-left', 'p-bottom', 'p-top');
    if (p !== 'float') ui.card.classList.add('p-' + p);
    ui.card.style.left = Math.round(x) + 'px'; ui.card.style.top = Math.round(y) + 'px';
    if (ax != null) { ui.arrow.style.left = Math.round(ax) + 'px'; ui.arrow.style.top = ''; }
    if (ay != null) { ui.arrow.style.top = Math.round(ay) + 'px'; ui.arrow.style.left = ''; }
    ui.arrow.style.display = p === 'float' ? 'none' : '';
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function setBox(n, b, animate) {
    n.classList.toggle('no-anim', !animate);
    n.style.left = b.x + 'px'; n.style.top = b.y + 'px'; n.style.width = b.w + 'px'; n.style.height = b.h + 'px';
  }
  function blocksAround(h) {
    var vw = innerWidth, vh = innerHeight, B = ui.blocks;
    box(B[0], 0, 0, vw, Math.max(0, h.y));
    box(B[1], 0, h.y, Math.max(0, h.x), h.h);
    box(B[2], h.x + h.w, h.y, Math.max(0, vw - h.x - h.w), h.h);
    box(B[3], 0, h.y + h.h, vw, Math.max(0, vh - h.y - h.h));
    box(B[4], h.x, h.y, h.w, h.h);
  }
  function box(n, x, y, w, h) { n.style.left = x + 'px'; n.style.top = y + 'px'; n.style.width = w + 'px'; n.style.height = h + 'px'; }

  /* follow the target while it scrolls or the layout changes */
  function track() {
    if (!st.active) return;
    if (st.target && !st.busy) {
      if (!document.body.contains(st.target) || !visible(st.target)) {
        // the anchor vanished (re-render): try to find it again, else move on
        var again = resolveTarget(st.step);
        if (again) st.target = again; else { advance(1); st.raf = requestAnimationFrame(track); return; }
      }
      var r = st.target.getBoundingClientRect();
      var key = [r.top, r.left, r.width, r.height, innerWidth, innerHeight].map(Math.round).join(',');
      if (key !== st.lastRect) { st.lastRect = key; place(false); }
    } else if (!st.target && !st.busy) {
      var k2 = innerWidth + 'x' + innerHeight; if (k2 !== st.lastRect) { st.lastRect = k2; place(false); }
    }
    st.raf = requestAnimationFrame(track);
  }

  function finish(status, silent) {
    if (!st.active) return;
    st.active = false; st.busy = false;
    unwatchTarget();
    cancelAnimationFrame(st.raf);
    var patch = {}; patch[st.tour.doneKey] = status; save(patch);
    ui.card.classList.remove('in'); ui.card.classList.add('out');
    var root = ui.root;
    setTimeout(function () { if (!st.active) root.hidden = true; }, reduced() ? 0 : 160);
    document.body.classList.remove('ftu-active', 'ftu-peek');
    st.step = null; st.target = null;
    var back = st.restoreFocus;
    if (!silent) {
      var beacon = $('.ftu-beacon');
      try { (beacon || back || document.body).focus({ preventScroll: true }); } catch (e) {}
      if (status === 'skipped' && typeof window.showToast === 'function') window.showToast('Guide closed — reopen it any time with the Guide button.');
    }
  }

  /* ================================================================
     BEACON — the way back into the guide, on every screen
  ================================================================ */
  function beacon() {
    if ($('.ftu-beacon')) return;
    var b = el('<button type="button" class="ftu-beacon" aria-label="Open the guided tour of this screen" title="Guided tour of this screen">' + ICO.guide + '<span>Guide</span></button>');
    b.addEventListener('click', function () { start(isHandoff() ? 'handoff' : 'direct'); });
    document.body.appendChild(b);
  }

  /* ================================================================
     AUTO-START — once per browser, per guide
  ================================================================ */
  function autostart() {
    var s = load();
    var id = isHandoff() ? 'handoff' : 'direct';
    if (urlFlag === '0') return;
    if (s.auto === false && urlFlag !== '1') return;
    if (s[id] && urlFlag !== '1') return;
    if (!document.getElementById('usMain') || !$('#universeView.open')) return;
    start(id);
  }

  function boot() {
    beacon();
    /* let js/35 open the case, fonts settle and the universe paint before measuring anything */
    setTimeout(autostart, 900);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.EvoFTU = {
    start: function (id) { return start(id || (isHandoff() ? 'handoff' : 'direct')); },
    stop: function () { finish('skipped', true); },
    next: function () { advance(1); },
    back: function () { advance(-1); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    state: load,
    tours: Object.keys(TOURS)
  };
})();
