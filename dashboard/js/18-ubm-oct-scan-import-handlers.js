// === UBM / OCT scan import handlers ===
function _highlightImportedField(id){
  var el = document.getElementById(id);
  if (!el) return;
  var wrap = el.closest('.sf-input');
  if (!wrap) return;
  wrap.classList.add('sf-input-imported');
  setTimeout(function(){ wrap.classList.remove('sf-input-imported'); }, 1800);
}

// Track which scan type the modal is currently set for + which patient is selected + attachments accumulated this session
var SCAN_IMPORT_MODE = 'OCT';      // 'OCT' or 'UBM'
var SCAN_IMPORT_SELECTED = null;   // patient id
var SF_ATTACHMENTS = [];           // array of { id, type, patientName, date, src, values }

function _scanValuesForPatient(p, mode){
  var b = patientBiometry(p);
  if (mode === 'PENTACAM') {
    /* Scheimpflug tomography: corneal diameter, chamber depth, front
       keratometry, lens rise and pachymetry — what a Pentacam report carries.
       ATA and STS are not among them: those come from AS-OCT and UBM. */
    var k1 = +(b.K1.v + ptRand(p.id, 71, -0.12, 0.12)).toFixed(2);
    var k2 = +(b.K2.v + ptRand(p.id, 72, -0.12, 0.12)).toFixed(2);
    return {
      wtw:   (b.WTW.v + ptRand(p.id, 73, -0.06, 0.06)).toFixed(2),
      acd:   (b.ACD.v + ptRand(p.id, 74, -0.03, 0.03)).toFixed(2),
      k1:    k1.toFixed(2), k2: k2.toFixed(2),
      kmean: ((k1 + k2) / 2).toFixed(2),
      clr:   String(170 + Math.round(ptRand(p.id, 75, -45, 70))),
      cct:   String(Math.round(b.CCT.v)),
      angle: (36 + ptRand(p.id, 76, -5, 6)).toFixed(1)
    };
  }
  if (mode === 'UBM') {
    return {
      sts: (b.WTW.v + 0.30 + ptRand(p.id, 81, -0.10, 0.10)).toFixed(2),
      acd: (b.ACD.v + ptRand(p.id, 82, -0.04, 0.04)).toFixed(2),
      clr: String(170 + Math.round(ptRand(p.id, 83, -50, 80))),
    };
  }
  // OCT
  return {
    ata:   (b.WTW.v - 0.15 + ptRand(p.id, 91, -0.05, 0.05)).toFixed(2),
    arise: (b.ACD.v - 0.62 + ptRand(p.id, 92, -0.10, 0.10)).toFixed(2),
    acd:   (b.ACD.v + ptRand(p.id, 93, -0.03, 0.03)).toFixed(2),
  };
}

function _scanImagePath(mode, ptId){
  if (mode === 'PENTACAM') {
    var eye = (typeof EYE_SCOPE !== 'undefined' && EYE_SCOPE === 'OS') ? 'OS' : 'OD';
    return (typeof resolvePentacamImage === 'function' ? resolvePentacamImage(eye).url
                                                      : '/assets/pentacam_saracco_OD.webp');
  }
  if (mode === 'UBM') return _galleryUbmForPatient(ptId || '', 'OD').url;
  // OCT — rotate through OCT gallery so different patients show different scans
  return _galleryOctForPatient(ptId || '', 'OD').url;
}

function _scanImportRenderList(filter){
  var f = (filter || '').trim().toLowerCase();
  var rows = (DATA.patients || []).filter(p => !f || p.name.toLowerCase().includes(f) || p.id.toLowerCase().includes(f)).map(p => {
    var sel = SCAN_IMPORT_SELECTED === p.id ? ' selected' : '';
    return '<button type="button" class="rx-import-item' + sel + '" onclick="selectScanImportPatient(\'' + p.id + '\')">' +
      '<div class="rxi-av">' + (p.name||'').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase() + '</div>' +
      '<div class="rxi-body">' +
        '<div class="rxi-name">' + p.name + '</div>' +
        '<div class="rxi-sub">REV-' + p.id + ' · ' + (p.age||'-') + 'y · ' + (p.eye||'-') + ' · ' + (p.power||'-') + ' D</div>' +
      '</div>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#63708A;flex-shrink:0;"><path d="M9 6l6 6-6 6"/></svg>' +
    '</button>';
  }).join('');
  var list = document.getElementById('scanImportList');
  if (list) list.innerHTML = rows || '<div style="padding:18px;text-align:center;color:#5A6478;font-size:12px;">No patients match.</div>';
}

function openScanImportModal(mode){
  SCAN_IMPORT_MODE = mode;
  SCAN_IMPORT_SELECTED = null;
  var m = document.getElementById('scanImportModal');
  if (!m) return;
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  var ttl = document.getElementById('scanImportTitle');
  var sub = document.getElementById('scanImportSub');
  if (ttl) ttl.textContent = mode === 'PENTACAM' ? 'Import Pentacam report' : 'Import ' + mode + ' scan';
  if (sub) sub.textContent =
      mode === 'UBM' ? 'Pick a patient. The UBM image attaches to Sizing and STS / ACD / lens rise auto-populate.'
    : mode === 'PENTACAM' ? 'Pick a patient. The Pentacam report attaches to Sizing and WTW / ACD / K-mean / lens rise auto-populate.'
    : 'Pick a patient. The OCT image attaches to Sizing and ATA / aRISE / ACD auto-populate.';
  var btn = document.getElementById('scanImportApplyBtn'); if (btn) btn.disabled = true;
  _scanImportRenderList('');
  var preview = document.getElementById('scanImportPreview');
  if (preview) preview.innerHTML =
    '<div class="rx-preview-empty">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:32px;height:32px;color:#63708A;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>' +
    '<div style="font-size:13px;color:#5A6478;font-weight:600;margin-top:10px;">Select a patient</div>' +
    '<div style="font-size:11.5px;color:#63708A;margin-top:4px;">The ' + mode + ' scan preview will appear here.</div>' +
    '</div>';
}
function closeScanImportModal(){
  var m = document.getElementById('scanImportModal');
  if (m){ m.classList.remove('open'); document.body.style.overflow = ''; }
}
function filterScanImportPatients(v){ _scanImportRenderList(v); }

function selectScanImportPatient(id){
  SCAN_IMPORT_SELECTED = id;
  _scanImportRenderList(document.getElementById('scanImportSearch') ? document.getElementById('scanImportSearch').value : '');
  var p = (DATA.patients || []).find(x => x.id === id);
  if (!p) return;
  var v = _scanValuesForPatient(p, SCAN_IMPORT_MODE);
  var img = _scanImagePath(SCAN_IMPORT_MODE, SCAN_IMPORT_SELECTED);
  var preview = document.getElementById('scanImportPreview');
  var values;
  if (SCAN_IMPORT_MODE === 'PENTACAM') {
    values = '<div class="scan-prev-row"><span>WTW</span><b>' + v.wtw + ' mm</b></div>' +
             '<div class="scan-prev-row"><span>ACD</span><b>' + v.acd + ' mm</b></div>' +
             '<div class="scan-prev-row"><span>K-mean</span><b>' + v.kmean + ' D</b></div>' +
             '<div class="scan-prev-row"><span>Crystalline lens rise</span><b>' + v.clr + ' µm</b></div>' +
             '<div class="scan-prev-note">Also on this report: K1 ' + v.k1 + ' / K2 ' + v.k2 +
               ' D · CCT ' + v.cct + ' µm · chamber angle ' + v.angle + '° — no field for these in Sizing.</div>';
  } else if (SCAN_IMPORT_MODE === 'UBM') {
    values = '<div class="scan-prev-row"><span>STS</span><b>' + v.sts + ' mm</b></div>' +
             '<div class="scan-prev-row"><span>ACD</span><b>' + v.acd + ' mm</b></div>' +
             '<div class="scan-prev-row"><span>Crystalline lens rise</span><b>' + v.clr + ' µm</b></div>';
  } else {
    values = '<div class="scan-prev-row"><span>ATA</span><b>' + v.ata + ' mm</b></div>' +
             '<div class="scan-prev-row"><span>aRISE</span><b>' + v.arise + ' mm</b></div>' +
             '<div class="scan-prev-row"><span>ACD</span><b>' + v.acd + ' mm</b></div>';
  }
  preview.innerHTML =
    '<div class="scan-prev-img-wrap">' +
      '<img src="' + img + '" alt="' + SCAN_IMPORT_MODE + ' scan" class="scan-prev-img"/>' +
    '</div>' +
    '<div class="scan-prev-meta">' +
      '<div class="scan-prev-meta-l">' +
        '<div class="scan-prev-name">' + p.name + '</div>' +
        '<div class="scan-prev-sub">REV-' + p.id + ' · ' + (p.eye||'-') + ' · ' +
          (SCAN_IMPORT_MODE === 'PENTACAM' ? 'Pentacam report' : SCAN_IMPORT_MODE + ' study') + '</div>' +
      '</div>' +
      '<div class="scan-prev-vals">' + values + '</div>' +
    '</div>';
  var btn = document.getElementById('scanImportApplyBtn'); if (btn) btn.disabled = false;
}

function applyScanImport(){
  if (!SCAN_IMPORT_SELECTED) return;
  var p = (DATA.patients || []).find(x => x.id === SCAN_IMPORT_SELECTED);
  if (!p) return;
  var v = _scanValuesForPatient(p, SCAN_IMPORT_MODE);
  /* Write the value to the field AND to the case, so the import outlives the
     current render the same way a typed value does. */
  function setVal(id, val){
    var el = document.getElementById(id); if (el){ el.value = val; _highlightImportedField(id); }
    if (typeof sfSetCaseValue === 'function' && typeof SF_FIELD_KEY !== 'undefined' && SF_FIELD_KEY[id]) {
      sfSetCaseValue(SF_FIELD_KEY[id], val);
    }
  }
  if (SCAN_IMPORT_MODE === 'PENTACAM') {
    setVal('sf-wtw', v.wtw); setVal('sf-acd', v.acd); setVal('sf-kmean', v.kmean); setVal('sf-clr', v.clr);
  } else if (SCAN_IMPORT_MODE === 'UBM') {
    setVal('sf-sts', v.sts); setVal('sf-acd', v.acd); setVal('sf-clr', v.clr);
  } else {
    setVal('sf-ata', v.ata); setVal('sf-arise', v.arise); setVal('sf-acd', v.acd);
  }
  /* The header strip mirrors these fields, and a programmatic value change
     fires no input event of its own. */
  if (typeof sebSyncStrip === 'function') sebSyncStrip();
  // Determine which eye(s) the scan applies to based on current scope
  var eyes = EYE_SCOPE === 'BOTH' ? ['OD', 'OS'] : [EYE_SCOPE];
  eyes.forEach(function(eye){
    SF_ATTACHMENTS.push({
      id: SCAN_IMPORT_MODE + '-' + eye + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
      type: SCAN_IMPORT_MODE,
      patientName: p.name,
      patientRev: p.id,
      eye: eye,
      date: new Date().toISOString().slice(0,10),
      src: _scanImagePath(SCAN_IMPORT_MODE, SCAN_IMPORT_SELECTED),
      values: v,
    });
  });
  /* Keep the import on the case, not just in the DOM: a scan attached here has
     to survive a tab switch and show up in the pre-op record, the same as one
     attached from the pre-op step. The owner is the open patient — SCAN_IMPORT_SELECTED
     is only the record the values were pulled from. */
  try {
    if (typeof CURRENT_PT !== 'undefined' && CURRENT_PT && typeof _ensurePreopStore === 'function') {
      var _store = _ensurePreopStore(CURRENT_PT.id);
      eyes.forEach(function (eye) {
        _store.attachments.push({
          id: 'sf-' + SCAN_IMPORT_MODE + '-' + eye + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          type: SCAN_IMPORT_MODE, eye: eye, date: new Date().toISOString().slice(0, 10),
          src: _scanImagePath(SCAN_IMPORT_MODE, SCAN_IMPORT_SELECTED), values: v, fileName: ''
        });
      });
    }
  } catch (e) { /* the import itself still stands */ }
  _renderScanAttachments();
  closeScanImportModal();
  if (typeof showToast === 'function') showToast((SCAN_IMPORT_MODE === 'PENTACAM' ? 'Pentacam report' : SCAN_IMPORT_MODE + ' scan') + ' attached · values imported from ' + p.name + (eyes.length>1 ? ' · OD + OS' : ' · ' + eyes[0]));
}

function _renderScanAttachments(){
  var wrap = document.getElementById('sfAttachments');
  var list = document.getElementById('sfAttList');
  if (!wrap || !list) return;
  if (SF_ATTACHMENTS.length === 0){ wrap.style.display = 'none'; list.innerHTML = ''; return; }
  wrap.style.display = '';

  function cardHtml(a){
    var typeBg = { UBM: '#00609B', PENTACAM: '#E78A27' }[a.type] || '#5C18AB';
    var typeLbl = a.type === 'PENTACAM' ? 'Pentacam' : a.type;
    return '<div class="sf-att-card" onclick="openScanLightbox(\'' + a.id + '\')">' +
      '<div class="sf-att-thumb" style="background-image:url(\'' + a.src + '\');"></div>' +
      '<div class="sf-att-meta">' +
        '<span class="sf-att-tag" style="background:' + typeBg + ';">' + typeLbl + '</span>' +
        '<div class="sf-att-name">' + a.patientName + ' · ' + a.eye + '</div>' +
        '<div class="sf-att-sub">REV-' + a.patientRev + ' · ' + a.date + '</div>' +
      '</div>' +
      '<button class="sf-att-x" onclick="event.stopPropagation();_removeScanAttachment(\'' + a.id + '\');" title="Remove attachment">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
    '</div>';
  }

  if (EYE_SCOPE === 'BOTH'){
    var od = SF_ATTACHMENTS.filter(a => a.eye === 'OD');
    var os = SF_ATTACHMENTS.filter(a => a.eye === 'OS');
    list.innerHTML =
      '<div class="sf-att-eye-col">' +
        '<div class="sf-att-eye-head"><span class="sf-eye-pill od">OD</span> Right eye <span class="ct">' + od.length + '</span></div>' +
        '<div class="sf-att-grid">' + (od.length ? od.map(cardHtml).join('') : '<div class="sf-att-empty">No scans attached for OD yet.</div>') + '</div>' +
      '</div>' +
      '<div class="sf-att-eye-col">' +
        '<div class="sf-att-eye-head"><span class="sf-eye-pill os">OS</span> Left eye <span class="ct">' + os.length + '</span></div>' +
        '<div class="sf-att-grid">' + (os.length ? os.map(cardHtml).join('') : '<div class="sf-att-empty">No scans attached for OS yet.</div>') + '</div>' +
      '</div>';
    list.classList.add('sf-att-both');
  } else {
    list.innerHTML = SF_ATTACHMENTS.map(cardHtml).join('');
    list.classList.remove('sf-att-both');
  }
}
function _removeScanAttachment(id){
  SF_ATTACHMENTS = SF_ATTACHMENTS.filter(a => a.id !== id);
  _renderScanAttachments();
}
function openScanLightbox(id){
  var a = SF_ATTACHMENTS.find(x => x.id === id);
  if (!a) return;
  var lb = document.getElementById('scanLightbox');
  var img = document.getElementById('scanLbImg');
  var t = document.getElementById('scanLbTitle');
  var s = document.getElementById('scanLbSub');
  if (img) img.src = a.src;
  if (t) t.textContent = a.type + ' · ' + a.patientName + ' (' + a.eye + ')';
  if (s) s.textContent = 'REV-' + a.patientRev + ' · captured ' + a.date;
  if (lb){ lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeScanLightbox(){
  var lb = document.getElementById('scanLightbox');
  if (lb){ lb.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    var s = document.getElementById('scanImportModal');
    if (s && s.classList.contains('open')) closeScanImportModal();
    var lb = document.getElementById('scanLightbox');
    if (lb && lb.classList.contains('open')) closeScanLightbox();
    var so = document.getElementById('stellaOrderModal');
    if (so && so.classList.contains('open')) closeStellaOrder();
  }
});
