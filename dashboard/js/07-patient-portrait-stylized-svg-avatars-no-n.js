/* ================================================================
   PATIENT PORTRAIT
   ----------------------------------------------------------------
   Two layers. A stylized SVG avatar is always drawn, and a real
   photograph is layered on top when one exists for that patient.

   To give a patient a photo, drop an image at
       /assets/patients/<patient id>.jpg      e.g. 2126-0418.jpg
   or register it explicitly:
       PATIENT_PHOTOS['2126-0418'] = '/assets/patients/herrera.jpg';

   A missing or broken file simply falls back to the avatar, so the
   registry never shows a hole. Use portrait photography of people who
   consented to it, or synthetic/licensed stock — these records are
   labelled synthetic and must not be tied to a real person's face.
================================================================ */
window.PATIENT_PHOTOS = window.PATIENT_PHOTOS || {};
window.PATIENT_PHOTO_DIR = window.PATIENT_PHOTO_DIR || '/assets/patients/';
window.PATIENT_PHOTO_EXT = window.PATIENT_PHOTO_EXT || 'jpg';

function patientPhotoUrl(pt) {
  if (!pt) return null;
  if (PATIENT_PHOTOS[pt.id]) return PATIENT_PHOTOS[pt.id];
  if (pt.photo) return pt.photo;
  if (!PATIENT_PHOTO_DIR) return null;
  return PATIENT_PHOTO_DIR + encodeURIComponent(pt.id) + '.' + PATIENT_PHOTO_EXT;
}

/* The avatar used everywhere a patient appears. */
function patientAvatar(pt) {
  var svg = portraitSvg(pt && pt.portrait);
  var url = patientPhotoUrl(pt);
  if (!url) return svg;
  var alt = pt && pt.name ? String(pt.name).replace(/"/g, '&quot;') : 'Patient';
  return '<span class="pt-avatar-wrap">'
    + '<span class="pt-avatar-fb">' + svg + '</span>'
    + '<img class="pt-avatar-img" src="' + url + '" alt="' + alt + '" loading="lazy"'
    + ' onload="this.parentNode.classList.add(\'has-photo\')"'
    + ' onerror="this.remove()">'
    + '</span>';
}


function portraitSvg(cfg) {
  cfg = cfg || {};
  const bg    = cfg.bg    || "#EDE4F3";
  const skin  = cfg.skin  || "#E8BE99";
  const hair  = cfg.hair  || "#2A1410";
  const shirt = cfg.shirt || "#4A5A8E";
  const lips  = cfg.lips  || "#A9564F";
  const eyes  = cfg.eyes  || "#2D2B3C";
  const shape = cfg.hairShape || "short";
  const beard = !!cfg.beard;
  const glasses = !!cfg.glasses;
  const uid   = "p" + Math.random().toString(36).slice(2, 8);

  const hairShapes = {
    short:    `<path d="M16 26 Q16 12, 32 12 Q48 12, 48 26 Q48 17, 40 14 Q32 10, 24 14 Q16 17, 16 26 L18 24 L46 24 Z" fill="${hair}"/>`,
    long:     `<path d="M14 24 Q14 10, 32 10 Q50 10, 50 24 L50 54 Q46 50, 44 42 Q42 48, 38 46 L38 22 L26 22 L26 46 Q22 48, 20 42 Q18 50, 14 54 Z" fill="${hair}"/>`,
    bob:      `<path d="M14 26 Q14 12, 32 12 Q50 12, 50 26 L50 38 Q46 34, 40 34 L40 22 L24 22 L24 34 Q18 34, 14 38 Z" fill="${hair}"/>`,
    ponytail: `<path d="M16 25 Q16 10, 32 10 Q48 10, 48 25 Q52 25, 54 32 Q56 42, 48 46 Q48 36, 46 28 Q42 20, 32 20 Q22 20, 20 28 Q18 36, 18 40 Q16 32, 16 25 Z" fill="${hair}"/>`,
    bun:      `<ellipse cx="32" cy="9" rx="6" ry="5" fill="${hair}"/><path d="M16 25 Q16 14, 32 14 Q48 14, 48 25 Q48 16, 40 13 Q32 10, 24 13 Q16 16, 16 25 Z" fill="${hair}"/>`,
  };
  const hairPath = hairShapes[shape] || hairShapes.short;
  const beardPath = beard
    ? `<path d="M22 37 Q22 48, 32 50 Q42 48, 42 37 Q39 42, 32 42 Q25 42, 22 37 Z" fill="${hair}" opacity=".88"/>`
    : "";
  const glassesPath = glasses
    ? `<g stroke="#1F1A2E" stroke-width="1.4" fill="none"><circle cx="25" cy="31" r="4.2"/><circle cx="39" cy="31" r="4.2"/><path d="M29.2 31 L34.8 31"/></g>`
    : "";
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs><clipPath id="${uid}"><circle cx="32" cy="32" r="32"/></clipPath></defs>
    <g clip-path="url(#${uid})">
      <rect width="64" height="64" fill="${bg}"/>
      <path d="M-4 64 C 6 50, 20 46, 32 46 C 44 46, 58 50, 68 64 Z" fill="${shirt}"/>
      <path d="M-4 64 C 6 52, 20 48, 32 48 C 44 48, 58 52, 68 64" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
      <rect x="27" y="40" width="10" height="9" fill="${skin}"/>
      <ellipse cx="32" cy="30" rx="13" ry="15" fill="${skin}"/>
      <ellipse cx="20" cy="32" rx="1.6" ry="2" fill="${skin}" opacity=".55"/>
      <ellipse cx="44" cy="32" rx="1.6" ry="2" fill="${skin}" opacity=".55"/>
      ${hairPath}
      ${beardPath}
      <path d="M22 27.5 L27 27.5" stroke="${hair}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M37 27.5 L42 27.5" stroke="${hair}" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="25" cy="31" rx="1.2" ry="1.6" fill="${eyes}"/>
      <ellipse cx="39" cy="31" rx="1.2" ry="1.6" fill="${eyes}"/>
      <circle cx="24.7" cy="30.7" r=".35" fill="white"/>
      <circle cx="38.7" cy="30.7" r=".35" fill="white"/>
      ${glassesPath}
      <path d="M31 35 Q32 37 33 35" stroke="${skin}" stroke-width=".9" fill="none" opacity=".55"/>
      <path d="M29.2 39 Q32 41 34.8 39" stroke="${lips}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`;
}
