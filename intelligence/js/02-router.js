/* ========= ROUTER ========= */
function showView(view){
  STATE.view = view;
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active', x.dataset.view===view));
  const main = document.getElementById('main');
  const fn = VIEWS[view] || VIEWS.command;
  main.innerHTML = fn();
  window.scrollTo({top:0});
  if (view==='command' || view==='universe') attachMapHandlers();
  attachTabs();
}
function attachTabs(){
  document.querySelectorAll('.tabs').forEach(g=>{
    g.addEventListener('click', e=>{
      const t=e.target.closest('.tab'); if(!t) return;
      g.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
    });
  });
}

/* ========= DRAWER ========= */
function openCountry(iso){
  const c = COUNTRIES[iso];
  if(!c) return;
  STATE.selectedCountry = iso;
  const total = Math.max(1, (c.eq.sonomed||0) + (c.eq.arcscan||0) + (c.eq.quantel||0));
  const pct = (n)=>Math.round((n||0)/total*100);
  // Derive surgeon-based metrics (for KPIs) — fallback to country static values otherwise
  const countrySurgeons = (typeof SURGEONS!=='undefined') ? SURGEONS.filter(s=>s.iso===iso) : [];
  const cYoy = c.yoy != null ? c.yoy :
    (countrySurgeons.length ? (countrySurgeons.reduce((a,s)=>a+s.growth,0)/countrySurgeons.length)/100 : 0.12);
  const cPipe = c.pipe != null ? c.pipe : Math.round((c.sx||0)*0.18);
  const cOrsLive = c.orsLive != null ? c.orsLive : Math.max(1, Math.round((c.clinics||1)*0.25));
  const cProms = c.promsAvg != null ? c.promsAvg :
    (countrySurgeons.length ? (countrySurgeons.reduce((a,s)=>a+s.proms,0)/countrySurgeons.length).toFixed(1) : '—');
  const cNps = c.nps != null ? c.nps : Math.round(55 + Math.random()*15);
  const topArr = Array.isArray(c.top) ? c.top : [];
  const topHtml = topArr.map((t,i)=>`
    <div class="dr-clinic">
      <span class="dr-clinic-num">${String(i+1).padStart(2,'0')}</span>
      <div class="dr-clinic-name">${t.n}<small>${t.s||''} · ${(t.v||0).toLocaleString()} surgeries</small></div>
      <span class="dr-clinic-eq ${t.e}">${EQ[t.e].n}</span>
    </div>`).join('');
  const driversArr = Array.isArray(c.drivers) ? c.drivers :
    (countrySurgeons.length ? [...new Set(countrySurgeons.map(s=>s.spec))].slice(0,5) : ['EVO TICL adoption', 'Premium channel growth', 'KOL network']);
  const driversHtml = driversArr.map(d=>`<span>${d}</span>`).join('');
  const alertsArr = Array.isArray(c.alerts) ? c.alerts : [];
  const alertsHtml = alertsArr.length ? alertsArr.map(a=>`<div class="dr-alert ${a.t==='opp'?'opp':''}">${a.m}</div>`).join('')
                                     : '<div style="font-size:11.5px;color:var(--text-3)">No active signals.</div>';
  document.getElementById('drawer-content').innerHTML = `
    <div class="dr-flag">${c.flag}</div>
    <h2>${c.n}</h2>
    <div class="dr-sub">${CONTINENTS[c.cont].n} · ISO ${iso}</div>

    <div class="dr-section">
      <h4>Activity snapshot · FY26 YTD</h4>
      <div class="dr-stat-grid">
        <div class="dr-stat"><div class="k">Surgeries</div><div class="v">${(c.sx||0).toLocaleString()}</div><div class="d">▲ ${Math.round(cYoy*100)}% YoY</div></div>
        <div class="dr-stat"><div class="k">90-day pipeline</div><div class="v">${cPipe.toLocaleString()}</div><div class="d">${cOrsLive} ORs live now</div></div>
        <div class="dr-stat"><div class="k">Active clinics</div><div class="v">${c.clinics||0}</div><div class="d">${c.surgeons||countrySurgeons.length} surgeons</div></div>
        <div class="dr-stat"><div class="k">PROMs · NPS</div><div class="v">${cProms} ★</div><div class="d">NPS ${cNps}</div></div>
      </div>
    </div>

    <div class="dr-section">
      <h4>Biometry equipment installed</h4>
      <div class="dr-eq-bar">
        <span class="sonomed" style="width:${pct(c.eq.sonomed)}%"></span>
        <span class="arcscan" style="width:${pct(c.eq.arcscan)}%"></span>
        <span class="quantel" style="width:${pct(c.eq.quantel)}%"></span>
      </div>
      <div class="dr-eq-row">
        <span><i style="background:#22d3ee"></i>SONOMED ${c.eq.sonomed} <small style="color:var(--text-3)">(${pct(c.eq.sonomed)}%)</small></span>
        <span><i style="background:#a855f7"></i>ARCSCAN ${c.eq.arcscan} <small style="color:var(--text-3)">(${pct(c.eq.arcscan)}%)</small></span>
        <span><i style="background:#fbbf24"></i>QUANTEL ${c.eq.quantel} <small style="color:var(--text-3)">(${pct(c.eq.quantel)}%)</small></span>
      </div>
    </div>

    <div class="dr-section">
      <h4>Top clinics by volume (last 90d)</h4>
      ${topHtml}
    </div>

    ${countrySurgeonSection(iso)}

    <div class="dr-section">
      <h4>Growth drivers</h4>
      <div class="dr-chips">${driversHtml}</div>
    </div>

    <div class="dr-section">
      <h4>Active signals</h4>
      ${alertsHtml}
    </div>

    <div class="dr-footer">
      <button class="dr-btn primary">Open country brief</button>
      <button class="dr-btn secondary">Ask Copilot</button>
    </div>
  `;
  const drEl = document.getElementById('drawer');
  drEl.classList.add('open');
  // Widen drawer if this country has a surgeon roster to accommodate the consolidated panel
  if(SURGEONS.some(s=>s.iso===iso)) drEl.classList.add('wide'); else drEl.classList.remove('wide');
  document.getElementById('backdrop').classList.add('show');
  document.querySelectorAll('.country-label, .country-hit').forEach(e=>e.classList.toggle('selected', e.dataset.iso===iso));
}
