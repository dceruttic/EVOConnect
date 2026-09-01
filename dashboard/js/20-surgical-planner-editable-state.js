// === Surgical Planner editable state ===
// Stores user-chosen plan values per patient. When the patient is past planner stage
// (Surgery / Post-op), the checklist auto-fills as already validated.
window.PT_PLANNER_DATA = window.PT_PLANNER_DATA || {};
const PLANNER_CHECK_ITEMS = [
  { key: 'consent',      lbl: 'Informed consent signed', val: 'Apr 10' },
  { key: 'fasting',      lbl: 'Fasting instructions',    val: '6h pre-op' },
  { key: 'dilation',     lbl: 'Dilation plan',           val: 'Tropicamide + phenylephrine' },
  { key: 'antibiotic',   lbl: 'Antibiotic prophylaxis',  val: 'Moxifloxacin 0.5%' },
  { key: 'lensReceived', lbl: 'Lens received in clinic', val: 'Received Apr 16' },
  { key: 'crossCheck',   lbl: 'Lot + eye cross-check',   val: 'Verified' },
];
function _plannerDefaults(pt){
  const r = patientLensReco(pt);
  const surg = patientSurgeon(pt);
  const lot = 'LOT-' + pt.id.slice(-4) + '-' + String.fromCharCode(65 + (ptSeed(pt.id,51)%6));
  // Only auto-validate checks if surgery has actually happened (Surgery or Post-op stage).
  // For Sizing / Scheduled stages the user wants a fresh editable form.
  var surgeryDone = (pt.stage === 'Surgery' || pt.stage === 'Post-op');
  // Pre-fill date/time/OR with sensible defaults if patient is already scheduled OR past it
  var preFillSlot = (pt.stage === 'Scheduled' || surgeryDone);
  return {
    surgeon: surg.name,
    surgeryDate: preFillSlot ? '2026-05-08' : '',
    surgeryTime: preFillSlot ? '08:30' : '',
    or: preFillSlot ? 'OR-2' : '',
    lensModel: r.model,
    lensPower: r.power,
    lensSize: r.size,
    lot: lot,
    incisionAxis: (90 + Math.round(ptRand(pt.id,42,-20,20))),
    anesthesia: 'Topical · lidocaine 1%',
    duration: (13 + Math.round(ptRand(pt.id,43,-2,5))),
    counselingNotes: 'Counsel explicitly on: first-month halo/glare, dry-eye transition, vault 1-month stabilization. Schedule D14 night-vision PROM if mesopic pupil ≥ 6 mm. Patient advised to bring someone to drive them home post-op.',
    checks: {
      consent:      surgeryDone,
      fasting:      surgeryDone,
      dilation:     surgeryDone,
      antibiotic:   surgeryDone,
      lensReceived: surgeryDone,
      crossCheck:   surgeryDone,
    }
  };
}
function getPlannerData(pt){
  if (!PT_PLANNER_DATA[pt.id]) PT_PLANNER_DATA[pt.id] = _plannerDefaults(pt);
  return PT_PLANNER_DATA[pt.id];
}
function setPlannerField(ptId, field, value){
  PT_PLANNER_DATA[ptId] = PT_PLANNER_DATA[ptId] || {};
  PT_PLANNER_DATA[ptId][field] = value;
}
function togglePlannerCheck(ptId, key){
  var d = PT_PLANNER_DATA[ptId];
  if (!d) return;
  d.checks = d.checks || {};
  d.checks[key] = !d.checks[key];
  _refreshPlannerChecklist(ptId);
}
function checkAllPlanner(ptId){
  var d = PT_PLANNER_DATA[ptId];
  if (!d) return;
  d.checks = d.checks || {};
  PLANNER_CHECK_ITEMS.forEach(function(it){ d.checks[it.key] = true; });
  _refreshPlannerChecklist(ptId);
  if (typeof showToast === 'function') showToast('All pre-op items validated');
}
function clearAllPlanner(ptId){
  var d = PT_PLANNER_DATA[ptId];
  if (!d) return;
  d.checks = d.checks || {};
  PLANNER_CHECK_ITEMS.forEach(function(it){ d.checks[it.key] = false; });
  _refreshPlannerChecklist(ptId);
}
function _refreshPlannerChecklist(ptId){
  var pt = (DATA.patients||[]).find(function(p){ return p.id === ptId; });
  if (!pt) return;
  var node = document.getElementById('planChecklist');
  if (!node) return;
  var wrap = document.createElement('div');
  wrap.innerHTML = renderPlannerChecklist(pt);
  var fresh = wrap.firstElementChild;
  if (fresh) node.replaceWith(fresh);
}
function renderPlannerChecklist(pt){
  var d = getPlannerData(pt);
  var checks = d.checks || {};
  var done = PLANNER_CHECK_ITEMS.filter(function(it){ return !!checks[it.key]; }).length;
  var total = PLANNER_CHECK_ITEMS.length;
  var allDone = (done === total);
  var items = PLANNER_CHECK_ITEMS.map(function(it){
    var on = !!checks[it.key];
    var cls = on ? 'check-item toggle pass' : 'check-item toggle todo';
    var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
    var val = on ? it.val : 'Pending';
    return '<div class="' + cls + '" onclick="togglePlannerCheck(\'' + pt.id + '\',\'' + it.key + '\')">'
         +   '<div class="ico">' + icon + '</div>'
         +   '<div class="lbl">' + it.lbl + '</div>'
         +   '<div class="val">' + val + '</div>'
         + '</div>';
  }).join('');
  return [
    '<div id="planChecklist" class="pd-section">',
      '<div class="checklist-head">',
        '<div><span class="ck-title">Pre-op checklist</span><span class="ck-progress">' + done + ' / ' + total + ' validated</span></div>',
        '<div class="ck-actions">',
          (done > 0 ? '<button type="button" class="ck-btn ck-btn-ghost" onclick="clearAllPlanner(\'' + pt.id + '\')">Reset</button>' : ''),
          '<button type="button" class="ck-btn" ' + (allDone ? 'disabled style="opacity:.5;cursor:default"' : 'onclick="checkAllPlanner(\'' + pt.id + '\')"') + '>',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
            '<span>' + (allDone ? 'All validated' : 'Check all') + '</span>',
          '</button>',
        '</div>',
      '</div>',
      '<div class="check-list">' + items + '</div>',
    '</div>'
  ].join('');
}

function renderPtPlanner(pt) {
  const d = getPlannerData(pt);
  const planStatus = (pt.stage === 'Scheduled' || pt.stage === 'Surgery' || pt.stage === 'Post-op') ? 'Finalized' : 'Draft — choose values';
  const surgeonOptions = SURGEON_POOL.map(function(s){
    return '<option value="' + s.name + '"' + (s.name === d.surgeon ? ' selected' : '') + '>' + s.name + '</option>';
  }).join('');
  const orOptions = ['OR-1','OR-2','OR-3','OR-4'].map(function(o){
    return '<option value="' + o + '"' + (o === d.or ? ' selected' : '') + '>' + o + '</option>';
  }).join('');
  const anesthOptions = ['Topical · lidocaine 1%','Topical · proparacaine','Peribulbar block','Sub-Tenon block'].map(function(o){
    return '<option value="' + o + '"' + (o === d.anesthesia ? ' selected' : '') + '>' + o + '</option>';
  }).join('');
  const lensModels = ['EVO ICL','EVO+ ICL','EVO Toric ICL','EVO+ Toric ICL'].map(function(o){
    return '<option value="' + o + '"' + (o === d.lensModel ? ' selected' : '') + '>' + o + '</option>';
  }).join('');
  return `
    <div class="pd-section">
      <h4>Surgery plan <span class="tag">${planStatus}</span></h4>
      <div class="pd-surgplan">
        <div class="sp-row sp-edit">
          <div class="sp-k">Surgeon</div>
          <select class="sp-select" onchange="setPlannerField('${pt.id}','surgeon',this.value)">${surgeonOptions}</select>
        </div>
        <div class="sp-row sp-edit sp-row-2col">
          <div class="sp-sub">
            <div class="sp-k">Surgery date</div>
            <input class="sp-input" type="date" value="${d.surgeryDate}" onchange="setPlannerField('${pt.id}','surgeryDate',this.value)"/>
          </div>
          <div class="sp-sub">
            <div class="sp-k">Time</div>
            <input class="sp-input" type="time" value="${d.surgeryTime}" onchange="setPlannerField('${pt.id}','surgeryTime',this.value)"/>
          </div>
        </div>
        <div class="sp-row sp-edit">
          <div class="sp-k">OR</div>
          <select class="sp-select" onchange="setPlannerField('${pt.id}','or',this.value)">
            <option value="">— select —</option>${orOptions}
          </select>
        </div>
        <div class="sp-row sp-edit sp-row-2col" style="grid-template-columns:1.4fr .9fr .8fr;">
          <div class="sp-sub">
            <div class="sp-k">Lens model</div>
            <select class="sp-select" onchange="setPlannerField('${pt.id}','lensModel',this.value)">${lensModels}</select>
          </div>
          <div class="sp-sub">
            <div class="sp-k">Power (D)</div>
            <input class="sp-input" type="text" value="${d.lensPower}" onchange="setPlannerField('${pt.id}','lensPower',this.value)"/>
          </div>
          <div class="sp-sub">
            <div class="sp-k">Size (mm)</div>
            <input class="sp-input" type="text" value="${d.lensSize}" onchange="setPlannerField('${pt.id}','lensSize',this.value)"/>
          </div>
        </div>
        <div class="sp-row sp-edit">
          <div class="sp-k">Lot</div>
          <input class="sp-input" type="text" value="${d.lot}" onchange="setPlannerField('${pt.id}','lot',this.value)"/>
        </div>
        <div class="sp-row sp-edit">
          <div class="sp-k">Incision axis (°)</div>
          <input class="sp-input" type="number" min="0" max="180" value="${d.incisionAxis}" onchange="setPlannerField('${pt.id}','incisionAxis',this.value)"/>
        </div>
        <div class="sp-row sp-edit">
          <div class="sp-k">Anesthesia</div>
          <select class="sp-select" onchange="setPlannerField('${pt.id}','anesthesia',this.value)">${anesthOptions}</select>
        </div>
        <div class="sp-row sp-edit">
          <div class="sp-k">Estimated duration (min/eye)</div>
          <input class="sp-input" type="number" min="5" max="60" value="${d.duration}" onchange="setPlannerField('${pt.id}','duration',this.value)"/>
        </div>
      </div>
    </div>
    ${renderPlannerChecklist(pt)}
    <div class="pd-section">
      <h4>Counseling notes</h4>
      <textarea class="pd-counseling-edit" oninput="setPlannerField('${pt.id}','counselingNotes',this.value)" placeholder="Add counseling reminders, patient considerations, post-op driver arrangements…">${d.counselingNotes}</textarea>
    </div>
    ${renderStageAdvanceCta(pt, 'planner')}
  `;
}

function renderPtSurgery(pt) {
  const r = patientLensReco(pt);
  const b = patientBiometry(pt);
  const lot = `LOT-${pt.id.slice(-4)}-${String.fromCharCode(65 + (ptSeed(pt.id,51)%6))}`;
  const isDone = pt.stage === "Post-op";
  const isScheduled = pt.stage === "Scheduled";
  const isInSurgery = pt.stage === "Surgery";

  if (!isDone && !isScheduled && !isInSurgery) {
    return `
      <div class="pd-empty">
        <svg class="e-ic" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2l2 4h-4l2-4zM6 9l-3 3 3 3M18 9l3 3-3 3M2 12h20M12 14v8"/></svg>
        <div><b>Surgery not yet planned</b></div>
        <div style="margin-top:4px;font-size:12px">The OR screen activates once sizing is confirmed and the lens is scheduled. Current stage: <b>${pt.stage}</b>.</div>
      </div>
    `;
  }

  // --- ICL surgery variables derived from patient data ---
  // Real ICL Guru report overrides the generic computation
  let powerNum, cylVal, axis, isToric, length;
  if (pt.iclGuru) {
    const ip = pt.iclGuru.iolPower;
    powerNum = ip.sphere;
    cylVal   = Math.abs(ip.cyl);
    axis     = ip.axis;
    isToric  = Math.abs(ip.cyl) >= 0.5;
    length   = parseFloat((pt.iclGuru.sizing.find(s => s.selected) || pt.iclGuru.sizing[0]).size);
  } else {
    powerNum  = parseFloat(String(pt.power).split('/')[0]) || -8;
    cylVal    = parseFloat((Math.abs(ptRand(pt.id, 55, 0, 2.0))).toFixed(2));
    axis      = [0, 90, 180][ptSeed(pt.id, 57) % 3];
    isToric   = cylVal >= 0.75;
    length    = parseFloat(r.size);
  }
  const powerStr  = powerNum.toFixed(2);
  const cylStr    = cylVal.toFixed(2);
  const cylSign   = '+';
  const position  = (axis >= 70 && axis <= 110) ? 'Vertical' : 'Horizontal';
  const target    = '+0.00';
  const resSph    = (Math.abs(ptRand(pt.id, 60, 0, 0.35))).toFixed(2);
  const resCyl    = (Math.abs(ptRand(pt.id, 61, 0, 0.5))).toFixed(2);
  const resAxis   = 10 + ptSeed(pt.id, 62) % 170;
  const residual  = `+${resSph} +${resCyl} x ${resAxis}°`;
  const eye       = (pt.eye.split('/')[0] || 'OD').trim();
  const firstName = pt.name.split(' ').slice(-1)[0] || 'Patient';
  const nickname  = firstName;
  const procDate  = isDone ? '18/04/2026' : '08/05/2026';
  // STAAR EVO / Visian ICL model codes (real catalog):
  //   ICMV5   = EVO Visian Myopic
  //   ICMTV5  = EVO Visian Myopic Toric
  //   ICHV5   = EVO Visian Hyperopic
  //   ICHTV5  = EVO Visian Hyperopic Toric
  const model     = isToric ? 'STAAR ICMTV5' : 'STAAR ICMV5';
  // Toric rotation marker positions (lens has alignment dots near haptic eyelets)
  const markA = axis === 90 ? 183 : 93;
  const markB = axis === 90 ? 190 : 100;
  // Realistic ICL sizing measurements
  const WTW = b.WTW.v.toFixed(2);
  const ATA = (b.WTW.v - 0.15).toFixed(2);
  const STS = (b.WTW.v + 0.3).toFixed(2);
  const ACD = b.ACD.v.toFixed(2);
  const ANG_nasal = 34 + Math.round(ptRand(pt.id, 70, -3, 8));
  const ANG_temp  = 42 + Math.round(ptRand(pt.id, 71, -4, 10));
  const CLR = 170 + Math.round(ptRand(pt.id, 41, -50, 80));

  // Remarks (realistic intra-op reminders)
  const remarks = [];
  if (pt.risk && pt.risk.level === 'high') remarks.push('VIP · high-risk case');
  if (isToric) remarks.push('Toric · verify axis before unfold');
  if (b.ACD.v < 3.2) remarks.push('Shallow ACD · careful manipulation');
  if (parseFloat(WTW) < 11.5) remarks.push('Small WTW · consider 12.1');
  remarks.push("Iridectomy at 12 o'clock");
  if (b.Pupil.v > 6) remarks.push('Large mesopic pupil · counsel halos');
  while (remarks.length < 4) remarks.push('Standard STAAR IFU protocol');
  remarks.length = Math.min(remarks.length, 5);

  // === ICL surgical alignment compass — user-provided vectorized reference ===
  const eyeDiagramImg = `
    <div class="or-eye-img-wrap">
      <img src="../assets/surgery_axis_compass.svg" alt="ICL toric axis alignment — ${markA}° / ${markB}°" class="or-eye-img"/>
    </div>
  `;
  const eyeDiagram = (() => {
    // Canvas — extra space top + bottom so badges sit OUTSIDE the field circle as in the reference
    const W = 600, H = 620, CX = 300, CY = 310, R = 195;

    // === Top magenta badge (axis 93° — top end of axis line) ===
    // Reference: badge sits OUTSIDE field at top, half-disc shape (flat bottom), slightly RIGHT of straight-up
    const topAng = 93;                                // shown in the badge label
    const topOffset = (topAng - 90) * 4;              // visual offset from straight-up
    const topBadgeCX = CX + topOffset;
    const topBadgeCY = CY - R - 24;                   // 24 px above the rim

    // === Bottom orange badge (axis 100° — opposite end of axis line) ===
    const botAng = 100;
    const botOffset = (botAng - 90) * 4;
    const botBadgeCX = CX + botOffset;
    const botBadgeCY = CY + R + 18;

    return `
      <svg class="or-eye-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif">

        <!-- ============== Light gray circular field ============== -->
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="#E5E7EC"/>

        <!-- ============== Cardinal labels & degree numbers ============== -->
        <!-- N (left) with small "180" -->
        <text x="${CX - R - 70}" y="${CY + 8}" text-anchor="middle" font-size="22" font-weight="900" fill="#0F1D40">N</text>
        <text x="${CX - R - 38}" y="${CY + 6}" text-anchor="middle" font-size="11" fill="#6C6278" font-weight="600">180</text>
        <!-- T (right) with small "0" -->
        <text x="${CX + R + 60}" y="${CY + 8}" text-anchor="middle" font-size="22" font-weight="900" fill="#0F1D40">T</text>
        <text x="${CX + R + 30}" y="${CY + 6}" text-anchor="middle" font-size="11" fill="#6C6278" font-weight="600">0</text>
        <!-- S (bottom) with small "90" above it -->
        <text x="${CX}" y="${CY + R + 76}" text-anchor="middle" font-size="22" font-weight="900" fill="#0F1D40">S</text>
        <text x="${CX}" y="${CY + R + 50}" text-anchor="middle" font-size="11" fill="#6C6278" font-weight="600">90</text>
        <!-- Top "90" tiny label -->
        <text x="${CX}" y="${CY - R - 50}" text-anchor="middle" font-size="11" fill="#6C6278" font-weight="600">90</text>
        <!-- 4 diagonal numerical labels -->
        <text x="${CX - R*0.78}" y="${CY - R*0.78}" text-anchor="end"   font-size="12" fill="#6C6278" font-weight="600">135</text>
        <text x="${CX + R*0.78}" y="${CY - R*0.78}" text-anchor="start" font-size="12" fill="#6C6278" font-weight="600">45</text>
        <text x="${CX - R*0.78}" y="${CY + R*0.78 + 10}" text-anchor="end"   font-size="12" fill="#6C6278" font-weight="600">45</text>
        <text x="${CX + R*0.78}" y="${CY + R*0.78 + 10}" text-anchor="start" font-size="12" fill="#6C6278" font-weight="600">135</text>

        <!-- ============== ICL lens silhouette (centered, horizontal) ============== -->
        <g transform="translate(${CX} ${CY})">
          <!-- OUTER pillow with 4 corner notches (small concave dips at NE/NW/SE/SW corners).
               Drawn clockwise starting from top-left edge. -->
          <path d="
            M -100 -60
            L  -50 -60
            A 8 8 0 0 0 -34 -60
            L   34 -60
            A 8 8 0 0 0  50 -60
            L  100 -60
            Q  120 -60 120 -40
            L  120 -20
            A 8 8 0 0 0 120  -4
            L  120   4
            A 8 8 0 0 0 120  20
            L  120  40
            Q  120  60 100  60
            L   50  60
            A 8 8 0 0 0  34  60
            L  -34  60
            A 8 8 0 0 0 -50  60
            L -100  60
            Q -120  60 -120 40
            L -120  20
            A 8 8 0 0 0 -120   4
            L -120  -4
            A 8 8 0 0 0 -120 -20
            L -120 -40
            Q -120 -60 -100 -60
            Z"
            fill="#FFFFFF" stroke="#0F2E5C" stroke-width="2.6" stroke-linejoin="round"/>

          <!-- INNER ridge (parallel inset, same notched contour) -->
          <path d="
            M -90 -50
            L  -45 -50
            A 6 6 0 0 0 -32 -50
            L   32 -50
            A 6 6 0 0 0  45 -50
            L   90 -50
            Q  108 -50 108 -34
            L  108 -16
            A 6 6 0 0 0 108  -4
            L  108   4
            A 6 6 0 0 0 108  16
            L  108  34
            Q  108  50  90  50
            L   45  50
            A 6 6 0 0 0  32  50
            L  -32  50
            A 6 6 0 0 0 -45  50
            L  -90  50
            Q -108  50 -108  34
            L -108  16
            A 6 6 0 0 0 -108   4
            L -108  -4
            A 6 6 0 0 0 -108 -16
            L -108 -34
            Q -108 -50 -90 -50
            Z"
            fill="none" stroke="#0F2E5C" stroke-width="1.4"/>

          <!-- Central optic zone (large circle) -->
          <circle cx="0" cy="0" r="42" fill="none" stroke="#0F2E5C" stroke-width="1.6"/>

          <!-- 2 alignment dots (asymmetric, like real toric reference marks) -->
          <circle cx="-58" cy="36" r="3" fill="#0F2E5C"/>
          <circle cx="58"  cy="-36" r="3" fill="#0F2E5C"/>
        </g>

        <!-- ============== Red horizontal axis bar (full width, behind the lens but on top of field) ============== -->
        <rect x="${CX - R - 30}" y="${CY - 10}" width="${2*R + 60}" height="20" fill="#D93A4A" rx="2"/>

        <!-- Central 0° red disc on top of axis bar -->
        <circle cx="${CX}" cy="${CY}" r="38" fill="#D93A4A" stroke="#fff" stroke-width="3"/>
        <text x="${CX}" y="${CY + 8}" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">0°</text>

        <!-- ============== TOP magenta 93° badge ============== -->
        <g>
          <!-- Dashed orange arc just below the badge, INSIDE the field rim -->
          <path d="M ${CX - 30} ${CY - R + 10} Q ${CX + topOffset} ${CY - R + 0} ${CX + topOffset + 50} ${CY - R + 10}"
                stroke="#E8A44B" stroke-width="6" stroke-dasharray="6 6" fill="none" stroke-linecap="round"/>
          <!-- Half-disc badge (flat bottom, rounded top) -->
          <path d="M ${topBadgeCX - 28} ${topBadgeCY + 6}
                   A 28 28 0 1 1 ${topBadgeCX + 28} ${topBadgeCY + 6}
                   Z"
                fill="#7A1E36"/>
          <text x="${topBadgeCX}" y="${topBadgeCY + 1}" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">${topAng}°</text>
          <!-- "2.8" sub-flag (trapezoid, narrow top, wider bottom) just below the dashed arc -->
          <path d="M ${CX + topOffset - 18} ${CY - R + 30}
                   L ${CX + topOffset + 18} ${CY - R + 30}
                   L ${CX + topOffset + 22} ${CY - R + 56}
                   L ${CX + topOffset - 22} ${CY - R + 56} Z"
                fill="#7A1E36"/>
          <text x="${CX + topOffset}" y="${CY - R + 50}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">2.8</text>
        </g>

        <!-- ============== BOTTOM orange 100° badge ============== -->
        <g>
          <!-- Dashed orange arc just above the badge, INSIDE the field rim -->
          <path d="M ${CX + botOffset - 50} ${CY + R - 10} Q ${CX + botOffset} ${CY + R} ${CX + botOffset + 30} ${CY + R - 10}"
                stroke="#E8A44B" stroke-width="6" stroke-dasharray="6 6" fill="none" stroke-linecap="round"/>
          <!-- Half-disc badge (flat top, rounded bottom) -->
          <path d="M ${botBadgeCX - 28} ${botBadgeCY - 6}
                   A 28 28 0 1 0 ${botBadgeCX + 28} ${botBadgeCY - 6}
                   Z"
                fill="#E8A44B"/>
          <text x="${botBadgeCX}" y="${botBadgeCY + 8}" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">${botAng}°</text>
        </g>

      </svg>
    `;
  })();

  const timelineHtml = isDone ? `
    <div class="pd-section" style="margin-top:14px">
      <h4>OR capture · timestamps <span class="tag">completed</span></h4>
      <div class="pd-surgplan or-timestamps">
        <div class="sp-row"><div class="sp-k">OR entry</div><div class="sp-v">08:42:11</div></div>
        <div class="sp-row"><div class="sp-k">Topical anesthesia</div><div class="sp-v">08:44:30</div></div>
        <div class="sp-row"><div class="sp-k">Incision</div><div class="sp-v">08:46:02</div></div>
        <div class="sp-row"><div class="sp-k">ICL loaded</div><div class="sp-v">08:47:15</div></div>
        <div class="sp-row"><div class="sp-k">ICL in place</div><div class="sp-v">08:48:04</div></div>
        <div class="sp-row"><div class="sp-k">Closure</div><div class="sp-v">08:49:10</div></div>
        <div class="sp-row"><div class="sp-k">Lot scanned</div><div class="sp-v" style="color:var(--green)">${lot} ✓</div></div>
        <div class="sp-row"><div class="sp-k">Complications</div><div class="sp-v" style="color:var(--green)">None</div></div>
      </div>
    </div>
  ` : '';

  return `
    <div class="or-screen">
      <div class="or-topbar">
        <span class="or-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10a7 7 0 00-13.3-2A5 5 0 007 19h13a4 4 0 000-8z"/></svg> All data saved</span>
        <button class="or-calc-btn">Calculus</button>
      </div>

      <div class="or-grid">
        <div class="or-col-left">
          <div class="or-col-head"><h3>Surgery</h3><span class="or-help">?</span></div>

          <div class="or-card">
            <div class="or-card-h">Calculated</div>
            <div class="or-kv"><span>Target</span><b>${target}</b></div>
            <div class="or-kv"><span>Residual Sph</span><b>${residual}</b></div>
          </div>

          <div class="or-card">
            <div class="or-card-h">Procedure</div>
            <div class="or-kv"><span>Toric</span><b>${isToric ? 'Yes' : 'No'}</b></div>
            <div class="or-kv"><span>Lens</span><b>${r.model.replace('STAAR ','')}</b></div>
            <div class="or-kv"><span>Model</span><b>${model}</b></div>
            <div class="or-kv"><span>Background</span><b>Phakic</b></div>
            <div class="or-kv"><span>Rationale</span><b>${pt.risk && pt.risk.level !== 'low' ? 'High myopia + risk flag' : 'Refractive error'}</b></div>
            <div class="or-kv"><span>WTW Topo</span><b>${WTW}</b></div>
            <div class="or-kv"><span>ATA</span><b>${ATA} mm</b></div>
            <div class="or-kv"><span>ACD</span><b>${ACD} mm</b></div>
            <div class="or-kv"><span>ANG</span><b>${ANG_nasal}° / ${ANG_temp}°</b></div>
            <div class="or-kv"><span>STS</span><b>${STS} mm</b></div>
            <div class="or-kv"><span>CLR</span><b>${CLR} µm</b></div>
          </div>

          <div class="or-card">
            <div class="or-card-h">Refraction</div>
            <div class="or-kv"><span>RX</span><b>${powerStr} ${cylSign}${cylStr} x ${axis}°</b></div>
            <div class="or-kv"><span>CYL</span><b>+${Math.max(0, (cylVal - 0.5)).toFixed(2)} +${cylStr} x ${axis === 0 ? 90 : 0}°</b></div>
          </div>

          <div class="or-card">
            <div class="or-card-h">Studies <span class="or-studies-meta">· 6 available</span></div>
            <div class="or-studies-grid">
              <button class="or-study" onclick="openStudyModal('topo','${pt.id}')" title="Placido topography">
                <div class="or-study-thumb">${studyThumb('topo', pt.id)}</div>
                <div class="or-study-lbl">Topography</div>
                <div class="or-study-sub">Pentacam · ${ATA} ATA</div>
              </button>
              <button class="or-study" onclick="openStudyModal('oct','${pt.id}')" title="Anterior segment OCT">
                <div class="or-study-thumb">${studyThumb('oct', pt.id)}</div>
                <div class="or-study-lbl">AS-OCT</div>
                <div class="or-study-sub">Angle + ACD ${ACD}</div>
              </button>
              <button class="or-study" onclick="openStudyModal('biom','${pt.id}')" title="IOL Master biometry">
                <div class="or-study-thumb">${studyThumb('biom', pt.id)}</div>
                <div class="or-study-lbl">Biometry</div>
                <div class="or-study-sub">IOLMaster 700</div>
              </button>
              <button class="or-study" onclick="openStudyModal('spec','${pt.id}')" title="Specular microscopy">
                <div class="or-study-thumb">${studyThumb('spec', pt.id)}</div>
                <div class="or-study-lbl">Specular</div>
                <div class="or-study-sub">ECC ${b.ECC.v}</div>
              </button>
              <button class="or-study" onclick="openStudyModal('fundus','${pt.id}')" title="Fundus photo">
                <div class="or-study-thumb">${studyThumb('fundus', pt.id)}</div>
                <div class="or-study-lbl">Fundus</div>
                <div class="or-study-sub">Retinal photo</div>
              </button>
              <button class="or-study" onclick="openStudyModal('vf','${pt.id}')" title="Visual field">
                <div class="or-study-thumb">${studyThumb('vf', pt.id)}</div>
                <div class="or-study-lbl">Visual field</div>
                <div class="or-study-sub">24-2 Humphrey</div>
              </button>
            </div>
          </div>
        </div>

        <div class="or-col-center">
          <div class="or-power-banner">
            <span class="or-pb-label">Selected Power</span>
            <span class="or-pb-val">${powerStr}  ${cylSign}${cylStr}  x  ${axis}°</span>
          </div>
          <div class="or-lens-meta">
            <div><span>Length</span><b>${length.toFixed(1)} mm</b></div>
            <div><span>Pos</span><b>${position}</b></div>
          </div>
          <div class="or-eye-panel">
            <div class="or-eye-label">
              <span class="or-eye-dot"></span>
              <b>${eye}</b> <span>|</span> <i>"${nickname}"</i>
            </div>
            ${eyeDiagramImg}
          </div>
        </div>

        <div class="or-col-right">
          <div class="or-proc-block">
            <div class="or-proc-label">PROCEDURE</div>
            <div class="or-proc-val">ICL ${eye}</div>
          </div>

          <div class="or-date">Date ${procDate}</div>

          <div class="or-remarks">
            <div class="or-remarks-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              <b>Remarks</b>
              <span class="or-remarks-eye"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></span>
            </div>
            ${remarks.map(rm => `<div class="or-remark-item">${rm}</div>`).join('')}
          </div>

          <div class="or-ref-block">
            <div class="or-ref-label">Referral</div>
            <div class="or-ref-val">${pt.risk ? 'Dr. M. Laval' : 'Direct · walk-in'}</div>
          </div>

          <div class="or-ref-block">
            <div class="or-ref-label">Surgeon</div>
            <div class="or-ref-val">${patientSurgeon(pt).name.replace(/^Dr\.\s*/, '')}</div>
          </div>

          <div class="or-iridectomy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10M8 5l4-3 4 3M5 15v6l-2 1M19 15v6l2 1M9 15l-1 6M15 15l1 6M5 12h14"/></svg>
            <div class="or-irid-body">
              <div class="or-irid-ttl">Iridectomy</div>
              <div class="or-irid-sub">Place: 12 o'clock</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${timelineHtml}
    ${renderStageAdvanceCta(pt, 'surgery')}
  `;
}
