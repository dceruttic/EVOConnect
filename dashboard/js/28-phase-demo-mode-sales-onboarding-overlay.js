/* ================================================================
   PHASE DEMO MODE — sales/onboarding overlay
   - 5 project phases (Phase 1 → Phase 5 & 6)
   - Maps sidebar modules + patient tabs + side features to phases
   - When ON, locks anything whose phase > currentPhase
   - State persists in localStorage as `revai_phase_demo`
   - Wrapped in IIFE; exposes window.PhaseDemo + window.PHASE_DEMO
================================================================ */
(function(){
  'use strict';

  const PROJECT_PHASES = {
    1: { name: 'Phase 1',     label: 'Core clinical + STAAR data',   duration: '12-14 mo', price: '$2.1M', color: '#5C18AB' },
    2: { name: 'Phase 2',     label: 'Planning + Execution',         duration: '6 mo',     price: '$0.7M', color: '#0080C7' },
    3: { name: 'Phase 3',     label: 'Analytics + Engagement',       duration: '4 mo',     price: '$0.4M', color: '#08B1C2' },
    4: { name: 'Phase 4',     label: 'Operations + Community',       duration: '4 mo',     price: '$0.3M', color: '#03B496' },
    5: { name: 'Phase 5 & 6', label: 'STAAR Intelligence Center',    duration: '4 mo',     price: '$1.4M', color: '#F6BF2C' },
  };
  // Expose so helpers outside this IIFE (e.g. awardEvoPoints' phase-aware lock) can show phase names
  window.PROJECT_PHASES = PROJECT_PHASES;

  // Default mapping: feature key → phase number
  // Sidebar nav keys match `data-mod=` values in #usNav
  // Patient-tab keys match the `tab` argument in setPatientTab()
  const DEFAULT_PHASE_MAP = {
    // Sidebar nav (data-mod values, verified in #usNav)
    'dashboard':       3,  // Home dashboard — Phase 3 (lands together with Clinic Analytics + EVO Credits)
    'copilot':         5,  // EVO Copilot — clinic-level AI chat (Phase 5 & 6: STAAR Intelligence Center)
    'patients':        1,
    'order':           4,  // STAAR Order Follow-up Center — full tracking workflow is Phase 4. In Phase 1, ordering is just a one-way "push" from inside the patient sizing flow (no dedicated module).
    'simulator':       0,  // AI Lens Simulator — out of scope · not part of any contracted phase
    'training':        2,
    'analytics':       3,
    'community':       4,
    'support':         4,  // Live Support · REVAI+STAAR experts (Phase 4)
    'evo-credits':     3,

    // Patient page tabs (within setPatientTab())
    'patient-preop':   1,
    'patient-sizing':  1,
    'patient-planner': 3,
    'patient-surgery': 3,
    'patient-postop':  1,

    // Sizing formulas (chips in the formula comparator).
    // Phase 1 ships STELLA + the three nomograms named in the ESCRS brief;
    // the wider method library lands in Phase 4.
    'formula-REINSTEIN': 4,
    'formula-LASSO':     4,
    'formula-KS':        4,

    // Sidebar/side features (visible widgets, not nav buttons)
    'ai-sentinel':     1,
    'staar-bi':        1,
    'marketplace':     1,
  };

  // Human-readable labels for the mapping editor
  const FEATURE_LABELS = {
    'dashboard':       'Dashboard (home)',
    'copilot':         'EVO Copilot · Dashboard hero',
    'patients':        'Patients',
    'order':           'STAAR Order Follow-up Center',
    'simulator':       'AI Lens Simulator (out of scope)',
    'training':        'Training · AI Coach',
    'analytics':       'Clinic Analytics',
    'community':       'Community Feed',
    'support':         'Live Support · STAAR experts',
    'evo-credits':     'EVO Credits',
    'patient-preop':   'Patient · Pre-op',
    'patient-sizing':  'Patient · ICL Selection',
    'patient-planner': 'Patient · Surgical Planner',
    'patient-surgery': 'Patient · Surgery',
    'patient-postop':  'Patient · Post-op',
    'formula-REINSTEIN': 'Sizing formula · Reinstein',
    'formula-LASSO':     'Sizing formula · Lasso',
    'formula-KS':        'Sizing formula · KS',
    'ai-sentinel':     'AI Sentinel (risk flag)',
    'staar-bi':        'STAAR BI Data Layer',
    'marketplace':     'Marketplace',
  };

  // Map patient-tab keys → DOM data-tab values
  const PATIENT_TAB_DOM_KEY = {
    'patient-preop':   'preop',
    'patient-sizing':  'sizing',
    'patient-planner': 'planner',
    'patient-surgery': 'surgery',
    'patient-postop':  'postop',
  };

  const STORAGE_KEY = 'revai_phase_demo';

  // ---- Load + persist state ----
  function loadState() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch(e) {}
    return {
      enabled: !!(saved && saved.enabled),
      /* every load starts on Phase 1 with every later phase off — the demo
         must never open on a phase left selected in an earlier rehearsal. */
      currentPhase: 1,
      showAllPhases: false,
      map: Object.assign({}, DEFAULT_PHASE_MAP, (saved && saved.map) || {}, {
        'patient-planner': 3, 'patient-surgery': 3
      }),
    };
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enabled: window.PHASE_DEMO.enabled,
        currentPhase: window.PHASE_DEMO.currentPhase,
        showAllPhases: window.PHASE_DEMO.showAllPhases,
        map: window.PHASE_DEMO.map,
      }));
    } catch(e) {}
  }

  window.PHASE_DEMO = window.PHASE_DEMO || loadState();

  // ---- Apply filter to DOM ----
  // Tracks previous lock state per DOM element so we can detect transitions
  // and trigger the unlock-pulse / lock-fade animations.
  let _lastLockedSnapshot = {};

  function _animateTransition(el, key, wasLocked, isLocked) {
    if (wasLocked === isLocked) return;
    // Don't animate the very first render (when we have no prior snapshot for this key)
    if (!(key in _lastLockedSnapshot)) return;
    const cls = isLocked ? 'phase-just-locked' : 'phase-just-unlocked';
    // Clear opposite class if leftover
    el.classList.remove('phase-just-locked', 'phase-just-unlocked');
    // Force reflow so animation restarts even when toggling rapidly
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 950);
  }

  function applyPhaseFilter() {
    const st = window.PHASE_DEMO;
    /* Surgical planner / Surgery are removed from the timeline outside Phase 3,
       so the stepper has to be rebuilt whenever the phase changes. */
    try {
      const wrap = document.querySelector('.pt-stepper');
      if (wrap && typeof CURRENT_PT !== 'undefined' && CURRENT_PT && typeof renderPtStepper === 'function') {
        wrap.outerHTML = renderPtStepper(CURRENT_PT, (typeof CURRENT_PT_TAB !== 'undefined' && CURRENT_PT_TAB) || 'preop');
      }
    } catch (e) {}
    const enabled = st.enabled;
    const showAll = st.showAllPhases;
    const limit = st.currentPhase;

    // Lock decision — handles 3 cases:
    //   phase === 0   → "out of scope" · always locked when demo is on (even in All Phases)
    //   phase > limit → unlocks in a later phase
    //   else          → visible
    function lockInfo(phase) {
      if (!enabled) return null;
      if (phase === 0) return { badge: 'OFF', title: 'Out of scope — not part of any contracted phase', toast: 'This feature is out of scope · not part of any contracted phase' };
      if (showAll) return null;
      if (phase && phase > limit) return { badge: 'P' + phase, title: 'Unlocks in ' + PROJECT_PHASES[phase].name, toast: 'This feature unlocks in ' + PROJECT_PHASES[phase].name + ' · switch phase to view' };
      return null;
    }

    const nextSnapshot = {};

    // 1) Sidebar nav buttons
    document.querySelectorAll('#usNav button[data-mod]').forEach(btn => {
      const key = btn.dataset.mod;
      const phase = st.map[key];
      const snapKey = 'nav:' + key;
      const wasLocked = !!_lastLockedSnapshot[snapKey];
      btn.classList.remove('phase-locked');
      btn.removeAttribute('data-phase-badge');
      // Remove any previously attached listener
      if (btn._phaseLockHandler) {
        btn.removeEventListener('click', btn._phaseLockHandler, true);
        btn._phaseLockHandler = null;
      }
      const lock = lockInfo(phase);
      const isLocked = !!lock;
      nextSnapshot[snapKey] = isLocked;
      if (lock) {
        btn.classList.add('phase-locked');
        btn.setAttribute('data-phase-badge', lock.badge);
        btn.setAttribute('title', lock.title);
        // Capture-phase handler to intercept clicks BEFORE the parent #usNav delegation
        const handler = function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (typeof showToast === 'function') {
            showToast(lock.toast);
          }
        };
        btn._phaseLockHandler = handler;
        btn.addEventListener('click', handler, true);
      }
      _animateTransition(btn, snapKey, wasLocked, isLocked);
    });

    /* 1b) Sizing-formula chips. A formula whose phase has not landed is removed
       from the comparator and deselected, so it is neither offered nor run. */
    ['REINSTEIN', 'LASSO', 'KS'].forEach(function (code) {
      var locked = !!lockInfo(st.map['formula-' + code]);
      document.querySelectorAll('.sf-formula-chip[data-formula="' + code + '"]').forEach(function (chip) {
        chip.hidden = locked;
        chip.style.display = locked ? 'none' : '';
      });
      if (locked && typeof SELECTED_SIZING_FORMULAS !== 'undefined') {
        try { SELECTED_SIZING_FORMULAS.delete(code); } catch (e) {}
      }
    });
    (function () {
      if (typeof SELECTED_SIZING_FORMULAS === 'undefined') return;
      var n = SELECTED_SIZING_FORMULAS.size;
      var a = document.getElementById('sfSelectedCount'); if (a) a.textContent = n;
      var b = document.getElementById('sfRunCount'); if (b) b.textContent = n;
    })();

    // 2) Patient page tabs (rendered via renderPtStepper)
    document.querySelectorAll('.pt-step[data-tab]').forEach(step => {
      const tab = step.dataset.tab;
      const key = 'patient-' + tab;
      const phase = st.map[key];
      const snapKey = 'tab:' + tab;
      const wasLocked = !!_lastLockedSnapshot[snapKey];
      step.classList.remove('phase-locked');
      step.removeAttribute('data-phase-badge');
      if (step._phaseLockHandler) {
        step.removeEventListener('click', step._phaseLockHandler, true);
        step._phaseLockHandler = null;
      }
      const lock = lockInfo(phase);
      const isLocked = !!lock;
      nextSnapshot[snapKey] = isLocked;
      if (lock) {
        step.classList.add('phase-locked');
        step.setAttribute('data-phase-badge', lock.badge);
        step.setAttribute('title', lock.title);
        const handler = function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (typeof showToast === 'function') {
            showToast(lock.toast.replace('feature', 'step'));
          }
        };
        step._phaseLockHandler = handler;
        step.addEventListener('click', handler, true);
      }
      _animateTransition(step, snapKey, wasLocked, isLocked);
    });

    // Commit snapshot for next call
    _lastLockedSnapshot = nextSnapshot;

    // 3) Banner + FAB visual state
    renderBanner();
    renderFab();
  }

  // ---- Banner at top of usMain ----
  function renderBanner() {
    const st = window.PHASE_DEMO;
    /* Render into the fixed slot above the scroll column when it exists. */
    const main = document.getElementById('pdBannerSlot') || document.getElementById('usMain');
    if (!main) return;
    let banner = document.getElementById('pdBanner');

    if (!st.enabled) {
      if (banner) banner.remove();
      return;
    }

    const phase = PROJECT_PHASES[st.currentPhase];
    const showingAll = st.showAllPhases;
    const color = showingAll ? '#5C18AB' : phase.color;
    /* the phase selector shows the phase only — no scope description,
       no duration, no price (commercial detail stays out of the demo). */
    const labelText = showingAll ? 'All phases' : '';
    const nameText = showingAll ? 'All Phases' : phase.name;

    const html = `
      <div class="pd-banner" id="pdBanner" style="--pd-accent:${color}">
        <span class="pd-banner-clap" onclick="PhaseDemo.openPanel()" title="Open Phase Demo settings">&#127916;</span>
        <span class="pd-banner-label" style="color:${color}">Phase Demo</span>
        <span class="pd-banner-name">${nameText}</span>
        <span class="pd-banner-meta">${labelText}</span>
        <span class="pd-banner-spacer"></span>
      </div>
    `;

    if (banner) {
      banner.outerHTML = html;
    } else {
      main.insertAdjacentHTML('afterbegin', html);
    }
  }

  // ---- Floating button ----
  function renderFab() {
    const st = window.PHASE_DEMO;
    const fab = document.getElementById('pdFab');
    if (!fab) return;
    const dot = document.getElementById('pdFabDot');
    const label = document.getElementById('pdFabLabel');
    const phaseChip = document.getElementById('pdFabPhase');
    if (st.enabled) {
      fab.classList.add('is-on');
      const phase = st.showAllPhases ? null : PROJECT_PHASES[st.currentPhase];
      const color = st.showAllPhases ? '#5C18AB' : phase.color;
      if (dot) { dot.style.background = color; dot.style.boxShadow = '0 0 0 3px ' + color + '40'; }
      if (label) label.textContent = 'Demo';
      if (phaseChip) {
        phaseChip.style.display = '';
        phaseChip.textContent = st.showAllPhases ? 'ALL' : ('P' + st.currentPhase);
        phaseChip.style.background = color + '40';
      }
    } else {
      fab.classList.remove('is-on');
      if (dot) { dot.style.background = '#5C18AB'; dot.style.boxShadow = '0 0 0 3px rgba(92,24,171,.25)'; }
      if (label) label.textContent = 'Demo Mode';
      if (phaseChip) phaseChip.style.display = 'none';
    }
  }

  // ---- Panel renderer ----
  function renderPanel() {
    const body = document.getElementById('pdPanelBody');
    if (!body) return;
    const st = window.PHASE_DEMO;

    const phasePills = Object.keys(PROJECT_PHASES).map(num => {
      const p = PROJECT_PHASES[num];
      const isActive = st.enabled && !st.showAllPhases && st.currentPhase === Number(num);
      return `
        <button type="button" class="pd-pill ${isActive ? 'is-active' : ''}" style="--pd-color:${p.color}" onclick="PhaseDemo.setPhase(${num})">
          <span class="pd-pill-bar"></span>
          <span class="pd-pill-body">
            <span class="pd-pill-head">
              <span class="pd-pill-name">${p.name}</span>
            </span>
          </span>
          <span class="pd-pill-check" style="background:${p.color}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        </button>
      `;
    }).join('');

    const allActive = st.enabled && st.showAllPhases;
    const allPill = `
      <button type="button" class="pd-pill pd-pill-all ${allActive ? 'is-active' : ''}" style="--pd-color:#5C18AB" onclick="PhaseDemo.setShowAll()">
        <span class="pd-pill-bar"></span>
        <span class="pd-pill-body">
          <span class="pd-pill-head">
            <span class="pd-pill-name">All Phases</span>
            <span class="pd-pill-meta">Full Vision</span>
          </span>
          <span class="pd-pill-label">Show everything (no lock)</span>
        </span>
        <span class="pd-pill-check" style="background:#5C18AB">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      </button>
    `;

    const mapRows = Object.keys(DEFAULT_PHASE_MAP).map(key => {
      // Use ?? not || so phase 0 ("out of scope") doesn't fall back to the default
      const val = (st.map[key] !== undefined) ? st.map[key] : DEFAULT_PHASE_MAP[key];
      const outOfScopeOpt = `<option value="0" ${Number(val)===0?'selected':''}>Out of scope</option>`;
      const phaseOpts = Object.keys(PROJECT_PHASES).map(n => `<option value="${n}" ${Number(n)===Number(val)?'selected':''}>Phase ${n}</option>`).join('');
      return `
        <div class="pd-map-row">
          <label>${FEATURE_LABELS[key] || key}</label>
          <select onchange="PhaseDemo.setMap('${key}', this.value)">${outOfScopeOpt}${phaseOpts}</select>
        </div>
      `;
    }).join('');

    const mapCount = Object.keys(DEFAULT_PHASE_MAP).length;

    body.innerHTML = `
      <div class="pd-enable">
        <div class="pd-enable-info">
          <div class="pd-enable-info-ttl">Enable demo mode</div>
          <div class="pd-enable-info-sub">When off, the dashboard behaves normally — no features are locked.</div>
        </div>
        <div class="pd-switch ${st.enabled ? 'is-on' : ''}" id="pdSwitch" onclick="PhaseDemo.toggleEnabled()" role="switch" aria-checked="${st.enabled}" tabindex="0"></div>
      </div>

      <div class="pd-phases">
        ${phasePills}
        ${allPill}
      </div>

      <div class="pd-map ${window._pdMapOpen ? 'is-open' : ''}" id="pdMap">
        <button type="button" class="pd-map-head" onclick="PhaseDemo.toggleMap()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          Feature &rarr; Phase mapping
          <span class="pd-map-ct">${mapCount} items</span>
        </button>
        <div class="pd-map-body">
          ${mapRows}
        </div>
      </div>
    `;
  }

  // When the current module is locked under the active phase settings,
  // jump to the first accessible module in sidebar order. This prevents the
  // user from staring at a Dashboard they shouldn't see in Phase 1.
  /* Sidebar order, used to answer "what is the first module this phase allows?".
     In Phase 1 the Dashboard has not landed yet, so EVO Connect must open on
     Patients rather than on a locked home screen. */
  var MODULE_ORDER = ['dashboard', 'patients', 'order', 'training', 'analytics',
                      'community', 'support', 'evo-credits', 'copilot', 'simulator'];
  function moduleAllowed(key) {
    const st = window.PHASE_DEMO;
    const p = st.map[key];
    if (p === 0) return false;                      // out of scope in every phase
    if (!st.enabled || st.showAllPhases) return true;
    return !(p && p > st.currentPhase);
  }
  function firstAccessibleModule(preferred) {
    if (preferred && moduleAllowed(preferred)) return preferred;
    for (var i = 0; i < MODULE_ORDER.length; i++) {
      if (moduleAllowed(MODULE_ORDER[i])) return MODULE_ORDER[i];
    }
    return 'patients';
  }

  function navigateToAccessibleIfLocked() {
    const st = window.PHASE_DEMO;
    if (!st.enabled) return;
    if (typeof CURRENT_MOD === 'undefined' || !CURRENT_MOD) return;
    if (CURRENT_MOD === 'patient') return;  // patient detail view — leave it alone

    const curPhase = st.map[CURRENT_MOD];
    const curIsLocked = (curPhase === 0) ||
                       (!st.showAllPhases && curPhase && curPhase > st.currentPhase);
    if (!curIsLocked) return;  // user is already on an accessible module

    // Walk the sidebar in DOM order and pick the first nav that's accessible
    const buttons = document.querySelectorAll('#usNav button[data-mod]');
    for (var i = 0; i < buttons.length; i++) {
      const key = buttons[i].dataset.mod;
      const phase = st.map[key];
      if (phase === 0) continue;  // skip out-of-scope (e.g. simulator)
      if (!st.showAllPhases && phase && phase > st.currentPhase) continue;  // skip locked
      // Found one — navigate
      if (typeof renderModule === 'function') {
        renderModule(key);
      }
      return;
    }
  }

  // ---- Public API ----
  const PhaseDemo = {
    openPanel() {
      renderPanel();
      const ov = document.getElementById('pdOverlay');
      if (ov) ov.classList.add('is-open');
    },
    closePanel() {
      const ov = document.getElementById('pdOverlay');
      if (ov) ov.classList.remove('is-open');
      const quick = document.getElementById('pdBannerQuick');
      if (quick) quick.classList.remove('is-open');
    },
    toggleEnabled() {
      window.PHASE_DEMO.enabled = !window.PHASE_DEMO.enabled;
      saveState();
      renderPanel();
      applyPhaseFilter();
      navigateToAccessibleIfLocked();
    },
    setPhase(num) {
      window.PHASE_DEMO.enabled = true;
      window.PHASE_DEMO.showAllPhases = false;
      window.PHASE_DEMO.currentPhase = Number(num);
      saveState();
      renderPanel();
      applyPhaseFilter();
      navigateToAccessibleIfLocked();
      const quick = document.getElementById('pdBannerQuick');
      if (quick) quick.classList.remove('is-open');
    },
    setShowAll() {
      window.PHASE_DEMO.enabled = true;
      window.PHASE_DEMO.showAllPhases = true;
      saveState();
      renderPanel();
      applyPhaseFilter();
      navigateToAccessibleIfLocked();
      const quick = document.getElementById('pdBannerQuick');
      if (quick) quick.classList.remove('is-open');
    },
    setMap(key, val) {
      window.PHASE_DEMO.map[key] = Number(val);
      saveState();
      applyPhaseFilter();
    },
    resetDefaults() {
      window.PHASE_DEMO.map = Object.assign({}, DEFAULT_PHASE_MAP);
      saveState();
      renderPanel();
      applyPhaseFilter();
      if (typeof showToast === 'function') showToast('Phase mapping reset to defaults');
    },
    toggleMap() {
      window._pdMapOpen = !window._pdMapOpen;
      const el = document.getElementById('pdMap');
      if (el) el.classList.toggle('is-open');
    },
    toggleQuick(evt) {
      if (evt) evt.stopPropagation();
      const q = document.getElementById('pdBannerQuick');
      if (q) q.classList.toggle('is-open');
    },
    apply: applyPhaseFilter,
    firstAccessibleModule: firstAccessibleModule,
    moduleAllowed: moduleAllowed,
  };
  window.PhaseDemo = PhaseDemo;

  // ---- Hook into existing render functions to re-apply filter ----
  // Wrap renderModule so that after the sidebar/main paints we re-attach lock classes
  if (typeof window.renderModule === 'function') {
    const _origRenderModule = window.renderModule;
    window.renderModule = function(key) {
      _origRenderModule.apply(this, arguments);
      // Defer to next frame so any inner-rendered nodes exist
      setTimeout(applyPhaseFilter, 0);
    };
  }
  if (typeof window.setPatientTab === 'function') {
    const _origSetPatientTab = window.setPatientTab;
    window.setPatientTab = function() {
      _origSetPatientTab.apply(this, arguments);
      setTimeout(applyPhaseFilter, 0);
    };
  }
  // Also re-apply when the patient page opens (renderPatientPage is called via openPatientFile)
  if (typeof window.openPatientFile === 'function') {
    const _origOpen = window.openPatientFile;
    window.openPatientFile = function() {
      _origOpen.apply(this, arguments);
      setTimeout(applyPhaseFilter, 0);
    };
  }

  // Close the quick-switch popover when clicking elsewhere
  document.addEventListener('click', function(e) {
    const q = document.getElementById('pdBannerQuick');
    if (!q || !q.classList.contains('is-open')) return;
    if (e.target.closest('#pdBannerQuick') || e.target.closest('.pd-banner-switch')) return;
    q.classList.remove('is-open');
  });

  // Init on DOM ready
  function init() {
    renderFab();
    applyPhaseFilter();
    navigateToAccessibleIfLocked();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
