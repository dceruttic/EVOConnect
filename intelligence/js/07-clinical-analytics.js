/* ========= CLINICAL ANALYTICS ========= */
const CL_CLINICS = [
  'All clinics',
  'Instituto Zaldivar — Mendoza, AR',
  'Parkhurst NuVision — San Antonio, US',
  'Wellington Eye Clinic — Dublin, IE',
  'Centre Ophtalmologique Boucard — Paris, FR',
  'BGI Vision Center — Seoul, KR',
  'Vissum / Miranza — Alicante, ES',
  'Shinagawa Keio — Tokyo, JP',
  'Aier Eye Hospital — Shanghai, CN',
  'Clínica Baviera — Madrid, ES'
];
const CL_SURGEONS = [
  'All surgeons',
  'Dr. Roberto Zaldivar',
  'Dr. Gregory Parkhurst',
  'Dr. Arthur Cummings',
  'Dr. Bertrand Boucard',
  'Dr. Hyojin Park',
  'Dr. Jorge Alió',
  'Dr. Kenji Okada',
  'Dr. Wang Wei',
  'Dr. María Trancón',
  'Dra. Soosan Jacob',
  'Dr. Allan Slomovic',
  'Dr. Neda Shamie'
];
const CL_COUNTRIES = ['All countries','AR','US','IE','FR','KR','ES','JP','CN','BR','MX','DE','IT','AE'];

const CL_VAULT_BUCKETS = [
  { lab:'<100 µm',     pc:58.2, c:'#10d48c' },
  { lab:'100–200 µm',  pc:31.4, c:'#fbbf24' },
  { lab:'200–300 µm',  pc:7.6,  c:'#4a9eff' },
  { lab:'300–400 µm',  pc:2.3,  c:'#f472b6' },
  { lab:'400–500 µm',  pc:0.5,  c:'#ff5a7a' }
];

const CL_TIMEPOINTS = ['1D','1M','3M','6M','12M','Y3'];
const CL_VAULT_EVO = {
  mae: [106, 88, 73, 68, 65, 62],
  std: [ 81, 64, 51, 49, 48, 45]
};
const CL_TORIC_EVO = {
  high: [87.5, 90.6, 93.5, 94.8, 96.2, 96.4],
  mid:  [12.5,  9.4,  6.5,  5.2,  3.8,  3.6]
};

/* Lens sizes */
const CL_SIZES = [
  { sz:'12.1 mm', sub:'Short · WTW 10.5–11.0', c:'#22d3ee' },
  { sz:'12.6 mm', sub:'Mid · WTW 11.0–11.5',   c:'#4a9eff' },
  { sz:'13.2 mm', sub:'Long · WTW 11.5–12.0',  c:'#7f21e0' },
  { sz:'13.7 mm', sub:'X-long · WTW >12.0',    c:'#fb8e3a' }
];

/* PROMs questions */
const CL_PROMS_Q = [
  { code:'A1', short:'Satisfaction',          full:'Overall, how satisfied are you with the visual outcome of your surgery?' },
  { code:'A2', short:'Near freedom',          full:'How free are you from the need for glasses/contacts at near distance?' },
  { code:'A3', short:'Mid freedom',           full:'How free are you from the need for glasses/contacts at intermediate distance?' },
  { code:'A4', short:'Distance freedom',      full:'How free are you from the need for glasses/contacts at far distance?' },
  { code:'A5', short:'No medical glasses',    full:'How often do you no longer need any prescription eyewear in daily life?' },
  { code:'A6', short:'Match expectations',    full:'How well did the result match the expectations you had before surgery?' },
  { code:'A7', short:'Night clarity',         full:'How clear is your vision at night without halos, glare or starbursts?' },
  { code:'A8', short:'Daytime driving',       full:'How comfortable do you feel driving during the daytime since surgery?' },
  { code:'A9', short:'Nighttime driving',     full:'How comfortable do you feel driving at night since surgery?' }
];

/* Aggregate radar values: M12 score per question, per size (1–10 scale).
   4 sizes × 9 questions. Higher means better.
   Network-wide average — notice the A2 (Near freedom) dip is realistic: ICL preserves
   accommodation but presbyopic patients still report some near limitation.
   Other clinics fall slightly below the Instituto Zaldivar reference benchmark. */
const CL_RADAR = {
  '12.1': [8.9, 6.0, 8.5, 8.9, 8.8, 8.5, 7.8, 8.6, 6.8],
  '12.6': [9.1, 6.2, 8.7, 9.1, 9.0, 8.7, 8.1, 8.8, 7.0],
  '13.2': [9.2, 6.3, 8.8, 9.2, 9.1, 8.8, 8.2, 8.9, 7.2],
  '13.7': [8.9, 6.1, 8.6, 9.0, 8.8, 8.5, 7.8, 8.6, 6.7]
};

/* Instituto Zaldivar reference distribution — calibrated to their published
   "Satisfaction per question — Overall" report (N≈609, M12 cohort). Pattern is
   consistent across lens sizes (slight variation for realism). The largest gap
   is on A2 / Near freedom — the well-known limitation when the patient retains
   accommodation but is becoming presbyopic. */
const CL_RADAR_ZALDIVAR = {
  '12.1': [9.7, 6.8, 9.3, 9.6, 9.6, 9.4, 8.8, 9.3, 7.8],
  '12.6': [9.8, 7.0, 9.5, 9.7, 9.7, 9.5, 9.0, 9.4, 8.0],
  '13.2': [9.8, 7.1, 9.6, 9.8, 9.7, 9.5, 9.1, 9.5, 8.2],
  '13.7': [9.7, 6.9, 9.4, 9.6, 9.5, 9.3, 8.7, 9.2, 7.7]
};

/* Per-question evolution: M1 → M3 → M6 → M12 for each size */
const CL_PROMS_EVO = {
  A1: { '12.1':[7.4,8.2,8.7,9.1], '12.6':[7.6,8.4,9.0,9.4], '13.2':[7.7,8.5,9.1,9.5], '13.7':[7.5,8.3,8.8,9.2] },
  A2: { '12.1':[6.8,7.7,8.3,8.6], '12.6':[7.0,7.9,8.5,8.9], '13.2':[7.1,8.0,8.6,9.0], '13.7':[6.9,7.8,8.4,8.7] },
  A3: { '12.1':[7.1,7.9,8.5,8.9], '12.6':[7.3,8.2,8.8,9.2], '13.2':[7.4,8.3,8.9,9.3], '13.7':[7.2,8.0,8.6,9.0] },
  A4: { '12.1':[7.7,8.5,9.1,9.4], '12.6':[7.9,8.7,9.3,9.5], '13.2':[8.0,8.8,9.4,9.6], '13.7':[7.7,8.5,9.1,9.4] },
  A5: { '12.1':[7.2,8.1,8.7,9.0], '12.6':[7.5,8.4,9.0,9.3], '13.2':[7.6,8.5,9.1,9.4], '13.7':[7.3,8.2,8.8,9.1] },
  A6: { '12.1':[7.0,7.9,8.5,8.9], '12.6':[7.3,8.2,8.8,9.1], '13.2':[7.4,8.3,8.9,9.2], '13.7':[7.0,7.9,8.4,8.8] },
  A7: { '12.1':[6.6,7.5,8.2,8.7], '12.6':[6.9,7.8,8.5,9.0], '13.2':[7.0,7.9,8.6,9.1], '13.7':[6.4,7.3,8.0,8.6] },
  A8: { '12.1':[7.4,8.2,8.8,9.2], '12.6':[7.6,8.4,9.0,9.4], '13.2':[7.7,8.5,9.1,9.5], '13.7':[7.3,8.1,8.7,9.1] },
  A9: { '12.1':[6.4,7.3,8.0,8.5], '12.6':[6.7,7.6,8.3,8.9], '13.2':[6.8,7.7,8.4,9.1], '13.7':[6.2,7.1,7.8,8.6] }
};

/* ---- Clinical filter state and per-entity cohort sizes ---- */
window.CL_FILTERS = window.CL_FILTERS || { clinic: 'All clinics', surgeon: 'All surgeons', country: 'All countries' };

const CL_CLINIC_CASES = {
  'All clinics': 12847,
  'Instituto Zaldivar — Mendoza, AR': 1847,
  'Parkhurst NuVision — San Antonio, US': 1420,
  'Wellington Eye Clinic — Dublin, IE': 980,
  'Centre Ophtalmologique Boucard — Paris, FR': 740,
  'BGI Vision Center — Seoul, KR': 1180,
  'Vissum / Miranza — Alicante, ES': 920,
  'Shinagawa Keio — Tokyo, JP': 1640,
  'Aier Eye Hospital — Shanghai, CN': 1890,
  'Clínica Baviera — Madrid, ES': 1230
};
const CL_SURGEON_CASES = {
  'All surgeons': 12847,
  'Dr. Roberto Zaldivar': 1210,
  'Dr. Gregory Parkhurst': 1090,
  'Dr. Arthur Cummings': 720,
  'Dr. Bertrand Boucard': 540,
  'Dr. Hyojin Park': 880,
  'Dr. Jorge Alió': 690,
  'Dr. Kenji Okada': 760,
  'Dr. Wang Wei': 1140,
  'Dr. María Trancón': 580,
  'Dra. Soosan Jacob': 460,
  'Dr. Allan Slomovic': 410,
  'Dr. Neda Shamie': 520
};
const CL_COUNTRY_CASES = {
  'All countries': 12847,
  'AR': 2150, 'US': 1620, 'IE': 1080, 'FR': 1280, 'KR': 1180,
  'ES': 2150, 'JP': 1640, 'CN': 1890, 'BR': 560, 'MX': 480,
  'DE': 620, 'IT': 540, 'AE': 320
};

/* Compute the active context based on current filters */
function clComputeContext(){
  const F = window.CL_FILTERS || { clinic:'All clinics', surgeon:'All surgeons', country:'All countries' };
  // priority: surgeon > clinic > country > aggregate
  let totalCases;
  if(F.surgeon && F.surgeon !== 'All surgeons')      totalCases = CL_SURGEON_CASES[F.surgeon] || 12847;
  else if(F.clinic && F.clinic !== 'All clinics')    totalCases = CL_CLINIC_CASES[F.clinic]   || 12847;
  else if(F.country && F.country !== 'All countries') totalCases = CL_COUNTRY_CASES[F.country] || 12847;
  else totalCases = 12847;
  const toricCases = Math.round(totalCases * 0.225);

  const isBoosted = /Zaldivar/.test(F.clinic||'') || /Zaldivar/.test(F.surgeon||'') || F.country === 'AR';

  // Scope label
  const parts = [];
  if(F.clinic && F.clinic !== 'All clinics')   parts.push('Filter: ' + F.clinic.split(' — ')[0]);
  if(F.surgeon && F.surgeon !== 'All surgeons') parts.push('Filter: ' + F.surgeon);
  if(F.country && F.country !== 'All countries') parts.push('Filter: ' + F.country);
  const scopeLabel = parts.length ? parts.join(' · ') : 'Aggregate · all clinics';

  if(isBoosted){
    // Use the Zaldivar reference radar dataset directly (calibrated to their published M12 report).
    const radar = CL_RADAR_ZALDIVAR;
    // Per-question evolution: boost the M1→M12 trajectory so the M12 endpoint
    // converges on the Zaldivar M12 score for each (question, lens size) pair.
    const promsEvo = {};
    Object.keys(CL_PROMS_EVO).forEach(q=>{
      promsEvo[q] = {};
      const qIdx = parseInt(q.slice(1), 10) - 1; // 'A1' -> 0, 'A9' -> 8
      Object.keys(CL_PROMS_EVO[q]).forEach(sz=>{
        const target = (CL_RADAR_ZALDIVAR[sz] || [])[qIdx];
        if (typeof target === 'number') {
          // Build a smooth ramp toward the Zaldivar M12 endpoint, preserving the
          // shape of the original (M1 starts ~80% of M12, climbs through M3/M6).
          const m12 = target;
          const m1  = Math.max(5.0, +(m12 * 0.78).toFixed(1));
          const m3  = +(m1 + (m12 - m1) * 0.55).toFixed(1);
          const m6  = +(m1 + (m12 - m1) * 0.82).toFixed(1);
          promsEvo[q][sz] = [m1, m3, m6, m12];
        } else {
          promsEvo[q][sz] = CL_PROMS_EVO[q][sz].map(v=> Math.min(9.9, v+0.4));
        }
      });
    });
    return {
      totalCases, toricCases,
      mae: 73.18, std: 58.05, withinPct: 95.1,
      buckets: [
        {lab:'<100 µm',     pc:71.5, c:'#10d48c'},
        {lab:'100–200 µm',  pc:23.6, c:'#fbbf24'},
        {lab:'200–300 µm',  pc:3.4,  c:'#4a9eff'},
        {lab:'300–400 µm',  pc:1.2,  c:'#f472b6'},
        {lab:'400–500 µm',  pc:0.3,  c:'#ff5a7a'}
      ],
      toricHigh: 98.6, toricMid: 1.4,
      vaultEvo: { mae:[82,70,58,54,51,48], std:[62,50,39,37,36,33] },
      toricEvo: { high:[92.5,95.6,97.4,98.0,98.5,98.7], mid:[7.5,4.4,2.6,2.0,1.5,1.3] },
      radar, promsEvo,
      isBoosted, scopeLabel,
      activeQ: (window.CL_CTX && window.CL_CTX.activeQ) || 'A1'
    };
  }
  return {
    totalCases, toricCases,
    mae: 96.42, std: 78.20, withinPct: 89.6,
    buckets: CL_VAULT_BUCKETS,
    toricHigh: 94.2, toricMid: 5.8,
    vaultEvo: CL_VAULT_EVO,
    toricEvo: CL_TORIC_EVO,
    radar: CL_RADAR,
    promsEvo: CL_PROMS_EVO,
    isBoosted, scopeLabel,
    activeQ: (window.CL_CTX && window.CL_CTX.activeQ) || 'A1'
  };
}

/* Re-render the clinical view when a filter changes */
window.clSetFilter = function(field, value){
  window.CL_FILTERS[field] = value;
  // reset active question on filter change to keep things simple
  if(window.CL_CTX) window.CL_CTX.activeQ = 'A1';
  window.CL_CTX = clComputeContext();
  const main = document.getElementById('main');
  if(main) main.innerHTML = VIEWS.clinical();
};

/* Build donut SVG: list of {pc, c}. Total radius/stroke. */
function clDonutSvg(segs, total, sizePx, label1, label2){
  const r = 70, cx = sizePx/2, cy = sizePx/2, sw = 22;
  const C = 2*Math.PI*r;
  let acc = 0;
  const arcs = segs.map(s=>{
    const len = (s.pc/100)*C;
    const off = -acc;
    acc += len;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.c}" stroke-width="${sw}" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"/>`;
  }).join('');
  return `<svg width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${sw}"/>
    ${arcs}
    <text x="${cx}" y="${cy-4}" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="800" fill="#ecefff">${label1}</text>
    <text x="${cx}" y="${cy+16}" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="rgba(236,239,255,0.55)" letter-spacing="1">${label2}</text>
  </svg>`;
}

/* Build line chart for vault MAE / Std evolution */
function clVaultEvoChart(){
  const evo = ((window.CL_CTX || clComputeContext()).vaultEvo) || CL_VAULT_EVO;
  const W=420, H=210, padL=40, padR=14, padT=18, padB=28;
  const innerW=W-padL-padR, innerH=H-padT-padB;
  const ymax=120, ymin=0;
  const xs = CL_TIMEPOINTS.map((_,i)=> padL + (i/(CL_TIMEPOINTS.length-1))*innerW );
  const yScale = v => padT + (1-(v-ymin)/(ymax-ymin))*innerH;
  const ptsMae = evo.mae.map((v,i)=>`${xs[i]},${yScale(v)}`).join(' ');
  const ptsStd = evo.std.map((v,i)=>`${xs[i]},${yScale(v)}`).join(' ');
  const areaMae = `${padL},${padT+innerH} ${ptsMae} ${xs[xs.length-1]},${padT+innerH}`;
  const grid = [0,30,60,90,120].map(v=>{
    const y = yScale(v);
    return `<line x1="${padL}" x2="${W-padR}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,0.05)"/>
            <text x="${padL-6}" y="${y+3}" text-anchor="end" font-family="Inter" font-size="9" fill="rgba(236,239,255,0.4)">${v}</text>`;
  }).join('');
  const xticks = CL_TIMEPOINTS.map((t,i)=>`<text x="${xs[i]}" y="${H-10}" text-anchor="middle" font-family="Inter" font-size="10" fill="rgba(236,239,255,0.55)" font-weight="600">${t}</text>`).join('');
  const dotsMae = evo.mae.map((v,i)=>`<circle cx="${xs[i]}" cy="${yScale(v)}" r="3.5" fill="#4a9eff" stroke="#0a0d2b" stroke-width="1.5"/><text x="${xs[i]}" y="${yScale(v)-9}" text-anchor="middle" font-family="JetBrains Mono" font-size="9" font-weight="700" fill="#a1ccff">${v}</text>`).join('');
  const dotsStd = evo.std.map((v,i)=>`<circle cx="${xs[i]}" cy="${yScale(v)}" r="3" fill="#a855f7" stroke="#0a0d2b" stroke-width="1.5"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    <defs><linearGradient id="cl-mae-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4a9eff" stop-opacity="0.28"/><stop offset="1" stop-color="#4a9eff" stop-opacity="0.02"/></linearGradient></defs>
    ${grid}
    <polygon points="${areaMae}" fill="url(#cl-mae-fill)"/>
    <polyline points="${ptsMae}" fill="none" stroke="#4a9eff" stroke-width="2" stroke-linejoin="round"/>
    <polyline points="${ptsStd}" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round"/>
    ${dotsMae}${dotsStd}${xticks}
    <text x="${padL-30}" y="${padT+8}" font-family="Inter" font-size="9" fill="rgba(236,239,255,0.45)" font-weight="600">µm</text>
  </svg>`;
}

/* Toric rotation evolution chart */
function clToricEvoChart(){
  const evo = ((window.CL_CTX || clComputeContext()).toricEvo) || CL_TORIC_EVO;
  const W=420, H=210, padL=40, padR=14, padT=18, padB=28;
  const innerW=W-padL-padR, innerH=H-padT-padB;
  const xs = CL_TIMEPOINTS.map((_,i)=> padL + (i/(CL_TIMEPOINTS.length-1))*innerW );
  const yScale = v => padT + (1-v/100)*innerH;
  const ptsHigh = evo.high.map((v,i)=>`${xs[i]},${yScale(v)}`).join(' ');
  const ptsMid  = evo.mid.map((v,i)=>`${xs[i]},${yScale(v)}`).join(' ');
  const grid = [0,25,50,75,100].map(v=>{
    const y = yScale(v);
    return `<line x1="${padL}" x2="${W-padR}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,0.05)"/>
            <text x="${padL-6}" y="${y+3}" text-anchor="end" font-family="Inter" font-size="9" fill="rgba(236,239,255,0.4)">${v}%</text>`;
  }).join('');
  const xticks = CL_TIMEPOINTS.map((t,i)=>`<text x="${xs[i]}" y="${H-10}" text-anchor="middle" font-family="Inter" font-size="10" fill="rgba(236,239,255,0.55)" font-weight="600">${t}</text>`).join('');
  const dotsHigh = evo.high.map((v,i)=>{
    const above = v < 90 ? -10 : 14;
    return `<circle cx="${xs[i]}" cy="${yScale(v)}" r="3.5" fill="#7f21e0" stroke="#0a0d2b" stroke-width="1.5"/><text x="${xs[i]}" y="${yScale(v)+(above)}" text-anchor="middle" font-family="JetBrains Mono" font-size="9" font-weight="700" fill="#d1b4ff">${v}</text>`;
  }).join('');
  const dotsMid = evo.mid.map((v,i)=>{
    return `<circle cx="${xs[i]}" cy="${yScale(v)}" r="3.5" fill="#22d3ee" stroke="#0a0d2b" stroke-width="1.5"/><text x="${xs[i]}" y="${yScale(v)-9}" text-anchor="middle" font-family="JetBrains Mono" font-size="9" font-weight="700" fill="#8eeaf7">${v}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    ${grid}
    <polyline points="${ptsHigh}" fill="none" stroke="#7f21e0" stroke-width="2.2" stroke-linejoin="round"/>
    <polyline points="${ptsMid}"  fill="none" stroke="#22d3ee" stroke-width="2" stroke-linejoin="round"/>
    ${dotsMid}${dotsHigh}${xticks}
  </svg>`;
}

/* Radar chart — 9 axes, 4 polygons */
function clRadarSvg(){
  const radarData = ((window.CL_CTX || clComputeContext()).radar) || CL_RADAR;
  const W=380, H=380, cx=W/2, cy=H/2, R=130;
  const N = CL_PROMS_Q.length;
  const angle = i => (-Math.PI/2) + i*(2*Math.PI/N);
  // Concentric grid (rings at 2,4,6,8,10)
  const rings = [2,4,6,8,10].map(v=>{
    const r = R*(v/10);
    const pts = [];
    for(let i=0;i<N;i++){ pts.push(`${cx+Math.cos(angle(i))*r},${cy+Math.sin(angle(i))*r}`); }
    return `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,${v===10?0.18:0.07})" stroke-width="${v===10?1:0.6}"/>`;
  }).join('');
  // Axes
  const axes = [];
  for(let i=0;i<N;i++){
    const x2 = cx+Math.cos(angle(i))*R, y2 = cy+Math.sin(angle(i))*R;
    axes.push(`<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.07)" stroke-width="0.6"/>`);
    const lr = R+18;
    const lx = cx+Math.cos(angle(i))*lr, ly = cy+Math.sin(angle(i))*lr;
    axes.push(`<text x="${lx}" y="${ly+3}" text-anchor="middle" font-family="Inter" font-size="9.5" font-weight="700" fill="rgba(236,239,255,0.7)">${CL_PROMS_Q[i].code}</text>`);
    const lx2 = cx+Math.cos(angle(i))*(lr+13), ly2 = cy+Math.sin(angle(i))*(lr+13);
    axes.push(`<text x="${lx2}" y="${ly2+3}" text-anchor="middle" font-family="Inter" font-size="8.5" fill="rgba(236,239,255,0.45)">${CL_PROMS_Q[i].short}</text>`);
  }
  // Polygons per size
  const polys = CL_SIZES.map(s=>{
    const data = radarData[s.sz.replace(' mm','')];
    const pts = data.map((v,i)=>{
      const r = R*(v/10);
      return `${cx+Math.cos(angle(i))*r},${cy+Math.sin(angle(i))*r}`;
    }).join(' ');
    const dots = data.map((v,i)=>{
      const r = R*(v/10);
      return `<circle cx="${cx+Math.cos(angle(i))*r}" cy="${cy+Math.sin(angle(i))*r}" r="2.4" fill="${s.c}"/>`;
    }).join('');
    return `<polygon points="${pts}" fill="${s.c}" fill-opacity="0.13" stroke="${s.c}" stroke-width="1.6" stroke-linejoin="round"/>${dots}`;
  }).join('');
  // Center value labels (1, 5, 10)
  const scaleLbls = [[2,'2'],[6,'6'],[10,'10']].map(([v,t])=>{
    const r = R*(v/10);
    return `<text x="${cx+3}" y="${cy-r-2}" font-family="JetBrains Mono" font-size="8" fill="rgba(236,239,255,0.35)">${t}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;max-width:380px;display:block">
    ${rings}${axes}${polys}${scaleLbls}
  </svg>`;
}

/* Per-question evolution chart M1→M12 across 4 sizes */
function clPromsEvoChart(qcode){
  const W=420, H=220, padL=36, padR=14, padT=14, padB=28;
  const innerW=W-padL-padR, innerH=H-padT-padB;
  const xLabels = ['M1','M3','M6','M12'];
  const xs = xLabels.map((_,i)=> padL + (i/(xLabels.length-1))*innerW );
  const ymin=3, ymax=10;
  const yScale = v => padT + (1-(v-ymin)/(ymax-ymin))*innerH;
  const grid = [3,5,7,9,10].map(v=>{
    const y = yScale(v);
    return `<line x1="${padL}" x2="${W-padR}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,0.05)"/>
            <text x="${padL-6}" y="${y+3}" text-anchor="end" font-family="Inter" font-size="9" fill="rgba(236,239,255,0.4)">${v}</text>`;
  }).join('');
  const xticks = xLabels.map((t,i)=>`<text x="${xs[i]}" y="${H-9}" text-anchor="middle" font-family="Inter" font-size="10" fill="rgba(236,239,255,0.55)" font-weight="600">${t}</text>`).join('');
  const promsEvo = ((window.CL_CTX || clComputeContext()).promsEvo) || CL_PROMS_EVO;
  const data = promsEvo[qcode] || promsEvo.A1 || CL_PROMS_EVO.A1;
  const lines = CL_SIZES.map(s=>{
    const series = data[s.sz.replace(' mm','')];
    const pts = series.map((v,i)=>`${xs[i]},${yScale(v)}`).join(' ');
    const dots = series.map((v,i)=>`<circle cx="${xs[i]}" cy="${yScale(v)}" r="3" fill="${s.c}" stroke="#0a0d2b" stroke-width="1.5"/>`).join('');
    const last = series[series.length-1];
    const lx = xs[xs.length-1] + 6;
    const lbl = `<text x="${lx}" y="${yScale(last)+3}" font-family="JetBrains Mono" font-size="9.5" font-weight="800" fill="${s.c}">${last.toFixed(1)}</text>`;
    return `<polyline points="${pts}" fill="none" stroke="${s.c}" stroke-width="2" stroke-linejoin="round"/>${dots}${lbl}`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    ${grid}${lines}${xticks}
  </svg>`;
}

/* Update right side card when a question is clicked */
window.selectPromQ = function(qcode){
  const q = CL_PROMS_Q.find(x=>x.code===qcode) || CL_PROMS_Q[0];
  if(window.CL_CTX) window.CL_CTX.activeQ = qcode;
  document.querySelectorAll('.cl-q-btn').forEach(b=>b.classList.toggle('active', b.dataset.q===qcode));
  const showEl = document.getElementById('cl-showing-q');
  if(showEl) showEl.textContent = q.full;
  const chartEl = document.getElementById('cl-proms-evo-chart');
  if(chartEl) chartEl.innerHTML = clPromsEvoChart(qcode);
};

VIEWS.clinical = () => {
  // Compute / cache active context
  window.CL_CTX = clComputeContext();
  const ctx = window.CL_CTX;
  const totalCases = ctx.totalCases.toLocaleString('en-US');
  const toricCases = ctx.toricCases.toLocaleString('en-US');
  const activeQ = ctx.activeQ || 'A1';
  // Build buckets
  const bucketsHtml = ctx.buckets.map(b=>`
    <div class="cl-bucket">
      <span class="dt" style="background:${b.c};color:${b.c}"></span>
      <span class="lab">${b.lab}</span>
      <span class="pc">${b.pc.toFixed(1)}%</span>
      <span class="bar"><span style="width:${Math.min(100, b.pc*1.6)}%;background:${b.c}"></span></span>
    </div>`).join('');
  // Donut data for vault
  const vaultDonut = clDonutSvg(ctx.buckets, 100, 220, totalCases, 'TOTAL CASES');
  // Toric donut
  const toricSegs = [{pc:ctx.toricHigh,c:'#7f21e0'},{pc:ctx.toricMid,c:'#22d3ee'}];
  const toricDonut = clDonutSvg(toricSegs, 100, 240, toricCases, 'TORIC CASES');
  // Question grid
  const qGrid = CL_PROMS_Q.map(q=>`
    <button class="cl-q-btn ${q.code===activeQ?'active':''}" data-q="${q.code}" onclick="selectPromQ('${q.code}')">
      <div class="qc">${q.code}</div>
      <div class="ql">${q.short}</div>
    </button>`).join('');
  const activeQObj = CL_PROMS_Q.find(x=>x.code===activeQ) || CL_PROMS_Q[0];
  // Size legend cards
  const sizeLegend = CL_SIZES.map(s=>`
    <div class="cl-size-card" style="--c:${s.c}">
      <div class="nm"><i></i>${s.sz}</div>
      <div class="sub">${s.sub}</div>
    </div>`).join('');
  // Filter dropdowns (preserve current selection)
  const opts = (arr, current) => arr.map(o=>`<option value="${o}" ${o===current?'selected':''}>${o}</option>`).join('');
  // Header tag — boost chip or aggregate
  const headerTag = ctx.isBoosted
    ? `<span class="tag" style="background:rgba(16,212,140,0.14);color:#10d48c;border-color:rgba(16,212,140,0.32)"><span class="pulse" style="background:#10d48c"></span>OUTPERFORMING NETWORK</span>`
    : `<span class="tag"><span class="pulse"></span>${ctx.scopeLabel.toUpperCase()}</span>`;
  return `
  <div class="topbar">
    <div class="top-title">
      <h1>Clinical Analytics${headerTag}</h1>
      <p>Cross-network clinical outcomes — vault prediction, toric stability, and patient-reported outcomes (PROMs) by lens size.</p>
    </div>
    <div class="top-actions">
      <div class="chip on">M12 cohort</div>
      <div class="chip">Last 24 mo</div>
      <div class="chip">Export</div>
    </div>
  </div>

  <div class="cl-filterbar">
    <div class="cl-filter">
      <label>Clinic</label>
      <select class="cl-select" onchange="clSetFilter('clinic', this.value)">${opts(CL_CLINICS, window.CL_FILTERS.clinic)}</select>
    </div>
    <div class="cl-filter">
      <label>Surgeon</label>
      <select class="cl-select" onchange="clSetFilter('surgeon', this.value)">${opts(CL_SURGEONS, window.CL_FILTERS.surgeon)}</select>
    </div>
    <div class="cl-filter">
      <label>Country</label>
      <select class="cl-select" onchange="clSetFilter('country', this.value)">${opts(CL_COUNTRIES, window.CL_FILTERS.country)}</select>
    </div>
  </div>

  <!-- Section 1 — Vault prediction error -->
  <div class="card">
    <div class="cl-eyebrow"><span class="dot"></span>Δ VAULT · 1 DAY POSTOP</div>
    <h2 class="cl-section-title">Predicted vs. actual vault — error distribution</h2>
    <div class="cl-grid-vault">
      <div class="cl-stat-stack">
        <div class="cl-stat"><div class="v">${totalCases}</div><div class="l">N eyes 1D</div></div>
        <div class="cl-stat"><div class="v">${ctx.mae.toFixed(2)} µm</div><div class="l">Mean Abs Error</div></div>
        <div class="cl-stat"><div class="v">${ctx.std.toFixed(2)} µm</div><div class="l">Std Error</div></div>
      </div>
      <div class="cl-buckets">${bucketsHtml}</div>
      <div class="cl-donut-wrap">
        ${vaultDonut}
        <div class="cl-donut-cap">5 ERROR BUCKETS · % OF EYES</div>
      </div>
    </div>
    <div class="cl-callout">
      <svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span><b>${ctx.withinPct.toFixed(1)}% within ±200 µm</b> of prediction — well within the clinical safe sulcus window.</span>
    </div>
  </div>

  <!-- Section 2 — Toric stability -->
  <div class="card" style="margin-top:16px">
    <div class="cl-eyebrow"><span class="dot"></span>AFTER ICLGURU PRO</div>
    <h2 class="cl-section-title">Toric ICL rotation stability — 12-month follow-up</h2>
    <div class="cl-grid-toric">
      <div class="cl-donut-wrap">
        ${toricDonut}
        <div class="cl-donut-cap">M12 · ROTATION ≤ 5°</div>
      </div>
      <div>
        <div class="cl-toric-rows">
          <div class="cl-toric-row" style="border-left:3px solid #7f21e0">
            <span class="dt" style="background:#7f21e0;color:#7f21e0"></span>
            <span class="nm">High stability</span>
            <span class="pc" style="color:#d1b4ff">${ctx.toricHigh.toFixed(1)}%</span>
          </div>
          <div class="cl-toric-row" style="border-left:3px solid #22d3ee">
            <span class="dt" style="background:#22d3ee;color:#22d3ee"></span>
            <span class="nm">Mid stability</span>
            <span class="pc" style="color:#8eeaf7">${ctx.toricMid.toFixed(1)}%</span>
          </div>
        </div>
        <div class="cl-callout" style="margin-top:14px">
          <svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span><b>0 clinically significant rotations</b> — no rotation &gt;5° was observed in any toric case after ICLguru PRO sizing.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Section 3 — Evolution over time -->
  <div class="card" style="margin-top:16px">
    <div class="cl-eyebrow cyan"><span class="dot"></span>EVOLUTION OVER TIME</div>
    <h2 class="cl-section-title">Outcomes settle as the lens integrates</h2>
    <div class="cl-grid-evo">
      <div class="cl-evo-card">
        <div class="cl-evo-head">
          <div>
            <div class="ttl">Vault prediction error — MAE &amp; Std</div>
            <div class="sub">Δ vault (predicted − actual), µm</div>
          </div>
          <div class="leg">
            <span><i style="background:#4a9eff"></i>Mean Abs Error</span>
            <span><i style="background:#a855f7;background-image:repeating-linear-gradient(90deg,#a855f7 0,#a855f7 3px,transparent 3px,transparent 6px)"></i>Std Error</span>
          </div>
        </div>
        ${clVaultEvoChart()}
        <div class="cl-evo-foot">Error decreases as the lens settles into the sulcus and the vault stabilizes.</div>
      </div>
      <div class="cl-evo-card">
        <div class="cl-evo-head">
          <div>
            <div class="ttl">Toric rotation stability — % High vs Mid</div>
            <div class="sub">Share of toric cases per stability tier</div>
          </div>
          <div class="leg">
            <span><i style="background:#7f21e0"></i>% High</span>
            <span><i style="background:#22d3ee"></i>% Mid</span>
          </div>
        </div>
        ${clToricEvoChart()}
        <div class="cl-evo-foot">High stability climbs from 87.5% (D1) to 96.4% (Y3) as the haptics integrate.</div>
      </div>
    </div>
  </div>

  <!-- Section 4 — PROMs radar + question evolution -->
  <div class="card" style="margin-top:16px">
    <div class="cl-eyebrow"><span class="dot"></span>PROMS · M12 OUTCOMES BY LENS SIZE</div>
    <h2 class="cl-section-title">PROMs by lens size · radar + question evolution</h2>
    <p class="cl-section-sub">M12 aggregate scores for each STAAR ICL size across all 9 PROMs questions (left). Pick a question on the right to see its evolution across 1/3/6/12 months — broken out by lens size.</p>
    <div class="cl-grid-proms">
      <div class="cl-evo-card">
        <div class="cl-evo-head"><div><div class="ttl">9-axis radar — M12 score per question</div><div class="sub">Scale 1 (center) → 10 (edge)</div></div></div>
        <div class="cl-radar-wrap">${clRadarSvg()}</div>
        <div class="cl-size-legend">${sizeLegend}</div>
      </div>
      <div class="cl-evo-card">
        <div class="cl-evo-head"><div><div class="ttl">Question selector</div><div class="sub">Tap any question to see its M1–M12 evolution</div></div></div>
        <div class="cl-q-grid">${qGrid}</div>
        <div class="cl-showing">SHOWING</div>
        <div class="cl-showing-q" id="cl-showing-q">${activeQObj.full}</div>
        <div id="cl-proms-evo-chart">${clPromsEvoChart(activeQ)}</div>
        <div class="cl-size-legend" style="margin-top:14px">${sizeLegend}</div>
      </div>
    </div>
  </div>

  <div class="foot-note" style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-top:16px">
    <span class="staar-chip" title="Powered by STAAR Surgical"><img src="${STAAR_LOGO}" alt="STAAR Surgical"/><span>Intelligence Partner</span></span>
    <span style="flex:1;min-width:300px"><b>Clinical Analytics methodology.</b> Aggregate M12 cohort across all participating clinics, surgeons and countries. Vault deltas captured via EVO Vault biometry sync (Sonomed / ArcScan / Quantel UBM at 1D, 1M, 3M, 6M, 12M, Y3). Toric rotation measured at slit-lamp axis check vs. planned. PROMs collected via EVO Vault patient app. No PHI leaves the clinic — only anonymized aggregates are surfaced here.</span>
  </div>
  `;
};


/* Deterministic hash → seeded pseudo-random for consistent per-surgeon data */
function sHash(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return Math.abs(h); }
function sRand(seed,i){ const x=Math.sin(seed*9301+i*49297)*233280; return x-Math.floor(x); }

/* Build per-surgeon derived data: 12-mo history + size mix + PROMs trend + 6-mo forecast */
function surgeonProfile(s){
  const seed = sHash(s.n);
  const avgMonthly = Math.max(30, Math.round(s.vol / 3));           // s.vol is 90-day rolling
  const g = s.growth / 100;                                          // fractional growth
  // 12-month history: smooth ramp ending at current avg, with MoM noise
  const months12 = [];
  const historyLabels = ['May 25','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan 26','Feb','Mar','Apr'];
  for(let i=0;i<12;i++){
    const t = i/11;                                                  // 0 → 1
    const trend = (1 - g) + g*t;                                     // growth*t ramp
    const noise = 0.85 + sRand(seed,i)*0.3;                          // ±15%
    months12.push({ m:historyLabels[i], v: Math.round(avgMonthly*trend*noise) });
  }
  // 6-month forecast: continue growth trend + mild seasonality
  const forecast = [];
  const fLabels = ['May','Jun','Jul','Aug','Sep','Oct'];
  const lastBase = avgMonthly;
  for(let i=0;i<6;i++){
    const base = lastBase * (1 + g*(i+1)*0.25);
    const season = 1 + Math.sin((i+2)/6*Math.PI*2)*0.06;             // mild +/-6%
    const mean = Math.round(base*season);
    const ci = Math.round(mean*0.08 + 10);                           // ±8% CI
    forecast.push({ m:fLabels[i], base:mean, low: mean-ci, high: mean+ci });
  }
  // Lens size distribution (EVO overall diameter sizes in mm)
  const sizes = ['12.1','12.6','13.2','13.7'];
  const baseMix = [0.12, 0.38, 0.35, 0.15];
  const mix = baseMix.map((p,i)=>p + (sRand(seed,i+100)-0.5)*0.08);  // ±4 pts jitter
  const sum = mix.reduce((a,b)=>a+b,0);
  const sizeDist = sizes.map((sz,i)=>{
    const frac = mix[i]/sum;
    return { size: sz, count: Math.round(s.vol * frac), frac };
  });
  // PROMs evolution: trend upward toward s.proms, start ~3 pts lower 12 months ago
  const promsSeries = [];
  for(let i=0;i<12;i++){
    const t = i/11;
    const base = (s.proms - 3) + 3*t;
    const noise = (sRand(seed,i+200)-0.5)*0.7;                       // ±0.35
    promsSeries.push({ m: historyLabels[i], v: +(base+noise).toFixed(1) });
  }
  // Key stats
  const total12mo = months12.reduce((a,x)=>a+x.v,0);
  const bestMonth = months12.reduce((a,x)=>x.v>a.v?x:a);
  const promsNow = promsSeries[promsSeries.length-1].v;
  const promsYoY = +(promsNow - promsSeries[0].v).toFixed(1);
  const forecastTotal = forecast.reduce((a,x)=>a+x.base,0);
  return { months12, forecast, sizeDist, promsSeries, total12mo, bestMonth, promsNow, promsYoY, forecastTotal };
}

/* Render a compact SVG area/line chart (past+future) for volume, with CI band on forecast */
function surgVolChart(hist, fcast){
  const w = 480, h = 150, pl = 30, pr = 14, pt = 14, pb = 22;
  const allVals = [...hist.map(x=>x.v), ...fcast.map(x=>x.high)];
  const maxY = Math.ceil(Math.max(...allVals)*1.15 / 50) * 50;
  const minY = 0;
  const n = hist.length + fcast.length;
  const xStep = (w - pl - pr) / (n - 1);
  const xp = i => pl + i*xStep;
  const y  = v => h - pb - (v - minY)/(maxY - minY) * (h - pt - pb);
  const histPts = hist.map((x,i)=>`${xp(i).toFixed(1)},${y(x.v).toFixed(1)}`).join(' ');
  const fPts    = fcast.map((x,i)=>`${xp(hist.length-1+i+1).toFixed(1)},${y(x.base).toFixed(1)}`).join(' ');
  const loPath  = fcast.map((x,i)=>`${xp(hist.length-1+i+1).toFixed(1)},${y(x.low).toFixed(1)}`);
  const hiPath  = fcast.map((x,i)=>`${xp(hist.length-1+i+1).toFixed(1)},${y(x.high).toFixed(1)}`).reverse();
  // include last hist point to connect CI band
  const lastHistX = xp(hist.length-1).toFixed(1), lastHistY = y(hist[hist.length-1].v).toFixed(1);
  const bandD = `M${lastHistX},${lastHistY} L${loPath.join(' L')} L${hiPath.join(' L')} Z`;
  // y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t=>{
    const v = Math.round(minY + (maxY-minY)*t);
    return `<text x="${pl-5}" y="${y(v)+3}" fill="#6b7590" font-size="9" text-anchor="end">${v}</text><line x1="${pl}" x2="${w-pr}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,0.04)"/>`;
  }).join('');
  // x-labels (show every 2nd)
  const allLabels = [...hist.map(x=>x.m), ...fcast.map(x=>x.m)];
  const xLabels = allLabels.map((m,i)=> (i%2===0 || i===n-1) ? `<text x="${xp(i)}" y="${h-6}" fill="#6b7590" font-size="9" text-anchor="middle">${m}</text>` : '').join('');
  // divider line at hist/forecast boundary
  const divX = xp(hist.length-1);
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:150px;display:block">
    <defs>
      <linearGradient id="surg-areaG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a855f7" stop-opacity="0.35"/><stop offset="1" stop-color="#a855f7" stop-opacity="0.02"/></linearGradient>
    </defs>
    ${yTicks}
    <line x1="${divX}" x2="${divX}" y1="${pt}" y2="${h-pb}" stroke="rgba(168,85,247,0.35)" stroke-dasharray="3 4"/>
    <text x="${divX+4}" y="${pt+10}" fill="#a855f7" font-size="9" font-weight="700">FORECAST</text>
    <path d="${bandD}" fill="url(#surg-areaG)"/>
    <polyline points="${histPts}" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linejoin="round"/>
    <polyline points="${xp(hist.length-1).toFixed(1)},${y(hist[hist.length-1].v).toFixed(1)} ${fPts}" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="4 3" stroke-linejoin="round"/>
    ${hist.map((x,i)=>`<circle cx="${xp(i)}" cy="${y(x.v)}" r="2.5" fill="#22d3ee"/>`).join('')}
    ${fcast.map((x,i)=>`<circle cx="${xp(hist.length+i)}" cy="${y(x.base)}" r="2.8" fill="#a855f7" stroke="#fff" stroke-width="1"/>`).join('')}
    ${xLabels}
  </svg>`;
}

/* PROMs line chart */
function surgPromsChart(series){
  const w = 480, h = 120, pl = 30, pr = 14, pt = 16, pb = 22;
  const vals = series.map(x=>x.v);
  const minY = Math.floor(Math.min(...vals)-0.5);
  const maxY = Math.ceil(Math.max(...vals)+0.5);
  const xStep = (w - pl - pr) / (series.length - 1);
  const xp = i => pl + i*xStep;
  const y  = v => h - pb - (v - minY)/(maxY - minY) * (h - pt - pb);
  const pts = series.map((x,i)=>`${xp(i).toFixed(1)},${y(x.v).toFixed(1)}`).join(' ');
  // Build area fill
  const areaD = `M${xp(0)},${h-pb} L${pts.split(' ').join(' L')} L${xp(series.length-1)},${h-pb} Z`;
  const yTicks = [minY, (minY+maxY)/2, maxY].map(v=>`<text x="${pl-5}" y="${y(v)+3}" fill="#6b7590" font-size="9" text-anchor="end">${v.toFixed(0)}</text><line x1="${pl}" x2="${w-pr}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,0.04)"/>`).join('');
  const xLabels = series.map((x,i)=> (i%2===0 || i===series.length-1) ? `<text x="${xp(i)}" y="${h-6}" fill="#6b7590" font-size="9" text-anchor="middle">${x.m}</text>` : '').join('');
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:120px;display:block">
    <defs>
      <linearGradient id="surg-promsG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#10d48c" stop-opacity="0.35"/><stop offset="1" stop-color="#10d48c" stop-opacity="0.02"/></linearGradient>
    </defs>
    ${yTicks}
    <path d="${areaD}" fill="url(#surg-promsG)"/>
    <polyline points="${pts}" fill="none" stroke="#10d48c" stroke-width="2" stroke-linejoin="round"/>
    ${series.map((x,i)=>`<circle cx="${xp(i)}" cy="${y(x.v)}" r="2.5" fill="#10d48c"/>`).join('')}
    ${xLabels}
  </svg>`;
}

/* Horizontal lens size distribution */
function surgSizeDist(dist){
  const colors = ['#4a9eff','#22d3ee','#a855f7','#10d48c'];
  const maxCount = Math.max(...dist.map(d=>d.count));
  return `<div style="display:flex;flex-direction:column;gap:8px">
    ${dist.map((d,i)=>`
      <div style="display:grid;grid-template-columns:56px 1fr 80px;gap:10px;align-items:center;font-size:12px">
        <div style="font-weight:700;color:#cda8ff">${d.size} mm</div>
        <div style="height:10px;background:rgba(255,255,255,0.06);border-radius:5px;overflow:hidden"><div style="height:100%;width:${(d.count/maxCount*100).toFixed(1)}%;background:linear-gradient(90deg,${colors[i]}88,${colors[i]});border-radius:5px"></div></div>
        <div style="font-weight:700;text-align:right;font-feature-settings:'tnum'">${d.count.toLocaleString()} <span style="color:var(--text-3);font-weight:500">(${Math.round(d.frac*100)}%)</span></div>
      </div>`).join('')}
  </div>`;
}

/* Open surgeon drawer */

function openSurgeonByName(name){ const i = SURGEONS.findIndex(x=>x.n===name); if(i>=0) openSurgeon(i); }
function openSurgeon(idx){
  const s = SURGEONS[idx];
  if(!s){ return; }
  const p = surgeonProfile(s);
  const volGrowthArrow = s.growth>=0 ? '▲' : '▼';
  const growthClass = s.growth>=0 ? 'up' : 'down';
  const growthColor = s.growth>=0 ? 'var(--green)' : 'var(--red)';
  const modalDrawer = document.getElementById('drawer');
  modalDrawer.classList.add('wide');
  document.getElementById('drawer-content').innerHTML = `
    <div class="dr-sub" style="margin-top:4px">Surgeon profile</div>
    <h2 style="margin-bottom:2px">${s.n}</h2>
    <div style="font-size:12.5px;color:var(--text-2);margin-bottom:4px">${s.clinic} · ${s.flag} ${s.country}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      <span class="dr-clinic-eq ${s.eq}" style="font-size:10.5px">${EQ[s.eq].n}</span>
      <span class="ptag" style="background:rgba(168,85,247,0.16);color:#cda8ff">${s.spec}</span>
      <span class="ptag" style="background:rgba(34,211,238,0.14);color:#8eeaf7">PROMs ${s.proms.toFixed(1)}</span>
      <span class="ptag" style="background:rgba(${s.growth>=0?'16,212,140':'255,90,122'},0.16);color:${growthColor}">${volGrowthArrow} ${Math.abs(s.growth).toFixed(1)}% QoQ</span>
    </div>

    <div class="dr-section">
      <h4>Surgery evolution · last 12 months + 6-mo forecast</h4>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 10px">
        <div class="dr-stat"><div class="k">12-mo total</div><div class="v">${p.total12mo.toLocaleString()}</div><div class="d">implants</div></div>
        <div class="dr-stat"><div class="k">Best month</div><div class="v">${p.bestMonth.v}</div><div class="d">${p.bestMonth.m}</div></div>
        <div class="dr-stat"><div class="k">Forecast 6mo</div><div class="v" style="color:#cda8ff">${p.forecastTotal.toLocaleString()}</div><div class="d">May → Oct 26</div></div>
      </div>
      ${surgVolChart(p.months12, p.forecast)}
      <div style="display:flex;gap:16px;font-size:10.5px;color:var(--text-3);margin-top:6px;justify-content:center">
        <span><span style="display:inline-block;width:10px;height:2px;background:#22d3ee;margin-right:5px;vertical-align:middle"></span>Actual</span>
        <span><span style="display:inline-block;width:10px;height:2px;background:#a855f7;margin-right:5px;vertical-align:middle"></span>Forecast (MAPE 5.2%)</span>
        <span><span style="display:inline-block;width:10px;height:6px;background:rgba(168,85,247,0.25);margin-right:5px;vertical-align:middle"></span>95% CI</span>
      </div>
    </div>

    <div class="dr-section">
      <h4>Lens size distribution · 90 days</h4>
      <div style="font-size:11.5px;color:var(--text-3);margin:-2px 0 10px">EVO overall diameter. Total <b style="color:var(--text)">${s.vol.toLocaleString()}</b> lenses across 4 sizes.</div>
      ${surgSizeDist(p.sizeDist)}
    </div>

    <div class="dr-section">
      <h4>PROMs evolution · 12 months</h4>
      <div style="display:flex;gap:16px;margin:6px 0 10px">
        <div class="dr-stat" style="flex:1"><div class="k">Current score</div><div class="v" style="color:var(--green)">${p.promsNow.toFixed(1)}</div><div class="d">blended composite</div></div>
        <div class="dr-stat" style="flex:1"><div class="k">YoY change</div><div class="v" style="color:${p.promsYoY>=0?'var(--green)':'var(--red)'}">${p.promsYoY>=0?'+':''}${p.promsYoY.toFixed(1)}</div><div class="d">points</div></div>
        <div class="dr-stat" style="flex:1"><div class="k">Vs. peer avg</div><div class="v" style="color:var(--green)">+${(s.proms-93.5).toFixed(1)}</div><div class="d">pts above global</div></div>
      </div>
      ${surgPromsChart(p.promsSeries)}
      <div style="font-size:11px;color:var(--text-3);margin-top:8px;line-height:1.5">
        Composite of uncorrected visual acuity · NEI VFQ-25 quality-of-life · night-vision subscale · 30-day satisfaction.
        <b style="color:var(--text-2)">Captured via EVO Vault</b> at 1 week / 1 month / 3 month / 1 year post-op.
      </div>
    </div>

    <div class="dr-section">
      <h4>Forecast drivers · next 2 quarters</h4>
      <ul style="margin:8px 0 0;padding-left:18px;font-size:12px;color:var(--text-2);line-height:1.7">
        <li><b>Historical trend:</b> ${s.growth>=0?'+':''}${s.growth.toFixed(1)}% QoQ, compounding</li>
        <li><b>Seasonality:</b> +6% peak in Q3 (school + military cycles), −4% trough Q4</li>
        <li><b>Clinic pipeline:</b> ${Math.round(s.vol*0.35).toLocaleString()} consultations booked across 90d</li>
        <li><b>Equipment match:</b> ${EQ[s.eq].n} biometry — sizing MAE 0.08 mm (below peer median)</li>
      </ul>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn primary" onclick="showView('copilot'); closeDrawer();">Ask Copilot about this surgeon</button>
        <button class="btn" onclick="closeDrawer()">Close</button>
      </div>
    </div>
  `;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('backdrop').classList.add('show');
}


/* init */
showView('command');
