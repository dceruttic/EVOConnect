/* ================================================================
   REVAI COPILOT — clinic-level natural-language AI (Phase 5 & 6)
   Mirrors the STAAR Copilot pattern but with stronger visual impact:
   hero w/ animated orb, gradient input border, KPIs, inline SVG
   charts (line/bar/donut/h-bar), tables, citations, typing dots.
================================================================ */
window.COPILOT_STATE = window.COPILOT_STATE || { history: [], lastQ: null };

/* ---- Mock clinic data (consistent with DATA.patients · scaled to 248 cases) ---- */
const REV_CLINIC = {
  totalCases: 248,            // historical archive (15 shown live + ~233 archival)
  liveCases: 15,
  npsMine: 72,
  npsPeer: 58,
  monthlyVolume: [14, 16, 19, 17, 22, 21, 24, 23, 27, 26, 29, 31],
  monthLabels: ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'],
  forecast: [33, 35, 38],
  forecastLow: [29, 30, 32],
  forecastHigh: [36, 40, 44],
  forecastLabels: ['Jul','Aug','Sep'],
  // Dissatisfied (last 6 months) — derived from low-NPS patient profiles in DATA.patients
  dissatisfied: [
    { name: 'B. Solís',   age: 36, sphere: '-9.00 / -8.75', date: 'May 2, 2025',  proms: 38, reason: 'Night halos · mesopic pupil 7.1 mm' },
    { name: 'M. Herrera', age: 32, sphere: '-8.00 / -7.75', date: 'Apr 24, 2026', proms: 42, reason: 'Blurry night vision · borderline ACD' },
    { name: 'A. Duarte',  age: 36, sphere: '-9.25 / -9.50', date: 'Mar 18, 2026', proms: 44, reason: 'Starburst + reduced mesopic contrast' },
    { name: 'F. Lima',    age: 41, sphere: '-7.25',         date: 'Feb 28, 2026', proms: 48, reason: 'Halos · dry eye OSDI 26' },
    { name: 'S. Ortega',  age: 29, sphere: '-5.75 / -5.50', date: 'Feb 11, 2026', proms: 49, reason: 'Residual refractive error -0.75 OD' },
    { name: 'M. Guzman',  age: 38, sphere: '-0.50 (Toric)', date: 'Jan 16, 2026', proms: 52, reason: 'Residual cylinder 1.25D · expectations' },
  ],
  surgeons: [
    { name: 'Dr. Diego Cerutti',   cases: 142, avgVault: 478, withinTgt: 91, nps: 76 },
    { name: 'Dr. Roberto Zaldivar', cases:  64, avgVault: 462, withinTgt: 88, nps: 74 },
    { name: 'Dr. M. Velasco',       cases:  28, avgVault: 446, withinTgt: 82, nps: 68 },
    { name: 'Dr. L. Soto',          cases:  14, avgVault: 510, withinTgt: 71, nps: 61 },
  ],
  overdue: [
    { name: 'B. Solís',   milestone: 'Year-1 ECC scan',      days: 23, surgery: 'May 2, 2025'  },
    { name: 'T. Aguilar', milestone: 'M6 vault + OCT',       days: 14, surgery: 'Nov 12, 2025' },
    { name: 'E. Navarro', milestone: 'M3 PROMs',             days:  9, surgery: 'Feb 5, 2026'  },
    { name: 'J. Rivera',  milestone: 'M1 night-vision PROM', days:  4, surgery: 'Mar 28, 2026' },
  ],
  pipeline: [
    { stage: 'Consult',     count: 2, icon: '💬' },
    { stage: 'Eligibility', count: 2, icon: '🔬' },
    { stage: 'Biometry',    count: 2, icon: '📐' },
    { stage: 'Sizing',      count: 2, icon: '🎯' },
    { stage: 'Scheduled',   count: 3, icon: '🗓️' },
  ],
  lensModels: [
    { name: 'EVO+ Sphere',  cases: 118, nps: 78, vault: 480 },
    { name: 'EVO Toric',    cases:  62, nps: 71, vault: 470 },
    { name: 'EVO Viva',     cases:  38, nps: 74, vault: 495 },
    { name: 'EVO Classic',  cases:  30, nps: 64, vault: 455 },
  ],
  complications: [
    { name: 'A. Duarte',  date: 'Jun 03',  type: 'Hypervault (628 µm)', sev: 'high', action: 'Exchange scheduled 12.1 mm' },
    { name: 'F. Lima',    date: 'Jun 05',  type: 'IOP spike (28 mmHg)', sev: 'med',  action: 'Timolol 0.5% + 48h re-scan' },
    { name: 'V. Sanz',    date: 'Jun 07',  type: 'Mild corneal edema',  sev: 'low',  action: 'Extended Tobradex post-op' },
  ],
  commonTraits: [
    { label: 'Mesopic pupil ≥ 6.5 mm',    pct: 71, baseline: 24 },
    { label: 'High myopia (-8D to -10D)', pct: 64, baseline: 33 },
    { label: 'Age 28–42',                 pct: 58, baseline: 44 },
    { label: 'Borderline ACD ≤ 3.05 mm',  pct: 47, baseline: 18 },
    { label: 'Complex sizing (>1 iter)',  pct: 42, baseline: 19 },
    { label: 'OSDI > 22 pre-op',          pct: 38, baseline: 16 },
  ],
};

function revCopilotEscape(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---- SVG chart builders (REVAI palette) ---- */
function revCopilotLineChart(values, labels, opts){
  opts = opts || {};
  const w = 600, h = 200, pad = 32;
  const max = Math.max.apply(null, values) * 1.12;
  const min = Math.min.apply(null, values) * 0.85;
  const xStep = (w - pad*2) / (values.length - 1);
  const y = v => h - pad - (v - min) / (max - min) * (h - pad*2 - 14);
  const xp = i => pad + i * xStep;
  const pts = values.map((v,i) => `${xp(i)},${y(v)}`).join(' ');
  const areaPath = `M${pad},${h-pad} L${values.map((v,i)=>`${xp(i)},${y(v)}`).join(' L')} L${xp(values.length-1)},${h-pad} Z`;
  const dots = values.map((v,i) => `<circle cx="${xp(i)}" cy="${y(v)}" r="4" fill="#fff" stroke="#5C18AB" stroke-width="2.2"/>`).join('');
  const valLabels = values.map((v,i) => `<text x="${xp(i)}" y="${y(v)-10}" fill="#5C18AB" font-size="10" font-weight="700" text-anchor="middle">${v}</text>`).join('');
  const xLabels = labels.map((m,i) => `<text x="${xp(i)}" y="${h-10}" fill="#8b86a0" font-size="10" text-anchor="middle">${m}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rcpLineG" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#5C18AB" stop-opacity="0.32"/>
        <stop offset="1" stop-color="#5C18AB" stop-opacity="0.01"/>
      </linearGradient>
      <linearGradient id="rcpStrokeG" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#5C18AB"/>
        <stop offset="1" stop-color="#0071B0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#rcpLineG)"/>
    <polyline points="${pts}" fill="none" stroke="url(#rcpStrokeG)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${valLabels}${xLabels}
  </svg>`;
}
function revCopilotForecastChart(){
  const w = 600, h = 200, pad = 32;
  const past = REV_CLINIC.monthlyVolume.slice(-6);
  const pastLabels = REV_CLINIC.monthLabels.slice(-6);
  const fut = REV_CLINIC.forecast, futLo = REV_CLINIC.forecastLow, futHi = REV_CLINIC.forecastHigh;
  const futLabels = REV_CLINIC.forecastLabels;
  const all = past.concat(fut, futHi);
  const max = Math.max.apply(null, all) * 1.1;
  const min = Math.min.apply(null, all.concat(futLo)) * 0.85;
  const total = past.length + fut.length;
  const xStep = (w - pad*2) / (total - 1);
  const y = v => h - pad - (v - min) / (max - min) * (h - pad*2 - 14);
  const xp = i => pad + i * xStep;
  const pastPts = past.map((v,i) => `${xp(i)},${y(v)}`).join(' ');
  const futPts = fut.map((v,i) => `${xp(past.length-1+i+1)},${y(v)}`).join(' ');
  const bridge = `${xp(past.length-1)},${y(past[past.length-1])} ${xp(past.length)},${y(fut[0])}`;
  const bandPath = `M${xp(past.length)},${y(futLo[0])} L${xp(past.length+1)},${y(futLo[1])} L${xp(past.length+2)},${y(futLo[2])} L${xp(past.length+2)},${y(futHi[2])} L${xp(past.length+1)},${y(futHi[1])} L${xp(past.length)},${y(futHi[0])} Z`;
  const allLabels = pastLabels.concat(futLabels);
  const ticks = allLabels.map((m,i) => `<text x="${xp(i)}" y="${h-10}" fill="#8b86a0" font-size="10" text-anchor="middle">${m}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rcpFcCI" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#0071B0" stop-opacity="0.28"/>
        <stop offset="1" stop-color="#0071B0" stop-opacity="0.04"/>
      </linearGradient>
    </defs>
    <path d="${bandPath}" fill="url(#rcpFcCI)"/>
    <polyline points="${pastPts}" fill="none" stroke="#5C18AB" stroke-width="2.6" stroke-linejoin="round"/>
    <polyline points="${bridge}" fill="none" stroke="#0071B0" stroke-width="2.4" stroke-dasharray="5 4"/>
    <polyline points="${futPts}" fill="none" stroke="#0071B0" stroke-width="2.6" stroke-linejoin="round" stroke-dasharray="5 4"/>
    ${past.map((v,i)=>`<circle cx="${xp(i)}" cy="${y(v)}" r="4" fill="#fff" stroke="#5C18AB" stroke-width="2.2"/><text x="${xp(i)}" y="${y(v)-10}" fill="#5C18AB" font-size="10" font-weight="700" text-anchor="middle">${v}</text>`).join('')}
    ${fut.map((v,i)=>`<circle cx="${xp(past.length+i)}" cy="${y(v)}" r="4" fill="#fff" stroke="#0071B0" stroke-width="2.2"/><text x="${xp(past.length+i)}" y="${y(v)-10}" fill="#0071B0" font-size="10" font-weight="700" text-anchor="middle">${v}</text>`).join('')}
    <line x1="${xp(past.length-1)+xStep/2}" x2="${xp(past.length-1)+xStep/2}" y1="${pad}" y2="${h-pad}" stroke="#5C18AB" stroke-opacity="0.18" stroke-dasharray="3 4"/>
    <text x="${xp(past.length-1)+xStep/2+6}" y="${pad+10}" fill="#8b86a0" font-size="10" font-weight="600">Forecast →</text>
    ${ticks}
  </svg>`;
}
function revCopilotBarChart(items, opts){
  // items: [{label,value}, ...]
  opts = opts || {};
  const w = 600, h = 200, pad = 30;
  const max = Math.max.apply(null, items.map(d=>d.value)) * 1.15;
  const bw = (w - pad*2) / items.length * 0.68;
  const gap = (w - pad*2) / items.length;
  const palette = ['#5C18AB','#0071B0','#08B1C2','#03B496','#F6BF2C','#D12C4A'];
  const bars = items.map((d,i) => {
    const bh = (d.value / max) * (h - pad*2 - 14);
    const x = pad + i*gap + (gap-bw)/2;
    const yy = h - pad - bh;
    const fill = palette[i % palette.length];
    return `<rect x="${x}" y="${yy}" width="${bw}" height="${bh}" rx="5" fill="${fill}" opacity="0.92"/>
            <text x="${x+bw/2}" y="${yy-6}" fill="${fill}" font-size="11" font-weight="800" text-anchor="middle">${d.value}${opts.suffix||''}</text>
            <text x="${x+bw/2}" y="${h-10}" fill="#8b86a0" font-size="10" text-anchor="middle">${d.label}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}
function revCopilotHBarChart(items){
  // items: [{label,value,suffix?}]
  const w = 600, rowH = 32, h = items.length * rowH + 20;
  const max = Math.max.apply(null, items.map(d=>d.value));
  const labelW = 170, valW = 80, trkX = labelW, trkW = w - labelW - valW;
  const rows = items.map((d,i) => {
    const cy = 14 + i*rowH;
    const bw = (d.value / max) * trkW;
    return `<text x="0" y="${cy+15}" fill="#3c3654" font-size="12" font-weight="700">${d.label}</text>
      <rect x="${trkX}" y="${cy+6}" width="${trkW}" height="14" rx="7" fill="#F2EFF8"/>
      <rect x="${trkX}" y="${cy+6}" width="${bw}" height="14" rx="7" fill="url(#rcpHbarG)"/>
      <text x="${w}" y="${cy+15}" fill="#1c1530" font-size="12" font-weight="800" text-anchor="end">${d.value}${d.suffix||''}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="rcpHbarG" x1="0" x2="1"><stop offset="0" stop-color="#5C18AB"/><stop offset="1" stop-color="#0071B0"/></linearGradient></defs>
    ${rows}
  </svg>`;
}
function revCopilotDonutChart(pctOk, label){
  const r = 70, c = 90, cx = c, cy = c, circ = 2*Math.PI*r;
  const ok = circ * (pctOk/100);
  const bad = circ - ok;
  return `<svg viewBox="0 0 ${c*2} ${c*2}" xmlns="http://www.w3.org/2000/svg" style="max-width:200px;margin:0 auto;display:block">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F2EFF8" stroke-width="22"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#rcpDonG)" stroke-width="22"
      stroke-dasharray="${ok} ${bad}" stroke-dashoffset="${circ/4}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round"/>
    <defs><linearGradient id="rcpDonG" x1="0" x2="1"><stop offset="0" stop-color="#03B496"/><stop offset="1" stop-color="#0071B0"/></linearGradient></defs>
    <text x="${cx}" y="${cy-2}" fill="#1c1530" font-size="28" font-weight="800" text-anchor="middle">${pctOk}%</text>
    <text x="${cx}" y="${cy+18}" fill="#8b86a0" font-size="10.5" font-weight="700" text-anchor="middle" letter-spacing="0.5">${label||'ON-TIME'}</text>
  </svg>`;
}

/* ---- Intent matcher ---- */
function revCopilotMatchIntent(q){
  const s = (q || '').toLowerCase();
  if (/(caracter|trait|charact|comun|common|perfil)/.test(s) && /(insatisf|descont|dissat|unhappy)/.test(s)) return 'traits';
  if (/(insatisf|descont|dissat|unhappy|worst|quej|complain)/.test(s)) return 'dissat';
  if (/(evolu|trend|mes a mes|month|monthly|growth|crecim)/.test(s) && /(cirug|surgery|surger|cas)/.test(s)) return 'evolution';
  if (/(vault|accuracy|precis|surgeon|cirujan)/.test(s)) return 'vault';
  if (/(overdue|retras|vencid|atras|late|post.?op).*(post.?op|follow|seguim|paciente)|overdue|vencid|atras/.test(s)) return 'overdue';
  if (/(pipeline|esta semana|this week|funnel|funel|cohort|flujo)/.test(s)) return 'pipeline';
  if (/(lens|lente|model|modelo|evo\+|toric|viva|outcome)/.test(s) && /(best|mejor|outcome|result)/.test(s)) return 'lens';
  if (/(forecast|próximo|proximo|trimestr|quarter|projec|predic|pronost)/.test(s)) return 'forecast';
  if (/(complic|complication|advers|event|severe|critic)/.test(s)) return 'complications';
  if (/(nps|net promot|benchmark|peer|compar|similar|clinic.*compar)/.test(s)) return 'nps';
  return 'fallback';
}

/* ---- Answer dispatcher ---- */
function revCopilotAnswer(intent, q){
  switch(intent){
    case 'dissat':        return revCopilotAnsDissat();
    case 'traits':        return revCopilotAnsTraits();
    case 'evolution':     return revCopilotAnsEvolution();
    case 'vault':         return revCopilotAnsVault();
    case 'overdue':       return revCopilotAnsOverdue();
    case 'pipeline':      return revCopilotAnsPipeline();
    case 'lens':          return revCopilotAnsLens();
    case 'forecast':      return revCopilotAnsForecast();
    case 'complications': return revCopilotAnsComplications();
    case 'nps':           return revCopilotAnsNps();
    default:              return revCopilotAnsFallback(q);
  }
}

/* ---- Answer renderers ---- */
function revCopilotAnsDissat(){
  const d = REV_CLINIC.dissatisfied;
  const rows = d.map(p => `<tr>
    <td><b>${p.name}</b></td>
    <td>${p.age}</td>
    <td>${p.sphere}</td>
    <td>${p.date}</td>
    <td><b style="color:#D12C4A">${p.proms}</b></td>
    <td class="rcp-dim">${p.reason}</td>
  </tr>`).join('');
  const pct = ((d.length / REV_CLINIC.totalCases) * 100).toFixed(1);
  return `
    <h4>😟 Dissatisfied patients · last 6 months <span class="ptag live">Live · EVO Vault</span></h4>
    <p>I detected <b>${d.length} patients</b> with <b>PROMs &lt; 55</b> on the visual satisfaction scale (NEI-VFQ-25 + dysphotopsia panel). They represent <b>${pct}%</b> of the <b>${REV_CLINIC.totalCases} cases</b> in your clinic's archive.</p>
    <div class="rcp-kpis">
      <div class="rcp-kpi accent-red"><div class="l">% Dissatisfied</div><div class="v">${pct}%</div><div class="d"><span class="dn">↑ 0.4%</span> vs previous quarter</div></div>
      <div class="rcp-kpi"><div class="l">Patients</div><div class="v">${d.length}</div><div class="d">of ${REV_CLINIC.totalCases} archive cases</div></div>
      <div class="rcp-kpi accent-teal"><div class="l">Avg PROMs (cohort)</div><div class="v">45.5</div><div class="d">vs 84 clinic baseline</div></div>
      <div class="rcp-kpi accent-gold"><div class="l">Top complaint</div><div class="v">Halos</div><div class="d">in 67% of cohort</div></div>
    </div>
    <table>
      <thead><tr><th>Patient</th><th>Age</th><th>Sphere</th><th>Surgery date</th><th>PROMs</th><th>Main reason</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="rcp-cta">
      <button onclick="revCopilotAsk('What common characteristics do my dissatisfied patients share?')">Drill · common characteristics →</button>
      <button onclick="renderModule('patients')">Open patient list →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Vault · PROMs</span>
      <span class="srcpill">NEI-VFQ-25 · ${d.length} cases</span>
      <span class="srcpill">6-month window · through ${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>
    </div>`;
}

function revCopilotAnsTraits(){
  const t = REV_CLINIC.commonTraits;
  const bars = t.map(x => `<div class="rcp-bar">
    <span class="lbl">${x.label}</span>
    <span class="trk"><span class="fil" style="width:${x.pct}%"></span></span>
    <span class="vv">${x.pct}% <span class="rcp-dim" style="font-weight:500">vs ${x.baseline}%</span></span>
  </div>`).join('');
  return `
    <h4>🧬 Common clinical profile · dissatisfied patients <span class="ptag">Multivariate analysis</span></h4>
    <p>I cross-referenced the <b>${REV_CLINIC.dissatisfied.length} dissatisfied patients</b> against your satisfied cohort. Three traits stand out well above the expected baseline.</p>
    <div class="rcp-kpis">
      <div class="rcp-kpi"><div class="l">Average age</div><div class="v">35.3<small> yrs</small></div><div class="d">vs <b>42.1</b> satisfied · <span class="dn">−6.8 yrs</span></div></div>
      <div class="rcp-kpi accent-teal"><div class="l">% Large mesopic pupil</div><div class="v">71%</div><div class="d">vs <b>24%</b> baseline · <span class="dn">3.0× higher</span></div></div>
      <div class="rcp-kpi accent-gold"><div class="l">% Complex sizing</div><div class="v">42%</div><div class="d">≥ 2 calculation iterations</div></div>
    </div>
    <div class="rcp-chart">
      <div class="rcp-chart-title">Trait frequency · dissatisfied cohort vs baseline</div>
      ${bars}
    </div>
    <ul class="rcp-insights">
      <li><b>Dominant pattern:</b> high myopia (-8D to -10D) + mesopic pupil ≥ 6.5 mm is the strongest predictor of halos at 30 days.</li>
      <li><b>Borderline anatomy:</b> 47% had ACD between 2.98–3.05 mm — I'd recommend Pentacam scan #2 escalation for that range.</li>
      <li><b>Suggested action:</b> add explicit consent regarding halos when mesopic pupil ≥ 6.5 mm + age &lt; 38.</li>
    </ul>
    <div class="rcp-cta">
      <button onclick="revCopilotAsk('What is my vault accuracy by surgeon?')">Vault accuracy by surgeon →</button>
      <button onclick="revCopilotAsk('How does my NPS compare to peer clinics?')">NPS vs peers →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Vault · biometry</span>
      <span class="srcpill">Pentacam · 248 scans</span>
      <span class="srcpill">PROMs · 6-month cohort</span>
    </div>`;
}

function revCopilotAnsEvolution(){
  const total = REV_CLINIC.monthlyVolume.reduce((a,b)=>a+b,0);
  const first6 = REV_CLINIC.monthlyVolume.slice(0,6).reduce((a,b)=>a+b,0);
  const last6 = REV_CLINIC.monthlyVolume.slice(-6).reduce((a,b)=>a+b,0);
  const growth = (((last6 - first6) / first6) * 100).toFixed(0);
  return `
    <h4>📈 Surgery evolution · last 12 months <span class="ptag live">Real-time</span></h4>
    <p>Sustained monthly volume increase. Your clinic grew <b>+${growth}%</b> in the last half-year vs the previous six months. June closed with <b>${REV_CLINIC.monthlyVolume[REV_CLINIC.monthlyVolume.length-1]} surgeries</b>, your best month on record.</p>
    <div class="rcp-chart">
      <div class="rcp-chart-title">Surgeries per month · ${REV_CLINIC.monthLabels[0]} 2025 – ${REV_CLINIC.monthLabels[11]} 2026</div>
      ${revCopilotLineChart(REV_CLINIC.monthlyVolume, REV_CLINIC.monthLabels)}
    </div>
    <div class="rcp-kpis">
      <div class="rcp-kpi accent-green"><div class="l">12-month total</div><div class="v">${total}</div><div class="d"><span class="up">+${growth}%</span> vs H1</div></div>
      <div class="rcp-kpi accent-teal"><div class="l">Monthly average</div><div class="v">${(total/12).toFixed(1)}</div><div class="d">trend <span class="up">↑ rising</span></div></div>
      <div class="rcp-kpi"><div class="l">Best month</div><div class="v">31</div><div class="d">Jun 2026 · record</div></div>
      <div class="rcp-kpi accent-gold"><div class="l">Active pipeline</div><div class="v">${REV_CLINIC.liveCases}</div><div class="d">patients in funnel</div></div>
    </div>
    <div class="rcp-cta">
      <button onclick="revCopilotAsk('Forecast surgeries for the next quarter?')">View quarterly forecast →</button>
      <button onclick="renderModule('analytics')">Open Clinic Analytics →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Vault · ${total} surgeries</span>
      <span class="srcpill">EVO Connect · order history</span>
      <span class="srcpill">Updated 8 min ago</span>
    </div>`;
}

function revCopilotAnsVault(){
  const s = REV_CLINIC.surgeons;
  const rows = s.map(x => `<tr>
    <td><b>${x.name}</b></td>
    <td style="text-align:right">${x.cases}</td>
    <td style="text-align:right">${x.avgVault} µm</td>
    <td style="text-align:right"><b style="color:${x.withinTgt>=85?'#03B496':x.withinTgt>=75?'#E78A27':'#D12C4A'}">${x.withinTgt}%</b></td>
    <td style="text-align:right"><b>${x.nps}</b></td>
  </tr>`).join('');
  const hbar = revCopilotHBarChart(s.map(x => ({label:x.name.replace('Dr. ',''), value:x.withinTgt, suffix:'%'})));
  return `
    <h4>🎯 Vault accuracy by surgeon <span class="ptag">Cohort ${REV_CLINIC.totalCases} cases</span></h4>
    <p>The clinical target is <b>250–750 µm</b> with a sweet-spot of <b>400–550 µm</b>. Precision is measured as % of cases within the sweet-spot at the first W1 measurement.</p>
    <table>
      <thead><tr><th>Surgeon</th><th style="text-align:right">Cases</th><th style="text-align:right">Avg vault</th><th style="text-align:right">In target</th><th style="text-align:right">NPS</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="rcp-chart">
      <div class="rcp-chart-title">% within sweet-spot (400–550 µm)</div>
      ${hbar}
    </div>
    <div class="rcp-kpis">
      <div class="rcp-kpi accent-green"><div class="l">Clinic avg vault</div><div class="v">472<small> µm</small></div><div class="d">center of sweet-spot</div></div>
      <div class="rcp-kpi accent-teal"><div class="l">Overall accuracy</div><div class="v">87%</div><div class="d">vs <b>76%</b> regional benchmark</div></div>
      <div class="rcp-kpi accent-gold"><div class="l">Top performer</div><div class="v" style="font-size:16px">Dr. Cerutti</div><div class="d">91% in-target · 142 cases</div></div>
    </div>
    <div class="rcp-cta">
      <button onclick="revCopilotAsk('Which lens model has the best outcomes?')">Best lens model →</button>
      <button onclick="renderModule('training')">Training · AI Coach →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Vault · 248 cases</span>
      <span class="srcpill">AS-OCT W1 + M1</span>
      <span class="srcpill">Latam benchmark: 38 clinics</span>
    </div>`;
}

function revCopilotAnsOverdue(){
  const o = REV_CLINIC.overdue;
  const totalPostop = 4;
  const onTime = Math.max(0, Math.round(((totalPostop - 0) / totalPostop) * 100) - Math.round((o.length/(o.length+8))*100));
  const onTimePct = 67;
  const rows = o.map(p => `<tr>
    <td><b>${p.name}</b></td>
    <td>${p.surgery}</td>
    <td>${p.milestone}</td>
    <td><b class="sev-${p.days>=20?'high':p.days>=10?'med':'low'}">${p.days} days late</b></td>
  </tr>`).join('');
  return `
    <h4>⏰ Post-op overdue · patients with late follow-up <span class="ptag">Active tracker</span></h4>
    <p>Of your active post-op patients, <b>${o.length}</b> have at least one overdue milestone. AI Sentinel already attempted contact via WhatsApp and email — check the action column in the Patients module to see the log.</p>
    <div style="display:grid;grid-template-columns:200px 1fr;gap:18px;align-items:center;margin:14px 0">
      <div class="rcp-chart" style="margin:0;padding:10px">${revCopilotDonutChart(onTimePct, 'ON TIME')}</div>
      <div class="rcp-kpis" style="margin:0">
        <div class="rcp-kpi accent-red"><div class="l">Overdue</div><div class="v">${o.length}</div><div class="d"><span class="dn">↑ 1</span> vs last week</div></div>
        <div class="rcp-kpi accent-green"><div class="l">On time</div><div class="v">8</div><div class="d">active post-op</div></div>
        <div class="rcp-kpi accent-gold"><div class="l">Most urgent</div><div class="v" style="font-size:16px">B. Solís</div><div class="d">Year-1 ECC · 23 days</div></div>
      </div>
    </div>
    <table>
      <thead><tr><th>Patient</th><th>Surgery date</th><th>Overdue milestone</th><th>Delay</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <ul class="rcp-insights">
      <li><b>Sentinel acted:</b> 3 of 4 already received an automatic reminder. Solís needs a manual call (outdated phone line).</li>
      <li><b>Pattern:</b> the M3 and Year-1 milestones are the most vulnerable — add a 7-day buffer in scheduling.</li>
    </ul>
    <div class="rcp-cta">
      <button onclick="renderModule('patients')">Open patient list →</button>
      <button onclick="revCopilotAsk('How is my patient pipeline this week?')">This week's pipeline →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Vault · follow-up tracker</span>
      <span class="srcpill">AI Sentinel · 4 actions this week</span>
      <span class="srcpill">Today ${new Date().toLocaleDateString('en-US')}</span>
    </div>`;
}

function revCopilotAnsPipeline(){
  const p = REV_CLINIC.pipeline;
  const total = p.reduce((a,b)=>a+b.count,0);
  const max = Math.max.apply(null, p.map(s=>s.count));
  const rows = p.map(s => {
    const w = Math.max(28, (s.count/max)*100);
    return `<div class="rcp-funnel-row">
      <div class="rcp-funnel-bar" style="width:${w}%">
        <span class="stage">${s.icon} ${s.stage}</span>
        <span class="count">${s.count}</span>
      </div>
    </div>`;
  }).join('');
  return `
    <h4>🔭 This week's pipeline · ${total} active patients <span class="ptag live">Live</span></h4>
    <p>Distribution of your patients across the pre-surgical funnel. <b>3 surgeries scheduled</b> for this week · <b>2 sizings</b> awaiting confirmation.</p>
    <div class="rcp-funnel">${rows}</div>
    <div class="rcp-kpis">
      <div class="rcp-kpi accent-teal"><div class="l">Total pipeline</div><div class="v">${total}</div><div class="d"><span class="up">+2</span> vs last week</div></div>
      <div class="rcp-kpi accent-green"><div class="l">Consult→surgery conversion</div><div class="v">72%</div><div class="d">↑ <span class="up">+5pp</span> quarter</div></div>
      <div class="rcp-kpi accent-gold"><div class="l">Avg time</div><div class="v">21<small> days</small></div><div class="d">consult → surgery</div></div>
      <div class="rcp-kpi"><div class="l">Scheduled surgeries</div><div class="v">3</div><div class="d">this week</div></div>
    </div>
    <ul class="rcp-insights">
      <li><b>Bottleneck:</b> 2 patients awaiting biometry — the optics team has capacity for 4 per day.</li>
      <li><b>Opportunity:</b> Romero (consult) and Sanz (eligibility) could enter sizing this same week if Pentacam frees up a slot.</li>
    </ul>
    <div class="rcp-cta">
      <button onclick="renderModule('patients')">View patients →</button>
      <button onclick="renderModule('order')">STAAR orders →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Vault · pipeline tracker</span>
      <span class="srcpill">Clinic calendar</span>
      <span class="srcpill">Updated 3 min ago</span>
    </div>`;
}

function revCopilotAnsLens(){
  const m = REV_CLINIC.lensModels;
  const bars = revCopilotBarChart(m.map(x=>({label:x.name.replace('EVO ',''), value:x.nps})), {suffix:''});
  const rows = m.map(x => `<tr>
    <td><b>${x.name}</b></td>
    <td style="text-align:right">${x.cases}</td>
    <td style="text-align:right"><b>${x.nps}</b></td>
    <td style="text-align:right">${x.vault} µm</td>
    <td><span class="sev-${x.nps>=75?'low':x.nps>=68?'med':'high'}">${x.nps>=75?'Excellent':x.nps>=68?'Good':'Average'}</span></td>
  </tr>`).join('');
  return `
    <h4>🏆 Lens models by outcome · your clinic <span class="ptag">Cohort 248 cases</span></h4>
    <p>The <b>EVO+ Sphere</b> remains your workhorse with the best NPS and volume. The <b>EVO Viva</b> shows promise in moderate myopia with low reported dysphotopsia.</p>
    <div class="rcp-chart">
      <div class="rcp-chart-title">NPS by lens model</div>
      ${bars}
    </div>
    <table>
      <thead><tr><th>Model</th><th style="text-align:right">Cases</th><th style="text-align:right">NPS</th><th style="text-align:right">Avg vault</th><th>Rating</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="rcp-kpis">
      <div class="rcp-kpi accent-green"><div class="l">Top model</div><div class="v" style="font-size:18px">EVO+ Sphere</div><div class="d">NPS <b>78</b> · 118 cases</div></div>
      <div class="rcp-kpi accent-teal"><div class="l">Highest growth</div><div class="v" style="font-size:18px">EVO Viva</div><div class="d"><span class="up">+22%</span> quarter</div></div>
      <div class="rcp-kpi accent-gold"><div class="l">Review</div><div class="v" style="font-size:18px">EVO Classic</div><div class="d">NPS 64 · deprecation candidate</div></div>
    </div>
    <div class="rcp-cta">
      <button onclick="revCopilotAsk('Who are my dissatisfied patients over the last 6 months?')">Who are the dissatisfied?</button>
      <button onclick="renderModule('order')">View STAAR orders →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Vault · PROMs by SKU</span>
      <span class="srcpill">STAAR MES · order history</span>
      <span class="srcpill">12-month window</span>
    </div>`;
}

function revCopilotAnsForecast(){
  const sumFc = REV_CLINIC.forecast.reduce((a,b)=>a+b,0);
  return `
    <h4>📊 Surgery forecast · next quarter <span class="ptag">Demand Forecaster v2.1</span></h4>
    <p>Based on your 12-month series + regional seasonality + confirmed pipeline. The model projects <b>${sumFc} surgeries</b> in Jul–Sep, with a 95% confidence interval between <b>${REV_CLINIC.forecastLow.reduce((a,b)=>a+b,0)}</b> and <b>${REV_CLINIC.forecastHigh.reduce((a,b)=>a+b,0)}</b>.</p>
    <div class="rcp-chart">
      <div class="rcp-chart-title">6-month history + 3-month forecast</div>
      ${revCopilotForecastChart()}
    </div>
    <div class="rcp-pill-row">
      <span class="rcp-pill"><span class="dotx" style="background:#5C18AB"></span> History (6 mo)</span>
      <span class="rcp-pill"><span class="dotx" style="background:#0071B0"></span> Forecast</span>
      <span class="rcp-pill"><span class="dotx" style="background:#0071B080"></span> 95% CI</span>
    </div>
    <div class="rcp-kpis">
      <div class="rcp-kpi accent-teal"><div class="l">Forecast Q3</div><div class="v">${sumFc}</div><div class="d">cases · base case</div></div>
      <div class="rcp-kpi accent-green"><div class="l">Upside (P95)</div><div class="v">${REV_CLINIC.forecastHigh.reduce((a,b)=>a+b,0)}</div><div class="d"><span class="up">+16%</span> vs base</div></div>
      <div class="rcp-kpi"><div class="l">MAPE 90d</div><div class="v">6.4%</div><div class="d">hold-out precision</div></div>
      <div class="rcp-kpi accent-gold"><div class="l">Main driver</div><div class="v" style="font-size:16px">EVO+ Sphere</div><div class="d">62% of growth</div></div>
    </div>
    <ul class="rcp-insights">
      <li><b>Seasonality:</b> August is usually your peak — we project 35 surgeries (+13% MoM).</li>
      <li><b>Implied stock:</b> reserving <b>~120 lenses</b> for Q3 covers the base scenario. Bump to 140 to cover P95.</li>
    </ul>
    <div class="rcp-cta">
      <button onclick="renderModule('order')">Reserve STAAR inventory →</button>
      <button onclick="revCopilotAsk('What is my month-by-month surgery evolution?')">View monthly history →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">Demand Forecaster v2.1</span>
      <span class="srcpill">12-month clinic series</span>
      <span class="srcpill">Pipeline · 15 active patients</span>
    </div>`;
}

function revCopilotAnsComplications(){
  const c = REV_CLINIC.complications;
  const rows = c.map(x => `<tr>
    <td><b>${x.name}</b></td>
    <td>${x.date}</td>
    <td>${x.type}</td>
    <td><span class="sev-${x.sev}">${x.sev.toUpperCase()}</span></td>
    <td class="rcp-dim">${x.action}</td>
  </tr>`).join('');
  const sevDist = [
    {label:'High', value:c.filter(x=>x.sev==='high').length},
    {label:'Medium', value:c.filter(x=>x.sev==='med').length},
    {label:'Low', value:c.filter(x=>x.sev==='low').length},
  ];
  return `
    <h4>⚠️ Complications · this week <span class="ptag">${c.length} events · 0 severe pending resolution</span></h4>
    <p>I detected <b>${c.length} adverse events</b> this week. None compromised final visual acuity. The Duarte hypervault case requires a scheduled exchange — the other two are under conservative management.</p>
    <div class="rcp-kpis">
      <div class="rcp-kpi accent-red"><div class="l">Complications</div><div class="v">${c.length}</div><div class="d">this week</div></div>
      <div class="rcp-kpi accent-gold"><div class="l">Weekly rate</div><div class="v">1.2%</div><div class="d">vs <b>0.9%</b> baseline · <span class="dn">↑</span></div></div>
      <div class="rcp-kpi accent-green"><div class="l">Resolved</div><div class="v">2<small> / ${c.length}</small></div><div class="d">66% in &lt; 48h</div></div>
      <div class="rcp-kpi accent-teal"><div class="l">Avg response time</div><div class="v">14<small> h</small></div><div class="d">from detection</div></div>
    </div>
    <table>
      <thead><tr><th>Patient</th><th>Date</th><th>Type</th><th>Severity</th><th>Action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="rcp-chart">
      <div class="rcp-chart-title">Severity distribution</div>
      ${revCopilotBarChart(sevDist, {suffix:''})}
    </div>
    <ul class="rcp-insights">
      <li><b>Pattern to watch:</b> 2 of 3 complications come from the high-myopia cohort. Reinforce the sizing protocol above -8D.</li>
      <li><b>Duarte case:</b> the model predicted a high vault (528 µm) but the actual was 628 µm — outlier vs historical MAPE.</li>
    </ul>
    <div class="rcp-cta">
      <button onclick="renderModule('patients')">Open patients →</button>
      <button onclick="revCopilotAsk('Who are my dissatisfied patients?')">Dissatisfied patients →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Vault · adverse events log</span>
      <span class="srcpill">AS-OCT vault monitoring</span>
      <span class="srcpill">7-day window</span>
    </div>`;
}

function revCopilotAnsNps(){
  const me = REV_CLINIC.npsMine, peer = REV_CLINIC.npsPeer;
  const benchmarks = [
    { label:'Your clinic (Cerutti)', value: me, suffix:'' },
    { label:'Regional top decile',   value: 79, suffix:'' },
    { label:'Latam median',          value: peer, suffix:'' },
    { label:'Global average',        value: 54, suffix:'' },
    { label:'Bottom quartile',       value: 41, suffix:'' },
  ];
  return `
    <h4>⭐ NPS · your clinic vs benchmarks <span class="ptag live">EVO Connect Network · 38 peer clinics</span></h4>
    <p>Your NPS of <b>${me}</b> puts you in the <b>84th percentile</b> of the EVO Connect Latam network (38 clinics with a similar ICL profile: 200–400 cases/year, toric mix ≥ 25%). You are <b>+14 points</b> above the median.</p>
    <div class="rcp-kpis">
      <div class="rcp-kpi accent-green"><div class="l">Your NPS</div><div class="v">${me}</div><div class="d"><span class="up">+${me-peer}</span> vs peer median</div></div>
      <div class="rcp-kpi accent-teal"><div class="l">Percentile</div><div class="v">P84</div><div class="d">Latam ICL network</div></div>
      <div class="rcp-kpi accent-gold"><div class="l">Distance to top</div><div class="v">−7<small> pts</small></div><div class="d">vs top decile (NPS 79)</div></div>
      <div class="rcp-kpi"><div class="l">Promoters</div><div class="v">81%</div><div class="d">vs 11% detractors</div></div>
    </div>
    <div class="rcp-chart">
      <div class="rcp-chart-title">NPS comparison · EVO Connect network benchmarks</div>
      ${revCopilotHBarChart(benchmarks)}
    </div>
    <ul class="rcp-insights">
      <li><b>Strength:</b> your post-op communication rating is <b>9.1/10</b> (vs 7.8 median). It's your biggest differentiator.</li>
      <li><b>To reach the top decile:</b> reducing reported halos in the high-myopia cohort would add ~5 NPS points.</li>
      <li><b>Peer ranking:</b> you're #6 of 38 clinics. Top 3: Zaldivar Mendoza (82), CASEM Buenos Aires (81), Vista Salud (80).</li>
    </ul>
    <div class="rcp-cta">
      <button onclick="revCopilotAsk('What common characteristics do my dissatisfied patients share?')">Where can I improve? →</button>
      <button onclick="renderModule('community')">View EVO Connect network →</button>
    </div>
    <div class="rcp-cite">
      Sources:
      <span class="srcpill">EVO Connect Network · 38 peer clinics</span>
      <span class="srcpill">NEI-VFQ-25 · normalized</span>
      <span class="srcpill">Trailing 6-month NPS</span>
    </div>`;
}

function revCopilotAnsFallback(q){
  return `
    <h4>🤔 I'm not 100% sure what you want to know <span class="ptag">Suggestions</span></h4>
    <p>I tried several intents and none clearly matched your question: <b style="font-style:italic">"${revCopilotEscape(q)}"</b>. Tap one of these to get started:</p>
    <div class="rcp-cta">
      <button onclick="revCopilotAsk('Who are my dissatisfied patients over the last 6 months?')">😟 Dissatisfied patients</button>
      <button onclick="revCopilotAsk('What is my month-by-month surgery evolution?')">📈 Surgery evolution</button>
      <button onclick="revCopilotAsk('Forecast surgeries for the next quarter?')">📊 Quarterly forecast</button>
      <button onclick="revCopilotAsk('How does my NPS compare to peer clinics?')">⭐ NPS vs peers</button>
    </div>
    <div class="rcp-cite">
      <span class="srcpill">Tip: use natural language · EN or ES</span>
    </div>`;
}

/* ---- Ask / submit ---- */
function revCopilotAsk(qText){
  const inp = document.getElementById('rcp-input');
  if (inp) inp.value = '';
  const stream = document.getElementById('rcp-stream');
  if (!stream) return;
  // User bubble
  const userMsg = document.createElement('div');
  userMsg.className = 'rcp-msg user';
  userMsg.innerHTML = `<div class="rcp-bubble" style="background:linear-gradient(135deg,#1c1530,#2a2247);color:#fff;border:1px solid rgba(92,24,171,.4);max-width:68%;font-size:14px;padding:12px 18px;border-radius:16px 16px 4px 16px">${revCopilotEscape(qText)}</div>`;
  stream.appendChild(userMsg);
  // Typing
  const typing = document.createElement('div');
  typing.className = 'rcp-msg assist';
  typing.innerHTML = `
    <div class="rcp-av">
      <svg viewBox="0 0 24 24"><path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7L12 2z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/></svg>
    </div>
    <div class="rcp-bubble"><span class="rcp-typing"><span></span><span></span><span></span></span></div>`;
  stream.appendChild(typing);
  // Scroll
  setTimeout(()=>{
    const m = document.getElementById('usMain');
    if (m) m.scrollTop = m.scrollHeight;
  }, 30);
  // Resolve
  setTimeout(()=>{
    const intent = revCopilotMatchIntent(qText);
    const html = revCopilotAnswer(intent, qText);
    typing.querySelector('.rcp-bubble').innerHTML = html;
    window.COPILOT_STATE.history.push({ q: qText, intent: intent });
    window.COPILOT_STATE.lastQ = qText;
    setTimeout(()=>{
      const m = document.getElementById('usMain');
      if (m) m.scrollTop = m.scrollHeight;
    }, 40);
  }, 540);
}
function revCopilotSubmit(e){
  if (e) e.preventDefault();
  const inp = document.getElementById('rcp-input');
  if (!inp) return false;
  const q = (inp.value || '').trim();
  if (!q) return false;
  revCopilotAsk(q);
  return false;
}
window.revCopilotAsk = revCopilotAsk;
window.revCopilotSubmit = revCopilotSubmit;

/* ---- The view ---- */
function renderCopilot(){
  return `
  <div class="rev-copilot">
    <section class="rcp-hero">
      <div class="rcp-orb">
        <svg viewBox="0 0 24 24"><path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7L12 2z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/></svg>
      </div>
      <div class="rcp-hero-body">
        <h1>Hi Roger — <span class="rcp-grad">ask me anything about your clinic</span></h1>
        <p>Natural-language insights across your <b>${REV_CLINIC.totalCases} cases</b>, 12-month history, post-op data, PROMs, and patient outcomes. English or Spanish.</p>
      </div>
      <div class="rcp-hero-meta">
        <span class="rcp-status">Copilot v1.0 · online</span>
        <span class="rcp-version">Clinic-private · cited sources</span>
      </div>
    </section>

    <form class="rcp-input-card" onsubmit="return revCopilotSubmit(event)">
      <div class="rcp-input-row">
        <svg class="rcp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
        <input id="rcp-input" class="rcp-input" placeholder="Ask anything — e.g. Who are my dissatisfied patients over the last 6 months?" autocomplete="off" autofocus/>
        <button type="submit" class="rcp-send">Ask<svg viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>
      </div>
    </form>

    <div class="rcp-sugs">
      <span class="rcp-sug" onclick="revCopilotAsk('Who are my dissatisfied patients over the last 6 months?')"><span class="ico">😟</span> Dissatisfied patients</span>
      <span class="rcp-sug" onclick="revCopilotAsk('What common characteristics do my dissatisfied patients share?')"><span class="ico">🧬</span> Common characteristics (dissatisfied)</span>
      <span class="rcp-sug" onclick="revCopilotAsk('What is my month-by-month surgery evolution?')"><span class="ico">📈</span> Surgery evolution</span>
      <span class="rcp-sug" onclick="revCopilotAsk('What is my vault accuracy by surgeon?')"><span class="ico">🎯</span> Vault accuracy by surgeon</span>
      <span class="rcp-sug" onclick="revCopilotAsk('Which patients are overdue in post-op?')"><span class="ico">⏰</span> Overdue post-op</span>
      <span class="rcp-sug" onclick="revCopilotAsk('How is my patient pipeline this week?')"><span class="ico">🔭</span> This week's pipeline</span>
      <span class="rcp-sug" onclick="revCopilotAsk('Which lens model has the best outcomes?')"><span class="ico">🏆</span> Best lens model</span>
      <span class="rcp-sug" onclick="revCopilotAsk('Forecast surgeries for the next quarter?')"><span class="ico">📊</span> Quarterly forecast</span>
      <span class="rcp-sug" onclick="revCopilotAsk('Analyze this week's complications?')"><span class="ico">⚠️</span> This week's complications</span>
      <span class="rcp-sug" onclick="revCopilotAsk('How does my NPS compare to peer clinics?')"><span class="ico">⭐</span> NPS vs peer clinics</span>
    </div>

    <div class="rcp-stream" id="rcp-stream">
      <div class="rcp-msg assist">
        <div class="rcp-av">
          <svg viewBox="0 0 24 24"><path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7L12 2z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/></svg>
        </div>
        <div class="rcp-bubble">
          <h4>👋 Hi Roger — ready when you are <span class="ptag live">Copilot v1.0 · online</span></h4>
          <p>I'm connected to your clinic's private graph: <b>${REV_CLINIC.totalCases} surgeries</b> in the archive, <b>12 months</b> of history, post-op tracker, <b>PROMs via EVO Vault</b>, calendars and operational metrics in real time. Tap a suggestion above or write to me in natural language — English or Spanish, whichever you prefer.</p>
          <p class="rcp-dim">All responses are private to your clinic. I cite sources. Final clinical decisions are always yours.</p>
        </div>
      </div>
    </div>
  </div>`;
}
window.renderCopilot = renderCopilot;

const MODULES = {
  dashboard: renderDashboard,
  // 'copilot' module removed from EVO Connect — hero now lives on the clinic dashboard
  patients: renderPatients,
  simulator: renderSimulator,
  preop: renderPreop,
  sizing: renderSizing,
  order: renderOrder,
  surgery: renderSurgery,
  postop: renderPostop,
  community: renderCommunity,
  training: renderTraining,
  support: renderSupport,
  analytics: renderAnalytics,
  'evo-credits': renderEvoCredits,
};

let CURRENT_MOD = "dashboard";

function renderModule(key) {
  CURRENT_MOD = key;
  const main = document.getElementById("usMain");
  main.innerHTML = MODULES[key]();
  main.scrollTop = 0;
  document.querySelectorAll("#usNav button").forEach(b => {
    b.classList.toggle("active", b.dataset.mod === key);
  });
  if (key === "patients" && typeof _restorePatientsView === "function") _restorePatientsView();
}

document.getElementById("usNav").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-mod]");
  if (!btn) return;
  renderModule(btn.dataset.mod);
});

function openUniverse() {
  document.getElementById("universeView").classList.add("open");
  /* Open on the first module the current phase actually ships — in Phase 1 the
     Dashboard does not exist yet, so EVO Connect lands on Patients. */
  var mod = (window.PhaseDemo && typeof PhaseDemo.firstAccessibleModule === 'function')
    ? PhaseDemo.firstAccessibleModule('dashboard') : 'dashboard';
  renderModule(mod);
  document.body.style.overflow = "hidden";
}
function toggleSidebar() {
  const sb = document.getElementById("universeSidebar");
  const uv = document.getElementById("universeView");
  if (!sb) return;
  sb.classList.toggle("collapsed");
  const isCollapsed = sb.classList.contains("collapsed");
  // Also toggle on the parent — fallback for browsers without :has() support
  if (uv) uv.classList.toggle("sidebar-collapsed", isCollapsed);
  try { localStorage.setItem("usSidebarCollapsed", isCollapsed ? "1" : "0"); } catch(e) {}
}
// Restore collapsed state on load
(function restoreSidebar(){
  try {
    if (localStorage.getItem("usSidebarCollapsed") === "1") {
      document.addEventListener("DOMContentLoaded", () => {
        const sb = document.getElementById("universeSidebar");
        const uv = document.getElementById("universeView");
        if (sb) sb.classList.add("collapsed");
        if (uv) uv.classList.add("sidebar-collapsed");
      });
    }
  } catch(e) {}
})();
function closeUniverse() {
  document.getElementById("universeView").classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (document.getElementById("copilotPanel").classList.contains("open")) closeCopilot();
    else closeUniverse();
  }
});

/* Next Events now live inside the ICL Universe dashboard module */

function renderCopilotSuggest() {
  const el = document.getElementById("copilotSuggest");
  el.innerHTML = SUGGESTED_PROMPTS.map(p => `<button onclick="document.getElementById('copilotInput').value=this.textContent; sendCopilotMsg();">${p}</button>`).join("");
}
