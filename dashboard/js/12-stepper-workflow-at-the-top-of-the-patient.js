// === Stepper / workflow at the top of the patient page ===

/* Pre-op, Surgical planner and Surgery are Phase 3 deliverables: while Phase 3
   is not active they are not shown in the timeline at all (not merely locked),
   and navigation must not land on them. */
var PHASE_HIDDEN_TABS = ['preop', 'planner', 'surgery'];
function ptTabHidden(tab){
  if (PHASE_HIDDEN_TABS.indexOf(tab) < 0) return false;
  var st = window.PHASE_DEMO;
  if (!st || !st.enabled || st.showAllPhases) return false;
  var ph = st.map && st.map['patient-' + tab];
  return !!ph && ph > st.currentPhase;
}

function renderPtStepper(pt, activeTab){
  // Stage → numeric position
  const stageOrder = { "Consult": 0, "Eligibility": 0, "Biometry": 0, "Sizing": 1, "Scheduled": 2, "Surgery": 3, "Post-op": 4 };
  const ptStageNum = (stageOrder[pt.stage] != null) ? stageOrder[pt.stage] : 0;

  /* Post-op visits come from the per-patient registry (js/22): the four
     standard follow-ups plus anything the surgeon added with "+". This
     timeline is the only place a post-op event is created. */
  const msList = (typeof postopMilestones === 'function') ? postopMilestones(pt.id) : ['1M','3M','6M','1Y'];
  const msLabel = (typeof POSTOP_LABEL !== 'undefined') ? POSTOP_LABEL : {};

  const steps = [
    { key: 'preop',   label: 'Pre-op',           tab: 'preop',   num: 0, ms: null },
    { key: 'sizing',  label: 'ICL selection',    tab: 'sizing',  num: 1, ms: null },
    { key: 'planner', label: 'Surgical planner', tab: 'planner', num: 2, ms: null },
    { key: 'surgery', label: 'Surgery',          tab: 'surgery', num: 3, ms: null },
  ].concat(msList.map(function(m){
    return { key: 'po-' + m, label: 'Post-op', tab: 'postop', num: 4, ms: m, sub: msLabel[m] || m };
  }));

  const visibleSteps = steps.filter(function(s){ return !ptTabHidden(s.tab); });

  function _msIsDone(ms){
    if (!ms || typeof postopVisitData !== 'function') return false;
    return !!postopVisitData(pt, CURRENT_PT_POSTOP_EYE || 'OD', ms).captured;
  }
  // The "next" post-op visit is the first one not yet captured
  const nextMs = (function(){
    for (var i = 0; i < msList.length; i++) if (!_msIsDone(msList[i])) return msList[i];
    return null;
  })();

  function stateFor(s){
    if (s.tab === 'postop' && s.ms) {
      if (_msIsDone(s.ms)) return 'done';
      if (s.ms === nextMs) return 'active';
      return 'pending';
    }
    if (s.num < ptStageNum) return 'done';
    if (s.num === ptStageNum) return 'active';
    return 'pending';
  }

  /* "+" slots: one before the first follow-up (earlier visits) and one after
     the last (later visits). They only appear when something is left to add. */
  function addSlot(slot){
    var pool = slot === 'early'
      ? (typeof POSTOP_EARLY_OPTIONS !== 'undefined' ? POSTOP_EARLY_OPTIONS : [])
      : (typeof POSTOP_LATE_OPTIONS  !== 'undefined' ? POSTOP_LATE_OPTIONS  : []);
    var left = pool.filter(function(m){ return msList.indexOf(m) < 0; });
    if (!left.length) return '';
    var title = slot === 'early' ? 'Add an earlier follow-up' : 'Add a later follow-up';
    return '<button type="button" class="pt-step-add" data-slot="' + slot + '" title="' + title + '"'
      + ' onclick="openPostopAdd(\'' + slot + '\', event)" aria-label="' + title + '">+</button>'
      + '<span class="pt-step-link"></span>';
  }

  const firstPostopIdx = visibleSteps.findIndex(function(s){ return s.tab === 'postop'; });
  let n = 0;
  const html = visibleSteps.map(function(s, i){
    const st = stateFor(s);
    const isActiveTab = activeTab === s.tab && (!s.ms || (CURRENT_PT_POSTOP_MS || '1M') === s.ms);
    const cls = ['pt-step', st, isActiveTab ? 'is-current-tab' : ''].filter(Boolean).join(' ');
    const onclick = "setPatientTab('" + s.tab + "'" + (s.ms ? ",'" + s.ms + "'" : '') + ")";
    n += 1;
    const before = (i === firstPostopIdx) ? addSlot('early') : '';
    return before + `
      <button type="button" class="${cls}" onclick="${onclick}" data-tab="${s.tab}" data-ms="${s.ms||''}" data-sub="${s.sub||''}" title="${s.label}${s.sub ? ' · ' + s.sub : ''}">
        <span class="pt-step-node">
          ${st === 'done'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<span class="pt-step-num">' + n + '</span>'}
        </span>
        <span class="pt-step-lbl">
          <span class="pt-step-name">${s.label}</span>
          ${s.sub ? `<span class="pt-step-sub">${s.sub}</span>` : ''}
        </span>
      </button>
      ${i < visibleSteps.length - 1 ? '<span class="pt-step-link"></span>' : ''}
    `;
  }).join('');
  const trailing = (firstPostopIdx >= 0) ? '<span class="pt-step-link"></span>' + addSlot('late').replace(/<span class="pt-step-link"><\/span>$/, '') : '';
  return `<div class="pt-stepper" role="tablist">${html}${trailing}</div>`;
}

/* The "+" picker — the only way a non-standard follow-up gets created. */
function openPostopAdd(slot, ev){
  if (ev) ev.stopPropagation();
  closePostopAdd();
  var pt = (typeof CURRENT_PT !== 'undefined') ? CURRENT_PT : null;
  if (!pt) return;
  var have = postopMilestones(pt.id);
  var pool = slot === 'early' ? POSTOP_EARLY_OPTIONS : POSTOP_LATE_OPTIONS;
  var left = pool.filter(function(m){ return have.indexOf(m) < 0; });
  if (!left.length) return;
  var anchor = ev && ev.currentTarget ? ev.currentTarget : document.querySelector('.pt-step-add[data-slot="' + slot + '"]');
  var menu = document.createElement('div');
  menu.className = 'pt-add-menu';
  menu.id = 'ptAddMenu';
  menu.innerHTML = '<div class="pt-add-head">'
    + (slot === 'early' ? 'Add an earlier follow-up' : 'Add a later follow-up') + '</div>'
    + left.map(function(m){
        return '<button type="button" onclick="addPostopMilestone(\'' + pt.id + '\',\'' + m + '\');closePostopAdd()">'
          + (POSTOP_LABEL[m] || m) + '</button>';
      }).join('');
  document.body.appendChild(menu);
  if (anchor) {
    var r = anchor.getBoundingClientRect();
    menu.style.top  = Math.round(r.bottom + window.scrollY + 8) + 'px';
    menu.style.left = Math.round(Math.min(r.left + window.scrollX, window.innerWidth - 190)) + 'px';
  }
}
function closePostopAdd(){
  var m = document.getElementById('ptAddMenu');
  if (m) m.remove();
}
document.addEventListener('click', function(e){
  if (e.target.closest && (e.target.closest('#ptAddMenu') || e.target.closest('.pt-step-add'))) return;
  closePostopAdd();
});

// Postop sub-step state (which milestone tab is active)
var CURRENT_PT_POSTOP_SUB = '1 mo';

// Drawer open/close
function openJourneyDrawer(){
  var d = document.getElementById('ptJourneyDrawer');
  if (d){ d.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeJourneyDrawer(){
  var d = document.getElementById('ptJourneyDrawer');
  if (d){ d.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    var d = document.getElementById('ptJourneyDrawer');
    if (d && d.classList.contains('open')) closeJourneyDrawer();
  }
});

function renderPtPreop(pt) {
  const el = patientEligibility(pt);
  const elH = el.map(e => `
    <div class="check-item ${e.pass ? 'pass' : 'fail'}">
      <div class="ico">${e.pass
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'}
      </div>
      <div class="lbl">${e.lbl}</div>
      <div class="val">${e.val}</div>
    </div>`).join("");
  const passed = el.filter(x => x.pass).length;
  // AI Sentinel only renders when BOTH conditions are true:
  //   1) Clinical data has actually been ingested (EHR import or at least one study)
  //   2) That data has triggered a real risk (pt.risk truthy)
  // No data → no Sentinel. Data + no risk → no Sentinel. Only fire when there's actually something to flag.
  const _sentStore = (typeof PT_PREOP_DATA !== 'undefined') ? (PT_PREOP_DATA[pt.id] || null) : null;
  const _hasIngestedData = !!(_sentStore && (_sentStore.ehrImported || (_sentStore.attachments && _sentStore.attachments.length)));
  const _aiSentinelHtml = (_hasIngestedData && pt.risk) ? `
    <div class="pd-section ai-sentinel-section">
      <h4>
        <span class="ai-sent-title">
          <span class="ai-sent-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg></span>
          AI Sentinel · risk flag
        </span>
        <span class="ai-sent-brand">
          <span class="muted small" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;">Powered by</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="3.99 5.98 334.56 24.42" aria-label="STAAR Surgical" style="width:78px;height:auto;display:block;"><defs><style>.aisl-fill{fill:#001E60;stroke-width:0px;}</style></defs><path class="aisl-fill" d="m56,16.54c-1.46-2.12-3.53-4.01-6.15-5.61-5.2-3.19-12.07-4.95-19.36-4.95s-14.16,1.76-19.36,4.95c-2.62,1.6-4.68,3.49-6.15,5.61-.37.54-.7,1.09-.99,1.65h3.9c.46,0,.9-.2,1.21-.55,1.06-1.21,2.43-2.34,4.08-3.36,4.59-2.81,10.73-4.36,17.3-4.36s12.71,1.55,17.3,4.36c1.75,1.07,3.18,2.28,4.26,3.56.17.2.17.49,0,.69-1.08,1.29-2.51,2.49-4.26,3.56-1.71,1.05-3.51,1.92-5.42,2.61,1.31-1.88,2.15-4.1,2.34-6.51h-3.96c-.53,4.65-4.49,8.27-9.27,8.27s-8.75-3.62-9.28-8.27h-3.95c.54,6.82,6.27,12.25,13.23,12.21,6.87-.03,13.17-1.76,18.37-4.94,2.62-1.6,4.68-3.49,6.15-5.61.19-.28.37-.56.54-.84.3-.5.3-1.13,0-1.63-.17-.28-.35-.56-.54-.84"/></svg>
        </span>
      </h4>
      <div class="pd-risk-card ${pt.risk.level}">
        <div class="rh">${pt.risk.level==='high'?'HIGH':pt.risk.level==='med'?'MEDIUM':'LOW'} RISK · score ${pt.risk.score}/100</div>
        <div class="rf">${pt.risk.flag}</div>
        <div class="rr">→ ${pt.risk.reco}</div>
      </div>
    </div>` : '';
  return `
    ${renderPreopDataIngestSection(pt)}
    ${_aiSentinelHtml}
    ${renderProcedureRecSection(pt)}
    <div class="pd-section" id="eligibilitySection_${pt.id}">
      ${renderEligibilityChecklist(pt)}
    </div>
    ${renderStageAdvanceCta(pt, 'preop')}
  `;
}

// Render-only helper so the eligibility section can be re-rendered live without re-rendering everything
function renderEligibilityChecklist(pt){
  var el = patientEligibility(pt);
  var passed = el.filter(function(x){ return x.pass; }).length;
  var elH = el.map(function(e){
    return '<div class="check-item ' + (e.pass ? 'pass' : 'fail') + '">' +
      '<div class="ico">' + (e.pass
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>') +
      '</div>' +
      '<div class="lbl">' + e.lbl + '</div>' +
      '<div class="val">' + e.val + '</div>' +
    '</div>';
  }).join('');
  return '<h4>Eligibility checklist <span class="tag">' + passed + '/' + el.length + ' passed</span></h4>' +
         '<div class="check-list">' + elH + '</div>';
}
