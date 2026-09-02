/* ================================================================
   AI Lens Simulator — what-if analysis on chosen vs alternative lens
================================================================ */
let SIM_STATE = {
  patientId: null,  // selected patient
  chosenLens: { size: "12.6", model: "EVO ICL", power: -8.00, cyl: 0, axis: 0 },
  postOp: { vault: 420, iop: 14, ucva: "20/25", proms: 8.2, halos: 7.5, nightDriving: 7.0 },
};

function renderSimulator() {
  // Default to first post-op patient (Rivera) so there's data to simulate
  const defaultPt = DATA.patients.find(p => p.stage === "Post-op") || DATA.patients[0];
  SIM_STATE.patientId = SIM_STATE.patientId || defaultPt.id;
  const pt = DATA.patients.find(p => p.id === SIM_STATE.patientId) || defaultPt;
  const b = patientBiometry(pt);

  const patientOptions = DATA.patients.map(p =>
    `<option value="${p.id}" ${p.id === pt.id ? 'selected' : ''}>${p.name} · REV-${p.id} · ${p.stage}</option>`
  ).join('');

  return `
    ${moduleHead("03 · AI LENS SIMULATOR", "What if we had chosen another lens?", "Retrospective what-if analysis. Feed pre-op biometry + the lens that was implanted + observed post-op outcomes — the AI simulates what would have happened with alternative lens choices.")}

    <div class="sim-hero">
      <div class="sim-hero-ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
      </div>
      <div>
        <div class="sim-hero-eyebrow">AI AGENT · COUNTERFACTUAL</div>
        <h3>Learn from every case — even the ones that went well</h3>
        <p>Pick a post-op patient, review what actually happened, and ask: would a different lens size or model have changed the outcome? Trained on 47k ICL outcomes · AI Sentinel · STAAR cohort data.</p>
      </div>
    </div>

    <!-- STEP 1: Patient + pre-op inputs -->
    <div class="panel mt-18">
      <div class="panel-head">
        <h3><span class="sim-step-num">1</span> Patient + pre-op biometry</h3>
        <button class="btn btn-ghost small" onclick="simulatorImportEHR()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="8 8 12 4 16 8"/><line x1="12" y1="4" x2="12" y2="17"/></svg>
          Import from EHR
        </button>
      </div>
      <div class="sim-patient-picker">
        <label>Patient</label>
        <select id="simPatientSelect" onchange="simulatorLoadPatient(this.value)">${patientOptions}</select>
      </div>
      <div class="sf-inputs-grid">
        <div class="sf-input"><label>Sphere</label><div class="sf-input-row"><input type="text" id="sim-sph" value="${parseFloat(pt.power).toFixed(2)}"/><span class="sf-unit">D</span></div></div>
        <div class="sf-input"><label>Cylinder</label><div class="sf-input-row"><input type="text" id="sim-cyl" value="${pt.iclGuru ? pt.iclGuru.iolPower.cyl.toFixed(2) : '0.00'}"/><span class="sf-unit">D</span></div></div>
        <div class="sf-input"><label>WTW</label><div class="sf-input-row"><input type="text" id="sim-wtw" value="${b.WTW.v.toFixed(2)}"/><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label>ACD</label><div class="sf-input-row"><input type="text" id="sim-acd" value="${b.ACD.v.toFixed(2)}"/><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label>Pupil (mesopic)</label><div class="sf-input-row"><input type="text" id="sim-pupil" value="${b.Pupil.v.toFixed(1)}"/><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label>K-mean</label><div class="sf-input-row"><input type="text" id="sim-kmean" value="${((b.K1.v+b.K2.v)/2).toFixed(2)}"/><span class="sf-unit">D</span></div></div>
      </div>
    </div>

    <!-- STEP 2: Lens actually implanted -->
    <div class="panel mt-18">
      <div class="panel-head">
        <h3><span class="sim-step-num">2</span> Lens actually implanted</h3>
        <span class="chip">Select what was chosen at surgery</span>
      </div>
      <div class="sim-lens-chosen-grid">
        <div class="sf-input"><label>Model</label><div class="sf-input-row"><select id="sim-lens-model">
          <option>EVO ICL</option><option>EVO+ ICL</option><option>EVO TICL</option><option>EVO+ TICL</option><option>EVO Viva (EDoF)</option>
        </select></div></div>
        <div class="sf-input"><label>Size (overall diameter)</label><div class="sf-input-row"><select id="sim-lens-size">
          <option>12.1</option><option selected>12.6</option><option>13.2</option><option>13.7</option>
        </select><span class="sf-unit">mm</span></div></div>
        <div class="sf-input"><label>Lens power</label><div class="sf-input-row"><input type="text" id="sim-lens-power" value="${parseFloat(pt.power).toFixed(2)}"/><span class="sf-unit">D</span></div></div>
        <div class="sf-input"><label>Toric axis</label><div class="sf-input-row"><input type="text" id="sim-lens-axis" value="${pt.iclGuru ? pt.iclGuru.iolPower.axis : 0}"/><span class="sf-unit">°</span></div></div>
      </div>
    </div>

    <!-- STEP 3: Observed post-op outcomes -->
    <div class="panel mt-18">
      <div class="panel-head">
        <h3><span class="sim-step-num">3</span> Observed post-op outcomes</h3>
        <span class="chip">What really happened</span>
      </div>
      <div class="sf-inputs-grid">
        <div class="sf-input"><label>Vault @ Week 1</label><div class="sf-input-row"><input type="text" id="sim-vault" value="420"/><span class="sf-unit">µm</span></div></div>
        <div class="sf-input"><label>IOP</label><div class="sf-input-row"><input type="text" id="sim-iop" value="14"/><span class="sf-unit">mmHg</span></div></div>
        <div class="sf-input"><label>UCVA</label><div class="sf-input-row"><input type="text" id="sim-ucva" value="20/25"/></div></div>
        <div class="sf-input"><label>PROMs overall</label><div class="sf-input-row"><input type="text" id="sim-proms" value="8.2"/><span class="sf-unit">/10</span></div></div>
        <div class="sf-input"><label>Halos / glare (inv)</label><div class="sf-input-row"><input type="text" id="sim-halos" value="7.5"/><span class="sf-unit">/10</span></div></div>
        <div class="sf-input"><label>Night driving</label><div class="sf-input-row"><input type="text" id="sim-night" value="7.0"/><span class="sf-unit">/10</span></div></div>
      </div>
    </div>

    <div class="panel mt-18 sim-run-panel">
      <button class="btn btn-primary sim-run-btn" onclick="runSimulator()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        Simulate alternative lenses
      </button>
      <span class="muted small">Compares against all 4 STAAR sizes + 2 alternative models · AI runs in ~2s</span>
    </div>

    <div id="simResults" style="display:none"></div>
  `;
}

function simulatorLoadPatient(id) {
  SIM_STATE.patientId = id;
  renderModule('simulator');
}

function simulatorImportEHR() {
  showToast("EHR import: pre-op biometry loaded · 1.8s");
  document.querySelectorAll('.sf-input').forEach(el => {
    el.classList.add('ehr-flash');
    setTimeout(() => el.classList.remove('ehr-flash'), 1400);
  });
}

function runSimulator() {
  const pt = DATA.patients.find(p => p.id === SIM_STATE.patientId) || DATA.patients[0];
  const chosenSize = parseFloat(document.getElementById('sim-lens-size')?.value || '12.6');
  const chosenModel = document.getElementById('sim-lens-model')?.value || 'EVO ICL';
  const observedVault = parseFloat(document.getElementById('sim-vault')?.value) || 420;
  const observedProms = parseFloat(document.getElementById('sim-proms')?.value) || 8.2;
  const observedHalos = parseFloat(document.getElementById('sim-halos')?.value) || 7.5;
  const observedNight = parseFloat(document.getElementById('sim-night')?.value) || 7.0;
  const observedUCVA = document.getElementById('sim-ucva')?.value || '20/25';
  const pupil = parseFloat(document.getElementById('sim-pupil')?.value) || 5.0;

  // For each STAAR size, simulate what the outcome would have been
  const allSizes = ["12.1", "12.6", "13.2", "13.7"];
  const simulations = allSizes.map(size => {
    const sz = parseFloat(size);
    const delta = (sz - chosenSize) * 250; // larger lens → higher vault
    const predVault = Math.max(120, Math.min(1500, Math.round(observedVault + delta + (Math.random() - 0.5) * 60)));
    const predHalos = +Math.max(3, Math.min(10, observedHalos + (sz - chosenSize) * 0.5 + (pupil > 6 ? -0.6 : 0))).toFixed(1);
    const predNight = +Math.max(3, Math.min(10, observedNight + (sz - chosenSize) * -0.4)).toFixed(1);
    const promsAdj = (predVault >= 250 && predVault <= 750 ? 0.2 : -0.6) + (predHalos - observedHalos) * 0.15;
    const predProms = +Math.max(2, Math.min(10, observedProms + promsAdj)).toFixed(1);
    const vaultBand = predVault < 250 ? 'low' : predVault <= 750 ? 'ideal' : predVault <= 900 ? 'high' : 'hyper';
    return { size, sz, predVault, predHalos, predNight, predProms, vaultBand, isChosen: sz === chosenSize };
  });

  // Find best alternative (highest PROMs that isn't the chosen)
  const chosen = simulations.find(s => s.isChosen);
  const alternatives = simulations.filter(s => !s.isChosen).sort((a, b) => b.predProms - a.predProms);
  const bestAlt = alternatives[0];

  // Generate alerts
  const alerts = [];
  if (chosen && bestAlt) {
    const promsDelta = bestAlt.predProms - chosen.predProms;
    if (promsDelta >= 0.5) {
      alerts.push({ severity: 'critical', text: `A <b>${bestAlt.size} mm</b> lens would have delivered <b>PROMs ${bestAlt.predProms}</b> vs <b>${chosen.predProms}</b> observed — +${promsDelta.toFixed(1)} points.`, tag: 'Better alternative' });
    }
    if (observedHalos < 6.5 && pupil > 6) {
      alerts.push({ severity: 'warn', text: `Halo score <b>${observedHalos}</b> with mesopic pupil <b>${pupil}mm</b> — patients with pupil >6mm benefit from smaller vault (${bestAlt.size}mm might have reduced night-vision complaints).`, tag: 'Pupil-vault mismatch' });
    }
    if (chosen.vaultBand === 'high' || chosen.vaultBand === 'hyper') {
      alerts.push({ severity: 'warn', text: `Chosen lens produced <b>${chosen.predVault}µm</b> vault (${chosen.vaultBand}). Long-term IOP monitoring recommended · consider <b>${alternatives.find(a => a.vaultBand === 'ideal')?.size || bestAlt.size}mm</b> for similar cases.`, tag: 'Vault outside ideal band' });
    }
    if (chosen.vaultBand === 'low') {
      alerts.push({ severity: 'warn', text: `Low vault <b>${chosen.predVault}µm</b> — risk of posterior contact + cataract progression. A larger size would have lifted vault into safe zone.`, tag: 'Low vault risk' });
    }
    if (alerts.length === 0) {
      alerts.push({ severity: 'good', text: `Chosen <b>${chosen.size}mm</b> was well-matched. Alternative sizes would not have materially improved outcomes (±0.${Math.round(promsDelta*10)} PROMs delta).`, tag: 'Optimal choice' });
    }
  }

  // Learning comments
  const learnings = [
    {
      icon: 'vault',
      title: 'Vault prediction window',
      body: `For this ACD/WTW profile, the cohort data (n=847) suggests vault shifts ~${Math.abs((bestAlt.sz - chosenSize) * 250).toFixed(0)}µm per 0.5mm size step. ${bestAlt.vaultBand === 'ideal' ? 'The ideal band is wider than expected — small size changes could have absorbed the shift.' : 'Vault sensitivity to size is moderate for this biometry.'}`
    },
    {
      icon: 'pupil',
      title: 'Pupil-vault rule',
      body: `Mesopic pupil ${pupil}mm ${pupil > 6 ? 'is large' : 'is within normal range'}. Empirical rule: keep vault <500µm when pupil >6mm to minimize halos. ${observedVault < 500 ? 'Respected ✓' : 'Exceeded — consider smaller lens in future large-pupil cases.'}`
    },
    {
      icon: 'alt',
      title: 'When to consider EVO Viva',
      body: `For presbyopic patients (>45y) or those wanting near-vision independence, <b>EVO Viva</b> (EDoF) trades ~10% distance sharpness for ~2 lines of near vision. ${pt.age >= 45 ? 'Consider for this age group.' : 'Not applicable at this age.'}`
    },
  ];

  // Render results
  const el = document.getElementById('simResults');
  if (!el) return;
  el.style.display = '';
  el.innerHTML = `
    <div class="panel mt-18 sim-results-panel">
      <div class="panel-head">
        <h3>Simulation results</h3>
        <span class="chip ai">AI counterfactual · 4 sizes compared</span>
      </div>

      <!-- Outcome comparison table -->
      <div class="sim-compare-grid">
        ${simulations.map(s => `
          <div class="sim-size-card ${s.isChosen ? 'chosen' : ''} ${s.vaultBand}">
            ${s.isChosen ? '<div class="sim-chosen-badge">Actually implanted</div>' : ''}
            <div class="sim-size-lbl">Size</div>
            <div class="sim-size-val">${s.size} mm</div>
            <div class="sim-metric-row">
              <div class="sim-metric">
                <span class="smk">Vault</span>
                <span class="smv">${s.predVault} µm</span>
                <span class="smb ${s.vaultBand}">${s.vaultBand}</span>
              </div>
              <div class="sim-metric">
                <span class="smk">PROMs</span>
                <span class="smv">${s.predProms}<small>/10</small></span>
              </div>
              <div class="sim-metric">
                <span class="smk">Halos</span>
                <span class="smv">${s.predHalos}<small>/10</small></span>
              </div>
              <div class="sim-metric">
                <span class="smk">Night vision</span>
                <span class="smv">${s.predNight}<small>/10</small></span>
              </div>
            </div>
          </div>`).join('')}
      </div>

      <!-- Alerts -->
      <div class="sim-alerts">
        <div class="sim-section-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> Clinical alerts</div>
        ${alerts.map(a => `
          <div class="sim-alert ${a.severity}">
            <span class="sim-alert-tag">${a.tag}</span>
            <div class="sim-alert-body">${a.text}</div>
          </div>`).join('')}
      </div>

      <!-- Learning comments -->
      <div class="sim-learnings">
        <div class="sim-section-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Learning takeaways</div>
        ${learnings.map(l => `
          <div class="sim-learning">
            <div class="sim-learning-head">
              <b>${l.title}</b>
            </div>
            <div class="sim-learning-body">${l.body}</div>
          </div>`).join('')}
      </div>
    </div>
  `;
  try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e) {}
}

function renderTraining() {
  const courseHtml = DATA.courses.map(c => {
    const hasImg = !!c.img;
    const pos = c.imgPos || 'center';
    const completed = c.progress === 100;
    return `
    <div class="course-card">
      <div class="course-thumb${hasImg ? ' has-img' : ''}"${hasImg ? ` style="background-image:url(&quot;${c.img}&quot;);background-position:${pos};background-size:cover;background-repeat:no-repeat"` : ''}>
        ${hasImg ? '<div class="course-thumb-veil"></div>' : ''}
        ${c.category ? `<div class="course-thumb-cat">${c.category}</div>` : ''}
        <div class="course-thumb-len">${c.len}</div>
        ${completed ? '<div class="course-thumb-done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' : ''}
        <div class="course-thumb-play">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div class="meta"><span class="tag-ai" style="background:${c.tag==='Advanced'?'rgba(127,33,224,.1)':'rgba(36,114,211,.1)'};color:${c.tag==='Advanced'?'var(--gold)':'var(--teal)'}">${c.tag}</span><span>${c.len}</span><span>· ${c.cme}</span></div>
      <div class="title">${c.title}</div>
      <div class="progress"><span style="width:${c.progress}%"></span></div>
      <div class="muted small">${completed ? '✓ Completed' : c.progress === 0 ? 'Not started' : `${c.progress}% complete`}</div>
    </div>
  `;
  }).join("");

  return `
    ${moduleHead("07 · TRAINING · AI COACH", "On-demand curriculum, AI-coached case reviews.", "Earn CME while mastering ICL. Every course mapped to real-case challenges; every answer reviewed by STAAR experts.")}
    <div class="mod-grid cols-3">${courseHtml}</div>

    <div class="mod-grid cols-2 mt-18">
      <div class="panel">
        <div class="panel-head">
          <h3>AI-coached case review queue</h3>
          <span class="chip ai">3 pending</span>
        </div>
        <table class="tbl">
          <thead><tr><th>Case</th><th>Topic</th><th>Reviewer</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td><b>Case #1042</b><div class="subtle">-9.50 D · tight AC</div></td><td>Sizing</td><td>AI + Dr. Shimizu</td><td><span class="status ok"><span class="sdot"></span>Ready</span></td></tr>
            <tr><td><b>Case #1038</b><div class="subtle">Toric rotation 12°</div></td><td>Post-op</td><td>AI</td><td><span class="status wait"><span class="sdot"></span>In review</span></td></tr>
            <tr><td><b>Case #1027</b><div class="subtle">Vault 680 µm</div></td><td>Sizing</td><td>AI + Dr. Chen</td><td><span class="status done"><span class="sdot"></span>Completed</span></td></tr>
          </tbody>
        </table>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3>Your CME progress</h3>
          <span class="chip live">12.5 / 20 credits</span>
        </div>
        <div class="prom-row good"><span class="lbl">Cycle 2026</span><span class="gauge"><span style="width:62%"></span></span><span class="val">62%</span></div>
        <div class="prom-row mid"><span class="lbl">Advanced track</span><span class="gauge"><span style="width:48%"></span></span><span class="val">48%</span></div>
        <div class="prom-row good"><span class="lbl">Core track</span><span class="gauge"><span style="width:95%"></span></span><span class="val">95%</span></div>
        <div class="muted small mt-14" style="padding-top:12px; border-top:1px solid var(--line);">
          Accredited by ICLS · credits auto-export to your license record. Next milestone: complete <b>Vault prediction masterclass</b> for 1.5 CME.
        </div>
      </div>
    </div>
  `;
}

function renderSupport() {
  const chatHtml = DATA.chat.map(m => `
    <div class="msg ${m.from}">
      <div class="av">${m.av}</div>
      <div>
        <div class="bubble">${m.body}</div>
        <div class="meta">${m.name} · ${m.time}</div>
      </div>
    </div>
  `).join("");

  return `
    ${moduleHead("08 · LIVE SUPPORT", "STAAR experts, inside the platform.", "Real-time chat with the people who built the lens, the algorithm and your workflow. No tickets, no phone trees — you and the experts, in-context.")}
    <div class="mod-grid split-hero">
      <div class="panel">
        <div class="panel-head">
          <h3>Active conversation · Case M. Herrera</h3>
          <span class="chip live">Live</span>
        </div>
        <div class="presence">
          <span class="dot-live"></span>
          <span>Dr. K. Okada (STAAR Clinical) · EVO Copilot · online</span>
        </div>
        <div class="chat">
          <div class="chat-messages">${chatHtml}</div>
          <div class="chat-input">
            <input placeholder="Message the team…">
            <button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
          </div>
        </div>
      </div>

      <div>
        <div class="panel">
          <div class="panel-head">
            <h3>Experts online now</h3>
            <span class="chip live">6 available</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;"><div style="width:32px;height:32px;border-radius:50%;background:var(--navy);color:white;display:grid;place-items:center;font-weight:700;font-size:11px;">KO</div><div style="flex:1"><div style="font-weight:700; font-size:12.5px">Dr. K. Okada</div><div class="muted small">STAAR Clinical · JP</div></div><span class="dot-live" style="width:8px;height:8px;border-radius:50%;background:var(--green);"></span></div>
            <div style="display:flex; align-items:center; gap:10px;"><div style="width:32px;height:32px;border-radius:50%;background:var(--navy);color:white;display:grid;place-items:center;font-weight:700;font-size:11px;">MR</div><div style="flex:1"><div style="font-weight:700; font-size:12.5px">M. Rodríguez</div><div class="muted small">STAAR Logistics · MX</div></div><span class="dot-live" style="width:8px;height:8px;border-radius:50%;background:var(--green);"></span></div>
            <div style="display:flex; align-items:center; gap:10px;"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold) 0%, var(--teal) 100%);color:white;display:grid;place-items:center;font-weight:700;font-size:11px;">AI</div><div style="flex:1"><div style="font-weight:700; font-size:12.5px">EVO Copilot</div><div class="muted small">AI · 24/7</div></div><span class="dot-live" style="width:8px;height:8px;border-radius:50%;background:var(--green);"></span></div>
            <div style="display:flex; align-items:center; gap:10px;"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold) 0%, var(--teal) 100%);color:white;display:grid;place-items:center;font-weight:700;font-size:11px;">DC</div><div style="flex:1"><div style="font-weight:700; font-size:12.5px">Dr. P. Chen</div><div class="muted small">Peer surgeon · ES</div></div><span class="dot-live" style="width:8px;height:8px;border-radius:50%;background:var(--green);"></span></div>
          </div>
        </div>
        <div class="panel mt-18">
          <div class="panel-head">
            <h3>Support SLA</h3>
            <span class="chip ai">Avg 42s</span>
          </div>
          <div class="prom-row good"><span class="lbl">Clinical</span><span class="gauge"><span style="width:98%"></span></span><span class="val">&lt;1m</span></div>
          <div class="prom-row good"><span class="lbl">Logistics</span><span class="gauge"><span style="width:92%"></span></span><span class="val">&lt;3m</span></div>
          <div class="prom-row mid"><span class="lbl">Technical</span><span class="gauge"><span style="width:80%"></span></span><span class="val">&lt;10m</span></div>
        </div>
      </div>
    </div>
  `;
}
