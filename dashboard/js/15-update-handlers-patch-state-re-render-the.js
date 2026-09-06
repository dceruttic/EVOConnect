// === Update handlers — patch state, re-render the value & the result card ===
function updateProcRec(ptId, field, value){
  var s = _ensureProcRecStore(ptId);
  s[field] = value;
  // Update the slider's value chip in place (for sliders; for buttons, re-render the form)
  var valEl = document.getElementById('pcVal_' + ptId + '_' + field);
  if (valEl) {
    var n = parseFloat(value);
    if (!isNaN(n)) {
      // Format: integers (age) → no decimals; cct/pupil → 1 decimal max; else 2
      if (field === 'age' || field === 'cct') valEl.textContent = String(Math.round(n));
      else if (field === 'pupil' || field === 'hoa') valEl.textContent = n.toFixed(field === 'hoa' ? 2 : 1);
      else valEl.textContent = n.toFixed(2);
    } else {
      valEl.textContent = value;
    }
  } else {
    // Button group changed → re-render the form to update active states
    var formEl = document.getElementById('pcForm_' + ptId);
    if (formEl) {
      var pt = (DATA.patients||[]).find(function(x){ return x.id === ptId; });
      if (pt) formEl.innerHTML = renderProcRecForm(pt);
    }
  }
  // Always re-render the result card AND the eligibility section, since both depend on these values
  var resultEl = document.getElementById('pcResult_' + ptId);
  if (resultEl) {
    var pt2 = (DATA.patients||[]).find(function(x){ return x.id === ptId; });
    if (pt2) resultEl.innerHTML = renderProcRecResult(pt2);
  }
  var eligEl = document.getElementById('eligibilitySection_' + ptId);
  if (eligEl) {
    var pt3 = (DATA.patients||[]).find(function(x){ return x.id === ptId; });
    if (pt3) eligEl.innerHTML = renderEligibilityChecklist(pt3);
  }
}
// === Procedure Rec modals: Clinical rationale + Evidence base ===
function _ensureProcRecModalMounted(){
  if (document.getElementById('procRecModal')) return;
  var modal = document.createElement('div');
  modal.className = 'rx-import-modal';
  modal.id = 'procRecModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.onclick = function(ev){ if (ev.target === modal) closeProcRecModal(); };
  modal.innerHTML =
    '<div class="rx-import-dialog scan-import-dialog" style="max-width: 760px;">' +
      '<div class="rx-import-head">' +
        '<div>' +
          '<h3 id="procRecModalTitle">Clinical rationale</h3>' +
          '<p id="procRecModalSub">Why the AI ranked this procedure first.</p>' +
        '</div>' +
        '<button class="rx-import-close" onclick="closeProcRecModal()" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="rx-import-body" id="procRecModalBody" style="display:block;padding:20px 26px 26px;overflow-y:auto;"></div>' +
      '<div class="rx-import-foot">' +
        '<button type="button" class="rx-import-cancel" onclick="closeProcRecModal()">Close</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
}
function openProcRecModal(kind, ptId){
  _ensureProcRecModalMounted();
  var pt = (DATA.patients||[]).find(function(x){ return x.id === ptId; });
  if (!pt) return;
  var s = _ensureProcRecStore(ptId);
  var r = computeProcedureRec(s);
  var title = document.getElementById('procRecModalTitle');
  var sub = document.getElementById('procRecModalSub');
  var body = document.getElementById('procRecModalBody');
  if (title) title.textContent = (kind === 'evidence' ? 'Evidence base · ' : 'Clinical rationale · ') + r.top.name;
  if (sub) sub.textContent = (kind === 'evidence'
    ? 'Peer-reviewed sources supporting the recommended procedure.'
    : 'How the AI weighed the patient parameters to arrive at this recommendation.');
  if (body) body.innerHTML = (kind === 'evidence' ? _procRecEvidenceHtml(r, s) : _procRecRationaleHtml(r, s, pt));
  var m = document.getElementById('procRecModal');
  if (m){ m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeProcRecModal(){
  var m = document.getElementById('procRecModal');
  if (m){ m.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    var m = document.getElementById('procRecModal');
    if (m && m.classList.contains('open')) closeProcRecModal();
  }
});

function _procRecRationaleHtml(r, s, pt){
  var sph = parseFloat(s.sphere) || 0;
  var cyl = parseFloat(s.cylinder) || 0;
  var age = parseInt(s.age, 10) || 30;
  var cct = parseInt(s.cct, 10) || 540;
  var acd = parseFloat(s.acd) || 3.0;
  var pupil = parseFloat(s.pupil) || 5.0;
  var hoa = parseFloat(s.hoa) || 0.2;
  // Per-procedure scoring breakdown — mirrors computeProcedureRec
  function row(label, val, weight, why){
    return '<div class="prc-row"><span class="prc-l">' + label + '</span><span class="prc-v">' + val + '</span><span class="prc-w ' + (weight > 0 ? 'pos' : weight < 0 ? 'neg' : '') + '">' + (weight > 0 ? '+' : '') + weight + '</span><span class="prc-why">' + why + '</span></div>';
  }
  var topName = r.top.name;
  var rows = [];
  if (topName === 'EVO ICL') {
    if (sph >= 8) rows.push(row('Sphere', '−' + sph.toFixed(2) + ' D', 10, 'High myopia → ICL preferred'));
    else if (sph >= 5) rows.push(row('Sphere', '−' + sph.toFixed(2) + ' D', 8, 'Business rule: sphere ≥ 5 D → EVO ICL'));
    else if (sph >= 3) rows.push(row('Sphere', '−' + sph.toFixed(2) + ' D', 3, 'Moderate myopia · ICL eligible'));
    else rows.push(row('Sphere', '−' + sph.toFixed(2) + ' D', 1, 'Low myopia · LASIK/SMILE typically preferred'));
    if (acd >= 3.0) rows.push(row('ACD', acd.toFixed(2) + ' mm', 0, '✓ ≥ 3.0 mm — meets STAAR IFU'));
    else if (acd >= 2.8) rows.push(row('ACD', acd.toFixed(2) + ' mm', 0, '⚠ Borderline (2.8–3.0 mm) — proceed with caution'));
    else rows.push(row('ACD', acd.toFixed(2) + ' mm', -99, '✗ < 2.8 mm — contraindicated'));
    if (s.cornea !== 'normal') rows.push(row('Cornea', s.cornea, 3, 'Cornea-preserving — bypasses topographic concern'));
    if (cct < 500) rows.push(row('CCT', cct + ' µm', 2, 'Thin cornea → avoid stromal removal (LASIK/SMILE)'));
  } else if (topName === 'SMILE') {
    rows.push(row('Sphere', '−' + sph.toFixed(2) + ' D', 4, 'Within SMILE sweet spot (1–8 D)'));
    if (cct >= 500) rows.push(row('CCT', cct + ' µm', 0, '✓ Safe stromal bed'));
    if (s.cornea !== 'normal') rows.push(row('Cornea', s.cornea, -99, '✗ Contraindicated'));
  } else if (topName === 'Femto-LASIK') {
    rows.push(row('Sphere', '−' + sph.toFixed(2) + ' D', 4, 'Standard refractive correction range'));
    if (cct >= 520) rows.push(row('CCT', cct + ' µm', 2, '✓ Safe for flap creation'));
    else if (cct < 480) rows.push(row('CCT', cct + ' µm', -99, '✗ < 480 µm — flap risk'));
    if (s.osd === 'moderate' || s.osd === 'severe') rows.push(row('OSD', s.osd, -99, '✗ Contraindicated'));
    if (hoa >= 0.5) rows.push(row('HOA RMS', hoa.toFixed(2) + ' µm', -2, 'High HOA → night-vision concerns'));
  } else if (topName === 'PRK') {
    rows.push(row('Sphere', '−' + sph.toFixed(2) + ' D', 2, 'Surface ablation'));
    if (cct < 500) rows.push(row('CCT', cct + ' µm', 2, 'Preferred over LASIK for thin CCT'));
    if (s.cornea !== 'normal' && s.lens === 'clear') rows.push(row('Cornea', s.cornea, 2, 'Surface treatment safer than flap'));
  } else if (topName === 'RLE') {
    if (s.lens !== 'clear') rows.push(row('Lens', s.lens, 4, 'Lens replacement addresses underlying change'));
    if (age >= 50) rows.push(row('Age', age + ' yr', 4, '≥ 50 yr — presbyopia / cataract risk'));
    if (age >= 60) rows.push(row('Age', age + ' yr', 3, '≥ 60 yr — RLE strongly indicated'));
  }
  // Contraindications surfaced explicitly
  var contras = (r.top.contra || []).length
    ? '<div class="prc-contra"><b>Contraindications detected:</b><ul>' + r.top.contra.map(function(c){ return '<li>' + c + '</li>'; }).join('') + '</ul></div>'
    : '<div class="prc-clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="width:14px;height:14px;color:#117A57;"><polyline points="20 6 9 17 4 12"/></svg> No contraindications detected for ' + topName + '.</div>';
  // Alternatives breakdown
  var altsHtml = r.ranked.slice(1).map(function(a){
    var pct = a.contra && a.contra.length ? 'contra' : '+' + a.score;
    return '<div class="prc-alt-row"><span class="prc-alt-name">' + a.name + '</span><span class="prc-alt-score ' + (a.contra && a.contra.length ? 'contra' : '') + '">' + pct + '</span><span class="prc-alt-why">' + (a.contra && a.contra.length ? a.contra[0] : 'lower composite score') + '</span></div>';
  }).join('');
  return [
    '<div class="prc-section">',
      '<div class="prc-section-head">Why ' + r.top.name + ' (' + r.conf + '% confidence · score ' + r.top.score + ')</div>',
      '<div class="prc-table-head"><span>Parameter</span><span>Value</span><span>Weight</span><span>Reasoning</span></div>',
      '<div class="prc-table">' + rows.join('') + '</div>',
      contras,
    '</div>',
    '<div class="prc-section">',
      '<div class="prc-section-head">How alternatives compare</div>',
      '<div class="prc-alts-list">' + altsHtml + '</div>',
    '</div>',
    '<div class="prc-disclaimer">',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
      'AI Sentinel is decision support — the surgeon owns the final call. Confirm against full diagnostic workup and patient preferences before scheduling.',
    '</div>'
  ].join('');
}

function _procRecEvidenceHtml(r, s){
  // Curated reference list per procedure (open-access, peer-reviewed)
  var refs = {
    'EVO ICL': [
      { tag: 'Cohort',     ttl: 'Ten-year safety and stability of EVO ICL in moderate-to-high myopia',     authors: 'Packer M.', src: 'Clin Ophthalmol · 2023', doi: '10.2147/OPTH.S395734', n: '932 eyes' },
      { tag: 'IFU',        ttl: 'STAAR Surgical EVO/EVO+ Visian ICL Directions for Use',                  authors: 'STAAR Surgical', src: 'FDA Approval P030016/S035', doi: '—', n: 'IFU' },
      { tag: 'RCT',        ttl: 'Visian ICL vs Femto-LASIK for myopia −6 to −20 D — 5-year RCT',          authors: 'Sanders DR, Vukich JA.', src: 'J Refract Surg · 2022', doi: '10.3928/1081597X-20220103', n: '210 eyes' },
      { tag: 'Meta',       ttl: 'Vault prediction algorithms for posterior chamber phakic IOLs — meta',   authors: 'Reinstein DZ et al.', src: 'Ophthalmology · 2024', doi: '10.1016/j.ophtha.2024.01.012', n: '14 studies' },
    ],
    'SMILE': [
      { tag: 'RCT',        ttl: 'SMILE vs Femto-LASIK 3-year outcomes in moderate myopia',                authors: 'Han T, Zhou X.', src: 'Br J Ophthalmol · 2023', doi: '10.1136/bjo-2022-322458', n: '180 eyes' },
      { tag: 'Cohort',     ttl: 'Long-term refractive stability after SMILE — 8-year follow-up',          authors: 'Sekundo W et al.', src: 'JCRS · 2024', doi: '10.1097/j.jcrs.0000000000001310', n: '564 eyes' },
      { tag: 'Safety',     ttl: 'Dry-eye and corneal sensation after SMILE vs LASIK',                     authors: 'Toda I.', src: 'Cornea · 2022', doi: '10.1097/ICO.0000000000003015', n: 'review' },
    ],
    'Femto-LASIK': [
      { tag: 'RCT',        ttl: 'Femto-LASIK 10-year safety in low-to-moderate myopia',                   authors: 'Schallhorn SC.', src: 'Ophthalmology · 2023', doi: '10.1016/j.ophtha.2023.06.015', n: '7,200 eyes' },
      { tag: 'Cohort',     ttl: 'Predictability and stability — modern Femto-LASIK platforms',            authors: 'Mrochen M et al.', src: 'JCRS · 2024', doi: '10.1097/j.jcrs.0000000000001405', n: '2,140 eyes' },
    ],
    'PRK': [
      { tag: 'Cohort',     ttl: 'PRK in thin corneas — 5-year safety profile',                            authors: 'Alió JL.', src: 'Cornea · 2023', doi: '10.1097/ICO.0000000000003228', n: '410 eyes' },
      { tag: 'Compare',    ttl: 'Surface ablation vs LASIK in eyes with topographic abnormality',         authors: 'Randleman JB.', src: 'Am J Ophthalmol · 2024', doi: '10.1016/j.ajo.2024.02.018', n: '198 eyes' },
    ],
    'RLE': [
      { tag: 'Cohort',     ttl: 'Refractive lens exchange — visual outcomes & complication rate',          authors: 'Alió JL et al.', src: 'JCRS · 2023', doi: '10.1097/j.jcrs.0000000000001078', n: '1,012 eyes' },
      { tag: 'Compare',    ttl: 'RLE vs phakic IOL in patients > 50 yr',                                   authors: 'Packer M.', src: 'Surv Ophthalmol · 2024', doi: '10.1016/j.survophthal.2024.03.004', n: 'review' },
    ],
  };
  var list = refs[r.top.name] || refs['EVO ICL'];
  var rowsHtml = list.map(function(x){
    return [
      '<div class="prc-ev-row">',
        '<span class="prc-ev-tag">' + x.tag + '</span>',
        '<div class="prc-ev-body">',
          '<div class="prc-ev-ttl">' + x.ttl + '</div>',
          '<div class="prc-ev-meta">' + x.authors + ' · <i>' + x.src + '</i> · n=' + x.n + '</div>',
        '</div>',
        '<div class="prc-ev-doi">' + x.doi + '</div>',
      '</div>'
    ].join('');
  }).join('');
  return [
    '<div class="prc-section">',
      '<div class="prc-section-head">Curated evidence supporting ' + r.top.name + '</div>',
      '<div class="prc-evidence-list">' + rowsHtml + '</div>',
    '</div>',
    '<div class="prc-disclaimer">',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
      'References are curated by AI Sentinel from the most recent peer-reviewed literature. DOIs are illustrative — verify in PubMed before quoting.',
    '</div>'
  ].join('');
}

function resetProcRec(ptId){
  delete PT_PROC_REC[ptId];
  _ensureProcRecStore(ptId);
  // Re-render form, result, and eligibility — all depend on the same state
  var formEl = document.getElementById('pcForm_' + ptId);
  var resultEl = document.getElementById('pcResult_' + ptId);
  var eligEl = document.getElementById('eligibilitySection_' + ptId);
  var pt = (DATA.patients||[]).find(function(x){ return x.id === ptId; });
  if (formEl && pt) formEl.innerHTML = renderProcRecForm(pt);
  if (resultEl && pt) resultEl.innerHTML = renderProcRecResult(pt);
  if (eligEl && pt) eligEl.innerHTML = renderEligibilityChecklist(pt);
}

function renderProcedureResultBanner(pt){
  const store = (typeof PT_PREOP_DATA !== 'undefined') ? (PT_PREOP_DATA[pt.id] || null) : null;
  const hasData = !!(store && (store.ehrImported || (store.attachments||[]).length));
  // Heuristic recommendation derived from sphere — this is a mockup
  const sph = parseFloat(String(pt.power).split('/')[0]) || 0;
  let rec, conf, why, alt;
  if (sph <= -8.5) { rec = 'EVO ICL'; conf = 96; why = 'High myopia outside LASIK/SMILE safe range'; alt = 'PRK · 64% match'; }
  else if (sph <= -6) { rec = 'EVO ICL'; conf = 92; why = 'Moderate–high myopia · cornea-preserving lens'; alt = 'SMILE · 78% match'; }
  else if (sph <= -3) { rec = 'SMILE'; conf = 88; why = 'Mid myopia · minimally invasive flap-free option'; alt = 'LASIK · 84% match'; }
  else if (sph <= -0.5) { rec = 'LASIK'; conf = 86; why = 'Low myopia · standard refractive correction'; alt = 'PRK · 79% match'; }
  else { rec = 'Cataract'; conf = 80; why = 'Refractive profile suggests lens-based intervention'; alt = 'EVO ICL · 60% match'; }
  // Visual styling per recommendation
  const palette = {
    'EVO ICL':  { bg: 'linear-gradient(135deg,#001E60 0%,#0071B0 60%,#08B1C2 100%)', accent: '#08B1C2' },
    'SMILE':    { bg: 'linear-gradient(135deg,#1A2E54 0%,#2472D3 100%)',              accent: '#4A9EFF' },
    'LASIK':    { bg: 'linear-gradient(135deg,#0E2A4D 0%,#1F4E92 100%)',              accent: '#5B8FD0' },
    'PRK':      { bg: 'linear-gradient(135deg,#3F1A2E 0%,#7E2A56 100%)',              accent: '#D17AAA' },
    'Cataract': { bg: 'linear-gradient(135deg,#1F2937 0%,#374151 100%)',              accent: '#9CA3AF' },
  };
  const pal = palette[rec] || palette['EVO ICL'];
  if (!hasData) {
    return `
      <div class="ra-result-banner waiting">
        <div class="rrb-l">
          <span class="rrb-tag">Recommended procedure</span>
          <div class="rrb-val muted">Awaiting data</div>
          <div class="rrb-why">Import clinical values or attach a study to compute a recommendation.</div>
        </div>
        <div class="rrb-r">
          <div class="rrb-conf"><span class="rrb-conf-l">confidence</span><span class="rrb-conf-v">—</span></div>
        </div>
      </div>`;
  }
  return `
    <div class="ra-result-banner" style="background:${pal.bg}">
      <div class="rrb-l">
        <span class="rrb-tag">Recommended procedure</span>
        <div class="rrb-val">${rec}</div>
        <div class="rrb-why">${why}</div>
      </div>
      <div class="rrb-r">
        <div class="rrb-conf"><span class="rrb-conf-l">confidence</span><span class="rrb-conf-v">${conf}<em>%</em></span></div>
        <div class="rrb-alt">Next-best · ${alt}</div>
      </div>
    </div>
  `;
}

function renderPreopAttachmentsList(pt){
  const store = _ensurePreopStore(pt.id);
  const items = store.attachments || [];
  if (items.length === 0) {
    return `<div class="preop-att-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#63708A;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      No studies attached yet — use the cards above to ingest OCT, UBM, Pentacam or IOL Master data.
    </div>`;
  }
  const colorFor = { OCT: '#5C18AB', UBM: '#00609B', PENTACAM: '#E78A27', IOLM: '#16B386' };
  const labelFor = { OCT: 'OCT', UBM: 'UBM', PENTACAM: 'Pentacam', IOLM: 'IOL Master' };
  // Render a thumbnail strip so the surgeon sees at-a-glance what's attached and can preview
  return `<div class="preop-att-grid">${items.map(a => {
    const color = colorFor[a.type] || '#5C18AB';
    const label = labelFor[a.type] || a.type;
    const valBits = Object.entries(a.values || {}).slice(0,4).map(([k,v]) => `<span><b>${k.toUpperCase()}</b></span><b class="pacv-v">${v}</b>`).join('');
    const thumb = a.src
      ? `<div class="pac-thumb" style="background-image:url('${a.src}')"></div>`
      : `<div class="pac-thumb pac-thumb-icon" style="--c:${color}">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;color:${color};"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
         </div>`;
    return `<div class="preop-att-card preop-att-card-v2" onclick="openPreopAttachPreview('${pt.id}','${a.id}')" title="Click to preview">
      ${thumb}
      <div class="pac-body">
        <div class="pac-head">
          <span class="pac-tag" style="background:${color}">${label}</span>
          <span class="pac-eye">${a.eye}</span>
          <button class="pac-x" type="button" onclick="event.stopPropagation();removePreopAttachment('${pt.id}','${a.id}')" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="pac-name">${a.fileName || (label.replace(/\s/g,'') + '_' + a.eye + '_' + a.date)}</div>
        <div class="pac-vals">${valBits}</div>
        <div class="pac-foot">
          <span class="pac-flow">→ ICL Selection · Patient Parameters</span>
          <span class="pac-date">${a.date}${a.source === 'UPLOAD' ? ' · uploaded' : ' · EHR'}</span>
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// Pre-op preview lightbox — works for any attached scan including the pre-op flow
function _ensurePreopPreviewMounted(){
  if (document.getElementById('preopPreviewLb')) return;
  var lb = document.createElement('div');
  lb.className = 'scan-lightbox';
  lb.id = 'preopPreviewLb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.onclick = function(ev){ if (ev.target === lb) closePreopAttachPreview(); };
  lb.innerHTML =
    '<div class="scan-lightbox-inner">' +
      '<div class="scan-lightbox-head">' +
        '<div>' +
          '<div id="preopPreviewTitle" style="font-size:14px;font-weight:800;">Preview</div>' +
          '<div id="preopPreviewSub" style="font-size:11px;color:#63708A;margin-top:2px;"></div>' +
        '</div>' +
        '<button type="button" onclick="closePreopAttachPreview()" style="background:transparent;border:1px solid rgba(255,255,255,.2);border-radius:8px;color:#fff;padding:6px 12px;cursor:pointer;font-size:12px;">Close</button>' +
      '</div>' +
      '<div class="scan-lightbox-body" id="preopPreviewBody"></div>' +
    '</div>';
  document.body.appendChild(lb);
}

function openPreopAttachPreview(ptId, attId){
  _ensurePreopPreviewMounted();
  var s = (typeof PT_PREOP_DATA !== 'undefined') ? PT_PREOP_DATA[ptId] : null;
  if (!s) return;
  var a = (s.attachments || []).find(function(x){ return x.id === attId; });
  if (!a) return;
  var p = (DATA.patients || []).find(function(x){ return x.id === ptId; });
  var labelFor = { OCT: 'OCT', UBM: 'UBM', PENTACAM: 'Pentacam', IOLM: 'IOL Master' };
  var label = labelFor[a.type] || a.type;
  var lb = document.getElementById('preopPreviewLb');
  var t = document.getElementById('preopPreviewTitle');
  var sub = document.getElementById('preopPreviewSub');
  var body = document.getElementById('preopPreviewBody');
  if (t) t.textContent = label + ' · ' + (p ? p.name : '') + ' (' + a.eye + ')';
  if (sub) sub.textContent = 'REV-' + ptId + ' · captured ' + a.date + ' · ' + (a.source === 'UPLOAD' ? 'uploaded from device' : 'from EHR');
  if (body) {
    var valRows = Object.entries(a.values || {}).map(function(kv){
      return '<div style="display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;border-bottom:1px solid #1A2540;"><span style="color:#63708A;">' + kv[0].toUpperCase() + '</span><b style="color:#fff;font-variant-numeric:tabular-nums;">' + kv[1] + '</b></div>';
    }).join('');
    body.innerHTML = a.src
      ? '<div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;max-width:920px;">' +
          '<img src="' + a.src + '" alt="' + label + ' scan" style="max-width:100%;max-height:60vh;border-radius:6px;"/>' +
          '<div style="width:100%;max-width:520px;background:#0E1428;border:1px solid #1A2540;border-radius:8px;overflow:hidden;">' + valRows + '</div>' +
        '</div>'
      : '<div style="display:flex;flex-direction:column;align-items:center;gap:18px;color:#fff;padding:32px;">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:64px;height:64px;color:#5A6478;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
          '<div style="font-size:14px;font-weight:800;color:#fff;">' + label + ' report · auto-parsed</div>' +
          '<div style="font-size:11.5px;color:#63708A;">No raw image — values were extracted from the structured report.</div>' +
          '<div style="width:100%;max-width:520px;background:#0E1428;border:1px solid #1A2540;border-radius:8px;overflow:hidden;">' + valRows + '</div>' +
        '</div>';
  }
  if (lb){ lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closePreopAttachPreview(){
  var lb = document.getElementById('preopPreviewLb');
  if (lb){ lb.classList.remove('open'); document.body.style.overflow = ''; }
}
// Wire ESC for the new preview
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    var lb = document.getElementById('preopPreviewLb');
    if (lb && lb.classList.contains('open')) closePreopAttachPreview();
  }
});

function renderPtSizing(pt) {
  const inner = pt.iclGuru ? renderPtSizingGuru(pt) : renderPtSizingFormulas(pt);
  return `
    <div class="bis-disclaimer" role="note" aria-label="Business Information Statement" onclick="if(this.classList.contains('bis-ack-done')){this.classList.remove('bis-ack-done');var b=this.querySelector('.bis-ack');if(b){b.textContent='I acknowledge';}}">
      <div class="bis-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
      <div class="bis-body">
        <div class="bis-ttl">BIS · We are not doctors</div>
        <div class="bis-txt">AI-generated decision support — does not replace clinical judgement. The treating surgeon is solely responsible for lens selection, surgical plan and outcome.</div>
      </div>
      <button class="bis-ack" onclick="event.stopPropagation();var d=this.closest('.bis-disclaimer');if(d.classList.contains('bis-ack-done')){d.classList.remove('bis-ack-done');this.textContent='I acknowledge';}else{d.classList.add('bis-ack-done');this.innerHTML='✓ Acknowledged';}">I acknowledge</button>
    </div>
    ${inner}
    ${renderStageAdvanceCta(pt, 'sizing')}
  `;
}

/* Reproduce ICL Guru PRO PDF report in-app — matching PDF colors + lens shapes */
// Lens silhouette path extracted from the user-provided ICL Guru asset (Group 791.svg).
// Geometric coordinates in viewBox space x:33-150, y:191-266 (118w × 75h).
// ICL_LENS_OUTER_PATH = single closed sub-path (outer outline only). Used as the MASK
// shape so colored vault bands fill the entire silhouette.
// ICL_LENS_PATH = full asset path with double-trace (outer + inner outline). Used as the
// visible stroked outline so we get the nice "double-line" look from the reference.
const ICL_LENS_OUTER_PATH = 'M86.6647 191.561C88.7302 191.387 98.9189 191.613 101.036 191.892C102.275 192.031 104.788 192.466 106.629 192.849C114.77 194.502 123.513 195.147 138.211 195.182L145.785 195.199L146.748 195.687C149.003 196.801 150.328 198.715 150.483 201.099C150.586 202.735 150.225 203.971 149.226 205.451C147.884 207.435 147.162 209.141 146.611 211.56C146.267 213.126 146.077 225.032 146.232 236.52C146.335 244.352 146.352 244.475 146.799 246.18C147.333 248.234 147.936 249.61 149.123 251.437C150.242 253.125 150.586 254.292 150.483 255.928C150.328 258.277 149.088 260.14 146.954 261.201L145.63 261.863L140.191 261.81C127.851 261.671 113.255 262.646 107.662 263.969L106.742 264.181C102.214 265.195 98.6803 265.5 92.0005 265.5C84.858 265.5 81.3292 265.152 76.2692 263.951C70.7444 262.646 56.2014 261.671 43.8956 261.81L38.3876 261.863L37.2342 261.305C35.0145 260.244 33.6725 258.312 33.5174 255.963C33.4206 254.396 33.717 253.288 34.6762 251.736L34.8765 251.42C36.5976 248.774 37.3551 246.563 37.6132 243.238C37.823 240.789 37.8358 219.373 37.6522 214.483L37.6132 213.736C37.3873 210.717 36.6165 208.341 35.0888 205.934L34.7737 205.451C33.8378 204.064 33.4616 202.891 33.5033 201.402L33.5174 201.099C33.6724 198.732 35.0659 196.696 37.2342 195.669L38.2154 195.199L45.7887 195.182C59.626 195.147 69.66 194.451 76.0796 193.093C79.6339 192.347 81.7651 192.001 85.1366 191.692L86.6647 191.561Z';
const ICL_LENS_PATH = 'M86.6647 191.561C88.7302 191.387 98.9189 191.613 101.036 191.892C102.275 192.031 104.788 192.466 106.629 192.849C114.77 194.502 123.513 195.147 138.211 195.182L145.785 195.199L146.748 195.687C149.003 196.801 150.328 198.715 150.483 201.099C150.586 202.735 150.225 203.971 149.226 205.451C147.884 207.435 147.162 209.141 146.611 211.56C146.267 213.126 146.077 225.032 146.232 236.52C146.335 244.352 146.352 244.475 146.799 246.18C147.333 248.234 147.936 249.61 149.123 251.437C150.242 253.125 150.586 254.292 150.483 255.928C150.328 258.277 149.088 260.14 146.954 261.201L145.63 261.863L140.191 261.81C127.851 261.671 113.255 262.646 107.662 263.969L106.742 264.181C102.214 265.195 98.6803 265.5 92.0005 265.5C84.858 265.5 81.3292 265.152 76.2692 263.951C70.7444 262.646 56.2014 261.671 43.8956 261.81L38.3876 261.863L37.2342 261.305C35.0145 260.244 33.6725 258.312 33.5174 255.963C33.4206 254.396 33.717 253.288 34.6762 251.736L34.8765 251.42C36.5976 248.774 37.3551 246.563 37.6132 243.238C37.823 240.789 37.8358 219.373 37.6522 214.483L37.6132 213.736C37.3873 210.717 36.6165 208.341 35.0888 205.934L34.7737 205.451C33.8378 204.064 33.4616 202.891 33.5033 201.402L33.5174 201.099C33.6724 198.732 35.0659 196.696 37.2342 195.669L38.2154 195.199L45.7887 195.182C59.626 195.147 69.66 194.451 76.0796 193.093C79.6339 192.347 81.7651 192.001 85.1366 191.692L86.6647 191.561ZM93.8059 192.678C90.7151 192.608 87.7181 192.598 86.7567 192.679H86.7524C82.4805 193.023 80.3231 193.346 76.306 194.19L76.3071 194.191C69.7704 195.573 59.6406 196.268 45.7908 196.303L38.4655 196.32L37.7096 196.682L37.7053 196.684C35.8943 197.542 34.752 199.222 34.6231 201.169L34.6242 201.171C34.5384 202.53 34.8153 203.522 35.6899 204.819C37.5403 207.561 38.4637 210.24 38.719 213.652H38.7179C38.8342 215.081 38.8901 221.855 38.8901 228.52C38.8901 235.18 38.8345 241.933 38.7179 243.325L38.719 243.326C38.4635 246.616 37.7292 248.925 36.1339 251.514L35.8036 252.035C35.2751 252.849 34.97 253.466 34.7997 254.035C34.633 254.592 34.5789 255.159 34.6242 255.893C34.7442 257.689 35.6985 259.194 37.3652 260.116L37.7085 260.292L37.7129 260.293L38.6345 260.738L43.8826 260.689C56.2009 260.549 70.8582 261.521 76.5215 262.859H76.5226C81.4753 264.035 84.9141 264.378 92.0005 264.378C99.0704 264.378 102.526 264.035 107.409 262.877L107.972 262.751C114.058 261.462 128.236 260.554 140.203 260.689H140.202L145.376 260.738L146.464 260.196L146.465 260.195C148.249 259.307 149.247 257.798 149.376 255.856L149.389 255.595C149.406 255.002 149.346 254.512 149.2 254.029C149.031 253.465 148.727 252.854 148.202 252.062L148.196 252.053C146.943 250.124 146.292 248.637 145.727 246.465V246.464C145.237 244.596 145.225 244.305 145.123 236.536C145.045 230.781 145.054 224.922 145.125 220.302C145.161 217.993 145.212 215.988 145.277 214.458C145.339 212.982 145.416 211.828 145.528 211.317L145.53 211.309C146.11 208.761 146.886 206.924 148.311 204.818C149.185 203.522 149.462 202.53 149.376 201.171V201.169C149.248 199.219 148.186 197.646 146.261 196.694L145.52 196.32L138.209 196.303C123.485 196.268 114.657 195.624 106.411 193.949L106.406 193.947C104.579 193.568 102.104 193.14 100.913 193.007L100.903 193.006L100.893 193.004C99.9063 192.875 96.8968 192.748 93.8059 192.678Z';

function renderPtSizingGuru(pt) {
  const g = pt.iclGuru;
  const ip = g.iolPower;
  const sel = g.sizing.find(s => s.selected);
  // Safety vault bands reference (colored ladder)
  const safetyBandsHtml = `
    <div class="guru-bands-strip">
      <div class="bd hypo" style="background:#D12C4A"></div>
      <div class="bd low" style="background:#F6BF2C"></div>
      <div class="bd ideal" style="background:#03B496"></div>
      <div class="bd high" style="background:#3371C3"></div>
      <div class="bd hyper" style="background:#B845D5"></div>
    </div>
    <div class="guru-bands-scale">
      <span>0</span><span>100</span><span>200</span><span>300</span><span>400</span><span>500</span><span>600</span><span>700</span><span>800</span><span>900</span><span>1000</span><span>1500 µm</span>
    </div>
    <div class="guru-bands-legend">
      <span><i style="background:#D12C4A"></i>Hypo</span>
      <span><i style="background:#F6BF2C"></i>Low</span>
      <span><i style="background:#03B496"></i>Ideal</span>
      <span><i style="background:#3371C3"></i>High</span>
      <span><i style="background:#B845D5"></i>Hyper</span>
    </div>
  `;
  // One card per candidate lens size — lens shape uses proportional color mix (like PDF)
  const sizeCardsHtml = g.sizing.map(s => {
    const vaultLabel = typeof s.vaultUm === 'number' ? `${(s.vaultUm/1000).toFixed(3)} mm` : s.vaultUm;
    const vaultSub   = typeof s.peripheralUm === 'number' ? `${(s.peripheralUm/1000).toFixed(3)} mm` : s.peripheralUm;
    // Percentage pills above the lens — matching the ICL Guru reference report.
    // Each pill is colored to its band and shows the percentage in white.
    const zonesHtml  = s.zones.filter(z => z.pct >= 5).map(z =>
      `<span class="gz" style="background:${z.color}">${Math.round(z.pct)}%</span>`
    ).join('');
    // PDF-style lens shape: pillow silhouette filled with proportional zone colors
    // Build a gradient that matches the zone percentages (e.g. 65% green + 35% blue)
    let lensBg;
    if (s.zones.length === 1) {
      lensBg = s.zones[0].color;
    } else {
      const cumul = [];
      let acc = 0;
      s.zones.forEach(z => {
        cumul.push(`${z.color} ${acc}%`);
        acc += z.pct;
        cumul.push(`${z.color} ${acc}%`);
      });
      lensBg = `linear-gradient(90deg, ${cumul.join(', ')})`;
    }
    // Figma-layer lens: pillow body + pronounced haptic bumps on both sides,
    // colored zones filling proportionally, percentages printed ON the lens,
    // small navy pointer triangle above.
    const lensGradId = `lens-${pt.id}-${s.size.replace('.','')}`;
    const showPctOnLens = s.zones.filter(z => z.pct >= 10); // avoid cramming tiny slivers
    // Compute label x-positions for viewBox 0..240 — labels live inside the main optical body
    const labelPositions = (() => {
      const vbStart = 50, vbEnd = 190; // main body span (rx=44..196, shrunk slightly for padding)
      const span = vbEnd - vbStart;
      let acc = 0;
      return s.zones.map(z => {
        const centerPct = acc + z.pct / 2;
        acc += z.pct;
        return { z, x: vbStart + (centerPct / 100) * span };
      }).filter(o => o.z.pct >= 10);
    })();
    // Lens silhouette path extracted from the user-provided ICL Guru asset (Group 791.svg).
    // The path is in viewBox space x:33-150, y:191-266 (118w × 75h).
    // We use it as both clip-path (so zone bands fill the exact STAAR lens shape)
    // AND as the visible outline (drawn last so the navy stroke caps everything).
    const lensClipId = `lens-clip-${pt.id}-${s.size.replace('.','')}`;
    const lensXMin = 33, lensXMax = 150, lensYMin = 191, lensYMax = 266;
    const lensW = lensXMax - lensXMin;
    // Compute zone band widths inside the lens silhouette
    let acc = 0;
    const zoneRects = s.zones.map(z => {
      const xStart = lensXMin + (acc / 100) * lensW;
      const w = (z.pct / 100) * lensW;
      acc += z.pct;
      return `<rect x="${xStart.toFixed(2)}" y="${lensYMin}" width="${w.toFixed(2)}" height="${lensYMax - lensYMin}" fill="${z.color}"/>`;
    }).join('');
    // Recompute label positions in lens coordinate space
    const labelPositionsLens = (() => {
      let a = 0;
      return s.zones.map(z => {
        const centerPct = a + z.pct / 2;
        a += z.pct;
        return { z, x: lensXMin + (centerPct / 100) * lensW };
      }).filter(o => o.z.pct >= 10);
    })();
    const lensCenterY = (lensYMin + lensYMax) / 2;
    // Mask ID — uses ICL_LENS_OUTER_PATH (single closed sub-path) so the silhouette
    // renders as a SOLID white pillow. The full ICL_LENS_PATH has two sub-paths (outer +
    // inner double-trace) which created a "ring" mask under any fill rule and left the
    // interior empty. Single sub-path + nonzero gives us the full filled silhouette.
    const lensMaskId = `lens-mask-${pt.id}-${s.size.replace('.','')}`;
    const lensSvg = `
      <svg class="gsc-lens-svg" viewBox="${lensXMin - 4} ${lensYMin - 12} ${lensW + 8} ${lensYMax - lensYMin + 16}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="${lensMaskId}" maskUnits="userSpaceOnUse" x="${lensXMin - 4}" y="${lensYMin - 12}" width="${lensW + 8}" height="${lensYMax - lensYMin + 16}">
            <!-- Black background = transparent in the mask result. White path = visible.
                 We need an explicit black rect because <mask> defaults to fully transparent. -->
            <rect x="${lensXMin - 4}" y="${lensYMin - 12}" width="${lensW + 8}" height="${lensYMax - lensYMin + 16}" fill="#000"/>
            <path d="${ICL_LENS_OUTER_PATH}" fill="#fff"/>
          </mask>
        </defs>

        <!-- Navy pointer triangle above the lens — points at the centroid of the IDEAL band -->
        ${(() => {
          // Find the position of the ideal zone center (or first zone if no ideal)
          let triA = 0, ideal = null;
          for (const z of s.zones) {
            if (z.band === 'ideal') { ideal = { ctr: triA + z.pct/2 }; break; }
            triA += z.pct;
          }
          const triPct = ideal ? ideal.ctr : 50;
          const triX = lensXMin + (triPct / 100) * lensW;
          return `<path d="M ${triX} ${lensYMin - 10} L ${triX + 6} ${lensYMin - 1} L ${triX - 6} ${lensYMin - 1} Z" fill="#001DB4"/>`;
        })()}

        <!-- Colored zone bands masked to the STAAR EVO ICL silhouette -->
        <g mask="url(#${lensMaskId})">
          ${zoneRects}
        </g>

        <!-- Lens silhouette outline (brand blue stroke) drawn on top -->
        <path d="${ICL_LENS_PATH}" fill="none" stroke="#001DB4" stroke-width="1" fill-rule="evenodd"/>

        <!-- 2 haptic eyelet reference dots — anchor inside each haptic footplate -->
        <circle cx="${lensXMin + 7}" cy="${lensCenterY}" r="1.6" fill="#001DB4" opacity="0.45"/>
        <circle cx="${lensXMax - 7}" cy="${lensCenterY}" r="1.6" fill="#001DB4" opacity="0.45"/>
        <!-- Percentages now live in colored pills above the lens (gsc-zones), so the
             interior of the silhouette stays clean — matches the ICL Guru reference. -->
      </svg>
    `;
    const stabilityPct = s.stability === 'high' ? 82 : s.stability === 'mid' ? 55 : 25;
    return `
      <div class="guru-size-card ${s.selected ? 'selected' : ''}">
        ${s.selected ? '<div class="guru-selected-badge">Recommended</div>' : ''}
        <div class="gsc-sz-lbl">Size</div>
        <div class="gsc-sz-val">${s.size} mm</div>
        <div class="gsc-vault-lbl">Vault prediction:</div>
        <div class="gsc-vault-val ${typeof s.vaultUm !== 'number' ? 'hyper' : ''}">${vaultLabel}</div>
        <div class="gsc-peri">
          <div><span>Peripheral vault:</span> <b>${vaultSub}</b></div>
          <div><span>Angle:</span> <b>${s.angle.toFixed(3)}°</b></div>
        </div>
        <div class="gsc-zones">${zonesHtml}</div>
        <div class="gsc-lens-wrap">${lensSvg}</div>
        <div class="gsc-stability-lbl">Stability</div>
        <div class="gsc-stability-bar">
          <div class="ssb-seg low ${stabilityPct <= 33 ? 'active' : ''}"></div>
          <div class="ssb-seg mid ${stabilityPct > 33 && stabilityPct <= 66 ? 'active' : ''}"></div>
          <div class="ssb-seg high ${stabilityPct > 66 ? 'active' : ''}"></div>
          <div class="ssb-pointer" style="left:${stabilityPct}%">▼</div>
        </div>
        <div class="gsc-stability-scale"><span>Low</span><span>Mid</span><span>High</span></div>
      </div>`;
  }).join('');

  // Big eye banner (OD / OS prominent at top of sizing)
  const eyeBanner = `
    <div class="sizing-eye-banner">
      <div class="seb-eye-viz">
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="seb-iris-${pt.id}" cx="50%" cy="50%">
              <stop offset="0" stop-color="#0F1D40"/>
              <stop offset="0.4" stop-color="#3554A6"/>
              <stop offset="0.85" stop-color="#4A7BE3"/>
              <stop offset="1" stop-color="#87AFFF"/>
            </radialGradient>
          </defs>
          <ellipse cx="60" cy="60" rx="54" ry="32" fill="#FAFAFA" stroke="#CBCED9" stroke-width="1.5"/>
          <circle cx="60" cy="60" r="28" fill="url(#seb-iris-${pt.id})"/>
          <circle cx="60" cy="60" r="11" fill="#0B0F20"/>
          <circle cx="53" cy="54" r="4" fill="#fff" opacity="0.9"/>
          <circle cx="66" cy="66" r="2" fill="#fff" opacity="0.6"/>
        </svg>
      </div>
      <div class="seb-eye-info">
        <div class="seb-eye-label">${pt.eye.split('/')[0].trim()}</div>
        <div class="seb-eye-nickname">"${pt.name.split(' ').slice(-1)[0]}"</div>
        <div class="seb-eye-specs">
          <span><b>${ip.sphere.toFixed(2)} D</b> sphere</span>
          <span>·</span>
          <span><b>+${ip.cyl.toFixed(2)} D</b> cyl</span>
          <span>·</span>
          <span><b>${ip.axis}°</b> axis</span>
        </div>
      </div>
      <div class="seb-biom-mini">
        <div class="sbm-item"><span>ATA</span><b>${g.biometry.ata.toFixed(2)}</b></div>
        <div class="sbm-item"><span>aRISE</span><b>${g.biometry.aRise.toFixed(3)}</b></div>
        <div class="sbm-item"><span>ACD</span><b>${g.biometry.acd.toFixed(2)}</b></div>
      </div>
    </div>
  `;

  return `
    <div class="pd-section">
      <div class="guru-header">
        <div class="guru-brand">
          <div class="guru-logo">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" fill="none" stroke="#4A7BE3" stroke-width="2.4"/>
              <circle cx="20" cy="20" r="6" fill="#4A7BE3"/>
              <path d="M 8 20 Q 20 6 32 20 Q 20 34 8 20" fill="none" stroke="#0071B0" stroke-width="2" opacity="0.7"/>
            </svg>
          </div>
          <div>
            <div class="guru-brand-name">ICLguru<span class="gb-pro">PRO</span></div>
            <div class="guru-brand-sub">AI POWERED SIZING</div>
          </div>
        </div>
        <a class="guru-download" href="${g.pdfPath}" download target="_blank">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download PDF report
        </a>
      </div>

      <div class="guru-meta-grid">
        <div class="guru-meta-block">
          <div class="gmb-row"><span>Patient</span><b>${pt.name}</b></div>
          <div class="gmb-row"><span>Gender</span><b>${pt.sex}</b></div>
          <div class="gmb-row"><span>DOB</span><b>—</b></div>
          <div class="gmb-row"><span>Medical record</span><b>REV-${pt.id}</b></div>
          <div class="gmb-row"><span>Eye</span><b class="gmb-eye">${pt.eye}</b></div>
        </div>
        <div class="guru-meta-block">
          <div class="gmb-row"><span>Calculation date</span><b>${g.date} · ${g.time || ''}</b></div>
          <div class="gmb-row"><span>Calculation method</span><b>${g.calcMethod}</b></div>
          <div class="gmb-row"><span>Date of surgery</span><b>${pt.stage === 'Scheduled' ? 'May 8, 2026' : 'TBD'}</b></div>
        </div>
        <div class="guru-meta-block power-block">
          <div class="gmb-h">IOL Power</div>
          <div class="gmb-pow-grid">
            <div><span>Sphere</span><b>${ip.sphere.toFixed(2)} D</b></div>
            <div><span>Cyl</span><b>${ip.cyl.toFixed(2)} D</b></div>
            <div><span>Axis</span><b>${ip.axis}°</b></div>
            <div><span>ATA</span><b>${g.biometry.ata.toFixed(3)} mm</b></div>
            <div><span>aRISE</span><b>${g.biometry.aRise.toFixed(3)} mm</b></div>
            <div><span>ACD</span><b>${g.biometry.acd.toFixed(3)} mm</b></div>
          </div>
        </div>
      </div>
    </div>

    <div class="pd-section">${eyeBanner}</div>

    <div class="pd-section">
      <h4>Sizing results · ${g.sizing.length} candidate lens sizes <span class="tag">${sel ? sel.size + ' mm selected · ' + (sel.zones.find(z=>z.band==='ideal')?.pct || sel.zones[0].pct) + '% ' + (sel.zones.find(z=>z.band==='ideal') ? 'ideal' : sel.zones[0].band) + ' band' : ''}</span></h4>
      <div class="guru-sizes-grid">${sizeCardsHtml}</div>
    </div>

    <div class="pd-section">
      <h4>Safety vault bands · reference</h4>
      <div class="guru-bands-wrap">${safetyBandsHtml}</div>
    </div>

    <div class="pd-section">
      <div class="guru-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        <div>
          <b>WARNING</b>
          <p>${g.warning}</p>
        </div>
      </div>
      <div class="guru-disclaimer">
        <b>Disclaimer:</b> ICL Guru is a supplementary tool to assist in ICL sizing. It does not replace clinical judgment or required diagnostic evaluations. Results are not medical instructions and may not be accurate in all cases. Clinicians are solely responsible for treatment decisions and outcomes.
      </div>
    </div>
  `;
}

/* Formula comparator — for patients without an ICL Guru report */
const SIZING_FORMULAS = [
  { code: "ICL_GURU",    name: "ICL Guru",          desc: "AI model · validated on 47k ICL outcomes · real-time cohort match",     recSize: 12.1, vault: 240, conf: 96, author: "EVO Connect",                  predictsVault: true },
  { code: "REINSTEIN",   name: "Reinstein",         desc: "High-resolution UBM-driven nomogram · sulcus-to-sulcus + crystalline lens rise", recSize: 12.6, vault: 380, conf: 92, author: "Reinstein et al., 2013", predictsVault: false },
  { code: "LASSO",       name: "Lasso",             desc: "Regression-based machine-learning sizing · multi-center cohort calibrated",     recSize: 12.6, vault: 410, conf: 91, author: "Russo et al., 2022",     predictsVault: false },
  { code: "KS",          name: "KS",                desc: "Kane-Saxena hybrid · combines aRISE + lens rise + ATA",                          recSize: 12.6, vault: 415, conf: 89, author: "Kane & Saxena, 2022",  predictsVault: false },
  { code: "STAAR_NOM",   name: "STAAR Nomogram",    desc: "Manufacturer reference · WTW + ACD lookup · returns size only, not vault",      recSize: 13.2, vault: 0,   conf: 82, author: "STAAR (OCOS)",         predictsVault: false },
  { code: "ICL_FIT",     name: "ICL Fit",           desc: "OCT-based AS-OCT fit · iris-iris + ATA · CIRCLE/Casia2 imaging-driven",          recSize: 12.1, vault: 320, conf: 90, author: "Pérez-Vives et al., 2021", predictsVault: false },
];
// Which formulas are selected for the current run (user-toggled)
/* The STAAR reference is not optional: it is always run and always shown, the
   same rule the STELLA recommendation follows in a handoff case (brief limit 4). */
const MANDATORY_FORMULA = "STAAR_NOM";
/* Phase 1 ships the STAAR reference plus the three nomograms named in the ESCRS
   brief; the wider library (Reinstein, Lasso, KS) lands in Phase 4. */
let SELECTED_SIZING_FORMULAS = new Set([MANDATORY_FORMULA, "ICL_GURU", "ICL_FIT", "CASIA2"]);

function toggleSizingFormula(code) {
  if (code === MANDATORY_FORMULA) {
    if (typeof showToast === 'function') showToast('The STAAR nomogram is always included in the comparison');
    SELECTED_SIZING_FORMULAS.add(code);
  }
  else if (SELECTED_SIZING_FORMULAS.has(code)) SELECTED_SIZING_FORMULAS.delete(code);
  else SELECTED_SIZING_FORMULAS.add(code);
  document.querySelectorAll('.sf-formula-chip').forEach(chip => {
    const c = chip.getAttribute('data-formula');
    chip.classList.toggle('selected', SELECTED_SIZING_FORMULAS.has(c));
    chip.classList.toggle('locked', c === MANDATORY_FORMULA);
    if (c === MANDATORY_FORMULA) chip.setAttribute('aria-disabled', 'true');
  });
  const countEl = document.getElementById('sfSelectedCount');
  if (countEl) countEl.textContent = SELECTED_SIZING_FORMULAS.size;
  const runCount = document.getElementById('sfRunCount');
  if (runCount) runCount.textContent = SELECTED_SIZING_FORMULAS.size;
}

function importSizingFromEHR() {
  // Simulate EHR import — populate inputs with slightly "fresher" data + visual flash
  const fields = {
    'sf-wtw':   (11.5 + Math.random()*0.6).toFixed(2),
    'sf-ata':   (11.3 + Math.random()*0.6).toFixed(2),
    'sf-sts':   (11.8 + Math.random()*0.6).toFixed(2),
    'sf-acd':   (3.0 + Math.random()*0.5).toFixed(2),
    'sf-clr':   Math.round(160 + Math.random()*90),
    'sf-kmean': (42.5 + Math.random()*1.5).toFixed(2),
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  document.querySelectorAll('.sf-input').forEach(el => {
    el.classList.add('ehr-flash');
    setTimeout(() => el.classList.remove('ehr-flash'), 1400);
  });
  if (typeof sebSyncStrip === 'function') sebSyncStrip();
  showToast("Imported 6 biometry fields from Clinic EHR · 2.3s");
}

/* A record with nothing in it yet. The demo patients carry a refraction, so
   every derived value below has something to derive from; a patient created
   this minute has none, and biometry seeded from a fallback would be worse
   than an empty field — it would look like measurements nobody took. */
function ptIsBlank(pt) {
  return !(pt.power && String(pt.power).trim() !== '\u2014' && String(pt.power).trim() !== '');
}

/* Everything that was actually measured for this case, whatever brought it in:
   the EHR pull, or any scan attached afterwards (a later attachment wins over
   an earlier one). This is what a new patient fills up with — nothing here is
   invented, so a field with no measurement behind it stays empty. */
function sfImportedVals(pt) {
  var out = {};
  var store = (typeof PT_PREOP_DATA !== 'undefined') ? PT_PREOP_DATA[pt.id] : null;
  if (!store) return out;
  var KEYS = ['al','k1','k2','kmean','acd','wtw','cct','pupil','ata','sts','clr','arise'];
  var take = function (src) {
    if (!src) return;
    KEYS.forEach(function (k) {
      if (src[k] != null && String(src[k]).trim() !== '') out[k] = String(src[k]).trim();
    });
  };
  take(store.ehrValues);
  (store.attachments || []).forEach(function (a) { take(a.values); });
  take(store.values);                    // what was typed or imported here, last word
  if (!out.kmean && out.k1 && out.k2) out.kmean = ((parseFloat(out.k1) + parseFloat(out.k2)) / 2).toFixed(2);
  return out;
}

/* The header strip is not a second source of truth — it mirrors the six input
   fields below it, so typing a value or importing a scan is visible up top the
   moment it lands. */
function sebSyncStrip() {
  var spec = { al: ['sf-al', 'mm'], kmean: ['sf-kmean', 'D'], acd: ['sf-acd', 'mm'],
               wtw: ['sf-wtw', 'mm'], cct: ['sf-cct', '\u00b5m'], pupil: ['sf-pupil', 'mm'] };
  Object.keys(spec).forEach(function (k) {
    var cell = document.querySelector('.seb-kpi[data-kpi="' + k + '"] .kpi-val');
    var inp = document.getElementById(spec[k][0]);
    if (!cell || !inp) return;
    var v = String(inp.value == null ? '' : inp.value).trim();
    cell.innerHTML = v ? (v + '<em>' + spec[k][1] + '</em>') : '\u2014';
  });
}
/* Which measurement each input in step 1 holds. Typing in one is the surgeon
   entering that measurement for this case, so it is written to the case the
   same way an import is — otherwise the value would live only in the DOM and
   die on the next tab switch. */
var SF_FIELD_KEY = { 'sf-al':'al', 'sf-kmean':'kmean', 'sf-acd':'acd', 'sf-wtw':'wtw',
                     'sf-cct':'cct', 'sf-pupil':'pupil', 'sf-ata':'ata', 'sf-sts':'sts',
                     'sf-clr':'clr', 'sf-arise':'arise' };
function sfSetCaseValue(key, val) {
  if (typeof CURRENT_PT === 'undefined' || !CURRENT_PT) return;
  if (typeof _ensurePreopStore !== 'function') return;
  var store = _ensurePreopStore(CURRENT_PT.id);
  store.values = store.values || {};
  var v = String(val == null ? '' : val).trim();
  if (v === '') delete store.values[key]; else store.values[key] = v;
}
document.addEventListener('input', function (e) {
  var id = e.target && e.target.id;
  if (!id || !SF_FIELD_KEY[id]) return;
  sfSetCaseValue(SF_FIELD_KEY[id], e.target.value);
  sebSyncStrip();
});

/* The inputs a case cannot be calculated or ordered without. One list, used
   by the Calculate button (js/19) and by the order gate (js/44), so the two
   can never ask for different things — which is how a surgeon ended up being
   asked for WTW only after the comparison had already run. */
window.SF_REQUIRED = [
  ['sf-rx-man-sph', 'Manifest sphere'],
  ['sf-rx-man-cyl', 'Manifest cylinder'],
  ['sf-rx-man-ax',  'Manifest axis'],
  ['sf-acd',        'ACD'],
  ['sf-wtw',        'WTW']
];
function sfMissingRequired() {
  return SF_REQUIRED.filter(function (f) {
    var i = document.getElementById(f[0]);
    return !i || String(i.value == null ? '' : i.value).trim() === '';
  });
}
function sfCheckRequired(announce) {
  var missing = sfMissingRequired();
  document.querySelectorAll('.sf-missing').forEach(function (n) { n.classList.remove('sf-missing'); });
  if (!missing.length) return true;
  missing.forEach(function (f) {
    var i = document.getElementById(f[0]);
    var cell = i && i.closest('.sf-input, .sf-rx-cell');
    if (cell) cell.classList.add('sf-missing');
  });
  if (announce) {
    var first = document.getElementById(missing[0][0]);
    if (first) {
      try { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
      first.focus();
    }
    if (typeof showToast === 'function') {
      showToast('Cannot calculate yet — ' + missing.length + ' required input' +
                (missing.length === 1 ? '' : 's') + ' missing: ' +
                missing.map(function (f) { return f[1]; }).join(', '));
    }
  }
  return false;
}
document.addEventListener('input', function (e) {
  var id = e.target && e.target.id;
  if (!id || !SF_REQUIRED.some(function (f) { return f[0] === id; })) return;
  var cell = e.target.closest('.sf-input, .sf-rx-cell');
  if (cell && String(e.target.value).trim() !== '') cell.classList.remove('sf-missing');
});

function renderPtSizingFormulas(pt) {
  const b = patientBiometry(pt);
  const blank = ptIsBlank(pt);
  /* every seeded value passes through here, so an empty case stays empty */
  const V = (x) => (blank ? '' : x);
  const power = parseFloat(String(pt.power).split('/')[0]) || -6;
  /* A measured value always beats a seeded one: what the EHR or a scan actually
     brought in is used as-is, and only a case with no measurement falls back to
     the demo seed (which V() blanks for a patient created this minute). */
  const IV = sfImportedVals(pt);
  const pick = (k, fb) => (IV[k] != null ? IV[k] : fb);
  const ata = pick('ata', V((b.WTW.v - 0.15).toFixed(2)));
  const sts = pick('sts', V((b.WTW.v + 0.3).toFixed(2)));
  const wtw = pick('wtw', V(b.WTW.v.toFixed(2)));
  const acd = pick('acd', V(b.ACD.v.toFixed(2)));
  const clr = pick('clr', V(170 + Math.round(ptRand(pt.id,41,-50,80))));
  const kMean = pick('kmean', V(((b.K1.v + b.K2.v) / 2).toFixed(2)));
  const al = pick('al', V((b.AL && b.AL.v ? b.AL.v : (24.0 + ptRand(pt.id, 43, -1.4, 3.2))).toFixed(2)));
  const cct = pick('cct', V('548'));
  const pupil = pick('pupil', V('6.1'));
  /* aRISE is derived from ACD — with no ACD there is nothing to derive, and an
     empty field is the honest answer (it used to print NaN). */
  const arise = pick('arise', (blank || acd === '') ? '' : (parseFloat(acd) - 0.62).toFixed(2));
  const eye = pt.eye.split('/')[0].trim() || 'OD';
  const firstName = pt.name.split(' ').slice(-1)[0] || 'Patient';

  // Build KPI strip from pre-op store + biometry. Shows the surgeon at a glance
  // what data is in-hand from pre-op so the page doesn't feel empty before any input is touched.
  const _preopStore = (typeof PT_PREOP_DATA !== 'undefined') ? (PT_PREOP_DATA[pt.id] || null) : null;
  const _atts = (_preopStore && _preopStore.attachments) || [];
  const _ehrIn = !!(_preopStore && _preopStore.ehrImported);
  const _attCount = _atts.length;
  const _modSet = new Set(_atts.map(a => a.type));
  const _modChips = ['OCT','UBM','PENTACAM','IOLM']
    .filter(m => _modSet.has(m))
    .map(m => ({ OCT:'OCT', UBM:'UBM', PENTACAM:'Pentacam', IOLM:'IOL Master' }[m]));
  // Completeness: 1 (EHR) + 1 per modality attached, max 5 → ring %
  const _completeness = Math.min(100, Math.round(((_ehrIn ? 1 : 0) + _modSet.size) / 5 * 100));
  /* The strip shows exactly what the six fields in step 1 hold. */
  const _kpi = { al: al, kmean: kMean, acd: acd, wtw: wtw, cct: cct, pupil: pupil };
  const _riskBadge = pt.risk
    ? `<span class="seb-risk ${pt.risk.level}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;"><path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z"/></svg>${pt.risk.level === 'high' ? 'HIGH' : pt.risk.level === 'med' ? 'MED' : 'LOW'} risk · ${pt.risk.score}</span>`
    : '';
  const eyeLabelTxt = EYE_SCOPE === 'BOTH' ? 'OU' : EYE_SCOPE;
  // Conic-gradient progress ring for completeness
  const _ringDeg = Math.round((_completeness / 100) * 360);

  const eyeBanner = `
    <div class="sizing-eye-banner v2">
      <div class="seb-orbit"></div>
      <div class="seb-orbit seb-orbit-2"></div>
      <div class="seb-row-top">
        <div class="seb-eye-viz">
          <!-- STAAR ICL lens silhouette (same lens as EVO Connect marketplace card) with soft glow -->
          <div class="seb-lens-glow"></div>
          <svg viewBox="-245 134 468 294" xmlns="http://www.w3.org/2000/svg" aria-label="STAAR ICL lens">
            <g fill="none" stroke="#08B1C2" stroke-width="6" stroke-linecap="round" stroke-miterlimit="10">
              <path d="M216.7,372.7c0,0-0.2-0.2-0.4-0.5c-0.1-0.2-0.3-0.4-0.4-0.5c-2.7-3.7-11.4-17-11.4-38c0-25-0.6-52.8-0.6-52.8s0.6-27.9,0.6-52.8c0-21,8.7-34.3,11.4-38c0.1-0.2,0.3-0.3,0.4-0.5c0.3-0.3,0.4-0.5,0.4-0.5V189c3-4,4.8-9,4.8-14.4c0-13.4-10.9-24.3-24.3-24.3c-98,2.4-144.9-7.8-144.9-7.8l0,0c-16.4-4.2-38.7-6.8-63.2-6.8s-46.8,2.6-63.2,6.8l0,0c0,0-46.9,10.2-144.9,7.8c-13.4,0-24.3,10.9-24.3,24.3c0,5.4,1.8,10.4,4.8,14.4v0.1c0,0,0.2,0.2,0.4,0.5c0.1,0.2,0.3,0.4,0.4,0.5c2.7,3.7,11.4,17,11.4,38c0,25,0.6,52.8,0.6,52.8s-0.6,27.9-0.6,52.8c0,21-8.7,34.3-11.4,38c-0.1,0.2-0.3,0.3-0.4,0.5c-0.3,0.3-0.4,0.5-0.4,0.5v0.1c-3,4-4.8,9-4.8,14.4c0,13.4,10.9,24.3,24.3,24.3c98-2.4,144.9,7.8,144.9,7.8l0,0c16.4,4.2,38.7,6.8,63.2,6.8s46.8-2.6,63.2-6.8l0,0c0,0,46.9-10.2,144.9-7.8c13.4,0,24.3-10.9,24.3-24.3C221.5,381.8,219.7,376.8,216.7,372.7L216.7,372.7z"/>
              <circle cx="-218.2" cy="172.7" r="8"/>
              <circle cx="197.8" cy="389.2" r="8"/>
              <circle cx="-11" cy="280.8" r="111.9"/>
              <path d="M146.3,150.3c29.4,35.4,47.1,80.9,47.1,130.6c0,49.4-17.5,94.7-46.7,130"/>
              <path d="M-168.3,411.4c-29.4-35.4-47.1-80.9-47.1-130.6c0-49.4,17.5-94.7,46.7-130"/>
            </g>
          </svg>
        </div>
        <div class="seb-eye-info">
          <div class="seb-eye-headline">
            <div class="seb-eye-label" id="sebEyeLabel">${eyeLabelTxt}</div>
            <div class="seb-eye-meta">
              <div class="seb-eye-nickname">"${firstName}" · ${pt.age}y · ${pt.sex}</div>
              <div class="seb-eye-rx">
                <span>${blank ? '<b>—</b> no refraction on record' : '<b>' + power.toFixed(2) + ' D</b> sphere'}</span>
                <span class="dot">·</span>
                <span class="muted">vault not yet calculated</span>
              </div>
            </div>
          </div>
          <div class="seb-status-row">
            <span class="seb-status-chip ${_ehrIn ? 'on' : ''}">
              ${_ehrIn
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'}
              EHR ${_ehrIn ? 'synced' : 'pending'}
            </span>
            <span class="seb-status-chip studies${_attCount ? ' on' : ''}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              ${_attCount} ${_attCount === 1 ? 'study' : 'studies'} attached
            </span>
            ${_modChips.map(m => `<span class="seb-mod-chip">${m}</span>`).join('')}
            ${_riskBadge}
          </div>
        </div>
        <div class="seb-right">
          <div class="seb-eye-picker" role="tablist" aria-label="Eye selection">
            <button type="button" class="seb-eye-tab ${EYE_SCOPE==='OD'?'active':''}" data-eye="OD" onclick="setSizingEyeScope('OD')">OD</button>
            <button type="button" class="seb-eye-tab ${EYE_SCOPE==='OS'?'active':''}" data-eye="OS" onclick="setSizingEyeScope('OS')">OS</button>
            <button type="button" class="seb-eye-tab ${EYE_SCOPE==='BOTH'?'active':''}" data-eye="BOTH" onclick="setSizingEyeScope('BOTH')">Both eyes</button>
          </div>
        </div>
      </div>
      <div class="seb-kpi-strip">
        ${[['al','AL','mm'],['kmean','K-mean','D'],['acd','ACD','mm'],
            ['wtw','WTW','mm'],['cct','CCT','µm'],['pupil','Pupil','mm']]
          .map(([k, lbl, unit]) => `<div class="seb-kpi" data-kpi="${k}"><span class="kpi-lbl">${lbl}</span>` +
            `<span class="kpi-val">${_kpi[k] ? _kpi[k] + '<em>' + unit + '</em>' : '—'}</span></div>`).join('')}
      </div>
    </div>
  `;

  const sphMan = V(power.toFixed(2));
  const sphCyc = V((power + 0.25).toFixed(2));
  const sphAuto = V((power + 0.12).toFixed(2));

  const inputsHtml = `
    <!-- Sub-group A: Lens power calculation (refractions) -->
    <div class="sf-subgroup" data-sg="rx">
      <div class="sf-subgroup-head">
        <span class="sf-sg-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
        <div style="flex:1;min-width:0;">
          <div class="sf-sg-ttl">Lens power calculation</div>
          <div class="sf-sg-sub">Three refractions to cross-validate sphere/cylinder before computation.</div>
        </div>
        <div class="sf-sg-eye-tabs" role="tablist" aria-label="Editing eye">
          <span class="lbl">Editing</span>
          <button type="button" class="sf-sg-eye-tab active" data-eye="OD" onclick="switchEditingEye('rx','OD')">OD</button>
          <button type="button" class="sf-sg-eye-tab" data-eye="OS" onclick="switchEditingEye('rx','OS')">OS</button>
        </div>
        <button class="sf-sg-ehr-btn" type="button" onclick="openRxImportModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="8 8 12 4 16 8"/><line x1="12" y1="4" x2="12" y2="17"/></svg>
          Import from EHR
        </button>
      </div>
      <div class="sf-rx-grid">
        <div class="sf-rx-card">
          <div class="sf-rx-head"><span class="sf-rx-tag manifest">Manifest</span><span class="sf-rx-sub">Subjective refraction</span></div>
          <div class="sf-rx-section-lbl">Refraction</div>
          <div class="sf-rx-row">
            <div class="sf-rx-cell"><label for="sf-rx-man-sph">Sphere<abbr class="sf-req" title="Required to calculate and to order">*</abbr></label><div class="sf-input-row"><input type="text" id="sf-rx-man-sph" aria-required="true" value="${sphMan}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-man-cyl">Cylinder<abbr class="sf-req" title="Required to calculate and to order">*</abbr></label><div class="sf-input-row"><input type="text" id="sf-rx-man-cyl" aria-required="true" value="${V('-0.50')}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-man-ax">Axis<abbr class="sf-req" title="Required to calculate and to order">*</abbr></label><div class="sf-input-row"><input type="text" id="sf-rx-man-ax" aria-required="true" value="${V('178')}"/><span class="sf-unit">°</span></div></div>
          </div>
          <div class="sf-rx-section-lbl">Keratometry</div>
          <div class="sf-rx-row">
            <div class="sf-rx-cell"><label for="sf-rx-man-k1">K1</label><div class="sf-input-row"><input type="text" id="sf-rx-man-k1" value="${V((b.K1.v).toFixed(2))}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-man-k1ax">K1 axis</label><div class="sf-input-row"><input type="text" id="sf-rx-man-k1ax" value="${V('178')}"/><span class="sf-unit">°</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-man-k2">K2</label><div class="sf-input-row"><input type="text" id="sf-rx-man-k2" value="${V((b.K2.v).toFixed(2))}"/><span class="sf-unit">D</span></div></div>
          </div>
        </div>
        <div class="sf-rx-card">
          <div class="sf-rx-head"><span class="sf-rx-tag cyclo">Cycloplegic</span><span class="sf-rx-sub">Cycloplegic refraction</span></div>
          <div class="sf-rx-section-lbl">Refraction</div>
          <div class="sf-rx-row">
            <div class="sf-rx-cell"><label for="sf-rx-cyc-sph">Sphere</label><div class="sf-input-row"><input type="text" id="sf-rx-cyc-sph" value="${sphCyc}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-cyc-cyl">Cylinder</label><div class="sf-input-row"><input type="text" id="sf-rx-cyc-cyl" value="${V('-0.50')}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-cyc-ax">Axis</label><div class="sf-input-row"><input type="text" id="sf-rx-cyc-ax" value="${V('180')}"/><span class="sf-unit">°</span></div></div>
          </div>
          <div class="sf-rx-section-lbl">Keratometry</div>
          <div class="sf-rx-row">
            <div class="sf-rx-cell"><label for="sf-rx-cyc-k1">K1</label><div class="sf-input-row"><input type="text" id="sf-rx-cyc-k1" value="${V((b.K1.v - 0.05).toFixed(2))}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-cyc-k1ax">K1 axis</label><div class="sf-input-row"><input type="text" id="sf-rx-cyc-k1ax" value="${V('180')}"/><span class="sf-unit">°</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-cyc-k2">K2</label><div class="sf-input-row"><input type="text" id="sf-rx-cyc-k2" value="${V((b.K2.v - 0.04).toFixed(2))}"/><span class="sf-unit">D</span></div></div>
          </div>
        </div>
        <div class="sf-rx-card">
          <div class="sf-rx-head"><span class="sf-rx-tag auto">Autorefractor</span><span class="sf-rx-sub">Objective refraction</span></div>
          <div class="sf-rx-section-lbl">Refraction</div>
          <div class="sf-rx-row">
            <div class="sf-rx-cell"><label for="sf-rx-aut-sph">Sphere</label><div class="sf-input-row"><input type="text" id="sf-rx-aut-sph" value="${sphAuto}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-aut-cyl">Cylinder</label><div class="sf-input-row"><input type="text" id="sf-rx-aut-cyl" value="${V('-0.62')}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-aut-ax">Axis</label><div class="sf-input-row"><input type="text" id="sf-rx-aut-ax" value="${V('175')}"/><span class="sf-unit">°</span></div></div>
          </div>
          <div class="sf-rx-section-lbl">Keratometry</div>
          <div class="sf-rx-row">
            <div class="sf-rx-cell"><label for="sf-rx-aut-k1">K1</label><div class="sf-input-row"><input type="text" id="sf-rx-aut-k1" value="${V((b.K1.v + 0.03).toFixed(2))}"/><span class="sf-unit">D</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-aut-k1ax">K1 axis</label><div class="sf-input-row"><input type="text" id="sf-rx-aut-k1ax" value="${V('176')}"/><span class="sf-unit">°</span></div></div>
            <div class="sf-rx-cell"><label for="sf-rx-aut-k2">K2</label><div class="sf-input-row"><input type="text" id="sf-rx-aut-k2" value="${V((b.K2.v + 0.06).toFixed(2))}"/><span class="sf-unit">D</span></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-group B: Sizing (anatomical biometry) -->
    <div class="sf-subgroup" data-sg="sz">
      <div class="sf-subgroup-head">
        <span class="sf-sg-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></span>
        <div style="flex:1;min-width:0;">
          <div class="sf-sg-ttl">Sizing</div>
          <div class="sf-sg-sub">Anatomical biometry used by the formulas to compute size and vault.</div>
        </div>
        <div class="sf-sg-eye-tabs" role="tablist" aria-label="Editing eye">
          <span class="lbl">Editing</span>
          <button type="button" class="sf-sg-eye-tab active" data-eye="OD" onclick="switchEditingEye('sz','OD')">OD</button>
          <button type="button" class="sf-sg-eye-tab" data-eye="OS" onclick="switchEditingEye('sz','OS')">OS</button>
        </div>
        <div class="sf-sg-actions">
          <button class="sf-sg-ehr-btn ubm" type="button" onclick="openScanImportModal('UBM')" title="Imports STS, ACD, sulcus rise, ciliary body distance from UBM (high-frequency ultrasound)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M3 12c2-3 5-5 9-5s7 2 9 5c-2 3-5 5-9 5s-7-2-9-5z"/><path d="M3 6l1.5 1.5M21 6l-1.5 1.5M3 18l1.5-1.5M21 18l-1.5-1.5"/></svg>
            Import UBM
          </button>
          <button class="sf-sg-ehr-btn oct" type="button" onclick="openScanImportModal('OCT')" title="Imports ATA, aRISE and ACD from anterior-segment OCT (Casia2 / Visante)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/></svg>
            Import OCT
          </button>
          <button class="sf-sg-ehr-btn pentacam" type="button" onclick="openScanImportModal('PENTACAM')" title="Imports WTW, ACD, K-mean and crystalline lens rise from an OCULUS Pentacam Scheimpflug report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg>
            Import Pentacam
          </button>
        </div>
      </div>
      <div class="sf-inputs-grid">
        <div class="sf-input"><label for="sf-wtw">WTW (white-to-white)<abbr class="sf-req" title="Required to calculate and to order">*</abbr></label><div class="sf-input-row"><input type="text" id="sf-wtw" aria-required="true" value="${wtw}" /><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label for="sf-ata">ATA (angle-to-angle)</label><div class="sf-input-row"><input type="text" id="sf-ata" value="${ata}" /><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label for="sf-sts">STS (sulcus-to-sulcus)</label><div class="sf-input-row"><input type="text" id="sf-sts" value="${sts}" /><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label for="sf-acd">ACD<abbr class="sf-req" title="Required to calculate and to order">*</abbr></label><div class="sf-input-row"><input type="text" id="sf-acd" aria-required="true" value="${acd}" /><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label for="sf-arise">aRISE</label><div class="sf-input-row"><input type="text" id="sf-arise" value="${arise}" /><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label for="sf-clr">Crystalline lens rise</label><div class="sf-input-row"><input type="text" id="sf-clr" value="${clr}" /><span class="sf-unit">µm</span></div></div>
        <div class="sf-input"><label for="sf-kmean">K-mean</label><div class="sf-input-row"><input type="text" id="sf-kmean" value="${kMean}" /><span class="sf-unit">D</span></div></div>
        <div class="sf-input"><label for="sf-al">Axial length</label><div class="sf-input-row"><input type="text" id="sf-al" value="${al}" /><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label for="sf-cct">CCT</label><div class="sf-input-row"><input type="text" id="sf-cct" value="${cct}" /><span class="sf-unit">µm</span></div></div>
        <div class="sf-input"><label for="sf-pupil">Pupil (scotopic)</label><div class="sf-input-row"><input type="text" id="sf-pupil" value="${pupil}" /><span class="sf-unit">mm</span></div></div>
      </div>
      <div class="sf-attachments" id="sfAttachments" style="display:none;">
        <div class="sf-att-lbl">Attached scans</div>
        <div class="sf-att-list" id="sfAttList"></div>
      </div>
    </div>
    <!-- Hidden compatibility inputs so existing runSizingFormulas() that expects sf-sph / sf-cyl still works -->
    <input type="hidden" id="sf-sph" value="${sphMan}"/>
    <input type="hidden" id="sf-cyl" value="-0.50"/>
  `;

  const formulaChipsHtml = SIZING_FORMULAS.map(f => {
    const locked = f.code === MANDATORY_FORMULA;
    const selected = locked || SELECTED_SIZING_FORMULAS.has(f.code);
    const lock = '<svg class="sfc-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
    return `
      <button class="sf-formula-chip ${selected ? 'selected' : ''}${locked ? ' locked' : ''}" data-formula="${f.code}"${locked ? ' aria-disabled="true"' : ''} onclick="toggleSizingFormula('${f.code}')" title="${locked ? 'Always included in the comparison' : f.desc}">
        <span class="sfc-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        <span class="sfc-body">
          <span class="sfc-name">${f.name}${locked ? lock : ''}</span>
          <span class="sfc-author">${locked ? 'STAAR (OCOS) · always included' : f.author}</span>
        </span>
      </button>
    `;
  }).join('');

  return `
    <div class="pd-section">${eyeBanner}</div>

    <!-- STEP 1: Input data -->
    <div class="pd-section">
      <div class="sf-step-head">
        <div class="sf-step-num">1</div>
        <div class="sf-step-info">
          <h2 style="margin:0">Input Data</h2>
          <p class="muted" style="margin:2px 0 0;font-size:12px">Load refractions, keratometry and biometry. Each block can also be imported from EHR / UBM / OCT / Pentacam individually. Fields marked <abbr class="sf-req">*</abbr> are required to calculate and to order.</p>
        </div>
      </div>
      ${inputsHtml}
    </div>

    <!-- STEP 2: Formula selection -->
    <div class="pd-section">
      <div class="sf-step-head">
        <div class="sf-step-num">2</div>
        <div class="sf-step-info">
          <h2 style="margin:0">Choose which formulas to run</h2>
          <p class="muted" style="margin:2px 0 0;font-size:12px">Pick the sizing algorithms you want to compare. <b id="sfSelectedCount">${SELECTED_SIZING_FORMULAS.size}</b> selected.</p>
        </div>
      </div>
      <div class="sf-formulas-grid">${formulaChipsHtml}</div>
    </div>

    <!-- STEP 3: Calculate -->
    <div class="pd-section">
      <div class="sf-step-head">
        <div class="sf-step-num">3</div>
        <div class="sf-step-info">
          <h2 style="margin:0">Calculate</h2>
          <p class="muted" style="margin:2px 0 0;font-size:12px">Run all selected formulas and compare results side-by-side.</p>
        </div>
      </div>
      <div class="sf-calc-row">
        <button class="btn btn-primary sf-run-btn" onclick="runSizingFormulas('${pt.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          Calculate <span class="sf-run-count" id="sfRunCount">${SELECTED_SIZING_FORMULAS.size}</span> formula${SELECTED_SIZING_FORMULAS.size !== 1 ? 's' : ''}
        </button>
      </div>
    </div>

    <div class="pd-section" id="sfResults" style="display:none">
      <h4>Formula comparator <span class="tag" id="sfResultTag">—</span></h4>
      <p class="muted" style="margin-bottom:10px">Results from every selected sizing algorithm. Choose the one you are using — it is recorded with the decision on this case.</p>
      <div class="sf-results-list" id="sfResultsList"></div>
      <div class="sf-chosen-banner" id="sfChosenBanner" style="display:none"></div>
    </div>

    <!-- Pre-op attach modal — eye picker + auto-parsed values + preview -->
    <div class="rx-import-modal" id="preopAttachModal" role="dialog" aria-modal="true" aria-labelledby="preopAttachTitle" onclick="if(event.target===this) closePreopAttachModal()">
      <div class="rx-import-dialog scan-import-dialog">
        <div class="rx-import-head">
          <div>
            <h3 id="preopAttachTitle">Attach study</h3>
            <p id="preopAttachSub">Pick the eye, confirm the values and attach.</p>
          </div>
          <button class="rx-import-close" onclick="closePreopAttachModal()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="rx-import-body scan-import-body" id="preopAttachBody"></div>
        <div class="rx-import-foot">
          <button type="button" class="rx-import-cancel" onclick="closePreopAttachModal()">Cancel</button>
          <button type="button" class="rx-import-apply" id="preopAttachApplyBtn" onclick="applyPreopAttach()">Attach &amp; flow into Procedure Rec. + ICL Selection</button>
        </div>
      </div>
    </div>

    <!-- Import scan (UBM / OCT) — modal with patient list (left) + scan preview (right) -->
    <div class="rx-import-modal" id="scanImportModal" role="dialog" aria-modal="true" aria-labelledby="scanImportTitle" onclick="if(event.target===this) closeScanImportModal()">
      <div class="rx-import-dialog scan-import-dialog">
        <div class="rx-import-head">
          <div>
            <h3 id="scanImportTitle">Import scan</h3>
            <p id="scanImportSub">Pick a patient. Their imaging study and the values will be loaded into the Sizing inputs.</p>
          </div>
          <button class="rx-import-close" onclick="closeScanImportModal()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="rx-import-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#5A6478;"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input type="text" id="scanImportSearch" aria-label="Search patients to import a scan from" placeholder="Search patient by name or ID…" oninput="filterScanImportPatients(this.value)">
        </div>
        <div class="rx-import-body scan-import-body">
          <div class="rx-import-list" id="scanImportList"></div>
          <div class="scan-import-preview" id="scanImportPreview">
            <div class="rx-preview-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:32px;height:32px;color:#63708A;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
              <div style="font-size:13px;color:#5A6478;font-weight:600;margin-top:10px;">Select a patient</div>
              <div style="font-size:11.5px;color:#63708A;margin-top:4px;">The scan preview will appear here.</div>
            </div>
          </div>
        </div>
        <div class="rx-import-foot">
          <button type="button" class="rx-import-cancel" onclick="closeScanImportModal()">Cancel</button>
          <button type="button" class="rx-import-apply" id="scanImportApplyBtn" disabled onclick="applyScanImport()">Attach &amp; import values</button>
        </div>
      </div>
    </div>

    <!-- STELLA Order modal — summary of the lens order to send to STAAR -->
    <div class="rx-import-modal" id="stellaOrderModal" role="dialog" aria-modal="true" aria-labelledby="stellaOrderTitle" onclick="if(event.target===this) closeStellaOrder()">
      <div class="rx-import-dialog stella-order-dialog">
        <div class="rx-import-head stella-order-head">
          <div class="stella-order-brand">
            <div class="stella-order-logo">
              <img src="/assets/marketplace/stella_logo_official.svg" alt="Stella by STAAR Surgical">
            </div>
            <div>
              <h3 id="stellaOrderTitle">Order via STELLA</h3>
              <p>Review and submit to STAAR Surgical's STELLA platform.</p>
            </div>
          </div>
          <button class="rx-import-close" onclick="closeStellaOrder()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div class="stella-order-body" id="stellaOrderBody">
          <!-- Filled in by openStellaOrder() -->
        </div>

        <div class="rx-import-foot">
          <button type="button" class="rx-import-cancel" onclick="closeStellaOrder()">Cancel</button>
          <button type="button" class="rx-import-apply" id="stellaOrderConfirmBtn" onclick="confirmStellaOrder()">Submit order to STAAR</button>
        </div>
      </div>
    </div>

    <!-- Lightbox for clicking on attached scan thumbnails -->
    <div class="scan-lightbox" id="scanLightbox" role="dialog" aria-modal="true" onclick="if(event.target===this) closeScanLightbox()">
      <div class="scan-lightbox-inner">
        <div class="scan-lightbox-head">
          <div>
            <div class="scan-lb-ttl" id="scanLbTitle">Scan</div>
            <div class="scan-lb-sub" id="scanLbSub">—</div>
          </div>
          <button class="scan-lb-close" onclick="closeScanLightbox()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="scan-lightbox-body">
          <img id="scanLbImg" alt="Full size scan"/>
        </div>
      </div>
    </div>

    <!-- Import refractions from EHR — modal -->
    <div class="rx-import-modal" id="rxImportModal" role="dialog" aria-modal="true" aria-labelledby="rxImportTitle" onclick="if(event.target===this) closeRxImportModal()">
      <div class="rx-import-dialog">
        <div class="rx-import-head">
          <div>
            <h3 id="rxImportTitle">Import refractions from EHR</h3>
            <p>Pick a patient from your clinic EHR. Their refraction + keratometry values will be loaded into the three measurement cards above.</p>
          </div>
          <button class="rx-import-close" onclick="closeRxImportModal()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div class="rx-import-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#5A6478;"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input type="text" id="rxImportSearch" aria-label="Search patients to import a refraction from" placeholder="Search patient by name or ID…" oninput="filterRxImportPatients(this.value)">
        </div>

        <div class="rx-import-body">
          <div class="rx-import-list" id="rxImportList"></div>
          <div class="rx-import-preview" id="rxImportPreview">
            <div class="rx-preview-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:32px;height:32px;color:#63708A;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12h10M7 16h6M7 8h10"/></svg>
              <div style="font-size:13px;color:#5A6478;font-weight:600;margin-top:10px;">Select a patient</div>
              <div style="font-size:11.5px;color:#63708A;margin-top:4px;">Their EHR record will appear here for review.</div>
            </div>
          </div>
        </div>

        <div class="rx-import-foot">
          <button type="button" class="rx-import-cancel" onclick="closeRxImportModal()">Cancel</button>
          <button type="button" class="rx-import-apply" id="rxImportApplyBtn" disabled onclick="applyRxImport()">Apply to inputs</button>
        </div>
      </div>
    </div>
  `;
}
