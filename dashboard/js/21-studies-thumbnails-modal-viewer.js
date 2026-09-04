/* ================================================================
   Studies — thumbnails + modal viewer
================================================================ */
/* Real clinical images for specific patients (e.g. Mariela Guzman's real case).
   Images are resolved via Wikimedia Commons Special:FilePath (301-redirect to the actual file).
   Every <img> includes an onerror fallback to our synthetic SVG so broken URLs don't leave blanks. */
const REAL_STUDY_IMAGES = {
  // Mariela Guzman (2126-0420) — real ICL Guru case, uses open-licensed clinical imagery
  "2126-0420": {
    topo:   { url: "/assets/pentacam_mariela_OD.svg", credit: "Oculus Pentacam · Cataract Pre-OP · OD (reproduction from clinical report)" },
    oct:    { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Spectral_Domain_OCT_-_Corneal_Cross-Section_(and_Pachymetry_Map).png", credit: "Wikimedia Commons · CC BY-SA" },
    biom:   { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Schematic_diagram_of_the_human_eye_multilingual.svg", credit: "Wikimedia Commons · CC BY-SA · schematic biometry reference" },
    spec:   { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Corneal_endothelium.jpg", credit: "Wikimedia Commons · CC BY-SA" },
    fundus: { url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Fundus_photograph-normal_retina_EDA06.JPG", credit: "Wikimedia Commons · CC BY 3.0 · Mikael Häggström" },
    vf:     { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Normal_visual_field.jpg", credit: "Wikimedia Commons · CC BY-SA" },
  },
};

// Default Pentacam screenshots used for ALL patients across the dashboard.
// User-provided OCULUS Pentacam Cataract Pre-OP reports — Saracco, Agustina (OD + OS).
// Save the screenshot files to these paths in the workspace folder for the wiring to render.
const DEFAULT_PENTACAM = {
  OD: { url: "/assets/pentacam_saracco_OD.webp", credit: "OCULUS Pentacam · Cataract Pre-OP · OD · Saracco, Agustina · 15/05/2024" },
  OS: { url: "/assets/pentacam_saracco_OS.webp", credit: "OCULUS Pentacam · Cataract Pre-OP · OS · Saracco, Agustina · 15/05/2024" },
};
function resolvePentacamImage(eye){
  var key = (eye === 'OS' ? 'OS' : 'OD');
  return DEFAULT_PENTACAM[key];
}

// === OCT image gallery — rotates across patients to show diverse clinical examples ===
// Add new entries by saving the file in /assets/ and pushing to OCT_GALLERY.
// IMPORTANT: only ANTERIOR-segment OCT images belong here. The Surgery / Pre-op
// modals label these as "Anterior Segment OCT" — a retinal/posterior OCT would
// be clinically wrong for that context. (oct_real_OD.png was a retinal cross-section
// from the Marano case; removed to avoid mismatched study types.)
const OCT_GALLERY = [
  { url: "/assets/oct_real_v2.png",  credit: "AS-OCT · Anterior chamber 2.686 mm · ATA 32.6°/27.9°" },
  { url: "/assets/oct_real_v3.webp",  credit: "AS-OCT · Optovue R · Vault 0.765 mm · 31/Aug/2022" },
];
// === UBM image gallery — same rotation pattern ===
// Add new entries by saving the file in /assets/ and pushing to UBM_GALLERY.
const UBM_GALLERY = [
  { url: "/assets/ubm_real_v1.webp",        credit: "UBM · high-frequency ultrasound · STS / ACD / lens rise" },
];
// === ICL-implanted eye photos — slit-lamp / retroillumination views, used in post-op ===
const ICL_IMPLANTED_GALLERY = [
  { url: "/assets/icl_implanted_v1.webp", credit: "EVO ICL in situ · slit-lamp" },
  { url: "/assets/icl_implanted_v2.webp", credit: "EVO ICL · retroillumination view" },
  { url: "/assets/icl_implanted_v3.webp", credit: "EVO ICL · centration check" },
  { url: "/assets/icl_implanted_v4.webp", credit: "EVO ICL · post-op follow-up" },
];
function _galleryEyePhotoForPatient(ptId, eye){
  if (!ptId) return ICL_IMPLANTED_GALLERY[0];
  var n = 0; for (var i = 0; i < ptId.length; i++) n += ptId.charCodeAt(i);
  if (eye === 'OS') n += 1;
  return ICL_IMPLANTED_GALLERY[n % ICL_IMPLANTED_GALLERY.length];
}
// User-uploaded eye photos per patient + eye + milestone (overrides the gallery rotation when set)
window.PT_EYE_PHOTOS = window.PT_EYE_PHOTOS || {};
function _eyePhotoKey(ptId, eye, ms){ return ptId + ':' + eye + ':' + ms; }
// Deterministically decide whether a (patient · eye · ms) combo should be pre-loaded
// with a gallery photo. Only Post-op patients qualify, and only for visits whose date
// has passed AND the hash rolls in. This keeps demo cases varied (some have photos,
// most start blank with an Upload CTA — same pattern as study uploads in pre-op).
function _shouldHaveDefaultEyePhoto(pt, eye, ms){
  if (!pt || pt.stage !== 'Post-op') return false;
  // Visit must be in the past (i.e., already captured) — can't have a photo of a future exam
  try {
    var v = postopVisitData(pt, eye, ms);
    if (!v || !v.captured) return false;
  } catch (e) { return false; }
  // Deterministic ~40% rate: hash of (id + eye + ms) mod 5 in {0,1}
  var key = pt.id + ':' + eye + ':' + ms;
  var n = 0; for (var i = 0; i < key.length; i++) n += key.charCodeAt(i) * (i + 1);
  return (n % 5) < 2;
}
function resolveEyePhoto(ptId, eye, ms){
  // 1) User-uploaded specific to this milestone
  var k = _eyePhotoKey(ptId, eye, ms);
  if (PT_EYE_PHOTOS[k]) return PT_EYE_PHOTOS[k];
  // 2) Auto-populated demo photo only for some Post-op patients (random per visit)
  var pt = (typeof DATA !== 'undefined' && DATA.patients) ? DATA.patients.find(function(p){ return p.id === ptId; }) : null;
  if (pt && _shouldHaveDefaultEyePhoto(pt, eye, ms)) {
    return _galleryEyePhotoForPatient(ptId, eye);
  }
  // 3) Otherwise — empty (caller should render Upload CTA)
  return null;
}
function uploadEyePhoto(input, ptId, eye, ms){
  var f = (input && input.files && input.files[0]) ? input.files[0] : null;
  if (!f) return;
  var reader = new FileReader();
  reader.onload = function(ev){
    var k = _eyePhotoKey(ptId, eye, ms);
    PT_EYE_PHOTOS[k] = {
      url: ev.target.result,                           // data URL
      credit: f.name + ' · uploaded ' + new Date().toLocaleString('en-GB'),
      uploadedAt: Date.now(),
    };
    if (typeof _refreshPostopMain === 'function') _refreshPostopMain();
    if (typeof showToast === 'function') showToast('Eye photo uploaded · ' + ms + ' · ' + eye);
  };
  reader.readAsDataURL(f);
}
function clearEyePhoto(ptId, eye, ms){
  var k = _eyePhotoKey(ptId, eye, ms);
  delete PT_EYE_PHOTOS[k];
  if (typeof _refreshPostopMain === 'function') _refreshPostopMain();
}
// Lightbox preview for eye photos (lazy-mounted)
function _ensureEyePhotoLightboxMounted(){
  if (document.getElementById('eyePhotoLightbox')) return;
  var lb = document.createElement('div');
  lb.id = 'eyePhotoLightbox';
  lb.className = 'scan-lightbox';
  lb.onclick = function(ev){ if (ev.target === lb) closeEyePhotoLightbox(); };
  lb.innerHTML =
    '<div class="scan-lightbox-inner">' +
      '<div class="scan-lightbox-head">' +
        '<div><div id="eyePhotoLbTitle" style="font-size:14px;font-weight:800;">Eye photo</div>' +
        '<div id="eyePhotoLbSub" style="font-size:11px;color:#63708A;margin-top:2px;"></div></div>' +
        '<button type="button" onclick="closeEyePhotoLightbox()" style="background:transparent;border:1px solid rgba(255,255,255,.2);border-radius:8px;color:#fff;padding:6px 12px;cursor:pointer;font-size:12px;">Close</button>' +
      '</div>' +
      '<div class="scan-lightbox-body" id="eyePhotoLbBody"></div>' +
    '</div>';
  document.body.appendChild(lb);
}
function openEyePhotoLightbox(ptId, eye, ms){
  var photo = resolveEyePhoto(ptId, eye, ms);
  if (!photo) { return; } // No photo to show — caller's empty state shows Upload CTA instead
  _ensureEyePhotoLightboxMounted();
  var p = (DATA.patients||[]).find(function(x){ return x.id === ptId; });
  var lb = document.getElementById('eyePhotoLightbox');
  document.getElementById('eyePhotoLbTitle').textContent = (p ? p.name : '') + ' · ' + eye + ' · ' + ms + ' visit';
  document.getElementById('eyePhotoLbSub').textContent = photo.credit || '';
  document.getElementById('eyePhotoLbBody').innerHTML = '<img src="' + photo.url + '" alt="Eye photo" style="max-width:100%;max-height:80vh;border-radius:6px;display:block;"/>';
  lb.classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeEyePhotoLightbox(){
  var lb = document.getElementById('eyePhotoLightbox');
  if (lb){ lb.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    var lb = document.getElementById('eyePhotoLightbox');
    if (lb && lb.classList.contains('open')) closeEyePhotoLightbox();
  }
});
function _galleryUbmForPatient(ptId, eye){
  if (!ptId) return UBM_GALLERY[0];
  var n = 0; for (var i = 0; i < ptId.length; i++) n += ptId.charCodeAt(i);
  if (eye === 'OS') n += 1;
  return UBM_GALLERY[n % UBM_GALLERY.length];
}
const DEFAULT_OCT = {
  OD: OCT_GALLERY[0],
  OS: OCT_GALLERY[0],
};
// Pick an OCT from the gallery deterministically per patient (alternates across the cohort)
function _galleryOctForPatient(ptId, eye){
  if (!ptId) return OCT_GALLERY[0];
  var n = 0; for (var i = 0; i < ptId.length; i++) n += ptId.charCodeAt(i);
  // Slightly shift by eye so OD ≠ OS for the same patient (visual variety)
  if (eye === 'OS') n += 1;
  return OCT_GALLERY[n % OCT_GALLERY.length];
}
function resolveOctImage(eye, ptId){
  // 1) Real attachment uploaded/imported for this patient + eye → use that
  if (ptId && typeof PT_PREOP_DATA !== 'undefined') {
    var s = PT_PREOP_DATA[ptId];
    if (s && Array.isArray(s.attachments)) {
      for (var i = 0; i < s.attachments.length; i++) {
        var a = s.attachments[i];
        if (a.type === 'OCT' && (a.eye === eye || a.eye === 'BOTH') && a.src) {
          return { url: a.src, credit: 'Attached OCT scan · ' + (a.fileName || a.eye) };
        }
      }
    }
  }
  // 2) Fall back to the gallery, rotating across patients
  return _galleryOctForPatient(ptId, eye);
}

// Auto-parse simulated AS-OCT values into post-op data + flag as autoFilled (drives flash animation)
function _autoFillPostopFromOct(pt, eye, ms){
  if (!pt || !ms) return;
  var k = _postopKey(pt.id, eye, ms);
  // Use the captured-data branch of postopVisitData to get plausible values, then save
  var v = postopVisitData(pt, eye, ms);
  // Force the visit captured + autoFilled flag
  PT_POSTOP_LOGGED = window.PT_POSTOP_LOGGED || {};
  PT_POSTOP_LOGGED[k] = { ts: Date.now() };
  PT_POSTOP_DATA[k] = {
    autoFilled: true,
    autoFilledAt: Date.now(),
    vault: v.vault,
    temporalAngle: v.temporalAngle,
    nasalAngle: v.nasalAngle,
    pupilDiam: v.pupilDiam,
    ucva: v.ucva,
    sphereRes: v.sphereRes,
    cylinderRes: v.cylinderRes,
    axisRes: v.axisRes,
    bcva: v.bcva,
  };
}

// Manual cell edit handler — stores user's value, drops the auto flag, re-renders
function setPostopFieldFromInput(ptId, eye, ms, field, raw){
  var val = raw == null ? '' : String(raw).trim();
  if (val === '' || val === '—') val = null;
  // Numeric fields — try parseFloat
  var numericFields = ['vault','temporalAngle','nasalAngle','pupilDiam','sphereRes','cylinderRes','axisRes'];
  if (numericFields.indexOf(field) !== -1 && val != null) {
    var num = parseFloat(val);
    if (!isNaN(num)) val = num;
  }
  setPostopField(ptId, eye, ms, field, val);
  // Drop the autoFilled flag once the user starts editing
  var k = _postopKey(ptId, eye, ms);
  if (PT_POSTOP_DATA[k]) PT_POSTOP_DATA[k].autoFilled = false;
  // Re-render to refresh dependent values (predictionRange, etc.)
  if (typeof _refreshPostopMain === 'function') _refreshPostopMain();
}

function _studySvgFallback(type, id) {
  const seed = typeof ptSeed === 'function' ? ptSeed(id, 91) : 42;
  // Inline synthetic SVG fallback (identical to previous version)
  switch(type){
    case 'topo':
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="topo-t-${id}" cx="50%" cy="50%"><stop offset="0" stop-color="#ff3838"/><stop offset="0.2" stop-color="#ff7a24"/><stop offset="0.4" stop-color="#ffca33"/><stop offset="0.58" stop-color="#7fe64a"/><stop offset="0.75" stop-color="#3aa2ff"/><stop offset="1" stop-color="#1a2a8a"/></radialGradient></defs>
        <circle cx="40" cy="40" r="38" fill="url(#topo-t-${id})"/>
        <circle cx="40" cy="40" r="38" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.3"/>
        <circle cx="40" cy="40" r="22" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.3"/>
        <line x1="2" y1="40" x2="78" y2="40" stroke="#fff" stroke-width="0.5" opacity="0.25"/>
        <line x1="40" y1="2" x2="40" y2="78" stroke="#fff" stroke-width="0.5" opacity="0.25"/>
      </svg>`;
    case 'oct':
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="#050814"/>
        <path d="M 4 46 Q 40 20 76 46 L 76 50 L 4 50 Z" fill="#7fa6ff" opacity="0.85"/>
        <path d="M 4 54 Q 40 28 76 54" stroke="#ffdd66" stroke-width="1.5" fill="none"/>
        <path d="M 4 62 Q 40 40 76 62" stroke="#ff8a6e" stroke-width="1" fill="none" opacity="0.7"/>
        <g stroke="#6fffd5" stroke-width="0.4" opacity="0.6">
          <line x1="0" y1="30" x2="80" y2="30"/><line x1="0" y1="35" x2="80" y2="35"/>
        </g>
      </svg>`;
    case 'biom':
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="#101630"/>
        <g stroke="#4a9eff" stroke-width="0.5" opacity="0.35">
          <line x1="0" y1="20" x2="80" y2="20"/><line x1="0" y1="40" x2="80" y2="40"/><line x1="0" y1="60" x2="80" y2="60"/>
          <line x1="20" y1="0" x2="20" y2="80"/><line x1="40" y1="0" x2="40" y2="80"/><line x1="60" y1="0" x2="60" y2="80"/>
        </g>
        <ellipse cx="40" cy="40" rx="28" ry="26" fill="none" stroke="#4a9eff" stroke-width="1.5" opacity="0.8"/>
        <circle cx="40" cy="40" r="4" fill="#ffdd66"/>
        <line x1="12" y1="40" x2="68" y2="40" stroke="#ffdd66" stroke-width="0.8" stroke-dasharray="2 1"/>
      </svg>`;
    case 'spec':
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="#161a2e"/>
        <g stroke="#6fffd5" stroke-width="0.6" fill="none" opacity="0.85">
          <polygon points="12,18 24,14 36,18 36,30 24,34 12,30"/>
          <polygon points="40,18 52,14 64,18 64,30 52,34 40,30"/>
          <polygon points="20,38 32,34 44,38 44,50 32,54 20,50"/>
          <polygon points="48,38 60,34 72,38 72,50 60,54 48,50"/>
          <polygon points="12,58 24,54 36,58 36,70 24,74 12,70"/>
          <polygon points="40,58 52,54 64,58 64,70 52,74 40,70"/>
        </g>
      </svg>`;
    case 'fundus':
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="fund-${id}" cx="40%" cy="40%"><stop offset="0" stop-color="#ffb070"/><stop offset="0.4" stop-color="#d44c2a"/><stop offset="1" stop-color="#4a140a"/></radialGradient></defs>
        <circle cx="40" cy="40" r="38" fill="url(#fund-${id})"/>
        <circle cx="28" cy="36" r="4" fill="#ffe090" opacity="0.95"/>
        <g stroke="#6a1e12" stroke-width="1" fill="none" opacity="0.75">
          <path d="M 28 36 Q 40 20 58 24"/>
          <path d="M 28 36 Q 20 50 24 66"/>
          <path d="M 28 36 Q 48 50 62 58"/>
        </g>
      </svg>`;
    case 'vf':
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="#fff" stroke="#ccc" stroke-width="0.5"/>
        <g fill="#1F1A2E">
          ${[0,1,2,3,4,5,6,7,8,9].flatMap((r,i) => [0,1,2,3,4,5,6,7,8,9].map((c,j) => {
            const cx = 8 + c*7, cy = 8 + r*7;
            const d = Math.sqrt((cx-40)**2+(cy-40)**2);
            if (d > 36) return '';
            const dot = ((seed + i*3 + j*7) % 4 === 0) ? 'transparent' : '#1F1A2E';
            return `<circle cx="${cx}" cy="${cy}" r="1.6" fill="${dot}"/>`;
          })).join('')}
        </g>
      </svg>`;
    default:
      return `<svg viewBox="0 0 80 80"><rect width="80" height="80" fill="#eee"/></svg>`;
  }
}

/* Thumbnail wrapper — uses real image when available (e.g. Mariela), falls back to synthetic SVG on error.
   For type='topo' (Pentacam), the user-provided Saracco screenshots are used by default for any patient
   when no per-patient image is registered. Pass an `eye` arg ('OD'|'OS') to pick the right one. */
function studyThumb(type, id, eye) {
  let real = REAL_STUDY_IMAGES[id] && REAL_STUDY_IMAGES[id][type];
  if (!real && type === 'topo') real = resolvePentacamImage(eye);
  if (!real && type === 'oct')  real = resolveOctImage(eye);
  if (real) {
    // Encode fallback SVG into the onerror attribute safely
    const fb = _studySvgFallback(type, id).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return `<img class="study-img" src="${real.url}" alt="${type} study" onerror="this.outerHTML='${fb.replace(/\n/g,'').replace(/\s+/g,' ').replace(/'/g,'&quot;')}'"/>`;
  }
  return _studySvgFallback(type, id);
}
/* Full-size version for modal — same logic, larger */
function studyFullImage(type, id, eye) {
  let real = REAL_STUDY_IMAGES[id] && REAL_STUDY_IMAGES[id][type];
  if (!real && type === 'topo') real = resolvePentacamImage(eye);
  if (!real && type === 'oct')  real = resolveOctImage(eye);
  if (real) {
    const fb = _studySvgFallback(type, id).replace(/"/g, '&quot;').replace(/\n/g,'').replace(/\s+/g,' ');
    return `<img class="study-full-img" src="${real.url}" alt="${type} full view" onerror="this.outerHTML='${fb}'"/>`;
  }
  return _studySvgFallback(type, id);
}

const STUDY_META = {
  topo:   { title: 'Pentacam · Cataract Pre-OP',       desc: 'Axial curvature · total refractive power · pachymetry · SimK / TCRP · BAD D · Scheimpflug slit imaging', date: 'May 15, 2024' },
  oct:    { title: 'Anterior Segment OCT',              desc: 'Anterior chamber depth · angle · iris contour · sulcus measurement', date: 'Apr 12, 2026' },
  biom:   { title: 'IOL Master 700 biometry',           desc: 'Axial length · K1/K2 · ACD · WTW · lens thickness', date: 'Apr 8, 2026' },
  spec:   { title: 'Specular microscopy',                desc: 'Endothelial cell count · hexagonality · pleomorphism', date: 'Apr 8, 2026' },
  fundus: { title: 'Fundus photography',                 desc: 'Retinal exam · optic disc · macula · peripheral retina', date: 'Apr 10, 2026' },
  vf:     { title: 'Visual field · 24-2 Humphrey',       desc: 'Threshold test · MD / PSD · glaucoma screening', date: 'Apr 5, 2026' },
};

function openStudyModal(type, patientId) {
  const meta = STUDY_META[type];
  if (!meta) return;
  let modal = document.getElementById('studyModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'studyModal';
    modal.className = 'study-modal';
    document.body.appendChild(modal);
  }
  const pt = DATA.patients.find(p => p.id === patientId);
  const ptLine = pt ? `${pt.name} · REV-${pt.id} · ${pt.age}y · ${pt.eye}` : '';
  modal.innerHTML = `
    <div class="study-modal-backdrop" onclick="closeStudyModal()"></div>
    <div class="study-modal-panel" role="dialog" aria-modal="true" aria-label="${meta.title}">
      <div class="study-modal-head">
        <div>
          <h3>${meta.title}</h3>
          <div class="sm-sub">${ptLine}</div>
        </div>
        <div class="sm-actions">
          <button class="sm-btn-icon" title="Download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
          <button class="sm-btn-icon" title="Share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>
          <button class="sm-close" onclick="closeStudyModal()" title="Close (Esc)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg></button>
        </div>
      </div>
      <div class="study-modal-body">
        <div class="study-modal-canvas">${studyFullImage(type, patientId)}</div>
        <div class="study-modal-meta">
          <div class="sm-meta-row"><span>Study</span><b>${meta.title}</b></div>
          <div class="sm-meta-row"><span>Captured</span><b>${meta.date}</b></div>
          <div class="sm-meta-row"><span>Device</span><b>${type === 'topo' ? 'Oculus Pentacam HR' : type === 'oct' ? 'Zeiss CIRRUS 6000' : type === 'biom' ? 'Zeiss IOLMaster 700' : type === 'spec' ? 'Konan CellChek D' : type === 'fundus' ? 'Topcon TRC-50DX' : 'Zeiss HFA3'}</b></div>
          <div class="sm-meta-row"><span>Quality</span><b style="color:var(--green)">Good · reliable</b></div>
          <div class="sm-desc">${meta.desc}</div>
          ${REAL_STUDY_IMAGES[patientId] && REAL_STUDY_IMAGES[patientId][type] ? `<div class="sm-credit">Image credit: ${REAL_STUDY_IMAGES[patientId][type].credit}</div>` : ''}
        </div>
      </div>
    </div>
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeStudyModal() {
  const modal = document.getElementById('studyModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const m = document.getElementById('studyModal');
    if (m && m.classList.contains('open')) closeStudyModal();
  }
});
