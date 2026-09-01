// === Import-from-EHR modal: state + handlers ===
let RX_IMPORT_SELECTED = null;
function _rxImportPatientData(p){
  // Deterministic plausible refraction + K's per patient based on their power + biometry
  const sphMan = parseFloat(String(p.power).split('/')[0]) || -6;
  const k1 = (40 + ptRand(p.id, 71, 1.0, 4.0));
  const k2 = (k1 + ptRand(p.id, 72, 0.4, 2.0));
  const cylMan = -ptRand(p.id, 73, 0.25, 1.50);
  const axMan = Math.round(ptRand(p.id, 74, 1, 180));
  return {
    manifest: { sph: sphMan.toFixed(2), cyl: cylMan.toFixed(2), ax: String(axMan), k1: k1.toFixed(2), k1ax: String(axMan), k2: k2.toFixed(2) },
    cyclo:    { sph: (sphMan + 0.25).toFixed(2), cyl: cylMan.toFixed(2), ax: String((axMan + 2) % 180), k1: (k1 - 0.05).toFixed(2), k1ax: String((axMan + 2) % 180), k2: (k2 - 0.04).toFixed(2) },
    auto:     { sph: (sphMan + 0.12).toFixed(2), cyl: (cylMan - 0.12).toFixed(2), ax: String((axMan - 3 + 180) % 180), k1: (k1 + 0.03).toFixed(2), k1ax: String((axMan - 3 + 180) % 180), k2: (k2 + 0.06).toFixed(2) },
  };
}
function _rxImportRenderList(filter){
  const f = (filter || '').trim().toLowerCase();
  const rows = (DATA.patients || []).filter(p => !f || p.name.toLowerCase().includes(f) || p.id.toLowerCase().includes(f)).map(p => {
    const sel = RX_IMPORT_SELECTED === p.id ? ' selected' : '';
    return `<button type="button" class="rx-import-item${sel}" onclick="selectRxImportPatient('${p.id}')">
      <div class="rxi-av">${(p.name||'').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</div>
      <div class="rxi-body">
        <div class="rxi-name">${p.name}</div>
        <div class="rxi-sub">REV-${p.id} · ${p.age||'-'}y · ${p.eye||'-'} · ${p.power||'-'} D · stage ${p.stage||'-'}</div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#94A0B8;flex-shrink:0;"><path d="M9 6l6 6-6 6"/></svg>
    </button>`;
  }).join('');
  const list = document.getElementById('rxImportList');
  if (list) list.innerHTML = rows || '<div style="padding:18px;text-align:center;color:#5A6478;font-size:12px;">No patients match.</div>';
}
function openRxImportModal(){
  RX_IMPORT_SELECTED = null;
  var m = document.getElementById('rxImportModal');
  if (!m) return;
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  _rxImportRenderList('');
  var btn = document.getElementById('rxImportApplyBtn'); if (btn) btn.disabled = true;
  var p = document.getElementById('rxImportPreview');
  if (p) p.innerHTML = `<div class="rx-preview-empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:32px;height:32px;color:#94A0B8;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12h10M7 16h6M7 8h10"/></svg>
    <div style="font-size:13px;color:#5A6478;font-weight:600;margin-top:10px;">Select a patient</div>
    <div style="font-size:11.5px;color:#94A0B8;margin-top:4px;">Their EHR record will appear here for review.</div>
  </div>`;
}
function closeRxImportModal(){
  var m = document.getElementById('rxImportModal');
  if (m){ m.classList.remove('open'); document.body.style.overflow = ''; }
}
function filterRxImportPatients(v){ _rxImportRenderList(v); }
function selectRxImportPatient(id){
  RX_IMPORT_SELECTED = id;
  _rxImportRenderList(document.getElementById('rxImportSearch') ? document.getElementById('rxImportSearch').value : '');
  var p = (DATA.patients || []).find(x => x.id === id);
  if (!p) return;
  var d = _rxImportPatientData(p);
  var preview = document.getElementById('rxImportPreview');
  if (!preview) return;
  function block(label, cls, m){
    return `<div class="rxp-card">
      <div class="rxp-card-head"><span class="sf-rx-tag ${cls}">${label}</span></div>
      <div class="rxp-row"><span>Sphere</span><b>${m.sph} D</b></div>
      <div class="rxp-row"><span>Cylinder</span><b>${m.cyl} D</b></div>
      <div class="rxp-row"><span>Axis</span><b>${m.ax}°</b></div>
      <div class="rxp-divider"></div>
      <div class="rxp-row"><span>K1 / Eje</span><b>${m.k1} D · ${m.k1ax}°</b></div>
      <div class="rxp-row"><span>K2</span><b>${m.k2} D</b></div>
    </div>`;
  }
  preview.innerHTML = `
    <div class="rxp-head">
      <div class="rxp-name">${p.name}</div>
      <div class="rxp-sub">REV-${p.id} · ${p.age||'-'}y · ${p.eye||'-'} · ${p.power||'-'} D</div>
    </div>
    <div class="rxp-grid">
      ${block('Manifest', 'manifest', d.manifest)}
      ${block('Cycloplegic', 'cyclo', d.cyclo)}
      ${block('Autorefractor', 'auto', d.auto)}
    </div>
  `;
  var btn = document.getElementById('rxImportApplyBtn'); if (btn) btn.disabled = false;
}
function applyRxImport(){
  if (!RX_IMPORT_SELECTED) return;
  var p = (DATA.patients || []).find(x => x.id === RX_IMPORT_SELECTED);
  if (!p) return;
  var d = _rxImportPatientData(p);
  function setVal(id, v){ var el = document.getElementById(id); if (el) el.value = v; }
  // Manifest
  setVal('sf-rx-man-sph', d.manifest.sph); setVal('sf-rx-man-cyl', d.manifest.cyl); setVal('sf-rx-man-ax', d.manifest.ax);
  setVal('sf-rx-man-k1', d.manifest.k1);   setVal('sf-rx-man-k1ax', d.manifest.k1ax); setVal('sf-rx-man-k2', d.manifest.k2);
  // Cycloplegia
  setVal('sf-rx-cyc-sph', d.cyclo.sph); setVal('sf-rx-cyc-cyl', d.cyclo.cyl); setVal('sf-rx-cyc-ax', d.cyclo.ax);
  setVal('sf-rx-cyc-k1', d.cyclo.k1);   setVal('sf-rx-cyc-k1ax', d.cyclo.k1ax); setVal('sf-rx-cyc-k2', d.cyclo.k2);
  // Auto
  setVal('sf-rx-aut-sph', d.auto.sph); setVal('sf-rx-aut-cyl', d.auto.cyl); setVal('sf-rx-aut-ax', d.auto.ax);
  setVal('sf-rx-aut-k1', d.auto.k1);   setVal('sf-rx-aut-k1ax', d.auto.k1ax); setVal('sf-rx-aut-k2', d.auto.k2);
  // Hidden compatibility
  setVal('sf-sph', d.manifest.sph); setVal('sf-cyl', d.manifest.cyl);
  closeRxImportModal();
  if (typeof showToast === 'function') showToast('Refractions imported from ' + p.name);
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    var m = document.getElementById('rxImportModal');
    if (m && m.classList.contains('open')) closeRxImportModal();
  }
});

// === Eye scope (OD / OS / Both) for sizing calculation ===
var EYE_SCOPE = 'OD';

// Per-eye input store. Each entry stores { inputId: value } captured when leaving that eye.
var EYE_INPUTS = { OD: {}, OS: {} };
// Currently-displayed eye PER subgroup ('rx' = lens-power, 'sz' = sizing)
var EDITING_EYE = { rx: 'OD', sz: 'OD' };

// All input IDs we manage — so we can save/restore between eye switches
var SF_RX_IDS = [
  'sf-rx-man-sph','sf-rx-man-cyl','sf-rx-man-ax','sf-rx-man-k1','sf-rx-man-k1ax','sf-rx-man-k2',
  'sf-rx-cyc-sph','sf-rx-cyc-cyl','sf-rx-cyc-ax','sf-rx-cyc-k1','sf-rx-cyc-k1ax','sf-rx-cyc-k2',
  'sf-rx-aut-sph','sf-rx-aut-cyl','sf-rx-aut-ax','sf-rx-aut-k1','sf-rx-aut-k1ax','sf-rx-aut-k2',
];
var SF_SZ_IDS = ['sf-wtw','sf-ata','sf-sts','sf-acd','sf-arise','sf-clr','sf-kmean'];

function _saveEyeInputs(sg, fromEye){
  var ids = sg === 'rx' ? SF_RX_IDS : SF_SZ_IDS;
  EYE_INPUTS[fromEye] = EYE_INPUTS[fromEye] || {};
  ids.forEach(function(id){
    var el = document.getElementById(id);
    if (el) EYE_INPUTS[fromEye][id] = el.value;
  });
}
function _loadEyeInputs(sg, toEye){
  var ids = sg === 'rx' ? SF_RX_IDS : SF_SZ_IDS;
  var store = EYE_INPUTS[toEye] || {};
  ids.forEach(function(id){
    var el = document.getElementById(id);
    if (!el) return;
    if (store[id] !== undefined) {
      el.value = store[id];
    } else if (toEye === 'OS') {
      // First-time OS visit — leave fields editable but blank-ish (small jitter so they're not identical)
      // Use the OD value with a tiny offset to indicate they're parallel but separate
      // Skip if no OD value
    }
  });
}
function switchEditingEye(sg, eye){
  if (EDITING_EYE[sg] === eye) return;
  _saveEyeInputs(sg, EDITING_EYE[sg]);
  EDITING_EYE[sg] = eye;
  // Update tab visuals on this subgroup
  var sub = document.querySelector('.sf-subgroup[data-sg="'+sg+'"]');
  if (sub) {
    sub.querySelectorAll('.sf-sg-eye-tab').forEach(t => t.classList.toggle('active', t.dataset.eye === eye));
    sub.classList.toggle('editing-os', eye === 'OS');
  }
  _loadEyeInputs(sg, eye);
}

function setSizingEyeScope(scope){
  var prev = EYE_SCOPE;
  EYE_SCOPE = scope;
  // Update top-level tabs
  document.querySelectorAll('.seb-eye-tab').forEach(t => t.classList.toggle('active', t.dataset.eye === scope));
  // Update the OD/OS/OU label in the eye banner
  var lbl = document.getElementById('sebEyeLabel');
  if (lbl) lbl.textContent = (scope === 'BOTH') ? 'OU' : scope;
  // Toggle BOTH layout class on the page (used for attachments grid split)
  var pg = document.querySelector('.pt-main');
  if (pg) pg.classList.toggle('eye-scope-both', scope === 'BOTH');
  // Show/hide the per-subgroup OD/OS sub-tabs (they're only useful when BOTH)
  document.querySelectorAll('.sf-subgroup').forEach(sub => {
    sub.classList.toggle('show-eye-tabs', scope === 'BOTH');
  });
  // If switching OUT of BOTH, snap each subgroup back to OD and load OD values
  if (scope !== 'BOTH' && prev === 'BOTH'){
    ['rx','sz'].forEach(sg => {
      if (EDITING_EYE[sg] !== 'OD'){
        _saveEyeInputs(sg, EDITING_EYE[sg]);
        EDITING_EYE[sg] = 'OD';
        var sub = document.querySelector('.sf-subgroup[data-sg="'+sg+'"]');
        if (sub){
          sub.querySelectorAll('.sf-sg-eye-tab').forEach(t => t.classList.toggle('active', t.dataset.eye === 'OD'));
          sub.classList.remove('editing-os');
        }
        _loadEyeInputs(sg, 'OD');
      }
    });
  }
  _renderScanAttachments();
  if (typeof showToast === 'function') showToast(scope === 'BOTH' ? 'Calculating both eyes — OD + OS · use the OD/OS sub-tabs to enter each set' : 'Calculating ' + scope + ' only');
}
