/* ================================================================
   STELLA → EVO CONNECT HANDOFF (Journey 1, steps 3–6)
   ----------------------------------------------------------------
   Loaded LAST (after js/34). Classic script; depends on globals from
   js/01 (DATA), js/08 (showToast), js/11 (openPatientFile/setPatientTab),
   js/15 (SIZING_FORMULAS / SELECTED_SIZING_FORMULAS), js/16 (EYE_SCOPE /
   EYE_INPUTS), js/19 (runSizingFormulas / selectSizingFormula /
   openStellaOrder), js/26 (openUniverse). Nothing existing references
   this file or STELLA_HANDOFF (ADR-0001/0002/0003, 04-architecture).

   Boundary rules (ESCRS brief L1–L7): synthetic only; no ordering from
   REVAI; zero bytes back to STELLA (the only link out is the literal
   Return anchor in returnCta(), no query, no hash); no ranking /
   pre-selection; STELLA row locked first;
   demo stamp on every screen. All user-facing copy is taken verbatim
   from artifacts/05-compliance-review.md §2.
   ================================================================ */
(function () {
  'use strict';

  /* ---------- approved copy (05-compliance-review §2) ---------- */
  var COPY = {
    A1: 'Case received from STELLA · {caseId} · {lat} · {sentAt}',
    A2: 'From STELLA · {caseId} · {lat} · STELLA {size} mm',
    A3: 'Incomplete case from STELLA — return to STELLA and relaunch. No eye was assumed.',
    C3: 'You are leaving STELLA · external service by REVAI',
    P1: 'STELLA recommendation',
    P2: 'Calculated by STAAR',
    P3: 'Always on · STELLA reference cannot be turned off',
    P4: '{size} mm · {model} · {formula} · {calculatedAt}',
    P5: 'STELLA · {size} mm · V8.00 OUS',
    T1: 'from STELLA',
    T2: 'as entered in STELLA (manual)',
    T3: 'EVO estimate · not from STELLA',
    T5: 'Derived in EVO Connect from STELLA K1/K2',
    T4: 'Edited by surgeon · STELLA: {value}',
    T4r: 'Reset to STELLA values',
    K1: 'Available methods — select any',
    K2: 'STELLA · always on',
    M5: 'Version: to be confirmed by STAAR',
    M6: 'Synthetic demo output · attribution pending STAAR',
    M7: 'Model confidence {NN}%',
    M8: 'Predicted vault {N} µm · in range',
    D1: 'Δ vs STELLA: {d} mm',
    S1: 'Calculated by STAAR · always shown first',
    S2: "This row is STELLA's recommendation. It cannot be hidden or reordered.",
    N1: '{N} methods run',
    N2: 'Select a method to compare',
    J1: 'Your decision',
    J2: 'Accept STELLA recommendation ({size} mm)',
    J3: 'Prefer another lens',
    J7: 'Save decision',
    J8: 'Decision recorded in EVO Connect — nothing was sent to STELLA',
    R1: 'Return to STELLA to confirm the order',
    R2: 'Nothing is sent back. In STELLA you enter and confirm the lens yourself.',
    R3: 'You are returning to STELLA · STAAR system of record',
    R4: 'Return without recording your decision?',
    R4a: 'Return anyway', R4b: 'Stay',
    O1: 'Orders are created in STELLA only',
    F1: 'Demonstration only – synthetic data – not for clinical use'
  };
  var METHODS = [ // J5
    { code: 'ICL_GURU', label: 'ICL Guru' }, { code: 'ICL_FIT', label: 'ICLFIT' },
    { code: 'CASIA2', label: 'CASIA2' }, { code: 'OTHER', label: 'Other / custom' }
  ];
  var REASONS = [ // J6 = ADR-0002 codes
    { code: 'VAULT_BAND', label: 'Vault prediction' }, { code: 'WTW_DISCREPANCY', label: 'WTW discrepancy' },
    { code: 'ANATOMY_ASOCT', label: 'AS-OCT anatomy' }, { code: 'SURGEON_EXPERIENCE', label: 'Surgeon experience' },
    { code: 'OTHER', label: 'Other' }
  ];
  var SIZES = ['12.1', '12.6', '13.2', '13.7'];
  /* Planned-lens size options: catalog sizes plus every size a method run
     produced for this case (so the surgeon can record exactly what she saw). */
  function sizeOptions(rec) {
    var set = SIZES.slice();
    var last = (window._SF_LAST_RESULTS && window._SF_LAST_RESULTS.patientId === rec.caseId) ? window._SF_LAST_RESULTS.results : [];
    (last || []).forEach(function (r) { var v = parseFloat(r.recSize).toFixed(1); if (set.indexOf(v) < 0) set.push(v); });
    return set.sort(function (x, y) { return parseFloat(x) - parseFloat(y); });
  }
  function refreshSizeOptions(rec) {
    var sel = document.querySelector('#shDecisionForm [name="sh-size"]'); if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">—</option>' + sizeOptions(rec).map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
    sel.value = cur;
  }

  /* Deterministic demo values for the disagreement case (ADR-0003). */
  var OVERRIDES = { ICL_GURU: { recSize: 13.6, vault: 520 }, ICL_FIT: { recSize: 13.7, vault: 480 }, CASIA2: { recSize: 13.6, vault: 510 } };
  var HANDOFF_SET = ['ICL_GURU', 'ICL_FIT', 'CASIA2'];
  var STORE_KEY = 'stella_handoff', DECISION_KEY = 'stella_handoff_decision';
  var STELLA_LOGO = '/assets/marketplace/stella_logo_official.svg';   // asset only, not a navigation target

  /* ---------- utils ---------- */
  function fmt(t, o) { return t.replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : '—'; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function utc(iso) {
    var d = new Date(iso); if (isNaN(d.getTime())) return '—';
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ' UTC';
  }
  function b64urlDecode(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }
  function toast(m) { if (typeof showToast === 'function') showToast(m); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  /* ---------- parse + validate (ADR-0001 D, ADR-0002 v1 whitelist) ---------- */
  var NUM = /^[-+]?\d{1,4}(\.\d{1,3})?$/;
  var INPUT_KEYS = ['sph', 'cyl', 'axis', 'bvd', 'k1', 'k1a', 'k2', 'k2a', 'acd', 'cct', 'ww'];
  var UNITS = { sph: 'D', cyl: 'D', axis: '°', bvd: 'mm', k1: 'D', k1a: '°', k2: 'D', k2a: '°', acd: 'mm', cct: 'µm', ww: 'mm' };

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return null;
    var caseId = String(raw.caseId || '');
    if (!/^[A-Z0-9][A-Z0-9-]{2,31}$/.test(caseId)) return null;
    var lat = raw.laterality;
    if (lat !== 'OD' && lat !== 'OS') return null;                        // enumerated, never inferred
    var src = raw.inputs && raw.inputs[lat];
    if (!src || typeof src !== 'object') return null;
    var inputs = {};
    for (var i = 0; i < INPUT_KEYS.length; i++) {
      var k = INPUT_KEYS[i], e = src[k];
      var v = e && typeof e === 'object' ? e.v : e;
      if (typeof v !== 'string' || !NUM.test(v.trim())) return null;
      inputs[k] = { v: v.trim(), u: UNITS[k], prov: 'STELLA' };
      if (k === 'cyl') inputs[k].notation = 'plus-cyl';
    }
    var r = raw.stellaRecommendation || {};
    var size = String(r.size || '');
    if (SIZES.indexOf(size) < 0) return null;
    var pw = null;
    if (r.power && typeof r.power === 'object' && typeof r.power.sph === 'string') {
      pw = { sph: String(r.power.sph), cyl: String(r.power.cyl || ''), axis: String(r.power.axis || '') };
    }
    var rec = {
      size: size,
      model: r.model === 'Myopic' ? 'Myopic' : 'Toric Myopic',
      power: pw,
      cylPower: typeof r.cylPower === 'string' ? r.cylPower : null,
      formula: 'Calculator V8.00 OUS',
      calculatedAt: typeof r.calculatedAt === 'string' ? r.calculatedAt : null
    };
    var k1 = parseFloat(inputs.k1.v), k2 = parseFloat(inputs.k2.v);
    var rec2 = {
      v: 1, caseId: caseId, laterality: lat,
      sentAt: typeof raw.sentAt === 'string' ? raw.sentAt : null,
      receivedAt: new Date().toISOString(),
      source: { system: 'STELLA', version: 'Calculator V8.00 OUS' },
      inputs: {}, stellaRecommendation: rec,
      derived: { kmean: { v: ((k1 + k2) / 2).toFixed(2), u: 'D', prov: 'DERIVED', rule: '(K1+K2)/2' } },
      evoEstimates: ['sf-ata', 'sf-sts', 'sf-arise', 'sf-clr', 'sf-rx-cyc-*', 'sf-rx-aut-*', 'AL', 'Pupil'],
      decision: null,
      ui: { methodsRun: [], selectedCard: null }
    };
    rec2.inputs[lat] = inputs;
    return rec2;
  }

  function readPayload() {
    var q = null;
    try { q = new URLSearchParams(window.location.search).get('handoff'); } catch (e) { q = null; }
    var badQuery = false;
    if (q) {
      try {
        var rec = normalize(JSON.parse(b64urlDecode(q)));
        if (rec) { try { sessionStorage.setItem(STORE_KEY, q); } catch (e) {} return rec; }
      } catch (e) {}
      badQuery = true;                                                   // query present but invalid: no case opens
    }
    if (badQuery) return { error: true };
    try {
      var s = sessionStorage.getItem(STORE_KEY);
      if (s) { var rec2 = normalize(JSON.parse(b64urlDecode(s))); if (rec2) return rec2; }
    } catch (e) {}
    return null;
  }

  /* ---------- formula catalog additions (data only, ADR-0003) ---------- */
  var CATALOG_META = {
    ICL_GURU: { modality: 'UBM', device: 'Sonomed / Quantel / ArcScan', version: null },
    ICL_FIT: { modality: 'AS-OCT', device: 'Pentacam AXL Wave', version: null },
    CASIA2: { modality: 'AS-OCT', device: 'Tomey CASIA2', version: null },
    REINSTEIN: { modality: 'UBM', device: '—', version: null },
    LASSO: { modality: '—', device: '—', version: null },
    KS: { modality: 'AS-OCT', device: '—', version: null },
    STAAR_NOM: { modality: '—', device: '—', version: null }
  };
  if (typeof SIZING_FORMULAS !== 'undefined' && Array.isArray(SIZING_FORMULAS)) {
    if (!SIZING_FORMULAS.some(function (f) { return f.code === 'CASIA2'; })) {
      SIZING_FORMULAS.push({
        code: 'CASIA2', name: 'CASIA2 formula', desc: 'AS-OCT anterior-segment sizing · Tomey CASIA2',
        recSize: 12.6, vault: 400, conf: 90, author: COPY.M6, modality: 'AS-OCT', device: 'Tomey CASIA2',
        version: null, predictsVault: true
      });
    }
    SIZING_FORMULAS.forEach(function (f) {
      var m = CATALOG_META[f.code]; if (!m) return;
      if (f.modality == null) f.modality = m.modality;
      if (f.device == null) f.device = m.device;
      if (f.version === undefined) f.version = m.version;
      if (f.code === 'ICL_FIT') f.name = 'ICLFIT';               // E2: align card title with approved C2/J5
    });
  }

  /* ---------- state ---------- */
  var H = null;                       // window.STELLA_HANDOFF
  var DEFAULT_SET = null;             // SELECTED_SIZING_FORMULAS before the handoff took over
  var allowReturn = false;

  function isHandoff(pid) { return !!(H && pid === H.caseId); }
  function currentIsHandoff() { return !!(H && typeof CURRENT_PT !== 'undefined' && CURRENT_PT && CURRENT_PT.id === H.caseId); }

  /* ---------- synthetic patient projection (ADR-0002, compliance: age/sex null) ---------- */
  function upsertPatient(rec) {
    var list = DATA.patients;
    var donor = list.find(function (p) { return p.portrait; });
    var portrait = donor ? Object.assign({}, donor.portrait, { bg: '#EAEEF5', shirt: '#5A6478', hair: '#3A3F4A', skin: '#D9B99B', hairShape: 'short', lips: '#A9564F' })
                         : { bg: '#EAEEF5', skin: '#D9B99B', hair: '#3A3F4A', shirt: '#5A6478', hairShape: 'short', lips: '#A9564F' };
    var sph = rec.inputs[rec.laterality].sph.v;
    var pt = {
      id: rec.caseId, name: rec.caseId + ' · from STELLA', age: null, sex: null,
      eye: rec.laterality, power: sph, stage: 'Sizing', status: 'wait',
      portrait: portrait, risk: null, stellaHandoff: true
    };
    var i = list.findIndex(function (p) { return p.id === rec.caseId; });
    if (i >= 0) list[i] = Object.assign(list[i], pt); else list.push(pt);
    return pt;
  }

  /* Null demographics render as "—" (compliance ruling on the projection). */
  function patchNulls(root) {
    if (!root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, list = [];
    while ((n = w.nextNode())) if (/\bnully\b|\bnull\b/.test(n.nodeValue)) list.push(n);
    list.forEach(function (t) { t.nodeValue = t.nodeValue.replace(/\bnully\b/g, '—').replace(/\bnull\b/g, '—'); });
  }

  /* ---------- prefill (ADR-0003 table) ---------- */
  function stripPlus(v) { return String(v).replace(/^\+/, ''); }
  function mapping(rec) {
    var I = rec.inputs[rec.laterality];
    return [
      { id: 'sf-rx-man-sph', v: I.sph.v }, { id: 'sf-rx-man-cyl', v: I.cyl.v, note: 'plus-cyl · as entered in STELLA' },
      { id: 'sf-rx-man-ax', v: I.axis.v }, { id: 'sf-rx-man-k1', v: stripPlus(I.k1.v) },
      { id: 'sf-rx-man-k1ax', v: I.k1a.v }, { id: 'sf-rx-man-k2', v: stripPlus(I.k2.v) },
      { id: 'sf-acd', v: I.acd.v }, { id: 'sf-wtw', v: I.ww.v }
    ];
  }
  var ESTIMATE_IDS = ['sf-ata', 'sf-sts', 'sf-arise', 'sf-clr', 'sf-kmean',
    'sf-rx-cyc-sph', 'sf-rx-cyc-cyl', 'sf-rx-cyc-ax', 'sf-rx-cyc-k1', 'sf-rx-cyc-k1ax', 'sf-rx-cyc-k2',
    'sf-rx-aut-sph', 'sf-rx-aut-cyl', 'sf-rx-aut-ax', 'sf-rx-aut-k1', 'sf-rx-aut-k1ax', 'sf-rx-aut-k2'];

  function tagFor(input, cls, text, title) {
    var cell = input.closest('.sf-rx-cell, .sf-input');
    if (!cell) return null;
    var old = cell.querySelector('.sh-prov'); if (old) old.remove();
    var tag = el('<span class="sh-prov ' + cls + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + esc(text) + '</span>');
    var label = cell.querySelector('label');
    if (label) label.insertAdjacentElement('afterend', tag); else cell.prepend(tag);
    return tag;
  }

  function prefill(rec) {
    var lat = rec.laterality;
    var store = (typeof EYE_INPUTS !== 'undefined') ? (EYE_INPUTS[lat] = EYE_INPUTS[lat] || {}) : {};
    mapping(rec).forEach(function (m) {
      var input = document.getElementById(m.id); if (!input) return;
      input.value = m.v; store[m.id] = m.v;
      input.setAttribute('data-sh-stella', m.v);
      tagFor(input, 'stella', COPY.T1, m.note ? COPY.T2 + ' · ' + m.note : COPY.T2);
      input.addEventListener('input', onEdit);
    });
    var km = document.getElementById('sf-kmean');
    if (km) { km.value = rec.derived.kmean.v; store['sf-kmean'] = km.value; }
    ESTIMATE_IDS.forEach(function (id) {
      var input = document.getElementById(id); if (!input) return;
      tagFor(input, id === 'sf-kmean' ? 'derived' : 'estimate', id === 'sf-kmean' ? COPY.T5 : COPY.T3, id === 'sf-kmean' ? COPY.T5 : null);
    });
    var hs = document.getElementById('sf-sph'), hc = document.getElementById('sf-cyl');
    if (hs) hs.value = rec.inputs[lat].sph.v;
    if (hc) hc.value = rec.inputs[lat].cyl.v;
    patchKpis(rec);
    var head = document.querySelector('.sf-subgroup[data-sg="rx"] .sf-subgroup-head');
    if (head && !document.getElementById('shResetLink')) {
      head.appendChild(el('<button type="button" class="sh-reset" id="shResetLink" hidden>' + esc(COPY.T4r) + '</button>'));
      document.getElementById('shResetLink').addEventListener('click', function () { resetToStella(rec); });
    }
  }
  function onEdit(e) {
    var input = e.target, orig = input.getAttribute('data-sh-stella');
    if (input.value.trim() === orig) tagFor(input, 'stella', COPY.T1, COPY.T2);
    else tagFor(input, 'edited', fmt(COPY.T4, { value: orig }), COPY.T2);
    var any = Array.prototype.some.call(document.querySelectorAll('[data-sh-stella]'), function (i) { return i.value.trim() !== i.getAttribute('data-sh-stella'); });
    var r = document.getElementById('shResetLink'); if (r) r.hidden = !any;
  }
  function resetToStella(rec) {
    document.querySelectorAll('[data-sh-stella]').forEach(function (i) {
      i.value = i.getAttribute('data-sh-stella');
      i.dispatchEvent(new Event('input', { bubbles: true }));
    });
    if (typeof EYE_INPUTS !== 'undefined') mapping(rec).forEach(function (m) { EYE_INPUTS[rec.laterality][m.id] = m.v; });
  }
  function patchKpis(rec) {
    var I = rec.inputs[rec.laterality];
    var vals = { 'K-mean': { v: rec.derived.kmean.v, u: 'D', cls: 'derived', t: COPY.T5 },
                 'ACD': { v: I.acd.v, u: 'mm', cls: 'stella', t: COPY.T1 },
                 'WTW': { v: I.ww.v, u: 'mm', cls: 'stella', t: COPY.T1 },
                 'CCT': { v: I.cct.v, u: 'µm', cls: 'stella', t: COPY.T1 } };
    document.querySelectorAll('.seb-kpi').forEach(function (k) {
      var lbl = k.querySelector('.kpi-lbl'), val = k.querySelector('.kpi-val'); if (!lbl || !val) return;
      var m = vals[lbl.textContent.trim()];
      if (m) val.innerHTML = esc(m.v) + '<em>' + esc(m.u) + '</em>';
      var old = k.querySelector('.sh-prov'); if (old) old.remove();
      k.appendChild(el('<span class="sh-prov ' + (m ? m.cls : 'estimate') + '">' + esc(m ? m.t : COPY.T3) + '</span>'));
    });
    var nick = document.querySelector('.seb-eye-nickname');
    if (nick) nick.textContent = rec.caseId + ' · — · —';
  }

  /* ---------- chips (K1/K2) ---------- */
  function decorateChips() {
    var grid = document.querySelector('.sf-formulas-grid'); if (!grid || grid.querySelector('.sh-stella-chip')) return;
    grid.insertAdjacentElement('beforebegin', el('<div class="sh-chip-caption">' + esc(COPY.K1) + '</div>'));
    grid.prepend(el(
      '<div class="sf-formula-chip selected sh-stella-chip" role="checkbox" aria-checked="true" aria-disabled="true" tabindex="0" title="' + esc(COPY.P3) + '">' +
      '<span class="sfc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
      '<span class="sfc-body"><span class="sfc-name">' + esc(COPY.K2) + '</span><span class="sfc-author">' + esc(COPY.P2) + '</span></span>' +
      '<span class="sh-lock" aria-hidden="true">' + lockSvg() + '</span></div>'));
  }
  function lockSvg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>'; }

  /* ---------- sticky strip + arrival banner + panel ---------- */
  function returnCta(compact, rec) {
    var a = el('<a class="sh-return' + (compact ? ' compact' : '') + '" href="/stella">' + esc(COPY.R1) + '</a>');
    a.addEventListener('click', function (e) {
      if (allowReturn || (H && H.decision)) return;
      e.preventDefault(); showReturnPrompt(a);
    });
    return a;
  }
  function showReturnPrompt(anchor) {
    var old = document.getElementById('shReturnPrompt'); if (old) old.remove();
    var p = el('<div class="sh-prompt" id="shReturnPrompt" role="dialog" aria-modal="true" aria-labelledby="shPromptTitle">' +
      '<div class="sh-prompt-card"><div class="sh-prompt-title" id="shPromptTitle">' + esc(COPY.R4) + '</div>' +
      '<div class="sh-prompt-actions"><button type="button" class="sh-btn ghost" data-sh="stay">' + esc(COPY.R4b) + '</button>' +
      '<button type="button" class="sh-btn" data-sh="go">' + esc(COPY.R4a) + '</button></div></div></div>');
    p.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sh]'); if (!b && e.target !== p) return;
      p.remove();
      if (b && b.getAttribute('data-sh') === 'go') { allowReturn = true; anchor.click(); }
    });
    document.body.appendChild(p);
    p.querySelector('[data-sh="stay"]').focus();
  }

  function buildStrip(rec) {
    var s = el('<div class="sh-strip" role="region" aria-label="STELLA case reference">' +
      '<img class="sh-strip-logo" src="' + STELLA_LOGO + '" alt="STELLA">' +
      '<span class="sh-strip-facts">' + esc(fmt(COPY.A2, { caseId: rec.caseId, lat: rec.laterality, size: rec.stellaRecommendation.size })) + '</span>' +
      '<span class="sh-strip-boundary">' + esc(COPY.C3) + '</span>' +
      '<span class="sh-stamp">' + esc(COPY.F1) + '</span></div>');
    s.appendChild(returnCta(true, rec));
    return s;
  }
  function buildBanner(rec) {
    var b = el('<div class="sh-banner" id="shArrival">' +
      '<span class="sh-banner-full">' + esc(fmt(COPY.A1, { caseId: rec.caseId, lat: rec.laterality, sentAt: utc(rec.sentAt) })) + '</span>' +
      '<span class="sh-banner-short">' + esc(fmt(COPY.A2, { caseId: rec.caseId, lat: rec.laterality, size: rec.stellaRecommendation.size })) + '</span>' +
      '<button type="button" class="sh-banner-toggle" aria-expanded="true" aria-controls="shArrival" title="Collapse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button></div>');
    b.querySelector('.sh-banner-toggle').addEventListener('click', function () {
      var c = b.classList.toggle('collapsed'); this.setAttribute('aria-expanded', String(!c)); this.title = c ? 'Expand' : 'Collapse';
    });
    return b;
  }
  function buildPanel(rec) {
    var R = rec.stellaRecommendation, I = rec.inputs[rec.laterality];
    var power = R.power ? (R.power.sph + ' ' + R.power.cyl + ' x' + R.power.axis) : 'power not selected in STELLA';
    var row = function (k, l) { return '<div class="sh-in"><span>' + esc(l) + '</span><b>' + esc(I[k].v) + ' <em>' + esc(I[k].u) + '</em></b></div>'; };
    return el('<aside class="sh-panel" aria-labelledby="shPanelTitle">' +
      '<div class="sh-panel-mini">' + esc(fmt(COPY.P5, { size: R.size })) + '</div>' +
      '<div class="sh-panel-body">' +
        '<div class="sh-panel-head"><img src="' + STELLA_LOGO + '" alt="STELLA">' +
          '<div><div class="sh-panel-title" id="shPanelTitle">' + esc(COPY.P1) + '</div><div class="sh-panel-tag">' + esc(COPY.P2) + '</div></div></div>' +
        '<div class="sh-lockrow" title="' + esc(COPY.P3) + '"><span class="sh-switch" role="switch" aria-checked="true" aria-disabled="true" tabindex="0" aria-label="' + esc(COPY.P3) + '"><span class="sh-knob"></span></span>' +
          '<span class="sh-lock-lbl">' + lockSvg() + esc(COPY.P3) + '</span></div>' +
        '<div class="sh-size">' + esc(R.size) + '<em>mm</em></div>' +
        '<div class="sh-line">' + esc(fmt(COPY.P4, { size: R.size, model: R.model, formula: R.formula, calculatedAt: utc(R.calculatedAt) })) + '</div>' +
        '<div class="sh-kv"><span>Lens power</span><b>' + esc(power) + '</b></div>' +
        '<div class="sh-kv"><span>Cylinder power</span><b>' + esc(R.cylPower || '—') + '</b></div>' +
        '<div class="sh-case"><span class="sh-case-id">' + esc(rec.caseId) + '</span><span class="sh-case-eye">' + esc(rec.laterality) + '</span></div>' +
        '<details class="sh-panel-inputs"><summary>' + esc(COPY.T1) + ' · 11 inputs</summary>' +
        '<div class="sh-inputs">' +
          row('sph', 'Sphere') + row('cyl', 'Cylinder') + row('axis', 'Axis') + row('bvd', 'BVD') +
          row('k1', 'K1') + row('k1a', 'K1 axis') + row('k2', 'K2') + row('k2a', 'K2 axis') +
          row('acd', 'ACD') + row('cct', 'CCT') + row('ww', 'WTW') +
        '</div></details>' +
        '<div class="sh-panel-foot">' + esc(COPY.T2) + ' · sent ' + esc(utc(rec.sentAt)) + '</div>' +
      '</div></aside>');
  }

  /* ---------- decision block (US-6 / J1–J9) ---------- */
  function decisionForm(rec) {
    var R = rec.stellaRecommendation, d = rec.decision || {};
    var chk = function (c, v) { return c === v ? ' checked' : ''; };
    var sel = function (c, v) { return c === v ? ' selected' : ''; };
    var pw = d.plannedLens && d.plannedLens.power != null ? d.plannedLens.power : '';
    var ax = d.plannedLens && d.plannedLens.axis != null ? d.plannedLens.axis : '';
    return '<form class="sh-form" id="shDecisionForm" novalidate>' +
      '<fieldset class="sh-fs"><legend class="sh-lg">Decision</legend>' +
        '<label class="sh-radio"><input type="radio" name="sh-choice" value="accept"' + chk(d.choice, 'accept') + '><span>' + esc(fmt(COPY.J2, { size: R.size })) + '</span></label>' +
        '<label class="sh-radio"><input type="radio" name="sh-choice" value="prefer"' + chk(d.choice, 'prefer') + '><span>' + esc(COPY.J3) + '</span></label>' +
        '<div class="sh-err" data-err="choice" hidden>Choose Accept or Prefer.</div></fieldset>' +
      '<fieldset class="sh-fs sh-lens" id="shLensFs"><legend class="sh-lg">Planned lens</legend><div class="sh-lens-grid">' +
        '<label><span>Size (mm)</span><select name="sh-size"><option value="">—</option>' + sizeOptions(rec).map(function (s) { return '<option value="' + s + '"' + sel(d.plannedLens && d.plannedLens.size, s) + '>' + s + '</option>'; }).join('') + '</select></label>' +
        '<label><span>Power (D)</span><input type="text" name="sh-power" inputmode="decimal" value="' + esc(pw) + '" placeholder="—"></label>' +
        '<label><span>Axis (°, optional)</span><input type="text" name="sh-axis" inputmode="numeric" value="' + esc(ax) + '" placeholder="—"></label>' +
        '</div><div class="sh-err" data-err="size" hidden>Select the planned lens size.</div></fieldset>' +
      '<fieldset class="sh-fs"><legend class="sh-lg">Influencing method</legend><div class="sh-chips">' +
        METHODS.map(function (m) { return '<label class="sh-chip"><input type="radio" name="sh-method" value="' + m.code + '"' + chk(d.influencingMethod, m.code) + '><span>' + esc(m.label) + '</span></label>'; }).join('') +
        '</div><input class="sh-other" type="text" name="sh-method-other" maxlength="60" placeholder="name required" value="' + esc(d.otherMethodName || '') + '" aria-label="Other / custom method name" hidden>' +
        '<div class="sh-err" data-err="method" hidden>Select the influencing method.</div>' +
        '<div class="sh-err" data-err="other" hidden>Name the method.</div></fieldset>' +
      '<fieldset class="sh-fs"><legend class="sh-lg">Reason</legend><div class="sh-chips">' +
        REASONS.map(function (r) { return '<label class="sh-chip"><input type="radio" name="sh-reason" value="' + r.code + '"' + chk(d.reason && d.reason.code, r.code) + '><span>' + esc(r.label) + '</span></label>'; }).join('') +
        '</div><input class="sh-text" type="text" name="sh-reason-text" maxlength="140" placeholder="text ≤ 140 (optional)" value="' + esc(d.reason && d.reason.text || '') + '" aria-label="Reason, optional text">' +
        '<div class="sh-err" data-err="reason" hidden>Select a reason.</div></fieldset>' +
      '<div class="sh-form-actions"><button type="submit" class="sh-btn">' + esc(COPY.J7) + '</button></div></form>';
  }
  function decisionSummary(rec) {
    var d = rec.decision, R = rec.stellaRecommendation;
    var method = d.influencingMethod === 'OTHER' ? ('Other / custom · ' + d.otherMethodName) : (METHODS.find(function (m) { return m.code === d.influencingMethod; }) || {}).label;
    var reason = (REASONS.find(function (r) { return r.code === d.reason.code; }) || {}).label + (d.reason.text ? ' · ' + d.reason.text : '');
    var lens = d.plannedLens.size + ' mm' + (d.plannedLens.power ? ' · ' + d.plannedLens.power + ' D' : '') + (d.plannedLens.axis ? ' · ' + d.plannedLens.axis + '°' : '');
    return '<div class="sh-summary" id="shDecisionSummary">' +
      '<div class="sh-kv"><span>Decision</span><b>' + esc(d.choice === 'accept' ? fmt(COPY.J2, { size: R.size }) : COPY.J3) + '</b></div>' +
      '<div class="sh-kv"><span>Planned lens</span><b>' + esc(lens) + '</b></div>' +
      '<div class="sh-kv"><span>Influencing method</span><b>' + esc(method) + '</b></div>' +
      '<div class="sh-kv"><span>Reason</span><b>' + esc(reason) + '</b></div>' +
      '<div class="sh-kv"><span>Time</span><b>' + esc(utc(d.recordedAt)) + '</b></div>' +
      '<div class="sh-form-actions"><button type="button" class="sh-btn ghost" id="shEditDecision">Edit</button></div></div>';
  }
  function buildDecision(rec) {
    var box = el('<div class="pd-section sh-decision" id="shDecision"><div class="sf-step-head"><div class="sf-step-num sh-num">4</div>' +
      '<div class="sf-step-info"><h4 style="margin:0">' + esc(COPY.J1) + '</h4></div></div><div id="shDecisionBody"></div></div>');
    renderDecision(box.querySelector('#shDecisionBody'), rec);
    return box;
  }
  function renderDecision(body, rec) {
    body.innerHTML = rec.decision ? decisionSummary(rec) : decisionForm(rec);
    if (rec.decision) {
      body.querySelector('#shEditDecision').addEventListener('click', function () {
        renderDecisionDraft(body, rec, rec.decision);
      });
      return;
    }
    wireForm(body, rec);
  }
  function renderDecisionDraft(body, rec, draft) {
    rec.decision = draft; body.innerHTML = decisionForm(rec); rec.decision = null; wireForm(body, rec);
  }
  function wireForm(body, rec) {
    var form = body.querySelector('#shDecisionForm');
    var R = rec.stellaRecommendation;
    var lensFs = form.querySelector('#shLensFs');
    var sizeSel = form.querySelector('[name="sh-size"]'), pwIn = form.querySelector('[name="sh-power"]'), axIn = form.querySelector('[name="sh-axis"]');
    function syncChoice() {
      var c = (form.querySelector('[name="sh-choice"]:checked') || {}).value;
      lensFs.classList.toggle('accept', c === 'accept');
      if (c === 'accept') {
        sizeSel.value = R.size; sizeSel.disabled = true;
        if (R.power) { pwIn.value = R.power.sph; axIn.value = R.power.axis; }
        pwIn.readOnly = !!R.power; axIn.readOnly = !!R.power;
      } else { sizeSel.disabled = false; pwIn.readOnly = false; axIn.readOnly = false; }
    }
    function syncOther() {
      var m = (form.querySelector('[name="sh-method"]:checked') || {}).value;
      form.querySelector('[name="sh-method-other"]').hidden = m !== 'OTHER';
    }
    form.addEventListener('change', function (e) {
      if (e.target.name === 'sh-choice') syncChoice();
      if (e.target.name === 'sh-method') syncOther();
      form.querySelectorAll('.sh-chip, .sh-radio').forEach(function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
    });
    syncChoice(); syncOther();
    form.querySelectorAll('.sh-chip, .sh-radio').forEach(function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = function (k, on) { var n = form.querySelector('[data-err="' + k + '"]'); if (n) n.hidden = !on; return on; };
      var choice = (form.querySelector('[name="sh-choice"]:checked') || {}).value;
      var method = (form.querySelector('[name="sh-method"]:checked') || {}).value;
      var other = form.querySelector('[name="sh-method-other"]').value.trim();
      var reason = (form.querySelector('[name="sh-reason"]:checked') || {}).value;
      var size = choice === 'accept' ? R.size : sizeSel.value;
      var bad = false;
      bad = err('choice', !choice) || bad;
      bad = err('size', choice === 'prefer' && !size) || bad;
      bad = err('method', !method) || bad;
      bad = err('other', method === 'OTHER' && !other) || bad;
      bad = err('reason', !reason) || bad;
      if (bad) { var first = form.querySelector('.sh-err:not([hidden])'); if (first) first.scrollIntoView({ block: 'center' }); return; }
      rec.decision = {
        choice: choice,
        plannedLens: { size: size, power: pwIn.value.trim() || null, axis: axIn.value.trim() || null },
        influencingMethod: method, otherMethodName: method === 'OTHER' ? other : null,
        reason: { code: reason, text: form.querySelector('[name="sh-reason-text"]').value.trim().slice(0, 140) },
        recordedAt: new Date().toISOString()
      };
      try { sessionStorage.setItem(DECISION_KEY, JSON.stringify({ key: decisionKey(rec), decision: rec.decision })); } catch (x) {}
      renderDecision(body, rec);
      toast(COPY.J8);
    });
  }
  function decisionKey(rec) { return rec.caseId + '|' + rec.laterality + '|' + (rec.sentAt || ''); }
  function restoreDecision(rec) {
    try {
      var s = JSON.parse(sessionStorage.getItem(DECISION_KEY) || 'null');
      if (s && s.key === decisionKey(rec) && s.decision && s.decision.choice) rec.decision = s.decision;
    } catch (e) {}
  }

  /* ---------- return block (US-7) ---------- */
  function buildReturn(rec) {
    var box = el('<section class="sh-return-box" aria-label="Return to STELLA">' +
      '<div class="sh-return-boundary">' + esc(COPY.R3) + '</div><div class="sh-return-body">' +
      '<img src="' + STELLA_LOGO + '" alt="STELLA"><div class="sh-return-cta"></div>' +
      '<div class="sh-return-cap">' + esc(COPY.R2) + '</div></div></section>');
    box.querySelector('.sh-return-cta').appendChild(returnCta(false, rec));
    return box;
  }

  /* ---------- comparator cards ---------- */
  function stellaCard(rec) {
    var R = rec.stellaRecommendation;
    return '<div class="sf-comp-card sh-stella-card" data-formula="STELLA" draggable="false" title="' + esc(COPY.S2) + '" aria-label="' + esc(COPY.S1) + '">' +
      '<div class="sf-comp-head"><div class="sf-comp-badge sh-badge-stella">' + lockSvg() + '</div>' +
      '<div class="sf-comp-name"><div class="nm">' + esc(COPY.P1) + '</div><div class="ds">' + esc(COPY.S1) + '</div></div></div>' +
      '<div class="sf-comp-stats"><div class="stat"><div class="lbl">Size</div><div class="val">' + esc(R.size) + '<em>mm</em></div></div>' +
      '<div class="stat"><div class="lbl">Model</div><div class="val sh-small">' + esc(R.model) + '</div></div></div>' +
      '<div class="sh-meta"><div>' + esc(R.formula) + '</div><div>' + esc(rec.caseId) + ' · ' + esc(rec.laterality) + '</div></div>' +
      '<div class="sf-comp-foot"><span class="sh-locked-lbl">' + lockSvg() + esc(COPY.P3) + '</span></div></div>';
  }
  function extCard(r, rec) {
    var size = parseFloat(r.recSize), stella = parseFloat(rec.stellaRecommendation.size);
    var d = size - stella, ds = (d >= 0 ? '+' : '') + d.toFixed(1);
    var abbrev = { ICL_GURU: 'IG', REINSTEIN: 'RE', LASSO: 'LA', KS: 'KS', STAAR_NOM: 'SN', ICL_FIT: 'IF', CASIA2: 'C2' }[r.code] || r.code.slice(0, 2);
    var vault = r.predictsVault === false || r.vault == null ? '—' : fmt(COPY.M8, { N: r.vault });
    var version = r.version ? ('Version: ' + r.version) : COPY.M5;
    return '<div class="sf-comp-card sh-ext-card" data-formula="' + esc(r.code) + '" role="button" tabindex="0" aria-label="' + esc(r.name) + ' — go to your decision">' +
      '<div class="sf-comp-head"><div class="sf-comp-badge sh-badge-ext">' + esc(abbrev) + '</div>' +
      '<div class="sf-comp-name"><div class="nm">' + esc(r.name) + '</div><div class="ds">' + esc(COPY.M6) + '</div></div></div>' +
      '<div class="sf-comp-stats"><div class="stat"><div class="lbl">Size</div><div class="val">' + size.toFixed(1) + '<em>mm</em></div></div>' +
      '<div class="stat"><div class="lbl">Vault</div><div class="val sh-small">' + esc(vault) + '</div></div></div>' +
      '<div class="sh-meta"><div>Method: ' + esc(r.name) + '</div><div>Modality: ' + esc(r.modality || '—') + '</div><div>Device: ' + esc(r.device || '—') + '</div><div>' + esc(version) + '</div></div>' +
      '<div class="sh-delta">' + esc(fmt(COPY.D1, { d: ds })) + '</div>' +
      '<div class="sf-comp-foot"><span class="conf sh-conf">' + esc(fmt(COPY.M7, { NN: r.conf })) + '</span><span class="sh-goto">' + esc(COPY.J1) + ' ↓</span></div></div>';
  }
  function scrollToDecision() { var d = document.getElementById('shDecision'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  /* ---------- decorate the sizing tab of the handoff patient ---------- */
  function decorate() {
    if (!currentIsHandoff()) return;
    if (typeof CURRENT_PT_TAB !== 'undefined' && CURRENT_PT_TAB !== 'sizing') return;
    var main = document.getElementById('ptMainContent');
    if (!main || main.querySelector('.sh-strip')) return;
    var rec = H;
    main.classList.add('sh-handoff');
    document.body.classList.add('sh-handoff-active');           // D6: lets css/41 move the fixed copilot FAB clear of the panel
    var sections = Array.prototype.slice.call(main.children);
    var layout = el('<div class="sh-layout"><div class="sh-col-side"></div><div class="sh-col-main"></div></div>');
    var colSide = layout.firstElementChild, colMain = layout.lastElementChild;
    sections.forEach(function (s) { colMain.appendChild(s); });
    colSide.appendChild(buildPanel(rec));
    main.appendChild(buildStrip(rec));
    main.appendChild(buildBanner(rec));
    main.appendChild(layout);
    var results = colMain.querySelector('#sfResults');
    var decision = buildDecision(rec), ret = buildReturn(rec);
    var stamp = el('<div class="sh-footer-stamp">' + esc(COPY.F1) + '</div>');
    if (results) { results.insertAdjacentElement('afterend', decision); } else colMain.appendChild(decision);
    decision.insertAdjacentElement('afterend', ret);
    ret.insertAdjacentElement('afterend', stamp);
    prefill(rec);
    decorateChips();
    var chosen = colMain.querySelector('#sfChosenBanner'); if (chosen) chosen.remove();
    var hint = colMain.querySelector('#sfResults > p.muted'); if (hint) hint.textContent = 'Results from every selected method next to the STELLA recommendation.';
    patchNulls(document.getElementById('usMain'));
    var hdrSub = document.querySelector('.pt-ph-sub'); if (hdrSub) hdrSub.textContent = rec.caseId + ' · — · — · eye ' + rec.laterality + ' · ' + rec.inputs[rec.laterality].sph.v + ' D';
    var cur = document.querySelector('.pt-ph-progress-meta span b'); if (cur) cur.textContent = 'ICL selection · sizing comparison';   // E1: no external method named as "current"
    lockEyeScope(rec);
    colMain.addEventListener('click', function (e) {
      var c = e.target.closest('.sh-ext-card'); if (!c) return;
      rec.ui.selectedCard = c.getAttribute('data-formula'); scrollToDecision();
    });
    colMain.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('sh-ext-card')) { e.preventDefault(); e.target.click(); }
    });
  }

  /* D5: laterality is explicit, never inferred — only the eye that arrived from STELLA can be scoped. */
  function eyeLockTitle(rec) { return 'This case arrived from STELLA for ' + rec.laterality + ' only'; }
  function lockEyeScope(rec) {
    document.querySelectorAll('.seb-eye-tab').forEach(function (t) {
      var ok = t.getAttribute('data-eye') === rec.laterality;
      t.disabled = !ok; t.setAttribute('aria-disabled', String(!ok));
      if (!ok) { t.title = eyeLockTitle(rec); t.classList.add('sh-eye-locked'); }
    });
  }

  /* ---------- wrappers (pattern js/28:488) ---------- */
  function installWrappers() {
    var _run = window.runSizingFormulas;
    window.runSizingFormulas = function (patientId) {
      if (!isHandoff(patientId)) return _run.apply(this, arguments);
      var rec = H, codes = Array.from(SELECTED_SIZING_FORMULAS);
      if (EYE_SCOPE !== rec.laterality) { EYE_SCOPE = rec.laterality; lockEyeScope(rec); }
      var results = [];
      if (codes.length) {
        _run.apply(this, arguments);
        var last = (window._SF_LAST_RESULTS && window._SF_LAST_RESULTS.results) || [];
        results = codes.map(function (c) { return last.find(function (r) { return r.code === c; }); }).filter(Boolean)
          .map(function (r) { var o = OVERRIDES[r.code]; return o ? Object.assign({}, r, o) : r; });
        window._SF_LAST_RESULTS = { patientId: patientId, results: results };
      }
      var box = document.getElementById('sfResults'), list = document.getElementById('sfResultsList'), tag = document.getElementById('sfResultTag');
      if (!box || !list) return;
      box.style.display = ''; box.classList.remove('sf-guru-mode'); list.classList.remove('sf-guru-mounted');
      if (tag) tag.textContent = fmt(COPY.N1, { N: results.length });
      list.innerHTML = '<div class="sf-comp-grid sh-grid">' + stellaCard(rec) + results.map(function (r) { return extCard(r, rec); }).join('') + '</div>' +
        (results.length ? '' : '<div class="sh-none">' + esc(COPY.N2) + '</div>');
      rec.ui.methodsRun = codes.slice();
      refreshSizeOptions(rec);
      try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
    };
    var _select = window.selectSizingFormula;
    window.selectSizingFormula = function (patientId, code) {
      if (!isHandoff(patientId)) return _select.apply(this, arguments);
      if (H) H.ui.selectedCard = code;                                   // never writes decision.*
      scrollToDecision();
    };
    var _scope = window.setSizingEyeScope;
    window.setSizingEyeScope = function (scope) {
      if (currentIsHandoff() && scope !== H.laterality) { toast(eyeLockTitle(H)); return; }
      return _scope.apply(this, arguments);
    };
    var _order = window.openStellaOrder;
    window.openStellaOrder = function (patientId) {
      if (!isHandoff(patientId) && !currentIsHandoff()) return _order.apply(this, arguments);
      toast(COPY.O1);
    };
    var _open = window.openPatientFile;
    window.openPatientFile = function (id) {
      document.body.classList.remove('sh-handoff-active');
      if (H && id !== H.caseId && DEFAULT_SET) SELECTED_SIZING_FORMULAS = new Set(DEFAULT_SET);
      if (H && id === H.caseId) { SELECTED_SIZING_FORMULAS = new Set(HANDOFF_SET); EYE_SCOPE = H.laterality; }
      var r = _open.apply(this, arguments);
      decorate();
      return r;
    };
    var _tab = window.setPatientTab;
    window.setPatientTab = function () {
      var r = _tab.apply(this, arguments);
      decorate();
      return r;
    };
    var _mod = window.renderModule;
    window.renderModule = function () {
      document.body.classList.remove('sh-handoff-active');
      var r = _mod.apply(this, arguments);
      if (H) patchNulls(document.getElementById('usMain'));
      return r;
    };
  }

  /* ---------- boot ---------- */
  function boot() {
    var rec = readPayload();
    if (rec && rec.error) {
      console.warn('[stella-handoff] invalid payload — no case opened');
      document.body.appendChild(el('<div class="sh-badpayload" role="alert">' + esc(COPY.A3) + '</div>'));
      toast(COPY.A3);
      return;
    }
    if (!rec) return;                                                    // regular EVO Connect
    H = window.STELLA_HANDOFF = rec;
    restoreDecision(rec);
    DEFAULT_SET = Array.from(SELECTED_SIZING_FORMULAS);
    installWrappers();
    upsertPatient(rec);
    openUniverse();
    openPatientFile(rec.caseId);
    setPatientTab('sizing');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
