// === Pre-op shared data store — flows into ICL Selection so studies aren't imported twice ===
// Shape: PT_PREOP_DATA[ptId] = {
//   ehrImported: bool, ehrPatientName: str, ehrValues: { al, k1, k2, acd, wtw, pupil, cct },
//   attachments: [ { id, type:'OCT|UBM|PENTACAM|IOLM', eye:'OD|OS', date, src, values:{}, fileName } ]
// }
var PT_PREOP_DATA = {};

function _ensurePreopStore(ptId){
  if (!PT_PREOP_DATA[ptId]) {
    PT_PREOP_DATA[ptId] = { ehrImported: false, ehrPatientName: '', ehrValues: null, attachments: [] };
  }
  return PT_PREOP_DATA[ptId];
}

function _refreshPreopMain(ptId){
  // Note: CURRENT_PT is declared with `let`, so it's NOT on window. Reference it directly.
  if (typeof CURRENT_PT === 'undefined' || !CURRENT_PT || CURRENT_PT.id !== ptId) return;
  var main = document.getElementById('ptMainContent');
  if (main && CURRENT_PT_TAB === 'preop') main.innerHTML = renderPtPreop(CURRENT_PT);
}

// Open the EHR picker modal for clinical values (AL, K1, K2, ACD, WTW, pupil, CCT)
var PREOP_EHR_OWN_PT = null;        // owning patient (where values land)
var PREOP_EHR_PICKED_PT = null;     // EHR patient whose values get pulled

function importPreopFromEHR(ptId){
  PREOP_EHR_OWN_PT = ptId;
  PREOP_EHR_PICKED_PT = ptId;
  _ensurePreopEhrModalMounted();
  var m = document.getElementById('preopEhrModal');
  if (!m) return;
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  _renderPreopEhrModalBody();
}

function closePreopEhrModal(){
  var m = document.getElementById('preopEhrModal');
  if (m){ m.classList.remove('open'); document.body.style.overflow = ''; }
}

function selectPreopEhrPatient(id){ PREOP_EHR_PICKED_PT = id; _renderPreopEhrModalBody(); }

function filterPreopEhrPatients(q){
  var f = (q || '').trim().toLowerCase();
  var rows = (DATA.patients || []).filter(function(p){
    return !f || p.name.toLowerCase().includes(f) || p.id.toLowerCase().includes(f);
  }).map(function(p){
    var sel = PREOP_EHR_PICKED_PT === p.id ? ' selected' : '';
    return '<button type="button" class="rx-import-item' + sel + '" onclick="selectPreopEhrPatient(\'' + p.id + '\')">' +
      '<div class="rxi-av">' + (p.name||'').split(' ').map(function(s){return s[0];}).join('').slice(0,2).toUpperCase() + '</div>' +
      '<div class="rxi-body">' +
        '<div class="rxi-name">' + p.name + '</div>' +
        '<div class="rxi-sub">REV-' + p.id + ' · ' + (p.age||'-') + 'y · ' + (p.eye||'-') + ' · ' + (p.power||'-') + ' D</div>' +
      '</div>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#63708A;flex-shrink:0;"><path d="M9 6l6 6-6 6"/></svg>' +
    '</button>';
  }).join('');
  var listEl = document.getElementById('preopEhrModalList');
  if (listEl) listEl.innerHTML = rows || '<div style="padding:18px;text-align:center;color:#5A6478;font-size:12px;">No patients match.</div>';
}

function _renderPreopEhrModalBody(){
  var p = (DATA.patients||[]).find(function(x){ return x.id === PREOP_EHR_PICKED_PT; });
  var preview = '';
  if (p) {
    var b = patientBiometry(p);
    preview =
      '<div class="pmd-prev-icon" style="background:#fff;">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:42px;height:42px;color:#5C18AB;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        '<div class="pmd-prev-cap" style="font-weight:800;color:#001E60;">' + p.name + ' · clinical record</div>' +
        '<div style="font-size:11px;color:#5A6478;margin-top:-4px;">REV-' + p.id + ' · last updated ' + new Date().toISOString().slice(0,10) + '</div>' +
      '</div>' +
      '<div class="pmd-vals" style="width:100%;max-width:320px;margin-top:14px;">' +
        '<div class="pmd-vrow"><span>AL</span><b>' + b.AL.v.toFixed(2) + ' mm</b></div>' +
        '<div class="pmd-vrow"><span>K1</span><b>' + b.K1.v.toFixed(2) + ' D</b></div>' +
        '<div class="pmd-vrow"><span>K2</span><b>' + b.K2.v.toFixed(2) + ' D</b></div>' +
        '<div class="pmd-vrow"><span>ACD</span><b>' + b.ACD.v.toFixed(2) + ' mm</b></div>' +
        '<div class="pmd-vrow"><span>WTW</span><b>' + b.WTW.v.toFixed(2) + ' mm</b></div>' +
        '<div class="pmd-vrow"><span>CCT</span><b>548 µm</b></div>' +
      '</div>';
  } else {
    preview =
      '<div class="pmd-prev-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:42px;height:42px;color:#CBD2DD;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
        '<div class="pmd-prev-cap">Pick a patient from the EHR.</div>' +
      '</div>';
  }
  var btn = document.getElementById('preopEhrApplyBtn');
  if (btn) btn.disabled = !p;

  var body = document.getElementById('preopEhrModalBody');
  if (!body) return;
  body.innerHTML =
    '<div class="pmd-left">' +
      '<div class="pmd-section-lbl">EHR · clinical record</div>' +
      '<div class="rx-import-search" style="margin:6px 0 8px;">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#5A6478;"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
        '<input type="text" placeholder="Search patient by name or ID…" oninput="filterPreopEhrPatients(this.value)">' +
      '</div>' +
      '<div class="rx-import-list" id="preopEhrModalList" style="max-height:360px;"></div>' +
    '</div>' +
    '<div class="pmd-right">' + preview +
      '<div class="pmd-helper" style="margin-top:14px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;color:#5C18AB;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Values pre-populate ICL Selection AND auto-fill Procedure Recommendation Patient Parameters.</div>' +
    '</div>';
  // Initial render of the patient list
  filterPreopEhrPatients('');
}

function _ensurePreopEhrModalMounted(){
  if (document.getElementById('preopEhrModal')) return;
  var modal = document.createElement('div');
  modal.className = 'rx-import-modal';
  modal.id = 'preopEhrModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.onclick = function(ev){ if (ev.target === modal) closePreopEhrModal(); };
  modal.innerHTML =
    '<div class="rx-import-dialog scan-import-dialog">' +
      '<div class="rx-import-head">' +
        '<div>' +
          '<h3>Import clinical values from EHR</h3>' +
          '<p>Pick the patient whose record you want to pull. Values flow into ICL Selection AND Procedure Recommendation.</p>' +
        '</div>' +
        '<button class="rx-import-close" onclick="closePreopEhrModal()" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="rx-import-body scan-import-body" id="preopEhrModalBody"></div>' +
      '<div class="rx-import-foot">' +
        '<button type="button" class="rx-import-cancel" onclick="closePreopEhrModal()">Cancel</button>' +
        '<button type="button" class="rx-import-apply" id="preopEhrApplyBtn" onclick="applyPreopEhrImport()">Import &amp; auto-fill</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
}

function applyPreopEhrImport(){
  if (!PREOP_EHR_OWN_PT || !PREOP_EHR_PICKED_PT) return;
  var owningPt = (DATA.patients||[]).find(function(x){ return x.id === PREOP_EHR_OWN_PT; });
  var dataPt = (DATA.patients||[]).find(function(x){ return x.id === PREOP_EHR_PICKED_PT; });
  if (!owningPt || !dataPt) return;
  var b = patientBiometry(dataPt);
  var s = _ensurePreopStore(owningPt.id);
  s.ehrImported = true;
  s.ehrPatientName = dataPt.name;
  s.ehrValues = {
    al: b.AL.v.toFixed(2),
    k1: b.K1.v.toFixed(2),
    k2: b.K2.v.toFixed(2),
    acd: b.ACD.v.toFixed(2),
    wtw: b.WTW.v.toFixed(2),
    pupil: '6.1',
    cct: '548'
  };
  closePreopEhrModal();
  _refreshPreopMain(owningPt.id);
  _postPatientParamsToRaFrame(owningPt.id);
  if (typeof showToast === 'function') showToast('Imported clinical values from EHR · auto-filled Procedure Recommendation · ' + dataPt.name);
}

// Mode -> simulated values + filename + scan asset path
function _preopValuesForMode(p, mode){
  var b = patientBiometry(p);
  if (mode === 'UBM') return {
    sts:   (b.WTW.v + 0.30 + ptRand(p.id, 81, -0.10, 0.10)).toFixed(2),
    acd:   (b.ACD.v + ptRand(p.id, 82, -0.04, 0.04)).toFixed(2),
    clr:   String(170 + Math.round(ptRand(p.id, 83, -50, 80))),
  };
  if (mode === 'OCT') return {
    ata:   (b.WTW.v - 0.15 + ptRand(p.id, 91, -0.05, 0.05)).toFixed(2),
    arise: (b.ACD.v - 0.62 + ptRand(p.id, 92, -0.10, 0.10)).toFixed(2),
    acd:   (b.ACD.v + ptRand(p.id, 93, -0.03, 0.03)).toFixed(2),
  };
  if (mode === 'PENTACAM') return {
    k1:  b.K1.v.toFixed(2),
    k2:  b.K2.v.toFixed(2),
    ata: (b.WTW.v - 0.20 + ptRand(p.id, 71, -0.05, 0.05)).toFixed(2),
    cct: String(540 + Math.round(ptRand(p.id, 72, -20, 25))),
  };
  if (mode === 'IOLM') return {
    al:  b.AL.v.toFixed(2),
    k1:  b.K1.v.toFixed(2),
    k2:  b.K2.v.toFixed(2),
    acd: b.ACD.v.toFixed(2),
    wtw: b.WTW.v.toFixed(2),
  };
  return {};
}
function _preopAssetForMode(mode, ptId){
  if (mode === 'UBM') return _galleryUbmForPatient(ptId || '', 'OD').url;
  if (mode === 'OCT') return _galleryOctForPatient(ptId || '', 'OD').url;
  if (mode === 'PENTACAM') return DEFAULT_PENTACAM.OD.url;
  return ''; // IOLM still icon-only
}
function _preopLabelForMode(mode){
  return { OCT:'OCT', UBM:'UBM', PENTACAM:'Pentacam', IOLM:'IOL Master' }[mode] || mode;
}

// Modal state — supports two ingestion sources: EHR patient list OR direct file upload
var PREOP_ATTACH_PT = null;             // owning patient (the one whose record we're enriching)
var PREOP_ATTACH_MODE = 'OCT';
var PREOP_ATTACH_EYE = 'OD';
var PREOP_ATTACH_SOURCE = 'EHR';        // 'EHR' | 'UPLOAD'
var PREOP_ATTACH_SELECTED_PT = null;    // EHR patient picked from the list (defaults to current patient)
var PREOP_ATTACH_UPLOAD = null;         // { name, sizeKb, parsedAt } — simulated upload metadata

// Lazy-mount the modal directly in <body> the first time it's needed.
// We can't rely on the template-literal copy because that one only exists
// when the ICL Selection tab is mounted.
function _ensurePreopAttachModalMounted(){
  if (document.getElementById('preopAttachModal')) return;
  var modal = document.createElement('div');
  modal.className = 'rx-import-modal';
  modal.id = 'preopAttachModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'preopAttachTitle');
  modal.onclick = function(ev){ if (ev.target === modal) closePreopAttachModal(); };
  modal.innerHTML =
    '<div class="rx-import-dialog scan-import-dialog">' +
      '<div class="rx-import-head">' +
        '<div>' +
          '<h3 id="preopAttachTitle">Attach study</h3>' +
          '<p id="preopAttachSub">Pick the source — your EHR or a file from this device.</p>' +
        '</div>' +
        '<button class="rx-import-close" onclick="closePreopAttachModal()" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="rx-import-body scan-import-body" id="preopAttachBody"></div>' +
      '<div class="rx-import-foot">' +
        '<button type="button" class="rx-import-cancel" onclick="closePreopAttachModal()">Cancel</button>' +
        '<button type="button" class="rx-import-apply" id="preopAttachApplyBtn" onclick="applyPreopAttach()">Attach &amp; flow into Procedure Rec. + ICL Selection</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
}

function openPreopAttachModal(ptId, mode){
  PREOP_ATTACH_PT = ptId;
  PREOP_ATTACH_MODE = mode;
  PREOP_ATTACH_EYE = 'OD';
  PREOP_ATTACH_SOURCE = 'EHR';
  PREOP_ATTACH_SELECTED_PT = ptId; // default to the same patient
  PREOP_ATTACH_UPLOAD = null;
  _ensurePreopAttachModalMounted();
  var m = document.getElementById('preopAttachModal');
  if (!m) return;
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  _renderPreopAttachModalBody();
}
function closePreopAttachModal(){
  var m = document.getElementById('preopAttachModal');
  if (m){ m.classList.remove('open'); document.body.style.overflow = ''; }
}
function setPreopAttachEye(eye){ PREOP_ATTACH_EYE = eye; _renderPreopAttachModalBody(); }
function setPreopAttachSource(src){
  PREOP_ATTACH_SOURCE = src;
  if (src === 'UPLOAD') { PREOP_ATTACH_SELECTED_PT = null; }
  else { PREOP_ATTACH_SELECTED_PT = PREOP_ATTACH_SELECTED_PT || PREOP_ATTACH_PT; PREOP_ATTACH_UPLOAD = null; }
  _renderPreopAttachModalBody();
}
function selectPreopAttachPatient(id){ PREOP_ATTACH_SELECTED_PT = id; _renderPreopAttachModalBody(); }
function filterPreopAttachPatients(q){
  var f = (q || '').trim().toLowerCase();
  var listEl = document.getElementById('preopEhrList');
  if (!listEl) return;
  listEl.innerHTML = _renderPreopEhrListItems(f);
}

function _renderPreopEhrListItems(filter){
  var f = (filter || '').trim().toLowerCase();
  var rows = (DATA.patients || []).filter(function(p){
    return !f || p.name.toLowerCase().includes(f) || p.id.toLowerCase().includes(f);
  }).map(function(p){
    var sel = PREOP_ATTACH_SELECTED_PT === p.id ? ' selected' : '';
    return '<button type="button" class="rx-import-item' + sel + '" onclick="selectPreopAttachPatient(\'' + p.id + '\')">' +
      '<div class="rxi-av">' + (p.name||'').split(' ').map(function(s){return s[0];}).join('').slice(0,2).toUpperCase() + '</div>' +
      '<div class="rxi-body">' +
        '<div class="rxi-name">' + p.name + '</div>' +
        '<div class="rxi-sub">REV-' + p.id + ' · ' + (p.age||'-') + 'y · ' + (p.eye||'-') + ' · ' + (p.power||'-') + ' D</div>' +
      '</div>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#63708A;flex-shrink:0;"><path d="M9 6l6 6-6 6"/></svg>' +
    '</button>';
  }).join('');
  return rows || '<div style="padding:18px;text-align:center;color:#5A6478;font-size:12px;">No patients match.</div>';
}

function simulatePreopUpload(input){
  // input is the <input type="file"> element. We don't actually parse — we simulate parsing.
  var f = (input && input.files && input.files[0]) ? input.files[0] : null;
  if (!f) return;
  PREOP_ATTACH_UPLOAD = {
    name: f.name,
    sizeKb: Math.max(1, Math.round((f.size || 1024) / 1024)),
    parsedAt: new Date().toISOString().slice(11,19),
  };
  _renderPreopAttachModalBody();
}

function _renderPreopAttachModalBody(){
  var modal = document.getElementById('preopAttachModal');
  if (!modal) return;
  var body  = document.getElementById('preopAttachBody');
  var title = document.getElementById('preopAttachTitle');
  var sub   = document.getElementById('preopAttachSub');
  var owningPt = (DATA.patients||[]).find(function(x){ return x.id === PREOP_ATTACH_PT; });
  if (!owningPt) return;
  var label = _preopLabelForMode(PREOP_ATTACH_MODE);
  if (title) title.textContent = 'Attach ' + label + ' study · ' + owningPt.name;
  if (sub) sub.textContent = 'Pick the source — your EHR or a file from this device. Values flow into ICL Selection AND auto-fill the Procedure Recommendation.';

  // Determine the "data patient" — the one we're parsing values from
  var dataPt = PREOP_ATTACH_SELECTED_PT
    ? (DATA.patients||[]).find(function(x){ return x.id === PREOP_ATTACH_SELECTED_PT; }) || owningPt
    : owningPt;
  var v = _preopValuesForMode(dataPt, PREOP_ATTACH_MODE);
  var asset = _preopAssetForMode(PREOP_ATTACH_MODE, PREOP_ATTACH_PT);

  // === LEFT pane: source picker ===
  var sourceTabs =
    '<div class="pmd-source-tabs">' +
      '<button type="button" class="pmd-source-tab' + (PREOP_ATTACH_SOURCE==='EHR'?' active':'') + '" onclick="setPreopAttachSource(\'EHR\')">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>' +
        'From EHR' +
      '</button>' +
      '<button type="button" class="pmd-source-tab' + (PREOP_ATTACH_SOURCE==='UPLOAD'?' active':'') + '" onclick="setPreopAttachSource(\'UPLOAD\')">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
        'Upload from device' +
      '</button>' +
    '</div>';

  var sourceBody = '';
  if (PREOP_ATTACH_SOURCE === 'EHR') {
    sourceBody =
      '<div class="rx-import-search" style="margin:10px 0 8px;">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#5A6478;"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
        '<input type="text" id="preopEhrSearch" placeholder="Search patient by name or ID…" oninput="filterPreopAttachPatients(this.value)">' +
      '</div>' +
      '<div class="rx-import-list" id="preopEhrList" style="max-height:280px;">' + _renderPreopEhrListItems('') + '</div>';
  } else {
    var ext = PREOP_ATTACH_MODE === 'OCT' ? '.dcm,.oct,.e2e,.fda' :
              PREOP_ATTACH_MODE === 'UBM' ? '.dcm,.bmp,.jpg,.png' :
              PREOP_ATTACH_MODE === 'PENTACAM' ? '.csv,.pdf,.dcm,.cae' :
              '.xml,.pdf,.dcm';
    sourceBody = PREOP_ATTACH_UPLOAD
      ? '<div class="pmd-upload-done">' +
          '<div class="pmd-up-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><polyline points="20 6 9 17 4 12"/></svg></div>' +
          '<div class="pmd-up-body">' +
            '<div class="pmd-up-name">' + PREOP_ATTACH_UPLOAD.name + '</div>' +
            '<div class="pmd-up-sub">' + PREOP_ATTACH_UPLOAD.sizeKb + ' KB · parsed at ' + PREOP_ATTACH_UPLOAD.parsedAt + ' · ' + label + '</div>' +
          '</div>' +
          '<button type="button" class="pmd-up-replace" onclick="document.getElementById(\'preopFileInput\').click()">Replace</button>' +
          '<input type="file" id="preopFileInput" accept="' + ext + '" style="display:none;" onchange="simulatePreopUpload(this)"/>' +
        '</div>'
      : '<div class="pmd-upload-drop" onclick="document.getElementById(\'preopFileInput\').click()">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:36px;height:36px;color:#63708A;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
          '<div class="pmd-up-drop-ttl">Drop your ' + label + ' file here</div>' +
          '<div class="pmd-up-drop-sub">or click to browse · ' + ext.replace(/,/g,' ') + '</div>' +
          '<input type="file" id="preopFileInput" accept="' + ext + '" style="display:none;" onchange="simulatePreopUpload(this)"/>' +
        '</div>';
  }

  // === RIGHT pane: preview + values + eye picker ===
  var canShowValues = (PREOP_ATTACH_SOURCE === 'EHR' && PREOP_ATTACH_SELECTED_PT) ||
                      (PREOP_ATTACH_SOURCE === 'UPLOAD' && PREOP_ATTACH_UPLOAD);
  var preview = '';
  if (canShowValues) {
    preview = asset
      ? '<div class="pmd-prev-img-wrap"><img src="' + asset + '" alt="' + label + ' scan" class="pmd-prev-img"/></div>'
      : '<div class="pmd-prev-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:42px;height:42px;color:#63708A;"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg><div class="pmd-prev-cap">' + label + ' report · auto-parsed</div></div>';
  } else {
    preview = '<div class="pmd-prev-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:42px;height:42px;color:#CBD2DD;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><div class="pmd-prev-cap">Pick a source to preview the ' + label + ' values.</div></div>';
  }

  var valRows = canShowValues
    ? Object.entries(v).map(function(kv){ return '<div class="pmd-vrow"><span>' + kv[0].toUpperCase() + '</span><b>' + kv[1] + '</b></div>'; }).join('')
    : '<div class="pmd-vrow disabled">—</div><div class="pmd-vrow disabled">—</div><div class="pmd-vrow disabled">—</div><div class="pmd-vrow disabled">—</div>';

  var eyeTabs = '<div class="pmd-eye-tabs">' +
    ['OD','OS','BOTH'].map(function(e){
      var lbl = e === 'BOTH' ? 'Both eyes' : e;
      return '<button type="button" class="pmd-eye-tab' + (PREOP_ATTACH_EYE===e?' active':'') + '" onclick="setPreopAttachEye(\'' + e + '\')">' + lbl + '</button>';
    }).join('') + '</div>';

  body.innerHTML =
    '<div class="pmd-left">' +
      '<div class="pmd-section-lbl">Owning record</div>' +
      '<div class="pmd-pt-row">' +
        '<div class="pmd-pt-av">' + (owningPt.name||'').split(' ').map(function(s){return s[0];}).join('').slice(0,2).toUpperCase() + '</div>' +
        '<div><div class="pmd-pt-name">' + owningPt.name + '</div><div class="pmd-pt-sub">REV-' + owningPt.id + ' · ' + (owningPt.age||'-') + 'y · ' + (owningPt.power||'-') + ' D</div></div>' +
      '</div>' +
      '<div class="pmd-section-lbl" style="margin-top:14px;">Source</div>' +
      sourceTabs + sourceBody +
    '</div>' +
    '<div class="pmd-right">' +
      preview +
      '<div class="pmd-section-lbl" style="margin-top:14px;">Eye</div>' +
      eyeTabs +
      '<div class="pmd-section-lbl" style="margin-top:12px;">Auto-parsed values</div>' +
      '<div class="pmd-vals">' + valRows + '</div>' +
      '<div class="pmd-helper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;color:#5C18AB;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>These values pre-populate ICL Selection AND the Procedure Recommendation Patient Parameters.</div>' +
    '</div>';

  var applyBtn = document.getElementById('preopAttachApplyBtn');
  if (applyBtn) applyBtn.disabled = !canShowValues;
}
function applyPreopAttach(){
  if (!PREOP_ATTACH_PT) return;
  var owningPt = (DATA.patients||[]).find(function(x){ return x.id === PREOP_ATTACH_PT; });
  if (!owningPt) return;
  // The data patient — for EHR source, it's the picked patient; for UPLOAD, it's the owning patient
  var dataPt = (PREOP_ATTACH_SOURCE === 'EHR' && PREOP_ATTACH_SELECTED_PT)
    ? ((DATA.patients||[]).find(function(x){ return x.id === PREOP_ATTACH_SELECTED_PT; }) || owningPt)
    : owningPt;
  // Guard: must have a source picked
  var canApply = (PREOP_ATTACH_SOURCE === 'EHR' && PREOP_ATTACH_SELECTED_PT) ||
                 (PREOP_ATTACH_SOURCE === 'UPLOAD' && PREOP_ATTACH_UPLOAD);
  if (!canApply) return;

  var s = _ensurePreopStore(owningPt.id);
  var v = _preopValuesForMode(dataPt, PREOP_ATTACH_MODE);
  var assetSrc = _preopAssetForMode(PREOP_ATTACH_MODE, owningPt.id);
  var date = new Date().toISOString().slice(0,10);
  var label = _preopLabelForMode(PREOP_ATTACH_MODE);
  var eyes = PREOP_ATTACH_EYE === 'BOTH' ? ['OD','OS'] : [PREOP_ATTACH_EYE];
  var fileName = (PREOP_ATTACH_SOURCE === 'UPLOAD' && PREOP_ATTACH_UPLOAD)
    ? PREOP_ATTACH_UPLOAD.name
    : label.replace(/\s/g,'') + '_' + owningPt.name.split(' ').slice(-1)[0];
  eyes.forEach(function(eye){
    s.attachments.push({
      id: PREOP_ATTACH_MODE + '-' + eye + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
      type: PREOP_ATTACH_MODE,
      eye: eye,
      date: date,
      src: assetSrc,
      values: v,
      fileName: fileName + (eyes.length > 1 ? '_' + eye : '') + (PREOP_ATTACH_SOURCE === 'UPLOAD' ? '' : '.dcm'),
      source: PREOP_ATTACH_SOURCE,  // 'EHR' | 'UPLOAD'
    });
  });
  closePreopAttachModal();
  _refreshPreopMain(owningPt.id);

  // Auto-parse post-op data when an OCT is attached while viewing the post-op tab.
  // Generates simulated AS-OCT parsed values + flags them as auto-filled so the UI flashes them.
  if (CURRENT_PT_TAB === 'postop' && PREOP_ATTACH_MODE === 'OCT' && typeof _autoFillPostopFromOct === 'function') {
    eyes.forEach(function(eye){ _autoFillPostopFromOct(owningPt, eye, CURRENT_PT_POSTOP_MS); });
  }
  // Also refresh post-op if the user is viewing it (the OCT image swap happens here)
  if (typeof _refreshPostopMain === 'function' && CURRENT_PT_TAB === 'postop') _refreshPostopMain();
  // Push values into the Procedure Recommendation iframe (Patient Parameters)
  _postPatientParamsToRaFrame(owningPt.id);
  var srcLbl = PREOP_ATTACH_SOURCE === 'UPLOAD' ? 'uploaded' : 'imported from EHR';
  if (typeof showToast === 'function') showToast(label + ' ' + srcLbl + ' · auto-filled Procedure Recommendation + ICL Selection · ' + (eyes.length>1 ? 'OD + OS' : eyes[0]));
}

// Auto-resize the Procedure Rec iframe to its actual content height so it embeds natively
// (no inner scrollbar, no framed look). Both files are local file:// so same-origin access works.
// Falls back gracefully if the browser blocks it.
function _autoResizeRaFrame(ptId){
  var iframe = document.getElementById('raFrame_' + ptId);
  if (!iframe) return;
  function applySize(){
    try {
      var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc) return;
      // Hide the scrollbar inside the iframe defensively
      try {
        if (!doc.getElementById('__revai_no_scroll')){
          var st = doc.createElement('style');
          st.id = '__revai_no_scroll';
          st.textContent = 'html, body { overflow: hidden !important; background: transparent !important; }';
          doc.head && doc.head.appendChild(st);
        }
      } catch(_){ /* ignore */ }
      var h = Math.max(
        doc.documentElement.scrollHeight || 0,
        doc.body ? doc.body.scrollHeight : 0,
        doc.documentElement.offsetHeight || 0,
        doc.body ? doc.body.offsetHeight : 0
      );
      if (h > 0) iframe.style.height = (h + 8) + 'px';
    } catch(_){ /* cross-origin or not ready — leave the fallback height in place */ }
  }
  // Initial sync + a few re-tries to capture any layout that settles late (fonts, async render)
  applySize();
  [120, 350, 800, 1500].forEach(function(ms){ setTimeout(applySize, ms); });
  // Watch for window resize so the iframe re-fits
  if (!iframe.__revaiResizeBound){
    iframe.__revaiResizeBound = true;
    window.addEventListener('resize', function(){ applySize(); });
  }
}

// Post the latest pre-op data into the Procedure Recommendation iframe.
// The iframe is a bundled SPA we don't control — postMessage gives the ingest a clear path
// when/if the iframe wants to listen, and the visual chip shown above the iframe confirms to the
// surgeon that the data was propagated, even if the iframe doesn't repaint itself.
function _postPatientParamsToRaFrame(ptId){
  var s = (typeof PT_PREOP_DATA !== 'undefined') ? PT_PREOP_DATA[ptId] : null;
  if (!s) return;
  var p = (DATA.patients||[]).find(function(x){ return x.id === ptId; });
  if (!p) return;
  var b = patientBiometry(p);
  // Aggregate the freshest values per eye (last attachment wins)
  function mergeForEye(eye){
    var vals = {};
    (s.attachments || []).forEach(function(a){
      if (a.eye === eye || PREOP_ATTACH_EYE === 'BOTH') Object.assign(vals, a.values);
    });
    if (s.ehrImported && s.ehrValues) Object.assign(vals, s.ehrValues);
    return vals;
  }
  var payload = {
    type: 'revai:patientParameters',
    patientId: ptId,
    age: p.age, sex: p.sex,
    sphereOD: parseFloat(String(p.power).split('/')[0]) || null,
    sphereOS: parseFloat(String(p.power).split('/')[1]) || null,
    od: mergeForEye('OD'),
    os: mergeForEye('OS'),
    biometryFallback: { al: b.AL.v, k1: b.K1.v, k2: b.K2.v, acd: b.ACD.v, wtw: b.WTW.v },
    ts: Date.now(),
  };
  // Try by id first, then fall back to the first iframe on the page
  var iframe = document.getElementById('raFrame_' + ptId) || document.querySelector('.ra-frame');
  if (iframe && iframe.contentWindow) {
    try { iframe.contentWindow.postMessage(payload, '*'); } catch(_){ /* ignore */ }
  }
}
function removePreopAttachment(ptId, attId){
  var s = _ensurePreopStore(ptId);
  s.attachments = s.attachments.filter(function(a){ return a.id !== attId; });
  _refreshPreopMain(ptId);
}

// Hydrate the ICL Selection inputs + attachments from the pre-op store
// — this is what makes pre-op work flow into ICL Selection automatically.
function _hydrateSizingFromPreop(pt){
  if (!pt) return;
  var s = PT_PREOP_DATA[pt.id];
  if (!s) return;

  // 1) Clinical values (EHR) → fill sf-wtw, sf-acd, sf-kmean if present and visible
  if (s.ehrImported && s.ehrValues) {
    var v = s.ehrValues;
    var fillMap = { 'sf-wtw': v.wtw, 'sf-acd': v.acd };
    if (v.k1 && v.k2) fillMap['sf-kmean'] = (((+v.k1) + (+v.k2)) / 2).toFixed(2);
    Object.keys(fillMap).forEach(function(id){
      var el = document.getElementById(id);
      if (el && fillMap[id] != null) {
        el.value = fillMap[id];
        if (typeof _highlightImportedField === 'function') _highlightImportedField(id);
      }
    });
  }

  // 2) Imaging attachments → fill matching modality fields and push into SF_ATTACHMENTS
  if (Array.isArray(s.attachments) && s.attachments.length) {
    s.attachments.forEach(function(a){
      // Only mirror to the live editing eye unless BOTH; for visual rail show all attachments.
      var v = a.values || {};
      if (a.type === 'OCT') {
        if (v.ata)   { var e = document.getElementById('sf-ata');   if (e) { e.value = v.ata;   _highlightImportedField('sf-ata'); } }
        if (v.arise) { var f = document.getElementById('sf-arise'); if (f) { f.value = v.arise; _highlightImportedField('sf-arise'); } }
        if (v.acd)   { var g = document.getElementById('sf-acd');   if (g) { g.value = v.acd;   _highlightImportedField('sf-acd'); } }
      } else if (a.type === 'UBM') {
        if (v.sts) { var u1 = document.getElementById('sf-sts'); if (u1) { u1.value = v.sts; _highlightImportedField('sf-sts'); } }
        if (v.acd) { var u2 = document.getElementById('sf-acd'); if (u2) { u2.value = v.acd; _highlightImportedField('sf-acd'); } }
        if (v.clr) { var u3 = document.getElementById('sf-clr'); if (u3) { u3.value = v.clr; _highlightImportedField('sf-clr'); } }
      } else if (a.type === 'PENTACAM') {
        if (v.ata) { var p1 = document.getElementById('sf-ata');   if (p1) { p1.value = v.ata;   _highlightImportedField('sf-ata'); } }
        if (v.k1 && v.k2) { var pk = document.getElementById('sf-kmean'); if (pk) { pk.value = (((+v.k1)+(+v.k2))/2).toFixed(2); _highlightImportedField('sf-kmean'); } }
      } else if (a.type === 'IOLM') {
        if (v.wtw) { var i1 = document.getElementById('sf-wtw'); if (i1) { i1.value = v.wtw; _highlightImportedField('sf-wtw'); } }
        if (v.acd) { var i2 = document.getElementById('sf-acd'); if (i2) { i2.value = v.acd; _highlightImportedField('sf-acd'); } }
        if (v.k1 && v.k2) { var ik = document.getElementById('sf-kmean'); if (ik) { ik.value = (((+v.k1)+(+v.k2))/2).toFixed(2); _highlightImportedField('sf-kmean'); } }
      }

      // Mirror only image-bearing scans (OCT/UBM) into the SF_ATTACHMENTS rail to avoid clutter
      if ((a.type === 'OCT' || a.type === 'UBM') && a.src) {
        var alreadyMirrored = (typeof SF_ATTACHMENTS !== 'undefined' && SF_ATTACHMENTS.some(function(x){ return x._preopId === a.id; }));
        if (!alreadyMirrored && typeof SF_ATTACHMENTS !== 'undefined') {
          SF_ATTACHMENTS.push({
            id: 'mirror-' + a.id,
            _preopId: a.id,
            type: a.type,
            patientName: pt.name,
            patientRev: pt.id,
            eye: a.eye,
            date: a.date,
            src: a.src,
            values: a.values,
          });
        }
      }
    });
    if (typeof _renderScanAttachments === 'function') _renderScanAttachments();
  }
}
