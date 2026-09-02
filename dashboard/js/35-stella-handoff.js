/* ================================================================
   STELLA → EVO CONNECT HANDOFF (Journey 1, steps 3–6) — round 2 (DR-0004)
   ----------------------------------------------------------------
   Loaded LAST (after js/34). Classic script; depends on globals from
   js/01 (DATA), js/08 (showToast), js/11 (openPatientFile/setPatientTab),
   js/15 (SIZING_FORMULAS / SELECTED_SIZING_FORMULAS), js/16 (EYE_SCOPE /
   EYE_INPUTS / setSizingEyeScope), js/19 (runSizingFormulas /
   selectSizingFormula / openStellaOrder), js/26 (openUniverse). Nothing
   existing references this file or STELLA_HANDOFF.

   Boundary rules (ESCRS brief L1–L7): synthetic only; no ordering from
   REVAI; zero bytes back to STELLA (the only link out is the literal
   Return anchor in returnCta(), no query, no hash); no ranking /
   pre-selection; STELLA row locked first; demo stamp on every screen.
   User-facing copy is taken verbatim from 05-compliance-review §2
   (+ T5 from 08-compliance-rereview). Payload v1 and v1.1 accepted.
   Provenance (ADR-0003) is kept in the record and exposed as tooltips
   only (DR-0004): visible signals are the header chip, the strip and
   the STELLA panel.
   ================================================================ */
(function () {
  'use strict';

  /* ---------- approved copy ---------- */
  var COPY = {
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
    T4: 'Edited by surgeon · STELLA: {value}',
    T4r: 'Reset to STELLA values',
    T5: 'Derived in EVO Connect from STELLA K1/K2',
    K1: 'Available methods — select any',
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
    K1: 'Δ vs STELLA {d} mm',
    K2: 'Same lens as the STELLA recommendation',
    K3: 'Inferred from {m}',
    K4: 'Entered manually',
    K5: 'No method in the ecosystem produced this decision, so the reason is entered by hand.',
    K6: 'Decision record',
    K7: 'Recorded in REVAI · nothing was written to STELLA',
    K8: 'Agreement — recorded exactly as an override would be',
    K9: 'Override — recorded with its influencing method and reason',
    K10: 'Type these values into STELLA',
    K11: 'EVO Connect does not send them. You transcribe them yourself — that is the only bridge back.',
    K12: 'Order confirmed in STELLA',
    K13: 'Returned to the linked case record in EVO Connect · STELLA → REVAI',
    K14: 'Post-operative vault and implanted lens — record view, not functional',
    L1: 'Order the lens in STELLA',
    L2: 'STELLA opens with its own case data already loaded. Change it to the lens you decided and confirm there.',
    L3: 'STAAR · STELLA ordering surface — you have left EVO Connect',
    L4: 'Confirm ICL order',
    L5: 'from STELLA',
    L6: 'Loaded from the STELLA case. EVO Connect writes nothing here — the values below are STELLA’s own.',
    L7: 'The lens you entered differs from the STELLA recommendation',
    L8: 'STELLA recommends {rec} mm; you entered {got} mm ({d} mm). You can order the lens you entered, but the difference has to be confirmed.',
    L9: 'I confirm I am ordering {got} mm instead of the {rec} mm recommended by STELLA.',
    L10: 'Place order in STELLA',
    L11: 'Order created, validated and audited in STELLA. Returned to EVO Connect over the API — the return carries the order, never a clinical recommendation into STELLA.',
    L12: 'Case decision record',
    L13: 'Input data from STELLA',
    L14: 'Method outputs compared in EVO Connect',
    L15: 'STELLA recommendation',
    L16: 'What the surgeon ordered, and on what argument',
    L17: 'Returned to REVAI by API',
    F1: 'Demonstration only – synthetic data – not for clinical use',
    EYE_ONE: 'This case arrived from STELLA for {lat} only',
    EYE_OU: 'Switch OD / OS — each eye arrived from STELLA separately'
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
  /* J6 inference: Dave wants the reason derived from the ecosystem's own logic
     wherever that is possible. It is possible exactly when the influencing method
     is one of the integrated ones; with an outside nomogram there is nothing to
     infer from and the field falls back to manual. */
  var INFERRED_REASON = { ICL_GURU: 'VAULT_BAND', ICL_FIT: 'ANATOMY_ASOCT', CASIA2: 'ANATOMY_ASOCT' };
  var SIZES = ['12.1', '12.6', '13.2', '13.7'];
  var OVERRIDES = { ICL_GURU: { recSize: 13.6, vault: 520 }, ICL_FIT: { recSize: 13.7, vault: 480 }, CASIA2: { recSize: 13.6, vault: 510 } };
  var HANDOFF_SET = ['ICL_GURU', 'ICL_FIT', 'CASIA2'];
  var HIDDEN_CHIPS = ['STAAR_NOM'];                                     // DR-0004 §6
  var STORE_KEY = 'stella_handoff', DECISION_KEY = 'stella_handoff_decision', PENDING_KEY = 'stella_handoff_pending';
  var PENDING_TTL = 10 * 60 * 1000;
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
  function lockSvg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>'; }

  /* ---------- parse + validate (ADR-0001 D, ADR-0002 v1, DR-0004 v1.1) ---------- */
  var NUM = /^[-+]?\d{1,4}(\.\d{1,3})?$/;
  var INPUT_KEYS = ['sph', 'cyl', 'axis', 'bvd', 'k1', 'k1a', 'k2', 'k2a', 'acd', 'cct', 'ww'];
  var UNITS = { sph: 'D', cyl: 'D', axis: '°', bvd: 'mm', k1: 'D', k1a: '°', k2: 'D', k2a: '°', acd: 'mm', cct: 'µm', ww: 'mm' };

  function normInputs(src) {
    if (!src || typeof src !== 'object') return null;
    var inputs = {};
    for (var i = 0; i < INPUT_KEYS.length; i++) {
      var k = INPUT_KEYS[i], e = src[k];
      var v = e && typeof e === 'object' ? e.v : e;
      if (typeof v !== 'string' || !NUM.test(v.trim())) return null;
      inputs[k] = { v: v.trim(), u: UNITS[k], prov: 'STELLA' };
      if (k === 'cyl') inputs[k].notation = 'plus-cyl';
    }
    return inputs;
  }
  function normStella(r) {
    r = r || {};
    var size = String(r.size || '');
    if (SIZES.indexOf(size) < 0) return null;
    var pw = null;
    if (r.power && typeof r.power === 'object' && typeof r.power.sph === 'string') {
      pw = { sph: String(r.power.sph), cyl: String(r.power.cyl || ''), axis: String(r.power.axis || '') };
    }
    return { size: size, model: r.model === 'Myopic' ? 'Myopic' : 'Toric Myopic', power: pw,
      cylPower: typeof r.cylPower === 'string' ? r.cylPower : null, formula: 'Calculator V8.00 OUS',
      calculatedAt: typeof r.calculatedAt === 'string' ? r.calculatedAt : null };
  }
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (raw.v !== 1 && raw.v !== 1.1) return null;
    var caseId = String(raw.caseId || '');
    if (!/^[A-Z0-9][A-Z0-9-]{2,31}$/.test(caseId)) return null;
    var lat = raw.laterality, eyes;
    if (lat === 'OD' || lat === 'OS') eyes = [lat];
    else if (lat === 'OU' && raw.v === 1.1) eyes = ['OD', 'OS'];
    else return null;                                                   // enumerated, never inferred
    var inputs = {}, stella = {}, derived = {};
    for (var i = 0; i < eyes.length; i++) {
      var E = eyes[i], src, rec;
      if (raw.v === 1.1) { var blk = raw.eyes && raw.eyes[E.toLowerCase()]; src = blk && blk.inputs; rec = blk && blk.stella; }
      else { src = raw.inputs && raw.inputs[E]; rec = raw.stellaRecommendation; }
      inputs[E] = normInputs(src); stella[E] = normStella(rec);
      if (!inputs[E] || !stella[E]) return null;
      var k1 = parseFloat(inputs[E].k1.v), k2 = parseFloat(inputs[E].k2.v);
      derived[E] = { kmean: { v: ((k1 + k2) / 2).toFixed(2), u: 'D', prov: 'DERIVED', rule: '(K1+K2)/2' } };
    }
    var out = {
      v: raw.v, caseId: caseId, laterality: lat, eyes: eyes,
      sentAt: typeof raw.sentAt === 'string' ? raw.sentAt : null,
      receivedAt: new Date().toISOString(),
      source: { system: 'STELLA', version: 'Calculator V8.00 OUS' },
      inputs: inputs, stella: stella, derived: derived,
      evoEstimates: ['sf-ata', 'sf-sts', 'sf-arise', 'sf-clr', 'sf-rx-cyc-*', 'sf-rx-aut-*', 'AL', 'Pupil'],
      decisions: {}, ui: { eye: eyes[0], methodsRun: [], selectedCard: null }
    };
    eyes.forEach(function (E) { out.decisions[E] = null; });
    /* Current-eye accessors keep the v1 field names usable (panel, comparator, decision, suites). */
    Object.defineProperty(out, 'stellaRecommendation', { get: function () { return out.stella[curEye(out)]; }, enumerable: false });
    Object.defineProperty(out, 'decision', { get: function () { return out.decisions[curEye(out)]; }, set: function (v) { out.decisions[curEye(out)] = v; }, enumerable: false });
    return out;
  }
  function curEye(rec) { return rec.eyes.indexOf(rec.ui.eye) >= 0 ? rec.ui.eye : rec.eyes[0]; }

  function readPayload() {
    var q = null;
    try { q = new URLSearchParams(window.location.search).get('handoff'); } catch (e) { q = null; }
    if (q) {
      try {
        var rec = normalize(JSON.parse(b64urlDecode(q)));
        if (rec) { try { sessionStorage.setItem(STORE_KEY, q); localStorage.removeItem(PENDING_KEY); } catch (e) {} return rec; }
      } catch (e) {}
      return { error: true };                                            // query present but invalid: no case opens
    }
    try {
      var s = sessionStorage.getItem(STORE_KEY);
      if (s) { var rec2 = normalize(JSON.parse(b64urlDecode(s))); if (rec2) return rec2; }
    } catch (e) {}
    try {                                                                // new-tab handshake (DR-0004): read once, then delete
      var pend = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
      localStorage.removeItem(PENDING_KEY);
      if (pend && pend.p && Date.now() - pend.ts < PENDING_TTL) {
        var rec3 = normalize(JSON.parse(b64urlDecode(pend.p)));
        if (rec3) { try { sessionStorage.setItem(STORE_KEY, pend.p); } catch (e) {} return rec3; }
      }
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

  /* ---------- synthetic patient projection (ADR-0002; age/sex null; name = pseudonym, DR-0004) ---------- */
  function upsertPatient(rec) {
    var list = DATA.patients;
    var donor = list.find(function (p) { return p.portrait; });
    var portrait = donor ? Object.assign({}, donor.portrait, { bg: '#EAEEF5', shirt: '#5A6478', hair: '#3A3F4A', skin: '#D9B99B', hairShape: 'short', lips: '#A9564F' })
                         : { bg: '#EAEEF5', skin: '#D9B99B', hair: '#3A3F4A', shirt: '#5A6478', hairShape: 'short', lips: '#A9564F' };
    var power = rec.eyes.map(function (E) { return rec.inputs[E].sph.v; }).join(' / ');
    var pt = {
      id: rec.caseId, name: rec.caseId, age: null, sex: null,
      eye: rec.eyes.join('/'), power: power, stage: 'Sizing', status: 'wait',
      portrait: portrait, risk: null, stellaHandoff: true
    };
    var i = list.findIndex(function (p) { return p.id === rec.caseId; });
    if (i >= 0) list[i] = Object.assign(list[i], pt); else list.push(pt);
    return pt;
  }
  function patchNulls(root) {
    if (!root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, list = [];
    while ((n = w.nextNode())) if (/\bnully\b|\bnull\b/.test(n.nodeValue)) list.push(n);
    list.forEach(function (t) { t.nodeValue = t.nodeValue.replace(/\bnully\b/g, '—').replace(/\bnull\b/g, '—'); });
  }

  /* ---------- prefill (ADR-0003 table; visible provenance, DR-0004 Amendment A2) ---------- */
  function stripPlus(v) { return String(v).replace(/^\+/, ''); }
  function mapping(rec, E) {
    var I = rec.inputs[E];
    return [
      { id: 'sf-rx-man-sph', v: I.sph.v }, { id: 'sf-rx-man-cyl', v: I.cyl.v, note: 'plus-cyl · as entered in STELLA' },
      { id: 'sf-rx-man-ax', v: I.axis.v }, { id: 'sf-rx-man-k1', v: stripPlus(I.k1.v) },
      { id: 'sf-rx-man-k1ax', v: I.k1a.v }, { id: 'sf-rx-man-k2', v: stripPlus(I.k2.v) },
      { id: 'sf-acd', v: I.acd.v }, { id: 'sf-wtw', v: I.ww.v }
    ];
  }
  var ESTIMATE_IDS = ['sf-ata', 'sf-sts', 'sf-arise', 'sf-clr',
    'sf-rx-cyc-sph', 'sf-rx-cyc-cyl', 'sf-rx-cyc-ax', 'sf-rx-cyc-k1', 'sf-rx-cyc-k1ax', 'sf-rx-cyc-k2',
    'sf-rx-aut-sph', 'sf-rx-aut-cyl', 'sf-rx-aut-ax', 'sf-rx-aut-k1', 'sf-rx-aut-k1ax', 'sf-rx-aut-k2'];
  var ALL_IDS = (typeof SF_RX_IDS !== 'undefined' ? SF_RX_IDS : []).concat(typeof SF_SZ_IDS !== 'undefined' ? SF_SZ_IDS : []);

  /* Provenance (DR-0004 Amendment A2): visible T1 pill on every STELLA-sent
     input/KPI, T5 pill on the derived K-mean; everything STELLA did not send
     stays EMPTY and carries no tag — no invented values for a handoff case. */
  function provTitle(input, kind, note) {
    var t = kind === 'stella' ? COPY.T1 + ' · ' + COPY.T2 + (note ? ' · ' + note : '') : COPY.T5;
    input.title = t; input.setAttribute('data-sh-prov', kind);
    var cell = input.closest('.sf-rx-cell, .sf-input'); if (cell) cell.title = t;
  }
  function pill(input, cls, text, title) {
    var cell = input.closest('.sf-rx-cell, .sf-input'); if (!cell) return null;
    var old = cell.querySelector('.sh-prov'); if (old) old.remove();
    var tag = el('<span class="sh-prov ' + cls + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + esc(text) + '</span>');
    var label = cell.querySelector('label');
    if (label) label.insertAdjacentElement('afterend', tag); else cell.prepend(tag);
    return tag;
  }
  function clearInput(input) {
    input.value = ''; input.removeAttribute('title'); input.removeAttribute('data-sh-prov'); input.removeAttribute('data-sh-stella');
    var cell = input.closest('.sf-rx-cell, .sf-input');
    if (cell) { cell.removeAttribute('title'); var old = cell.querySelector('.sh-prov'); if (old) old.remove(); }
  }
  /* EYE_INPUTS[E] holds only STELLA-sent keys (+ derived K-mean); every other managed id is blank. */
  function storeEye(rec, E) {
    var store = EYE_INPUTS[E] = EYE_INPUTS[E] || {};
    ALL_IDS.forEach(function (id) { store[id] = ''; });
    mapping(rec, E).forEach(function (m) { store[m.id] = m.v; });
    store['sf-kmean'] = rec.derived[E].kmean.v;
  }
  function loadEye(rec, E) {
    var store = EYE_INPUTS[E] || {};
    ALL_IDS.forEach(function (id) { var i = document.getElementById(id); if (i && store[id] !== undefined) i.value = store[id]; });
    var hs = document.getElementById('sf-sph'), hc = document.getElementById('sf-cyl');
    if (hs) hs.value = rec.inputs[E].sph.v;
    if (hc) hc.value = rec.inputs[E].cyl.v;
    mapping(rec, E).forEach(function (m) {
      var input = document.getElementById(m.id); if (!input) return;
      input.setAttribute('data-sh-stella', m.v); provTitle(input, 'stella', m.note);
      pill(input, 'stella', COPY.T1, input.title);
      if (!input._shWired) { input.addEventListener('input', onEdit); input._shWired = true; }
    });
    var km = document.getElementById('sf-kmean'); if (km) { provTitle(km, 'derived'); pill(km, 'derived', COPY.T5, COPY.T5); }
    ESTIMATE_IDS.forEach(function (id) { var i = document.getElementById(id); if (i) clearInput(i); });
    patchKpis(rec, E);
    onEdit({ target: document.getElementById('sf-wtw') });
  }
  function prefill(rec) {
    rec.eyes.forEach(function (E) { storeEye(rec, E); });
    loadEye(rec, curEye(rec));
    var head = document.querySelector('.sf-subgroup[data-sg="rx"] .sf-subgroup-head');
    if (head && !document.getElementById('shResetLink')) {
      head.appendChild(el('<button type="button" class="sh-reset" id="shResetLink" hidden>' + esc(COPY.T4r) + '</button>'));
      document.getElementById('shResetLink').addEventListener('click', function () { resetToStella(rec); });
    }
  }
  function onEdit(e) {
    var input = e.target; if (!input) return;
    var orig = input.getAttribute('data-sh-stella');
    if (orig != null) {
      var edited = input.value.trim() !== orig;
      input.title = edited ? fmt(COPY.T4, { value: orig }) : COPY.T1 + ' · ' + COPY.T2;
      input.classList.toggle('sh-edited', edited);
      if (edited) pill(input, 'edited', fmt(COPY.T4, { value: orig }), input.title); else pill(input, 'stella', COPY.T1, input.title);
    }
    var any = Array.prototype.some.call(document.querySelectorAll('[data-sh-stella]'), function (i) { return i.value.trim() !== i.getAttribute('data-sh-stella'); });
    var r = document.getElementById('shResetLink'); if (r) r.hidden = !any;
  }
  function resetToStella(rec) {
    var E = curEye(rec);
    document.querySelectorAll('[data-sh-stella]').forEach(function (i) { i.value = i.getAttribute('data-sh-stella'); i.dispatchEvent(new Event('input', { bubbles: true })); });
    mapping(rec, E).forEach(function (m) { EYE_INPUTS[E][m.id] = m.v; });
  }
  function patchKpis(rec, E) {
    var I = rec.inputs[E];
    var vals = { 'K-mean': { v: rec.derived[E].kmean.v, u: 'D', cls: 'derived', t: COPY.T5 },
                 'ACD': { v: I.acd.v, u: 'mm', cls: 'stella', t: COPY.T1 },
                 'WTW': { v: I.ww.v, u: 'mm', cls: 'stella', t: COPY.T1 },
                 'CCT': { v: I.cct.v, u: 'µm', cls: 'stella', t: COPY.T1 } };
    document.querySelectorAll('.seb-kpi').forEach(function (k) {
      var lbl = k.querySelector('.kpi-lbl'), val = k.querySelector('.kpi-val'); if (!lbl || !val) return;
      var m = vals[lbl.textContent.trim()];
      var old = k.querySelector('.sh-prov'); if (old) old.remove();
      if (m) {
        val.innerHTML = esc(m.v) + '<em>' + esc(m.u) + '</em>';
        k.title = m.cls === 'stella' ? COPY.T1 + ' · ' + COPY.T2 : COPY.T5;
        k.appendChild(el('<span class="sh-prov ' + m.cls + '">' + esc(m.t) + '</span>'));
      } else {
        val.textContent = '—';                                           // not sent by STELLA: no value, no unit, no tag
        k.removeAttribute('title');
      }
    });
    var nick = document.querySelector('.seb-eye-nickname'); if (nick) nick.textContent = rec.caseId + ' · — · —';
    var rx = document.querySelector('.seb-eye-rx b'); if (rx) rx.textContent = parseFloat(I.sph.v).toFixed(2) + ' D';
  }

  /* ---------- chips (K1; no STELLA / STAAR_NOM chips, DR-0004) ---------- */
  function decorateChips() {
    var grid = document.querySelector('.sf-formulas-grid'); if (!grid || grid.previousElementSibling && grid.previousElementSibling.classList.contains('sh-chip-caption')) return;
    grid.insertAdjacentElement('beforebegin', el('<div class="sh-chip-caption">' + esc(COPY.K1) + '</div>'));
    HIDDEN_CHIPS.forEach(function (c) { var chip = grid.querySelector('.sf-formula-chip[data-formula="' + c + '"]'); if (chip) chip.remove(); });
  }

  /* ---------- eye scope (D5 + OU, DR-0004 §5) ---------- */
  function eyeLockTitle(rec) { return rec.eyes.length > 1 ? COPY.EYE_OU : fmt(COPY.EYE_ONE, { lat: rec.eyes[0] }); }
  function lockEyeScope(rec) {
    document.querySelectorAll('.seb-eye-tab').forEach(function (t) {
      var ok = rec.eyes.indexOf(t.getAttribute('data-eye')) >= 0;
      t.disabled = !ok; t.setAttribute('aria-disabled', String(!ok));
      t.classList.toggle('sh-eye-locked', !ok); t.classList.toggle('active', t.getAttribute('data-eye') === curEye(rec));
      if (!ok) t.title = eyeLockTitle(rec); else t.removeAttribute('title');
    });
  }
  function switchEye(rec, E) {
    if (rec.eyes.indexOf(E) < 0 || E === curEye(rec)) return;
    var prev = curEye(rec);
    ALL_IDS.forEach(function (id) { var i = document.getElementById(id); if (i) EYE_INPUTS[prev][id] = i.value; });
    rec.ui.eye = E; EYE_SCOPE = E;
    loadEye(rec, E); lockEyeScope(rec);
    var lbl = document.getElementById('sebEyeLabel'); if (lbl) lbl.textContent = E;
    refreshEyeViews(rec);
    var box = document.getElementById('sfResults');
    if (box && box.style.display !== 'none') window.runSizingFormulas(rec.caseId);
  }
  function refreshEyeViews(rec) {
    var strip = document.querySelector('.sh-strip-facts'); if (strip) strip.textContent = stripFacts(rec);
    var side = document.querySelector('.sh-col-side'); if (side) { side.innerHTML = ''; side.appendChild(buildPanel(rec)); }
    var body = document.getElementById('shDecisionBody'); if (body) renderDecision(body, rec);
    var t = document.getElementById('shDecisionEye'); if (t) t.textContent = ' · ' + curEye(rec);
  }

  /* ---------- strip + panel ---------- */
  function stripFacts(rec) { var E = curEye(rec); return fmt(COPY.A2, { caseId: rec.caseId, lat: E, size: rec.stella[E].size }); }
  function returnCta(compact) {
    /* once the decision is on record the CTA opens the STELLA ordering surface;
       before that it is still the plain return link to STELLA. */
    if (H && H.decisions[curEye(H)]) {
      var b = el('<button type="button" class="sh-return' + (compact ? ' compact' : '') + '">' + esc(COPY.L1) + '</button>');
      b.addEventListener('click', function () { openOrderModal(H); });
      return b;
    }
    var a = el('<a class="sh-return' + (compact ? ' compact' : '') + '" href="/stella" target="_blank" rel="noopener">' + esc(COPY.R1) + '</a>');
    a.addEventListener('click', function (e) {
      if (allowReturn || (H && H.eyes.some(function (E) { return !!H.decisions[E]; }))) return;
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
      '<span class="sh-strip-facts">' + esc(stripFacts(rec)) + '</span>' +
      '<span class="sh-strip-boundary">' + esc(COPY.C3) + '</span>' +
      '<span class="sh-stamp">' + esc(COPY.F1) + '</span><span class="sh-strip-cta"></span></div>');
    s.querySelector('.sh-strip-cta').appendChild(returnCta(true));
    return s;
  }
  function buildPanel(rec) {
    var E = curEye(rec), R = rec.stella[E], I = rec.inputs[E];
    var power = R.power ? (R.power.sph + ' ' + R.power.cyl + ' x' + R.power.axis) : 'power not selected in STELLA';
    var row = function (k, l) { return '<div class="sh-in"><span>' + esc(l) + '</span><b>' + esc(I[k].v) + ' <em>' + esc(I[k].u) + '</em></b></div>'; };
    var eyesHtml = rec.eyes.length > 1
      ? '<div class="sh-eyes" role="group" aria-label="Eyes from STELLA">' + rec.eyes.map(function (X) {
          return '<button type="button" class="sh-eye' + (X === E ? ' on' : '') + '" data-sh-eye="' + X + '" aria-pressed="' + (X === E) + '"><b>' + X + '</b><span>' + esc(rec.stella[X].size) + ' mm</span></button>';
        }).join('') + '</div>'
      : '';
    var a = el('<aside class="sh-panel" aria-labelledby="shPanelTitle">' +
      '<div class="sh-panel-mini">' + esc(fmt(COPY.P5, { size: R.size })) + '</div>' +
      '<div class="sh-panel-body">' +
        '<div class="sh-panel-head"><img src="' + STELLA_LOGO + '" alt="STELLA">' +
          '<div><div class="sh-panel-title" id="shPanelTitle">' + esc(COPY.P1) + '</div><div class="sh-panel-tag">' + esc(COPY.P2) + '</div></div></div>' +
        '<div class="sh-lockrow" title="' + esc(COPY.P3) + '"><span class="sh-switch" role="switch" aria-checked="true" aria-disabled="true" tabindex="0" aria-label="' + esc(COPY.P3) + '"><span class="sh-knob"></span></span>' +
          '<span class="sh-lock-lbl">' + lockSvg() + esc(COPY.P3) + '</span></div>' +
        eyesHtml +
        '<div class="sh-size">' + esc(R.size) + '<em>mm</em><span class="sh-size-eye">' + esc(E) + '</span></div>' +
        '<div class="sh-line">' + esc(fmt(COPY.P4, { size: R.size, model: R.model, formula: R.formula, calculatedAt: utc(R.calculatedAt) })) + '</div>' +
        '<div class="sh-kv"><span>Lens power</span><b>' + esc(power) + '</b></div>' +
        '<div class="sh-kv"><span>Cylinder power</span><b>' + esc(R.cylPower || '—') + '</b></div>' +
        '<div class="sh-case"><span class="sh-case-id">' + esc(rec.caseId) + '</span><span class="sh-case-eye">' + esc(E) + '</span></div>' +
        '<details class="sh-panel-inputs"><summary>' + esc(COPY.T1) + ' · 11 inputs</summary><div class="sh-inputs">' +
          row('sph', 'Sphere') + row('cyl', 'Cylinder') + row('axis', 'Axis') + row('bvd', 'BVD') +
          row('k1', 'K1') + row('k1a', 'K1 axis') + row('k2', 'K2') + row('k2a', 'K2 axis') +
          row('acd', 'ACD') + row('cct', 'CCT') + row('ww', 'WTW') +
        '</div></details>' +
        '<div class="sh-panel-foot">sent ' + esc(utc(rec.sentAt)) + '</div>' +
      '</div></aside>');
    a.querySelectorAll('[data-sh-eye]').forEach(function (b) { b.addEventListener('click', function () { switchEye(rec, b.getAttribute('data-sh-eye')); }); });
    return a;
  }

  /* ---------- decision block (US-6 / J1–J9; per eye, DR-0004) ---------- */
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
  function decisionForm(rec, d) {
    var R = rec.stellaRecommendation; d = d || {};
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
        '</div><div class="sh-delta-line" id="shDelta" data-stella="' + esc(R.size) + '"></div>' +
        '<div class="sh-err" data-err="size" hidden>Select the planned lens size.</div></fieldset>' +
      '<fieldset class="sh-fs"><legend class="sh-lg">Influencing method</legend><div class="sh-chips">' +
        METHODS.map(function (m) { return '<label class="sh-chip"><input type="radio" name="sh-method" value="' + m.code + '"' + chk(d.influencingMethod, m.code) + '><span>' + esc(m.label) + '</span></label>'; }).join('') +
        '</div><input class="sh-other" type="text" name="sh-method-other" maxlength="60" placeholder="name required" value="' + esc(d.otherMethodName || '') + '" aria-label="Other / custom method name" hidden>' +
        '<div class="sh-err" data-err="method" hidden>Select the influencing method.</div>' +
        '<div class="sh-err" data-err="other" hidden>Name the method.</div></fieldset>' +
      '<fieldset class="sh-fs"><legend class="sh-lg">Reason</legend><div class="sh-chips">' +
        REASONS.map(function (r) { return '<label class="sh-chip"><input type="radio" name="sh-reason" value="' + r.code + '"' + chk(d.reason && d.reason.code, r.code) + '><span>' + esc(r.label) + '</span></label>'; }).join('') +
        '</div><input class="sh-text" type="text" name="sh-reason-text" maxlength="140" placeholder="text ≤ 140 (optional)" value="' + esc(d.reason && d.reason.text || '') + '" aria-label="Reason, optional text">' +
        '<div class="sh-src" id="shReasonSrc" hidden></div>' +
        '<div class="sh-err" data-err="reason" hidden>Select a reason.</div></fieldset>' +
      '<div class="sh-form-actions"><button type="submit" class="sh-btn">' + esc(COPY.J7) + '</button></div></form>';
  }
  function describe(rec, d) {
    var method = d.influencingMethod === 'OTHER' ? ('Other / custom · ' + d.otherMethodName) : (METHODS.find(function (m) { return m.code === d.influencingMethod; }) || {}).label;
    var reason = (REASONS.find(function (r) { return r.code === d.reason.code; }) || {}).label + (d.reason.text ? ' · ' + d.reason.text : '');
    var lens = d.plannedLens.size + ' mm' + (d.plannedLens.power ? ' · ' + d.plannedLens.power + ' D' : '') + (d.plannedLens.axis ? ' · ' + d.plannedLens.axis + '°' : '');
    return { method: method, reason: reason, lens: lens };
  }
  function decisionSummary(rec) {
    var d = rec.decision, R = rec.stellaRecommendation, x = describe(rec, d);
    var same = String(d.plannedLens.size) === String(R.size);
    var delta = same ? COPY.K2 : fmt(COPY.K1, { d: (parseFloat(d.plannedLens.size) - parseFloat(R.size) >= 0 ? '+' : '') + (parseFloat(d.plannedLens.size) - parseFloat(R.size)).toFixed(1) });
    var src = d.reasonSource === 'inferred'
      ? '<span class="sh-src-tag inferred">' + esc(fmt(COPY.K3, { m: (METHODS.find(function (m) { return m.code === d.influencingMethod; }) || {}).label })) + '</span>'
      : '<span class="sh-src-tag manual">' + esc(COPY.K4) + '</span>';
    return '<div class="sh-record" id="shDecisionSummary">' +
      '<div class="sh-record-head"><span class="sh-record-title">' + esc(COPY.K6) + '</span>' +
        '<span class="sh-record-id">' + esc(rec.caseId) + ' · ' + esc(d.eye) + '</span></div>' +
      '<div class="sh-record-kind ' + (d.choice === 'accept' ? 'agree' : 'override') + '">' +
        esc(d.choice === 'accept' ? COPY.K8 : COPY.K9) + '</div>' +
      '<div class="sh-kv"><span>Decision</span><b>' + esc(d.choice === 'accept' ? fmt(COPY.J2, { size: R.size }) : COPY.J3) + '</b></div>' +
      '<div class="sh-kv"><span>Planned lens</span><b>' + esc(x.lens) + ' <em class="sh-rec-delta ' + (same ? 'same' : 'diff') + '">' + esc(delta) + '</em></b></div>' +
      '<div class="sh-kv"><span>Influencing method</span><b>' + esc(x.method) + '</b></div>' +
      '<div class="sh-kv"><span>Reason</span><b>' + esc(x.reason) + ' ' + src + '</b></div>' +
      '<div class="sh-kv"><span>Recorded</span><b>' + esc(utc(d.recordedAt)) + '</b></div>' +
      '<div class="sh-record-foot">' + esc(COPY.K7) + '</div>' +
      '<div class="sh-form-actions"><button type="button" class="sh-btn ghost" id="shEditDecision">Edit</button></div></div>';
  }
  function savedList(rec) {
    if (rec.eyes.length < 2) return '';
    return '<ul class="sh-saved" aria-label="Saved decisions">' + rec.eyes.map(function (E) {
      var d = rec.decisions[E];
      var txt = d ? ((d.choice === 'accept' ? fmt(COPY.J2, { size: rec.stella[E].size }) : COPY.J3) + ' · ' + describe(rec, d).lens) : 'no decision recorded';
      return '<li' + (E === curEye(rec) ? ' class="on"' : '') + '><b>' + E + '</b> ' + esc(txt) + '</li>';
    }).join('') + '</ul>';
  }
  function buildDecision(rec) {
    var box = el('<div class="pd-section sh-decision" id="shDecision"><div class="sf-step-head"><div class="sf-step-num sh-num">4</div>' +
      '<div class="sf-step-info"><h4 style="margin:0">' + esc(COPY.J1) + '<span id="shDecisionEye" class="sh-decision-eye">' + (rec.eyes.length > 1 ? ' · ' + esc(curEye(rec)) : '') + '</span></h4></div></div><div id="shDecisionBody"></div></div>');
    renderDecision(box.querySelector('#shDecisionBody'), rec);
    return box;
  }
  function renderDecision(body, rec) {
    body.innerHTML = (rec.decision ? decisionSummary(rec) : decisionForm(rec)) + savedList(rec);
    renderReturn(rec);
    if (rec.decision) {
      body.querySelector('#shEditDecision').addEventListener('click', function () {
        var draft = rec.decision; rec.decision = null;
        body.innerHTML = decisionForm(rec, draft) + savedList(rec); wireForm(body, rec, draft);
        renderReturn(rec);
      });
      return;
    }
    wireForm(body, rec);
  }
  function wireForm(body, rec, d0) {
    var form = body.querySelector('#shDecisionForm');
    var R = rec.stellaRecommendation;
    var reasonTouched = false, reasonSource = 'manual';
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
    function syncDelta() {
      var node = form.querySelector('#shDelta'); if (!node) return;
      var v = sizeSel.value, base = parseFloat(R.size);
      if (!v) { node.textContent = ''; node.className = 'sh-delta-line'; return; }
      var d = parseFloat(v) - base;
      if (Math.abs(d) < 0.001) { node.textContent = COPY.K2; node.className = 'sh-delta-line same'; return; }
      node.textContent = fmt(COPY.K1, { d: (d >= 0 ? '+' : '') + d.toFixed(1) });
      node.className = 'sh-delta-line diff';
    }
    /* the reason is inferred from the influencing method until the surgeon edits it */
    function applyInference() {
      if (reasonTouched) return;
      var m = (form.querySelector('[name="sh-method"]:checked') || {}).value;
      var code = INFERRED_REASON[m];
      form.querySelectorAll('[name="sh-reason"]').forEach(function (i) { i.checked = code ? i.value === code : false; });
      reasonSource = code ? 'inferred' : 'manual';
      syncReasonSrc(m, code);
    }
    function syncReasonSrc(m, code) {
      var node = form.querySelector('#shReasonSrc'); if (!node) return;
      if (!m) { node.hidden = true; return; }
      node.hidden = false;
      if (m === 'OTHER') { node.className = 'sh-src manual'; node.textContent = COPY.K5; return; }
      if (reasonSource === 'inferred' && code) {
        node.className = 'sh-src inferred';
        node.textContent = fmt(COPY.K3, { m: (METHODS.find(function (x) { return x.code === m; }) || {}).label });
      } else { node.className = 'sh-src manual'; node.textContent = COPY.K4; }
    }
    function syncChips() { form.querySelectorAll('.sh-chip, .sh-radio').forEach(function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); }); }
    form.addEventListener('change', function (e) {
      if (e.target.name === 'sh-choice') { syncChoice(); syncDelta(); }
      if (e.target.name === 'sh-size') syncDelta();
      if (e.target.name === 'sh-method') { syncOther(); applyInference(); }
      if (e.target.name === 'sh-reason') {
        reasonTouched = true; reasonSource = 'manual';
        syncReasonSrc((form.querySelector('[name="sh-method"]:checked') || {}).value, null);
      }
      syncChips();
    });
    syncChoice(); syncOther(); syncDelta(); syncChips();
    if (d0 && d0.reasonSource) { reasonSource = d0.reasonSource; reasonTouched = d0.reasonSource === 'manual'; }
    syncReasonSrc((form.querySelector('[name="sh-method"]:checked') || {}).value,
      INFERRED_REASON[(form.querySelector('[name="sh-method"]:checked') || {}).value]);
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
        eye: curEye(rec), choice: choice,
        plannedLens: { size: size, power: pwIn.value.trim() || null, axis: axIn.value.trim() || null },
        influencingMethod: method, otherMethodName: method === 'OTHER' ? other : null,
        reason: { code: reason, text: form.querySelector('[name="sh-reason-text"]').value.trim().slice(0, 140) },
        reasonSource: reasonSource,
        recordedAt: new Date().toISOString()
      };
      try { sessionStorage.setItem(DECISION_KEY, JSON.stringify({ key: decisionKey(rec), decisions: rec.decisions })); } catch (x) {}
      renderDecision(body, rec);
      toast(COPY.J8);
    });
  }
  function decisionKey(rec) { return rec.caseId + '|' + rec.laterality + '|' + (rec.sentAt || ''); }
  function restoreDecision(rec) {
    try {
      var s = JSON.parse(sessionStorage.getItem(DECISION_KEY) || 'null');
      if (!s || s.key !== decisionKey(rec)) return;
      var src = s.decisions || (s.decision ? { OD: s.decision } : {});
      rec.eyes.forEach(function (E) { if (src[E] && src[E].choice) rec.decisions[E] = src[E]; });
    } catch (e) {}
  }

  /* ---------- return block (US-7) + steps 6-8 ---------- */
  var ORDER_KEY = 'stella_order_confirmed';
  function orderFor(rec, E) {
    try {
      var all = JSON.parse(localStorage.getItem(ORDER_KEY) || '{}');
      return all[rec.caseId + '|' + E] || null;
    } catch (e) { return null; }
  }
  function buildReturn(rec) {
    var box = el('<section class="sh-return-box" id="shReturn" aria-label="Return to STELLA"></section>');
    renderReturnInto(box, rec);
    return box;
  }
  function renderReturn(rec) {
    var box = document.getElementById('shReturn');
    if (box) renderReturnInto(box, rec || H);
    var slot = document.querySelector('.sh-strip .sh-strip-cta');
    if (slot) { slot.innerHTML = ''; slot.appendChild(returnCta(true)); }
  }
  function renderReturnInto(box, rec) {
    if (!rec) return;
    var E = curEye(rec), d = rec.decisions[E], order = orderFor(rec, E);

    /* step 8 — the order comes back from STELLA over the API and closes the record.
       This is the only direction that carries data, and it carries an order. */
    if (order) {
      box.className = 'sh-return-box ordered';
      box.innerHTML =
        '<div class="sh-return-boundary done">' + esc(COPY.K13) + '</div>' +
        '<div class="sh-order-card"><div class="sh-order-head">' +
          '<img src="' + STELLA_LOGO + '" alt="STELLA"><span>' + esc(COPY.K12) + '</span>' +
          '<b class="sh-order-no">' + esc(order.orderNo) + '</b></div>' +
        '<div class="sh-kv"><span>Ordered lens</span><b>' + esc(order.lens.size) + ' mm' +
          (order.lens.power ? ' · ' + esc(order.lens.power) + ' D' : '') +
          (order.lens.axis ? ' · ' + esc(order.lens.axis) + '°' : '') + '</b></div>' +
        '<div class="sh-kv"><span>STELLA recommendation</span><b>' + esc(order.stella.size) + ' mm · ' + esc(order.stella.model) + '</b></div>' +
        '<div class="sh-kv"><span>Divergence</span><b>' + esc(order.divergent ? order.delta + ' mm — confirmed in STELLA' : 'none') + '</b></div>' +
        '<div class="sh-kv"><span>Confirmed</span><b>' + esc(utc(order.confirmedAt)) + '</b></div>' +
        caseRecord(rec, E, d, order) +
        '<div class="sh-postop">' + esc(COPY.K14) + '</div></div>';
      return;
    }

    box.className = 'sh-return-box';
    box.innerHTML = '<div class="sh-return-boundary">' + esc(COPY.R3) + '</div><div class="sh-return-body">' +
      '<img src="' + STELLA_LOGO + '" alt="STELLA"><div class="sh-return-cta"></div>' +
      '<div class="sh-return-cap">' + esc(d ? COPY.L2 : COPY.R2) + '</div></div>';
    var cta = box.querySelector('.sh-return-cta');
    if (d) {
      var b = el('<button type="button" class="sh-return">' + esc(COPY.L1) + '</button>');
      b.addEventListener('click', function () { openOrderModal(rec); });
      cta.appendChild(b);
    } else {
      cta.appendChild(returnCta(false));
    }
  }

  /* The closing analytical view the brief asks for: for one case, what went in,
     what every method produced, what STELLA recommended, and what the surgeon
     ordered and on what argument. */
  function caseRecord(rec, E, d, order) {
    var inputs = rec.inputs[E] || {};
    var vals = INPUT_KEYS.map(function (k) {
      return '<span><em>' + esc(k.toUpperCase()) + '</em>' + esc(inputs[k] ? inputs[k].v + ' ' + inputs[k].u : '—') + '</span>';
    }).join('');
    var last = (window._SF_LAST_RESULTS && window._SF_LAST_RESULTS.results) || [];
    var methods = last.length
      ? last.map(function (r) {
          return '<span><em>' + esc(r.name) + '</em>' + esc(parseFloat(r.recSize).toFixed(1)) + ' mm' +
            (r.vault ? ' · vault ' + esc(r.vault) + ' µm' : '') + '</span>';
        }).join('')
      : '<span class="none">no method was run</span>';
    var x = d ? describe(rec, d) : null;
    return '<details class="sh-caserec"><summary>' + esc(COPY.L12) + ' · ' + esc(rec.caseId) + ' · ' + esc(E) + '</summary>' +
      '<div class="sh-caserec-b">' +
        '<div class="sh-crk">' + esc(COPY.L13) + '</div><div class="sh-crvals">' + vals + '</div>' +
        '<div class="sh-crk">' + esc(COPY.L14) + '</div><div class="sh-crvals">' + methods + '</div>' +
        '<div class="sh-crk">' + esc(COPY.L15) + '</div><div class="sh-crvals"><span><em>STELLA</em>' +
          esc(order.stella.size) + ' mm · ' + esc(order.stella.model) + '</span></div>' +
        '<div class="sh-crk">' + esc(COPY.L16) + '</div><div class="sh-crvals">' +
          '<span><em>Ordered</em>' + esc(order.lens.size) + ' mm' + (order.lens.power ? ' · ' + esc(order.lens.power) + ' D' : '') + '</span>' +
          (x ? '<span><em>Method</em>' + esc(x.method) + '</span><span><em>Reason</em>' + esc(x.reason) +
               ' (' + esc(d.reasonSource === 'inferred' ? 'inferred' : 'manual') + ')</span>' : '') +
        '</div>' +
      '</div></details>';
  }

  /* ---------- step 7 · the STELLA ordering modal, hosted inside EVO Connect ----------
     The surface is STELLA's, visually separated, and it opens loaded with STELLA's
     OWN case data — the recommendation that arrived in step 2. EVO Connect never
     writes its decision into it: the surgeon edits the lens here himself. What the
     modal produces is an order created in STELLA, returned to REVAI over the API. */
  var ORDER_SIZES = ['12.1', '12.6', '13.2', '13.7'];
  var ord = null;                                                       // modal draft

  function stellaSeed(rec) {
    var R = rec.stellaRecommendation;
    return {
      size: String(R.size),
      power: R.power && R.power.sph != null ? String(R.power.sph) : '',
      axis: R.power && R.power.axis != null ? String(R.power.axis) : '',
      ack: false, err: null,
      touched: { size: false, power: false, axis: false }
    };
  }
  function openOrderModal(rec) {
    ord = stellaSeed(rec);
    var host = el('<div class="sh-omodal-scrim" id="shOrderModal" role="dialog" aria-modal="true" aria-label="' + esc(COPY.L4) + '"></div>');
    document.body.appendChild(host);
    host.addEventListener('click', function (e) { if (e.target === host) closeOrderModal(); });
    host.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOrderModal(); });
    paintOrderModal(rec);
  }
  function closeOrderModal() {
    var h = document.getElementById('shOrderModal'); if (h) h.remove();
    ord = null;
  }
  function paintOrderModal(rec) {
    var host = document.getElementById('shOrderModal'); if (!host) return;
    var E = curEye(rec), R = rec.stellaRecommendation, d = rec.decisions[E], done = orderFor(rec, E);

    if (done) {
      host.innerHTML = '<div class="sh-omodal">' + orderHead(rec, E, true) +
        '<div class="sh-obody"><div class="sh-oreceipt">' +
          '<div class="sh-ok">Order number</div><div class="sh-ono">' + esc(done.orderNo) + '</div>' +
          orderRow('Case · eye', done.caseId + ' · ' + done.eye) +
          orderRow('Ordered lens', done.lens.size + ' mm' + (done.lens.power ? ' · ' + done.lens.power + ' D' : '') + (done.lens.axis ? ' · ' + done.lens.axis + '°' : '')) +
          orderRow('STELLA recommendation', done.stella.size + ' mm · ' + done.stella.model) +
          orderRow('Divergence', done.divergent ? done.delta + ' mm — confirmed by the surgeon' : 'none — recommendation accepted') +
          orderRow('Confirmed', utc(done.confirmedAt)) +
          '<div class="sh-oaudit">' + esc(COPY.L11) + '</div>' +
        '</div></div>' +
        '<div class="sh-ofoot"><span class="sh-oapi">' + esc(COPY.L17) + '</span><div class="sh-ogrow"></div>' +
        '<button type="button" class="sh-obtn" data-o="close">Done ✓</button></div></div>';
      wireOrderModal(rec);
      return;
    }

    var diverges = ord.size && ord.size !== String(R.size);
    var delta = diverges ? ((parseFloat(ord.size) - parseFloat(R.size) >= 0 ? '+' : '') + (parseFloat(ord.size) - parseFloat(R.size)).toFixed(1)) : '';
    var tag = function (k) { return ord.touched[k] ? '' : '<em class="sh-otag">' + esc(COPY.L5) + '</em>'; };

    host.innerHTML = '<div class="sh-omodal">' + orderHead(rec, E, false) +
      '<div class="sh-obody">' +
        '<div class="sh-oseed">' + esc(COPY.L6) + '</div>' +
        '<div class="sh-orec"><div class="sh-ok">' + esc(COPY.L15) + '</div>' +
          '<div class="sh-orec-v">' + esc(R.size) + ' mm</div>' +
          '<div class="sh-orec-m">' + esc(R.model) + (R.power && R.power.sph != null ? ' · ' + esc(R.power.sph) + ' D' : '') +
            (R.power && R.power.axis != null ? ' · axis ' + esc(R.power.axis) + '°' : '') + ' · ' + esc(R.formula) + '</div></div>' +
        '<div class="sh-ogrid">' +
          '<label><span>Size (mm) ' + tag('size') + '</span><select data-of="size">' +
            ORDER_SIZES.map(function (v) { return '<option value="' + v + '"' + (ord.size === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') +
          '</select></label>' +
          '<label><span>Power (D) ' + tag('power') + '</span><input data-of="power" value="' + esc(ord.power) + '" placeholder="—"></label>' +
          '<label><span>Axis (°, optional) ' + tag('axis') + '</span><input data-of="axis" value="' + esc(ord.axis) + '" placeholder="—"></label>' +
        '</div>' +
        (d ? '<div class="sh-odec">Your decision in EVO Connect was <b>' + esc(d.plannedLens.size) + ' mm</b>' +
              (d.plannedLens.power ? ' · <b>' + esc(d.plannedLens.power) + ' D</b>' : '') +
              '. It is not carried into STELLA — enter it here yourself.</div>' : '') +
        (diverges ? '<div class="sh-odiff"><div class="t">' + esc(COPY.L7) + '</div>' +
          '<div class="x">' + esc(fmt(COPY.L8, { rec: R.size, got: ord.size, d: delta })) + '</div>' +
          '<label><input type="checkbox" data-of="ack"' + (ord.ack ? ' checked' : '') + '><span>' +
            esc(fmt(COPY.L9, { got: ord.size, rec: R.size })) + '</span></label></div>' : '') +
        (ord.err ? '<div class="sh-oerr">' + esc(ord.err) + '</div>' : '') +
      '</div>' +
      '<div class="sh-ofoot"><span class="sh-odemo">Demonstration only — no lens is ordered.</span>' +
        '<div class="sh-ogrow"></div>' +
        '<button type="button" class="sh-obtn ghost" data-o="close">Cancel</button>' +
        '<button type="button" class="sh-obtn" data-o="place">' + esc(COPY.L10) + '</button></div></div>';
    wireOrderModal(rec);
  }
  function orderHead(rec, E, done) {
    return '<div class="sh-oboundary">' + esc(COPY.L3) + '</div>' +
      '<div class="sh-ohead"><img src="' + STELLA_LOGO + '" alt="STELLA">' +
      '<div><div class="t">' + esc(done ? 'Order confirmed' : COPY.L4) + '</div>' +
      '<div class="s">' + esc(rec.caseId) + ' · ' + esc(E) + ' · STELLA — STAAR system of record</div></div></div>';
  }
  function orderRow(k, v) { return '<div class="sh-orow"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>'; }
  function wireOrderModal(rec) {
    var host = document.getElementById('shOrderModal'); if (!host) return;
    host.querySelectorAll('[data-o]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('data-o') === 'close') return closeOrderModal();
        placeOrder(rec);
      });
    });
    host.addEventListener('change', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-of'); if (!k || !ord) return;
      if (k === 'ack') { ord.ack = e.target.checked; ord.err = null; paintOrderModal(rec); return; }
      if (k === 'size') { ord.size = e.target.value; ord.touched.size = true; ord.ack = false; ord.err = null; paintOrderModal(rec); }
    });
    host.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-of'); if (!k || !ord) return;
      if (k === 'power' || k === 'axis') { ord[k] = e.target.value; ord.touched[k] = true; }
    });
    var first = host.querySelector('select,button'); if (first) first.focus();
  }
  function placeOrder(rec) {
    var E = curEye(rec), R = rec.stellaRecommendation;
    if (!ord.size) { ord.err = 'Select the lens size you are ordering.'; return paintOrderModal(rec); }
    if (!ord.power) { ord.err = 'Enter the lens power.'; return paintOrderModal(rec); }
    var diverges = ord.size !== String(R.size);
    if (diverges && !ord.ack) { ord.err = 'Confirm the difference with the STELLA recommendation before placing the order.'; return paintOrderModal(rec); }
    var rc = {
      caseId: rec.caseId, eye: E,
      orderNo: String(760000 + Math.floor(Math.random() * 9000)),
      lens: { size: ord.size, power: ord.power, axis: ord.axis || null },
      stella: { size: String(R.size), model: R.model, formula: R.formula },
      divergent: diverges,
      delta: diverges ? ((parseFloat(ord.size) - parseFloat(R.size) >= 0 ? '+' : '') + (parseFloat(ord.size) - parseFloat(R.size)).toFixed(1)) : '0.0',
      confirmedAt: new Date().toISOString(), system: 'STELLA', returnedTo: 'REVAI', via: 'API'
    };
    try {
      var all = JSON.parse(localStorage.getItem(ORDER_KEY) || '{}');
      all[rc.caseId + '|' + rc.eye] = rc;
      localStorage.setItem(ORDER_KEY, JSON.stringify(all));
    } catch (e) {}
    ord.err = null;
    paintOrderModal(rec);
    renderReturn(rec);
  }

  /* the order is confirmed in the STELLA tab, so watch for it coming back */
  function watchOrder() {
    var seen = '';
    var tick = function () {
      if (!H) return;
      var o = orderFor(H, curEye(H));
      var k = o ? o.orderNo : '';
      if (k !== seen) { seen = k; renderReturn(H); }
    };
    window.addEventListener('focus', tick);
    window.addEventListener('storage', tick);
    setInterval(tick, 1500);
  }

  /* ---------- comparator cards ---------- */
  function stellaCard(rec) {
    var E = curEye(rec), R = rec.stella[E];
    return '<div class="sf-comp-card sh-stella-card" data-formula="STELLA" draggable="false" title="' + esc(COPY.S2) + '" aria-label="' + esc(COPY.S1) + '">' +
      '<div class="sf-comp-head"><div class="sf-comp-badge sh-badge-stella">' + lockSvg() + '</div>' +
      '<div class="sf-comp-name"><div class="nm">' + esc(COPY.P1) + '</div><div class="ds">' + esc(COPY.S1) + '</div></div></div>' +
      '<div class="sf-comp-stats"><div class="stat"><div class="lbl">Size</div><div class="val">' + esc(R.size) + '<em>mm</em></div></div>' +
      '<div class="stat"><div class="lbl">Model</div><div class="val sh-small">' + esc(R.model) + '</div></div></div>' +
      '<div class="sh-meta"><div>' + esc(R.formula) + '</div><div>' + esc(rec.caseId) + ' · ' + esc(E) + '</div></div>' +
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

  /* ---------- header chip (signal a) ---------- */
  function decorateHeader(rec) {
    var chips = document.querySelector('.pt-ph-chips');
    if (chips && !chips.querySelector('.sh-origin')) {
      var stage = chips.querySelector('.c.stage');
      var chip = el('<span class="c sh-origin">' + esc(COPY.T1) + '</span>');
      if (stage) stage.insertAdjacentElement('afterend', chip); else chips.prepend(chip);
    }
    var hdrSub = document.querySelector('.pt-ph-sub');
    if (hdrSub) hdrSub.textContent = rec.caseId + ' · — · — · eye ' + rec.eyes.join('/') + ' · ' + rec.eyes.map(function (E) { return rec.inputs[E].sph.v; }).join(' / ') + ' D';
    var cur = document.querySelector('.pt-ph-progress-meta span b'); if (cur) cur.textContent = 'ICL selection · sizing comparison';   // E1
  }

  /* ---------- decorate the sizing tab of the handoff patient ---------- */
  function decorate() {
    if (!currentIsHandoff()) return;
    if (typeof CURRENT_PT_TAB !== 'undefined' && CURRENT_PT_TAB !== 'sizing') return;
    var main = document.getElementById('ptMainContent');
    if (!main || main.querySelector('.sh-strip')) return;
    var rec = H;
    main.classList.add('sh-handoff');
    document.body.classList.add('sh-handoff-active');
    var sections = Array.prototype.slice.call(main.children);
    var layout = el('<div class="sh-layout"><div class="sh-col-side"></div><div class="sh-col-main"></div></div>');
    var colSide = layout.firstElementChild, colMain = layout.lastElementChild;
    sections.forEach(function (s) { colMain.appendChild(s); });
    colSide.appendChild(buildPanel(rec));
    main.appendChild(buildStrip(rec));
    main.appendChild(layout);
    var results = colMain.querySelector('#sfResults');
    var decision = buildDecision(rec), ret = buildReturn(rec);
    if (results) { results.insertAdjacentElement('afterend', decision); } else colMain.appendChild(decision);
    decision.insertAdjacentElement('afterend', ret);
    EYE_SCOPE = curEye(rec);
    prefill(rec);
    decorateChips();
    lockEyeScope(rec);
    decorateHeader(rec);
    var lbl = document.getElementById('sebEyeLabel'); if (lbl) lbl.textContent = curEye(rec);
    var chosen = colMain.querySelector('#sfChosenBanner'); if (chosen) chosen.remove();
    var hint = colMain.querySelector('#sfResults > p.muted'); if (hint) hint.textContent = 'Results from every selected method next to the STELLA recommendation.';
    patchNulls(document.getElementById('usMain'));
    colMain.addEventListener('click', function (e) {
      var c = e.target.closest('.sh-ext-card'); if (!c) return;
      rec.ui.selectedCard = c.getAttribute('data-formula'); scrollToDecision();
    });
    colMain.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('sh-ext-card')) { e.preventDefault(); e.target.click(); }
    });
  }

  /* ---------- wrappers (pattern js/28:488) ---------- */
  function installWrappers() {
    var _run = window.runSizingFormulas;
    window.runSizingFormulas = function (patientId) {
      if (!isHandoff(patientId)) return _run.apply(this, arguments);
      var rec = H, codes = Array.from(SELECTED_SIZING_FORMULAS);
      if (EYE_SCOPE !== curEye(rec)) { EYE_SCOPE = curEye(rec); lockEyeScope(rec); }
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
      if (!currentIsHandoff()) return _scope.apply(this, arguments);
      if (H.eyes.indexOf(scope) < 0) { toast(eyeLockTitle(H)); return; }
      switchEye(H, scope);
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
      if (H && id === H.caseId) { SELECTED_SIZING_FORMULAS = new Set(HANDOFF_SET); EYE_SCOPE = curEye(H); }
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
    var unveil = function () { try { document.documentElement.classList.remove('sh-direct'); } catch (e) {} };
    var rec = readPayload();
    if (rec && rec.error) {
      unveil();
      console.warn('[stella-handoff] invalid payload — no case opened');
      document.body.appendChild(el('<div class="sh-badpayload" role="alert">' + esc(COPY.A3) + '</div>'));
      toast(COPY.A3);
      return;
    }
    if (!rec) { unveil(); return; }                                      // regular EVO Connect
    H = window.STELLA_HANDOFF = rec;
    restoreDecision(rec);
    DEFAULT_SET = Array.from(SELECTED_SIZING_FORMULAS);
    installWrappers();
    upsertPatient(rec);
    openUniverse();
    openPatientFile(rec.caseId);
    setPatientTab('sizing');
    watchOrder();
    /* the home stays hidden behind the overlay until the user actually goes back to it */
    var _close = window.closeUniverse;
    if (typeof _close === 'function') {
      window.closeUniverse = function () { unveil(); return _close.apply(this, arguments); };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
