/* ================================================================
   ANALYTICS (clinic-wide dashboard with charts)
================================================================ */
// === ICL SURGERY PERFORMANCE — Δ Vault accuracy + Rotation stability ===
// Mock dataset based on real ICL post-op cohort distribution (Reinstein 2024 + STAAR registry).
// Both panels are stage-indexed so the surgeon can switch between 1D/1M/3M/6M/12M/Y3.
const ICL_PERF = {
  vault: {
    '1D':  { n: 288, mae: 106.37, std: 80.84, bands: [56.3, 32.3, 8.0, 3.1, 0.3] },
    '1M':  { n: 261, mae:  88.42, std: 64.10, bands: [62.1, 28.5, 6.4, 2.6, 0.4] },
    '3M':  { n: 224, mae:  72.55, std: 51.20, bands: [69.6, 24.1, 4.8, 1.3, 0.2] },
    '6M':  { n: 188, mae:  68.10, std: 49.05, bands: [71.8, 22.4, 4.2, 1.4, 0.2] },
    '12M': { n: 152, mae:  64.92, std: 47.80, bands: [73.0, 21.7, 3.8, 1.4, 0.1] },
    'Y3':  { n:  84, mae:  61.50, std: 45.20, bands: [75.0, 20.2, 3.4, 1.3, 0.1] },
  },
  rotation: {
    n: 64, highStability: 93.8, midStability: 6.3,
    rotated: 0,
    note: 'No clinically significant rotation (>5°) was observed in any toric case after ICLguru PRO sizing.',
  },
  // Per-timepoint rotation cohort (toric cases that reached each follow-up checkpoint).
  // High stability % climbs as the lens fully settles in the sulcus over time.
  rotationByTimepoint: {
    '1D':  { n: 64, high: 87.5, mid: 12.5 },
    '1M':  { n: 64, high: 90.6, mid:  9.4 },
    '3M':  { n: 62, high: 93.5, mid:  6.5 },
    '6M':  { n: 58, high: 94.8, mid:  5.2 },
    '12M': { n: 52, high: 96.2, mid:  3.8 },
    'Y3':  { n: 28, high: 96.4, mid:  3.6 },
  },
};
window.ICL_PERF_TP = window.ICL_PERF_TP || '1D';
function setIclPerfTp(tp){ window.ICL_PERF_TP = tp; _refreshAnalytics(); }
function _refreshAnalytics(){
  if (CURRENT_MOD === 'analytics') {
    var main = document.getElementById('usMain');
    if (main) main.innerHTML = renderAnalytics();
  }
}

function renderIclPerfSection(){
  var tp = window.ICL_PERF_TP;
  var v = ICL_PERF.vault[tp] || ICL_PERF.vault['1D'];
  var r = ICL_PERF.rotation;
  var BAND_LABELS = ['<100 µm', '100–200 µm', '200–300 µm', '300–400 µm', '400–500 µm'];
  var BAND_COLORS = ['#03B496', '#F6BF2C', '#3371C3', '#E78A8D', '#D12C4A'];
  var TIMEPOINTS = ['1D','1M','3M','6M','12M','Y3'];
  var TIMEPOINT_LABEL = { '1D':'1 Day','1M':'1 Month','3M':'3 Months','6M':'6 Months','12M':'12 Months','Y3':'Year 3' };

  // ===== Donut SVG generator (returns the SVG string) =====
  function donutSvg(slices, totalLabel, totalValue, opts){
    opts = opts || {};
    var size = opts.size || 280;
    var thickness = opts.thickness || 46;
    var cx = size/2, cy = size/2, r = (size - thickness) / 2 - 2;
    var circ = 2 * Math.PI * r;
    var rotation = -90; // start at top
    var html = ['<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" class="ipa-donut">'];
    // Background ring
    html.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#F4F6FA" stroke-width="' + thickness + '"/>');
    var acc = 0;
    slices.forEach(function(s){
      var pct = s.value / 100;
      if (pct <= 0) return;
      var dash = pct * circ;
      var gap = circ - dash;
      var offset = -acc * circ;
      html.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="' + thickness +
        '" stroke-dasharray="' + dash.toFixed(2) + ' ' + gap.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) +
        '" transform="rotate(' + rotation + ' ' + cx + ' ' + cy + ')"/>');
      acc += pct;
    });
    // Center text
    html.push('<text x="' + cx + '" y="' + (cy - 6) + '" text-anchor="middle" font-family="Inter" font-size="32" font-weight="900" fill="#001E60" letter-spacing="-0.02em">' + totalValue + '</text>');
    html.push('<text x="' + cx + '" y="' + (cy + 18) + '" text-anchor="middle" font-family="Inter" font-size="11" font-weight="800" fill="#5A6478" letter-spacing="0.14em">' + totalLabel + '</text>');
    html.push('</svg>');
    return html.join('');
  }

  // === Timepoint switcher pills ===
  var tpPills = TIMEPOINTS.map(function(t){
    return '<button type="button" class="ipa-tp-pill' + (t === tp ? ' active' : '') + '" onclick="setIclPerfTp(\'' + t + '\')">' + t + '</button>';
  }).join('');

  // === Δ Vault donut + legend ===
  var vaultSlices = v.bands.map(function(pct, i){ return { value: pct, color: BAND_COLORS[i], label: BAND_LABELS[i] }; });
  var vaultDonut = donutSvg(vaultSlices, 'TOTAL CASES', v.n, { size: 280, thickness: 44 });
  var vaultLegend = vaultSlices.map(function(s){
    return '<div class="ipa-legend-row">' +
      '<span class="ipa-legend-dot" style="background:' + s.color + '"></span>' +
      '<span class="ipa-legend-lbl">' + s.label + '</span>' +
      '<span class="ipa-legend-pct">' + s.value.toFixed(1) + '%</span>' +
    '</div>';
  }).join('');

  // === Rotation donut ===
  var rotSlices = [
    { value: r.highStability, color: '#5C18AB', label: 'High stability' },
    { value: r.midStability, color: '#08B1C2', label: 'Mid stability' },
  ];
  var rotDonut = donutSvg(rotSlices, 'TORIC CASES', r.n, { size: 240, thickness: 40 });

  return [
    '<div class="ipa-section">',
      '<div class="ipa-section-head">',
        '<div>',
          '<h3>ICL surgery performance · key indicators</h3>',
          '<p class="muted">Vault prediction accuracy &amp; toric rotation stability · single-clinic cohort.</p>',
        '</div>',
        '<div class="ipa-tp-switcher">',
          '<span class="ipa-tp-lbl">Δ Vault timepoint:</span>',
          '<div class="ipa-tp-group">' + tpPills + '</div>',
        '</div>',
      '</div>',

      // === ROW 1: Δ VAULT  +  vault evolution chart (side by side) ===
      '<div class="ipa-pair-row">',
        '<div class="ipa-card ipa-vault-card">',
          '<div class="ipa-card-head">',
            '<div>',
              '<div class="ipa-eyebrow">Δ VAULT · ' + TIMEPOINT_LABEL[tp] + ' postop</div>',
              '<h4>Predicted vs. actual vault — error distribution</h4>',
            '</div>',
            '<span class="ipa-cohort-pill">' + v.n + ' eyes</span>',
          '</div>',
          '<div class="ipa-vault-grid">',
            // KPI column
            '<div class="ipa-kpi-col">',
              '<div class="ipa-kpi"><div class="ipa-kpi-num">' + v.n + '</div><div class="ipa-kpi-lbl">N eyes ' + tp + '</div></div>',
              '<div class="ipa-kpi"><div class="ipa-kpi-num">' + v.mae.toFixed(2) + '<em>µm</em></div><div class="ipa-kpi-lbl">Mean Abs Error ' + tp + '</div></div>',
              '<div class="ipa-kpi"><div class="ipa-kpi-num">' + v.std.toFixed(2) + '<em>µm</em></div><div class="ipa-kpi-lbl">Std Error ' + tp + '</div></div>',
            '</div>',
            // Legend column
            '<div class="ipa-legend-col">',
              '<div class="ipa-legend-head">Range Error ' + tp + '</div>',
              vaultLegend,
              '<div class="ipa-legend-foot"><b>' + (v.bands[0] + v.bands[1]).toFixed(1) + '%</b> within ±200 µm of prediction</div>',
            '</div>',
            // Donut column
            '<div class="ipa-donut-col">' + vaultDonut + '</div>',
          '</div>',
        '</div>',
        '<div class="ipa-card ipa-evo-card">',
          '<div class="ipa-card-head">',
            '<div>',
              '<div class="ipa-eyebrow">Evolution over time</div>',
              '<h4>Vault prediction error — MAE &amp; Std</h4>',
            '</div>',
            '<div class="ipa-evo-legend">',
              '<span class="ipa-evo-pill" style="--c:#0080C7"><span class="ipa-evo-dot"></span> Mean Abs Error</span>',
              '<span class="ipa-evo-pill" style="--c:#5C18AB"><span class="ipa-evo-dot"></span> Std Error</span>',
            '</div>',
          '</div>',
          renderVaultEvolutionChart(),
          '<div class="ipa-evo-foot">Error decreases as the lens settles into the sulcus and the vault stabilizes.</div>',
        '</div>',
      '</div>',

      // === ROW 2: ROTATION STABILITY  +  rotation evolution chart (side by side) ===
      '<div class="ipa-pair-row">',
        '<div class="ipa-card ipa-rotation-card">',
          '<div class="ipa-card-head">',
            '<div>',
              '<div class="ipa-eyebrow">After ICLguru PRO</div>',
              '<h4>Toric ICL rotation stability — 12-month follow-up</h4>',
            '</div>',
            '<span class="ipa-cohort-pill">' + r.n + ' toric cases</span>',
          '</div>',
          '<div class="ipa-rotation-grid">',
            '<div class="ipa-donut-col">' + rotDonut + '</div>',
            '<div class="ipa-rot-meta">',
              '<div class="ipa-rot-legend">',
                '<div class="ipa-legend-row big"><span class="ipa-legend-dot" style="background:#5C18AB"></span><span class="ipa-legend-lbl">High stability</span><span class="ipa-legend-pct">' + r.highStability.toFixed(1) + '%</span></div>',
                '<div class="ipa-legend-row big"><span class="ipa-legend-dot" style="background:#08B1C2"></span><span class="ipa-legend-lbl">Mid stability</span><span class="ipa-legend-pct">' + r.midStability.toFixed(1) + '%</span></div>',
              '</div>',
              '<div class="ipa-rot-callout">',
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#117A57;flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>',
                '<div><b>' + r.rotated + ' clinically significant rotations</b><div class="ipa-rot-callout-sub">' + r.note + '</div></div>',
              '</div>',
            '</div>',
          '</div>',
        '</div>',
        '<div class="ipa-card ipa-evo-card">',
          '<div class="ipa-card-head">',
            '<div>',
              '<div class="ipa-eyebrow">Evolution over time</div>',
              '<h4>Toric rotation stability — % High vs Mid</h4>',
            '</div>',
            '<div class="ipa-evo-legend">',
              '<span class="ipa-evo-pill" style="--c:#5C18AB"><span class="ipa-evo-dot"></span> High</span>',
              '<span class="ipa-evo-pill" style="--c:#08B1C2"><span class="ipa-evo-dot"></span> Mid</span>',
            '</div>',
          '</div>',
          renderRotationEvolutionChart(),
          '<div class="ipa-evo-foot">High stability climbs from 87.5% (D1) to 96.4% (Y3) as the haptics integrate.</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
}
