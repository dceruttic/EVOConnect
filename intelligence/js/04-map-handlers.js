/* ========= MAP handlers ========= */
function attachMapHandlers(){
  document.querySelectorAll('[data-country]').forEach(el=>{
    el.addEventListener('click',()=>openCountry(el.dataset.country));
  });
  document.querySelectorAll('[data-continent]').forEach(el=>{
    el.addEventListener('click',e=>{
      if(e.target.closest('[data-country]')) return;
      openContinent(el.dataset.continent);
    });
  });
  document.querySelectorAll('[data-clinic-country]').forEach(el=>{
    el.addEventListener('click',()=>openCountry(el.dataset.clinicCountry));
  });
}
function setEqFilter(v){
  STATE.eqFilter = v;
  document.querySelectorAll('.eq-chip').forEach(c=>c.classList.toggle('active', c.dataset.eq===v));
  document.querySelectorAll('.clinic-dot').forEach(d=>{
    if(v==='all') d.classList.remove('hidden');
    else d.classList.toggle('hidden', !d.classList.contains('eq-'+v));
  });
}

/* ========= VIEWS ========= */
const VIEWS = {};

/* --- Shared: KPI row HTML --- */
function kpiRowHtml(){ return `
  <div class="kpi-row">
    <div class="kpi" style="--accent:#4a9eff;"><div class="l">Surgeries (last 6 months)</div><div class="v">177,980</div><div class="d up">Real biometry data from ICL Universe<svg class="spk" width="60" height="20" viewBox="0 0 60 20"><polyline fill="none" stroke="#4a9eff" stroke-width="1.5" points="0,14 8,12 16,13 24,10 32,9 40,6 48,7 60,2"/></svg></div></div>
    <div class="kpi" style="--accent:#a855f7;"><div class="l">Annualized run-rate</div><div class="v">355,960</div><div class="d up">Projected full-year (6mo × 2)<svg class="spk" width="60" height="20" viewBox="0 0 60 20"><polyline fill="none" stroke="#a855f7" stroke-width="1.5" points="0,16 8,14 16,11 24,12 32,8 40,7 48,4 60,3"/></svg></div></div>
    <div class="kpi" style="--accent:#22d3ee;"><div class="l">Active clinics</div><div class="v">812<small>/ 860</small></div><div class="d up">Across 140 countries<svg class="spk" width="60" height="20" viewBox="0 0 60 20"><polyline fill="none" stroke="#22d3ee" stroke-width="1.5" points="0,12 10,11 20,10 30,8 40,7 50,5 60,4"/></svg></div></div>
    <div class="kpi kpi-rich" style="--accent:#10d48c;">
      <div class="l">Lens orders · this month</div>
      <div class="v">11,420<small>of 15,820 projected</small></div>
      <div class="sub">Day 23 of 30 · EOM projection ▲ 8.2% vs March</div>
      <div class="kpi-ord-bars">
        <div class="kpi-ord-bar">
          <div class="bar-tower" style="height:62%"><div class="bar-last" style="height:100%"></div></div>
          <div class="bar-lbl">Mar<br/><span style="color:var(--text-2);font-weight:700">14,620</span></div>
        </div>
        <div class="kpi-ord-bar">
          <div class="bar-tower" style="height:100%">
            <div class="bar-projected" style="height:28%"></div>
            <div class="bar-actual" style="height:72%"></div>
          </div>
          <div class="bar-lbl" style="color:#10d48c">Apr<br/><span style="color:#fff;font-weight:800">15,820</span></div>
        </div>
        <div class="kpi-ord-bar">
          <div class="bar-tower" style="height:108%"><div class="bar-last" style="height:100%;background:linear-gradient(180deg,rgba(168,85,247,0.25),rgba(168,85,247,0.08));border-top:1px dashed rgba(168,85,247,0.5)"></div></div>
          <div class="bar-lbl">May<br/><span style="color:var(--text-3);font-weight:700">~17.1k</span></div>
        </div>
      </div>
      <div class="kpi-ord-legend">
        <span><i style="background:#10d48c"></i>Actual-to-date</span>
        <span><i style="background:repeating-linear-gradient(45deg,rgba(16,212,140,0.4),rgba(16,212,140,0.4) 2px,rgba(16,212,140,0.15) 2px,rgba(16,212,140,0.15) 4px)"></i>Projection</span>
        <span><i style="background:rgba(236,239,255,0.28)"></i>Last month</span>
      </div>
    </div>

    <div class="kpi kpi-rich" style="--accent:#a855f7;">
      <div class="l">Lens size mix · last 90 days</div>
      <div class="v">EVO · EVO TICL<small>4 overall diameters (mm)</small></div>
      <div class="sub">Rolling 90d distribution · n = 87,340 implanted</div>
      <div class="kpi-size-stack">
        <div class="kpi-size-seg" style="flex:14;background:#22d3ee">14%</div>
        <div class="kpi-size-seg" style="flex:36;background:#4a9eff">36%</div>
        <div class="kpi-size-seg" style="flex:34;background:#a855f7">34%</div>
        <div class="kpi-size-seg" style="flex:16;background:#ff9e3d">16%</div>
      </div>
      <div class="kpi-size-rows">
        <div class="sz"><span class="nm"><i style="background:#22d3ee"></i>12.1 mm</span><span class="pc">Short · WTW 10.5–11.0</span></div>
        <div class="sz"><span class="nm"><i style="background:#4a9eff"></i>12.6 mm</span><span class="pc">Mid · WTW 11.0–11.5</span></div>
        <div class="sz"><span class="nm"><i style="background:#a855f7"></i>13.2 mm</span><span class="pc">Long · WTW 11.5–12.0</span></div>
        <div class="sz"><span class="nm"><i style="background:#ff9e3d"></i>13.7 mm</span><span class="pc">X-long · WTW >12.0</span></div>
      </div>
    </div>
  </div>`; }

/* --- Shared: World map SVG --- */
function mapSvgHtml(){
  // Build clinic dots from COUNTRIES
  const dots = [];
  Object.entries(COUNTRIES).forEach(([iso,c])=>{
    c.top.forEach((t,i)=>{
      const a = (i/Math.max(1,c.top.length-1))*Math.PI*2;
      const rr = 4 + (i>0 ? 2 + (i*1.2) : 0);
      const dx = Math.cos(a)*rr;
      const dy = Math.sin(a)*rr;
      dots.push({iso, x:c.x+dx, y:c.y+dy, eq:t.e, v:t.v, n:t.n, live:(i===0 && t.v>3000)});
    });
  });
  const dotSvg = dots.map(d=>`
    <circle class="clinic-dot eq-${d.eq}" data-clinic-country="${d.iso}" cx="${d.x}" cy="${d.y}" r="${d.v>10000?6:d.v>3000?4.5:3}" stroke="rgba(255,255,255,0.4)" stroke-width="0.4">
      <title>${d.n} · ${d.v.toLocaleString()} surgeries (6mo) · ${EQ[d.eq].n}</title>
    </circle>
    ${d.live?`<circle class="clinic-live-ring" cx="${d.x}" cy="${d.y}" r="7"/>`:''}
  `).join('');

  // Clean antimeridian-crossing paths (Fiji, Russia, Antarctica, USA-Aleutians): any
  // segment that jumps > 500px horizontally is a wrap; split the path into two sub-paths
  // using M so no horizontal line is drawn across the whole map.
  function splitAntimeridian(dStr){
    const tokens = dStr.match(/[MLZ]|-?\d+(?:\.\d+)?/g);
    if(!tokens) return dStr;
    const out = [];
    let lastX = null, pendingMove = false;
    for(let i=0; i<tokens.length; i++){
      const t = tokens[i];
      if(t==='M' || t==='L'){
        const x = +tokens[i+1], y = +tokens[i+2];
        if(lastX!==null && Math.abs(x-lastX) > 500){
          // antimeridian wrap: break the polygon here, start a fresh sub-path
          out.push('M', x, y);
          pendingMove = false;
        } else {
          out.push(t, x, y);
        }
        lastX = x;
        i += 2;
      } else if(t==='Z'){
        out.push('Z');
        lastX = null;
      } else {
        out.push(t);
      }
    }
    return out.join(' ').replace(/([MLZ])\s+/g,'$1').replace(/\s+/g,' ');
  }
  // Render every Natural Earth country as a path
  const countryPaths = Object.entries(WORLD_COUNTRIES).map(([iso,c])=>{
    const active = !!COUNTRIES[iso];
    const cleanD = splitAntimeridian(c.d);
    return `<path class="country-path ${active?'active':''}" data-country="${iso}" d="${cleanD}"><title>${c.n}${active?' · '+COUNTRIES[iso].sx.toLocaleString()+' surgeries':''}</title></path>`;
  }).join('');

  // Country labels for our active markets
  const labels = Object.entries(COUNTRIES).map(([iso,c])=>`
    <g>
      <circle class="country-hit" data-country="${iso}" cx="${c.x}" cy="${c.y+14}" r="16"/>
      <text class="country-label" data-country="${iso}" x="${c.x}" y="${c.y+20}" text-anchor="middle">${c.flag} ${iso}</text>
    </g>`).join('');

  return `<svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
    <defs>
      <radialGradient id="oceanGrad" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#14256b" stop-opacity="0.5"/><stop offset="1" stop-color="#03061a" stop-opacity="0"/></radialGradient>
    </defs>
    <rect x="0" y="0" width="1000" height="500" fill="url(#oceanGrad)"/>
    ${countryPaths}
    ${dotSvg}
    ${labels}
  </svg>`;
}

/* --- Shared: equipment filter bar --- */
function eqFilterBar(){
  return `<div class="eq-filter">
    <span class="hint">Filter by biometry equipment:</span>
    <span class="eq-chip all active" data-eq="all" onclick="setEqFilter('all')">All</span>
    <span class="eq-chip sonomed" data-eq="sonomed" onclick="setEqFilter('sonomed')"><i class="sonomed"></i>SONOMED <small style="color:var(--text-3);font-weight:500">${'82'}%</small></span>
    <span class="eq-chip arcscan" data-eq="arcscan" onclick="setEqFilter('arcscan')"><i class="arcscan"></i>ARCSCAN <small style="color:var(--text-3);font-weight:500">${'3'}%</small></span>
    <span class="eq-chip quantel" data-eq="quantel" onclick="setEqFilter('quantel')"><i class="quantel"></i>QUANTEL <small style="color:var(--text-3);font-weight:500">${'15'}%</small></span>
  </div>`;
}

/* --- COMMAND CENTER (merged with ICL Universe Map) --- */
VIEWS.command = () => `
  <div class="topbar">
    <div class="top-title">
      <h1>Command Center<span class="tag"><span class="pulse"></span>LIVE · FY2026 Q2</span></h1>
      <p>Global real-time intelligence — every ICL implanted, in production, or in-pipeline worldwide. Click any country on the map for drill-down.</p>
    </div>
    <div class="top-actions">
      <div class="search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
        <input placeholder="Ask anything — e.g. EVO TICL growth in Japan vs Korea last 90d"/>
        <span class="kbd">⌘ K</span>
      </div>
      <div class="chip on">Last 90 days</div>
      <div class="chip">All regions</div>
    </div>
  </div>
  ${kpiRowHtml()}

  <div class="card" style="padding:14px 14px 16px;margin-top:16px">
    <div class="card-head">
      <h3>ICL Universe — global footprint</h3>
      <span class="sub">927 clinics · 78 countries · 12,040 certified surgeons</span>
      <div class="spacer"></div>
      <div class="tabs"><div class="tab active">By equipment</div><div class="tab">By volume</div><div class="tab">By growth</div></div>
    </div>
    <div class="map-wrap big">
      <div class="map-stage">${mapSvgHtml()}</div>
      <div class="map-legend">
        <div class="leg-title">What's on the map</div>
        <div class="legend-row"><div class="ic"><i class="sonomed"></i></div><span>SONOMED clinic</span><small>${TOTALS.eq.sonomed}</small></div>
        <div class="legend-row"><div class="ic"><i class="arcscan"></i></div><span>ARCSCAN clinic</span><small>${TOTALS.eq.arcscan}</small></div>
        <div class="legend-row"><div class="ic"><i class="quantel"></i></div><span>QUANTEL clinic</span><small>${TOTALS.eq.quantel}</small></div>
        <div class="legend-row"><div class="ic"><i class="sonomed big"></i></div><span>Dot size = surgery volume</span></div>
        <div class="legend-row"><div class="lr-pulse"></div><span>Top clinic / live OR</span></div>
        <div class="legend-row"><div class="lr-country"></div><span>Clickable country</span></div>
        <div class="legend-row"><div class="lr-flag">🇦🇷</div><span>Country code + flag</span></div>
      </div>
      <div class="map-stats">
        <div class="map-stat"><div class="k">Clinics</div><div class="v">${TOTALS.clinics}</div></div>
        <div class="map-stat"><div class="k">Surgeries · 6 mo</div><div class="v">${TOTALS.sx6mo.toLocaleString()}</div></div>
        <div class="map-stat"><div class="k">Countries</div><div class="v">${TOTALS.countries}</div></div>
      </div>
    </div>
    ${eqFilterBar()}
  </div>

  <div class="section" style="margin-top:16px">
    <div class="eq-breakdown">
      <div class="eq-card sonomed"><div class="h">SONOMED</div><div class="n">352 <small>clinics · 38%</small></div><div class="d">${EQ.sonomed.desc}. Dominant in LatAm, China mainland, India tier-2/3.</div></div>
      <div class="eq-card arcscan"><div class="h">ARCSCAN</div><div class="n">258 <small>clinics · 28%</small></div><div class="d">${EQ.arcscan.desc}. Concentrated in US, Korea, UK — premium / KOL clinics.</div></div>
      <div class="eq-card quantel"><div class="h">QUANTEL</div><div class="n">317 <small>clinics · 34%</small></div><div class="d">${EQ.quantel.desc}. Strongest in Europe, Japan, ME-private segments.</div></div>
    </div>
  </div>

  <div class="grid-2" style="margin-top:16px">
    <div class="card">
      <div class="card-head"><h3>Operations trend · 24 months stacked by continent</h3><span class="sub">EVO + EVO TICL</span><div class="spacer"></div><div class="tabs"><div class="tab">Volume</div><div class="tab active">Stacked</div><div class="tab">YoY %</div></div></div>
      <svg class="chart-svg" viewBox="0 0 700 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g-apac" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7f21e0" stop-opacity="0.75"/><stop offset="1" stop-color="#7f21e0" stop-opacity="0.05"/></linearGradient>
          <linearGradient id="g-eu" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4a9eff" stop-opacity="0.7"/><stop offset="1" stop-color="#4a9eff" stop-opacity="0.05"/></linearGradient>
          <linearGradient id="g-na" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity="0.65"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0.05"/></linearGradient>
          <linearGradient id="g-lat" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#10d48c" stop-opacity="0.6"/><stop offset="1" stop-color="#10d48c" stop-opacity="0.05"/></linearGradient>
          <linearGradient id="g-mea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fbbf24" stop-opacity="0.55"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0.05"/></linearGradient>
        </defs>
        <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
          <line x1="40" y1="30" x2="690" y2="30"/><line x1="40" y1="75" x2="690" y2="75"/><line x1="40" y1="120" x2="690" y2="120"/><line x1="40" y1="165" x2="690" y2="165"/><line x1="40" y1="200" x2="690" y2="200"/>
        </g>
        <g font-family="Inter" font-size="9" fill="rgba(236,239,255,0.4)"><text x="6" y="33">120k</text><text x="6" y="78">90k</text><text x="10" y="123">60k</text><text x="10" y="168">30k</text><text x="18" y="203">0</text></g>
        <path fill="url(#g-apac)" stroke="#a855f7" stroke-width="1.3" d="M 40 140 L 80 138 L 120 132 L 160 128 L 200 118 L 240 112 L 280 104 L 320 96 L 360 92 L 400 84 L 440 80 L 480 74 L 520 68 L 560 60 L 600 52 L 640 42 L 690 34 L 690 200 L 40 200 Z"/>
        <path fill="url(#g-eu)" stroke="#4a9eff" stroke-width="1.3" d="M 40 165 L 80 163 L 120 160 L 160 158 L 200 153 L 240 148 L 280 144 L 320 138 L 360 135 L 400 131 L 440 128 L 480 124 L 520 118 L 560 112 L 600 106 L 640 98 L 690 90 L 690 200 L 40 200 Z" opacity="0.85"/>
        <path fill="url(#g-na)" stroke="#22d3ee" stroke-width="1.2" d="M 40 180 L 80 178 L 120 177 L 160 174 L 200 172 L 240 168 L 280 165 L 320 162 L 360 158 L 400 155 L 440 150 L 480 147 L 520 143 L 560 138 L 600 132 L 640 126 L 690 120 L 690 200 L 40 200 Z" opacity="0.8"/>
        <path fill="url(#g-lat)" stroke="#10d48c" stroke-width="1.1" d="M 40 188 L 120 185 L 200 181 L 280 176 L 360 170 L 440 163 L 520 156 L 600 148 L 690 140 L 690 200 L 40 200 Z" opacity="0.75"/>
        <path fill="url(#g-mea)" stroke="#fbbf24" stroke-width="1.1" d="M 40 194 L 120 192 L 200 189 L 280 186 L 360 182 L 440 178 L 520 173 L 600 167 L 690 160 L 690 200 L 40 200 Z" opacity="0.7"/>
        <line x1="560" y1="30" x2="560" y2="200" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="565" y="40" font-family="Inter" font-size="9" fill="rgba(236,239,255,0.55)">Forecast →</text>
        <g font-family="Inter" font-size="9" fill="rgba(236,239,255,0.4)"><text x="40" y="215">Apr'24</text><text x="160" y="215">Oct'24</text><text x="280" y="215">Apr'25</text><text x="400" y="215">Oct'25</text><text x="520" y="215">Apr'26</text><text x="640" y="215">Oct'26</text></g>
      </svg>
      <div class="legend-inline">
        <span><i style="background:#a855f7"></i>Asia-Pacific</span>
        <span><i style="background:#4a9eff"></i>Europe</span>
        <span><i style="background:#22d3ee"></i>North America</span>
        <span><i style="background:#10d48c"></i>LatAm</span>
        <span><i style="background:#fbbf24"></i>MEA</span>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Global Rankings — top clinics</h3><span class="sub">Rolling 90 days</span><div class="spacer"></div><div class="tabs"><div class="tab active">Growth</div><div class="tab">Volume</div><div class="tab">PROMs</div></div></div>
      <div class="rank-list">
        <div class="rank-row"><div class="rank-num">01</div><div class="rank-name">REVAI Flagship — Buenos Aires<small>Dr. Diego Cerutti · 1,980 surgeries · ARCSCAN</small></div><div class="rank-val">+63%</div><div class="rank-delta up">▲ 22</div></div>
        <div class="rank-row"><div class="rank-num">02</div><div class="rank-name">BGI Vision Center — Seoul<small>Dr. Jin-woo Park · 3,284 surgeries · ARCSCAN</small></div><div class="rank-val">+41%</div><div class="rank-delta up">▲ 12</div></div>
        <div class="rank-row"><div class="rank-num">03</div><div class="rank-name">Beijing Tongren Hospital<small>Dr. Li Ming · 2,910 surgeries · QUANTEL</small></div><div class="rank-val">+38%</div><div class="rank-delta up">▲ 8</div></div>
        <div class="rank-row"><div class="rank-num">04</div><div class="rank-name">Shinagawa Keio — Tokyo<small>Dr. Kenji Okada · 2,641 surgeries · QUANTEL</small></div><div class="rank-val">+34%</div><div class="rank-delta up">▲ 5</div></div>
        <div class="rank-row"><div class="rank-num">05</div><div class="rank-name">Clínica Baviera — Madrid<small>Dra. María Trancón · 2,240 surgeries · QUANTEL</small></div><div class="rank-val">+29%</div><div class="rank-delta up">▲ 3</div></div>
        <div class="rank-row"><div class="rank-num">06</div><div class="rank-name">Dr. Agarwal's — Mumbai<small>Dr. Soosan Jacob · 2,105 surgeries · QUANTEL</small></div><div class="rank-val">+27%</div><div class="rank-delta up">▲ 7</div></div>
        <div class="rank-row"><div class="rank-num">07</div><div class="rank-name">Moorfields Private — London<small>Dr. Allan Slomovic · 1,812 surgeries · ARCSCAN</small></div><div class="rank-val">+14%</div><div class="rank-delta up">▲ 1</div></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="card-head"><h3>All countries</h3><span class="sub">click any row to open detail drawer</span><div class="spacer"></div><div class="tabs"><div class="tab active">All</div><div class="tab">APAC</div><div class="tab">EU</div><div class="tab">Americas</div></div></div>
    <table class="big-table">
      <thead><tr><th></th><th>Country</th><th>Clinics</th><th>Surgeries YTD</th><th>YoY</th><th>SONOMED</th><th>ARCSCAN</th><th>QUANTEL</th><th>PROMs</th></tr></thead>
      <tbody>
        ${Object.entries(COUNTRIES).sort((a,b)=>b[1].sx-a[1].sx).map(([iso,c])=>`
          <tr data-country="${iso}" style="cursor:pointer">
            <td style="width:24px">${c.flag}</td>
            <td><b>${c.n}</b></td>
            <td>${c.clinics}</td>
            <td>${c.sx.toLocaleString()}</td>
            <td><span class="rank-delta up">▲ ${Math.round((c.yoy != null ? c.yoy : 0.12)*100)}%</span></td>
            <td><span style="color:#8eeaf7;font-weight:700">${c.eq.sonomed}</span></td>
            <td><span style="color:#d1b4ff;font-weight:700">${c.eq.arcscan}</span></td>
            <td><span style="color:#f6d17a;font-weight:700">${c.eq.quantel}</span></td>
            <td>${c.promsAvg != null ? c.promsAvg : '—'} ★</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="foot-note" style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-top:16px">
    <span class="staar-chip" title="Powered by STAAR Surgical"><img src="${STAAR_LOGO}" alt="STAAR Surgical"/><span>Intelligence Partner</span></span>
    <span style="flex:1;min-width:300px"><b>Intelligence Layer methodology.</b> All numbers synthesized from: ICL Universe clinic registry · surgeon anonymized surgical telemetry · PROMs capture via REVAI Vault · STAAR manufacturing MES · customs/air-freight feeds · social listening (Meta, TikTok, Xiaohongshu, Weibo, Naver, Reddit, X) · regulatory gazettes (FDA, EMA, PMDA, NMPA, ANMAT, ANVISA). Demo values rounded. No PHI leaves the clinic.</span>
  </div>
`;

/* --- ICL UNIVERSE MAP merged into Command Center --- */
VIEWS.universe = VIEWS.command;

/* --- OPERATIONS PULSE --- */
VIEWS.pulse = () => `
  <div class="topbar">
    <div class="top-title"><h1>Operations Pulse<span class="tag"><span class="pulse"></span>LIVE · 86 ORs operating</span></h1><p>Real-time surgical activity across the global STAAR network.</p></div>
    <div class="top-actions"><div class="chip on">Live</div><div class="chip">Today</div><div class="chip">7d</div><div class="chip">30d</div></div>
  </div>
  ${kpiRowHtml()}
  <div class="grid-2" style="margin-top:4px">
    <div class="card">
      <div class="card-head"><h3>Live surgeries · rolling 60 minutes</h3><div class="spacer"></div><div class="tabs"><div class="tab active">Global</div><div class="tab">APAC</div><div class="tab">EU</div></div></div>
      <svg class="chart-svg" viewBox="0 0 700 220" preserveAspectRatio="none">
        <g stroke="rgba(255,255,255,0.06)"><line x1="40" y1="30" x2="690" y2="30"/><line x1="40" y1="90" x2="690" y2="90"/><line x1="40" y1="150" x2="690" y2="150"/><line x1="40" y1="200" x2="690" y2="200"/></g>
        <path fill="none" stroke="#22d3ee" stroke-width="2" d="M 40 180 L 80 170 L 120 150 L 160 160 L 200 140 L 240 135 L 280 120 L 320 130 L 360 110 L 400 95 L 440 105 L 480 85 L 520 80 L 560 75 L 600 70 L 640 58 L 680 50"/>
        <path fill="url(#g-pulse)" stroke="none" d="M 40 180 L 80 170 L 120 150 L 160 160 L 200 140 L 240 135 L 280 120 L 320 130 L 360 110 L 400 95 L 440 105 L 480 85 L 520 80 L 560 75 L 600 70 L 640 58 L 680 50 L 680 200 L 40 200 Z" opacity="0.4"/>
        <defs><linearGradient id="g-pulse" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity="0.6"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0.05"/></linearGradient></defs>
        <g font-family="Inter" font-size="9" fill="rgba(236,239,255,0.4)"><text x="40" y="215">-60m</text><text x="340" y="215">-30m</text><text x="640" y="215">now</text></g>
      </svg>
      <div style="font-size:11.5px;color:var(--text-2);margin-top:6px">438 completed in last hour · 86 ongoing · avg duration 14m 22s · uneventful 99.2%</div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Live ORs — click a clinic to watch</h3><span class="sub">86 active</span></div>
      <div class="rank-list">
        <div class="rank-row" data-country="KR" style="cursor:pointer"><div class="rank-num">●</div><div class="rank-name">BGI Vision Center — Seoul<small>Dr. Jin-woo Park · OR-3 · EVO TICL -13.50 D</small></div><div class="rank-val mono">08:42</div><div class="rank-delta up">LIVE</div></div>
        <div class="rank-row" data-country="JP" style="cursor:pointer"><div class="rank-num">●</div><div class="rank-name">Shinagawa Keio — Tokyo<small>Dr. Kenji Okada · OR-1 · EVO -8.00 D</small></div><div class="rank-val mono">12:18</div><div class="rank-delta up">LIVE</div></div>
        <div class="rank-row" data-country="CN" style="cursor:pointer"><div class="rank-num">●</div><div class="rank-name">Aier Eye Hospital — Shanghai<small>Dr. Wang Wei · OR-5 · EVO -10.00 D</small></div><div class="rank-val mono">03:51</div><div class="rank-delta up">LIVE</div></div>
        <div class="rank-row" data-country="AR" style="cursor:pointer"><div class="rank-num">●</div><div class="rank-name">REVAI Flagship — Buenos Aires<small>Dr. Diego Cerutti · OR-2 · EVO TICL -11.25 D</small></div><div class="rank-val mono">00:28</div><div class="rank-delta up">LIVE</div></div>
        <div class="rank-row" data-country="ES" style="cursor:pointer"><div class="rank-num">●</div><div class="rank-name">Clínica Baviera — Madrid<small>Dra. María Trancón · OR-1 · EVO -6.00 D</small></div><div class="rank-val mono">11:04</div><div class="rank-delta up">LIVE</div></div>
        <div class="rank-row" data-country="AE" style="cursor:pointer"><div class="rank-num">●</div><div class="rank-name">Moorfields Dubai<small>Dr. Amr Hassouna · OR-2 · EVO -9.50 D</small></div><div class="rank-val mono">06:22</div><div class="rank-delta up">LIVE</div></div>
        <div class="rank-row" data-country="US" style="cursor:pointer"><div class="rank-num">●</div><div class="rank-name">Maloney Shamie — Los Angeles<small>Dr. Neda Shamie · OR-1 · EVO -7.00 D</small></div><div class="rank-val mono">02:41</div><div class="rank-delta up">LIVE</div></div>
        <div class="rank-row" data-country="IN" style="cursor:pointer"><div class="rank-num">●</div><div class="rank-name">Narayana Nethralaya — Bengaluru<small>Dr. Rohit Shetty · OR-4 · EVO TICL -14.00 D</small></div><div class="rank-val mono">05:10</div><div class="rank-delta up">LIVE</div></div>
      </div>
    </div>
  </div>
`;

/* --- LENS SUPPLY CHAIN --- */
VIEWS.supply = () => `
  <div class="topbar">
    <div class="top-title"><h1>Lens Supply Chain<span class="tag"><span class="pulse"></span>REAL-TIME · 38.4d supply</span></h1><p>Every ICL in the world — from order to implantation, live.</p></div>
    <div class="top-actions"><div class="chip on">All SKUs</div><div class="chip">EVO</div><div class="chip">EVO TICL</div><div class="chip">EVO+</div></div>
  </div>
  <div class="card">
    <div class="card-head"><h3>Pipeline — every ICL in the world</h3><span class="sub">SKU-level tracking</span></div>
    <div class="kanban">
      <div class="kcol ordered">
        <div class="kcol-head"><span class="t">Ordered</span><span class="n">48,210</span></div>
        <div class="kcard"><span class="k1">Shinagawa Keio</span><span class="k2">Tokyo · JP</span><span class="k3"><span class="pill toric">EVO TICL</span>× 620</span></div>
        <div class="kcard"><span class="k1">BGI Vision Center</span><span class="k2">Seoul · KR</span><span class="k3"><span class="pill evo">EVO</span>× 480 <span class="pill urgent">rush</span></span></div>
        <div class="kcard"><span class="k1">Clínica Baviera</span><span class="k2">Madrid · ES</span><span class="k3"><span class="pill evo">EVO</span>× 310</span></div>
        <div class="kcard"><span class="k1">Emory Vision</span><span class="k2">Atlanta · US</span><span class="k3"><span class="pill toric">EVO TICL</span>× 180</span></div>
      </div>
      <div class="kcol production">
        <div class="kcol-head"><span class="t">In production</span><span class="n">62,840</span></div>
        <div class="kcard"><span class="k1">Batch #A-7712</span><span class="k2">EVO TICL · -12.50 D</span><span class="k3">ETA 4d · 2,140 units</span></div>
        <div class="kcard"><span class="k1">Batch #A-7714</span><span class="k2">EVO · -6.00 D</span><span class="k3">ETA 2d · 1,880 units</span></div>
        <div class="kcard"><span class="k1">Custom series CN</span><span class="k2">EVO TICL · 44 SKUs</span><span class="k3"><span class="pill new">new</span>ETA 6d</span></div>
        <div class="kcard"><span class="k1">Batch #A-7716</span><span class="k2">EVO · -9.00 D</span><span class="k3">ETA 3d · 1,560 units</span></div>
      </div>
      <div class="kcol transit">
        <div class="kcol-head"><span class="t">In transit</span><span class="n">28,105</span></div>
        <div class="kcard"><span class="k1">Nidau → Tokyo</span><span class="k2">Air freight · 4,200 lenses</span><span class="k3">Arrives tomorrow 09:40</span></div>
        <div class="kcard"><span class="k1">Monrovia → Bogotá</span><span class="k2">Air freight · 980 lenses</span><span class="k3">Arrives in 3d</span></div>
        <div class="kcard"><span class="k1">Monrovia → Buenos Aires</span><span class="k2">Air freight · 1,240 lenses</span><span class="k3">Arrives in 2d</span></div>
      </div>
      <div class="kcol delivered">
        <div class="kcol-head"><span class="t">At clinic</span><span class="n">14,920</span></div>
        <div class="kcard"><span class="k1">Emory Vision</span><span class="k2">Atlanta · 114 lenses</span><span class="k3">Median wait 3.1d</span></div>
        <div class="kcard"><span class="k1">Moorfields Private</span><span class="k2">London · 82 lenses</span><span class="k3">Median wait 4.8d</span></div>
        <div class="kcard"><span class="k1">REVAI Buenos Aires</span><span class="k2">76 lenses</span><span class="k3">Median wait 2.4d</span></div>
      </div>
      <div class="kcol implanted">
        <div class="kcol-head"><span class="t">Implanted 24h</span><span class="n">3,418</span></div>
        <div class="kcard"><span class="k1">86 ORs live now</span><span class="k2">Avg duration 14m 22s</span><span class="k3">Uneventful 99.2%</span></div>
        <div class="kcard"><span class="k1">Top SKU today</span><span class="k2">EVO -8.00 D · 612 lenses</span><span class="k3">APAC 68% · EU 22%</span></div>
      </div>
    </div>
  </div>

  <div class="grid-2" style="margin-top:16px">
    <div class="card">
      <div class="card-head"><h3>Manufacturing capacity</h3><span class="sub">Monrovia + Nidau</span></div>
      <div class="dr-stat-grid">
        <div class="dr-stat"><div class="k">Monrovia utilization</div><div class="v">91%</div><div class="d neg">Above safe ceiling</div></div>
        <div class="dr-stat"><div class="k">Nidau utilization</div><div class="v">73%</div><div class="d">Headroom 3 weeks</div></div>
        <div class="dr-stat"><div class="k">WIP in process</div><div class="v">62,840</div><div class="d">ETA 2-8 days</div></div>
        <div class="dr-stat"><div class="k">Reject rate</div><div class="v">0.42%</div><div class="d">Best-in-class</div></div>
      </div>
      <div class="dr-alert" style="margin-top:12px">Supply Chain Twin: Monrovia disruption &gt; 24h would push DoS to 28.1 (floor 30). Recommend activating Nidau overflow line.</div>
    </div>
    <div class="card">
      <div class="card-head"><h3>SKU top 10 · last 30 days</h3></div>
      <table class="big-table">
        <thead><tr><th>SKU</th><th>Units</th><th>YoY</th></tr></thead>
        <tbody>
          <tr><td>EVO -8.00 D</td><td>48,210</td><td><span class="rank-delta up">▲ 22%</span></td></tr>
          <tr><td>EVO -6.00 D</td><td>41,820</td><td><span class="rank-delta up">▲ 18%</span></td></tr>
          <tr><td>EVO TICL -10.00 / -2.00×90</td><td>28,410</td><td><span class="rank-delta up">▲ 34%</span></td></tr>
          <tr><td>EVO -10.00 D</td><td>24,180</td><td><span class="rank-delta up">▲ 12%</span></td></tr>
          <tr><td>EVO TICL -12.50 D</td><td>18,210</td><td><span class="rank-delta up">▲ 41%</span></td></tr>
          <tr><td>EVO -4.00 D</td><td>14,820</td><td><span class="rank-delta up">▲ 8%</span></td></tr>
          <tr><td>EVO TICL -14.00 D</td><td>11,240</td><td><span class="rank-delta up">▲ 52%</span></td></tr>
          <tr><td>EVO -12.00 D</td><td>9,820</td><td><span class="rank-delta up">▲ 9%</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>
`;

/* --- SOCIAL LISTENING --- */
VIEWS.social = () => `
  <div class="topbar">
    <div class="top-title"><h1>Social Listening</h1><p>1.8M posts across Meta, TikTok, Xiaohongshu, Weibo, Naver, Reddit, X · last 7 days.</p></div>
    <div class="top-actions"><div class="chip on">All platforms</div><div class="chip">Global</div></div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-head"><h3>Topic cloud</h3><span class="sub">size = volume · red = negative sentiment</span></div>
      <div class="chips-cloud">
        <span class="sz4">#EVOICL</span><span class="sz4">recovery time</span><span class="sz3">no dry eye</span><span class="sz3">same-day vision</span><span class="sz3">vs LASIK</span><span class="sz3">price Seoul</span><span class="sz2">reversible</span><span class="sz2">night halos</span><span class="sz2">military pilot</span><span class="sz3 neg">halos at night</span><span class="sz2">best surgeon Tokyo</span><span class="sz2">gaming vision</span><span class="sz2">astigmatism correction</span><span class="sz2 neg">cataract risk</span><span class="sz2">K-pop idol testimony</span><span class="sz3">reddit r/lasik</span><span class="sz2">insurance USA</span><span class="sz1">presbyopia option</span><span class="sz1">EVO+ launch</span><span class="sz1">pediatric myopia</span>
      </div>
      <div class="sent-grid">
        <div class="sent"><div class="rg">APAC</div><div class="val">+0.72</div><div class="bar"><span class="s" style="width:86%"></span></div></div>
        <div class="sent"><div class="rg">Europe</div><div class="val">+0.58</div><div class="bar"><span class="s" style="width:78%"></span></div></div>
        <div class="sent"><div class="rg">N. America</div><div class="val">+0.41</div><div class="bar"><span class="s" style="width:66%"></span></div></div>
        <div class="sent"><div class="rg">LatAm</div><div class="val">+0.63</div><div class="bar"><span class="s" style="width:80%"></span></div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Trending drivers this week</h3></div>
      <div class="feed" style="max-height:none">
        <div class="insight opp"><div class="topline"><span class="tag">Opportunity</span><span class="time">APAC</span></div><div class="t">Song Hye-kyo mentioned EVO on variety show</div><div class="d">+640K mentions APAC · sentiment +0.84 · peaked on Apr 17. Seoul clinics reporting 3x inbound leads.</div></div>
        <div class="insight alert"><div class="topline"><span class="tag">Alert</span><span class="time">CN</span></div><div class="t">"Night halos" mentions +21% Shanghai/Guangzhou</div><div class="d">Concentrated on clinics using batch #A-7698. No PROMs deterioration yet. Surgeon note drafted.</div></div>
        <div class="insight opp"><div class="topline"><span class="tag">Opportunity</span><span class="time">US</span></div><div class="t">Reddit r/lasik thread — 4.2K upvotes comparing EVO to SMILE</div><div class="d">Overwhelmingly positive. Suggests social-proof content push on YouTube via REVAI surgeon network.</div></div>
        <div class="insight opp"><div class="topline"><span class="tag">Opportunity</span><span class="time">BR</span></div><div class="t">ANVISA expansion — local surgeons posting</div><div class="d">Portuguese TikTok content by Dr. Wallace Chamon +2.1M views in 3 days. Amplify with co-branded STAAR kit.</div></div>
        <div class="insight alert"><div class="topline"><span class="tag">Alert</span><span class="time">FR</span></div><div class="t">Negative sentiment on pricing (Paris clinics)</div><div class="d">Spike in "trop cher" queries +18%. Benchmark shows FR prices 22% above EU median.</div></div>
      </div>
    </div>
  </div>
`;

/* --- MARKET SCANNER --- */
VIEWS.market = () => `
  <div class="topbar"><div class="top-title"><h1>Market Scanner</h1><p>Refractive procedure mix worldwide — ICL vs LASIK vs SMILE vs PRK.</p></div><div class="top-actions"><div class="chip on">Q1 26</div><div class="chip">Trailing 12m</div></div></div>
  <div class="grid-2">
    <div class="card">
      <div class="card-head"><h3>Procedure share by continent</h3><span class="sub">Q1 26 estimated</span></div>
      <table class="big-table">
        <thead><tr><th>Region</th><th>ICL</th><th>LASIK</th><th>SMILE</th><th>PRK</th><th>ICL trend</th></tr></thead>
        <tbody>
          <tr><td><b>Asia-Pacific</b></td><td>32%</td><td>34%</td><td>28%</td><td>6%</td><td><span class="rank-delta up">▲ 4.1 pts</span></td></tr>
          <tr><td><b>Europe</b></td><td>24%</td><td>42%</td><td>22%</td><td>12%</td><td><span class="rank-delta up">▲ 2.2 pts</span></td></tr>
          <tr><td><b>North America</b></td><td>18%</td><td>58%</td><td>14%</td><td>10%</td><td><span class="rank-delta up">▲ 1.8 pts</span></td></tr>
          <tr><td><b>LatAm</b></td><td>22%</td><td>48%</td><td>18%</td><td>12%</td><td><span class="rank-delta up">▲ 3.2 pts</span></td></tr>
          <tr><td><b>MEA</b></td><td>28%</td><td>44%</td><td>20%</td><td>8%</td><td><span class="rank-delta up">▲ 2.4 pts</span></td></tr>
        </tbody>
      </table>
      <div style="font-size:11.5px;color:var(--text-3);margin-top:10px">Source: clearinghouse data · 14 countries tier-1 signal · 44 tier-2 modeled. Strongest ICL share gain in APAC driven by high-myopia prevalence and celebrity adoption.</div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Competitive signals</h3></div>
      <div class="feed" style="max-height:none">
        <div class="insight opp"><div class="topline"><span class="tag">Opportunity</span><span class="time">KR</span></div><div class="t">SMILE volume down 11% QoQ in Korea — ICL share +3.2 pts</div><div class="d">Surgeons reporting patient shift to ICL driven by reversibility and myopia ceiling. Front-load DTC campaign and surgeon incentive in Seoul + Busan.</div></div>
        <div class="insight opp"><div class="topline"><span class="tag">Opportunity</span><span class="time">US</span></div><div class="t">Alcon SMILE launch delayed by 6 months — window open</div><div class="d">FDA stated no new premarket before Q4. Accelerate US DTC + surgeon recruiting spend while gap is open.</div></div>
        <div class="insight alert"><div class="topline"><span class="tag">Alert</span><span class="time">EU</span></div><div class="t">Competitor price drops in Germany + Benelux</div><div class="d">EuroEyes cut LASIK package -18%. EU-ICL price premium now 3.4x. Review clinic discount programs.</div></div>
      </div>
    </div>
  </div>
`;

/* --- SURGEON RANKINGS --- */
VIEWS.rankings = () => {
  const m = RANK_STATE.mode;           // 'volume' | 'proms' | 'growth'
  const r = RANK_STATE.region;         // 'all' | 'APAC' | 'EU' | 'Americas'
  const metricMeta = {
    volume: { title:'By volume',  col:'Volume 90d',        fmt:v=>v.toLocaleString(),          sub:'Total surgeries (rolling 90 days)' },
    proms:  { title:'By PROMs',   col:'PROMs score',       fmt:v=>v.toFixed(1),                sub:'Patient-reported outcome · blended' },
    growth: { title:'By growth',  col:'Growth vs prior 90d',fmt:v=>(v>=0?'+':'')+v.toFixed(1)+'%', sub:'QoQ change in implant volume' }
  };
  const meta = metricMeta[m];
  const regionFilter = s => r==='all' || s.region===r;
  const key = m==='volume' ? 'vol' : m==='proms' ? 'proms' : 'growth';
  const rows = SURGEONS.filter(regionFilter).slice().sort((a,b)=>b[key]-a[key]);
  const maxVal = Math.max(...rows.map(s=>s[key]), 1);
  const minVal = Math.min(...rows.map(s=>s[key]), 0);
  // Bar renderer scales relative to metric range
  const bar = (v)=>{
    const pct = m==='growth'
      ? Math.max(0, Math.min(100, (v-minVal)/(maxVal-minVal+0.0001)*100))
      : (v/maxVal)*100;
    const color = m==='growth' ? (v>=20?'#10d48c':v>=10?'#22d3ee':v>=0?'#4a9eff':'#ff5a7a')
                 : m==='proms' ? (v>=95?'#10d48c':v>=93?'#22d3ee':'#4a9eff')
                 : '#7f21e0';
    return `<div style="height:6px;width:100%;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;min-width:80px"><div style="height:100%;width:${pct.toFixed(1)}%;background:${color};border-radius:3px;box-shadow:0 0 8px ${color}55"></div></div>`;
  };
  // KPIs across filter
  const medianVol = rows.length ? Math.round(rows.map(s=>s.vol).sort((a,b)=>a-b)[Math.floor(rows.length/2)]) : 0;
  const avgProms = rows.length ? (rows.reduce((a,s)=>a+s.proms,0)/rows.length).toFixed(1) : '—';
  const avgGrowth = rows.length ? (rows.reduce((a,s)=>a+s.growth,0)/rows.length).toFixed(1) : '—';
  const totalVol = rows.reduce((a,s)=>a+s.vol,0).toLocaleString();
  return `
  <div class="topbar">
    <div class="top-title"><h1>Surgeon Rankings</h1><p>Rolling 90 days · ${meta.sub}.</p></div>
    <div class="top-actions">
      <div class="chip ${m==='volume'?'on':''}" onclick="setRankMode('volume')">By volume</div>
      <div class="chip ${m==='proms'?'on':''}"  onclick="setRankMode('proms')">By PROMs</div>
      <div class="chip ${m==='growth'?'on':''}" onclick="setRankMode('growth')">By growth</div>
    </div>
  </div>
  <div class="kpi-row" style="margin-bottom:14px">
    <div class="kpi"><div class="k">Surgeons shown</div><div class="v">${rows.length}</div><div class="d">Region: <b>${r==='all'?'Global':r}</b></div></div>
    <div class="kpi"><div class="k">Total volume 90d</div><div class="v">${totalVol}</div><div class="d">Implants completed</div></div>
    <div class="kpi"><div class="k">Median volume</div><div class="v">${medianVol.toLocaleString()}</div><div class="d">Per surgeon (90d)</div></div>
    <div class="kpi"><div class="k">Avg PROMs</div><div class="v">${avgProms}</div><div class="d">Composite score</div></div>
    <div class="kpi"><div class="k">Avg growth</div><div class="v ${parseFloat(avgGrowth)>=0?'pos':'neg'}">${parseFloat(avgGrowth)>=0?'+':''}${avgGrowth}%</div><div class="d">vs prior 90d</div></div>
  </div>
  <div class="card">
    <div class="card-head">
      <h3>${meta.title} — global leaderboard</h3>
      <span class="sub">${rows.length} listed · sorted ${m==='growth'?'by growth':m==='proms'?'by PROMs':'by volume'}</span>
      <div class="spacer"></div>
      <div class="tabs">
        <div class="tab ${r==='all'?'active':''}"       onclick="setRankRegion('all')">All</div>
        <div class="tab ${r==='APAC'?'active':''}"      onclick="setRankRegion('APAC')">APAC</div>
        <div class="tab ${r==='EU'?'active':''}"        onclick="setRankRegion('EU')">EU · MEA</div>
        <div class="tab ${r==='Americas'?'active':''}"  onclick="setRankRegion('Americas')">Americas</div>
      </div>
    </div>
    <table class="big-table">
      <thead><tr>
        <th style="width:36px"></th>
        <th>Surgeon</th>
        <th>Clinic</th>
        <th>Country</th>
        <th>Equipment</th>
        <th style="width:200px">${meta.col}</th>
        <th style="text-align:right">${m==='volume'?'PROMs':'Volume 90d'}</th>
      </tr></thead>
      <tbody>
        ${rows.slice(0,25).map((s,i)=>`
          <tr data-iso="${s.iso}" style="cursor:pointer" onclick='openSurgeonByName(${JSON.stringify(s.n)})'>
            <td class="mono" style="color:var(--text-3)">${String(i+1).padStart(2,'0')}</td>
            <td><b>${s.n}</b><div style="font-size:11px;color:var(--text-3);margin-top:1px">${s.spec}</div></td>
            <td>${s.clinic}</td>
            <td>${s.flag} ${s.country}</td>
            <td><span class="dr-clinic-eq ${s.eq}">${EQ[s.eq].n}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                ${bar(s[key])}
                <b style="min-width:72px;text-align:right;font-feature-settings:'tnum'">${meta.fmt(s[key])}</b>
              </div>
            </td>
            <td style="text-align:right;font-feature-settings:'tnum'">
              ${m==='volume' ? `<span style="color:${s.proms>=95?'var(--green)':s.proms>=93?'#22d3ee':'var(--text-2)'}">${s.proms.toFixed(1)}</span>`
                            : `<span>${s.vol.toLocaleString()}</span>`}
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
    ${rows.length===0 ? `<div style="padding:24px;text-align:center;color:var(--text-3)">No surgeons in this region filter.</div>` : ''}
  </div>
  <div class="card" style="margin-top:14px;padding:14px 16px">
    <div class="card-head"><h3>Methodology</h3></div>
    <p style="font-size:12px;color:var(--text-2);line-height:1.6;margin:6px 0 0">
      <b>Volume</b> is total ICL/TICL implantations over the rolling 90-day window, per credentialed surgeon, from clinic surgical telemetry. 
      <b>PROMs score</b> is a blended 0–100 composite of patient-reported uncorrected visual acuity, quality-of-life (NEI VFQ-25), night-vision, and 30-day satisfaction — captured via the REVAI Vault. 
      <b>Growth</b> is QoQ change in implant volume vs the prior 90-day window. All data anonymized · no PHI leaves the clinic · real surgeon names sourced from each clinic's public roster.
    </p>
  </div>`;
};

function setRankMode(m){ RANK_STATE.mode = m; showView('rankings'); }
function setRankRegion(r){ RANK_STATE.region = r; showView('rankings'); }

/* --- REGULATORY TRACKER --- */
VIEWS.regulatory = () => `
  <div class="topbar"><div class="top-title"><h1>Regulatory Tracker<span class="tag"><span class="pulse"></span>3 pending review</span></h1><p>Automated monitoring of FDA · EMA · PMDA · NMPA · ANMAT · ANVISA · MHRA + 14 others.</p></div></div>
  <div class="card">
    <div class="card-head"><h3>Recent updates</h3></div>
    <div class="feed" style="max-height:none">
      <div class="insight alert"><div class="topline"><span class="tag">New</span><span style="font-size:10.5px;color:var(--text-3)">ANVISA · Brazil 🇧🇷</span><span class="time">3h ago</span></div><div class="t">EVO TICL indication expanded to -18.00 D</div><div class="d">Effective 22 Apr. Adds ~18K addressable patients/year. Surgeon-comms draft ready for 12 clinics. PT-BR PROMs template updated.</div><div class="btn-row"><button class="btn primary">Approve comms</button><button class="btn">View gazette</button></div></div>
      <div class="insight alert"><div class="topline"><span class="tag">New</span><span style="font-size:10.5px;color:var(--text-3)">FDA · US 🇺🇸</span><span class="time">6d ago</span></div><div class="t">Age indication lowered to 21 (EVO)</div><div class="d">340K new addressable patients. Surgeon webinar scheduled. Consumer campaign draft pending brand approval.</div><div class="btn-row"><button class="btn primary">Approve campaign</button><button class="btn">Draft details</button></div></div>
      <div class="insight opp"><div class="topline"><span class="tag">Watch</span><span style="font-size:10.5px;color:var(--text-3)">NMPA · China 🇨🇳</span><span class="time">2w ago</span></div><div class="t">EVO+ presbyopia submission accepted for review</div><div class="d">Target decision Q3 26. China would be first market for EVO+. Commercial team briefed.</div></div>
      <div class="insight opp"><div class="topline"><span class="tag">Watch</span><span style="font-size:10.5px;color:var(--text-3)">EMA · Europe 🇪🇺</span><span class="time">3w ago</span></div><div class="t">MDR transition deadline confirmed Q1 27</div><div class="d">All STAAR products currently CE-marked and compliant. No action required but reminder logged.</div></div>
      <div class="insight risk"><div class="topline"><span class="tag">Risk</span><span style="font-size:10.5px;color:var(--text-3)">PMDA · Japan 🇯🇵</span><span class="time">1m ago</span></div><div class="t">Post-market surveillance rate increase consultation</div><div class="d">PMDA proposing higher clinician reporting cadence for premium IOLs. Could impact surgeon admin burden. Lobbying in progress via JSCRS.</div></div>
    </div>
  </div>
`;

/* --- COMMUNITY (mirrored from REVAI clinic dashboard, read-only) --- */
const VERIFIED_SVG = `<svg class="verified" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 2.3 3.3-.3.3 3.3L20.3 10l-2.3 2.4.3 3.3-3.3.3L12 18l-2.4-2-3.3-.3-.3-3.3L3.7 10l2.3-2.4-.3-3.3 3.3-.3zm-1 11.4l5-5-1.4-1.4-3.6 3.6-1.8-1.8-1.4 1.4 3.2 3.2z"/></svg>`;
function cmtyPostHtml(f){
  const commentsHtml = (f.topComments||[]).map(c=>`
    <div class="cmty-comment">
      <div class="av">${c.av}</div>
      <div style="flex:1">
        <div class="bubble"><b>${c.name}</b>${c.body}</div>
        <div class="cmty-comment-meta"><span>${c.time} ago</span><span>${c.likes} likes</span><span>Reply</span></div>
      </div>
    </div>`).join('');
  const liked = f.likes>500 ? 'style="color:#ff5a7a"' : '';
  return `<div class="cmty-post">
    <div class="cmty-post-head">
      <div class="av">${f.av}</div>
      <div>
        <div class="name">${f.name}${f.verified?VERIFIED_SVG:''}</div>
        <div class="meta">${f.role} · ${f.time} ago · <span class="anon">Anonymized case</span></div>
      </div>
      <button class="more" title="More"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>
    </div>
    <div class="cmty-post-body">${f.body}</div>
    ${f.hasMedia?`<div class="cmty-post-media"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><span class="plabel">${f.mediaLabel}</span></div>`:''}
    <div class="cmty-post-stats">
      <span><b>${f.likes}</b> likes</span>
      <span><b>${f.comments}</b> comments</span>
      <span><b>${f.shares}</b> shares</span>
      <span style="margin-left:auto">${f.views} views</span>
    </div>
    <div class="cmty-post-actions">
      <button ${liked}><svg viewBox="0 0 24 24" fill="${f.likes>500?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 000-7.78z"/></svg>Like</button>
      <button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>Comment</button>
      <button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>Share</button>
      <button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>Save</button>
    </div>
    ${commentsHtml?`<div style="padding-top:4px;border-top:1px dashed var(--line)">${commentsHtml}</div>`:''}
  </div>`;
}
VIEWS.community = () => {
  const postsHtml = COMMUNITY_FEED.map(cmtyPostHtml).join('');
  const storiesHtml = COMMUNITY_STORIES.map(s=>`
    <div class="cmty-story">
      <div class="cmty-ring ${s.state==='viewed'?'viewed':''}"><div class="inner">${s.av}</div></div>
      <div class="nm">${s.name}</div>
    </div>`).join('');
  const trendingHtml = COMMUNITY_TRENDING.map(t=>`
    <div class="cmty-trend-item"><div class="cat">${t.cat}</div><div class="tag">${t.tag}</div><div class="posts">${t.posts}</div></div>`).join('');
  const followHtml = COMMUNITY_WHO_TO_FOLLOW.map(w=>`
    <div class="cmty-follow-item">
      <div class="av">${w.av}</div>
      <div style="flex:1;min-width:0"><div class="name">${w.name}</div><div class="sub">${w.sub}</div></div>
      <button class="cmty-follow-btn">Follow</button>
    </div>`).join('');
  const totalPosts = COMMUNITY_FEED.length;
  const totalLikes = COMMUNITY_FEED.reduce((a,f)=>a+f.likes,0);
  const totalComments = COMMUNITY_FEED.reduce((a,f)=>a+f.comments,0);
  return `
  <div class="topbar">
    <div class="top-title"><h1>Community</h1><p>The clinic-facing REVAI network — mirrored here, read-only. 412 surgeons online · ${totalPosts} new posts · ${totalLikes} reactions · ${totalComments} comments this hour.</p></div>
    <div class="top-actions"><div class="chip on">Global feed</div><div class="chip">My regions</div><div class="chip">#ICL500Club</div></div>
  </div>
  <div class="cmty-banner">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 8v4M12 16h.01"/></svg>
    <div>STAAR view · this is the same <b>Community</b> clinics see inside their REVAI dashboard. All content is <b>anonymized</b> (no PHI). Posting, commenting and DMs are disabled from STAAR Intelligence Center — this is a read-only peer-signal window.</div>
  </div>
  <div class="cmty-wrap">
    <div>
      <div class="cmty-stories">${storiesHtml}</div>
      ${postsHtml}
    </div>
    <aside class="cmty-side">
      <div class="cmty-card">
        <h4>Trending now</h4>
        ${trendingHtml}
      </div>
      <div class="cmty-card">
        <h4>Rising surgeons</h4>
        ${followHtml}
      </div>
      <div class="cmty-card" style="background:linear-gradient(180deg,rgba(127,33,224,0.1),rgba(34,211,238,0.06));border-color:rgba(127,33,224,0.28)">
        <h4 style="color:#cda8ff">Why STAAR sees this</h4>
        <div style="font-size:11.5px;color:var(--text-2);line-height:1.55">Community signals surface <b style="color:#ecebff">early adopter behaviour</b> and <b style="color:#ecebff">workflow pain points</b> weeks before they register in PROMs or MES. Regulatory, clinical and BD agents monitor this feed for leading indicators.</div>
      </div>
    </aside>
  </div>
`;
};

/* --- AGENTS --- */
const AGENTS = [
  {
    id:'DF', name:'Demand Forecaster', av:'cyan', status:'live', layer:'Production',
    does:'Predicts <b>ICL + TICL demand per SKU × country × clinic</b> on a rolling 90-day horizon, blending macro indicators, cataract pipeline, weather, school/military cycles, and surgeon learning curves. Output: allocation-ready forecast per lens batch.',
    stats:[['Forecast runs','4,218','good'],['MAPE (accuracy)','4.1%','good'],['Last run','2m ago','']],
    result:{ title:'Latest forecast · FY2026 Q3', body:'Projecting <b>+18% YoY</b> in <code>APAC EVO+</code>; flagged undershoot in <code>Mexico EVO TICL</code> (−7% vs baseline). Recommends pulling 2,200 units forward from the Madrid DC to Seoul before May 12.' }
  },
  {
    id:'SE', name:'Surgeon Enablement', av:'rose', status:'live', layer:'Production',
    does:'Monitors every credentialed surgeon\'s <b>learning-curve inflection points</b> from PROMs + intra-op video tags + complication rates, then books VR simulation and live proctorship automatically to unlock higher-volume privileges.',
    stats:[['Surgeons tracked','1,214',''],['Flagged this week','87','warn'],['Bookings today','23','good']],
    result:{ title:'Latest intervention', body:'Detected plateau in <code>Dr. Ansari (UAE)</code> — 11 cases, rotation drift &gt;8° in 3 of last 5. Auto-booked VR sim + Dr. Higueras proctor session for May 3. Confidence <b>92%</b> plateau will clear post-session.' }
  },
  {
    id:'AE', name:'Adverse Event Sentinel', av:'amber', status:'warn', layer:'Production',
    does:'Runs <b>multilingual NLP</b> over surgeon notes, PROMs free-text, Reddit/X, medical listservs, and MedDRA feeds to surface <b>early safety signals</b> weeks before they would register in formal pharmacovigilance channels.',
    stats:[['Sources monitored','42',''],['Signals in review','3','warn'],['Escalated (YTD)','0','good']],
    result:{ title:'3 signals pending MA review', body:'Cluster detected: 4 patients in <code>Mendoza AR</code> reporting "glare halo &gt;6 months" post EVO-VICMO implant. Cross-referenced against supplier lot <code>L-2408-AR</code>. Awaiting MA triage — P1 priority.' }
  },
  {
    id:'CI', name:'Competitive Intel', av:'', status:'live', layer:'Production',
    does:'Tracks <b>LASIK / SMILE / PRK</b> procedure volumes, pricing, and ad-spend by region across clinic aggregators, insurance feeds, and social listening. Tells BD where the share-of-voice gap is opening.',
    stats:[['Regions tracked','48',''],['Data feeds','17',''],['Refreshed','11m ago','']],
    result:{ title:'Opportunity detected', body:'<code>SMILE -11% QoQ in Korea</code> (ZEISS market letter + Naver search drop). Competitive map refreshed — flagged Seoul as top EVO+ share-capture target. Suggested campaign budget: <b>$240K</b> / 8 weeks.' }
  },
  {
    id:'RT', name:'Regulatory Tracker', av:'', status:'warn', layer:'Production',
    does:'Reads every <b>global gazette, FDA/ANVISA/PMDA/NMPA docket, and EU MDR update</b>, classifies impact on STAAR portfolio, drafts regulatory impact briefs, and routes to Medical Affairs.',
    stats:[['Jurisdictions','34',''],['Briefs drafted (YTD)','128',''],['Pending review','3','warn']],
    result:{ title:'3 briefs awaiting review', body:'New <code>ANVISA Resolution 751/2026</code> expands EVO TICL to age 18–21 in Brazil. Drafted impact brief + communications pack for 37 surgeons in the region. Routed to Dr. Costa.' }
  },
  {
    id:'DA', name:'Dynamic Allocation', av:'green', status:'live', layer:'Production',
    does:'Reassigns lens batches across <b>continental DCs in near-real-time</b> to protect stock where demand accelerates. Optimizes freight + customs + shelf-life tradeoffs under a multi-objective model.',
    stats:[['Pull-forwards today','2','good'],['Stock-out risk','0.4%','good'],['Cost avoided','$184K','good']],
    result:{ title:'Executed today', body:'Pull-forward <code>2,200× EVO TICL</code> Madrid DC → Seoul DC. ETA May 8. Approved by Ops VP (K. Watanabe) at 09:14 UTC. Stock-out risk in APAC drops from <b>3.1%</b> to <b>0.4%</b>.' }
  },
  {
    id:'PI', name:'Pricing Intelligence', av:'', status:'live', layer:'Production',
    does:'Surfaces <b>clinic-level price variance, rebate leakage, and margin health</b>. Benchmarks against regional cohort + surgeon case-mix. Flags anomalies to Commercial before quarter-end.',
    stats:[['Clinics priced','1,214',''],['Anomalies flagged','7','warn'],['Margin recovered (YTD)','$1.2M','good']],
    result:{ title:'Margin compression — France', body:'<code>8 clinics in FR</code> now discounting EVO TICL more than 14% below regional median. Projected margin leak <b>€420K in Q3</b>. Brief sent to FR Commercial lead.' }
  },
  {
    id:'KO', name:'KOL Scout', av:'', status:'beta', layer:'Beta',
    does:'Surfaces <b>rising surgeon influencers</b> across peer-reviewed pubs, conference abstracts, LinkedIn, X, and WeChat. Scores by influence gradient (followers × engagement × academic cross-citations).',
    stats:[['Candidates scanned','2,418',''],['Rising this month','14','good'],['Signed (YTD)','6','']],
    result:{ title:'Top candidate this week', body:'<code>Dr. Hiroko Yamada</code> (Tokyo Women\'s Medical) — 8 ICL papers in 12 months, +240% engagement on TikTok Japan, 3 cross-citations in Nature Vision. Recommends direct intro.' }
  },
  {
    id:'TW', name:'Patient Twin Simulator', av:'', status:'beta', layer:'Beta',
    does:'Builds <b>synthetic patient cohorts</b> that stress-test new lens geometries before clinical. Uses real biometry distributions + refractive outcomes from the ICL Universe database.',
    stats:[['Twins simulated','42,800',''],['Cohorts active','4',''],['Variant runs (YTD)','19','']],
    result:{ title:'Current simulation', body:'Running <code>EVO+ presbyopia (V4c-Preb)</code> across 8,400 synthetic twins. Early read: <b>+12% near visual acuity</b> vs prior design; halos slightly elevated in &gt;5mm pupils. Report due May 6.' }
  },
  {
    id:'CM', name:'Claims Compliance', av:'', status:'beta', layer:'Beta',
    does:'Reviews <b>every marketing asset</b> (DTC, surgeon-facing, web, paid social, print) against the local indication of each country. Blocks over-claims before they ship. Auto-rewrites to compliant wording.',
    stats:[['Pieces reviewed','428',''],['Auto-approved','92%','good'],['Blocked','6','warn']],
    result:{ title:'Latest review batch', body:'<code>12 pieces</code> cleared for 9 markets. <b>2 flagged</b>: Italy (over-claimed "permanent" correction) and Mexico (unapproved age-21 claim). Revised copy returned to agency.' }
  },
  {
    id:'CG', name:'Clinic Growth Coach', av:'', status:'beta', layer:'Beta',
    does:'Benchmarks each pilot clinic vs its <b>regional peer cohort</b> (volume, conversion, PROMs, surgeon mix) and recommends <b>3 concrete actions per week</b> delivered in the clinic admin console.',
    stats:[['Pilot clinics','42',''],['Actions/wk','126',''],['Avg lift','+9.4%','good']],
    result:{ title:'This week\'s top 3', body:'(1) <code>IZ. Callao</code>: add Sat AM slots — forecast +18 cases/mo. (2) <code>Wellington Eye</code>: re-script discovery call. (3) <code>Eagle Eye KAP</code>: bundle EVO + LASIK retouch — +€680 ARPU.' }
  },
  {
    id:'IW', name:'Inventory Whisperer', av:'', status:'beta', layer:'Beta',
    does:'Tells each clinic <b>which SKU to reorder, in which quantity, and by when</b> — before the clinic admin notices the demand inflection. Pull-through from Demand Forecaster + local booking calendars.',
    stats:[['Clinics piloted','38',''],['Order accuracy','+12%','good'],['Stock-out delta','−67%','good']],
    result:{ title:'Pilot Korea result', body:'Across <code>38 clinics</code>: order accuracy up from 74% → 86%, stock-outs down 67% vs FY2025 baseline. Largest lift at <code>Eagle Eye KAP</code>: 0 stock-outs in 6 months.' }
  },
];

const AGENT_GROUPS = {
  Production: AGENTS.filter(a=>a.layer==='Production'),
  Beta:       AGENTS.filter(a=>a.layer==='Beta'),
};

function agentStateBadge(status){
  const cfg = { live:['LIVE','live'], warn:['NEEDS REVIEW','warn'], beta:['BETA','beta'] };
  const [label, cls] = cfg[status] || cfg.live;
  return `<div class="agent-state ${cls}">${label}</div>`;
}

function agentCardHtml(a){
  return `
    <div class="agent-card" data-agent="${a.id}">
      <div class="hdr">
        <div class="av ${a.av}">${a.id}</div>
        <div>
          <div class="name">${a.name}</div>
          <div class="ver">${a.layer} · v2.4</div>
        </div>
        ${agentStateBadge(a.status)}
      </div>
      <div class="does">${a.does}</div>
      <div class="stats">
        ${a.stats.map(([k,v,cls])=>`<div class="s"><div class="k">${k}</div><div class="v ${cls||''}">${v}</div></div>`).join('')}
      </div>
      <div class="result">
        <div class="rh">${a.result.title}</div>
        <div class="rb">${a.result.body}</div>
      </div>
      <div class="ra">
        <button class="btn prim">View run log</button>
        <button class="btn">Open governance</button>
        <button class="btn">Configure</button>
      </div>
    </div>`;
}

VIEWS.agents = () => `
  <div class="topbar"><div class="top-title"><h1>Active AI Agents<span class="tag"><span class="pulse"></span>${AGENTS.filter(a=>a.status==='live').length} LIVE · ${AGENTS.filter(a=>a.status==='beta').length} BETA · ${AGENTS.filter(a=>a.status==='warn').length} NEEDS REVIEW</span></h1><p>Each agent has a clear job, live metrics, and its latest result. Click any agent to open its full run log, audit trail, and governance controls.</p></div><div class="top-actions"><div class="chip on">+ New agent</div></div></div>

  <div class="agents-toolbar">
    <span class="sec">Layer</span>
    <span class="ft on">All (${AGENTS.length})</span>
    <span class="ft">Production (${AGENT_GROUPS.Production.length})</span>
    <span class="ft">Beta (${AGENT_GROUPS.Beta.length})</span>
    <span class="sec" style="margin-left:14px">Domain</span>
    <span class="ft">Supply</span>
    <span class="ft">Clinical</span>
    <span class="ft">Commercial</span>
    <span class="ft">Regulatory</span>
  </div>

  <div class="card" style="margin-bottom:14px">
    <div class="card-head"><h3>Production agents</h3><span class="sub">Running 24/7 with full audit + human-in-the-loop on P0/P1 actions</span></div>
    <div class="agents-grid">${AGENT_GROUPS.Production.map(agentCardHtml).join('')}</div>
  </div>

  <div class="card">
    <div class="card-head"><h3>Beta + ideation</h3><span class="sub">Staged rollout · metrics under observation before full production</span></div>
    <div class="agents-grid">${AGENT_GROUPS.Beta.map(agentCardHtml).join('')}</div>
  </div>
`;

/* --- AGENT WORKFLOWS --- */
VIEWS.workflows = () => `
  <div class="topbar"><div class="top-title"><h1>Agent Workflows</h1><p>Composed multi-agent pipelines that run end-to-end processes.</p></div><div class="top-actions"><div class="chip on">+ New workflow</div></div></div>
  <div class="card">
    <div class="card-head"><h3>Active workflows</h3></div>
    <div class="rank-list">
      <div class="rank-row"><div class="rank-num">●</div><div class="rank-name">Country launch (EVO+ presbyopia)<small>Regulatory Tracker → Claims Compliance → DTC Copy → KOL Outreach · 8 steps</small></div><div class="rank-val">6 markets</div><div class="rank-delta up">LIVE</div></div>
      <div class="rank-row"><div class="rank-num">●</div><div class="rank-name">Supply defense playbook<small>Demand Forecaster → Dynamic Allocation → Supply Chain Twin → Ops approval</small></div><div class="rank-val">2 active</div><div class="rank-delta up">LIVE</div></div>
      <div class="rank-row"><div class="rank-num">●</div><div class="rank-name">Surgeon graduation path<small>Surgeon Enablement → KOL Scout → Certification Agent → Volume Unlock</small></div><div class="rank-val">87 surgeons</div><div class="rank-delta up">LIVE</div></div>
      <div class="rank-row"><div class="rank-num">●</div><div class="rank-name">Adverse event triage<small>Adverse Event Sentinel → Regulatory Tracker → Medical Affairs → PhV Intake</small></div><div class="rank-val">3 in queue</div><div class="rank-delta up">LIVE</div></div>
      <div class="rank-row"><div class="rank-num">●</div><div class="rank-name">Clinic growth weekly<small>Clinic Growth Coach → Pricing Intel → Marketing Copy → Clinic Admin</small></div><div class="rank-val">42 clinics</div><div class="rank-delta up">LIVE</div></div>
    </div>
  </div>
`;

/* --- GOVERNANCE --- */
VIEWS.governance = () => `
  <div class="topbar"><div class="top-title"><h1>AI Governance</h1><p>Every agent action audited. Every model card. Every approval chain.</p></div></div>
  <div class="grid-2">
    <div class="card">
      <div class="card-head"><h3>Today's activity</h3></div>
      <div class="dr-stat-grid">
        <div class="dr-stat"><div class="k">Agent decisions</div><div class="v">2,418</div><div class="d">auto-approved 2,206</div></div>
        <div class="dr-stat"><div class="k">Human reviews</div><div class="v">212</div><div class="d">avg 4m response</div></div>
        <div class="dr-stat"><div class="k">Rollbacks</div><div class="v">3</div><div class="d">0.12% of decisions</div></div>
        <div class="dr-stat"><div class="k">Bias audits</div><div class="v">6</div><div class="d">all green</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Approval chains · pending</h3></div>
      <div class="rank-list">
        <div class="rank-row"><div class="rank-num">1</div><div class="rank-name">Pull-forward 2,200 EVO TICL — Seoul<small>Dynamic Allocation → Ops VP · waiting ops approval</small></div><div class="rank-val">3m</div><div class="rank-delta up">P0</div></div>
        <div class="rank-row"><div class="rank-num">2</div><div class="rank-name">Campaign launch — FDA age change<small>DTC Copy → Brand Director · waiting brand approval</small></div><div class="rank-val">24m</div><div class="rank-delta up">P1</div></div>
        <div class="rank-row"><div class="rank-num">3</div><div class="rank-name">Surgeon comms — ANVISA expansion<small>Regulatory → Medical Affairs · waiting MA review</small></div><div class="rank-val">42m</div><div class="rank-delta up">P1</div></div>
      </div>
    </div>
  </div>
`;
