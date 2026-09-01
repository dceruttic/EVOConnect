// === Vault evolution chart — vault µm trajectory across all 12 post-op milestones ===
function renderPostopVaultEvolution(pt){
  var MS = ['IMM','4H','1D','7D','1M','3M','6M','9M','1Y','3Y','5Y','10Y'];
  var W = 880, H = 280, PL = 50, PR = 24, PT_ = 26, PB = 38;
  var maxY = 1100;
  function px(i){ return PL + (i * (W - PL - PR) / (MS.length - 1)); }
  function py(val){ return H - PB - (Math.min(maxY, Math.max(0, val)) / maxY) * (H - PT_ - PB); }
  // Safety zones — same palette as the vault thermometer
  var BAND = { hyper:'#B845D5', high:'#3371C3', ideal:'#03B496', low:'#F6BF2C', hypo:'#D12C4A' };
  // Collect points per milestone (captured only)
  var captured = MS.map(function(m){
    var v = postopVisitData(pt, CURRENT_PT_POSTOP_EYE, m);
    return { ms: m, vault: v.vault, captured: v.captured };
  });
  var capturedOnly = captured.filter(function(p){ return p.captured && typeof p.vault === 'number'; });
  var capturedCount = capturedOnly.length;

  // Background safety bands
  var bandsHtml = [
    '<rect x="' + PL + '" y="' + py(maxY) + '" width="' + (W - PL - PR) + '" height="' + (py(1000) - py(maxY)) + '" fill="' + BAND.hyper + '" opacity="0.10"/>',
    '<rect x="' + PL + '" y="' + py(1000) + '" width="' + (W - PL - PR) + '" height="' + (py(800) - py(1000)) + '" fill="' + BAND.high + '" opacity="0.10"/>',
    '<rect x="' + PL + '" y="' + py(800)  + '" width="' + (W - PL - PR) + '" height="' + (py(300) - py(800))  + '" fill="' + BAND.ideal + '" opacity="0.14"/>',
    '<rect x="' + PL + '" y="' + py(300)  + '" width="' + (W - PL - PR) + '" height="' + (py(200) - py(300))  + '" fill="' + BAND.low + '" opacity="0.10"/>',
    '<rect x="' + PL + '" y="' + py(200)  + '" width="' + (W - PL - PR) + '" height="' + (py(0)   - py(200))  + '" fill="' + BAND.hypo + '" opacity="0.10"/>',
  ].join('');

  // Y-axis grid + labels
  var grid = [0, 200, 300, 500, 800, 1000].map(function(val){
    var y = py(val);
    return '<line x1="' + PL + '" y1="' + y + '" x2="' + (W - PR) + '" y2="' + y + '" stroke="rgba(15,29,64,0.06)" stroke-dasharray="3 4"/>' +
           '<text x="' + (PL - 10) + '" y="' + (y + 4) + '" text-anchor="end" font-family="Inter" font-size="10" font-weight="700" fill="#94A0B8">' + val + '</text>';
  }).join('');

  // X-axis labels — current milestone is highlighted
  var xLabels = MS.map(function(m, i){
    var isActive = m === CURRENT_PT_POSTOP_MS;
    var color = isActive ? '#001E60' : '#5A6478';
    var weight = isActive ? '900' : '700';
    return '<text x="' + px(i) + '" y="' + (H - 14) + '" text-anchor="middle" font-family="Inter" font-size="11" font-weight="' + weight + '" fill="' + color + '">' + m + '</text>' +
           // Tick mark
           '<line x1="' + px(i) + '" y1="' + (H - PB + 2) + '" x2="' + px(i) + '" y2="' + (H - PB - 2) + '" stroke="' + (isActive ? '#001E60' : '#94A0B8') + '" stroke-width="' + (isActive ? '2' : '1') + '"/>';
  }).join('');

  // Captured line + dots
  var lineSvg = '';
  if (capturedCount > 0) {
    var pathPts = capturedOnly.map(function(p){
      var i = MS.indexOf(p.ms);
      return { x: px(i), y: py(p.vault), v: p.vault, ms: p.ms };
    });
    if (pathPts.length >= 2) {
      var pathD = pathPts.map(function(pt, i){ return (i === 0 ? 'M' : 'L') + ' ' + pt.x + ' ' + pt.y; }).join(' ');
      // Soft area below the line for emphasis
      var areaD = pathD + ' L ' + pathPts[pathPts.length - 1].x + ' ' + (H - PB) + ' L ' + pathPts[0].x + ' ' + (H - PB) + ' Z';
      lineSvg += '<path d="' + areaD + '" fill="rgba(0,128,199,0.10)"/>';
      lineSvg += '<path d="' + pathD + '" stroke="#0080C7" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    // Dots + value labels
    pathPts.forEach(function(p){
      var isActive = p.ms === CURRENT_PT_POSTOP_MS;
      lineSvg += '<g>' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (isActive ? 8 : 6) + '" fill="#fff" stroke="#0080C7" stroke-width="' + (isActive ? 3.5 : 2.6) + '"/>' +
        (isActive ? '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="#0080C7"/>' : '') +
        '<text x="' + p.x + '" y="' + (p.y - (isActive ? 14 : 11)) + '" text-anchor="middle" font-family="Inter" font-size="' + (isActive ? '11' : '10') + '" font-weight="800" fill="#001E60">' + p.v + '</text>' +
      '</g>';
    });
  }

  // Empty-state overlay if no captured visits at all
  var emptyOverlay = '';
  if (capturedCount === 0) {
    emptyOverlay = '<text x="' + (W/2) + '" y="' + (H/2) + '" text-anchor="middle" font-family="Inter" font-size="13" font-weight="700" fill="#94A0B8">No vault data captured yet · log a visit to see the trend</text>';
  }

  // Legend bands (compact)
  var legendBands = [
    { c: BAND.hypo,  l: 'Hypo'  },
    { c: BAND.low,   l: 'Low'   },
    { c: BAND.ideal, l: 'Ideal' },
    { c: BAND.high,  l: 'High'  },
    { c: BAND.hyper, l: 'Hyper' },
  ].map(function(b){ return '<span class="po-vev-legend-item"><span class="po-vev-dot" style="background:' + b.c + '"></span>' + b.l + '</span>'; }).join('');

  return [
    '<div class="po-vault-evo-card">',
      '<div class="po-vault-evo-head">',
        '<div>',
          '<div class="po-eyephoto-eyebrow">Vault evolution · ' + CURRENT_PT_POSTOP_EYE + '</div>',
          '<h4>Vault trajectory across post-op milestones</h4>',
        '</div>',
        '<div class="po-vev-legend">' + legendBands + '</div>',
      '</div>',
      '<svg class="po-vault-evo-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">',
        bandsHtml,
        grid,
        '<text x="' + (PL - 30) + '" y="' + (PT_ + 8) + '" font-family="Inter" font-size="9" font-weight="800" fill="#94A0B8">µm</text>',
        lineSvg,
        xLabels,
        emptyOverlay,
      '</svg>',
      '<div class="po-vault-evo-foot">',
        '<span><b>' + capturedCount + '</b> of ' + MS.length + ' visits captured</span>',
        capturedCount > 0 ? '<span>Latest vault: <b style="color:#0080C7">' + capturedOnly[capturedOnly.length - 1].vault + ' µm</b> at ' + capturedOnly[capturedOnly.length - 1].ms + '</span>' : '',
      '</div>',
    '</div>'
  ].join('');
}

// Eye-photo card — slit-lamp / retroillumination shots of the implanted ICL.
// Defaults to a gallery rotation per patient; user can replace via Upload button.
function renderPostopEyePhotoSection(pt){
  var eye = CURRENT_PT_POSTOP_EYE, ms = CURRENT_PT_POSTOP_MS;
  var photo = resolveEyePhoto(pt.id, eye, ms);
  var hasUpload = !!PT_EYE_PHOTOS[_eyePhotoKey(pt.id, eye, ms)];
  var inputId = 'eyePhotoInput_' + pt.id + '_' + eye + '_' + ms;
  var hasPhoto = !!photo;

  // Header actions — the upload button always there; clear only when there's an upload
  var headActions =
    '<input type="file" id="' + inputId + '" accept="image/*" style="display:none" onchange="uploadEyePhoto(this,\'' + pt.id + '\',\'' + eye + '\',\'' + ms + '\')"/>' +
    '<button type="button" class="po-eyephoto-upload" onclick="document.getElementById(\'' + inputId + '\').click()">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
      ' ' + (hasUpload ? 'Replace photo' : (hasPhoto ? 'Replace photo' : 'Upload photo')) +
    '</button>' +
    (hasUpload
      ? '<button type="button" class="po-eyephoto-clear" onclick="clearEyePhoto(\'' + pt.id + '\',\'' + eye + '\',\'' + ms + '\')" title="Remove uploaded photo">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>'
      : '');

  // Body — either the photo, or a clean empty drop-target
  var bodyHtml;
  if (hasPhoto) {
    bodyHtml =
      '<div class="po-eyephoto-body has-photo" onclick="openEyePhotoLightbox(\'' + pt.id + '\',\'' + eye + '\',\'' + ms + '\')" title="Click to enlarge">' +
        '<img src="' + photo.url + '" alt="EVO ICL in situ" class="po-eyephoto-img" onerror="this.style.display=\'none\';this.parentNode.classList.add(\'no-photo\')"/>' +
      '</div>';
  } else {
    // Empty state — same look-and-feel as the study upload tiles in pre-op
    bodyHtml =
      '<div class="po-eyephoto-body empty" onclick="document.getElementById(\'' + inputId + '\').click()">' +
        '<div class="po-eyephoto-empty-inner">' +
          '<div class="po-eyephoto-empty-ico">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
          '</div>' +
          '<div class="po-eyephoto-empty-title">No photo for this visit</div>' +
          '<div class="po-eyephoto-empty-sub">Click to upload a slit-lamp or retroillumination image of the implanted ICL</div>' +
        '</div>' +
      '</div>';
  }

  // Footer — only show when there's actually a photo (otherwise it's noise)
  var footHtml = hasPhoto
    ? '<div class="po-eyephoto-foot">' +
        '<span class="po-eyephoto-credit">' + (photo.credit || '') + '</span>' +
        (hasUpload ? '<span class="po-eyephoto-tag uploaded">Uploaded</span>' : '<span class="po-eyephoto-tag default">Reference image</span>') +
      '</div>'
    : '';

  return [
    '<div class="po-eyephoto-card' + (hasPhoto ? '' : ' is-empty') + '">',
      '<div class="po-eyephoto-head">',
        '<div>',
          '<div class="po-eyephoto-eyebrow">Eye photo · post-implantation</div>',
          '<h4>EVO ICL in situ · ' + eye + ' · ' + ms + '</h4>',
        '</div>',
        '<div class="po-eyephoto-actions">' + headActions + '</div>',
      '</div>',
      bodyHtml,
      footHtml,
    '</div>'
  ].join('');
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && CURRENT_PT) closePatientFile();
});
