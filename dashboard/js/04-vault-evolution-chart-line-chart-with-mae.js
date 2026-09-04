// === Δ Vault evolution chart — line chart with MAE + Std across all timepoints ===
function renderVaultEvolutionChart(){
  var TPS = ['1D','1M','3M','6M','12M','Y3'];
  var W = 540, H = 240, PL = 44, PR = 24, PT = 22, PB = 36;
  var maxErr = 130;  // y-axis ceiling (µm)
  function px(i){ return PL + (i * (W - PL - PR) / (TPS.length - 1)); }
  function py(val){ return H - PB - (val / maxErr) * (H - PT - PB); }
  // Y-axis grid + labels
  var grid = [0, 30, 60, 90, 120].map(function(val){
    var y = py(val);
    return '<line x1="' + PL + '" y1="' + y + '" x2="' + (W - PR) + '" y2="' + y + '" stroke="rgba(15,29,64,0.08)"/>' +
           '<text x="' + (PL - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-family="Inter" font-size="10" font-weight="700" fill="#63708A">' + val + '</text>';
  }).join('');
  // X-axis labels
  var xLabels = TPS.map(function(t, i){
    return '<text x="' + px(i) + '" y="' + (H - 12) + '" text-anchor="middle" font-family="Inter" font-size="11" font-weight="800" fill="#001E60">' + t + '</text>';
  }).join('');
  // MAE line + dots
  var maeVals = TPS.map(function(t){ return ICL_PERF.vault[t].mae; });
  var stdVals = TPS.map(function(t){ return ICL_PERF.vault[t].std; });
  function lineSvg(vals, color, dashed){
    var path = vals.map(function(v, i){ return (i===0?'M':'L') + ' ' + px(i) + ' ' + py(v); }).join(' ');
    var dotsHtml = vals.map(function(v, i){
      return '<g><circle cx="' + px(i) + '" cy="' + py(v) + '" r="6" fill="#fff" stroke="' + color + '" stroke-width="2.6"/>' +
        '<text x="' + px(i) + '" y="' + (py(v) - 12) + '" text-anchor="middle" font-family="Inter" font-size="10" font-weight="800" fill="' + color + '">' + v.toFixed(0) + '</text></g>';
    }).join('');
    return '<path d="' + path + '" stroke="' + color + '" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"' +
      (dashed ? ' stroke-dasharray="6 5"' : '') + '/>' + dotsHtml;
  }
  // Optional gradient area under MAE
  var areaPath = maeVals.map(function(v, i){ return (i===0?'M':'L') + ' ' + px(i) + ' ' + py(v); }).join(' ') +
                 ' L ' + px(TPS.length - 1) + ' ' + (H - PB) + ' L ' + px(0) + ' ' + (H - PB) + ' Z';
  return '<svg class="ipa-evo-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="vaultEvoGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0071B0" stop-opacity="0.22"/><stop offset="1" stop-color="#0071B0" stop-opacity="0"/></linearGradient></defs>' +
    grid +
    '<path d="' + areaPath + '" fill="url(#vaultEvoGrad)"/>' +
    lineSvg(stdVals, '#5C18AB', true) +
    lineSvg(maeVals, '#0071B0', false) +
    xLabels +
    '<text x="' + (PL - 32) + '" y="' + (PT + 10) + '" font-family="Inter" font-size="9" font-weight="800" fill="#63708A" letter-spacing=".06em">µm</text>' +
  '</svg>';
}

// === Rotation evolution chart — stacked area / dual-line for High vs Mid stability % ===
function renderRotationEvolutionChart(){
  var TPS = ['1D','1M','3M','6M','12M','Y3'];
  var W = 540, H = 240, PL = 40, PR = 24, PT = 22, PB = 36;
  function px(i){ return PL + (i * (W - PL - PR) / (TPS.length - 1)); }
  function py(pct){ return H - PB - (pct / 100) * (H - PT - PB); }
  // Y-axis grid + labels (0, 25, 50, 75, 100%)
  var grid = [0, 25, 50, 75, 100].map(function(val){
    var y = py(val);
    return '<line x1="' + PL + '" y1="' + y + '" x2="' + (W - PR) + '" y2="' + y + '" stroke="rgba(15,29,64,0.08)"/>' +
           '<text x="' + (PL - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-family="Inter" font-size="10" font-weight="700" fill="#63708A">' + val + '</text>';
  }).join('');
  var xLabels = TPS.map(function(t, i){
    return '<text x="' + px(i) + '" y="' + (H - 12) + '" text-anchor="middle" font-family="Inter" font-size="11" font-weight="800" fill="#001E60">' + t + '</text>';
  }).join('');
  // Series
  var highVals = TPS.map(function(t){ return ICL_PERF.rotationByTimepoint[t].high; });
  var midVals  = TPS.map(function(t){ return ICL_PERF.rotationByTimepoint[t].mid; });
  // High stability area (purple)
  var highArea = highVals.map(function(v, i){ return (i===0?'M':'L') + ' ' + px(i) + ' ' + py(v); }).join(' ') +
                 ' L ' + px(TPS.length - 1) + ' ' + (H - PB) + ' L ' + px(0) + ' ' + (H - PB) + ' Z';
  function lineSvg(vals, color){
    var path = vals.map(function(v, i){ return (i===0?'M':'L') + ' ' + px(i) + ' ' + py(v); }).join(' ');
    var dotsHtml = vals.map(function(v, i){
      var labelY = i % 2 === 0 ? py(v) - 12 : py(v) + 18;
      return '<g><circle cx="' + px(i) + '" cy="' + py(v) + '" r="6" fill="#fff" stroke="' + color + '" stroke-width="2.6"/>' +
        '<text x="' + px(i) + '" y="' + labelY + '" text-anchor="middle" font-family="Inter" font-size="10" font-weight="800" fill="' + color + '">' + v.toFixed(1) + '</text></g>';
    }).join('');
    return '<path d="' + path + '" stroke="' + color + '" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' + dotsHtml;
  }
  return '<svg class="ipa-evo-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="rotEvoGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5C18AB" stop-opacity="0.22"/><stop offset="1" stop-color="#5C18AB" stop-opacity="0"/></linearGradient></defs>' +
    grid +
    '<path d="' + highArea + '" fill="url(#rotEvoGrad)"/>' +
    lineSvg(midVals, '#08B1C2') +
    lineSvg(highVals, '#5C18AB') +
    xLabels +
    '<text x="' + (PL - 28) + '" y="' + (PT + 10) + '" font-family="Inter" font-size="9" font-weight="800" fill="#63708A">%</text>' +
  '</svg>';
}

function renderAnalytics() {
  const A = DATA.analytics;

  // --- line chart: case volume (12 months)
  const W = 900, H = 320, P_L = 50, P_R = 24, P_T = 24, P_B = 38;
  const maxVol = Math.max(...A.caseVolume);
  const xs = A.months.map((_, i) => P_L + (i * (W - P_L - P_R) / (A.months.length - 1)));
  const ys = A.caseVolume.map(v => H - P_B - (v / maxVol) * (H - P_T - P_B));
  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xs[xs.length - 1].toFixed(1)} ${H - P_B} L ${xs[0].toFixed(1)} ${H - P_B} Z`;
  const dots = xs.map((x, i) => `<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="6" fill="#fff" stroke="#2472D3" stroke-width="3"/>`).join("");
  const xLabels = A.months.map((m, i) => `<text x="${xs[i].toFixed(1)}" y="${H - 12}" text-anchor="middle" font-family="Inter, sans-serif" font-size="13" font-weight="700" fill="#0F1D40">${m}</text>`).join("");
  const gridY = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const y = P_T + t * (H - P_T - P_B);
    const val = Math.round(maxVol * (1 - t));
    return `<line x1="${P_L}" y1="${y.toFixed(1)}" x2="${W - P_R}" y2="${y.toFixed(1)}" stroke="rgba(15,29,64,0.08)" stroke-width="1"/><text x="${P_L - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#6C6278">${val}</text>`;
  }).join("");

  // --- PROMs data structure: by lens size × question × timepoint (M1/M3/M6/M12)
  // Scores 1-10 (higher = better). A5/A6 converted to 1-10 for uniform scale.
  // Clinical pattern: larger lens sizes can correlate with slightly better distance/night-driving but lower near freedom
  const PROMS_QCODES = ["A1","A2","A3","A4","A5","A6","A7","A8","A9"];
  const PROMS_QSHORT = {
    A1: "Satisfaction", A2: "Near freedom", A3: "Mid freedom", A4: "Distance freedom",
    A5: "No medical glasses", A6: "Match expectations", A7: "Night clarity",
    A8: "Daytime driving", A9: "Nighttime driving",
  };
  const PROMS_QTEXT = {
    A1: "Rate your satisfaction with the outcome of the surgery.",
    A2: "How often would you wear glasses for near-distance activities? (reading, mobile)",
    A3: "How often would you wear glasses for mid-distance activities? (cooking, PC)",
    A4: "How often would you wear glasses for distance activities? (driving, TV)",
    A5: "Do you still wear glasses for medical reasons? (e.g. residual astigmatism)",
    A6: "Do you now have the visual outcomes that you discussed and agreed with your surgeon?",
    A7: "Do you experience vision disturbances in the evening/night?",
    A8: "Do you experience vision disturbances driving during daytime?",
    A9: "Do you experience vision disturbances driving during nighttime?",
  };
  // PROMS_BY_LENS[size][qCode] = [M1, M3, M6, M12] · 1..10 scale
  const PROMS_BY_LENS = {
    "12.1": { // short lens — tends to have lower vault, good near, slight halos in large pupils
      A1: [8.1, 8.8, 9.1, 9.3], A2: [6.3, 6.8, 7.0, 7.2], A3: [7.4, 7.9, 8.2, 8.4],
      A4: [8.7, 9.1, 9.3, 9.4], A5: [9.2, 9.3, 9.3, 9.4], A6: [8.6, 9.0, 9.2, 9.3],
      A7: [5.6, 7.2, 8.0, 8.3], A8: [8.8, 9.1, 9.2, 9.3], A9: [5.4, 7.1, 7.9, 8.2],
    },
    "12.6": { // workhorse — best all-around profile
      A1: [8.3, 9.0, 9.3, 9.5], A2: [5.8, 6.2, 6.4, 6.6], A3: [7.2, 7.8, 8.1, 8.3],
      A4: [9.1, 9.5, 9.6, 9.7], A5: [9.0, 9.1, 9.2, 9.2], A6: [8.9, 9.2, 9.3, 9.4],
      A7: [5.4, 7.1, 8.1, 8.5], A8: [9.0, 9.3, 9.3, 9.4], A9: [5.3, 7.1, 8.0, 8.4],
    },
    "13.2": { // longer — more distance freedom but lower near
      A1: [8.2, 8.9, 9.2, 9.4], A2: [4.9, 5.4, 5.6, 5.8], A3: [6.8, 7.4, 7.7, 8.0],
      A4: [9.3, 9.6, 9.7, 9.7], A5: [8.8, 9.0, 9.1, 9.1], A6: [8.8, 9.1, 9.3, 9.3],
      A7: [5.1, 6.9, 7.9, 8.3], A8: [9.1, 9.3, 9.4, 9.5], A9: [5.0, 7.0, 7.9, 8.3],
    },
    "13.7": { // longest — highest vault, most night halos initially, strong distance
      A1: [7.9, 8.7, 9.0, 9.2], A2: [4.4, 4.9, 5.1, 5.3], A3: [6.4, 7.0, 7.4, 7.7],
      A4: [9.3, 9.6, 9.7, 9.8], A5: [8.6, 8.8, 8.9, 9.0], A6: [8.6, 9.0, 9.2, 9.2],
      A7: [4.6, 6.5, 7.6, 8.1], A8: [9.0, 9.2, 9.4, 9.4], A9: [4.5, 6.6, 7.7, 8.1],
    },
  };
  const LENS_COLORS = { "12.1": "#22d3ee", "12.6": "#4a9eff", "13.2": "#7F21E0", "13.7": "#E78A27" };
  const LENS_SHORT  = { "12.1": "Short · WTW 10.5–11.0", "12.6": "Mid · WTW 11.0–11.5", "13.2": "Long · WTW 11.5–12.0", "13.7": "X-long · WTW >12.0" };

  // --- RADAR CHART ---
  const RW = 420, RH = 420, RCX = 210, RCY = 210, RRAD = 150;
  const nAxes = PROMS_QCODES.length;
  const axisAngle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / nAxes;
  const polarXY = (i, val) => {
    const r = (val / 10) * RRAD;
    return { x: RCX + r * Math.cos(axisAngle(i)), y: RCY + r * Math.sin(axisAngle(i)) };
  };
  // Concentric rings at 2, 4, 6, 8, 10
  const radarRings = [2, 4, 6, 8, 10].map(v => {
    const pts = PROMS_QCODES.map((_, i) => {
      const p = polarXY(i, v);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="rgba(15,29,64,0.1)" stroke-width="${v === 10 ? 1.2 : 0.8}"/>`;
  }).join("");
  // Ring labels (1, 5, 10) along the top axis for clarity
  const ringLabels = `
    <text x="${RCX + 4}" y="${RCY - 2}" font-family="Inter" font-size="10" fill="#6C6278" font-weight="600">1</text>
    <text x="${RCX + 4}" y="${RCY - RRAD * 0.5 - 2}" font-family="Inter" font-size="10" fill="#6C6278" font-weight="600">5</text>
    <text x="${RCX + 4}" y="${RCY - RRAD - 4}" font-family="Inter" font-size="10" fill="#6C6278" font-weight="700">10</text>
  `;
  // Axis lines + labels
  const radarAxes = PROMS_QCODES.map((code, i) => {
    const p = polarXY(i, 10);
    const lbl = polarXY(i, 11.4);
    return `
      <line x1="${RCX}" y1="${RCY}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(15,29,64,0.12)" stroke-width="1"/>
      <text x="${lbl.x.toFixed(1)}" y="${lbl.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-size="11" font-weight="700" fill="#0F1D40">${code}</text>
      <text x="${lbl.x.toFixed(1)}" y="${(lbl.y + 12).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-size="9" fill="#6C6278">${PROMS_QSHORT[code]}</text>
    `;
  }).join("");
  // One polygon per lens size (M12 values)
  const radarPolygons = Object.entries(PROMS_BY_LENS).map(([size, qvals]) => {
    const pts = PROMS_QCODES.map((q, i) => {
      const v = qvals[q][3]; // M12
      const p = polarXY(i, v);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");
    const dots = PROMS_QCODES.map((q, i) => {
      const v = qvals[q][3];
      const p = polarXY(i, v);
      return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${LENS_COLORS[size]}"/>`;
    }).join("");
    return `
      <g>
        <polygon points="${pts}" fill="${LENS_COLORS[size]}" fill-opacity="0.12" stroke="${LENS_COLORS[size]}" stroke-width="2.2" stroke-linejoin="round"/>
        ${dots}
      </g>`;
  }).join("");
  const radarLegend = Object.entries(PROMS_BY_LENS).map(([size, qvals]) => `
    <div class="proms-lens-legend-item">
      <span class="pll-dot" style="background:${LENS_COLORS[size]}"></span>
      <div class="pll-body">
        <div class="pll-nm">${size} mm</div>
        <div class="pll-meta">${LENS_SHORT[size]}</div>
      </div>
    </div>
  `).join("");

  // --- QUESTION EVOLUTION ---
  // Default: A1 selected. Renders 4 lines (one per lens) across M1/M3/M6/M12.
  const EW = 520, EH = 310, EP_L = 44, EP_R = 24, EP_T = 22, EP_B = 40;
  const evTimeline = ["M1","M3","M6","M12"];
  const evPx = (i) => EP_L + (i * (EW - EP_L - EP_R) / (evTimeline.length - 1));
  const evPy = (v) => EH - EP_B - ((v - 3) / 7) * (EH - EP_T - EP_B); // scale 3..10 to preserve y range
  const evGrid = [3,4,5,6,7,8,9,10].map(val => {
    const y = evPy(val);
    return `<line x1="${EP_L}" y1="${y}" x2="${EW - EP_R}" y2="${y}" stroke="rgba(15,29,64,0.08)"/><text x="${EP_L - 8}" y="${y + 4}" text-anchor="end" font-family="Inter" font-size="10" font-weight="600" fill="#6C6278">${val}</text>`;
  }).join("");
  const evXLabels = evTimeline.map((m, i) => `<text x="${evPx(i)}" y="${EH - 14}" text-anchor="middle" font-family="Inter" font-size="13" font-weight="700" fill="#0F1D40">${m}</text>`).join("");

  function evolutionSvgFor(qCode) {
    const series = Object.entries(PROMS_BY_LENS).map(([size, qvals]) => {
      const vals = qvals[qCode];
      const path = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${evPx(i)} ${evPy(v)}`).join(" ");
      const dots = vals.map((v, i) => `
        <g>
          <circle cx="${evPx(i)}" cy="${evPy(v)}" r="5" fill="#fff" stroke="${LENS_COLORS[size]}" stroke-width="2.4"/>
          ${i === vals.length - 1 ? `<text x="${evPx(i) + 8}" y="${evPy(v) + 4}" font-family="Inter" font-size="11" font-weight="800" fill="${LENS_COLORS[size]}">${v.toFixed(1)}</text>` : ''}
        </g>`).join("");
      return `<path d="${path}" stroke="${LENS_COLORS[size]}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
    }).join("");
    return `
      <svg class="proms-ev-svg" viewBox="0 0 ${EW} ${EH}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        ${evGrid}
        ${series}
        ${evXLabels}
        <line x1="${EP_L}" y1="${EP_T}" x2="${EP_L}" y2="${EH - EP_B}" stroke="#0F1D40" stroke-width="1.5" opacity="0.5"/>
        <line x1="${EP_L}" y1="${EH - EP_B}" x2="${EW - EP_R}" y2="${EH - EP_B}" stroke="#0F1D40" stroke-width="1.5" opacity="0.5"/>
      </svg>
    `;
  }

  // Survey instrument — 9 questions with current clinic aggregate M12 score
  const surveyItems = [
    { code: "A1", q: "Rate your satisfaction with the outcome of the surgery.",                                   scale: "0–10 (higher = better)", score: 9.4, trend: "up" },
    { code: "A2", q: "How often would you wear glasses for near-distance activities? (reading, mobile)",           scale: "0–10 (higher = less often)", score: 6.5, trend: "up" },
    { code: "A3", q: "How often would you wear glasses for mid-distance activities? (cooking, PC)",               scale: "0–10 (higher = less often)", score: 8.3, trend: "up" },
    { code: "A4", q: "How often would you wear glasses for distance activities? (driving, TV)",                   scale: "0–10 (higher = less often)", score: 9.6, trend: "up" },
    { code: "A5", q: "Do you still wear glasses for medical reasons? (e.g. residual astigmatism)",                scale: "Yes / No",                score: "8% Yes", trend: "flat" },
    { code: "A6", q: "Do you now have the visual outcomes that you discussed and agreed with your surgeon?",      scale: "Yes / Partially / No",    score: "92% Yes", trend: "up" },
    { code: "A7", q: "Do you experience vision disturbances in the evening/night?",                               scale: "0–10 (higher = no disturb)", score: 8.4, trend: "up" },
    { code: "A8", q: "Do you experience vision disturbances driving during daytime?",                             scale: "0–10 (higher = no disturb)", score: 9.2, trend: "up" },
    { code: "A9", q: "Do you experience vision disturbances driving during nighttime?",                           scale: "0–10 (higher = no disturb)", score: 8.0, trend: "up" },
  ];
  const surveyHtml = surveyItems.map(it => `
    <div class="proms-q-item">
      <div class="proms-q-code">${it.code}</div>
      <div class="proms-q-body">
        <div class="proms-q-txt">${it.q}</div>
        <div class="proms-q-scale">${it.scale}</div>
      </div>
      <div class="proms-q-score">${typeof it.score === 'number' ? it.score.toFixed(1) : it.score}</div>
    </div>
  `).join("");

  // --- Unsatisfied patients (PROMs < 7.0 overall or low dimension scores)
  const unsatisfied = [
    { id: "2126-0389", name: "M. Rojas",     age: 42, phase: "M3",  overall: 6.2, reason: "Halos persistent at 3 months · mesopic pupil 6.8mm", reco: "Schedule AS-OCT + night-vision retest; consider lens rotation check." },
    { id: "2126-0401", name: "F. Silva",     age: 35, phase: "M1",  overall: 6.8, reason: "Dry-eye score 5.4 · foreign-body sensation OS",        reco: "Escalate to dry-eye protocol (punctal plugs, cyclosporine)." },
    { id: "2126-0395", name: "E. Morales",   age: 38, phase: "M6",  overall: 6.5, reason: "UCVA 20/25 OD · patient expecting 20/20",                reco: "Refraction + discuss enhancement options (LASIK touch-up)." },
    { id: "2126-0408", name: "B. Quiroga",   age: 44, phase: "M1",  overall: 6.9, reason: "Vault 880 µm · slight eye irritation",                   reco: "Flag vault → monitor IOP weekly; possible lens exchange if >900." },
  ];

  // --- Missed / overdue post-op visits
  const missedVisits = [
    { id: "2126-0393", name: "J. Mendoza",   surgeryDate: "Feb 12, 2026",  expected: "Week 1 check",       overdue: "8 days",  last: "Day 1 done",            severity: "critical" },
    { id: "2126-0386", name: "V. Aguilar",   surgeryDate: "Jan 18, 2026",  expected: "Month 3 review",     overdue: "5 days",  last: "Month 1 done",          severity: "warn" },
    { id: "2126-0378", name: "N. Delgado",   surgeryDate: "Oct 25, 2025",  expected: "Month 6 review",     overdue: "12 days", last: "Month 3 done",          severity: "critical" },
    { id: "2126-0361", name: "H. Vargas",    surgeryDate: "Apr 20, 2025",  expected: "Year 1 · ECC scan",  overdue: "3 days",  last: "Month 6 done",          severity: "warn" },
    { id: "2126-0372", name: "I. Cabrera",   surgeryDate: "Nov 08, 2025",  expected: "Month 3 review",     overdue: "11 days", last: "Month 1 done",          severity: "critical" },
  ];

  // --- donut: outcomes
  const O = A.outcomes;
  const segments = [
    { v: O.onTarget,      c: "var(--green)"   },
    { v: O.slightlyHigh,  c: "var(--teal)"    },
    { v: O.slightlyLow,   c: "var(--gold)"    },
    { v: O.reintervention,c: "var(--warn)"    },
  ];
  const r = 52, cir = 2 * Math.PI * r;
  let acc = 0;
  const donutStrokes = segments.map(s => {
    const len = (s.v / 100) * cir;
    const el = `<circle cx="90" cy="90" r="${r}" class="donut-fg" stroke="${s.c}" stroke-dasharray="${len} ${cir - len}" stroke-dashoffset="-${acc}" />`;
    acc += len;
    return el;
  }).join("");

  // surgeons table
  const surgRows = A.surgeons.map(s => `
    <tr>
      <td><b>${s.name}</b></td>
      <td class="subtle">${s.cases}</td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:60px; height:6px; background:var(--sand); border-radius:100px; overflow:hidden">
            <div style="width:${s.vault}%; height:100%; background: linear-gradient(90deg, var(--teal), var(--gold)); border-radius:100px;"></div>
          </div>
          <span style="font-weight:700;">${s.vault}%</span>
        </div>
      </td>
      <td><span class="status ${s.nps > 80 ? 'ok' : s.nps > 75 ? 'wait' : 'warn'}"><span class="sdot"></span>${s.nps}</span></td>
    </tr>
  `).join("");

  // funnel
  const funnelLetters = ["a","b","c","d","e"];
  const funnelHtml = A.funnel.map((f, i) => `
    <div>
      <div class="funnel-row ${funnelLetters[i]}" style="width:${Math.max(f.pct, 30)}%">
        <span>${f.label}</span>
        <span class="count">${f.count}</span>
      </div>
      <div class="funnel-conv">${f.pct}% of consults ${i > 0 ? `· ${Math.round(f.count / A.funnel[i-1].count * 100)}% from prior` : ''}</div>
    </div>
  `).join("");

  // activity heatmap (7 days x 12 weeks)
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const heatHtml = A.activity.map((row, di) => `
    <div style="display:flex; gap:3px; align-items:center;">
      <span style="width:28px; font-size:11px; color:var(--mute); font-weight:600;">${days[di]}</span>
      <div style="display:grid; grid-template-columns:repeat(12, 1fr); gap:3px; flex:1;">
        ${row.map(v => `<div class="heat-cell" data-v="${v}" title="${v} cases"></div>`).join("")}
      </div>
    </div>
  `).join("");

  return `
    ${moduleHead("05 · CLINIC ANALYTICS", "Your clinic, measured every way.", "Volume, outcomes, PROMs evolution, patient satisfaction and post-op adherence — every metric real-time, owned by you.")}

    <div class="mod-grid cols-3">
      <div class="card kpi">
        <span class="kpi-label">Total ICL cases · YTD</span>
        <span class="kpi-value">632 <span class="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>+24%</span></span>
        <span class="muted small">vs. same period 2025</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">PROMs overall · M12</span>
        <span class="kpi-value">9.4<span class="unit">/10</span> <span class="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>+1.5 vs M1</span></span>
        <span class="muted small">412 verified responses</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">Patient NPS · 90d</span>
        <span class="kpi-value">78 <span class="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>+6</span></span>
        <span class="muted small">Promoters 83% · Detractors 5%</span>
      </div>
    </div>

    <!-- ICL surgery performance — Δ Vault accuracy + Rotation stability (high-impact visuals) -->
    ${renderIclPerfSection()}

    <!-- PROMs · radar by lens size + interactive question evolution -->
    <div class="panel mt-18">
      <div class="panel-head">
        <h3>PROMs by lens size · radar + question evolution</h3>
        <span class="chip ai">4 lens sizes · 9 questions · ${unsatisfied.length} patients flagged</span>
      </div>
      <p class="muted" style="margin-bottom:14px">M12 aggregate scores for each STAAR ICL size across all 9 PROMs questions (left). Pick a question on the right to see its evolution across 1/3/6/12 months — broken out by lens size.</p>

      <div class="proms-split-grid">
        <!-- Left: radar -->
        <div class="proms-radar-col">
          <div class="proms-section-head">
            <h4>Radar · M12 by lens size</h4>
            <span class="hint">Scale 1 (center) → 10 (edge)</span>
          </div>
          <div class="proms-radar-wrap">
            <svg class="proms-radar" viewBox="0 0 ${RW} ${RH}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
              ${radarRings}
              ${radarAxes}
              ${ringLabels}
              ${radarPolygons}
            </svg>
          </div>
          <div class="proms-lens-legend">${radarLegend}</div>
        </div>

        <!-- Right: question evolution -->
        <div class="proms-evolution-col">
          <div class="proms-section-head">
            <h4>Evolution · pick a question</h4>
            <span class="hint">Scores across M1 → M12 by lens size</span>
          </div>
          <div class="proms-q-picker" id="promsQPicker">
            ${PROMS_QCODES.map(c => `
              <button class="proms-q-chip ${c === 'A1' ? 'active' : ''}" data-q="${c}" onclick="setPromsQ('${c}')" title="${PROMS_QTEXT[c]}">
                <span class="qc-code">${c}</span>
                <span class="qc-nm">${PROMS_QSHORT[c]}</span>
              </button>`).join('')}
          </div>
          <div class="proms-q-current" id="promsQCurrent">
            <div class="pqc-label">Showing</div>
            <div class="pqc-q" id="pqcQ">${PROMS_QTEXT.A1}</div>
          </div>
          <div class="proms-ev-wrap" id="promsEvChart">${evolutionSvgFor('A1')}</div>
          <div class="proms-lens-legend">${radarLegend}</div>
        </div>
      </div>
    </div>

    <!-- Survey instrument — 9 real PROMs questions -->
    <div class="panel mt-18">
      <div class="panel-head">
        <h3>Post-op PROMs survey · M12 clinic aggregate</h3>
        <span class="chip">9 questions · 412 responses</span>
      </div>
      <p class="muted" style="margin-bottom:12px">The exact instrument answered by every ICL patient at 1, 3, 6 and 12 months. Aggregate scores shown for M12.</p>
      <div class="proms-q-list">${surveyHtml}</div>
    </div>

    <!-- Unsatisfied patients + Missed visits (2-col) -->
    <div class="mod-grid cols-2 mt-18">
      <div class="panel">
        <div class="panel-head">
          <h3>Unsatisfied patients</h3>
          <span class="chip" style="background:rgba(231,138,39,.16);color:#A1641A">${unsatisfied.length} flagged · need follow-up</span>
        </div>
        <p class="muted" style="margin-bottom:10px">PROMs overall score below 7.0/10 or flagged dimension — action needed.</p>
        <div class="ca-unsat-list">
          ${unsatisfied.map(p => `
            <div class="ca-unsat-item" onclick="openPatientFile('${p.id}')" style="cursor:pointer">
              <div class="ca-unsat-score ${p.overall < 6.5 ? 'low' : 'mid'}">${p.overall}</div>
              <div class="ca-unsat-body">
                <div class="ca-unsat-nm"><b>${p.name}</b><span class="ca-unsat-meta">REV-${p.id} · ${p.age}y · ${p.phase} post-op</span></div>
                <div class="ca-unsat-reason">${p.reason}</div>
                <div class="ca-unsat-reco">→ ${p.reco}</div>
              </div>
              <div class="ca-unsat-cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>Missed post-op visits</h3>
          <span class="chip" style="background:rgba(228,81,103,.14);color:#B03144">${missedVisits.filter(v=>v.severity==='critical').length} critical · ${missedVisits.filter(v=>v.severity==='warn').length} overdue</span>
        </div>
        <p class="muted" style="margin-bottom:10px">Patients who haven't shown up for their scheduled check-up. Auto-reminder cycle triggered — escalate manually if needed.</p>
        <div class="ca-missed-list">
          ${missedVisits.map(v => `
            <div class="ca-missed-item ${v.severity}" onclick="openPatientFile('${v.id}')" style="cursor:pointer">
              <div class="ca-missed-ic">
                ${v.severity === 'critical'
                  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'
                  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l3 3"/></svg>'}
              </div>
              <div class="ca-missed-body">
                <div class="ca-missed-nm"><b>${v.name}</b><span class="ca-missed-meta">REV-${v.id} · surgery ${v.surgeryDate}</span></div>
                <div class="ca-missed-exp"><b>${v.expected}</b> · overdue <b style="color:${v.severity==='critical'?'#B03144':'#A1641A'}">${v.overdue}</b></div>
                <div class="ca-missed-last">Last contact: ${v.last}</div>
              </div>
              <button class="btn btn-ghost small" onclick="event.stopPropagation()">Contact</button>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="panel mt-18">
      <div class="panel-head">
        <h3>Case volume · trailing 12 months</h3>
        <span class="chip">Monthly</span>
      </div>
      <div class="chart-wrap volume-chart-wrap">
        <svg class="volume-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#2472D3" stop-opacity=".28"/>
              <stop offset="100%" stop-color="#2472D3" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <g>${gridY}</g>
          <path d="${areaPath}" fill="url(#gradArea)"/>
          <path d="${linePath}" stroke="#2472D3" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          ${dots}
          ${xLabels}
          <line x1="${P_L}" y1="${P_T}" x2="${P_L}" y2="${H - P_B}" stroke="#0F1D40" stroke-width="1.5" opacity="0.5"/>
          <line x1="${P_L}" y1="${H - P_B}" x2="${W - P_R}" y2="${H - P_B}" stroke="#0F1D40" stroke-width="1.5" opacity="0.5"/>
        </svg>
      </div>
      <div class="leg">
        <span class="sw"><span class="dot teal"></span>Monthly ICL implants</span>
        <span style="margin-left:auto; font-weight:600">Avg ${Math.round(A.caseVolume.reduce((a,b)=>a+b,0) / A.caseVolume.length)} cases/mo</span>
      </div>
    </div>

    <div class="mod-grid cols-2 mt-18">
      <div class="panel">
        <div class="panel-head">
          <h3>Vault outcomes · 12-month cohort</h3>
          <span class="chip live">172 cases</span>
        </div>
        <div style="display:flex; align-items:center; gap:18px;">
          <div style="position:relative; width:180px; height:180px; flex-shrink:0;">
            <svg viewBox="0 0 180 180" width="180" height="180">
              <circle cx="90" cy="90" r="${r}" class="donut-bg"/>
              ${donutStrokes}
            </svg>
            <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none;">
              <div style="font-size:28px; font-weight:800; color:var(--green); font-variant-numeric:tabular-nums;">${O.onTarget}%</div>
              <div class="muted small">On target</div>
            </div>
          </div>
          <div style="flex:1; display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div style="display:flex; align-items:center; gap:8px;"><span style="width:10px;height:10px;border-radius:3px;background:var(--green);"></span>On target (250–750 µm) · <b style="margin-left:auto;font-variant-numeric:tabular-nums">${O.onTarget}%</b></div>
            <div style="display:flex; align-items:center; gap:8px;"><span style="width:10px;height:10px;border-radius:3px;background:var(--teal);"></span>Slightly high (>750 µm) · <b style="margin-left:auto;font-variant-numeric:tabular-nums">${O.slightlyHigh}%</b></div>
            <div style="display:flex; align-items:center; gap:8px;"><span style="width:10px;height:10px;border-radius:3px;background:var(--gold);"></span>Slightly low (<250 µm) · <b style="margin-left:auto;font-variant-numeric:tabular-nums">${O.slightlyLow}%</b></div>
            <div style="display:flex; align-items:center; gap:8px;"><span style="width:10px;height:10px;border-radius:3px;background:var(--warn);"></span>Reintervention · <b style="margin-left:auto;font-variant-numeric:tabular-nums">${O.reintervention}%</b></div>
          </div>
        </div>
        <div class="muted small" style="margin-top:12px; padding-top:12px; border-top:1px solid var(--line)">Benchmark global 2025 · on-target 81.4% · reintervention 1.8%. Your clinic is in the <b style="color:var(--green)">top 5%</b>.</div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>Patient funnel · last 30 days</h3>
          <span class="chip">Consult → implant</span>
        </div>
        <div class="funnel">${funnelHtml}</div>
        <div class="muted small" style="margin-top:12px; padding-top:12px; border-top:1px solid var(--line)">Consult → implanted conversion · <b style="color:var(--gold)">${Math.round(A.funnel[A.funnel.length-1].count / A.funnel[0].count * 100)}%</b> · benchmark 28%.</div>
      </div>
    </div>

    <div class="mod-grid split-hero mt-18">
      <div class="panel">
        <div class="panel-head">
          <h3>Surgeon performance</h3>
          <span class="chip">YTD</span>
        </div>
        <table class="tbl">
          <thead><tr><th>Surgeon</th><th>Cases</th><th>Vault accuracy</th><th>NPS</th></tr></thead>
          <tbody>${surgRows}</tbody>
        </table>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3>OR activity · 12 weeks</h3>
          <span class="chip">Cases / day</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:3px;">${heatHtml}</div>
        <div class="leg" style="justify-content:flex-end">
          <span class="muted small">Less</span>
          <div style="display:flex; gap:3px">
            <div class="heat-cell" data-v="0" style="width:14px; height:14px;"></div>
            <div class="heat-cell" data-v="1" style="width:14px; height:14px;"></div>
            <div class="heat-cell" data-v="2" style="width:14px; height:14px;"></div>
            <div class="heat-cell" data-v="3" style="width:14px; height:14px;"></div>
            <div class="heat-cell" data-v="4" style="width:14px; height:14px;"></div>
          </div>
          <span class="muted small">More</span>
        </div>
      </div>
    </div>
  `;
}
