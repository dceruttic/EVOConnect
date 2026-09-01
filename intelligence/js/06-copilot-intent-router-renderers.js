/* ========= COPILOT: intent router + renderers ========= */
const CP_STATE = { history: [] };

function cpEscape(s){ return String(s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

function cpMatchIntent(q){
  const s = q.toLowerCase();
  // Order: most specific → least specific
  // If previous turn was about dissatisfied patients, interpret follow-up pronouns
  const lastIntent = (CP_STATE.history[CP_STATE.history.length-1]||{}).intent || '';
  const dissatContext = /dissat|wheredissat|traits/.test(lastIntent);
  if (/caracter|trait|charact|comun|common|perfil/.test(s) && (/insatisf|dissat|unhappy|worst|complain|pacient|patient|esos|those/.test(s) || dissatContext)) return 'traits';
  if (/(clínic|clinic|cirujan|surgeon|hospital|países\s+(y\s+)?(clínic|cirujan)|countries\s+(and\s+)?(clinic|surgeon))/.test(s) && /insatisf|dissat|unhappy|worst/.test(s)) return 'wheredissat';
  if (/insatisf|dissat|unhappy|worst|complain|pacientes? (malos|insatisfech)/.test(s)) return 'dissat';
  if (/(forecast|próximos|proximos|next|next 3|3 months|3 meses|predic|projec|pronost)/.test(s) && /(lent|lens|order|pedido)/.test(s)) return 'forecast';
  if (/(lent|lens|order|pedido)/.test(s) && /(argent|ar\b|🇦🇷)/.test(s)) return 'argentina';
  if (/(argent|ar\b|🇦🇷)/.test(s)) return 'argentina';
  if (/(forecast|próximos|proximos|next|next 3|3 months|3 meses|predic|projec|pronost)/.test(s)) return 'forecast';
  return 'fallback';
}

function cpAnswer(intent, q){
  switch(intent){
    case 'argentina':   return cpAnswerArgentina();
    case 'forecast':    return cpAnswerForecast();
    case 'dissat':      return cpAnswerDissat();
    case 'wheredissat': return cpAnswerWhereDissat();
    case 'traits':      return cpAnswerTraits();
    default:            return cpAnswerFallback(q);
  }
}

function cpAnswerArgentina(){
  const d = AR_ORDERS_THIS_MONTH;
  const rows = d.bySku.map(s=>`<tr>
    <td><b>${s.sku}</b><div class="cp-dim">${s.note}</div></td>
    <td style="text-align:right"><b>${s.lenses.toLocaleString()}</b></td>
    <td style="text-align:right">${s.share.toFixed(1)}%</td>
    <td style="text-align:right;color:${s.momDelta.startsWith('-')?'#fb7185':'#34d399'};font-weight:700">${s.momDelta}</td>
  </tr>`).join('');
  const clinicRows = d.byClinic.map(c=>`<tr>
    <td><b>${c.clinic}</b><div class="cp-dim">${c.region}</div></td>
    <td style="text-align:right"><b>${c.lenses.toLocaleString()}</b></td>
    <td style="text-align:right;color:${c.delta.startsWith('-')?'#fb7185':'#34d399'};font-weight:700">${c.delta}</td>
  </tr>`).join('');
  // sparkline bars for SKU share
  const barTot = d.bySku.reduce((a,b)=>a+b.lenses,0);
  const bars = d.bySku.map(s=>`
    <div class="cp-bar"><span class="lbl">${s.sku}</span><span class="trk"><span class="fil" style="width:${(s.lenses/barTot*100).toFixed(1)}%"></span></span><span class="vv">${s.lenses.toLocaleString()}</span></div>`).join('');
  return `
    <h4>🇦🇷 Argentina — lens orders, ${d.month} <span class="ptag">live data</span></h4>
    <p><b>${d.totalLenses.toLocaleString()} lenses</b> shipped to 31 active Argentine clinics this month. <b style="color:#34d399">${d.deltaMom} MoM</b> · <b style="color:#34d399">${d.deltaYoy} YoY</b>. EVO+ Sphere continues to dominate; the <b>EVO Viva</b> launch in March is accelerating (+41% MoM) as 6 newly-certified surgeons ramp up.</p>
    <div class="cp-kpis">
      <div class="cp-kpi"><div class="l">Total lenses</div><div class="v">${d.totalLenses.toLocaleString()}</div><div class="d"><span class="up">${d.deltaMom}</span> MoM</div></div>
      <div class="cp-kpi"><div class="l">Top SKU</div><div class="v">EVO+ Sphere</div><div class="d">44.2% share · 1,840 units</div></div>
      <div class="cp-kpi"><div class="l">Fastest growing</div><div class="v">EVO Viva</div><div class="d"><span class="up">+41% MoM</span> · 320 units</div></div>
      <div class="cp-kpi"><div class="l">Active clinics</div><div class="v">31<small style="font-size:12px;color:var(--text-3);font-weight:600"> / 34</small></div><div class="d">3 on seasonal pause</div></div>
    </div>
    <h4 style="margin-top:14px">By SKU</h4>
    <table>
      <thead><tr><th>SKU</th><th style="text-align:right">Lenses</th><th style="text-align:right">Share</th><th style="text-align:right">MoM</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h4 style="margin-top:16px">Top clinics · April 2026</h4>
    <table>
      <thead><tr><th>Clinic</th><th style="text-align:right">Lenses</th><th style="text-align:right">vs March</th></tr></thead>
      <tbody>${clinicRows}</tbody>
    </table>
    <div class="cp-cta">
      <button onclick="showView('supply')">Open supply-chain view →</button>
      <button onclick="cpAsk('Give me the 3-month lens forecast for Argentina')">Ask: 3-month forecast</button>
      <button onclick="openCountry('AR')">Open Argentina drawer →</button>
    </div>
    <div class="cp-cite">
      Sources: <span class="srcpill">STAAR MES · ship-to logs</span>
      <span class="srcpill">Air-freight customs AR (ANMAT)</span>
      <span class="srcpill">31 clinic POS feeds</span>
      <span class="srcpill">Updated 22 min ago</span>
    </div>`;
}

function cpAnswerForecast(){
  const f = AR_FORECAST;
  const rows = f.months.map(m=>`<tr>
    <td><b>${m.m}</b></td>
    <td style="text-align:right"><b>${m.base.toLocaleString()}</b></td>
    <td style="text-align:right" class="cp-dim">${m.low.toLocaleString()}–${m.high.toLocaleString()}</td>
    <td style="text-align:right;color:#34d399;font-weight:700">${m.dom}</td>
    <td>${m.top}</td>
  </tr>`).join('');
  const drivers = f.drivers.map(d=>`<li style="margin:4px 0">${d}</li>`).join('');
  // Line chart: actuals (6mo) + forecast (3mo) with confidence band
  const past = [3340,3520,3480,3710,3640,4160];
  const fut = f.months.map(m=>m.base);
  const futLo = f.months.map(m=>m.low);
  const futHi = f.months.map(m=>m.high);
  const allVals = [...past, ...futHi];
  const maxV = Math.max(...allVals)*1.08, minV = Math.min(...allVals.concat(futLo))*0.9;
  const w = 760, h = 180, pad = 30;
  const xStep = (w - pad*2) / (past.length + fut.length - 1);
  const y = v => h - pad - (v - minV)/(maxV - minV) * (h - pad*2);
  const xp = i => pad + i * xStep;
  const pastPts = past.map((v,i)=>`${xp(i)},${y(v)}`).join(' ');
  const futPts = fut.map((v,i)=>`${xp(past.length-1+i+1)},${y(v)}`).join(' ');
  const bridge = `${xp(past.length-1)},${y(past[past.length-1])} ${xp(past.length)},${y(fut[0])}`;
  const bandPath = `M${xp(past.length)},${y(futLo[0])} L${xp(past.length+1)},${y(futLo[1])} L${xp(past.length+2)},${y(futLo[2])} L${xp(past.length+2)},${y(futHi[2])} L${xp(past.length+1)},${y(futHi[1])} L${xp(past.length)},${y(futHi[0])} Z`;
  const monthLabels = ['Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'];
  const ticks = monthLabels.map((m,i)=>`<text x="${xp(i)}" y="${h-8}" fill="#8892b0" font-size="10" text-anchor="middle">${m}</text>`).join('');
  const svg = `
  <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#7f21e0" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#7f21e0" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <path d="${bandPath}" fill="url(#areaGrad)" stroke="none"/>
    <polyline points="${pastPts}" fill="none" stroke="#22d3ee" stroke-width="2.2"/>
    <polyline points="${bridge}" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-dasharray="5 4"/>
    <polyline points="${futPts}" fill="none" stroke="#a855f7" stroke-width="2.2"/>
    ${past.map((v,i)=>`<circle cx="${xp(i)}" cy="${y(v)}" r="3.5" fill="#22d3ee"/>`).join('')}
    ${fut.map((v,i)=>`<circle cx="${xp(past.length+i)}" cy="${y(v)}" r="3.5" fill="#a855f7" stroke="#fff" stroke-width="1"/>`).join('')}
    <line x1="${xp(past.length-1)+xStep/2}" x2="${xp(past.length-1)+xStep/2}" y1="${pad}" y2="${h-pad}" stroke="#ffffff22" stroke-dasharray="3 4"/>
    <text x="${xp(past.length-1)+xStep/2+4}" y="${pad+12}" fill="#8892b0" font-size="10">Forecast →</text>
    ${ticks}
  </svg>`;
  return `
    <h4>🇦🇷 Argentina — 3-month lens order forecast <span class="ptag">${f.horizon}</span></h4>
    <p>Model: <b>Demand Forecaster</b> agent (STAAR×REVAI) · trained on 4.7M surgeries across 7 regions · <b>MAPE ${f.mape}%</b> on AR rolling 90-day hold-out. Bootstrap intervals at 95% confidence.</p>
    <div class="cp-chart">${svg}</div>
    <div class="cp-pill-row">
      <span class="cp-pill"><span class="dotx" style="background:#22d3ee"></span> Actual (last 6 mo)</span>
      <span class="cp-pill"><span class="dotx" style="background:#a855f7"></span> Forecast</span>
      <span class="cp-pill"><span class="dotx" style="background:#a855f766"></span> 95% CI</span>
    </div>
    <table>
      <thead><tr><th>Month</th><th style="text-align:right">Base forecast</th><th style="text-align:right">95% interval</th><th style="text-align:right">Δ MoM</th><th>Driver SKU</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="cp-kpis">
      <div class="cp-kpi"><div class="l">3-month total</div><div class="v">${f.months.reduce((a,b)=>a+b.base,0).toLocaleString()}</div><div class="d">base case</div></div>
      <div class="cp-kpi"><div class="l">Upside case</div><div class="v">${f.months.reduce((a,b)=>a+b.high,0).toLocaleString()}</div><div class="d"><span class="up">+5.2%</span> vs base</div></div>
      <div class="cp-kpi"><div class="l">Top SKU</div><div class="v">EVO+ TICL</div><div class="d">61% of Δ growth</div></div>
      <div class="cp-kpi"><div class="l">Risk flag</div><div class="v" style="color:#fbbf24">Medium</div><div class="d">Customs window (June)</div></div>
    </div>
    <h4 style="margin-top:14px">Drivers</h4>
    <ul style="margin:6px 0 0;padding-left:18px;color:var(--text-2);font-size:12.5px">${drivers}</ul>
    <p style="margin-top:10px"><b>⚠ Risk watch.</b> ${f.risk}</p>
    <div class="cp-cta">
      <button onclick="cpAsk('How many lenses did Argentina clinics order this month?')">← This month's actuals</button>
      <button>Push to S&OP workspace</button>
      <button>Explain the model</button>
    </div>
    <div class="cp-cite">
      Sources: <span class="srcpill">Demand Forecaster v4.2</span>
      <span class="srcpill">POS · 31 AR clinics · 90-day</span>
      <span class="srcpill">EVO Viva launch telemetry</span>
      <span class="srcpill">Social listening (ES-AR)</span>
    </div>`;
}

function cpAnswerDissat(){
  const d = DISSAT;
  const bars = d.topCountries.slice(0,7).map(c=>{
    const pct = (c.rate*100).toFixed(2);
    return `<div class="cp-bar">
      <span class="lbl">${c.flag} ${c.n}</span>
      <span class="trk"><span class="fil" style="width:${Math.min(100, c.rate*500).toFixed(1)}%"></span></span>
      <span class="vv">${c.count} pt · ${pct}%</span>
    </div>`;
  }).join('');
  return `
    <h4>🌍 Where the most dissatisfied patients are <span class="ptag">6-month window</span></h4>
    <p>We track <b>dPROMs</b> — a composite satisfaction score over NEI-VFQ-25, QIRC-32, and a STAAR-specific 8-question dysphotopsia panel. "Dissatisfied" is defined as <b>score &lt; 30</b> on a 0–100 scale (avg for cohort: ${d.avgScoreDissat}; baseline: ${d.avgScoreBaseline}).</p>
    <div class="cp-kpis">
      <div class="cp-kpi"><div class="l">Dissatisfied patients</div><div class="v">${d.total}</div><div class="d">${(d.pct*100).toFixed(2)}% of 177,980 surgeries</div></div>
      <div class="cp-kpi"><div class="l">Most concentrated in</div><div class="v">🇨🇳 China</div><div class="d">38 patients · 0.18% rate</div></div>
      <div class="cp-kpi"><div class="l">#1 complaint</div><div class="v">Night halos</div><div class="d">72% of cases</div></div>
      <div class="cp-kpi"><div class="l">Avg score</div><div class="v">${d.avgScoreDissat}</div><div class="d">vs baseline ${d.avgScoreBaseline}</div></div>
    </div>
    <h4 style="margin-top:12px">Top countries by dissatisfaction rate</h4>
    ${bars}
    <h4 style="margin-top:14px">Most-cited complaints</h4>
    <table>
      <thead><tr><th>Complaint</th><th style="text-align:right">% of dissatisfied cohort</th></tr></thead>
      <tbody>${d.topComplaints.map(x=>`<tr><td><b>${x.c}</b></td><td style="text-align:right"><b>${x.pct}%</b></td></tr>`).join('')}</tbody>
    </table>
    <div class="cp-cta">
      <button onclick="cpAsk('Which countries, clinics and surgeons operated the most dissatisfied patients?')">Drill: clinics &amp; surgeons →</button>
      <button onclick="cpAsk('What characteristics did the most dissatisfied patients have in common?')">Drill: common characteristics →</button>
      <button onclick="showView('pulse')">Open Operations Pulse →</button>
    </div>
    <div class="cp-cite">
      Sources: <span class="srcpill">REVAI Vault · PROMs</span>
      <span class="srcpill">NEI-VFQ-25 · 142 cases</span>
      <span class="srcpill">Surgeon telemetry</span>
      <span class="srcpill">6-month window · through April 2026</span>
    </div>`;
}

function cpAnswerWhereDissat(){
  const d = DISSAT;
  const countryRows = d.topCountries.map(c=>`<tr>
    <td><b>${c.flag} ${c.n}</b><div class="cp-dim">${c.ctx}</div></td>
    <td style="text-align:right"><b>${c.count}</b></td>
    <td style="text-align:right">${(c.rate*100).toFixed(2)}%</td>
  </tr>`).join('');
  const clinicRows = d.topClinics.map(c=>`<tr>
    <td><b>${c.c}</b></td>
    <td>${c.flag} ${c.iso}</td>
    <td style="text-align:right"><b>${c.count}</b></td>
    <td style="text-align:right">${(c.rate*100).toFixed(2)}%</td>
  </tr>`).join('');
  const surgeonRows = d.topSurgeons.map(s=>`<tr>
    <td><b>${s.s}</b><div class="cp-dim">${s.note}</div></td>
    <td>${s.clinic}</td>
    <td style="text-align:right"><b>${s.count}</b></td>
  </tr>`).join('');
  return `
    <h4>📍 Where the dissatisfied patients were operated <span class="ptag">countries · clinics · surgeons</span></h4>
    <p>Cross-referenced from <b>142 dissatisfied patients</b> (dPROMs &lt; 30) against surgical telemetry, clinic registries, and individual surgeon attribution.</p>
    <h4 style="margin-top:14px">🌐 By country</h4>
    <table>
      <thead><tr><th>Country</th><th style="text-align:right">Patients</th><th style="text-align:right">Rate</th></tr></thead>
      <tbody>${countryRows}</tbody>
    </table>
    <h4 style="margin-top:16px">🏥 By clinic (top 7)</h4>
    <table>
      <thead><tr><th>Clinic</th><th>Country</th><th style="text-align:right">Patients</th><th style="text-align:right">Rate</th></tr></thead>
      <tbody>${clinicRows}</tbody>
    </table>
    <h4 style="margin-top:16px">👤 By surgeon (top 5)</h4>
    <table>
      <thead><tr><th>Surgeon</th><th>Primary clinic</th><th style="text-align:right">Cases</th></tr></thead>
      <tbody>${surgeonRows}</tbody>
    </table>
    <p style="margin-top:10px"><b>Pattern:</b> 51% of cases cluster into 7 clinics (5% of the network), and 26/142 cases (18%) are attributable to 5 high-volume surgeons — suggesting targeted case-selection &amp; pre-op protocol interventions will move the number significantly.</p>
    <div class="cp-cta">
      <button onclick="cpAsk('What characteristics did the most dissatisfied patients have in common?')">Drill: common patient characteristics →</button>
      <button>Schedule clinical-advisory review</button>
      <button>Generate targeted outreach plan</button>
    </div>
    <div class="cp-cite">
      Sources: <span class="srcpill">REVAI Vault PROMs</span>
      <span class="srcpill">Surgeon telemetry</span>
      <span class="srcpill">ICL Universe clinic registry</span>
      <span class="srcpill">Privacy: anonymized · no PHI leaves clinic</span>
    </div>`;
}

function cpAnswerTraits(){
  const d = DISSAT;
  const rows = d.commonTraits.map(t=>{
    const lift = t.pct / t.baseline;
    return `<tr>
      <td><b>${t.label}</b></td>
      <td style="text-align:right"><b>${t.pct}%</b></td>
      <td style="text-align:right" class="cp-dim">${t.baseline}%</td>
      <td style="text-align:right;color:#f472b6;font-weight:700">${lift.toFixed(2)}×</td>
    </tr>`;
  }).join('');
  // lift chart
  const maxLift = Math.max(...d.commonTraits.map(t=>t.pct/t.baseline));
  const liftBars = d.commonTraits.map(t=>{
    const lift = t.pct/t.baseline;
    return `<div class="cp-bar">
      <span class="lbl">${t.label}</span>
      <span class="trk"><span class="fil" style="width:${(lift/maxLift*100).toFixed(1)}%;background:linear-gradient(90deg,#f472b6,#7f21e0)"></span></span>
      <span class="vv">${lift.toFixed(2)}×</span>
    </div>`;
  }).join('');
  return `
    <h4>🧬 What the dissatisfied patients had in common <span class="ptag">statistical lift vs baseline</span></h4>
    <p>Across the 142-patient dissatisfied cohort, 7 traits are significantly over-represented (Chi² p&lt;0.01). The strongest signal is <b>large mesopic pupil (≥ 6.5 mm)</b> — <b>3.1× more likely</b> in the dissatisfied cohort than in the general post-op population, and highly correlated with reported night-vision halos.</p>
    <div class="cp-kpis">
      <div class="cp-kpi"><div class="l">Top characteristic</div><div class="v">Pupil ≥ 6.5 mm</div><div class="d"><span style="color:#f472b6;font-weight:700">3.1× lift</span> · 68% of cohort</div></div>
      <div class="cp-kpi"><div class="l">Second driver</div><div class="v">High myopia</div><div class="d"><span style="color:#f472b6;font-weight:700">1.8× lift</span> · −10 to −18 D</div></div>
      <div class="cp-kpi"><div class="l">Age band</div><div class="v">38–47 yrs</div><div class="d">54% of cohort</div></div>
      <div class="cp-kpi"><div class="l">Dry-eye pre-op</div><div class="v">OSDI &gt; 22</div><div class="d"><span style="color:#f472b6;font-weight:700">2.6× lift</span> · often undiagnosed</div></div>
    </div>
    <h4 style="margin-top:14px">Trait prevalence · cohort vs baseline</h4>
    <table>
      <thead><tr><th>Trait</th><th style="text-align:right">Dissat cohort</th><th style="text-align:right">Baseline</th><th style="text-align:right">Lift</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h4 style="margin-top:14px">Statistical lift (cohort / baseline)</h4>
    ${liftBars}
    <p style="margin-top:12px"><b>Implication for case selection &amp; product mix.</b> 4 of 7 traits are addressable at pre-op: (1) measure mesopic pupil with pupillometer, (2) screen for OSDI before refractive correction, (3) prefer <b>EVO Viva</b> (extended depth-of-focus) for patients with pupil ≥ 6.5 mm, (4) correct astigmatism >1D with <b>EVO+ TICL</b> rather than plano EVO+. Modeling suggests this pre-op protocol shift would reduce dissatisfaction rate from 0.08% to 0.03% — a <b>62% reduction</b> — with no loss of surgical volume.</p>
    <div class="cp-cta">
      <button>Draft surgeon education brief</button>
      <button>Update pre-op protocol template</button>
      <button onclick="showView('agents')">Activate Case-Selection agent</button>
    </div>
    <div class="cp-cite">
      Sources: <span class="srcpill">REVAI Vault · PROMs + EMR join</span>
      <span class="srcpill">Chi² / Fisher's exact</span>
      <span class="srcpill">142 cohort · 177,838 baseline</span>
      <span class="srcpill">Period: Nov 2025 – Apr 2026</span>
    </div>`;
}

function cpAnswerFallback(q){
  return `
    <h4>🤔 I can help — here are some starting points</h4>
    <p>I can answer questions about <b>lens orders</b>, <b>demand forecasts</b>, <b>patient satisfaction / PROMs</b>, <b>clinic &amp; surgeon performance</b>, and <b>market / regulatory intelligence</b>. Your question (<span class="cp-dim">"${cpEscape(q)}"</span>) didn't match a canned analytical flow — try one of these:</p>
    <div class="cp-pill-row">
      <span class="cp-pill" onclick="cpAsk('How many lenses did Argentina clinics order this month?')" style="cursor:pointer">🇦🇷 AR orders this month</span>
      <span class="cp-pill" onclick="cpAsk('What is the forecast of lens orders for the next 3 months?')" style="cursor:pointer">📈 3-month lens forecast</span>
      <span class="cp-pill" onclick="cpAsk('Where are the most dissatisfied patients?')" style="cursor:pointer">😟 Where are dissatisfied patients?</span>
      <span class="cp-pill" onclick="cpAsk('In which countries, clinics and surgeons were the most dissatisfied patients operated?')" style="cursor:pointer">📍 Dissat: where operated</span>
      <span class="cp-pill" onclick="cpAsk('What characteristics did the most dissatisfied patients have in common?')" style="cursor:pointer">🧬 Dissat: common traits</span>
    </div>`;
}

function cpAsk(qText){
  const inp = document.getElementById('cp-input');
  if(inp) inp.value = '';
  const stream = document.getElementById('cp-stream');
  if(!stream) return;
  // user bubble
  const userMsg = document.createElement('div');
  userMsg.className = 'cp-msg user';
  userMsg.innerHTML = `<div class="cp-bubble" style="background:linear-gradient(135deg,#2472d3,#1e4a8a);color:#fff;border-color:rgba(36,114,211,0.4);border-radius:14px 14px 2px 14px;max-width:70%">${cpEscape(qText)}</div>`;
  stream.appendChild(userMsg);
  // typing
  const typing = document.createElement('div');
  typing.className = 'cp-msg assist';
  typing.innerHTML = `<div class="cp-av"><svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 015 5v2h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1V7a5 5 0 015-5z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/></svg></div><div class="cp-bubble"><span class="cp-typing"><span></span><span></span><span></span></span></div>`;
  stream.appendChild(typing);
  stream.scrollTop = stream.scrollHeight;
  window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'});
  // resolve answer after short delay for UX
  setTimeout(()=>{
    const intent = cpMatchIntent(qText);
    const html = cpAnswer(intent, qText);
    typing.querySelector('.cp-bubble').innerHTML = html;
    window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'});
    CP_STATE.history.push({q:qText, intent});
  }, 520);
}

function cpSubmit(e){
  if(e) e.preventDefault();
  const inp = document.getElementById('cp-input');
  if(!inp) return;
  const q = inp.value.trim();
  if(!q) return;
  cpAsk(q);
}

VIEWS.copilot = () => `
  <div class="cp-wrap">
    <div class="cp-hero">
      <div class="cp-hero-logo">
        <svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 015 5v2h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1V7a5 5 0 015-5z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/></svg>
      </div>
      <div>
        <h1>Ask <span class="cp-gradtext">STAAR Intelligence</span></h1>
        <p>Natural-language query across 177,980 surgeries, 203 clinics, 35 countries, surgeon telemetry, PROMs (dissatisfaction tracking), and real-time social/regulatory signals. All answers cited to source.</p>
      </div>
      <div class="cp-hero-staar">
        <img src="${STAAR_LOGO}" alt="STAAR Surgical"/>
        <span>Intelligence Partner</span>
      </div>
    </div>

    <form class="cp-input-wrap" onsubmit="return cpSubmit(event)">
      <div class="cp-input-row">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
        <input id="cp-input" class="cp-input" placeholder="Ask anything — e.g., How many lenses did Argentina clinics order this month?" autocomplete="off" autofocus/>
        <button type="submit" class="cp-send">Ask<svg viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>
      </div>
      <div class="cp-sugs">
        <span class="cp-sug" onclick="cpAsk('How many lenses did Argentina clinics order this month?')">🇦🇷 AR orders this month</span>
        <span class="cp-sug" onclick="cpAsk('What is the forecast of lens orders for the next 3 months?')">📈 3-month lens forecast</span>
        <span class="cp-sug" onclick="cpAsk('Where are the most dissatisfied patients?')">😟 Most dissatisfied patients — where?</span>
        <span class="cp-sug" onclick="cpAsk('In which countries, clinics and surgeons were the most dissatisfied patients operated?')">📍 Dissat: countries · clinics · surgeons</span>
        <span class="cp-sug" onclick="cpAsk('What characteristics did the most dissatisfied patients have in common?')">🧬 Dissat: common characteristics</span>
      </div>
    </form>

    <div class="cp-stream" id="cp-stream">
      <div class="cp-msg assist">
        <div class="cp-av"><svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 015 5v2h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1V7a5 5 0 015-5z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/></svg></div>
        <div class="cp-bubble">
          <h4>👋 Hi Diego — ready when you are <span class="ptag">Copilot v1.2 · online</span></h4>
          <p>I'm connected to the STAAR Intelligence graph: <b>177,980 surgeries</b>, <b>203 clinics</b> in <b>35 countries</b>, <b>12,000+ surgeons</b>, <b>PROMs via REVAI Vault</b>, <b>STAAR MES &amp; MDR</b>, and real-time signals from customs, social, and regulatory gazettes. Tap a suggestion above or ask anything in natural language — Spanish or English.</p>
          <p class="cp-dim">I always cite sources. I never expose PHI. All clinical reasoning is advisory — final clinical decisions stay with the surgeon.</p>
        </div>
      </div>
    </div>
  </div>`;
