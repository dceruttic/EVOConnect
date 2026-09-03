/* ================================================================
   SIZING ENGINE — input-driven size + vault for every method
   ----------------------------------------------------------------
   Each method below is a PUBLISHED-APPROACH APPROXIMATION built for
   the demo: the driver variables and the direction of each term follow
   the published description of the nomogram, the coefficients do not
   reproduce the proprietary model. Every result carries `basis` so the
   screen can show what drove it, and `approx: true` so the UI can say
   so out loud. Nothing here is validated for clinical use.

   STELLA / OCOS is the exception: it is the exact WTW band lookup
   STELLA itself uses (stella/index.html :: recommendLength), so the
   comparison runs the same formula on both sides of the handoff.
================================================================ */
(function () {
  'use strict';

  var SIZES = [12.1, 12.6, 13.2, 13.7];
  /* An ICL is never ordered shorter than the sulcus it has to sit in, so a
     target maps to the smallest manufactured length that covers it. */
  function snap(x) {
    for (var i = 0; i < SIZES.length; i++) if (SIZES[i] >= x - 0.001) return SIZES[i];
    return SIZES[SIZES.length - 1];
  }
  function num(v, def) { var n = parseFloat(v); return isFinite(n) ? n : def; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function r2(n) { return Math.round(n * 100) / 100; }

  /* STELLA / OCOS — WTW band lookup, identical to STELLA's own */
  function stellaSize(wtw) {
    if (!isFinite(wtw)) return 13.2;
    if (wtw < 11.30) return 12.1;
    if (wtw < 11.90) return 12.6;
    if (wtw < 12.50) return 13.2;
    return 13.7;
  }

  /* Fill in the anatomy a method needs but the case does not carry.
     Derived values are marked so the UI can show them as derived. */
  function normalise(raw) {
    var wtw = num(raw.wtw, 11.60);
    var acd = num(raw.acd, 3.10);
    var sts = num(raw.sts, NaN);
    var ata = num(raw.ata, NaN);
    var clr = num(raw.clr, NaN);
    var arise = num(raw.arise, NaN);
    var al = num(raw.al, NaN);
    var kmean = num(raw.kmean, NaN);
    var derived = {};
    if (!isFinite(sts)) { sts = wtw + 0.40; derived.sts = true; }      // UBM sulcus runs wider than WTW
    if (!isFinite(ata)) { ata = wtw - 0.30; derived.ata = true; }      // AS-OCT angle-to-angle runs narrower
    if (!isFinite(clr)) { clr = 170; derived.clr = true; }
    if (!isFinite(arise)) { arise = clr; derived.arise = true; }
    if (!isFinite(al)) { al = 24.0; derived.al = true; }
    return { wtw: wtw, acd: acd, sts: sts, ata: ata, clr: clr, arise: arise, al: al, kmean: kmean, derived: derived };
  }

  /* target = the ideal lens length for this eye, before snapping to a
     manufactured size. vault follows from how far the snapped size sits
     above that target, corrected by chamber depth and lens rise. */
  var METHODS = {
    STELLA:    function (i) { return { size: stellaSize(i.wtw), target: null,
                 basis: 'WTW ' + r2(i.wtw) + ' mm · STAAR band lookup', vault: null }; },
    STAAR_NOM: function (i) { var s = stellaSize(i.wtw);
                 if (i.acd >= 3.55 && s < 13.7) s = SIZES[SIZES.indexOf(s) + 1];
                 return { size: s, target: null, basis: 'WTW ' + r2(i.wtw) + ' + ACD ' + r2(i.acd) + ' lookup', vault: null }; },
    ICL_GURU:  function (i) { var t = i.sts + 0.65 - (i.clr - 170) / 1000;
                 return { target: t, basis: 'STS ' + r2(i.sts) + ' + 0.65 − CLR corr. (' + Math.round(i.clr) + ' µm)' }; },
    ICL_FIT:   function (i) { var t = i.ata + 1.45 + (i.acd - 3.10) * 0.35;
                 return { target: t, basis: 'ATA ' + r2(i.ata) + ' + 1.45 + ACD corr. (' + r2(i.acd) + ' mm)' }; },
    CASIA2:    function (i) { var t = i.ata + 1.40 + (i.arise - 170) / 900 + (i.acd - 3.10) * 0.30;
                 return { target: t, basis: 'ATA ' + r2(i.ata) + ' + aRISE ' + Math.round(i.arise) + ' µm + ACD corr.' }; },
    REINSTEIN: function (i) { var t = i.sts + 0.60 + (i.clr - 170) / 800;
                 return { target: t, basis: 'UBM STS ' + r2(i.sts) + ' + 0.60 + CLR ' + Math.round(i.clr) + ' µm' }; },
    LASSO:     function (i) { var t = 0.85 * i.wtw + 0.55 * i.acd + 0.02 * (i.al - 24) + 1.42;
                 return { target: t, basis: 'regression on WTW ' + r2(i.wtw) + ' · ACD ' + r2(i.acd) + ' · AL ' + r2(i.al) }; },
    KS:        function (i) { var t = i.ata + 1.35 + (i.arise - 150) / 700;
                 return { target: t, basis: 'ATA ' + r2(i.ata) + ' + aRISE ' + Math.round(i.arise) + ' µm' }; }
  };

  function vaultFor(size, target, i) {
    if (target == null) return null;
    var v = 250 + (size - target) * 800 + (i.acd - 3.10) * 180 - (i.clr - 170) * 0.8;
    return Math.round(clamp(v, 120, 1500));
  }
  function bandFor(v) {
    if (v == null) return 'na';
    return v < 200 ? 'low' : v < 250 ? 'borderline-low' : v <= 750 ? 'ideal' : v <= 900 ? 'high' : 'hyper';
  }

  function run(code, raw) {
    var fn = METHODS[code];
    if (!fn) return null;
    var i = normalise(raw || {});
    var out = fn(i);
    var size = out.size != null ? out.size : snap(out.target);
    var vault = out.vault !== undefined && out.vault === null && out.size != null
      ? null : vaultFor(size, out.target, i);
    return {
      code: code, recSize: size, vault: vault, band: bandFor(vault),
      target: out.target != null ? r2(out.target) : null,
      basis: out.basis, approx: code !== 'STELLA' && code !== 'STAAR_NOM',
      inputs: i, derived: i.derived
    };
  }

  /* Read the sizing inputs straight off the pre-op form. */
  function readInputs() {
    function g(id) { var e = document.getElementById(id); return e ? e.value : ''; }
    return { wtw: g('sf-wtw'), acd: g('sf-acd'), sts: g('sf-sts'), ata: g('sf-ata'),
             clr: g('sf-clr'), arise: g('sf-arise'), al: g('sf-al'), kmean: g('sf-kmean') };
  }

  window.SIZING_ENGINE = { run: run, readInputs: readInputs, snap: snap, SIZES: SIZES, stellaSize: stellaSize };
})();
