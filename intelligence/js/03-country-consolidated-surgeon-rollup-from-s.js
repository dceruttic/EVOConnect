/* ========= COUNTRY: consolidated surgeon rollup from SURGEONS ========= */
function countrySurgeonSection(iso){
  const list = SURGEONS.filter(s=>s.iso===iso);
  if(list.length===0){
    return `<div class="dr-section">
      <h4>Surgeon network</h4>
      <div style="font-size:11.5px;color:var(--text-3);line-height:1.5">
        No tracked surgeons in Surgeon Rankings for this country yet. Network is still being onboarded into REVAI's KOL roster.
      </div>
    </div>`;
  }
  const sorted = list.slice().sort((a,b)=>b.vol-a.vol);
  const totalVol = list.reduce((a,s)=>a+s.vol,0);
  const avgProms = (list.reduce((a,s)=>a+s.proms,0)/list.length).toFixed(1);
  const avgGrowth = (list.reduce((a,s)=>a+s.growth,0)/list.length).toFixed(1);
  const avgSign = +avgGrowth >= 0 ? '▲' : '▼';
  const avgColor = +avgGrowth >= 0 ? 'var(--green)' : 'var(--red)';
  const byClinic = {};
  list.forEach(s=>{ byClinic[s.clinic] = (byClinic[s.clinic]||0) + s.vol; });
  const uniqueClinics = Object.keys(byClinic).length;
  const eqMix = { sonomed:0, arcscan:0, quantel:0 };
  list.forEach(s=>{ if(eqMix[s.eq]!=null) eqMix[s.eq]++; });
  const topSpec = (()=>{
    const specs = {};
    list.forEach(s=>{ specs[s.spec] = (specs[s.spec]||0)+1; });
    return Object.entries(specs).sort((a,b)=>b[1]-a[1])[0][0];
  })();
  const maxVol = Math.max(...list.map(s=>s.vol));
  const rows = sorted.map((s,i)=>{
    const sign = s.growth>=0 ? '▲' : '▼';
    const col = s.growth>=0 ? '#10d48c' : '#ff5a7a';
    const barW = Math.round(s.vol/maxVol*100);
    return `<div class="dr-surg-row" onclick='openSurgeonByName(${JSON.stringify(s.n)})'>
      <div class="dr-surg-rank">${String(i+1).padStart(2,'0')}</div>
      <div class="dr-surg-meta">
        <div class="dr-surg-name">${s.n}</div>
        <div class="dr-surg-clinic">${s.clinic} · <span style="color:var(--text-3)">${s.spec}</span></div>
      </div>
      <div class="dr-surg-bar-wrap">
        <div class="dr-surg-bar"><span style="width:${barW}%"></span></div>
        <div class="dr-surg-bar-val">${s.vol.toLocaleString()}</div>
      </div>
      <div class="dr-surg-proms">${s.proms.toFixed(1)}</div>
      <div class="dr-surg-growth" style="color:${col}">${sign} ${Math.abs(s.growth).toFixed(1)}%</div>
    </div>`;
  }).join('');
  const eqBadges = [];
  if(eqMix.sonomed) eqBadges.push(`<span class="dr-clinic-eq sonomed">SONOMED ×${eqMix.sonomed}</span>`);
  if(eqMix.arcscan) eqBadges.push(`<span class="dr-clinic-eq arcscan">ARCSCAN ×${eqMix.arcscan}</span>`);
  if(eqMix.quantel) eqBadges.push(`<span class="dr-clinic-eq quantel">QUANTEL ×${eqMix.quantel}</span>`);
  return `<div class="dr-section">
    <h4>Surgeon network · consolidated from Surgeon Rankings</h4>
    <div class="dr-stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="dr-stat"><div class="k">Tracked surgeons</div><div class="v">${list.length}</div><div class="d">across ${uniqueClinics} clinic${uniqueClinics>1?'s':''}</div></div>
      <div class="dr-stat"><div class="k">Volume · 90d</div><div class="v">${totalVol.toLocaleString()}</div><div class="d">combined implants</div></div>
      <div class="dr-stat"><div class="k">Avg PROMs</div><div class="v">${avgProms}</div><div class="d">out of 100</div></div>
      <div class="dr-stat"><div class="k">Avg growth</div><div class="v" style="color:${avgColor}">${avgSign} ${Math.abs(+avgGrowth).toFixed(1)}%</div><div class="d">QoQ mean</div></div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px;font-size:10.5px">
      ${eqBadges.join('')}
      <span class="ptag" style="background:rgba(168,85,247,0.16);color:#cda8ff">Dominant focus: ${topSpec}</span>
    </div>
    <div class="dr-surg-list">
      <div class="dr-surg-head">
        <div></div>
        <div>Surgeon / clinic</div>
        <div style="text-align:left;padding-left:6px">90d volume</div>
        <div style="text-align:right">PROMs</div>
        <div style="text-align:right">Growth</div>
      </div>
      ${rows}
    </div>
    <div style="font-size:10.5px;color:var(--text-3);margin-top:6px">Click any row to open full surgeon profile (evolution, lens mix, PROMs, forecast).</div>
  </div>`;
}

function openContinent(key){
  const c = CONTINENTS[key]; if(!c) return;
  const countryList = Object.entries(COUNTRIES)
    .filter(([iso,v])=>v.cont===key)
    .sort((a,b)=>b[1].sx-a[1].sx);
  const listHtml = countryList.map(([iso,v])=>`
    <div class="dr-clinic" onclick="openCountry('${iso}')" style="cursor:pointer">
      <span class="dr-flag" style="font-size:18px">${v.flag}</span>
      <div class="dr-clinic-name">${v.n}<small>${v.clinics} clinics · ${v.sx.toLocaleString()} surgeries · ▲ ${Math.round(v.yoy*100)}% YoY</small></div>
      <span style="color:var(--text-3)">›</span>
    </div>`).join('');
  const total = c.eq.sonomed + c.eq.arcscan + c.eq.quantel;
  const pct = (n)=>Math.round(n/total*100);
  document.getElementById('drawer-content').innerHTML = `
    <div class="dr-sub" style="margin-top:4px">Continent snapshot</div>
    <h2>${c.n}</h2>
    <div class="dr-section">
      <h4>Activity · FY26 YTD</h4>
      <div class="dr-stat-grid">
        <div class="dr-stat"><div class="k">Surgeries</div><div class="v">${c.sx.toLocaleString()}</div><div class="d">▲ ${Math.round(c.yoy*100)}% YoY</div></div>
        <div class="dr-stat"><div class="k">Clinics</div><div class="v">${c.clinics}</div><div class="d">${c.orsLive} ORs live now</div></div>
        <div class="dr-stat"><div class="k">90-day pipeline</div><div class="v">${c.pipe.toLocaleString()}</div><div class="d">–</div></div>
        <div class="dr-stat"><div class="k">% of global YTD</div><div class="v">${Math.round(c.sx/1284930*100)}%</div><div class="d">of 1.28M</div></div>
      </div>
    </div>
    <div class="dr-section">
      <h4>Biometry equipment mix</h4>
      <div class="dr-eq-bar">
        <span class="sonomed" style="width:${pct(c.eq.sonomed)}%"></span>
        <span class="arcscan" style="width:${pct(c.eq.arcscan)}%"></span>
        <span class="quantel" style="width:${pct(c.eq.quantel)}%"></span>
      </div>
      <div class="dr-eq-row">
        <span><i style="background:#22d3ee"></i>SONOMED ${c.eq.sonomed} (${pct(c.eq.sonomed)}%)</span>
        <span><i style="background:#a855f7"></i>ARCSCAN ${c.eq.arcscan} (${pct(c.eq.arcscan)}%)</span>
        <span><i style="background:#fbbf24"></i>QUANTEL ${c.eq.quantel} (${pct(c.eq.quantel)}%)</span>
      </div>
    </div>
    <div class="dr-section">
      <h4>Countries — click to drill in</h4>
      ${listHtml}
    </div>
  `;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('backdrop').classList.add('show');
}

function closeDrawer(){
  const dr = document.getElementById('drawer');
  dr.classList.remove('open');
  dr.classList.remove('wide');
  document.getElementById('backdrop').classList.remove('show');
  STATE.selectedCountry = null;
  document.querySelectorAll('.country-label, .country-hit').forEach(e=>e.classList.remove('selected'));
}
