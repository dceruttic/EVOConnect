// ===================================================================
// Post-op page — modeled after the ICL Guru post-op screen reference.
// 12-milestone timeline + eye picker + Surgical/Post-op data + vault
// thermometer + residual refraction + Calculations + AS-OCT image.
// ===================================================================
var CURRENT_PT_POSTOP_EYE = 'OD';
var CURRENT_PT_POSTOP_MS  = '1M';

/* ------------------------------------------------------------------
   Post-op visits are created in ONE place: the patient timeline at the
   top of the page. A case starts with the four standard follow-ups and
   the surgeon adds any other timeframe with the "+" controls there —
   earlier visits before the first follow-up, later ones after 12 mo.
   This registry is what the timeline renders and what the post-op page
   reads; there is no second milestone rail.
------------------------------------------------------------------- */
var POSTOP_ORDER = ['IMM','4H','1D','7D','1M','3M','6M','9M','1Y','2Y','3Y','4Y','5Y','10Y'];
var POSTOP_DEFAULT_MS = ['1M','3M','6M','1Y'];
var POSTOP_EARLY_OPTIONS = ['IMM','4H','1D','7D'];
var POSTOP_LATE_OPTIONS  = ['2Y','3Y','4Y','5Y','10Y'];
var POSTOP_LABEL = { IMM:'IMM', '4H':'4 h', '1D':'1 d', '7D':'7 d', '1M':'1 mo', '3M':'3 mo',
                     '6M':'6 mo', '9M':'9 mo', '1Y':'12 mo', '2Y':'2 yr', '3Y':'3 yr',
                     '4Y':'4 yr', '5Y':'5 yr', '10Y':'10 yr' };
window.PT_POSTOP_MILESTONES = window.PT_POSTOP_MILESTONES || {};
function postopMilestones(ptId){
  if (!PT_POSTOP_MILESTONES[ptId]) PT_POSTOP_MILESTONES[ptId] = POSTOP_DEFAULT_MS.slice();
  return PT_POSTOP_MILESTONES[ptId].slice().sort(function(a,b){
    return POSTOP_ORDER.indexOf(a) - POSTOP_ORDER.indexOf(b);
  });
}
function addPostopMilestone(ptId, ms){
  if (POSTOP_ORDER.indexOf(ms) < 0) return;
  var list = postopMilestones(ptId);
  if (list.indexOf(ms) < 0) PT_POSTOP_MILESTONES[ptId] = list.concat([ms]);
  if (typeof CURRENT_PT !== 'undefined' && CURRENT_PT && CURRENT_PT.id === ptId) {
    CURRENT_PT_POSTOP_MS = ms;
    if (typeof setPatientTab === 'function') setPatientTab('postop', ms);
  }
  if (typeof showToast === 'function') showToast((POSTOP_LABEL[ms] || ms) + ' follow-up added to the timeline');
}

// Pick the most relevant milestone for the patient — the first one whose date hasn't passed yet.
// Falls back to the latest captured if all are past.
function _initialPostopMs(pt){
  if (!pt) return '1M';
  var order = postopMilestones(pt.id);
  for (var i = 0; i < order.length; i++){
    var d = postopVisitData(pt, 'OD', order[i]).visitDate;
    if (d.getTime() > Date.now()) return order[i];   // first future = the next visit to capture
  }
  return order[order.length - 1];                     // all past → latest
}

function setPostopEye(eye){
  CURRENT_PT_POSTOP_EYE = eye;
  _refreshPostopMain();
}

/* EVO Credits is a later-phase module: while it is locked, no screen may show
   or promise EVO points. Defaults to locked-off if the helper is not loaded. */
function _evoLocked(){
  return typeof window.evoCreditsLocked === 'function' ? window.evoCreditsLocked() : false;
}

// Flag the visit as logged + persist any open cell edits + award EVO points
window.PT_POSTOP_LOGGED = window.PT_POSTOP_LOGGED || {};
function logPostopVisit(ptId, milestone, eye){
  // Commit any focused input value so the surgeon doesn't lose unsaved typing
  if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('po-cell-edit')) {
    document.activeElement.blur();
  }
  var key = ptId + ':' + eye + ':' + milestone;
  if (PT_POSTOP_LOGGED[key]) {
    // Already logged — show a regular toast (no double-points), but still confirm the save
    if (typeof showToast === 'function') showToast('Visit data updated · no additional EVO (already credited)');
    if (typeof _refreshPostopMain === 'function') _refreshPostopMain();
    return;
  }
  PT_POSTOP_LOGGED[key] = { ts: Date.now() };
  awardEvoPoints(20, 'Post-op visit logged', milestone + ' · ' + eye);
  if (typeof _refreshPostopMain === 'function') _refreshPostopMain();
}
function setPostopMilestone(ms){
  CURRENT_PT_POSTOP_MS = ms;
  _refreshPostopMain();
}
function _refreshPostopMain(){
  if (!CURRENT_PT) return;
  var main = document.getElementById('ptMainContent');
  if (main && CURRENT_PT_TAB === 'postop') main.innerHTML = renderPtPostop(CURRENT_PT);
}

// User-edited post-op data per (patient · eye · milestone).
// Populated when an OCT scan is auto-parsed OR when the surgeon edits cells manually.
window.PT_POSTOP_DATA = window.PT_POSTOP_DATA || {};
function _postopKey(ptId, eye, ms){ return ptId + ':' + eye + ':' + ms; }
function setPostopField(ptId, eye, ms, field, value){
  var k = _postopKey(ptId, eye, ms);
  PT_POSTOP_DATA[k] = PT_POSTOP_DATA[k] || { autoFilled: false };
  PT_POSTOP_DATA[k][field] = value;
  // Also mark as captured so the visit isn't shown as empty
  if (window.PT_POSTOP_LOGGED) {
    PT_POSTOP_LOGGED[k] = PT_POSTOP_LOGGED[k] || { ts: Date.now() };
  }
}

// Mock data per (patient, eye, milestone) — deterministic via ptRand.
// CRITICAL: visits in the FUTURE (or not yet logged) return null clinical values so the UI
// shows empty cells with a "Visit not yet captured" CTA instead of fake data.
function postopVisitData(pt, eye, ms){
  var r = patientLensReco(pt);
  var seed = (eye === 'OD' ? 7000 : 8000) + ({IMM:1,'4H':2,'1D':3,'7D':4,'1M':5,'3M':6,'6M':7,'9M':8,'1Y':9,'3Y':10,'5Y':11,'10Y':12}[ms] || 0);
  function rnd(off, lo, hi){ return ptRand(pt.id, seed + off, lo, hi); }

  // Visit date relative to surgery
  var surgDateStr = pt.surgeryDate || 'Mar 28, 2026';
  var sd = new Date(surgDateStr);
  var offsetDays = ({IMM:0,'4H':0,'1D':1,'7D':7,'1M':30,'3M':90,'6M':180,'9M':270,'1Y':365,'2Y':730,'3Y':1095,'4Y':1460,'5Y':1825,'10Y':3650}[ms] || 30);
  var visitDate = new Date(sd.getTime()); visitDate.setDate(visitDate.getDate() + offsetDays);
  var visitTime = (8 + Math.round(rnd(8, 0, 8))).toString().padStart(2,'0') + ':' + (Math.round(rnd(9,0,55))).toString().padStart(2,'0');

  // Has the visit DATE passed AND was it logged? Logged = either auto (date past) OR manual via PT_POSTOP_LOGGED.
  /* A visit only carries data once it has actually been captured. For a case
     with a recorded surgery that is "the date has passed"; for a case that has
     not been through surgery in this demo (Phase 1 has no surgery step) it is
     only what the surgeon logged here — so a case opened for the first time is
     empty, as it should be. */
  var datePassed = visitDate.getTime() <= Date.now();
  var hasSurgery = pt.stage === 'Post-op';
  var manuallyLogged = !!(window.PT_POSTOP_LOGGED && PT_POSTOP_LOGGED[pt.id + ':' + eye + ':' + ms]);
  var captured = manuallyLogged || (datePassed && hasSurgery);

  if (!captured) {
    // Future visit — empty fields, only the projected date is known
    return {
      eye: eye, ms: ms,
      captured: false,
      vault: null, temporalAngle: null, nasalAngle: null, pupilDiam: null,
      ucva: null, sphereRes: null, cylinderRes: null, axisRes: null, bcva: null,
      visitDate: visitDate, visitTime: visitTime,
      implantedSize: r.size, lensModel: r.model, lensPower: r.power,
      iolPower: { sphere: parseFloat(String(pt.power).split('/')[eye==='OS'?1:0]) || -8, cyl: 0.5, axis: 27 },
      biometry: { ata: 12.66, aRise: 0.92, acd: 2.73 },
      predictionRange: { low: Math.max(180, Math.round(r.vault) - 140), high: Math.round(r.vault) + 60 },
    };
  }

  // Captured visit — generate realistic mock values
  var vault = Math.max(180, Math.min(700, Math.round(r.vault + rnd(1, -90, 110))));
  var temporalA = +(11 + rnd(2, -3, 6)).toFixed(1);
  var nasalA    = +(14 + rnd(3, -3, 5)).toFixed(1);
  var pupil     = +(3.6 + rnd(4, -0.6, 1.8)).toFixed(2);
  // UCVA only available from D1 onwards (IMM and 4H still settling)
  var visAvail = ['1D','7D','1M','3M','6M','9M','1Y','3Y','5Y','10Y'].indexOf(ms) >= 0;
  var ucva = visAvail ? (Math.random()>0.85 ? '20/15' : '20/20') : null;
  if (eye === 'OS' && (pt.id.charCodeAt(pt.id.length-1) % 2 === 0) && visAvail) ucva = '20/25';
  var sphRes = visAvail ? +(rnd(5, -0.50, 0.50)).toFixed(2) : null;
  var cylRes = visAvail ? +(rnd(6, -0.50, 0.25)).toFixed(2) : null;
  var axisRes = visAvail ? Math.round(180 * Math.abs(rnd(7, 0, 1))) % 180 : null;
  var bcva = visAvail ? '20/20' : null;
  // Merge in any user-edited / auto-parsed values
  var k = _postopKey(pt.id, eye, ms);
  var userData = PT_POSTOP_DATA[k] || {};
  function mergeField(name, mockVal){ return (userData[name] !== undefined && userData[name] !== null && userData[name] !== '') ? userData[name] : mockVal; }
  return {
    eye: eye, ms: ms,
    captured: true,
    autoFilled: !!userData.autoFilled,
    vault: mergeField('vault', vault),
    temporalAngle: mergeField('temporalAngle', temporalA),
    nasalAngle:    mergeField('nasalAngle', nasalA),
    pupilDiam:     mergeField('pupilDiam', pupil),
    ucva:          mergeField('ucva', ucva),
    sphereRes:     mergeField('sphereRes', sphRes),
    cylinderRes:   mergeField('cylinderRes', cylRes),
    axisRes:       mergeField('axisRes', axisRes),
    bcva:          mergeField('bcva', bcva),
    visitDate: visitDate, visitTime: visitTime,
    implantedSize: r.size, lensModel: r.model, lensPower: r.power,
    iolPower: { sphere: parseFloat(String(pt.power).split('/')[eye==='OS'?1:0]) || -8, cyl: 0.5, axis: 27 },
    biometry: { ata: 12.66, aRise: 0.92, acd: 2.73 },
    predictionRange: { low: Math.max(180, mergeField('vault', vault) - 140), high: mergeField('vault', vault) + 60 },
  };
}

function _msStatus(pt, ms){
  // A milestone is "done" if the visit date is in the past (relative to today).
  var d = postopVisitData(pt, CURRENT_PT_POSTOP_EYE, ms).visitDate;
  return d.getTime() <= Date.now() ? 'done' : 'future';
}

function renderPtPostop(pt) {
  /* Post-op capture is never gated on the patient having reached the Post-op
     stage. In Phase 1 the surgical planner and surgery steps do not exist, so
     a case can only ever arrive here straight from ICL selection — the surgeon
     still has to be able to enter each visit and analyse it. When the case has
     not been through a recorded surgery, the page says so and carries on. */
  var isPostop = pt.stage === 'Post-op';
  var preSurgeryNote = isPostop ? '' : [
    '<div class="po-prenote">',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
      '<span><b>No surgery recorded for this case.</b> Enter each visit below and press <em>Save visit data</em> — the values are stored against this case and feed the analysis.</span>',
    '</div>'
  ].join('');
  var v = postopVisitData(pt, CURRENT_PT_POSTOP_EYE, CURRENT_PT_POSTOP_MS);

  // === Eye picker ===
  var eyeTabsHtml = ['OD','OS'].map(function(e){
    return '<button type="button" class="po-eye-tab' + (CURRENT_PT_POSTOP_EYE===e?' active':'') + '" onclick="setPostopEye(\'' + e + '\')">' + e + '</button>';
  }).join('');

  // === Top context strip ===
  var sg = patientSurgeon(pt);
  var contextStrip = [
    '<div class="po-context-row">',
      '<div class="po-ctx-card">',
        '<div class="po-ctx-ic" style="background:#001E60">' + sg.initials + '</div>',
        '<div><div class="po-ctx-k">Clinic</div><div class="po-ctx-v">' + sg.clinic + '</div></div>',
      '</div>',
      '<div class="po-ctx-card">',
        '<div class="po-ctx-ic" style="background:#0071B0">' + sg.initials + '</div>',
        '<div><div class="po-ctx-k">Surgeon</div><div class="po-ctx-v">' + sg.name + '</div></div>',
      '</div>',
      '<div class="po-ctx-card po-ctx-date">',
        '<div><div class="po-ctx-k">Date of surgery</div><div class="po-ctx-v"><b>' + (pt.surgeryDate || 'Mar 28, 2026') + '</b></div></div>',
      '</div>',
      '<button class="po-disclaimer-btn" type="button" title="ICL Guru is decision support — clinician owns the call">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
        ' Disclaimer',
      '</button>',
    '</div>',
  ].join('');

  // === Bio + IOL + Biometry strip ===
  var dob = pt.id === '2126-0418' ? '8/2/1994' : '12/5/1990';  // mock DOBs
  var mrn = 'MRN-' + pt.id;
  var bioStrip = [
    '<div class="po-bio-row">',
      '<div class="po-bio-card">',
        '<div class="po-bio-row-row"><span class="po-bio-k">Patient</span><span class="po-bio-v">' + pt.name + '</span></div>',
        '<div class="po-bio-row-row"><span class="po-bio-k">Gender</span><span class="po-bio-v">' + pt.sex + '</span></div>',
        '<div class="po-bio-row-row"><span class="po-bio-k">DOB</span><span class="po-bio-v">' + dob + '</span></div>',
      '</div>',
      '<div class="po-bio-card">',
        '<div class="po-bio-row-row"><span class="po-bio-k">Medical record</span><span class="po-bio-v">' + mrn + '</span></div>',
        '<div class="po-bio-row-row"><span class="po-bio-k">Calculation date</span><span class="po-bio-v">' + (pt.surgeryDate ? new Date(pt.surgeryDate).toISOString().slice(0,10) : '2026-02-22') + '</span></div>',
        '<div class="po-bio-row-row"><span class="po-bio-k">Calculation method</span><span class="po-bio-v">ICL Guru · T2</span></div>',
      '</div>',
      '<div class="po-bio-card">',
        '<div class="po-bio-iol-head">IOL Power</div>',
        '<div class="po-bio-iol-grid">',
          '<div><span>Sphere</span><b>' + v.iolPower.sphere.toFixed(1) + ' D</b></div>',
          '<div><span>Cyl</span><b>' + v.iolPower.cyl.toFixed(1) + ' D</b></div>',
          '<div><span>Axis</span><b>' + v.iolPower.axis + '°</b></div>',
        '</div>',
        '<div class="po-bio-iol-grid" style="margin-top:6px;">',
          '<div><span>ATA</span><b>' + v.biometry.ata.toFixed(2) + ' mm</b></div>',
          '<div><span>aRISE</span><b>' + v.biometry.aRise.toFixed(2) + ' mm</b></div>',
          '<div><span>ACD</span><b>' + v.biometry.acd.toFixed(2) + ' mm</b></div>',
        '</div>',
      '</div>',
    '</div>',
  ].join('');

  /* No inner milestone rail: visits live on the patient timeline above. */

  // === Vault thermometer SVG — refreshed to match the reference design ===
  // Vibrant 5-band STAAR vault palette + rounded bar caps + flag-style prediction badges + pill post-op badge.
  var vaultSvg = (function(){
    var H = 320, leftBarX = 28, barW = 36, gap = 50, axisW = 38;
    var rightBarX = leftBarX + barW + axisW + gap;
    var totalW = rightBarX + barW + 64;  // extra room for the post-op badge
    var topPad = 28, bottomPad = 30;
    var bandH = H - topPad - bottomPad;
    function py(val){ return topPad + bandH * (1 - Math.min(1500, Math.max(0, val)) / 1500); }
    // Updated palette — saturated, matching the reference SVG bands
    var COLORS = { hyper:'#B845D5', high:'#3371C3', ideal:'#03B496', low:'#F6BF2C', hypo:'#D12C4A' };

    // Build a single column of stacked bands (used for both PREDICTION and POST-OP)
    function buildBands(x, opacity){
      var op = opacity == null ? 1 : opacity;
      // Bands are individual rects so we can round only the top of the topmost + bottom of bottommost
      // Strategy: render as a single rounded-corner clipPath, then fill with rects per band
      var clipId = 'vbar-clip-' + x;
      return [
        '<defs><clipPath id="' + clipId + '">',
          '<rect x="' + x + '" y="' + py(1500) + '" width="' + barW + '" height="' + (py(0) - py(1500)) + '" rx="9" ry="9"/>',
        '</clipPath></defs>',
        '<g clip-path="url(#' + clipId + ')" opacity="' + op + '">',
          '<rect x="' + x + '" y="' + py(1500) + '" width="' + barW + '" height="' + (py(1000) - py(1500)) + '" fill="' + COLORS.hyper + '"/>',
          '<rect x="' + x + '" y="' + py(1000) + '" width="' + barW + '" height="' + (py(800) - py(1000)) + '" fill="' + COLORS.high + '"/>',
          '<rect x="' + x + '" y="' + py(800)  + '" width="' + barW + '" height="' + (py(300) - py(800))  + '" fill="' + COLORS.ideal + '"/>',
          '<rect x="' + x + '" y="' + py(300)  + '" width="' + barW + '" height="' + (py(200) - py(300))  + '" fill="' + COLORS.low + '"/>',
          '<rect x="' + x + '" y="' + py(200)  + '" width="' + barW + '" height="' + (py(0)   - py(200))  + '" fill="' + COLORS.hypo + '"/>',
        '</g>'
      ].join('');
    }
    // Flag-style prediction badge: rect with a triangular notch on the right (pointing into the bar)
    function predictionBadge(value, x, y){
      var badgeW = 38, badgeH = 18;
      return [
        '<g>',
          '<path d="M ' + (x - badgeW + 6) + ' ' + (y - badgeH/2) + ' ',
                  'L ' + x + ' ' + (y - badgeH/2) + ' ',
                  'L ' + (x + 5) + ' ' + y + ' ',
                  'L ' + x + ' ' + (y + badgeH/2) + ' ',
                  'L ' + (x - badgeW + 6) + ' ' + (y + badgeH/2) + ' ',
                  'Q ' + (x - badgeW) + ' ' + (y + badgeH/2) + ' ' + (x - badgeW) + ' ' + (y + badgeH/2 - 5) + ' ',
                  'L ' + (x - badgeW) + ' ' + (y - badgeH/2 + 5) + ' ',
                  'Q ' + (x - badgeW) + ' ' + (y - badgeH/2) + ' ' + (x - badgeW + 6) + ' ' + (y - badgeH/2) + ' Z" ',
                'fill="' + COLORS.ideal + '"/>',
          '<text x="' + (x - badgeW/2 + 2) + '" y="' + (y + 3.5) + '" text-anchor="middle" font-family="Inter" font-size="11" font-weight="800" fill="#fff">' + value + ' µm</text>',
        '</g>'
      ].join('');
    }
    // Pill-style post-op badge: rounded rectangle with right-pointing arrow
    function postopBadge(value, x, y){
      var badgeW = 56, badgeH = 22;
      return [
        '<g>',
          '<path d="M ' + (x + 8) + ' ' + (y - badgeH/2) + ' ',
                  'L ' + (x + 8 + badgeW - 8) + ' ' + (y - badgeH/2) + ' ',
                  'Q ' + (x + 8 + badgeW) + ' ' + (y - badgeH/2) + ' ' + (x + 8 + badgeW) + ' ' + (y - badgeH/2 + 6) + ' ',
                  'L ' + (x + 8 + badgeW) + ' ' + (y + badgeH/2 - 6) + ' ',
                  'Q ' + (x + 8 + badgeW) + ' ' + (y + badgeH/2) + ' ' + (x + 8 + badgeW - 8) + ' ' + (y + badgeH/2) + ' ',
                  'L ' + (x + 8) + ' ' + (y + badgeH/2) + ' ',
                  'L ' + x + ' ' + y + ' Z" ',
                'fill="#0071B0"/>',
          '<text x="' + (x + 8 + badgeW/2) + '" y="' + (y + 4) + '" text-anchor="middle" font-family="Inter" font-size="11" font-weight="800" fill="#fff">' + value + ' µm</text>',
        '</g>'
      ].join('');
    }

    var leftCenter = leftBarX + barW/2;
    var rightCenter = rightBarX + barW/2;
    var axisCenter = leftBarX + barW + axisW/2;

    var parts = [
      '<svg viewBox="0 0 ' + totalW + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" class="po-vault-svg">',
        // Column headers
        '<text x="' + leftCenter + '" y="14" text-anchor="middle" font-family="Inter" font-size="11" font-weight="800" fill="#5A6478" letter-spacing="0.10em">PREDICTION</text>',
        '<text x="' + rightCenter + '" y="14" text-anchor="middle" font-family="Inter" font-size="11" font-weight="800" fill="#5A6478" letter-spacing="0.10em">POST-OP</text>',
        // PREDICTION bar (full opacity)
        buildBands(leftBarX, 1),
        // POST-OP bar (translucent — only the data marker is full-opacity)
        buildBands(rightBarX, 0.18),
        // Y-axis scale (centered between the two bars)
        [1500,1000,900,800,700,600,500,400,300,200,0].map(function(val){
          var y = py(val);
          return '<text x="' + axisCenter + '" y="' + (y+3) + '" text-anchor="middle" font-family="Inter" font-size="11" font-weight="700" fill="#63708A">' + val + '</text>';
        }).join(''),
    ];

    // Prediction range badges — only the LOW end (avoid stacking when range is narrow)
    if (v.predictionRange && v.predictionRange.high != null) {
      parts.push(predictionBadge(v.predictionRange.high, leftBarX, py(v.predictionRange.high)));
    }
    if (v.predictionRange && v.predictionRange.low != null && Math.abs(v.predictionRange.high - v.predictionRange.low) > 60) {
      parts.push(predictionBadge(v.predictionRange.low, leftBarX, py(v.predictionRange.low)));
    }

    // Post-op marker — ONLY when the visit was actually captured
    if (v.captured && v.vault != null) {
      parts.push(postopBadge(v.vault, rightBarX + barW, py(v.vault)));
    }

    parts.push('</svg>');
    return parts.join('');
  })();

  // === Surgical / Post-op data card ===
  // Editable cell — surgeon can type values manually; auto-fill flash class is added when populated by OCT auto-parse.
  function dashedVal(val, unit){
    // Legacy read-only renderer (still used by Surgical Data column for size/position labels)
    return val == null
      ? '<span class="po-dash">—</span>'
      : '<b>' + val + '</b>' + (unit ? '<span class="po-unit">' + unit + '</span>' : '');
  }
  // Editable inline cell value — for the post-op data fields the surgeon needs to type or read.
  function editableVal(val, unit, field){
    var displayVal = val == null ? '' : (typeof val === 'number' ? (Math.abs(val) < 1 ? val.toFixed(2) : val.toString()) : val);
    var hasFlash = v.autoFilled ? ' po-cell-flash' : '';
    return '<span class="po-cell-edit-wrap' + hasFlash + '">' +
      '<input type="text" class="po-cell-edit" value="' + displayVal + '" placeholder="—" ' +
      'aria-label="' + String(field).replace(/[-_]/g, ' ') + ' \u00b7 ' + CURRENT_PT_POSTOP_EYE + ' \u00b7 ' + CURRENT_PT_POSTOP_MS + (unit ? ' (' + unit + ')' : '') + '" ' +
      'onblur="setPostopFieldFromInput(\'' + pt.id + '\',\'' + CURRENT_PT_POSTOP_EYE + '\',\'' + CURRENT_PT_POSTOP_MS + '\',\'' + field + '\',this.value)" ' +
      'onfocus="this.parentElement.classList.remove(\'po-cell-flash\')"/>' +
      (unit ? '<span class="po-cell-unit">' + unit + '</span>' : '') +
    '</span>';
  }
  // Empty-state banner shown above the cards when this milestone hasn't been captured yet
  var notCapturedBanner = '';
  if (!v.captured) {
    notCapturedBanner = [
      '<div class="po-empty-banner">',
        '<div class="po-empty-ic">',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        '</div>',
        '<div class="po-empty-body">',
          '<div class="po-empty-ttl">' + CURRENT_PT_POSTOP_MS + ' visit · not yet captured</div>',
          '<div class="po-empty-sub">Scheduled for <b>' + v.visitDate.toLocaleDateString("en-GB") + '</b>. Click <b>Save visit data</b> below to log measurements' +
            (_evoLocked() ? '.' : ' + earn +20 EVO.') + '</div>',
        '</div>',
      '</div>'
    ].join('');
  }
  var leftDataHtml = [
    notCapturedBanner,
    '<div class="po-data-grid">',
      '<div class="po-data-card">',
        '<div class="po-data-head"><span>SURGICAL DATA</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;color:#63708A;cursor:pointer;"><path d="M12 20h9"/><path d="M16.5 3.5l4 4L7 21H3v-4z"/></svg></div>',
        '<div class="po-implant">',
          '<div class="po-implant-size">',
            '<div class="pis-num">' + v.implantedSize + ' mm</div>',
            '<div class="pis-lbl">Implanted size</div>',
          '</div>',
          '<div class="po-implant-pos">',
            '<div class="pip-lbl">Position:</div>',
            // Real STAAR ICL silhouette — same lens used in the EVO Connect marketplace card (no color bg)
            '<svg viewBox="-245 134 468 294" xmlns="http://www.w3.org/2000/svg" class="po-lens-mini" aria-label="STAAR ICL lens">',
              '<g fill="none" stroke="#08B1C2" stroke-width="6" stroke-linecap="round" stroke-miterlimit="10">',
                '<path d="M216.7,372.7c0,0-0.2-0.2-0.4-0.5c-0.1-0.2-0.3-0.4-0.4-0.5c-2.7-3.7-11.4-17-11.4-38c0-25-0.6-52.8-0.6-52.8s0.6-27.9,0.6-52.8c0-21,8.7-34.3,11.4-38c0.1-0.2,0.3-0.3,0.4-0.5c0.3-0.3,0.4-0.5,0.4-0.5V189c3-4,4.8-9,4.8-14.4c0-13.4-10.9-24.3-24.3-24.3c-98,2.4-144.9-7.8-144.9-7.8l0,0c-16.4-4.2-38.7-6.8-63.2-6.8s-46.8,2.6-63.2,6.8l0,0c0,0-46.9,10.2-144.9,7.8c-13.4,0-24.3,10.9-24.3,24.3c0,5.4,1.8,10.4,4.8,14.4v0.1c0,0,0.2,0.2,0.4,0.5c0.1,0.2,0.3,0.4,0.4,0.5c2.7,3.7,11.4,17,11.4,38c0,25,0.6,52.8,0.6,52.8s-0.6,27.9-0.6,52.8c0,21-8.7,34.3-11.4,38c-0.1,0.2-0.3,0.3-0.4,0.5c-0.3,0.3-0.4,0.5-0.4,0.5v0.1c-3,4-4.8,9-4.8,14.4c0,13.4,10.9,24.3,24.3,24.3c98-2.4,144.9,7.8,144.9,7.8l0,0c16.4,4.2,38.7,6.8,63.2,6.8s46.8-2.6,63.2-6.8l0,0c0,0,46.9-10.2,144.9-7.8c13.4,0,24.3-10.9,24.3-24.3C221.5,381.8,219.7,376.8,216.7,372.7L216.7,372.7z"/>',
                '<circle cx="-218.2" cy="172.7" r="8"/>',
                '<circle cx="197.8" cy="389.2" r="8"/>',
                '<circle cx="-11" cy="280.8" r="111.9"/>',
                '<path d="M146.3,150.3c29.4,35.4,47.1,80.9,47.1,130.6c0,49.4-17.5,94.7-46.7,130"/>',
                '<path d="M-168.3,411.4c-29.4-35.4-47.1-80.9-47.1-130.6c0-49.4,17.5-94.7,46.7-130"/>',
              '</g>',
            '</svg>',
            '<div class="pip-orientation">Horizontal</div>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="po-data-card">',
        '<div class="po-data-head"><span>POST-OP DATA</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;color:#63708A;cursor:pointer;"><path d="M12 20h9"/><path d="M16.5 3.5l4 4L7 21H3v-4z"/></svg></div>',
        '<div class="po-pop-section"><div class="po-pop-section-lbl">VAULT</div>',
          '<div class="po-cell-row">',
            '<div class="po-cell po-cell-lg"><div class="po-cell-k">CENTRAL</div><div class="po-cell-v">' + editableVal(v.vault, 'µm', 'vault') + '</div></div>',
          '</div>',
          '<div class="po-cell-row">',
            '<div class="po-cell"><div class="po-cell-k">TEMPORAL</div><div class="po-cell-v">' + editableVal(null, 'µm', 'vaultTemporal') + '</div></div>',
            '<div class="po-cell"><div class="po-cell-k">NASAL</div><div class="po-cell-v">' + editableVal(null, 'µm', 'vaultNasal') + '</div></div>',
          '</div>',
        '</div>',
        '<div class="po-pop-section"><div class="po-pop-section-lbl">ANGLE</div>',
          '<div class="po-cell-row">',
            '<div class="po-cell"><div class="po-cell-k">TEMPORAL</div><div class="po-cell-v">' + editableVal(v.temporalAngle, '°', 'temporalAngle') + '</div></div>',
            '<div class="po-cell"><div class="po-cell-k">NASAL</div><div class="po-cell-v">' + editableVal(v.nasalAngle, '°', 'nasalAngle') + '</div></div>',
          '</div>',
        '</div>',
        '<div class="po-pop-section"><div class="po-pop-section-lbl">PUPIL</div>',
          '<div class="po-cell-row">',
            '<div class="po-cell"><div class="po-cell-k">DIAMETER</div><div class="po-cell-v">' + editableVal(v.pupilDiam, 'mm', 'pupilDiam') + '</div></div>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="po-vault-viz">' + vaultSvg + '</div>',
    '</div>',
    '<div class="po-data-card po-residual">',
      '<div class="po-data-head"><span>RESIDUAL REFRACTION</span></div>',
      '<div class="po-cell-row">',
        '<div class="po-cell po-cell-lg"><div class="po-cell-k">UCVA</div><div class="po-cell-v">' + editableVal(v.ucva, '', 'ucva') + '</div></div>',
      '</div>',
      '<div class="po-cell-row">',
        '<div class="po-cell"><div class="po-cell-k">SPHERE</div><div class="po-cell-v">' + editableVal(v.sphereRes, 'D', 'sphereRes') + '</div></div>',
        '<div class="po-cell"><div class="po-cell-k">CYLINDER</div><div class="po-cell-v">' + editableVal(v.cylinderRes, 'D', 'cylinderRes') + '</div></div>',
        '<div class="po-cell"><div class="po-cell-k">AXIS</div><div class="po-cell-v">' + editableVal(v.axisRes, '°', 'axisRes') + '</div></div>',
        '<div class="po-cell"><div class="po-cell-k">BCVA</div><div class="po-cell-v">' + editableVal(v.bcva, '', 'bcva') + '</div></div>',
      '</div>',
    '</div>',
    '<details class="po-calc-expander">',
      '<summary><span>Calculations <b>(2)</b></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="6 9 12 15 18 9"/></svg></summary>',
      '<div class="po-calc-list">',
        '<div class="po-calc-item"><div><b>ICL Guru · T2</b><div class="po-calc-sub">Selected · ' + v.implantedSize + ' mm · vault target ~' + Math.round((v.predictionRange.low + v.predictionRange.high)/2) + ' µm</div></div><div class="po-calc-date">' + (pt.surgeryDate || 'Mar 28, 2026') + '</div></div>',
        '<div class="po-calc-item"><div><b>STAAR Nomogram</b><div class="po-calc-sub">Reference · ' + (parseFloat(v.implantedSize) + 0.5).toFixed(1) + ' mm · size only</div></div><div class="po-calc-date">' + (pt.surgeryDate || 'Mar 28, 2026') + '</div></div>',
      '</div>',
    '</details>',
    // Save-visit CTA — explicit gamification trigger for the post-op data log
    '<button type="button" class="po-save-btn" onclick="logPostopVisit(\'' + pt.id + '\',\'' + CURRENT_PT_POSTOP_MS + '\',\'' + CURRENT_PT_POSTOP_EYE + '\')">',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
      ' Save visit data',
      (_evoLocked() ? '' : '<span class="po-save-evo">+20 EVO</span>'),
    '</button>'
  ].join('');

  // === Right column: OCT scan (real Optovue, eye-aware, prefers attached scan) + import controls ===
  var octImg = resolveOctImage(CURRENT_PT_POSTOP_EYE, pt.id);
  // Show the OCT image whenever it exists (an attachment OR captured visit) — not just when captured
  var hasAttachedOct = !!(typeof PT_PREOP_DATA !== 'undefined' && PT_PREOP_DATA[pt.id] &&
    (PT_PREOP_DATA[pt.id].attachments || []).some(function(a){ return a.type === 'OCT' && (a.eye === CURRENT_PT_POSTOP_EYE || a.eye === 'BOTH'); }));
  var showOctImage = v.captured || hasAttachedOct;
  // Re-use the pre-op attach modal for OCT — re-purposes the EHR-or-device flow built for pre-op,
  // but stamps the resulting attachment onto this patient's pre-op store so the post-op visit sees it next render.
  var rightImgHtml = [
    '<div class="po-image-card">',
      '<div class="po-image-head">',
        '<div><b>AS-OCT</b><div class="po-image-sub">Optovue · ' + CURRENT_PT_POSTOP_EYE + ' · ID: ' + (pt.id) + '</div></div>',
        '<div class="po-image-actions">',
          '<button class="po-img-import-btn" type="button" onclick="openPreopAttachModal(\'' + pt.id + '\',\'OCT\')" title="Import OCT scan from EHR or device">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
            ' Import scan',
          '</button>',
          '<div class="po-image-meta">Exam: ' + v.visitDate.toISOString().slice(0,10) + ' · ' + v.visitTime + '</div>',
        '</div>',
      '</div>',
      '<div class="po-image-body">',
        showOctImage
          ? '<img src="' + octImg.url + '" alt="AS-OCT scan ' + CURRENT_PT_POSTOP_EYE + '" class="po-oct-img" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>'
          : '',
        '<div class="po-img-fallback" style="' + (showOctImage ? 'display:none;' : 'display:flex;') + 'flex-direction:column;align-items:center;gap:10px;color:#C9D6E6;padding:40px;">',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
          '<div style="font-size:13px;font-weight:700;text-align:center;">No OCT scan attached yet</div>',
          '<div style="font-size:11px;color:#AFC0D4;text-align:center;max-width:300px;line-height:1.5;">Click <b>Import scan</b> above to bring it from the EHR or upload from this device.</div>',
        '</div>',
      '</div>',
      '<div class="po-image-foot">',
        '<span>Clinic Info: EVO Connect · ' + patientSurgeon(pt).clinic + '</span>',
        '<span>' + v.visitDate.toLocaleDateString('en-GB') + ' ' + v.visitTime + ' (Page 1/1)</span>',
      '</div>',
    '</div>'
  ].join('');

  return [
    '<div class="pd-section po-section">',
      // Top: Eye picker tabs
      '<div class="po-eye-tabs">' + eyeTabsHtml + '</div>',
      // Section title with cyan accent
      '<div class="po-title">Post-op</div>',
      preSurgeryNote,
      // Context strip
      contextStrip,
      // Bio + IOL
      bioStrip,
      // Sub-header + visit date
      '<div class="po-visit-head">',
        '<span class="po-visit-lbl">Visit</span>',
        '<span class="po-visit-date"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' + v.visitDate.toLocaleDateString('en-GB') + ' · ' + v.visitTime + '</span>',
      '</div>',
      // Main two-column grid
      '<div class="po-main-grid">',
        '<div class="po-left">' + leftDataHtml + '</div>',
        '<div class="po-right">' + rightImgHtml + '</div>',
      '</div>',
      // Vault evolution + eye photo — side-by-side in a 2-col grid to reduce scroll
      '<div class="po-bottom-grid">',
        renderPostopVaultEvolution(pt),
        renderPostopEyePhotoSection(pt),
      '</div>',
    '</div>'
  ].join('');
}
