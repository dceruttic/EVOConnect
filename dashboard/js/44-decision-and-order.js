/* ================================================================
   DECISION + ORDER — the normal (non-handoff) sizing flow
   ----------------------------------------------------------------
   A case that did not arrive from STELLA gets the same closing steps
   as one that did: the surgeon's decision is recorded against the
   case, and the lens is ordered through STELLA's ordering surface.

   The reference here is the STAAR nomogram (the mandatory method),
   the way the STELLA recommendation is the reference in a handoff.
   Nothing is written anywhere outside EVO Connect until the order is
   placed in STELLA.
================================================================ */
(function () {
  'use strict';

  var METHOD_LABEL = { ICL_GURU: 'ICL Guru', ICL_FIT: 'ICLFIT', CASIA2: 'CASIA2',
                       REINSTEIN: 'Reinstein', LASSO: 'Lasso', KS: 'KS',
                       STAAR_NOM: 'STAAR nomogram', OTHER: 'Other / custom' };
  var REASONS = [ ['VAULT_BAND', 'Vault prediction'], ['WTW_DISC', 'WTW discrepancy'],
                  ['ANATOMY_ASOCT', 'AS-OCT anatomy'], ['EXPERIENCE', 'Surgeon experience'],
                  ['OTHER', 'Other'] ];
  var INFERRED = { ICL_GURU: 'VAULT_BAND', ICL_FIT: 'ANATOMY_ASOCT', CASIA2: 'ANATOMY_ASOCT' };
  var SIZES = ['12.1', '12.6', '13.2', '13.7'];

  window.PT_DECISIONS = window.PT_DECISIONS || {};   // patientId -> decision

  function el(h) { var d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isHandoff() {
    try { return document.body.classList.contains('sh-handoff-active'); } catch (e) { return false; }
  }
  function results() {
    return (window._SF_LAST_RESULTS && _SF_LAST_RESULTS.results) || [];
  }
  function reference() {                       // the STAAR nomogram result
    return results().find(function (r) { return r.code === 'STAAR_NOM'; }) || null;
  }
  function utc(iso) { try { return new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'; } catch (e) { return ''; } }

  /* ---------- the decision form ---------- */
  function decisionForm(pt, d0) {
    d0 = d0 || {};
    var ref = reference();
    var refSize = ref ? parseFloat(ref.recSize).toFixed(1) : null;
    var ran = results().filter(function (r) { return r.code !== 'STAAR_NOM'; });
    var chk = function (a, b) { return a === b ? ' checked' : ''; };
    var sel = function (a, b) { return a === b ? ' selected' : ''; };
    var pl = d0.plannedLens || {};
    return '<form class="sh-form" id="ptDecisionForm" novalidate>' +

      '<fieldset class="sh-fs" data-step="1"><legend class="sh-lg">1 · Decision</legend>' +
        '<label class="sh-radio wide"><input type="radio" name="pd-choice" value="accept"' + chk(d0.choice, 'accept') + (refSize ? '' : ' disabled') + '>' +
          '<span>' + (refSize ? esc('Accept the STAAR nomogram (' + refSize + ' mm)') : 'Run the comparison first') + '</span></label>' +
        '<label class="sh-radio wide"><input type="radio" name="pd-choice" value="prefer"' + chk(d0.choice, 'prefer') + '><span>Prefer another lens</span></label>' +
        '<div class="sh-err" data-err="choice" hidden>Choose one.</div></fieldset>' +

      '<fieldset class="sh-fs pd-lens" id="pdLensFs" data-step="2"><legend class="sh-lg">2 · Planned lens</legend>' +
        '<div class="sh-lens-grid">' +
          '<label><span>Size (mm)</span><select name="pd-size"><option value="">—</option>' +
            SIZES.map(function (x) { return '<option value="' + x + '"' + sel(pl.size, x) + '>' + x + '</option>'; }).join('') +
          '</select></label>' +
          '<label><span>Power (D)</span><input type="text" name="pd-power" inputmode="decimal" value="' + esc(pl.power || '') + '" placeholder="—"></label>' +
          '<label><span>Axis (°, optional)</span><input type="text" name="pd-axis" inputmode="numeric" value="' + esc(pl.axis || '') + '" placeholder="—"></label>' +
        '</div>' +
        '<div class="sh-delta-line" id="pdDelta"></div>' +
        '<div class="sh-err" data-err="size" hidden>Select the planned lens size.</div></fieldset>' +

      '<fieldset class="sh-fs" data-step="3"><legend class="sh-lg">3 · Influencing method</legend><div class="sh-chips">' +
        ran.map(function (r) {
          return '<label class="sh-chip"><input type="radio" name="pd-method" value="' + esc(r.code) + '"' + chk(d0.influencingMethod, r.code) + '>' +
                 '<span>' + esc(METHOD_LABEL[r.code] || r.name) + '</span></label>'; }).join('') +
        '<label class="sh-chip"><input type="radio" name="pd-method" value="OTHER"' + chk(d0.influencingMethod, 'OTHER') + '><span>Other / custom</span></label>' +
        '</div>' +
        '<input class="sh-other" type="text" name="pd-method-other" maxlength="60" placeholder="Which calculator did you use?" value="' + esc(d0.otherMethodName || '') + '" aria-label="Other / custom method name" hidden>' +
        '<div class="sh-err" data-err="method" hidden>Select the method that influenced you.</div>' +
        '<div class="sh-err" data-err="other" hidden>Name the calculator.</div></fieldset>' +

      '<fieldset class="sh-fs" data-step="4"><legend class="sh-lg">4 · Reason</legend><div class="sh-chips">' +
        REASONS.map(function (r) {
          return '<label class="sh-chip"><input type="radio" name="pd-reason" value="' + r[0] + '"' + chk(d0.reason && d0.reason.code, r[0]) + '>' +
                 '<span>' + esc(r[1]) + '</span></label>'; }).join('') +
        '</div>' +
        '<input class="sh-text" type="text" name="pd-reason-text" maxlength="140" placeholder="text ≤ 140 (optional)" value="' + esc((d0.reason && d0.reason.text) || '') + '" aria-label="Reason, optional text">' +
        '<div class="sh-src" id="pdReasonSrc" hidden></div>' +
        '<div class="sh-err" data-err="reason" hidden>Select a reason.</div></fieldset>' +

      '<div class="sh-form-actions"><button type="submit" class="sh-btn">Save decision</button></div></form>';
  }

  function summary(pt, d) {
    var ref = reference();
    var refSize = ref ? parseFloat(ref.recSize).toFixed(1) : null;
    var size = d.plannedLens.size;
    var same = refSize != null && Math.abs(parseFloat(size) - parseFloat(refSize)) < 0.001;
    var delta = refSize == null ? '' : (same ? 'same as the STAAR nomogram'
      : ((parseFloat(size) - parseFloat(refSize) >= 0 ? '+' : '') + (parseFloat(size) - parseFloat(refSize)).toFixed(1) + ' mm vs the STAAR nomogram'));
    var method = d.influencingMethod === 'OTHER'
      ? (d.otherMethodName || 'Other / custom') + ' (outside the ecosystem)'
      : (METHOD_LABEL[d.influencingMethod] || d.influencingMethod);
    var reason = (REASONS.find(function (r) { return r[0] === d.reason.code; }) || [, d.reason.code])[1];
    var lens = size + ' mm' + (d.plannedLens.power ? ' · ' + d.plannedLens.power + ' D' : '') +
               (d.plannedLens.axis ? ' · ' + d.plannedLens.axis + '°' : '');
    return '<div class="sh-record" id="ptDecisionSummary">' +
      '<div class="sh-record-head"><span class="sh-record-title">Decision on record</span>' +
        '<span class="sh-record-id">REV-' + esc(pt.id) + '</span></div>' +
      '<div class="sh-record-kind ' + (d.choice === 'accept' ? 'agree' : 'override') + '">' +
        (d.choice === 'accept' ? 'Kept the STAAR nomogram' : 'Chose a different lens') + '</div>' +
      '<div class="sh-kv"><span>Planned lens</span><b>' + esc(lens) +
        (delta ? ' <em class="sh-rec-delta ' + (same ? 'same' : 'diff') + '">' + esc(delta) + '</em>' : '') + '</b></div>' +
      '<div class="sh-kv"><span>Influencing method</span><b>' + esc(method) + '</b></div>' +
      '<div class="sh-kv"><span>Reason</span><b>' + esc(reason) + (d.reason.text ? ' — ' + esc(d.reason.text) : '') +
        ' <span class="sh-src ' + esc(d.reasonSource) + '">' + esc(d.reasonSource) + '</span></b></div>' +
      '<div class="sh-kv"><span>Recorded</span><b>' + esc(utc(d.recordedAt)) + '</b></div>' +
      '<div class="sh-record-foot">Recorded in EVO Connect. The order itself is created in STELLA.</div>' +
      '<div class="sh-form-actions"><button type="button" class="sh-btn ghost" id="ptEditDecision">Edit</button></div></div>';
  }

  /* ---------- wiring ---------- */
  function wire(body, pt, d0) {
    var form = body.querySelector('#ptDecisionForm'); if (!form) return;
    var ref = reference(), refSize = ref ? parseFloat(ref.recSize).toFixed(1) : null;
    var sizeSel = form.querySelector('[name="pd-size"]');
    var touched = false, source = 'manual';

    function syncChoice() {
      var c = (form.querySelector('[name="pd-choice"]:checked') || {}).value;
      form.querySelector('#pdLensFs').classList.toggle('accept', c === 'accept');
      if (c === 'accept' && refSize) { sizeSel.value = refSize; sizeSel.disabled = true; }
      else sizeSel.disabled = false;
    }
    function syncDelta() {
      var n = form.querySelector('#pdDelta'); if (!n || refSize == null) return;
      var v = sizeSel.value;
      if (!v) { n.textContent = ''; n.className = 'sh-delta-line'; return; }
      var d = parseFloat(v) - parseFloat(refSize);
      if (Math.abs(d) < 0.001) { n.textContent = 'Same as the STAAR nomogram'; n.className = 'sh-delta-line same'; return; }
      n.textContent = 'Δ vs the STAAR nomogram ' + (d >= 0 ? '+' : '') + d.toFixed(1) + ' mm';
      n.className = 'sh-delta-line diff';
    }
    function syncOther() {
      var m = (form.querySelector('[name="pd-method"]:checked') || {}).value;
      form.querySelector('[name="pd-method-other"]').hidden = m !== 'OTHER';
    }
    function infer() {
      if (touched) return;
      var m = (form.querySelector('[name="pd-method"]:checked') || {}).value;
      var code = INFERRED[m];
      form.querySelectorAll('[name="pd-reason"]').forEach(function (i) { i.checked = code ? i.value === code : false; });
      source = code ? 'inferred' : 'manual';
      var n = form.querySelector('#pdReasonSrc');
      if (n) {
        n.hidden = !m;
        n.className = 'sh-src ' + source;
        n.textContent = source === 'inferred'
          ? 'inferred from ' + (METHOD_LABEL[m] || m)
          : 'entered by the surgeon';
      }
    }
    function chips() { form.querySelectorAll('.sh-chip, .sh-radio').forEach(function (l) {
      var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); }); }
    /* Progressive disclosure: a step stays dimmed until the one before it is
       answered, so the form reads as four decisions, not one wall. */
    function gate() {
      var g = function (n) { return !!form.querySelector('[name="' + n + '"]:checked'); };
      var done = [true, g('pd-choice'), g('pd-choice') && !!sizeSel.value, g('pd-method')];
      form.querySelectorAll('.sh-fs').forEach(function (fs, i) { fs.classList.toggle('pending', !done[i]); });
    }
    /* Inline validation: clear a step's error as soon as it is answered. */
    function clearErr(k) { var n = form.querySelector('[data-err="' + k + '"]'); if (n) n.hidden = true; }
    form.addEventListener('blur', function (e) {
      if (e.target.name === 'pd-size' && sizeSel.value) clearErr('size');
      if (e.target.name === 'pd-method-other' && e.target.value.trim()) clearErr('other');
    }, true);

    form.addEventListener('change', function (e) {
      if (e.target.name === 'pd-choice') { syncChoice(); syncDelta(); }
      if (e.target.name === 'pd-size') syncDelta();
      if (e.target.name === 'pd-method') { syncOther(); infer(); }
      if (e.target.name === 'pd-reason') { touched = true; source = 'manual'; infer(); }
      if (e.target.name) clearErr(String(e.target.name).replace('pd-', '').replace('choice', 'choice'));
      chips(); gate();
    });
    syncChoice(); syncOther(); syncDelta(); chips(); infer(); gate();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = function (k, on) { var n = form.querySelector('[data-err="' + k + '"]'); if (n) n.hidden = !on; return on; };
      var g = function (n) { return (form.querySelector('[name="' + n + '"]:checked') || {}).value; };
      var choice = g('pd-choice'), method = g('pd-method'), reason = g('pd-reason');
      var other = form.querySelector('[name="pd-method-other"]').value.trim();
      var size = choice === 'accept' && refSize ? refSize : sizeSel.value;
      var bad = false;
      bad = err('choice', !choice) || bad;
      bad = err('size', !size) || bad;
      bad = err('method', !method) || bad;
      bad = err('other', method === 'OTHER' && !other) || bad;
      bad = err('reason', !reason) || bad;
      if (bad) { var f = form.querySelector('.sh-err:not([hidden])'); if (f) f.scrollIntoView({ block: 'center' }); return; }

      PT_DECISIONS[pt.id] = {
        choice: choice,
        plannedLens: { size: size, power: form.querySelector('[name="pd-power"]').value.trim() || null,
                       axis: form.querySelector('[name="pd-axis"]').value.trim() || null },
        influencingMethod: method, otherMethodName: method === 'OTHER' ? other : null,
        reason: { code: reason, text: form.querySelector('[name="pd-reason-text"]').value.trim().slice(0, 140) },
        reasonSource: source, recordedAt: new Date().toISOString()
      };
      render(pt);
      if (typeof showToast === 'function') showToast('Decision recorded in EVO Connect — nothing was sent to STELLA');
    });
  }

  /* ---------- order box ---------- */
  function orderBox(pt) {
    var d = PT_DECISIONS[pt.id];
    var box = el('<section class="sh-return-box" id="ptOrder">' +
      '<div class="sh-return-boundary">Ordering happens in STELLA · STAAR system of record</div>' +
      '<div class="sh-return-body"><div class="sh-return-cta"></div>' +
      '<div class="sh-return-cap">STELLA opens with this case. You enter and confirm the lens there.</div></div></section>');
    var b = el('<button type="button" class="sh-return">Order Lens (in Stella)</button>');
    b.addEventListener('click', function () {
      clearAlert();
      if (!d) { alertInto(box, ['Record your decision first (step 4).'], '#ptDecision'); return; }
      var missing = [];
      [['sf-rx-man-sph', 'Manifest sphere'], ['sf-rx-man-cyl', 'Manifest cylinder'], ['sf-rx-man-ax', 'Manifest axis'],
       ['sf-acd', 'ACD'], ['sf-wtw', 'WTW']].forEach(function (f) {
        var i = document.getElementById(f[0]);
        if (!i || String(i.value).trim() === '') missing.push('Missing input: ' + f[1]);
      });
      if (missing.length) { alertInto(box, missing, null); return; }
      /* The STELLA ordering surface — the same modal, in STELLA's own design
         system, that a case arriving from STELLA opens. */
      if (typeof openStellaLensModal === 'function') {
        var ref = reference();
        openStellaLensModal({
          caseId: 'REV-' + pt.id,
          eye: (typeof EYE_SCOPE !== 'undefined' && EYE_SCOPE !== 'BOTH') ? EYE_SCOPE : 'OD',
          refSize: ref ? parseFloat(ref.recSize).toFixed(1) : d.plannedLens.size,
          model: 'Toric Myopic',
          power: d.plannedLens.power, axis: d.plannedLens.axis,
          formula: 'STAAR nomogram', decision: d
        });
      } else if (typeof openStellaOrder === 'function') {
        openStellaOrder(pt.id, d.influencingMethod, d.plannedLens.size, 0);
      }
    });
    box.querySelector('.sh-return-cta').appendChild(b);
    return box;
  }
  function clearAlert() { document.querySelectorAll('#ptOrder .sh-vald').forEach(function (n) { n.remove(); }); }
  function alertInto(box, lines, focus) {
    clearAlert();
    var n = lines.length;
    box.querySelector('.sh-return-cta').appendChild(el('<div class="sh-vald" role="alert">' +
      '<div class="sh-vald-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v5"/><path d="M12 17.5h.01"/><path d="M10.3 3.9 1.9 18.4A2 2 0 0 0 3.6 21.4h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>' +
      'Cannot order yet — ' + n + ' item' + (n === 1 ? '' : 's') + ' still missing</div><ul>' +
      lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>'));
    if (focus) { var t = document.querySelector(focus); if (t) t.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    if (typeof showToast === 'function') showToast('Cannot order yet — ' + n + ' item' + (n === 1 ? '' : 's') + ' still missing');
  }

  /* ---------- mount ---------- */
  function render(pt) {
    var body = document.getElementById('ptDecisionBody'); if (!body) return;
    var d = PT_DECISIONS[pt.id];
    body.innerHTML = d ? summary(pt, d) : decisionForm(pt);
    if (d) {
      body.querySelector('#ptEditDecision').addEventListener('click', function () {
        var draft = PT_DECISIONS[pt.id]; delete PT_DECISIONS[pt.id];
        body.innerHTML = decisionForm(pt, draft); wire(body, pt, draft);
        refreshOrder(pt);
      });
    } else wire(body, pt);
    refreshOrder(pt);
  }
  function refreshOrder(pt) {
    var old = document.getElementById('ptOrder');
    var box = orderBox(pt);
    if (old) old.replaceWith(box);
    else {
      var sec = document.getElementById('ptDecision');
      if (sec) sec.insertAdjacentElement('afterend', box);
    }
  }
  function mount() {
    if (isHandoff()) return;
    if (typeof CURRENT_PT === 'undefined' || !CURRENT_PT) return;
    if (typeof CURRENT_PT_TAB !== 'undefined' && CURRENT_PT_TAB !== 'sizing') return;
    var res = document.getElementById('sfResults');
    if (!res || res.style.display === 'none') return;          // only once a comparison has run
    if (document.getElementById('ptDecision')) { render(CURRENT_PT); return; }
    var sec = el('<div class="pd-section sh-decision" id="ptDecision">' +
      '<div class="sf-step-head"><div class="sf-step-num sh-num">4</div>' +
      '<div class="sf-step-info"><h4 style="margin:0">Your decision</h4>' +
      '<p style="margin:2px 0 0;font-size:12px;color:#7B879E">What you are ordering, which method influenced you, and why. Recorded against this case.</p></div></div>' +
      '<div id="ptDecisionBody"></div></div>');
    res.insertAdjacentElement('afterend', sec);
    render(CURRENT_PT);
  }

  /* Runs after every comparison and every tab render. */
  function install() {
    var _run = window.runSizingFormulas;
    if (typeof _run === 'function') {
      window.runSizingFormulas = function () {
        var r = _run.apply(this, arguments);
        setTimeout(mount, 0);
        return r;
      };
    }
    var _tab = window.setPatientTab;
    if (typeof _tab === 'function') {
      window.setPatientTab = function () {
        var r = _tab.apply(this, arguments);
        setTimeout(mount, 0);
        return r;
      };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
