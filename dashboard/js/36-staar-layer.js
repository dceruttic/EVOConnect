/* ================================================================
   JOURNEY 2 · STEP 3 — THE STAAR-OWNED TRANSFER LAYER
   ----------------------------------------------------------------
   Concept surface, drawn entirely in STAAR's design system, never in
   REVAI's: the point of the screen is that this zone has a different
   owner, a different quality system and a different logo.

   Where it sits: exactly where step 6 of Journey 1 sits — the moment
   the case has to cross back. In Journey 1 the bridge is the surgeon
   retyping; here it is a validated interface. Everything before
   (the comparison, the decision) and everything after (STELLA's
   challenge and confirmation) is unchanged.

   What it is NOT: a Phase 1 path. The door is labelled concept, the
   modal is labelled concept, and it can be switched off with ?j2=0.
================================================================ */
(function () {
  'use strict';

  var LOGO = '/assets/staar-surgical-logo-white.svg';
  var ORDER_KEY = 'stella_order_confirmed';
  var FLAG_KEY = 'journey2';

  var COPY = {
    RIBBON: ['Future state', 'concept', 'not an approved Phase 1 path'],
    DOOR_T: 'Or let a STAAR-validated layer carry it',
    DOOR_P: 'In the concept sequence the surgeon does not retype anything. The case crosses through an interface that STAAR owns and validates under its own quality system — and STELLA still challenges the difference before any order exists.',
    DOOR_B: 'Send through the STAAR layer',
    DOOR_N: 'Journey 2 · step 3 · shown for evaluation only',
    DOOR_NEED: 'Record your decision first — the layer carries the lens you chose.',
    LEAVING: 'Leaving EVO Connect · external service',
    CONNECT: 'Connecting to STAAR Integration Layer',
    STEPS: ['Opening STAAR-owned interface', 'Authenticating · mutual TLS 1.3', 'Session established · STAAR gateway'],
    BOUND: ['STAAR · integration layer', 'you have left EVO Connect', 'future state · concept'],
    HEAD_T: 'STAAR Integration Layer',
    HEAD_S: "Owned by STAAR · validated under STAAR's QMS",
    NOLOGO: 'no REVAI component inside this zone',
    K_IN: 'Received from REVAI',
    K_CTRL: 'Controls that live here, not in REVAI',
    OUT_K: 'Handed to STELLA',
    OUT_V: "Draft order · awaiting the surgeon's confirmation",
    MSG: 'A draft is not an order. STELLA still shows its own recommendation, marks the difference and demands an explicit confirmation before anything is placed. The layer removes the transcription, not the decision.',
    BH: 'Three fields this demonstration cannot fill',
    BCAP: "They are STAAR's to answer, and they set the pace of everything downstream. The rate-determining step is this zone, not the software on either side of it.",
    F1: 'Demonstration only – synthetic data – not for clinical use',
    GO: 'Continue to STELLA',
    CANCEL: 'Cancel',
    SEED: 'Received through the STAAR integration layer. Values arrived validated — STELLA still asks you to confirm any difference with its own recommendation.',
    SRC: 'via STAAR layer'
  };

  var CHECKS = [
    { t: 'Schema validation',
      d: 'Interface contract v1.2 · 18 fields on whitelist · unknown keys rejected, never ignored',
      v: 'v1.2 · 18/18 fields' },
    { t: 'Clinical range checks',
      d: 'ACD ∈ [2.50–4.50] mm · WTW ∈ [10.0–13.5] mm · size ∈ {12.1, 12.6, 13.2, 13.7}',
      v: 'all within range' },
    { t: 'Laterality & idempotency',
      d: 'Eye enumerated, never inferred · one key per eye · a repeat submit creates nothing',
      v: null },
    { t: 'Transaction log',
      d: 'Append-only, integrity-protected · correlation ID joins the three records',
      v: null }
  ];

  /* ---------- helpers ---------- */
  function el(h) { var t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function ribbon(cls) {
    return '<div class="' + cls + '">' + COPY.RIBBON.map(function (s, i) {
      return (i ? '<i>·</i>' : '') + (i === 0 ? '<b>' + esc(s) + '</b>' : esc(s));
    }).join('') + '</div>';
  }

  /* ---------- state ---------- */
  function enabled() {
    try {
      var q = new URLSearchParams(location.search).get('j2');
      if (q === '0' || q === 'off') { localStorage.setItem(FLAG_KEY, 'off'); return false; }
      if (q === '1' || q === 'on') { localStorage.setItem(FLAG_KEY, 'on'); return true; }
      return localStorage.getItem(FLAG_KEY) !== 'off';
    } catch (e) { return true; }
  }
  function bridge() { return window.SH && typeof SH.openOrderModal === 'function' ? SH : null; }
  function record() { var b = bridge(); return b ? b.record() : null; }
  function eyeOf(rec) { var b = bridge(); return b ? b.eye(rec) : (rec && rec.laterality); }
  function decisionOf(rec, E) { return rec && rec.decisions ? rec.decisions[E] : null; }
  function orderOf(rec, E) {
    try { return (JSON.parse(localStorage.getItem(ORDER_KEY) || '{}'))[rec.caseId + '|' + E] || null; }
    catch (e) { return null; }
  }
  function corrId(rec, E) {
    var s = String(rec.caseId + E), n = 0;
    for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
    return 'STAAR-TX-' + n.toString(16).toUpperCase().slice(0, 6);
  }

  /* ---------- the door, rendered inside EVO Connect ---------- */
  function buildDoor() {
    var d = el('<section class="j2 j2-door" id="j2Door" aria-label="Future state concept"></section>');
    d.innerHTML = ribbon('j2-ribbon') +
      '<div class="j2-door-b">' +
        '<h4>' + esc(COPY.DOOR_T) + '</h4>' +
        '<p>' + esc(COPY.DOOR_P) + '</p>' +
        '<div class="j2-door-cta">' +
          '<button type="button" class="j2-btn" id="j2Go">' + esc(COPY.DOOR_B) +
            ' <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></button>' +
          '<span class="j2-note" id="j2Note">' + esc(COPY.DOOR_N) + '</span>' +
        '</div>' +
      '</div>';
    d.querySelector('#j2Go').addEventListener('click', function () {
      var rec = record(); if (!rec) return;
      cross(rec, eyeOf(rec));
    });
    return d;
  }

  function sync() {
    var door = document.getElementById('j2Door');
    var rec = enabled() ? record() : null;
    var box = document.getElementById('shReturn');
    if (!rec || !box) { if (door) door.remove(); return; }
    var E = eyeOf(rec);
    if (orderOf(rec, E)) { if (door) door.remove(); return; }   // loop already closed
    if (!door) { door = buildDoor(); box.parentNode.insertBefore(door, box.nextSibling); }
    else if (door.previousElementSibling !== box) { box.parentNode.insertBefore(door, box.nextSibling); }
    var d = decisionOf(rec, E), btn = door.querySelector('#j2Go'), note = door.querySelector('#j2Note');
    btn.disabled = !d;
    note.textContent = d ? COPY.DOOR_N : COPY.DOOR_NEED;
  }

  /* ---------- the crossing: three seconds, no REVAI on screen ---------- */
  function cross(rec, E) {
    var total = reduced() ? 500 : 3000;
    var ov = el('<div class="j2 j2-connect" id="j2Connect" role="status" aria-live="polite"></div>');
    ov.innerHTML = '<div class="j2-connect-in">' +
      '<img src="' + LOGO + '" alt="STAAR Surgical">' +
      '<div class="j2-leaving">' + esc(COPY.LEAVING) + '</div>' +
      '<h3>' + esc(COPY.CONNECT) + '</h3>' +
      '<div class="j2-bar"><i id="j2Bar"></i></div>' +
      '<div class="j2-status" id="j2Status"></div>' +
      '<div class="j2-stamp">' + esc(COPY.F1) + '</div>' +
    '</div>';
    document.body.appendChild(ov);

    var bar = ov.querySelector('#j2Bar'), st = ov.querySelector('#j2Status'), t = [];
    COPY.STEPS.forEach(function (s, i) {
      t.push(setTimeout(function () {
        st.textContent = s;
        bar.style.width = Math.round(((i + 1) / (COPY.STEPS.length + 1)) * 100) + '%';
      }, Math.round(total * (i + 0.08) / (COPY.STEPS.length + 0.6))));
    });
    t.push(setTimeout(function () { bar.style.width = '100%'; }, total - 120));
    t.push(setTimeout(function () {
      t.forEach(clearTimeout);
      ov.remove();
      openLayer(rec, E);
    }, total));
  }

  /* ---------- the STAAR modal ---------- */
  var running = null;

  function openLayer(rec, E) {
    closeLayer();
    var host = el('<div class="j2 j2-scrim" id="j2Scrim" role="dialog" aria-modal="true" aria-label="' + esc(COPY.HEAD_T) + '"></div>');
    document.body.appendChild(host);
    host.addEventListener('click', function (e) { if (e.target === host) closeLayer(); });
    document.addEventListener('keydown', onEsc);
    paint(rec, E);
    runChecks(rec, E);
  }
  function onEsc(e) { if (e.key === 'Escape') closeLayer(); }
  function closeLayer() {
    if (running) { running.forEach(clearTimeout); running = null; }
    var h = document.getElementById('j2Scrim'); if (h) h.remove();
    document.removeEventListener('keydown', onEsc);
  }

  function chips(rec, E) {
    var I = rec.inputs[E] || {}, d = decisionOf(rec, E) || {}, pl = d.plannedLens || {};
    var v = function (k) { return I[k] ? I[k].v + ' ' + I[k].u : '—'; };
    var f = function (k, val, cls) {
      return '<span class="j2-f' + (cls ? ' ' + cls : '') + '"><em>' + esc(k) + '</em>' + esc(val) + '</span>';
    };
    var method = d.influencingMethod === 'OTHER' ? (d.otherMethodName || 'Other / custom')
      : ({ ICL_GURU: 'ICL Guru', ICL_FIT: 'ICLFIT', CASIA2: 'CASIA2' }[d.influencingMethod] || '—');
    var reason = ({ VAULT_BAND: 'Vault prediction', WTW_DISCREPANCY: 'WTW discrepancy',
      ANATOMY_ASOCT: 'AS-OCT anatomy', SURGEON_EXPERIENCE: 'Surgeon experience', OTHER: 'Other' })[d.reason && d.reason.code] || '—';
    return f('case', rec.caseId) + f('eye', E) +
      f('selected lens', (pl.size ? pl.size + ' mm' : '—'), 'lens') +
      f('power', (pl.power ? pl.power + ' D' : '—') + (pl.axis ? ' × ' + pl.axis + '°' : ''), 'lens') +
      f('acd', v('acd')) + f('wtw', v('ww')) +
      f('k1 / k2', (I.k1 ? I.k1.v : '—') + ' / ' + (I.k2 ? I.k2.v : '—') + ' D') +
      f('method', method) + f('reason', reason);
  }

  function paint(rec, E) {
    var host = document.getElementById('j2Scrim'); if (!host) return;
    host.innerHTML = '<div class="j2-modal">' +
      ribbon('j2-boundary') +
      '<div class="j2-head"><img src="' + LOGO + '" alt="STAAR Surgical">' +
        '<div class="t">' + esc(COPY.HEAD_T) + '</div>' +
        '<div class="s">' + esc(COPY.HEAD_S) + ' · ' + esc(rec.caseId) + ' · ' + esc(E) + '</div>' +
        '<div class="j2-nologo">' + esc(COPY.NOLOGO) + '</div></div>' +
      '<div class="j2-body">' +
        '<p class="j2-k">' + esc(COPY.K_IN) + '</p>' +
        '<div class="j2-fields">' + chips(rec, E) + '</div>' +
        '<p class="j2-k">' + esc(COPY.K_CTRL) + '</p>' +
        '<div class="j2-checks">' + CHECKS.map(function (c, i) {
          return '<div class="j2-chk" data-c="' + i + '"><span class="st">✓</span>' +
            '<span class="nm">' + esc(c.t) + '<span>' + esc(c.d) + '</span></span>' +
            '<span class="vr" data-v>pending</span></div>';
        }).join('') + '</div>' +
        '<div class="j2-out" id="j2Out"><span class="k">' + esc(COPY.OUT_K) + '</span>' +
          '<span class="v">' + esc(COPY.OUT_V) + '</span>' +
          '<span class="cid" id="j2Cid">correlation —</span></div>' +
        '<p class="j2-msg">' + esc(COPY.MSG) + '</p>' +
        '<div class="j2-blanks"><div class="bh">' + esc(COPY.BH) + '</div><div class="j2-brow">' +
          ['Built by', 'Validated under', 'Available from'].map(function (k) {
            return '<div class="j2-b"><div class="bk">' + esc(k) + '</div><div class="bv">—</div></div>';
          }).join('') +
        '</div><p class="bcap">' + esc(COPY.BCAP) + '</p></div>' +
      '</div>' +
      '<div class="j2-foot"><span class="j2-demo">' + esc(COPY.F1) + '</span><div class="j2-grow"></div>' +
        '<button type="button" class="j2-btn ghost" id="j2Cancel">' + esc(COPY.CANCEL) + '</button>' +
        '<button type="button" class="j2-btn go" id="j2Next" disabled>' + esc(COPY.GO) + ' →</button></div></div>';

    host.querySelector('#j2Cancel').addEventListener('click', closeLayer);
    host.querySelector('#j2Next').addEventListener('click', function () { toStella(rec, E); });
  }

  function runChecks(rec, E) {
    var host = document.getElementById('j2Scrim'); if (!host) return;
    var rows = Array.prototype.slice.call(host.querySelectorAll('.j2-chk'));
    var step = reduced() ? 110 : 560;
    var cid = corrId(rec, E);
    var vals = CHECKS.map(function (c, i) {
      if (i === 2) return 'key ' + rec.caseId.replace(/[^0-9]/g, '').slice(-4) + '-' + E + '-01';
      if (i === 3) return cid;
      return c.v;
    });
    running = [];
    rows.forEach(function (r, i) {
      running.push(setTimeout(function () { r.classList.add('run'); }, i * step));
      running.push(setTimeout(function () {
        r.classList.remove('run'); r.classList.add('on');
        r.querySelector('[data-v]').textContent = vals[i];
      }, i * step + step * 0.72));
    });
    running.push(setTimeout(function () {
      var out = host.querySelector('#j2Out'), c = host.querySelector('#j2Cid'), n = host.querySelector('#j2Next');
      if (out) out.classList.add('on');
      if (c) c.textContent = 'correlation ' + cid;
      if (n) { n.disabled = false; n.focus(); }
    }, rows.length * step));
  }

  /* ---------- hand off to STELLA's own challenge ----------
     This is the one place where a lens chosen outside STELLA reaches
     STELLA's ordering surface pre-loaded — which is exactly what
     Journey 1 forbids and what Journey 2 is about. It is reachable
     only from this concept modal, never from the Phase 1 path. */
  function toStella(rec, E) {
    var b = bridge(), d = decisionOf(rec, E);
    if (!b || !d) return closeLayer();
    var pl = d.plannedLens || {};
    closeLayer();
    b.openOrderModal(rec, {
      size: pl.size ? String(pl.size) : '',
      power: pl.power ? String(pl.power) : '',
      axis: pl.axis ? String(pl.axis) : '',
      ack: false, err: null,
      touched: { size: false, power: false, axis: false },
      j2: true, srcLabel: COPY.SRC, seedNote: COPY.SEED
    });
  }

  /* ---------- boot ---------- */
  function boot() { sync(); setInterval(sync, 800); window.addEventListener('focus', sync); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.J2 = { open: function () { var r = record(); if (r) cross(r, eyeOf(r)); },
                enabled: enabled, sync: sync };
})();
