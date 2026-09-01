/* ============== GEOGRAPHIC INTELLIGENCE ============== */
// Recognizable Argentina silhouette: northern plateau, northeast bulge (Misiones),
// wide Pampa belt around Buenos Aires, narrow Patagonian tail.
// viewBox is 400 x 600.
const RCP_AR_OUTLINE = `
    M 195 40
    L 220 45 L 235 60 L 245 75 L 250 85
    L 270 95 L 290 110 L 300 130 L 290 145
    L 275 155 L 265 170
    L 270 195 L 280 220 L 285 250 L 290 280
    L 285 310 L 280 340 L 270 370
    L 255 395 L 240 415 L 225 435 L 215 455
    L 210 475 L 205 495 L 200 510
    L 190 525 L 178 540 L 168 555
    L 158 570 L 150 580
    L 140 575 L 138 560 L 142 545
    L 148 525 L 150 505 L 145 485
    L 138 465 L 132 445 L 128 425
    L 130 405 L 135 385 L 138 365
    L 132 340 L 125 315 L 120 290
    L 115 265 L 110 240 L 108 215
    L 112 190 L 120 165 L 130 140
    L 142 115 L 155 90 L 170 65
    L 185 50 Z`;
// Subtle provincial guide lines (decorative)
const RCP_AR_GUIDES = `M 180 130 L 240 130 M 175 200 L 280 200 M 165 290 L 285 290 M 145 380 L 265 380`;

// City coordinates calibrated to the 400 x 600 viewBox above.
const RCP_CITY_COORDS = {
  'CABA':                    {x:235, y:290},
  'GBA Norte':               {x:230, y:285},
  'La Plata':                {x:240, y:305},
  'Mar del Plata':           {x:250, y:340},
  'Mendoza':                 {x:145, y:280},
  'San Rafael':              {x:150, y:310},
  'Córdoba':                 {x:195, y:245},
  'Rosario':                 {x:220, y:270},
  'San Miguel de Tucumán':   {x:185, y:155},
  'Salta':                   {x:180, y:110},
  'San Salvador de Jujuy':   {x:175, y:85},
  'Bariloche':               {x:155, y:440},
  'Neuquén':                 {x:160, y:390},
  'Corrientes':              {x:245, y:175},
  'Posadas':                 {x:280, y:145},
  'Misiones':                {x:280, y:145},
  'Comodoro Rivadavia':      {x:165, y:510}
};

function dchAnsGeo(){
  // Use the capped dissatisfied cohort so the dot counts match the headline ≤4 figure.
  const disIds = new Set(dchDissatisfiedList().map(p=>p.id));
  // Aggregate per city
  const byCity = {};
  CLINIC_SURGERY_DATA.forEach(p => {
    const c = p.city || 'Other';
    byCity[c] = byCity[c] || {city:c, region:p.region||'—', total:0, dis:0, coords:RCP_CITY_COORDS[c]||p.geo||{x:200,y:260}};
    byCity[c].total++;
    if (disIds.has(p.id)) byCity[c].dis++;
  });
  // Aggregate per region (for KPIs / table)
  const byRegion = {};
  CLINIC_SURGERY_DATA.forEach(p => {
    const r = p.region || 'Other';
    byRegion[r] = byRegion[r] || {region:r, total:0, dis:0};
    byRegion[r].total++;
    if (disIds.has(p.id)) byRegion[r].dis++;
  });
  const regionsArr = Object.values(byRegion).map(r => ({
    ...r,
    rate: r.total>0 ? (r.dis/r.total*100) : 0,
    satRate: r.total>0 ? ((r.total-r.dis)/r.total*100) : 0,
  })).sort((a,b)=>b.dis-a.dis);
  const top5 = regionsArr.slice(0,5);

  // Top concern region: highest dissatisfaction rate among regions with ≥3 patients
  const concernArr = regionsArr.filter(r=>r.total>=3).sort((a,b)=>b.rate-a.rate);
  const topConcern = concernArr[0] || regionsArr[0];

  // Color helper based on dissat rate
  const dotColor = (rate) => {
    if (rate < 10) return '#03A180';      // green
    if (rate < 20) return '#F6BF2C';      // amber
    return '#D12C4A';                     // red
  };
  // Size helper based on total count (radius 5–22)
  const allCounts = Object.values(byCity).map(c=>c.total);
  const maxCount = Math.max(...allCounts, 1);
  const dotRadius = (n) => 5 + (n / maxCount) * 17;

  // Build SVG with country outline + dot overlay
  const dots = Object.values(byCity).map((c,i) => {
    const r = dotRadius(c.total);
    const fill = dotColor(c.total>0 ? (c.dis/c.total*100) : 0);
    const tip = `${c.city} · ${Math.round(c.total*CLINIC_DISPLAY_MULTIPLIER).toLocaleString('en-US')} patients · ${Math.round(c.dis*CLINIC_DISPLAY_MULTIPLIER).toLocaleString('en-US')} dissatisfied (${c.total?(c.dis/c.total*100).toFixed(0):0}%)`;
    return `
      <circle class="rcp-geo-dot" cx="${c.coords.x}" cy="${c.coords.y}" r="${r}" fill="${fill}" opacity=".82" stroke="#fff" stroke-width="2"
              data-tip="${dchEsc(tip)}"/>
      <text x="${c.coords.x}" y="${c.coords.y+4}" font-size="${r>=11?'10':'8'}" font-weight="800" text-anchor="middle" fill="#fff" pointer-events="none">${c.dis||c.total}</text>`;
  }).join('');

  const mapSvg = `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg" class="dch-argmap">
      <defs>
        <linearGradient id="rcpArFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#F0EAFB"/>
          <stop offset="1" stop-color="#E1D5F5"/>
        </linearGradient>
      </defs>
      <path d="${RCP_AR_OUTLINE}" fill="url(#rcpArFill)" stroke="#5C18AB" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="${RCP_AR_GUIDES}" stroke="#5C18AB" stroke-width="0.4" stroke-dasharray="2 3" opacity="0.35" fill="none"/>
      <text x="200" y="22" text-anchor="middle" font-size="11" font-weight="800" fill="#5C18AB" letter-spacing="1.5">ARGENTINA</text>
      ${dots}
    </svg>
    <div class="rcp-geo-legend">
      <span class="sw"><span style="background:#03A180"></span>&lt; 10% dissat</span>
      <span class="sw"><span style="background:#F6BF2C"></span>10–20%</span>
      <span class="sw"><span style="background:#D12C4A"></span>&gt; 20%</span>
      <span class="sw" style="margin-left:8px;color:#7d6fa3">size = volume</span>
    </div>`;

  // Table of top 5 regions
  const rowsHtml = top5.map(r => `
    <tr>
      <td><b>${dchEsc(r.region)}</b></td>
      <td>${dchScaled(r.total)}</td>
      <td><b style="color:${r.dis>=3?'#D12C4A':'#5C18AB'}">${dchScaled(r.dis)}</b></td>
      <td>${r.rate.toFixed(0)}%</td>
      <td><b style="color:${r.satRate>=85?'#03A180':r.satRate>=70?'#cf8a13':'#D12C4A'}">${r.satRate.toFixed(0)}%</b></td>
    </tr>`).join('');

  const totalDis = regionsArr.reduce((s,r)=>s+r.dis,0);
  const regionsCount = regionsArr.length;
  const citiesCount = Object.keys(byCity).length;

  return `
    <h4>🗺️ Geographic distribution of dissatisfied patients <span class="ptag">Argentina · ${citiesCount} cities</span></h4>
    <p>Your archive covers <b>${citiesCount} cities</b> across <b>${regionsCount} provinces</b>. Dots are colored by % of dissatisfied patients and sized by volume. Hover a point for details.</p>
    <div class="dch-kpis">
      <div class="dch-kpi"><div class="l">Active provinces</div><div class="v">${regionsCount}</div><div class="d">${citiesCount} cities</div></div>
      <div class="dch-kpi accent-red"><div class="l">Total dissatisfied</div><div class="v">${dchScaled(totalDis)}</div><div class="d">${(totalDis/CLINIC_SURGERY_DATA.length*100).toFixed(0)}% of cohort</div></div>
      <div class="dch-kpi accent-gold"><div class="l">Concerning region</div><div class="v" style="font-size:14px;line-height:1.25;padding-top:4px">${topConcern?dchEsc(topConcern.region):'—'}</div><div class="d">${topConcern?topConcern.rate.toFixed(0)+'% dissat rate':''}</div></div>
      <div class="dch-kpi accent-blue"><div class="l">Highest volume</div><div class="v" style="font-size:14px;line-height:1.25;padding-top:4px">${dchEsc(regionsArr[0].region)}</div><div class="d">${dchScaled(regionsArr[0].total)} patients</div></div>
    </div>
    <div class="rcp-geo-wrap">
      <div class="rcp-geo-map">
        ${mapSvg}
        <div class="rcp-geo-tip" id="rcpGeoTip"></div>
      </div>
      <div>
        <p style="margin:0 0 6px;font-weight:700;color:#1c1530">Top 5 regions by absolute dissatisfaction</p>
        <table class="dch-tbl">
          <thead><tr><th>Region</th><th>Total</th><th>Dissat</th><th>%</th><th>Sat rate</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="rcp-insight" style="margin-top:12px">
          <b>Pattern:</b> dissatisfied patients concentrate in high-surgery-density regions (Buenos Aires, Mendoza, Córdoba).
          ${topConcern && topConcern.rate>20 ? `But <b>${dchEsc(topConcern.region)}</b> has the highest proportional rate (${topConcern.rate.toFixed(0)}%) — worth reviewing the local protocol.` : 'The distribution is proportional to volume — no concerning clinical hot-spots.'}
        </div>
      </div>
    </div>
    <div class="dch-cta">
      <button onclick="dashCopilotAsk('What common characteristics do my dissatisfied patients share?')">🧬 Common characteristics →</button>
      <button onclick="dashCopilotAsk('Who are my dissatisfied patients?')">😟 View patient list →</button>
    </div>
    ${dchCite()}`;
}

/* Wire hover tooltips for geo dots inside the rendered bubble */
function rcpWireGeoTooltips(scope){
  if (!scope) return;
  const dots = scope.querySelectorAll('.rcp-geo-dot');
  const tip = scope.querySelector('#rcpGeoTip');
  const map = scope.querySelector('.rcp-geo-map');
  if (!dots.length || !tip || !map) return;
  dots.forEach(d => {
    d.addEventListener('mouseenter', e => {
      tip.textContent = d.getAttribute('data-tip') || '';
      const mapRect = map.getBoundingClientRect();
      const dotRect = d.getBoundingClientRect();
      tip.style.left = (dotRect.left - mapRect.left + dotRect.width/2) + 'px';
      tip.style.top  = (dotRect.top  - mapRect.top) + 'px';
      tip.classList.add('show');
    });
    d.addEventListener('mouseleave', () => tip.classList.remove('show'));
  });
}
