/* ============== SURGICAL RESULTS BY DOCTOR ============== */
function dchAnsByDoctor(){
  // Aggregate per canonical doctor
  const agg = {};
  DCH_DOCTORS.forEach(d => {
    agg[d.name] = { name:d.name, specialty:d.specialty, cases:0,
      mix:{cataract:0, icl:0, lasik:0, smile:0},
      sumA1:0, a1N:0, sumDis:0, disN:0,
      lensCount:{},
    };
  });
  CLINIC_SURGERY_DATA.forEach(p => {
    const a = agg[p.surgeon]; if (!a) return;
    a.cases++;
    if (a.mix[p.surgeryType] != null) a.mix[p.surgeryType]++;
    a.lensCount[p.lens] = (a.lensCount[p.lens]||0)+1;
    const v = dchLastVisit(p);
    if (v && v.proms){
      a.sumA1 += v.proms[0]; a.a1N++;
      a.sumDis += (v.proms[6]||0)+(v.proms[7]||0)+(v.proms[8]||0); a.disN++;
    }
  });
  // Compute derived metrics
  const rows = DCH_DOCTORS.map(d => {
    const a = agg[d.name];
    const avgA1 = a.a1N ? a.sumA1/a.a1N : 0;
    const avgDis = a.disN ? a.sumDis/a.disN : 0;
    // NPS proxy: promoters (A1>=9) - detractors (A1<=6), as percent
    let promoters = 0, detractors = 0, total = 0;
    CLINIC_SURGERY_DATA.forEach(p => {
      if (p.surgeon !== d.name) return;
      const v = dchLastVisit(p); if (!v || !v.proms) return;
      total++;
      if (v.proms[0] >= 9) promoters++;
      else if (v.proms[0] <= 6) detractors++;
    });
    const nps = total ? Math.round((promoters - detractors)/total*100) : 0;
    // Best lens = most-used
    const best = Object.entries(a.lensCount).sort((x,y)=>y[1]-x[1])[0];
    return { ...d, cases:a.cases, mix:a.mix, avgA1, avgDis, nps, bestLens: best ? best[0] : '—' };
  });
  // Sort by cases desc for the chart and headline
  const byCases = rows.slice().sort((a,b)=>b.cases-a.cases);
  const topByA1 = rows.slice().filter(r=>r.cases>0).sort((a,b)=>b.avgA1-a.avgA1)[0];
  const topByVolume = byCases[0];
  const topByNps = rows.slice().filter(r=>r.cases>0).sort((a,b)=>b.nps-a.nps)[0];
  const totalCases = rows.reduce((s,r)=>s+r.cases,0);

  // Surgeon-color palette (one per doctor)
  const colorById = {
    'roger':'#5C18AB','diego':'#0080C7','cummings':'#08B1C2','roberto':'#03B496','trancon':'#F6BF2C'
  };

  // Mix pills (cataract / icl / lasik / smile)
  const mixPills = (mix, total) => {
    const items = [
      {l:'ICL',  v:mix.icl,      c:'#5C18AB'},
      {l:'Cat',  v:mix.cataract, c:'#0080C7'},
      {l:'LSK',  v:mix.lasik,    c:'#08B1C2'},
      {l:'SMI',  v:mix.smile,    c:'#03B496'},
    ].filter(i=>i.v>0);
    if (!items.length) return '<span style="color:#9a92b3">—</span>';
    const segs = items.map(i => {
      const pct = total ? (i.v/total*100) : 0;
      return `<span title="${i.l}: ${i.v} (${pct.toFixed(0)}%)" style="display:inline-block;height:10px;width:${Math.max(6,pct*0.9)}px;background:${i.c};border-radius:3px;margin-right:2px;vertical-align:middle"></span>`;
    }).join('');
    const labels = items.map(i => `<span style="color:${i.c};font-weight:700">${i.l}&nbsp;${total?(i.v/total*100).toFixed(0):0}%</span>`).join(' · ');
    return `<div style="display:flex;flex-direction:column;gap:3px"><div>${segs}</div><div style="font-size:10.5px;line-height:1.2">${labels}</div></div>`;
  };

  const rowsHtml = rows.map(r => `
    <tr>
      <td><b>${dchEsc(r.name)}</b><div style="font-size:10.5px;color:#7d6fa3;font-weight:600">${dchEsc(r.specialty)}</div></td>
      <td><b>${dchScaled(r.cases)}</b><div style="font-size:10.5px;color:#7d6fa3">${totalCases?(r.cases/totalCases*100).toFixed(0):0}%</div></td>
      <td>${mixPills(r.mix, r.cases)}</td>
      <td><b style="color:${r.avgA1>=9?'#03A180':r.avgA1>=8?'#5C18AB':'#cf8a13'}">${r.avgA1.toFixed(1)}</b>/10</td>
      <td><b style="color:${r.nps>=60?'#03A180':r.nps>=40?'#5C18AB':'#D12C4A'}">${r.nps>=0?'+':''}${r.nps}</b></td>
      <td>${dchEsc(r.bestLens)}</td>
    </tr>`).join('');

  // H-bar chart of cases per doctor, colored per surgeon
  const barItems = byCases.map(r => ({
    label: r.name.replace('Dr. ',''),
    value: parseInt(dchScaled(r.cases).replace(/,/g,''), 10),
    suffix: '',
    color: colorById[r.id] || '#5C18AB',
  }));
  // dchHBarChart doesn't honor per-row color, so render an inline custom h-bar
  const w = 580, rowH = 30, h = barItems.length * rowH + 16;
  const maxVal = Math.max.apply(null, barItems.map(d=>d.value)) || 1;
  const labelW = 200, valW = 90, trkX = labelW, trkW = w - labelW - valW;
  const hbarSvg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    ${barItems.map((d,i) => {
      const cy = 10 + i*rowH;
      const bw = (d.value / maxVal) * trkW;
      return `<text x="0" y="${cy+15}" fill="#3c3654" font-size="11.5" font-weight="700">${dchEsc(d.label)}</text>
        <rect x="${trkX}" y="${cy+6}" width="${trkW}" height="14" rx="7" fill="#F2EFF8"/>
        <rect x="${trkX}" y="${cy+6}" width="${bw}" height="14" rx="7" fill="${d.color}"/>
        <text x="${w}" y="${cy+15}" fill="#1c1530" font-size="11.5" font-weight="800" text-anchor="end">${d.value.toLocaleString('en-US')}</text>`;
    }).join('')}
  </svg>`;

  // ICL vault performance (in-target %) for the lead refractive surgeon
  const rogerIcl = CLINIC_SURGERY_DATA.filter(p => p.surgeon==='Dr. Roger Zaldivar' && p.surgeryType==='icl' && p.vault);
  const rogerInTgt = rogerIcl.filter(p => p.vault>=250 && p.vault<=750).length;
  const rogerVaultPct = rogerIcl.length ? Math.round(rogerInTgt/rogerIcl.length*100) : 0;
  // Cummings refractive NPS
  const cumRow = rows.find(r=>r.id==='cummings');
  // Trancón learning curve (avg A1 of her oldest vs newest cases)
  const tranList = CLINIC_SURGERY_DATA.filter(p => p.surgeon==='Dr. María Trancón');
  const tranSorted = tranList.slice().sort((a,b)=>b.monthsAgo-a.monthsAgo); // oldest first
  const avgPick = (arr) => {
    let s=0,n=0; arr.forEach(p=>{const v=dchLastVisit(p);if(v&&v.proms){s+=v.proms[0];n++;}});
    return n?s/n:0;
  };
  const tranEarly = avgPick(tranSorted.slice(0, Math.max(1, Math.floor(tranSorted.length/3))));
  const tranLate  = avgPick(tranSorted.slice(-Math.max(1, Math.floor(tranSorted.length/3))));

  return `
    <h4>👨‍⚕️ Surgical results by doctor <span class="ptag">${DCH_DOCTORS.length} surgeons · ${dchScaled(totalCases)} cases</span></h4>
    <p>Across the active roster of <b>${DCH_DOCTORS.length} surgeons</b> I aggregated <b>${dchScaled(totalCases)} surgeries</b> over the last 12 months. Each surgeon is benchmarked on volume, satisfaction (A1), an NPS proxy (% promoters minus detractors) and their most-used lens.</p>
    <div class="dch-kpis">
      <div class="dch-kpi"><div class="l">Active surgeons</div><div class="v">${DCH_DOCTORS.length}</div><div class="d">of ${DCH_DOCTORS.length} on roster</div></div>
      <div class="dch-kpi accent-green"><div class="l">Top satisfaction</div><div class="v" style="font-size:14px;line-height:1.25;padding-top:4px">${topByA1?dchEsc(topByA1.name.replace('Dr. ','')):'—'}</div><div class="d">Avg A1 ${topByA1?topByA1.avgA1.toFixed(1):'—'}/10</div></div>
      <div class="dch-kpi accent-blue"><div class="l">Highest volume</div><div class="v" style="font-size:14px;line-height:1.25;padding-top:4px">${topByVolume?dchEsc(topByVolume.name.replace('Dr. ','')):'—'}</div><div class="d">${topByVolume?dchScaled(topByVolume.cases)+' cases':'—'}</div></div>
      <div class="dch-kpi accent-gold"><div class="l">Best NPS</div><div class="v">${topByNps?(topByNps.nps>=0?'+':'')+topByNps.nps:'—'}</div><div class="d">${topByNps?dchEsc(topByNps.name.replace('Dr. ','')):'—'}</div></div>
    </div>
    <table class="dch-tbl">
      <thead><tr><th>Doctor</th><th>Cases</th><th>Mix (ICL / Cat / LSK / SMI)</th><th>Avg A1 (6 mo)</th><th>NPS proxy</th><th>Most-used lens</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p style="margin:14px 0 4px;font-weight:700;color:#1c1530">Volume per surgeon</p>
    ${hbarSvg}
    <div class="rcp-insight">
      <b>Pattern:</b> Dr. Roger Zaldivar leads ICL volume with <b>${rogerVaultPct}% in-target vault</b> (250–750 µm)${cumRow?`; Dr. Cummings has the highest NPS for refractive at <b>${cumRow.nps>=0?'+':''}${cumRow.nps}</b>`:''}.
      ${tranLate>tranEarly+0.3 ? ` Dr. Trancón shows a clear learning curve — average A1 climbed from <b>${tranEarly.toFixed(1)}</b> (early cases) to <b>${tranLate.toFixed(1)}</b> (recent).` : ''}
    </div>
    <ul class="rcp-bullets">
      <li><b>Specialty match:</b> Roger and Roberto Zaldivar concentrate the ICL load; Diego Cerutti runs the cataract bench; Cummings owns the complex refractive line.</li>
      <li><b>Quality vs volume:</b> the top performer by A1 (${topByA1?dchEsc(topByA1.name.replace('Dr. ','')):'—'}) and top by volume (${topByVolume?dchEsc(topByVolume.name.replace('Dr. ','')):'—'}) ${topByA1 && topByVolume && topByA1.id===topByVolume.id ? 'are the same surgeon — solid throughput and outcomes' : 'differ — opportunity for cross-mentoring'}.</li>
      <li><b>Junior support:</b> Dr. Trancón handles ~${rows.find(r=>r.id==='trancon')?(rows.find(r=>r.id==='trancon').cases/totalCases*100).toFixed(0):0}% of cases — keep mentoring on complex refractive.</li>
    </ul>
    <div class="dch-cta">
      <button onclick="dashCopilotAsk('What is my vault accuracy by surgeon for ICL?')">🎯 Vault accuracy (ICL) →</button>
      <button onclick="dashCopilotAsk('Compare IOL outcomes across the network')">📊 IOL benchmark →</button>
      <button onclick="dashCopilotAsk('What are my outcomes by surgery type?')">📊 Outcomes by type →</button>
    </div>
    ${dchCite()}`;
}
