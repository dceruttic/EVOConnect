// =====================================================================
// NATIVE Procedure Recommendation — replaces the iframe entirely.
// State store + recommendation engine + 2-pane responsive layout.
// =====================================================================
var PT_PROC_REC = {};   // { ptId: { sphere, cylinder, age, cct, acd, pupil, hoa, osd, cornea, lens } }
// Whether the surgeon has opened the (optional) Procedure Recommendation tool for this patient.
// The tool is collapsed by default — it's a "what-if" calculator, not a primary panel.
var PT_PROC_REC_OPEN = {};   // { ptId: true }

function _ensureProcRecStore(ptId){
  if (PT_PROC_REC[ptId]) return PT_PROC_REC[ptId];
  // Default scenario: Myopia 5D (generic baseline). Surgeon adjusts from there.
  // EHR / attachment values override the bio defaults (CCT, ACD) when present.
  var pt = (DATA.patients||[]).find(function(x){ return x.id === ptId; }) || {};
  var pre = (typeof PT_PREOP_DATA !== 'undefined') ? (PT_PREOP_DATA[ptId] || {}) : {};
  var v = pre.ehrValues || {};
  (pre.attachments || []).forEach(function(a){ Object.assign(v, a.values || {}); });
  PT_PROC_REC[ptId] = {
    sphere:   '5.00',          // Myopia 5D — default starting scenario
    cylinder: '0.00',          // No astigmatism by default
    age:      String(pt.age || 32),
    cct:      v.cct ? String(v.cct) : '540',
    acd:      v.acd ? String(v.acd) : '3.20',
    pupil:    '5.0',
    hoa:      '0.20',
    osd:      'none',
    cornea:   'normal',
    lens:     'clear',
  };
  return PT_PROC_REC[ptId];
}
function openProcRecTool(ptId){
  PT_PROC_REC_OPEN[ptId] = true;
  _refreshProcRecSection(ptId);
}
function closeProcRecTool(ptId){
  PT_PROC_REC_OPEN[ptId] = false;
  _refreshProcRecSection(ptId);
}
function _refreshProcRecSection(ptId){
  var pt = (DATA.patients||[]).find(function(x){ return x.id === ptId; });
  if (!pt) return;
  var node = document.getElementById('procRecSection_' + ptId);
  if (!node) return;
  var wrap = document.createElement('div');
  wrap.innerHTML = renderProcedureRecSection(pt);
  var fresh = wrap.firstElementChild;
  if (fresh) node.replaceWith(fresh);
}

// === Recommendation engine — heuristic scoring across 5 procedures ===
function computeProcedureRec(s){
  var sph = parseFloat(s.sphere) || 0;
  var cyl = parseFloat(s.cylinder) || 0;
  var age = parseInt(s.age, 10) || 30;
  var cct = parseInt(s.cct, 10) || 540;
  var acd = parseFloat(s.acd) || 3.0;
  var pupil = parseFloat(s.pupil) || 5.0;
  var hoa = parseFloat(s.hoa) || 0.2;
  var osdBad = (s.osd === 'moderate' || s.osd === 'severe');
  var corneaBad = (s.cornea !== 'normal');
  var lensBad = (s.lens !== 'clear');

  // Hard contraindications
  var contra = {
    'EVO ICL':    [],
    'SMILE':      [],
    'Femto-LASIK':[],
    'PRK':        [],
    'RLE':        [],
  };
  if (acd < 2.8) contra['EVO ICL'].push('ACD ' + acd.toFixed(2) + 'mm < 2.8mm — too shallow for ICL');
  if (corneaBad) {
    contra['SMILE'].push('Corneal abnormality (' + s.cornea + ')');
    contra['Femto-LASIK'].push('Corneal abnormality (' + s.cornea + ')');
  }
  if (cct < 480) contra['Femto-LASIK'].push('CCT ' + cct + 'µm < 480 — flap risk');
  if (cct < 460) contra['SMILE'].push('CCT ' + cct + 'µm < 460 — residual stromal bed risk');
  if (osdBad) {
    contra['Femto-LASIK'].push('OSD grade ' + s.osd);
    contra['SMILE'].push('OSD grade ' + s.osd);
  }
  if (lensBad) {
    contra['EVO ICL'].push('Lens not clear (' + s.lens + ')');
    contra['Femto-LASIK'].push('Lens not clear');
    contra['SMILE'].push('Lens not clear');
    contra['PRK'].push('Lens not clear');
  }

  // Positive scoring
  var score = { 'EVO ICL': 0, 'SMILE': 0, 'Femto-LASIK': 0, 'PRK': 0, 'RLE': 0 };
  // === Sizing-range rule: myopia ≥ 5 D → EVO ICL is the recommendation ===
  if (sph >= 8) score['EVO ICL'] += 10;
  else if (sph >= 5) score['EVO ICL'] += 8;     // explicit cutoff: ≥5 D → ICL wins
  else if (sph >= 3) score['EVO ICL'] += 3;
  else score['EVO ICL'] += 1;
  // SMILE / LASIK only get the moderate-myopia bonus BELOW the 5 D cutoff
  if (sph >= 1 && sph < 5) { score['SMILE'] += 4; score['Femto-LASIK'] += 4; }
  if (sph >= 1 && sph < 5) { score['SMILE'] += 1; score['Femto-LASIK'] += 2; }
  if (sph < 1) { score['SMILE'] -= 2; score['Femto-LASIK'] -= 2; }
  // PRK is the salvage when LASIK is risky
  score['PRK'] += 2;
  if (cct < 500) score['PRK'] += 2;
  if (corneaBad && !lensBad) score['PRK'] += 2;
  // Cataract / clear-lens replacement
  if (lensBad || age >= 50) score['RLE'] += 4;
  if (age >= 60) score['RLE'] += 3;
  // Cornea-preserving bonus for ICL
  if (cct < 500) score['EVO ICL'] += 2;
  if (corneaBad) score['EVO ICL'] += 3;
  // Big pupil → ICL halos risk if optic small; LASIK halos risk too
  if (pupil >= 6.5) { score['Femto-LASIK'] -= 1; }
  // High HOA penalizes LASIK
  if (hoa >= 0.5) { score['Femto-LASIK'] -= 2; score['SMILE'] -= 1; }
  // Astigmatism > 4 D: ICL toric or RLE
  if (cyl >= 4) { score['Femto-LASIK'] -= 1; score['SMILE'] -= 1; }

  // Apply contraindications: zero out
  Object.keys(contra).forEach(function(k){ if (contra[k].length) score[k] = 0; });

  // === Hard rule enforcement: sphere ≥ 5 D → EVO ICL wins (unless ICL is contraindicated) ===
  if (sph >= 5 && contra['EVO ICL'].length === 0) {
    var maxOther = 0;
    Object.keys(score).forEach(function(k){ if (k !== 'EVO ICL' && score[k] > maxOther) maxOther = score[k]; });
    if (score['EVO ICL'] <= maxOther) score['EVO ICL'] = maxOther + 1;
  }

  // Sort
  var ranked = Object.keys(score).map(function(k){ return { name: k, score: score[k], contra: contra[k] }; })
    .sort(function(a, b){ return b.score - a.score; });

  // Confidence: top score normalized to a believable range
  var top = ranked[0];
  var maxPossible = 12;
  var conf = Math.max(60, Math.min(98, Math.round((top.score / maxPossible) * 100)));

  // Reasons for top pick
  var reasons = [];
  if (top.name === 'EVO ICL') {
    if (acd >= 3.0) reasons.push({ ok: true,  txt: 'ACD ' + acd.toFixed(2) + 'mm ≥ 3.0mm — optimal' });
    else if (acd >= 2.8) reasons.push({ ok: false, txt: 'ACD ' + acd.toFixed(2) + 'mm < 3.0mm — borderline' });
    if (sph >= 6) reasons.push({ ok: true, txt: 'Sphere −' + sph.toFixed(2) + ' D — within ICL range' });
    if (corneaBad) reasons.push({ ok: true, txt: 'Cornea-preserving — bypasses topographic concern' });
    if (cct < 500) reasons.push({ ok: true, txt: 'Thin CCT (' + cct + 'µm) — avoids stromal removal' });
  } else if (top.name === 'SMILE') {
    reasons.push({ ok: true, txt: 'Flap-free, minimally invasive at sphere −' + sph.toFixed(2) + ' D' });
    if (cct >= 500) reasons.push({ ok: true, txt: 'CCT ' + cct + 'µm — safe stromal bed' });
  } else if (top.name === 'Femto-LASIK') {
    reasons.push({ ok: true, txt: 'Standard refractive correction · sphere −' + sph.toFixed(2) + ' D' });
    if (cct >= 520) reasons.push({ ok: true, txt: 'CCT ' + cct + 'µm — safe for flap creation' });
  } else if (top.name === 'PRK') {
    reasons.push({ ok: true, txt: 'Surface ablation — no flap-related risks' });
    if (cct < 500) reasons.push({ ok: true, txt: 'Preferred over LASIK for thin CCT' });
  } else if (top.name === 'RLE') {
    reasons.push({ ok: true, txt: 'Lens replacement — addresses underlying lens change' });
  }

  return { ranked: ranked, top: top, conf: conf, reasons: reasons };
}

function renderProcedureRecSection(pt){
  _ensureProcRecStore(pt.id);
  var isOpen = !!PT_PROC_REC_OPEN[pt.id];
  var hasAutofill = !!(typeof PT_PREOP_DATA !== 'undefined' && PT_PREOP_DATA[pt.id] &&
    (PT_PREOP_DATA[pt.id].ehrImported || (PT_PREOP_DATA[pt.id].attachments || []).length));

  // === Collapsed mode — the surgeon hasn't activated the tool yet. ===
  // Show a compact "ICL Tool" card with a one-click open CTA. This is the default state.
  if (!isOpen) {
    return [
      '<div class="pd-section pc-section pc-collapsed" id="procRecSection_' + pt.id + '">',
        '<div class="pc-tool-card">',
          '<div class="pc-tool-l">',
            '<span class="pc-title-ic">',
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2h-4"/><path d="M12 2v9"/><path d="M8 7l4-5 4 5"/></svg>',
            '</span>',
            '<div class="pc-tool-text">',
              '<div class="pc-tool-eyebrow">ICL Tool · optional</div>',
              '<h2 class="pc-h2">Procedure recommendation</h2>',
              '<span class="pc-sub">Open this only if you need a what-if comparison across LASIK, PRK, SMILE, EVO ICL and RLE. Defaults to a Myopia −5 D scenario; auto-fills from EHR data when available.</span>',
            '</div>',
          '</div>',
          '<button class="pc-tool-open" type="button" onclick="openProcRecTool(\'' + pt.id + '\')">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
            '<span>Open ICL Procedure Tool</span>',
          '</button>',
        '</div>',
      '</div>'
    ].join('');
  }

  // === Expanded mode — full form + result panel. ===
  return [
    '<div class="pd-section pc-section" id="procRecSection_' + pt.id + '">',
      '<div class="pc-head">',
        '<div class="pc-head-l">',
          '<span class="pc-title-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2h-4"/><path d="M12 2v9"/><path d="M8 7l4-5 4 5"/></svg></span>',
          '<h2 class="pc-h2">Procedure recommendation</h2>',
          '<span class="pc-sub">AI-ranked across LASIK, PRK, SMILE, EVO ICL and RLE — surgeon makes the final call.</span>',
        '</div>',
        '<div class="pc-head-r">',
          hasAutofill ? '<span class="ra-autofill-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="width:11px;height:11px;"><polyline points="20 6 9 17 4 12"/></svg>Patient Parameters auto-filled</span>' : '',
          '<button class="pc-reset-btn" type="button" onclick="resetProcRec(\'' + pt.id + '\')">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Reset',
          '</button>',
          '<button class="pc-reset-btn" type="button" onclick="closeProcRecTool(\'' + pt.id + '\')" title="Close ICL Procedure Tool">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M6 6l12 12M18 6L6 18"/></svg> Close',
          '</button>',
        '</div>',
      '</div>',
      '<div class="pc-grid">',
        '<div class="pc-form" id="pcForm_' + pt.id + '">' + renderProcRecForm(pt) + '</div>',
        '<aside class="pc-result" id="pcResult_' + pt.id + '">' + renderProcRecResult(pt) + '</aside>',
      '</div>',
    '</div>'
  ].join('');
}

function renderProcRecForm(pt){
  var s = PT_PROC_REC[pt.id];
  function slider(id, lbl, sub, min, max, step, val, unit){
    return [
      '<div class="pc-row pc-slider-row">',
        '<div class="pc-row-head">',
          '<div class="pc-row-lbl"><div class="pc-lbl-ttl">' + lbl + '</div><div class="pc-lbl-sub">' + sub + '</div></div>',
          '<div class="pc-row-val"><span class="pc-val-num" id="pcVal_' + pt.id + '_' + id + '">' + val + '</span><span class="pc-val-unit">' + unit + '</span></div>',
        '</div>',
        '<input type="range" id="pcInp_' + pt.id + '_' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" oninput="updateProcRec(\'' + pt.id + '\',\'' + id + '\',this.value)" />',
      '</div>'
    ].join('');
  }
  function btnGroup(id, lbl, sub, options, current){
    var btns = options.map(function(o){
      var sel = o.v === current ? ' active' : '';
      return '<button type="button" class="pc-btn' + sel + '" onclick="updateProcRec(\'' + pt.id + '\',\'' + id + '\',\'' + o.v + '\')">' + o.lbl + '</button>';
    }).join('');
    return [
      '<div class="pc-row pc-card-row">',
        '<div class="pc-card-head">',
          '<div class="pc-lbl-ttl">' + lbl + '</div>',
          '<div class="pc-lbl-sub">' + sub + '</div>',
        '</div>',
        '<div class="pc-btn-group">' + btns + '</div>',
      '</div>'
    ].join('');
  }
  return [
    '<div class="pc-section-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;color:#0071B0;"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg><span>REFRACTION &amp; BIOMETRY</span></div>',
    '<div class="pc-form-grid pc-grid-2">',
      slider('sphere',   'Myopia (Spherical Equivalent)', 'Positive value, e.g. 5.00 for −5 D', '0',   '15',  '0.25', s.sphere,   'D'),
      slider('cylinder', 'Astigmatism (Cylinder)',         'Magnitude only',                     '0',   '6',   '0.25', s.cylinder, 'D'),
      slider('age',      'Age',                             'Years',                              '18',  '80',  '1',    s.age,      'yr'),
      slider('cct',      'Central Pachymetry',              'µm',                                 '420', '620', '1',    s.cct,      'µm'),
      slider('acd',      'Anterior Chamber Depth',          'mm (endothelium → ant. lens)',       '2.5', '4.5', '0.01', s.acd,      'mm'),
      slider('pupil',    'Scotopic Pupil Diameter',         'mm',                                 '4.0', '9.0', '0.1',  s.pupil,    'mm'),
      slider('hoa',      'HOA RMS',                         'Total, 6 mm zone',                   '0',   '1.0', '0.01', s.hoa,      'µm'),
    '</div>',
    '<div class="pc-section-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;color:#0071B0;"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg><span>OCULAR HEALTH STATUS</span></div>',
    '<div class="pc-form-grid pc-grid-3">',
      btnGroup('osd',    'Ocular Surface Disease', 'DEWS II grade',          [{v:'none',lbl:'None / Minimal'},{v:'mild',lbl:'Mild (I–II)'},{v:'moderate',lbl:'Moderate (III)'},{v:'severe',lbl:'Severe (IV)'}], s.osd),
      btnGroup('cornea', 'Corneal Status',         'Topography / Tomography', [{v:'normal',lbl:'Normal'},{v:'fruste',lbl:'Forme fruste'},{v:'kerato',lbl:'Keratoconus'},{v:'ectasia',lbl:'Other ectasia'},{v:'scar',lbl:'Scar / Opacity'}], s.cornea),
      btnGroup('lens',   'Crystalline Lens',       'Slit-lamp grading',       [{v:'clear',lbl:'Clear'},{v:'early',lbl:'Early NS'},{v:'cataract',lbl:'Cataract'}], s.lens),
    '</div>',
  ].join('');
}

function renderProcRecResult(pt){
  var s = PT_PROC_REC[pt.id];
  var r = computeProcedureRec(s);
  var palette = {
    'EVO ICL':     'linear-gradient(160deg,#001E60 0%,#0071B0 70%,#08B1C2 100%)',
    'SMILE':       'linear-gradient(160deg,#1A2E54 0%,#2472D3 100%)',
    'Femto-LASIK': 'linear-gradient(160deg,#0E2A4D 0%,#1F4E92 100%)',
    'PRK':         'linear-gradient(160deg,#3F1A2E 0%,#7E2A56 100%)',
    'RLE':         'linear-gradient(160deg,#1F2937 0%,#374151 100%)',
  };
  var bg = palette[r.top.name] || palette['EVO ICL'];
  var icons = {
    'EVO ICL':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    'SMILE':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12c0 5 4 9 9 9s9-4 9-9"/></svg>',
    'Femto-LASIK': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    'PRK':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12c-2-2-5-3-10-3s-8 1-10 3"/><circle cx="12" cy="12" r="3"/></svg>',
    'RLE':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg>',
  };
  var altsHtml = r.ranked.slice(1, 4).map(function(a){
    var pct = Math.max(20, Math.min(95, Math.round((a.score / r.top.score) * 100) || 25));
    return [
      '<div class="pc-alt">',
        '<div class="pc-alt-row">',
          '<span class="pc-alt-name">' + a.name + '</span>',
          '<span class="pc-alt-score">' + a.score + (a.contra && a.contra.length ? ' · contraindicated' : '') + '</span>',
        '</div>',
        '<div class="pc-alt-bar"><span style="width:' + pct + '%' + (a.contra && a.contra.length ? ';background:#E45167' : '') + '"></span></div>',
      '</div>'
    ].join('');
  }).join('');
  var reasonsHtml = r.reasons.map(function(rs){
    var ic = rs.ok
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="#16B386" stroke-width="3" stroke-linecap="round" style="width:13px;height:13px;flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="#FFC443" stroke-width="2.4" stroke-linecap="round" style="width:13px;height:13px;flex-shrink:0;"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>';
    return '<div class="pc-reason">' + ic + '<span>' + rs.txt + '</span></div>';
  }).join('');
  return [
    '<div class="pc-result-card" style="background:' + bg + '">',
      '<div class="pc-sentinel-chip">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;color:#fff;"><path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z"/></svg>',
        '<div><div class="pc-sentinel-nm">AI Sentinel</div><div class="pc-sentinel-sub">STAAR Surgical</div></div>',
      '</div>',
      '<div class="pc-result-eyebrow">Recommended procedure</div>',
      '<div class="pc-result-name">' + r.top.name + '</div>',
      '<div class="pc-result-meta">',
        '<span class="pc-conf-pill">' + r.conf + '<em>%</em> confidence</span>',
        '<span class="pc-score-pill">score ' + r.top.score + '</span>',
      '</div>',
      reasonsHtml ? '<div class="pc-reasons">' + reasonsHtml + '</div>' : '',
      '<div class="pc-alts-head">Alternatives</div>',
      '<div class="pc-alts">' + altsHtml + '</div>',
      '<div class="pc-result-actions">',
        '<button class="pc-result-btn" type="button" onclick="openProcRecModal(\'rationale\',\'' + pt.id + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M9 2v6l-3 5h12l-3-5V2"/><path d="M6 13h12"/></svg> Clinical rationale</button>',
        '<button class="pc-result-btn" type="button" onclick="openProcRecModal(\'evidence\',\'' + pt.id + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> Evidence base</button>',
      '</div>',
    '</div>'
  ].join('');
}
