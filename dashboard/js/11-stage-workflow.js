// === Stage workflow ===
// Linear stage progression: Consult/Eligibility/Biometry → Sizing → Scheduled → Surgery → Post-op
// Each "validate & continue" CTA advances the patient one step + navigates to the matching tab.
const STAGE_PROGRESSION = ['Consult', 'Eligibility', 'Biometry', 'Sizing', 'Scheduled', 'Surgery', 'Post-op'];
const NEXT_STAGE_LABEL = {
  'preop':   { next: 'Sizing',    nextTab: 'sizing',  label: 'Continue to ICL Selection',  icon: '→' },
  'sizing':  { next: 'Scheduled', nextTab: 'planner', label: 'Validate & continue to Surgical Planner', icon: '→' },
  'planner': { next: 'Surgery',   nextTab: 'surgery', label: 'Validate & continue to Surgery', icon: '→' },
  'surgery': { next: 'Post-op',   nextTab: 'postop',  label: 'Complete surgery & move to Post-op', icon: '✓' },
};

// Tab chain (in journey order) + mapping to patient stage + display label.
// Used by the phase-aware CTA helper below to skip locked tabs.
const _TAB_CHAIN = ['preop', 'sizing', 'planner', 'surgery', 'postop'];
const _TAB_TO_STAGE = { preop: 'Biometry', sizing: 'Sizing', planner: 'Scheduled', surgery: 'Surgery', postop: 'Post-op' };
const _TAB_LABEL = { preop: 'Pre-op', sizing: 'ICL Selection', planner: 'Surgical Planner', surgery: 'Surgery', postop: 'Post-op' };

// Phase-aware lookup: given a fromTab, return the next ACCESSIBLE tab under
// the current Phase Demo settings. Returns null when demo mode is off (caller
// falls back to NEXT_STAGE_LABEL). Returns { unavailable: true } when every
// subsequent tab is locked (CTA should be hidden in that case).
function _phaseAdjustedNextTab(fromTab) {
  const pd = window.PHASE_DEMO;
  if (!pd || !pd.enabled) return null;

  const fromIdx = _TAB_CHAIN.indexOf(fromTab);
  if (fromIdx < 0 || fromIdx === _TAB_CHAIN.length - 1) return null;

  function isLocked(tab) {
    const phase = pd.map['patient-' + tab];
    if (phase === 0) return true;  // out of scope
    if (pd.showAllPhases) return false;
    if (phase && phase > pd.currentPhase) return true;
    return false;
  }

  for (let i = fromIdx + 1; i < _TAB_CHAIN.length; i++) {
    if (!isLocked(_TAB_CHAIN[i])) {
      const tab = _TAB_CHAIN[i];
      const skipped = (i > fromIdx + 1);
      return {
        tab: tab,
        stage: _TAB_TO_STAGE[tab],
        label: skipped ? ('Validate & continue to ' + _TAB_LABEL[tab]) : null,  // null → keep original label
        skipped: skipped
      };
    }
  }
  return { unavailable: true };
}

function advanceStage(ptId, fromTab){
  var pt = (DATA.patients||[]).find(function(p){ return p.id === ptId; });
  if (!pt) return;
  var baseMeta = NEXT_STAGE_LABEL[fromTab];
  if (!baseMeta) return;
  // Honor phase demo: if the natural next tab is locked, route to the next accessible one
  var adj = _phaseAdjustedNextTab(fromTab);
  var meta;
  if (adj && adj.unavailable) return;  // no accessible target
  if (adj) {
    meta = { next: adj.stage, nextTab: adj.tab, label: adj.label || baseMeta.label, icon: baseMeta.icon };
  } else {
    meta = baseMeta;
  }
  // Update stage (only forward — never roll back if the surgeon revisits an earlier tab)
  var curIdx = STAGE_PROGRESSION.indexOf(pt.stage);
  var nextIdx = STAGE_PROGRESSION.indexOf(meta.next);
  if (nextIdx > curIdx) pt.stage = meta.next;
  // Set the surgery date when advancing into Surgery so post-op milestones can compute
  if (meta.next === 'Post-op' && !pt.surgeryDate) {
    var d = new Date();
    pt.surgeryDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }
  // Navigate to the next tab + re-render the whole patient page so all chips/stepper update
  CURRENT_PT_TAB = meta.nextTab;
  if (meta.next === 'Post-op' && typeof _initialPostopMs === 'function') {
    CURRENT_PT_POSTOP_MS = _initialPostopMs(pt);
  }
  var main = document.getElementById('usMain');
  if (main) { main.innerHTML = renderPatientPage(pt); main.scrollTop = 0; }
  // Confirmation toast — different copy when we skipped locked stages
  if (typeof showToast === 'function') {
    var msg = adj && adj.skipped
      ? pt.name + ' moved to ' + meta.next + ' (skipped phases not yet enabled)'
      : pt.name + ' moved to ' + meta.next;
    showToast(msg);
  }
}

// Build the "validate & continue" CTA card shown at the end of each stage render.
// Only appears if the patient is AT or BEFORE that stage (no retrospective re-advance).
function renderStageAdvanceCta(pt, fromTab){
  var baseMeta = NEXT_STAGE_LABEL[fromTab];
  if (!baseMeta) return '';
  var adj = _phaseAdjustedNextTab(fromTab);
  if (adj && adj.unavailable) return '';  // every later tab is locked under demo
  var meta;
  if (adj) {
    meta = { next: adj.stage, nextTab: adj.tab, label: adj.label || baseMeta.label, icon: baseMeta.icon, skipped: adj.skipped };
  } else {
    meta = baseMeta;
  }
  var curIdx = STAGE_PROGRESSION.indexOf(pt.stage);
  var nextIdx = STAGE_PROGRESSION.indexOf(meta.next);
  // Already past this point → no CTA (don't allow rolling forward from a completed stage)
  if (curIdx >= nextIdx) return '';
  var subText = meta.skipped
    ? 'Phases for the intermediate steps are not yet enabled. Skip directly to <b>' + meta.next + '</b>.'
    : 'Confirm the data captured at this stage and move <b>' + pt.name + '</b> to <b>' + meta.next + '</b>.';
  return [
    '<div class="stage-advance-card' + (meta.skipped ? ' is-phase-skip' : '') + '">',
      '<div class="sa-info">',
        '<div class="sa-eyebrow">' + (meta.skipped ? 'Phase demo · skipping locked stages' : 'Ready for the next step?') + '</div>',
        '<div class="sa-text">' + subText + '</div>',
      '</div>',
      '<button type="button" class="sa-btn" onclick="advanceStage(\'' + pt.id + '\',\'' + fromTab + '\')">',
        '<span>' + meta.label + '</span>',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
      '</button>',
    '</div>'
  ].join('');
}

// Map a patient's current stage to the dashboard tab they should land on
// when opening the file — "where I left off" UX vs. always starting at preop.
function _tabForStage(stage){
  switch (stage) {
    case 'Consult':
    case 'Eligibility':
    case 'Biometry':    return 'preop';
    case 'Sizing':      return 'sizing';
    case 'Scheduled':   return 'planner';   // sizing done, lens ordered, awaiting OR
    case 'Surgery':     return 'surgery';
    case 'Post-op':     return 'postop';
    default:            return 'preop';
  }
}

function openPatientFile(id) {
  const pt = DATA.patients.find(p => p.id === id);
  if (!pt) return;
  CURRENT_PT = pt;
  // Land on the tab matching the patient's current stage, not always pre-op —
  // and never on one the current phase does not ship.
  CURRENT_PT_TAB = _tabForStage(pt.stage);
  if (typeof ptTabHidden === 'function' && ptTabHidden(CURRENT_PT_TAB)) {
    CURRENT_PT_TAB = ['sizing', 'postop', 'planner', 'surgery', 'preop']
      .find(function (t) { return !ptTabHidden(t); }) || 'sizing';
  }
  // Reset cross-stage attachments rail so it doesn't leak between patients;
  // it'll be re-hydrated from PT_PREOP_DATA the moment the user lands on Sizing.
  if (typeof SF_ATTACHMENTS !== 'undefined') SF_ATTACHMENTS.length = 0;
  // For Post-op patients, default to the FIRST PENDING milestone (not always 1M)
  if (pt.stage === 'Post-op' && typeof _initialPostopMs === 'function') {
    CURRENT_PT_POSTOP_MS = _initialPostopMs(pt);
  } else {
    CURRENT_PT_POSTOP_MS = '1M';
  }
  if (CURRENT_MOD && CURRENT_MOD !== "patient") PREV_MOD = CURRENT_MOD;
  CURRENT_MOD = "patient";
  const main = document.getElementById("usMain");
  main.innerHTML = renderPatientPage(pt);
  main.scrollTop = 0;
  // Clear sidebar active (no module is active while viewing a patient)
  document.querySelectorAll("#usNav button").forEach(b => b.classList.remove("active"));
}
function closePatientFile() {
  CURRENT_PT = null;
  const target = PREV_MOD || "dashboard";
  renderModule(target);
}
function setPatientTab(tab, postopSub) {
  if (!CURRENT_PT) return;
  CURRENT_PT_TAB = tab;
  /* The timeline passes the milestone code ('1M', '3M', '2Y', …) — it is what
     the post-op page renders, so clicking a visit opens that visit. */
  if (tab === "postop" && postopSub) {
    CURRENT_PT_POSTOP_SUB = postopSub;
    if (typeof POSTOP_ORDER !== 'undefined' && POSTOP_ORDER.indexOf(postopSub) >= 0) CURRENT_PT_POSTOP_MS = postopSub;
  }
  const mainContent = document.getElementById("ptMainContent");
  if (!mainContent) return;
  if (tab === "preop")   mainContent.innerHTML = renderPtPreop(CURRENT_PT);
  if (tab === "sizing")  { mainContent.innerHTML = renderPtSizing(CURRENT_PT); _hydrateSizingFromPreop(CURRENT_PT); }
  if (tab === "planner") mainContent.innerHTML = renderPtPlanner(CURRENT_PT);
  if (tab === "surgery") mainContent.innerHTML = renderPtSurgery(CURRENT_PT);
  if (tab === "postop")  mainContent.innerHTML = renderPtPostop(CURRENT_PT);
  mainContent.scrollTop = 0;
  // Refresh the stepper visual state
  const stepWrap = document.querySelector('.pt-stepper');
  if (stepWrap) stepWrap.outerHTML = renderPtStepper(CURRENT_PT, tab);
  // Toggle full-width mode on Surgery tab so the OR screen gets the full area
  const ptPage = document.getElementById("ptPage");
  if (ptPage) ptPage.classList.toggle("full-width", tab === "surgery");
}

// Step-mode mapping: given patient stage + tab, is it read-only, editable, or locked?
function ptTabMode(pt, tab) {
  const stage = pt.stage;
  const stageOrder = { "Consult": 0, "Eligibility": 1, "Biometry": 1, "Sizing": 2, "Scheduled": 3, "Post-op": 5 };
  const tabOrder   = { "preop": 1, "sizing": 2, "planner": 3, "surgery": 4, "postop": 5 };
  const s = stageOrder[stage] != null ? stageOrder[stage] : 0;
  const t = tabOrder[tab];
  if (t <  s) return "read";
  if (t === s || (t === 1 && s <= 1)) return "edit";
  return "lock";
}
const PT_TABS = ["preop", "sizing", "planner", "surgery", "postop"];
const PT_TAB_LABELS = { preop: "Pre-op", sizing: "ICL selection", planner: "Surgical planner", surgery: "Surgery", postop: "Post-op" };
const PREV_MOD_LABELS = {
  dashboard: "Dashboard", preop: "Pre-op", sizing: "Sizing", order: "Order", surgery: "Surgery",
  postop: "Post-op", community: "Community", training: "Training", support: "Support", analytics: "Analytics",
};

function renderJourneyTimeline(journey) {
  const groups = [
    { label: "Pre-op",        match: "Pre-op",  cls: "preop"  },
    { label: "ICL selection", match: "Sizing",  cls: "sizing" },
    { label: "Post-op",       match: "Post-op", cls: "postop" },
  ];
  return `<div class="pd-timeline journey">${groups.map(g => {
    const items = journey.filter(s => s.group === g.match);
    const done = items.filter(i => i.status==='done').length;
    return `
      <div class="pd-journey-group ${g.cls}">
        <div class="pd-journey-group-head"><span class="jg-nm">${g.label}</span><span class="jg-ct">${done} / ${items.length} done</span></div>
        ${items.map(t => `
          <div class="pd-tl-item ${t.status}">
            <div class="tl-head">
              <div class="tl-date">Step ${t.idx+1} · ${t.date}</div>
              <span class="tl-status ${t.status}">${t.status === 'done' ? '✓ done' : t.status === 'active' ? '◉ in progress' : '○ pending'}</span>
            </div>
            <div class="tl-ttl">${t.ttl}</div>
            <div class="tl-body">${t.body}</div>
            ${t.metrics && Object.keys(t.metrics).length ? `<div class="tl-metrics">${Object.entries(t.metrics).map(([k,v]) => `<span class="tl-metric">${k}: ${v}</span>`).join("")}</div>` : ''}
          </div>`).join("")}
      </div>`;
  }).join("")}</div>`;
}


/* ================================================================
   Order on record — audit AHA-2
   ----------------------------------------------------------------
   STELLA returns an order number and it used to live only inside the
   modal that produced it: close the modal and the result of the whole
   journey was gone from the screen. An order is the case's state, so it
   belongs on the patient, next to stage and risk, on every tab.
================================================================ */
function ptOrdersFor(pt) {
  var out = [];
  try {
    var all = JSON.parse(localStorage.getItem('stella_order_confirmed') || '{}');
    var ids = ['REV-' + pt.id, pt.id, pt.caseId].filter(Boolean);
    Object.keys(all).forEach(function (k) {
      var caseId = k.split('|')[0];
      if (ids.indexOf(caseId) >= 0) out.push(all[k]);
    });
  } catch (e) {}
  return out;
}
function ptOrderChip(pt) {
  var os = ptOrdersFor(pt);
  if (!os.length) return '';
  return os.map(function (o) {
    var lens = o.lens ? o.lens.size + ' mm' : '';
    return '<span class="c ordered" title="Order confirmed in STELLA on ' +
      (o.confirmedAt || '').slice(0, 10) + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
      'Ordered ' + o.eye + ' \u00b7 ' + lens + ' \u00b7 No. ' + o.orderNo + '</span>';
  }).join('');
}

function renderPatientPage(pt) {
  const journey = patientJourney(pt);
  const doneCount = journey.filter(s => s.status === "done").length;
  const activeStep = journey.find(s => s.status === "active");
  const totalSteps = journey.length;
  const pct = Math.round(doneCount / totalSteps * 100);
  const backLabel = PREV_MOD_LABELS[PREV_MOD] || "Back";
  const modeNow = ptTabMode(pt, CURRENT_PT_TAB);
  const modeLabel = modeNow === "read" ? "Read mode · historical record" : modeNow === "edit" ? "Edit mode · current step" : "Locked · not yet reached";
  return `
    <div class="pt-page ${CURRENT_PT_TAB === 'surgery' ? 'full-width' : ''}" id="ptPage">
      <div class="pt-page-topbar">
        <button class="pt-back-btn" onclick="closePatientFile()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to ${backLabel}
        </button>
        <span class="pt-breadcrumb">Patients · <b>${pt.name}</b></span>
        <div style="flex:1"></div>
      </div>

      <div class="pt-page-header">
        <div class="pt-ph-av">${patientAvatar(pt)}</div>
        <div class="pt-ph-info">
          <h1>${pt.name}</h1>
          <div class="pt-ph-sub">REV-${pt.id} · ${pt.age}y · ${pt.sex} · eye ${pt.eye}${
            String(pt.power || '').trim() && String(pt.power).trim() !== '\u2014' ? ` · ${pt.power} D` : ''}</div>
          <div class="pt-ph-chips">
            <span class="c stage">Stage: ${pt.stage === 'Sizing' ? 'ICL selection' : pt.stage}</span>
            <span class="c eye">${pt.eye}</span>
            ${String(pt.power || '').trim() && String(pt.power).trim() !== '\u2014'
                ? `<span class="c pwr">${pt.power} D</span>`
                : `<span class="c pwr muted">No refraction yet</span>`}
            ${pt.risk ? `<span class="c risk-${pt.risk.level}">${pt.risk.level.toUpperCase()} risk · ${pt.risk.score}</span>` : ''}
            ${typeof ptOrderChip === 'function' ? ptOrderChip(pt) : ''}
          </div>
        </div>
        <div class="pt-ph-progress">
          <div class="pjb-track"><span style="width:${pct}%"></span></div>
          <div class="pt-ph-progress-meta">
            ${activeStep ? `<span>Current: <b>${activeStep.ttl}</b></span>` : `<span>All steps complete</span>`}
            <span>${doneCount}/${totalSteps} · ${pct}%</span>
          </div>
        </div>
      </div>

      ${renderPtStepper(pt, CURRENT_PT_TAB || 'preop')}
      <div class="pt-tabs-meta">
        <span class="pt-mode-badge ${modeNow}">${modeLabel}</span>
        <button class="pt-journey-btn" type="button" onclick="openJourneyDrawer()" title="Open the full patient journey timeline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 8v8M8 6h6a4 4 0 014 4M8 18h6a4 4 0 004-4"/></svg>
          Full journey
          <span class="pt-journey-btn-ct">${doneCount}/${totalSteps}</span>
        </button>
      </div>

      <div class="pt-page-body">
        <div id="ptMainContent" class="pt-main">${
          CURRENT_PT_TAB === 'sizing'  ? renderPtSizing(pt) :
          CURRENT_PT_TAB === 'planner' ? renderPtPlanner(pt) :
          CURRENT_PT_TAB === 'surgery' ? renderPtSurgery(pt) :
          CURRENT_PT_TAB === 'postop'  ? renderPtPostop(pt) :
          renderPtPreop(pt)
        }</div>
      </div>

      <!-- Slide-in drawer for the full Patient Journey timeline (opens on demand) -->
      <div class="pt-journey-drawer" id="ptJourneyDrawer" role="dialog" aria-modal="true" onclick="if(event.target===this) closeJourneyDrawer()">
        <aside class="pt-journey-drawer-panel">
          <header class="pt-journey-drawer-head">
            <div>
              <h3>Full patient journey</h3>
              <p>Every stage from first consult through Year 1 post-op. Green = done · orange = in progress · grey = pending.</p>
            </div>
            <button class="pt-journey-drawer-close" onclick="closeJourneyDrawer()" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </header>
          <div class="pt-journey-drawer-body">
            ${renderJourneyTimeline(journey)}
          </div>
        </aside>
      </div>
    </div>
  `;
}
