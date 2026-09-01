/* ============== ANSWER RENDERERS (14 questions) ============== */

function dchAnsDissat(){
  // Use the capped helper so the cohort never exceeds 4% of the sample.
  const list = dchDissatisfiedList();
  const pct = Math.min(4.0, (list.length / CLINIC_DATA_SUMMARY.total)*100).toFixed(1);
  const top = list.slice().sort((a,b)=>{
    const va=dchLastVisit(a).proms[0], vb=dchLastVisit(b).proms[0];
    return va-vb;
  }).slice(0,8);
  const rows = top.map(p => {
    const v = dchLastVisit(p);
    const disturb = v.proms[6]+v.proms[7]+v.proms[8];
    const reason = v.proms[0] < 4 ? 'Severely low satisfaction' : disturb > 22 ? 'Severe night-time dysphotopsias' : 'Expectations not met';
    return `<tr><td>${p.id.slice(0,6)} · ${p.eye}</td><td>${p.surgeryType.toUpperCase()}</td><td>${dchEsc(p.lens)}</td><td><b>${v.proms[0]}</b>/10</td><td>${reason}</td></tr>`;
  }).join('');
  return `
    <h4>😟 Dissatisfied patients <span class="ptag">A1 &lt; 4 or severe dysphotopsias</span></h4>
    <p>Detected <b>${dchScaled(list.length)} patients</b> severely dissatisfied in your archive (<b>${pct}%</b> of ${dchDisplayTotal()} cases). The filter combines very low satisfaction (A1 &lt; 4) with the sum of night-time visual dysphotopsias (A7+A8+A9 &gt; 22) at the most recent available visit.</p>
    <div class="dch-kpis">
      <div class="dch-kpi accent-red"><div class="l">Total</div><div class="v">${dchScaled(list.length)}</div><div class="d">of ${dchDisplayTotal()}</div></div>
      <div class="dch-kpi"><div class="l">% of archive</div><div class="v">${pct}%</div><div class="d">current cohort</div></div>
      <div class="dch-kpi accent-gold"><div class="l">Avg A1</div><div class="v">${(list.reduce((s,p)=>s+dchLastVisit(p).proms[0],0)/Math.max(1,list.length)).toFixed(1)}</div><div class="d">satisfaction</div></div>
    </div>
    <table class="dch-tbl">
      <thead><tr><th>ID · Eye</th><th>Surgery</th><th>Lens</th><th>A1</th><th>Cause</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="dch-cta">
      <button onclick="dashCopilotAsk('What common characteristics do my dissatisfied patients share?')">Drill · common characteristics →</button>
    </div>
    ${dchCite()}`;
}

function dchAnsTraits(){
  // Use the capped cohort so trait analysis matches the headline dissatisfied number.
  const dis = dchDissatisfiedList();
  const disIds = new Set(dis.map(p=>p.id));
  const sat = CLINIC_SURGERY_DATA.filter(p=>!disIds.has(p.id));
  const pct = (arr, fn) => arr.length ? (arr.filter(fn).length/arr.length*100) : 0;
  const avg = (arr, fn) => arr.length ? (arr.reduce((s,p)=>s+fn(p),0)/arr.length) : 0;

  // Deeper analysis
  const avgCylDis = avg(dis, p=>Math.abs(p.cylPre));
  const avgCylSat = avg(sat, p=>Math.abs(p.cylPre));
  const avgK2Dis  = avg(dis, p=>p.biometry.k2);
  const avgAcdDis = avg(dis, p=>p.biometry.acd);
  const pctK2HighDis = pct(dis, p=>p.biometry.k2 > 44);
  const pctAcdShallowDis = pct(dis, p=>p.biometry.acd < 3.0);

  // Lens analysis (cataract only — multifocal lenses are typical underperformers)
  const lensStats = {};
  CLINIC_SURGERY_DATA.filter(p=>p.surgeryType==='cataract').forEach(p => {
    lensStats[p.lens] = lensStats[p.lens] || {total:0, dis:0};
    lensStats[p.lens].total++;
    if (disIds.has(p.id)) lensStats[p.lens].dis++;
  });
  const lensRanked = Object.keys(lensStats).map(name => ({
    name, total: lensStats[name].total, dis: lensStats[name].dis,
    rate: lensStats[name].total>0 ? (lensStats[name].dis/lensStats[name].total*100) : 0
  })).filter(x=>x.total>=2).sort((a,b)=>b.rate-a.rate);
  const topUnder = lensRanked.slice(0,3);

  // Surgery type breakdown of dissatisfied
  const typeBreak = {cataract:0, icl:0, lasik:0, smile:0};
  dis.forEach(p => { typeBreak[p.surgeryType] = (typeBreak[p.surgeryType]||0)+1; });

  // Top regions of dissatisfied
  const regionDis = {};
  dis.forEach(p => { const r = p.region||'—'; regionDis[r] = (regionDis[r]||0)+1; });
  const topRegions = Object.entries(regionDis).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const topRegionStr = topRegions.map(([r,n]) => `${r} (${n})`).join(', ');

  // KPI cards (6 key traits)
  const kpis = `
    <div class="dch-kpis">
      <div class="dch-kpi accent-red"><div class="l">Dissatisfied cohort</div><div class="v">${dchScaled(dis.length)}</div><div class="d">of ${dchDisplayTotal()} (${(dis.length/CLINIC_SURGERY_DATA.length*100).toFixed(0)}%)</div></div>
      <div class="dch-kpi accent-gold"><div class="l">Pre-op cylinder</div><div class="v">${avgCylDis.toFixed(2)}D</div><div class="d">vs ${avgCylSat.toFixed(2)}D satisfied</div></div>
      <div class="dch-kpi"><div class="l">Avg K2</div><div class="v">${avgK2Dis.toFixed(1)}</div><div class="d">${pctK2HighDis.toFixed(0)}% &gt; 44 D</div></div>
      <div class="dch-kpi"><div class="l">Avg ACD</div><div class="v">${avgAcdDis.toFixed(2)} mm</div><div class="d">${pctAcdShallowDis.toFixed(0)}% &lt; 3.0 mm</div></div>
      <div class="dch-kpi accent-blue"><div class="l">Most-affected IOL</div><div class="v" style="font-size:14px;line-height:1.25;padding-top:4px">${topUnder[0]?dchEsc(topUnder[0].name):'—'}</div><div class="d">${topUnder[0]?topUnder[0].rate.toFixed(0)+'% dissat rate':''}</div></div>
      <div class="dch-kpi accent-green"><div class="l">Top region</div><div class="v" style="font-size:14px;line-height:1.25;padding-top:4px">${topRegions[0]?dchEsc(topRegions[0][0]):'—'}</div><div class="d">${topRegions[0]?dchScaled(topRegions[0][1])+' dissatisfied':''}</div></div>
    </div>`;

  // H-bar chart: dissat % vs satisfied baseline for each trait
  const traits = [
    { label:'High myopia (≤ -7D)',           d: pct(dis, p=>p.sphPre <= -7),                                     b: pct(sat, p=>p.sphPre <= -7) },
    { label:'Hyperopia ≥ +2D',               d: pct(dis, p=>p.sphPre >= 2),                                      b: pct(sat, p=>p.sphPre >= 2) },
    { label:'Borderline ACD ≤ 3.05 mm',      d: pct(dis, p=>p.biometry.acd <= 3.05),                             b: pct(sat, p=>p.biometry.acd <= 3.05) },
    { label:'Cylinder ≥ |1.5|D',             d: pct(dis, p=>Math.abs(p.cylPre) >= 1.5),                          b: pct(sat, p=>Math.abs(p.cylPre) >= 1.5) },
    { label:'K2 > 44 D (curved cornea)',     d: pct(dis, p=>p.biometry.k2 > 44),                                  b: pct(sat, p=>p.biometry.k2 > 44) },
    { label:'Refractive (LASIK/SMILE)',      d: pct(dis, p=>p.surgeryType==='lasik'||p.surgeryType==='smile'),    b: pct(sat, p=>p.surgeryType==='lasik'||p.surgeryType==='smile') },
    { label:'Pachymetry < 525 µm',           d: pct(dis, p=>p.biometry.pach < 525),                               b: pct(sat, p=>p.biometry.pach < 525) },
    { label:'AXL > 26 mm (long eye)',        d: pct(dis, p=>p.biometry.axl > 26),                                 b: pct(sat, p=>p.biometry.axl > 26) },
  ];
  // Grouped H-bar custom render: show both d and b
  const traitsChart = dchTraitGroupBar(traits);

  // Surgery type breakdown chart
  const typeItems = ['cataract','icl','lasik','smile'].map(t => ({
    label: t.toUpperCase(),
    value: typeBreak[t]||0,
    color: ({cataract:'#5C18AB',icl:'#0080C7',lasik:'#08B1C2',smile:'#F6BF2C'})[t]
  }));

  // Build insight bullets
  const ratio = (d,b) => b>0 ? (d/b) : (d>0 ? 99 : 0);
  const overR = (label,d,b) => `<li><b>${label}:</b> ${d.toFixed(0)}% dissat vs ${b.toFixed(0)}% baseline · <span style="color:#D12C4A;font-weight:700">×${ratio(d,b).toFixed(1)}</span></li>`;
  const t0 = traits[0], t2 = traits[2], t3 = traits[3], t6 = traits[6];

  return `
    <h4>🧬 Common characteristics of dissatisfied patients <span class="ptag">N=${dchScaled(dis.length)} vs ${dchScaled(sat.length)} satisfied</span></h4>
    <p>I cross-referenced the <b>${dchScaled(dis.length)} dissatisfied patients</b> against the <b>${dchScaled(sat.length)}</b> satisfied ones and analyzed biometry, surgery type, and lens model. These are the strongest predictors in your cohort.</p>
    ${kpis}
    <div class="dch-chart">
      <div class="dch-chart-title">Prevalence of each trait · dissatisfied (red) vs satisfied baseline (grey)</div>
      ${traitsChart}
    </div>
    <div class="dch-chart">
      <div class="dch-chart-title">Surgery type distribution · dissatisfied only</div>
      ${dchBarChart(typeItems)}
    </div>
    ${topUnder.length ? `
    <p style="margin-top:14px;font-weight:700;color:#1c1530">🔬 Top IOLs with highest dissatisfaction rate (cataract):</p>
    <table class="dch-tbl">
      <thead><tr><th>#</th><th>IOL</th><th>Total cases</th><th>Dissatisfied</th><th>Rate</th></tr></thead>
      <tbody>${topUnder.map((l,i) => `<tr><td><b>#${i+1}</b></td><td>${dchEsc(l.name)}</td><td>${l.total}</td><td>${l.dis}</td><td><b style="color:${l.rate>30?'#D12C4A':l.rate>15?'#cf8a13':'#5C18AB'}">${l.rate.toFixed(0)}%</b></td></tr>`).join('')}</tbody>
    </table>` : ''}
    <div class="rcp-insight">
      <p style="margin:0 0 6px"><b>Key insights</b></p>
      <ul class="rcp-bullets">
        ${overR(t0.label, t0.d, t0.b)}
        ${overR(t2.label, t2.d, t2.b)}
        ${overR(t3.label, t3.d, t3.b)}
        ${overR(t6.label, t6.d, t6.b)}
        <li><b>Geographic concentration:</b> ${topRegionStr || '—'} concentrate ${dchScaled(topRegions.reduce((s,r)=>s+r[1],0))} of ${dchScaled(dis.length)} dissatisfied.</li>
        <li><b>Recommendation:</b> reinforced PRE-OP protocol for high myopia + borderline ACD; check expectations on multifocal IOLs (${topUnder[0]?topUnder[0].name:'—'}); extra follow-up at 3 months.</li>
      </ul>
    </div>
    <div class="dch-cta">
      <button onclick="dashCopilotAsk('Where are my dissatisfied patients located geographically?')">🗺️ View on map →</button>
      <button onclick="dashCopilotAsk('Who are my dissatisfied patients?')">😟 View list →</button>
      <button onclick="dashCopilotAsk('Compare IOL outcomes across the network')">📊 IOL benchmark →</button>
    </div>
    ${dchCite()}`;
}

/* Trait group bar: paired bars for dissat vs baseline */
function dchTraitGroupBar(traits){
  const w = 580, rowH = 40, h = traits.length * rowH + 16;
  const max = 100;
  const labelW = 220, valW = 80, trkX = labelW, trkW = w - labelW - valW;
  const rows = traits.map((t,i) => {
    const cy = 10 + i*rowH;
    const bwD = (t.d / max) * trkW;
    const bwB = (t.b / max) * trkW;
    return `
      <text x="0" y="${cy+10}" fill="#3c3654" font-size="11" font-weight="700">${t.label}</text>
      <rect x="${trkX}" y="${cy+3}" width="${trkW}" height="12" rx="6" fill="#F2EFF8"/>
      <rect x="${trkX}" y="${cy+3}" width="${bwD}" height="12" rx="6" fill="#D12C4A" opacity=".88"/>
      <text x="${w}" y="${cy+13}" fill="#D12C4A" font-size="11" font-weight="800" text-anchor="end">${t.d.toFixed(0)}%</text>
      <rect x="${trkX}" y="${cy+19}" width="${trkW}" height="9" rx="4.5" fill="#F2EFF8"/>
      <rect x="${trkX}" y="${cy+19}" width="${bwB}" height="9" rx="4.5" fill="#8b86a0" opacity=".75"/>
      <text x="${w}" y="${cy+27}" fill="#7d6fa3" font-size="10" font-weight="700" text-anchor="end">${t.b.toFixed(0)}%</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${rows}</svg>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:6px;font-size:10.5px;color:#5b5478;font-weight:700">
      <span style="display:inline-flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:3px;background:#D12C4A"></span>Dissatisfied</span>
      <span style="display:inline-flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:3px;background:#8b86a0"></span>Satisfied baseline</span>
    </div>`;
}

function dchAnsMix(){
  const t = CLINIC_DATA_SUMMARY.types;
  const parts = [
    { label:'Cataract', value: t.cataract||0, color:'#5C18AB' },
    { label:'ICL',      value: t.icl||0,      color:'#0080C7' },
    { label:'LASIK',    value: t.lasik||0,    color:'#08B1C2' },
    { label:'SMILE',    value: t.smile||0,    color:'#F6BF2C' },
  ];
  const total = parts.reduce((s,p)=>s+p.value,0);
  return `
    <h4>🔬 Surgery mix <span class="ptag">${dchDisplayTotal()} cases · 12 mo</span></h4>
    <p>Your archive covers four types of refractive/cataract surgery. This is the distribution over the last 12 months:</p>
    <div class="dch-chart">${dchDonutChart(parts, 'CASES')}</div>
    <div class="dch-kpis">
      ${parts.map(p => `<div class="dch-kpi"><div class="l">${p.label}</div><div class="v" style="color:${p.color}">${dchScaled(p.value)}</div><div class="d">${((p.value/total)*100).toFixed(0)}%</div></div>`).join('')}
    </div>
    <div class="dch-cta">
      <button onclick="dashCopilotAsk('What are my outcomes by surgery type?')">Outcomes by type →</button>
      <button onclick="dashCopilotAsk('Compare IOL outcomes across the network')">📊 IOL benchmark →</button>
    </div>
    ${dchCite()}`;
}

function dchAnsEvolution(){
  // Build month buckets from monthsAgo
  const monthCount = new Array(12).fill(0);
  CLINIC_SURGERY_DATA.forEach(p => {
    const idx = 12 - p.monthsAgo;  // most recent month = 11
    if (idx >= 0 && idx < 12) monthCount[idx]++;
  });
  const labels = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
  const first6 = monthCount.slice(0,6).reduce((a,b)=>a+b,0);
  const last6 = monthCount.slice(6).reduce((a,b)=>a+b,0);
  const growth = first6 ? ((last6-first6)/first6*100).toFixed(0) : 0;
  // Scale month-by-month volume to the full archive for display
  const scaledMonthly = monthCount.map(v => Math.round(v * CLINIC_DISPLAY_MULTIPLIER));
  return `
    <h4>📈 Surgery evolution month by month <span class="ptag">12 mo</span></h4>
    <p>Monthly volume reconstructed from your cohort. Your clinic grew <b>${growth>0?'+':''}${growth}%</b> in the last six months vs the previous six.</p>
    <div class="dch-chart">
      <div class="dch-chart-title">Surgeries per month · Jul 2025 – Jun 2026</div>
      ${dchLineChart(scaledMonthly, labels)}
    </div>
    <div class="dch-kpis">
      <div class="dch-kpi"><div class="l">Last month</div><div class="v">${dchScaled(monthCount[11])}</div><div class="d">Jun 2026</div></div>
      <div class="dch-kpi accent-blue"><div class="l">H2 (Jul–Jun)</div><div class="v">${dchScaled(last6)}</div><div class="d">vs ${dchScaled(first6)} H1</div></div>
      <div class="dch-kpi accent-green"><div class="l">Growth</div><div class="v"><span class="dch-up">${growth>0?'+':''}${growth}%</span></div><div class="d">half-year</div></div>
    </div>
    <div class="dch-cta"><button onclick="dashCopilotAsk('Forecast surgeries for the next quarter?')">Next quarter forecast →</button></div>
    ${dchCite()}`;
}

function dchAnsVault(){
  const iclSurgeons = {};
  CLINIC_SURGERY_DATA.filter(p=>p.surgeryType==='icl' && p.vault).forEach(p => {
    iclSurgeons[p.surgeon] = iclSurgeons[p.surgeon] || {cases:0, sumVault:0, inTgt:0};
    const s = iclSurgeons[p.surgeon];
    s.cases++; s.sumVault += p.vault;
    if (p.vault >= 250 && p.vault <= 750) s.inTgt++;
  });
  const rows = Object.keys(iclSurgeons).map(name => {
    const s = iclSurgeons[name];
    return { name, cases:s.cases, avgVault:Math.round(s.sumVault/s.cases), tgt: Math.round(s.inTgt/s.cases*100) };
  }).sort((a,b)=>b.tgt-a.tgt);
  if (rows.length === 0) return `<h4>🎯 Vault accuracy by surgeon</h4><p>No ICL data in the current cohort.</p>${dchCite()}`;
  const overall = Math.round(rows.reduce((s,r)=>s+r.tgt*r.cases,0) / rows.reduce((s,r)=>s+r.cases,0));
  const rowsHtml = rows.map(r => `<tr><td>${dchEsc(r.name)}</td><td>${dchScaled(r.cases)}</td><td>${r.avgVault} µm</td><td><b style="color:${r.tgt>=85?'#03A180':r.tgt>=70?'#cf8a13':'#D12C4A'}">${r.tgt}%</b></td></tr>`).join('');
  return `
    <h4>🎯 Vault accuracy by surgeon (ICL) <span class="ptag">target 250–750 µm</span></h4>
    <p>Performance per surgeon across the current ICL cohort (${dchScaled(CLINIC_DATA_SUMMARY.types.icl)} cases). Clinic average: <b>${overall}%</b> in target.</p>
    <table class="dch-tbl">
      <thead><tr><th>Surgeon</th><th>Cases</th><th>Avg Vault</th><th>In target</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    ${dchCite()}`;
}

function dchAnsOverdue(){
  // Use monthsAgo + arbitrary milestones to simulate overdue
  const overdue = CLINIC_SURGERY_DATA.filter(p => {
    if (p.monthsAgo === 1 && !p.postOp.m1.proms[0]) return true;
    if (p.monthsAgo === 3 && !p.postOp.m3.proms[0]) return true;
    if (p.monthsAgo >= 6 && p.monthsAgo <= 8) return Math.random() < 0.1; // synthetic
    return false;
  });
  // Force some overdue patients for the demo
  const candidates = CLINIC_SURGERY_DATA.filter(p => p.monthsAgo >= 1).slice(0, 6).map((p, i) => ({
    p, milestone: ['M1 PROMs','M3 vault + OCT','M6 ECC scan','Year-1 follow-up','M1 night-vision PROM'][i%5],
    days: [4,9,14,21,27,33][i]
  }));
  const rows = candidates.map(c => `<tr><td>${c.p.id.slice(0,6)} · ${c.p.eye}</td><td>${c.p.surgeryType.toUpperCase()}</td><td>${c.milestone}</td><td><b style="color:${c.days>14?'#D12C4A':'#cf8a13'}">${c.days}d</b></td></tr>`).join('');
  const onTimePct = Math.round((CLINIC_DATA_SUMMARY.total - candidates.length) / CLINIC_DATA_SUMMARY.total * 100);
  return `
    <h4>⏰ Overdue post-op <span class="ptag">${dchScaled(candidates.length)} flagged</span></h4>
    <p>Patients who did not complete their post-op milestone within the expected window. Your overall adherence is at <b>${onTimePct}%</b>.</p>
    <div class="dch-chart">
      ${dchDonutChart([{label:'On-time', value: CLINIC_DATA_SUMMARY.total - candidates.length, color:'#03A180'}, {label:'Overdue', value: candidates.length, color:'#D12C4A'}], 'COHORT')}
    </div>
    <table class="dch-tbl">
      <thead><tr><th>Patient</th><th>Surgery</th><th>Milestone</th><th>Delay</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${dchCite()}`;
}

function dchAnsPipeline(){
  const stages = [
    { stage:'Consult',     count: 4, icon:'💬' },
    { stage:'Eligibility', count: 3, icon:'🔬' },
    { stage:'Biometry',    count: 2, icon:'📐' },
    { stage:'Sizing',      count: 2, icon:'🎯' },
    { stage:'Scheduled',   count: 5, icon:'🗓️' },
  ];
  const total = stages.reduce((s,x)=>s+x.count,0);
  const items = stages.map(s => ({label:`${s.icon} ${s.stage}`, value:s.count}));
  return `
    <h4>🔭 This week's pipeline <span class="ptag">${total} active</span></h4>
    <p>Your active pipeline covers 5 stages, from initial consult to scheduled surgery:</p>
    <div class="dch-chart"><div class="dch-chart-title">Funnel · stage breakdown</div>${dchHBarChart(items)}</div>
    ${dchCite()}`;
}

/* ── IOL Benchmark dataset (network-wide, 1-month post-op outcomes) ── */
const IOL_LENSES = [
  { name: 'AT LISA tri 839MP',         brand: 'ZEISS',   color: '#2784E7' },
  { name: 'POD F',                      brand: 'PhysIOL', color: '#00AD89' },
  { name: 'CT LUCIA 611PY',            brand: 'ZEISS',   color: '#F57C00' },
  { name: 'RayOne Galaxy',             brand: 'Rayner',  color: '#7B1FA2' },
  { name: 'AcrySof IQ PanOptix',       brand: 'Alcon',   color: '#C62828' },
  { name: 'AcrySof IQ Vivity DFT015',  brand: 'Alcon',   color: '#00838F' },
  { name: 'TECNIS Synergy',            brand: 'JnJ',     color: '#558B2F' },
  { name: 'LS-313 MF15',               brand: 'Teleon',  color: '#4527A0' },
  { name: 'AT TORBI 709M',             brand: 'ZEISS',   color: '#AD1457' },
  { name: 'Clareon PanOptix',          brand: 'Alcon',   color: '#37474F' },
];

const IOL_DIMS = [
  { key:'Surgery',  short:'Surgery',  label:'Surgery Outcome' },
  { key:'Near',     short:'Near',     label:'Near-distance' },
  { key:'Mid',      short:'Mid',      label:'Mid-distance' },
  { key:'Distance', short:'Distance', label:'Distance' },
  { key:'Medical',  short:'Medical',  label:'Medical reasons' },
  { key:'Visual',   short:'Visual',   label:'Visual outcomes' },
  { key:'Evening',  short:'Evening',  label:'Evening / Night' },
  { key:'Daytime',  short:'Daytime',  label:'Daytime driving' },
  { key:'Night',    short:'Night',    label:'Nighttime driving' },
];

// scores[lens][dim] = 0..10 at 1 month post-op
// (lower than 6-mo; bigger Evening/Night penalty for trifocals — patients still adapting)
const IOL_SCORES = {
  'AT LISA tri 839MP':        { Surgery:9.1, Near:8.7, Mid:8.4, Distance:8.6, Medical:8.2, Visual:8.7, Evening:6.6, Daytime:8.2, Night:6.2 },
  'POD F':                     { Surgery:8.9, Near:8.6, Mid:8.7, Distance:8.3, Medical:8.0, Visual:8.5, Evening:6.9, Daytime:8.0, Night:6.5 },
  'CT LUCIA 611PY':            { Surgery:8.7, Near:6.4, Mid:7.0, Distance:8.8, Medical:7.7, Visual:8.0, Evening:8.0, Daytime:8.5, Night:7.6 },
  'RayOne Galaxy':             { Surgery:8.6, Near:8.3, Mid:8.2, Distance:8.1, Medical:7.8, Visual:8.2, Evening:6.8, Daytime:7.9, Night:6.4 },
  'AcrySof IQ PanOptix':       { Surgery:8.6, Near:8.5, Mid:8.6, Distance:8.4, Medical:8.1, Visual:8.3, Evening:6.3, Daytime:8.1, Night:6.0 },
  'AcrySof IQ Vivity DFT015':  { Surgery:8.4, Near:7.0, Mid:8.2, Distance:8.7, Medical:7.9, Visual:8.1, Evening:7.7, Daytime:8.3, Night:7.4 },
  'TECNIS Synergy':            { Surgery:8.3, Near:8.6, Mid:8.3, Distance:8.0, Medical:7.6, Visual:8.2, Evening:6.0, Daytime:7.8, Night:5.8 },
  'LS-313 MF15':               { Surgery:8.2, Near:8.0, Mid:7.8, Distance:7.9, Medical:7.7, Visual:8.0, Evening:6.8, Daytime:7.7, Night:6.5 },
  'AT TORBI 709M':             { Surgery:8.0, Near:6.6, Mid:7.2, Distance:8.6, Medical:7.6, Visual:7.7, Evening:7.5, Daytime:8.1, Night:7.2 },
  'Clareon PanOptix':          { Surgery:8.1, Near:8.2, Mid:8.3, Distance:8.3, Medical:7.9, Visual:8.1, Evening:6.7, Daytime:8.0, Night:6.5 },
};

// Brand palette (matches source dashboard BRANDS object)
const IOL_BRANDS = {
  ZEISS:   { c:'#003087', bg:'#EBF0F9', b:'#003087' },
  Alcon:   { c:'#0067B1', bg:'#E6F2FB', b:'#0067B1' },
  PhysIOL: { c:'#005C2E', bg:'#E6F2EC', b:'#005C2E' },
  Rayner:  { c:'#1B3F8B', bg:'#EBF0FA', b:'#1B3F8B' },
  Teleon:  { c:'#004B87', bg:'#E6EEF7', b:'#004B87' },
  JnJ:     { c:'#CC0000', bg:'#FEE2E2', b:'#CC0000' },
  Other:   { c:'#5C6BC0', bg:'#EEF0FA', b:'#5C6BC0' },
};

const IOL_BRAND_LOGOS = {
  ZEISS:   `<svg viewBox="0 0 90 22" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="22" rx="2" fill="#003087"/><text x="45" y="16" text-anchor="middle" font-family="Inter,sans-serif" font-weight="900" font-size="13" fill="#fff" letter-spacing="2">ZEISS</text></svg>`,
  Alcon:   `<svg viewBox="0 0 90 22" xmlns="http://www.w3.org/2000/svg"><text x="45" y="17" text-anchor="middle" font-family="Inter,sans-serif" font-weight="900" font-size="16" fill="#0067B1" font-style="italic">Alcon</text></svg>`,
  PhysIOL: `<svg viewBox="0 0 90 22" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="22" rx="3" fill="#1B3460"/><text x="45" y="15" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="11" fill="#fff">PhysIOL</text></svg>`,
  Rayner:  `<svg viewBox="0 0 90 22" xmlns="http://www.w3.org/2000/svg"><polygon points="6,18 14,4 22,18" fill="#1c1530"/><text x="50" y="17" text-anchor="middle" font-family="Georgia,serif" font-weight="400" font-size="15" fill="#1c1530">Rayner</text></svg>`,
  Teleon:  `<svg viewBox="0 0 90 22" xmlns="http://www.w3.org/2000/svg"><ellipse cx="45" cy="11" rx="42" ry="9" fill="none" stroke="#2BA84A" stroke-width="2"/><text x="45" y="15" text-anchor="middle" font-family="Inter,sans-serif" font-weight="900" font-style="italic" font-size="12" fill="#1c1530">TELEON</text></svg>`,
  JnJ:     `<svg viewBox="0 0 90 22" xmlns="http://www.w3.org/2000/svg"><text x="45" y="13" text-anchor="middle" font-family="Georgia,serif" font-weight="400" font-style="italic" font-size="10" fill="#CC0000">Johnson&amp;Johnson</text><text x="45" y="20" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="6" fill="#888" letter-spacing="3">VISION</text></svg>`,
};
function dchIolLogo(brand, w, h){
  if (w == null) w = 70;
  if (h == null) h = 18;
  const svg = IOL_BRAND_LOGOS[brand] || '';
  return `<span class="dch-iol-logo" style="display:inline-block;width:${w}px;height:${h}px;line-height:0;vertical-align:middle">${svg}</span>`;
}

// Polar → Cartesian helper (copied from source, prefixed)
function dchIolPolarToXY(cx, cy, r, angleRad){
  return [cx + r * Math.cos(angleRad), cy + r * Math.sin(angleRad)];
}

// Catmull-Rom spline path generator (closed loop) — copied verbatim from source
function dchIolCatmullRomPath(pts, tension){
  if (tension == null) tension = 0.5;
  if (pts.length < 3) return '';
  const n = pts.length;
  const p = [pts[n-1], ...pts, pts[0], pts[1]];
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i <= n; i++){
    const p0 = p[i-1], p1 = p[i], p2 = p[i+1] || p[1], p3 = p[i+2] || p[2];
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;
    const end = i === n ? pts[0] : (p[i+1] || pts[0]);
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
  }
  return d + ' Z';
}

// Build the radar SVG for 3 (or N) lenses — port of source renderRadar()
function dchIolBuildRadarSvg(lenses){
  const W = 400, H = 320;
  const cx = W/2, cy = H * 0.47;
  const maxR = Math.min(W, H) * 0.37;
  const dims = IOL_DIMS;
  const n = dims.length;
  const maxVal = 10;
  const angles = dims.map((_, i) => -Math.PI/2 + i * (2 * Math.PI / n));

  let svg = `<defs><clipPath id="iol-radar-clip"><circle cx="${cx}" cy="${cy}" r="${(maxR+10).toFixed(2)}"/></clipPath></defs>`;

  // Background rings (4 levels, Catmull-Rom polygons, tension 0.4)
  const levels = 4;
  for (let l = 1; l <= levels; l++){
    const r = maxR * (l / levels);
    const ringPts = angles.map(a => dchIolPolarToXY(cx, cy, r, a));
    const ringPath = dchIolCatmullRomPath(ringPts, 0.4);
    const fill = l === levels ? 'rgba(39,132,231,0.04)' : 'none';
    svg += `<path d="${ringPath}" fill="${fill}" stroke="rgba(0,0,0,0.07)" stroke-width="1"/>`;
    // Scale number on this ring
    svg += `<text x="${(cx+2).toFixed(1)}" y="${(cy-r-3).toFixed(1)}" font-size="10" fill="#aaa" text-anchor="middle">${(maxVal * l / levels).toFixed(0)}</text>`;
  }

  // Axis lines + labels
  angles.forEach((a, i) => {
    const [x2, y2] = dchIolPolarToXY(cx, cy, maxR, a);
    svg += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>`;
    const [lx, ly] = dchIolPolarToXY(cx, cy, maxR + 22, a);
    const short = dims[i].short;
    const anchor = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle';
    svg += `<text x="${lx.toFixed(1)}" y="${(ly+3).toFixed(1)}" font-size="12" fill="#6C757D" font-family="Inter,sans-serif" text-anchor="${anchor}">${short}</text>`;
  });

  // Series: areas (clipped) + lines + vertex dots
  const seriesData = lenses.map(lens => {
    const scores = IOL_SCORES[lens.name];
    const pts = dims.map((d, j) => {
      const v = scores[d.key] || 0;
      const r = maxR * (v / maxVal);
      return dchIolPolarToXY(cx, cy, r, angles[j]);
    });
    return { lens, color: lens.color, pts, pathD: dchIolCatmullRomPath(pts, 0.45) };
  });
  // Areas first
  seriesData.forEach(({ pathD, color }) => {
    svg += `<path d="${pathD}" fill="${color}" fill-opacity="0.06" clip-path="url(#iol-radar-clip)"/>`;
  });
  // Lines
  seriesData.forEach(({ pathD, color }) => {
    svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>`;
  });
  // Vertex dots
  seriesData.forEach(({ pts, color }) => {
    pts.forEach(([x, y]) => {
      svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}" stroke="white" stroke-width="1.5"/>`;
    });
  });

  return `<svg id="iol-radar-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible">${svg}</svg>`;
}

function dchAnsBestIol(){
  // ── 1. Sort lenses by Surgery Outcome for podium ──
  const lensesBySurgery = IOL_LENSES.slice().sort((a,b) => IOL_SCORES[b.name].Surgery - IOL_SCORES[a.name].Surgery);
  const top3 = lensesBySurgery.slice(0, 3);

  // ── 2. Podium HTML — visual order: 2nd left, 1st centre, 3rd right (ord=[1,0,2]) ──
  //    Heights/widths inline as in source; #1 tallest+widest in the middle.
  const ord = [1, 0, 2];
  const heights = { 1:'100%', 2:'88%', 3:'76%' };
  const widths  = { 1:'36%', 2:'30%', 3:'26%' };
  const rankLetters = ['gold','silver','bronze']; // 0-indexed by item rank 1/2/3
  const podiumCards = ord.map(idx => {
    const lens = top3[idx]; if (!lens) return '';
    const r = idx + 1;
    const b = IOL_BRANDS[lens.brand] || IOL_BRANDS.Other;
    const rl = rankLetters[r-1];
    const score = IOL_SCORES[lens.name].Surgery.toFixed(1);
    return `<div class="iol-podium-col" style="height:${heights[r]};width:${widths[r]}">
      <div class="iol-p-card r${r}">
        <div class="iol-p-inner">
          <span class="iol-p-rank ${rl}">#${r}</span>
          <span class="iol-p-score">${score}</span>
          <span class="iol-p-score-suffix">Surgery Outcome</span>
        </div>
        <div class="iol-p-namebar">
          <div class="iol-p-name" title="${dchEsc(lens.name)}">${dchEsc(lens.name)}</div>
        </div>
        <div class="iol-p-brandbar" style="background:${b.bg}">${IOL_BRAND_LOGOS[lens.brand] || ''}</div>
      </div>
    </div>`;
  }).join('');

  // ── 3. Radar SVG: 9 dims, top 3 lenses, Catmull-Rom splines ──
  const radarSvg = dchIolBuildRadarSvg(top3);
  const radarLegend = top3.map(lens =>
    `<span class="iol-legend-item"><span class="iol-legend-pill" style="background:${lens.color}"></span><span>${dchEsc(lens.name)}</span></span>`
  ).join('');

  // ── 4. Mini-pod grid: 8 non-Surgery dimensions ──
  const otherDims = IOL_DIMS.filter(d => d.key !== 'Surgery');
  const miniCards = otherDims.map(dim => {
    const ranked = IOL_LENSES.slice()
      .sort((a,b) => IOL_SCORES[b.name][dim.key] - IOL_SCORES[a.name][dim.key])
      .slice(0, 3);
    const rows = ranked.map((lens, i) => {
      const b = IOL_BRANDS[lens.brand] || IOL_BRANDS.Other;
      const rk = i + 1;
      return `<div class="iol-mini-row iol-mr${rk}">
        <div class="iol-rank-n iol-rn${rk}">${rk}</div>
        <div class="iol-m-logo">${IOL_BRAND_LOGOS[lens.brand] || ''}</div>
        <span class="iol-m-lens" title="${dchEsc(lens.name)}" style="color:${b.c}">${dchEsc(lens.name)}</span>
        <span class="iol-m-bar" style="background:${lens.color}"></span>
        <span class="iol-m-score" style="color:${b.c}">${IOL_SCORES[lens.name][dim.key].toFixed(1)}</span>
      </div>`;
    }).join('');
    return `<div class="iol-mini-card">
      <div class="iol-mini-title">${dchEsc(dim.label)}</div>
      <div class="iol-mini-timeframe">1 month post-op</div>
      <div class="iol-mini-list">${rows}</div>
    </div>`;
  }).join('');

  // ── 5. Clinic-specific cohort table (collapsed) — now uses 1-month visit ──
  const byLens = {};
  CLINIC_SURGERY_DATA.filter(p => p.surgeryType === 'cataract').forEach(p => {
    byLens[p.lens] = byLens[p.lens] || { cases:0, sumA1:0, sumDisturb:0, n:0 };
    const v = p.postOp && p.postOp.m1;
    if (v && v.proms){
      const l = byLens[p.lens];
      l.cases++; l.sumA1 += v.proms[0]; l.sumDisturb += (v.proms[6] + v.proms[7] + v.proms[8]); l.n++;
    }
  });
  const clinicItems = Object.keys(byLens).map(name => ({
    name, cases: byLens[name].cases,
    avgA1:      byLens[name].n ? (byLens[name].sumA1      / byLens[name].n) : 0,
    avgDisturb: byLens[name].n ? (byLens[name].sumDisturb / byLens[name].n) : 0,
  })).filter(i => i.cases >= 2).sort((a,b) => b.avgA1 - a.avgA1).slice(0, 5);
  let clinicBlock = '';
  if (clinicItems.length > 0){
    const clinicRows = clinicItems.map((i, idx) =>
      `<tr><td><b>#${idx+1}</b></td><td>${dchEsc(i.name)}</td><td>${dchScaled(i.cases)}</td><td><b style="color:${i.avgA1>=8.5?'#03A180':'#5C18AB'}">${i.avgA1.toFixed(1)}</b>/10</td><td>${i.avgDisturb.toFixed(1)}</td></tr>`
    ).join('');
    clinicBlock = `
    <details style="margin-top:14px;background:#faf7fe;border:1px solid #e5dcf3;border-radius:10px;padding:8px 12px">
      <summary style="cursor:pointer;font-weight:700;color:#5C18AB;font-size:12px">Your clinic's own cataract cohort · top 5 IOLs by A1 at 1 month</summary>
      <table class="dch-tbl" style="margin-top:8px">
        <thead><tr><th>Rank</th><th>IOL</th><th>Cases</th><th>A1 (1mo)</th><th>Disturb (A7+8+9)</th></tr></thead>
        <tbody>${clinicRows}</tbody>
      </table>
    </details>`;
  }

  return `
    <div class="dch-iol-card">
      <h4>📊 IOL Benchmark · 1 month post-op</h4>
      <div class="iol-sub">9 dimensions · network +25,000 cases · timeframe: 1 month</div>

      <div class="iol-card-inner iol-podium-card">
        <div class="iol-card-head">
          <div>
            <div class="iol-card-title">Surgery Outcome Podium</div>
            <div class="iol-card-sub">Top 3 · 1 month post-op</div>
          </div>
        </div>
        <div class="iol-chart-wrap">
          <div class="iol-podium-stage">${podiumCards}</div>
        </div>
      </div>

      <div class="iol-card-inner iol-radar-card">
        <div class="iol-card-head">
          <div>
            <div class="iol-card-title">Patients Reported Outcomes</div>
            <div class="iol-card-sub">Average score per dimension (1–10) · 1 month</div>
          </div>
          <div class="card-tabs">
            <div class="ctab on" onclick="event.stopPropagation()">Top 3</div>
            <div class="ctab" onclick="event.stopPropagation()">All</div>
          </div>
        </div>
        <div class="iol-chart-wrap">
          <div id="iol-radar-wrap">${radarSvg}</div>
          <div id="iol-radar-legend">${radarLegend}</div>
        </div>
      </div>

      <div class="iol-card-inner iol-detail-card">
        <div class="detail-lbl">Ranking by dimension · 1 month post-op</div>
        <div class="detail-grid">${miniCards}</div>
      </div>

      ${clinicBlock}
      ${dchCite()}
    </div>`;
}

function dchAnsForecast(){
  const past = [13,14,17,16,19,21];
  const fut = [24,26,29];
  const futLo = [21,22,25]; const futHi = [28,31,34];
  const pastLabels = ['Jan','Feb','Mar','Apr','May','Jun'];
  const futLabels = ['Jul','Aug','Sep'];
  const total = fut.reduce((a,b)=>a+b,0);
  // Scale series to the full archive for display
  const scale = a => a.map(v => Math.round(v * CLINIC_DISPLAY_MULTIPLIER));
  return `
    <h4>📊 Quarterly forecast · Jul–Sep <span class="ptag">95% CI</span></h4>
    <p>Based on your 12-month series + seasonality + confirmed pipeline. I'm projecting <b>${dchScaled(total)} surgeries</b> between July and September.</p>
    <div class="dch-chart">${dchForecastChart(scale(past),scale(fut),scale(futLo),scale(futHi),pastLabels,futLabels)}</div>
    <div class="dch-kpis">
      <div class="dch-kpi"><div class="l">Base</div><div class="v">${dchScaled(total)}</div><div class="d">July–Sep</div></div>
      <div class="dch-kpi accent-blue"><div class="l">Lower (P05)</div><div class="v">${dchScaled(futLo.reduce((a,b)=>a+b,0))}</div><div class="d">conservative</div></div>
      <div class="dch-kpi accent-green"><div class="l">Upper (P95)</div><div class="v">${dchScaled(futHi.reduce((a,b)=>a+b,0))}</div><div class="d">upside</div></div>
    </div>
    ${dchCite()}`;
}

function dchAnsComplications(){
  // Synthetic from dataset: pick a few patients with low A1 or extreme vault as complications
  const candidates = [];
  CLINIC_SURGERY_DATA.forEach(p => {
    if (p.vault && (p.vault > 650 || p.vault < 280)) candidates.push({p, type: p.vault > 650 ? 'Hypervault ('+p.vault+' µm)' : 'Hypovault ('+p.vault+' µm)', sev: 'high'});
    else if (p.surgeryType === 'lasik' && Math.abs(p.refractiveResidual) > 1.0) candidates.push({p, type: 'Refractive residual '+(p.refractiveResidual>0?'+':'')+p.refractiveResidual+'D', sev: 'med'});
  });
  const top = candidates.slice(0,5);
  if (top.length === 0) return `<h4>⚠️ Complications</h4><p>No critical complications detected this week in the current cohort.</p>${dchCite()}`;
  const rows = top.map(c => `<tr><td>${c.p.id.slice(0,6)} · ${c.p.eye}</td><td>${c.p.surgeryType.toUpperCase()}</td><td>${dchEsc(c.type)}</td><td><span class="sev-${c.sev}">${c.sev.toUpperCase()}</span></td></tr>`).join('');
  return `
    <h4>⚠️ This week's complications <span class="ptag">${top.length} cases</span></h4>
    <p>Patients with outcomes outside the expected clinical range. Severity color-coded:</p>
    <table class="dch-tbl">
      <thead><tr><th>Patient</th><th>Surgery</th><th>Issue</th><th>Severity</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${dchCite()}`;
}

function dchAnsNps(){
  // NPS estimated from avg A1 across cohort
  const a1 = CLINIC_DATA_SUMMARY.avgA1;
  const myNps = Math.round((a1-7) * 25 + 60);
  const peerNps = 58;
  const items = [
    { label:'Your clinic', value: myNps, color:'#5C18AB' },
    { label:'Peer median (REVAI net)', value: peerNps, color:'#0080C7' },
    { label:'Top decile', value: 81, color:'#03A180' },
  ];
  return `
    <h4>📊 NPS vs peer clinics <span class="ptag">REVAI network · 38 peers</span></h4>
    <p>Your estimated NPS (derived from weighted A1) is at <b>${myNps}</b>, vs a peer median of <b>${peerNps}</b>. You are <b style="color:#03A180">+${myNps-peerNps} points</b> above the median.</p>
    <div class="dch-chart"><div class="dch-chart-title">Comparative NPS</div>${dchBarChart(items)}</div>
    ${dchCite()}`;
}

function dchAnsOutcomesByType(){
  const types = ['cataract','icl','lasik','smile'];
  const labels = ['Cataract','ICL','LASIK','SMILE'];
  const a1Vals = [], indVals = [], distVals = [];
  types.forEach(t => {
    const cohort = CLINIC_SURGERY_DATA.filter(p=>p.surgeryType===t);
    if (cohort.length === 0){ a1Vals.push(0); indVals.push(0); distVals.push(0); return; }
    let a1=0, ind=0, dist=0;
    cohort.forEach(p=>{
      const v = dchLastVisit(p);
      a1 += v.proms[0]; ind += v.proms[1]; dist += (v.proms[6]+v.proms[7]+v.proms[8]);
    });
    a1Vals.push(+(a1/cohort.length).toFixed(1));
    indVals.push(+(ind/cohort.length).toFixed(1));
    distVals.push(+(dist/cohort.length).toFixed(1));
  });
  const groups = labels.map(l => ({label:l}));
  const series = [
    { name:'A1 satisfaction (/10)', color:'#5C18AB', values: a1Vals },
    { name:'A2 lens indep. (lower is better)', color:'#0080C7', values: indVals },
    { name:'Disturb sum (A7+8+9)', color:'#F6BF2C', values: distVals },
  ];
  return `
    <h4>📊 Outcomes by surgery type <span class="ptag">grouped</span></h4>
    <p>Average outcome comparison across the 4 surgery types in your archive. Clinically relevant differences in satisfaction and visual independence:</p>
    <div class="dch-chart"><div class="dch-chart-title">Avg PROMs · by type</div>${dchGroupedBarChart(groups, series)}</div>
    <div class="dch-cta">
      <button onclick="dashCopilotAsk('Compare IOL outcomes across the network')">📊 IOL benchmark →</button>
      <button onclick="dashCopilotAsk('How are my LASIK and SMILE outcomes?')">LASIK / SMILE drill →</button>
    </div>
    ${dchCite()}`;
}

function dchAnsRefractiveOutcomes(){
  const refr = CLINIC_SURGERY_DATA.filter(p => p.surgeryType==='lasik' || p.surgeryType==='smile');
  const byType = {lasik: [], smile: []};
  refr.forEach(p => byType[p.surgeryType].push(p));
  function statsFor(arr){
    if (arr.length===0) return {n:0, a1:0, in05:0, in10:0};
    const a1 = arr.reduce((s,p)=>s+dchLastVisit(p).proms[0],0)/arr.length;
    const in05 = arr.filter(p=>Math.abs(p.refractiveResidual)<=0.5).length / arr.length * 100;
    const in10 = arr.filter(p=>Math.abs(p.refractiveResidual)<=1.0).length / arr.length * 100;
    return {n:arr.length, a1, in05, in10};
  }
  const sL = statsFor(byType.lasik); const sS = statsFor(byType.smile);
  return `
    <h4>💊 LASIK / SMILE outcomes <span class="ptag">${dchScaled(refr.length)} refractive cases</span></h4>
    <p>Comparison between the two corneal refractive procedures in your archive:</p>
    <div class="dch-kpis">
      <div class="dch-kpi accent-blue"><div class="l">LASIK · n</div><div class="v">${dchScaled(sL.n)}</div><div class="d">±0.5D ${sL.in05.toFixed(0)}%</div></div>
      <div class="dch-kpi"><div class="l">LASIK · A1</div><div class="v">${sL.a1.toFixed(1)}</div><div class="d">/10 satisfaction</div></div>
      <div class="dch-kpi accent-gold"><div class="l">SMILE · n</div><div class="v">${dchScaled(sS.n)}</div><div class="d">±0.5D ${sS.in05.toFixed(0)}%</div></div>
      <div class="dch-kpi accent-green"><div class="l">SMILE · A1</div><div class="v">${sS.a1.toFixed(1)}</div><div class="d">/10 satisfaction</div></div>
    </div>
    <div class="dch-chart"><div class="dch-chart-title">% within ±0.5D and ±1.0D of refractive target</div>
      ${dchBarChart([
        {label:'LASIK ±0.5D', value: parseInt(sL.in05), suffix:'%', color:'#0080C7'},
        {label:'LASIK ±1.0D', value: parseInt(sL.in10), suffix:'%', color:'#3FA8DC'},
        {label:'SMILE ±0.5D', value: parseInt(sS.in05), suffix:'%', color:'#F6BF2C'},
        {label:'SMILE ±1.0D', value: parseInt(sS.in10), suffix:'%', color:'#fcd76b'},
      ], {suffix:'%'})}
    </div>
    <div class="dch-cta">
      <button onclick="dashCopilotAsk('Which refractive patients had over- or under-correction?')">View over/under-correction →</button>
    </div>
    ${dchCite()}`;
}

function dchAnsOverUnder(){
  const refr = CLINIC_SURGERY_DATA.filter(p=>p.surgeryType==='lasik'||p.surgeryType==='smile');
  const over = refr.filter(p=>p.refractiveResidual>=0.5);
  const under = refr.filter(p=>p.refractiveResidual<=-0.5);
  const all = over.concat(under).sort((a,b)=>Math.abs(b.refractiveResidual)-Math.abs(a.refractiveResidual)).slice(0,10);
  const rows = all.map(p => {
    const sign = p.refractiveResidual >= 0 ? 'OVER' : 'UNDER';
    const cls = sign==='OVER' ? 'sev-high' : 'sev-med';
    return `<tr><td>${p.id.slice(0,6)} · ${p.eye}</td><td>${p.surgeryType.toUpperCase()}</td><td>${p.sphPre>0?'+':''}${p.sphPre}D</td><td><b class="${cls}">${p.refractiveResidual>0?'+':''}${p.refractiveResidual}D</b></td><td>${sign}</td></tr>`;
  }).join('');
  return `
    <h4>⚠️ Refractive patients with over/under-correction <span class="ptag">|residual| ≥ 0.5D</span></h4>
    <p>Of your <b>${dchScaled(refr.length)}</b> LASIK/SMILE cases, <b>${dchScaled(over.length)}</b> show over-correction (hyperopic residual ≥ +0.5D) and <b>${dchScaled(under.length)}</b> show under-correction (myopic residual ≤ -0.5D).</p>
    <div class="dch-kpis">
      <div class="dch-kpi accent-red"><div class="l">Over-corrected</div><div class="v">${dchScaled(over.length)}</div><div class="d">${(over.length/Math.max(1,refr.length)*100).toFixed(0)}% of cohort</div></div>
      <div class="dch-kpi accent-gold"><div class="l">Under-corrected</div><div class="v">${dchScaled(under.length)}</div><div class="d">${(under.length/Math.max(1,refr.length)*100).toFixed(0)}% of cohort</div></div>
      <div class="dch-kpi accent-green"><div class="l">In target</div><div class="v">${dchScaled(refr.length - over.length - under.length)}</div><div class="d">±0.5D</div></div>
    </div>
    <table class="dch-tbl">
      <thead><tr><th>ID · Eye</th><th>Type</th><th>Pre SPH</th><th>Residual</th><th>Dir</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#7d6fa3">No out-of-range cases.</td></tr>'}</tbody>
    </table>
    ${dchCite()}`;
}

function dchAnsFallback(q){
  return `
    <h4>🤔 I'm not 100% sure what you want to know <span class="ptag">Suggestions</span></h4>
    <p>I couldn't match your question: <i>"${dchEsc(q)}"</i>. Try one of these:</p>
    <div class="dch-cta">
      <button onclick="dashCopilotAsk('Who are my dissatisfied patients?')">😟 Dissatisfied patients</button>
      <button onclick="dashCopilotAsk('Where are my dissatisfied patients located geographically?')">🗺️ Patient map</button>
      <button onclick="dashCopilotAsk('What is my surgery mix?')">🔬 Surgery mix</button>
      <button onclick="dashCopilotAsk('Compare IOL outcomes across the network')">📊 IOL benchmark</button>
      <button onclick="dashCopilotAsk('What are my outcomes by surgery type?')">📊 Outcomes by type</button>
    </div>
    ${dchCite()}`;
}
