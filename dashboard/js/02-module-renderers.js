/* ================================================================
   MODULE RENDERERS
================================================================ */
function renderPreop() {
  const p = DATA.patient;
  const b = DATA.biometry;
  const biomHtml = Object.entries(b).map(([k, d]) => `
    <div class="biom-item">
      <div class="lbl">${k}</div>
      <div class="val">${d.v.toLocaleString(undefined,{maximumFractionDigits:2})}<span class="unit"> ${d.u}</span></div>
      <div class="bar"><span style="width:${d.pct}%"></span></div>
    </div>
  `).join("");
  const elHtml = DATA.eligibility.map(e => `
    <div class="check-item ${e.pass ? 'pass' : 'fail'}">
      <div class="ico">
        ${e.pass
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'}
      </div>
      <div class="lbl">${e.lbl}</div>
      <div class="val">${e.val}</div>
    </div>
  `).join("");
  const patientRows = DATA.patients.map(pt => `
    <tr class="clickable" onclick="openPatientFile('${pt.id}')">
      <td>
        <div class="patient-cell">
          <div class="pt-av-sm">${portraitSvg(pt.portrait)}</div>
          <div><b>${pt.name}</b><div class="subtle">REV-${pt.id}</div></div>
        </div>
      </td>
      <td>${pt.age}</td>
      <td>${pt.eye}</td>
      <td class="subtle">${pt.power}</td>
      <td>${pt.stage}</td>
      <td><span class="status ${pt.status}"><span class="sdot"></span>${pt.stage}</span></td>
      <td class="share-cell">
        <button class="share-btn" onclick="event.stopPropagation(); shareToFeed('${pt.id}')" title="Share this case to the Community Feed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
          Share to Feed
        </button>
      </td>
    </tr>
  `).join("");

  // Patients with active risk flags — shown in the patient-centric Sentinel panel
  const riskPatients = DATA.patients.filter(p => p.risk);
  const highCount = riskPatients.filter(p => p.risk.level === "high").length;
  const medCount  = riskPatients.filter(p => p.risk.level === "med").length;
  const lowCount  = riskPatients.filter(p => p.risk.level === "low").length;
  const sevLabel = { high: "High risk", med: "Medium risk", low: "Low risk" };
  const riskCasesHtml = riskPatients.map(pt => `
    <div class="risk-case ${pt.risk.level}">
      <div class="pt-av">${portraitSvg(pt.portrait)}</div>
      <div class="pt-info">
        <div class="nm">${pt.name} <span class="meta">${pt.age}y · ${pt.eye} · ${pt.power} D · REV-${pt.id}</span></div>
        <div class="flag">${pt.risk.flag}</div>
        <div class="reco">→ ${pt.risk.reco}</div>
      </div>
      <div class="pt-actions">
        <span class="sev-badge">${sevLabel[pt.risk.level]}</span>
        <button class="share-feed" onclick="shareToFeed('${pt.id}')" title="Share anonymized to Community Feed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
          Share
        </button>
      </div>
    </div>
  `).join("");

  return `
    ${moduleHead("01 · PRE-OP", "Every candidate, structured from day one.", "Biometry · topography · eligibility · risk prediction · manual uploads · EHR imports — one canonical record per patient.")}

    <!-- AI RISK AGENT · patient-centric -->
    <div class="risk-agent">
      <div class="risk-head">
        <div class="agent-av">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7l3-7z"/>
          </svg>
        </div>
        <div>
          <div class="risk-eyebrow">AI AGENT · SENTINEL</div>
          <h3>Sentinel is watching ${riskPatients.length} patients across your queue</h3>
          <div class="small" style="color:#8890C4; margin-top:2px;">Trained on 47k ICL outcomes · scans every patient in your pipeline · updated 12 min ago</div>
        </div>
        <div style="margin-left:auto; position:relative; z-index:1;">
          <span class="tag-ai" style="background:rgba(231,138,39,.2); color:var(--warn-lt)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            ${highCount} HIGH · ${medCount} MED · ${lowCount} LOW
          </span>
        </div>
      </div>
      <div class="risk-score">
        <div>
          <div class="val">${riskPatients.length}</div>
          <div class="lbl">PATIENTS FLAGGED</div>
        </div>
        <div style="flex:1">
          <div style="font-weight:700; font-size:13.5px;">${highCount} high-risk · ${medCount} medium · ${lowCount} low</div>
          <div class="msg">Each flag below is tied to a specific patient in your queue. Click <b>Share</b> to post an anonymized version of the case to the Community Feed for peer review.</div>
        </div>
      </div>
      <div class="risk-cases">
        ${riskCasesHtml}
      </div>
    </div>

    <div class="mod-grid cols-2 mt-18">
      <div class="panel">
        <div class="panel-head">
          <h3>Biometry snapshot</h3>
          <span class="chip ai">AS-OCT · Auto-parsed</span>
        </div>
        <div class="muted small" style="margin-bottom:12px">Patient · <b style="color:var(--ink)">${p.name}</b> · ${p.id}</div>
        <div class="biom-grid">${biomHtml}</div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3>Eligibility checklist</h3>
          <span class="chip live">8/8 passed</span>
        </div>
        <div class="check-list">${elHtml}</div>
      </div>
    </div>

    <!-- UPLOAD + EHR IMPORT -->
    <div class="mod-grid cols-2 mt-18">
      <div class="panel">
        <div class="panel-head">
          <h3>Upload studies manually</h3>
          <span class="chip">PDF · DICOM · images</span>
        </div>
        <label class="dropzone" for="preopUpload" id="preopDz">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <h4>Drop files here or click to upload</h4>
          <p>AI will auto-parse biometry, tomography, OCT, fundus, visual fields</p>
          <div class="supp">Supports: .pdf, .dcm, .jpg, .png, .tif · up to 50 MB</div>
          <input type="file" id="preopUpload" multiple hidden>
        </label>
        <div class="upload-list">
          <div class="upload-item">
            <div class="ico dcm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg></div>
            <div>
              <div class="lbl">Pentacam_Herrera_OD.dcm</div>
              <div class="sub">Tomography · auto-parsed · ATA 12.1 · STS 11.9</div>
            </div>
            <span class="ai-btn">AI parsed ✓</span>
          </div>
          <div class="upload-item">
            <div class="ico pdf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div>
            <div>
              <div class="lbl">IOL_Master_report.pdf</div>
              <div class="sub">Biometry · parsed · AL 26.82 · K1/K2 42.18/43.64</div>
            </div>
            <span class="size">1.2 MB</span>
          </div>
          <div class="upload-item">
            <div class="ico img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
            <div>
              <div class="lbl">topography_OS.jpg</div>
              <div class="sub">Uploaded 4 min ago · queued for AI parsing</div>
            </div>
            <span class="size">340 KB</span>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>Import from EHR</h3>
          <span class="chip ai">FHIR + HL7 certified</span>
        </div>
        <div class="muted small" style="margin-bottom:6px">One-click import of existing clinical data. REVAI maps directly into your ICL record.</div>
        <div class="ehr-list">
          <div class="ehr-item salud">
            <div class="logo">Med+</div>
            <div class="info">
              <div class="name">MedicaSalud · EHR Argentina</div>
              <div class="meta">Connected 2 days ago · 124 patients synced</div>
            </div>
            <div class="connected"><span class="dot-live"></span>Live</div>
          </div>
          <div class="ehr-item fhir">
            <div class="logo">FHIR</div>
            <div class="info">
              <div class="name">Generic FHIR R4 endpoint</div>
              <div class="meta">Any FHIR-compliant system · OAuth + token</div>
            </div>
            <div class="connected"><span class="dot-live"></span>Live</div>
          </div>
          <div class="ehr-item epic">
            <div class="logo">EPIC</div>
            <div class="info">
              <div class="name">Epic · MyChart / Bridges</div>
              <div class="meta">USA · not connected</div>
            </div>
            <button class="connect-btn">Connect</button>
          </div>
          <div class="ehr-item cerner">
            <div class="logo">CRNR</div>
            <div class="info">
              <div class="name">Oracle Cerner · Millennium</div>
              <div class="meta">Global · not connected</div>
            </div>
            <button class="connect-btn">Connect</button>
          </div>
          <div class="ehr-item athena">
            <div class="logo">AH</div>
            <div class="info">
              <div class="name">Athenahealth</div>
              <div class="meta">USA · SaaS EHR · not connected</div>
            </div>
            <button class="connect-btn">Connect</button>
          </div>
          <div class="ehr-item other">
            <div class="logo">CSV</div>
            <div class="info">
              <div class="name">CSV / Excel import</div>
              <div class="meta">Bulk patient upload with templated fields</div>
            </div>
            <button class="connect-btn" style="background:var(--ink)">Upload</button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel mt-18">
      <div class="panel-head">
        <h3>Patient queue</h3>
        <button class="btn btn-ghost small">View all 1,248</button>
      </div>
      <table class="tbl">
        <thead><tr><th>Patient</th><th>Age</th><th>Eye</th><th>Power</th><th>Stage</th><th>Status</th><th class="share-cell">Feed</th></tr></thead>
        <tbody>${patientRows}</tbody>
      </table>
    </div>
  `;
}

function renderSizing() {
  // Vault chart — simulated 6-month prediction
  const vaults = [
    { m: "1w",  v: 520 },
    { m: "1m",  v: 480 },
    { m: "3m",  v: 440 },
    { m: "6m",  v: 420, target: true },
    { m: "12m", v: 400 },
    { m: "24m", v: 380 },
  ];
  const maxV = 600;
  const vaultBars = vaults.map(x => `
    <div class="bar">
      <div class="b ${x.target ? 'target' : ''}" style="height:${(x.v/maxV)*100}%"><span>${x.v}</span></div>
      <div class="lbl">${x.m}</div>
    </div>
  `).join("");

  return `
    ${moduleHead("02 · SIZING · ICL GURU", "AI-assisted sizing you can defend.", "Every biometry, every formula, every outcome — compounded into a size + power recommendation with confidence bands.")}
    <div class="mod-grid split-hero">
      <div class="ai-panel">
        <span class="ai-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          ICL GURU · RECOMMENDATION
        </span>
        <h3 style="margin-top:4px; color:white">Based on 47,280 ICL outcomes</h3>
        <div class="ai-rec">
          <div>
            <div class="big">12.6<span class="u">mm</span></div>
            <div class="big" style="font-size:22px; color:white; margin-top:4px">EVO+ V4c · -8.00 D</div>
            <div class="meta">Eye: OD · ATA: 12.1 · STS: 11.9 · ACD: 3.24</div>
            <div class="conf">Confidence 89%</div>
            <div class="bar"><span style="width:89%"></span></div>
          </div>
        </div>
        <div style="margin-top:16px; display:flex; gap:8px;">
          <button class="btn" style="background:var(--gold); color:white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Accept recommendation
          </button>
          <button class="btn" style="background:rgba(255,255,255,.08); color:white; border:1px solid rgba(255,255,255,.2)">Override</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>Multi-formula comparison</h3>
          <span class="chip">5 models</span>
        </div>
        <div class="formula-row winner">
          <span class="name">ICL Guru AI (REVAI)</span>
          <span class="val">12.6 mm<span class="tag">Winner</span></span>
        </div>
        <div class="formula-row"><span class="name">NK formula</span><span class="val">12.6 mm</span></div>
        <div class="formula-row"><span class="name">KS formula (modified)</span><span class="val">13.2 mm</span></div>
        <div class="formula-row"><span class="name">Manufacturer nomogram</span><span class="val">12.6 mm</span></div>
        <div class="formula-row"><span class="name">Surgeon historical</span><span class="val">12.6 mm</span></div>
        <div class="muted small mt-14">4/5 formulas converge on 12.6 · KS outlier documented in cases with STS &lt; 12.0</div>
      </div>
    </div>

    <div class="panel mt-18">
      <div class="panel-head">
        <h3>Vault prediction · 24-month horizon</h3>
        <span class="chip ai">Trained on 47k outcomes</span>
      </div>
      <div class="vault-chart">${vaultBars}</div>
      <div class="muted small" style="text-align:center; margin-top:8px">Target vault 250–750 µm · Predicted median stays in green zone across 24 months</div>
    </div>
  `;
}

function renderOrder() {
  // Synthesize extended order data with surgery dates and alert signals
  // TODAY (demo): Apr 23, 2026
  const TODAY = new Date(2026, 3, 23);
  const days = (dateStr) => {
    if (!dateStr || dateStr === '—') return null;
    const [mo, d] = dateStr.split(' ');
    const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    return Math.round((new Date(2026, months[mo], parseInt(d)) - TODAY) / 86400000);
  };

  // Enrich base 4 with synthesized surgeryDate + alerts, and add more rows for realism
  const baseOrders = DATA.orders.slice();
  const extra = [
    { lot: "LOT-241020-F", patient: "S. Ortega",    sku: "EVO  -5.75 / 13.2", status: "confirmed", eta: "Apr 27", surgery: "May 2",  flags: ["tight-eta"] },
    { lot: "LOT-241021-G", patient: "C. Navarro",   sku: "EVO+ -10.25 / 13.2", status: "requested", eta: "Apr 30", surgery: "May 4",  flags: ["tight-eta","high-power"] },
    { lot: "LOT-241014-H", patient: "D. Fernández", sku: "EVO  -4.50 / 12.6", status: "requested", eta: "Apr 29", surgery: "Apr 26", flags: ["eta-past-surgery"] },
    { lot: "LOT-241013-I", patient: "M. Rojas",     sku: "EVO+ -8.25 / 13.7", status: "shipped",   eta: "Apr 24", surgery: "May 1",  flags: [] },
    { lot: "LOT-241011-J", patient: "G. Ibáñez",    sku: "EVO  -6.00 / 12.6", status: "confirmed", eta: "Apr 26", surgery: "May 3",  flags: [] },
  ];
  // Map surgery dates to existing baseOrders
  const allOrders = [
    { ...baseOrders[0], surgery: "Apr 25", flags: [] },
    { ...baseOrders[1], surgery: "Apr 25", flags: [] },
    { ...baseOrders[2], surgery: "Apr 28", flags: ["delayed"] },
    { ...baseOrders[3], surgery: "Apr 20", flags: [] },
    ...extra,
  ].map(o => {
    const etaD = days(o.eta);
    const sxD  = days(o.surgery);
    const flags = [...(o.flags || [])];
    if (etaD != null && sxD != null && etaD > sxD) flags.push("eta-past-surgery");
    if (etaD != null && sxD != null && sxD - etaD < 2 && sxD - etaD >= 0) flags.push("tight-margin");
    return { ...o, etaD, sxD, flags: [...new Set(flags)] };
  });

  const statusBuckets = { requested: [], confirmed: [], shipped: [], received: [] };
  allOrders.forEach(o => { (statusBuckets[o.status] || []).push(o); });

  const alertsOrders = allOrders.filter(o => o.flags.length > 0);
  const criticalCount = alertsOrders.filter(o => o.flags.includes('eta-past-surgery') || o.flags.includes('delayed')).length;
  const warningCount  = alertsOrders.length - criticalCount;
  const arrivingThisWeek = allOrders.filter(o => o.etaD != null && o.etaD >= 0 && o.etaD <= 7 && o.status !== 'received').length;

  const alertIcon = (flags) => {
    if (flags.includes('eta-past-surgery') || flags.includes('delayed')) return `<span class="ord-alert critical"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>Critical</span>`;
    if (flags.includes('tight-eta') || flags.includes('tight-margin') || flags.includes('high-power')) return `<span class="ord-alert warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>Watch</span>`;
    return '';
  };
  const flagText = (f) => ({
    'eta-past-surgery': 'ETA is AFTER surgery date',
    'tight-eta':        'Tight ETA · <48h buffer to surgery',
    'tight-margin':     'Tight margin to surgery date',
    'delayed':          'Delayed shipment · carrier exception',
    'high-power':       'High-power lens · rare SKU',
  }[f] || f);

  const statusChipCls = (s) => s === 'received' ? 'done' : s === 'shipped' ? 'ok' : s === 'confirmed' ? 'wait' : 'warn';
  const statusLbl = (s) => ({requested: 'Requested', confirmed: 'Confirmed', shipped: 'In transit', received: 'Received'})[s] || s;

  const orderRows = allOrders.map(o => `
    <tr class="${o.flags.length ? (o.flags.includes('eta-past-surgery') || o.flags.includes('delayed') ? 'row-critical' : 'row-warn') : ''}">
      <td><b>${o.lot}</b><div class="subtle">${o.patient}</div></td>
      <td class="subtle">${o.sku}</td>
      <td>${o.eta} ${o.etaD != null ? `<span class="eta-delta ${o.etaD < 0 ? 'late' : o.etaD <= 3 ? 'tight' : 'ok'}">${o.etaD < 0 ? o.etaD + 'd late' : o.etaD === 0 ? 'today' : '+' + o.etaD + 'd'}</span>` : ''}</td>
      <td>${o.surgery} ${o.sxD != null && o.etaD != null ? `<span class="sx-delta ${o.etaD > o.sxD ? 'critical' : o.sxD - o.etaD < 2 ? 'tight' : 'ok'}">${o.etaD > o.sxD ? '✖ after surgery' : o.sxD - o.etaD <= 1 ? 'margin ' + (o.sxD - o.etaD) + 'd' : '✓'}</span>` : ''}</td>
      <td><span class="status ${statusChipCls(o.status)}"><span class="sdot"></span>${statusLbl(o.status)}</span></td>
      <td>${alertIcon(o.flags)}</td>
    </tr>
  `).join("");

  const alertItemsHtml = alertsOrders.map(o => {
    const severity = o.flags.includes('eta-past-surgery') || o.flags.includes('delayed') ? 'critical' : 'warn';
    return `
      <div class="ord-alert-item ${severity}">
        <div class="ord-alert-ic">
          ${severity === 'critical'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'}
        </div>
        <div class="ord-alert-body">
          <div class="lot"><b>${o.lot}</b> · ${o.patient} <span class="sku">${o.sku}</span></div>
          <div class="flags">${o.flags.map(f => `<span class="flag-pill">${flagText(f)}</span>`).join('')}</div>
          <div class="meta">ETA <b>${o.eta}</b> ${o.etaD != null ? `(${o.etaD >= 0 ? '+' + o.etaD + 'd' : o.etaD + 'd'})` : ''} · Surgery <b>${o.surgery}</b> ${o.sxD != null ? `(${o.sxD >= 0 ? '+' + o.sxD + 'd' : o.sxD + 'd'})` : ''}</div>
        </div>
        <button class="btn btn-ghost small">Escalate</button>
      </div>
    `;
  }).join("");

  // Kanban-style status buckets
  const statusGridHtml = ['requested','confirmed','shipped','received'].map(s => `
    <div class="ord-bucket ${s}">
      <div class="bucket-head"><span class="nm">${statusLbl(s)}</span><span class="ct">${statusBuckets[s].length}</span></div>
      ${statusBuckets[s].map(o => `
        <div class="bucket-item ${o.flags.length ? (o.flags.includes('eta-past-surgery') || o.flags.includes('delayed') ? 'critical' : 'warn') : ''}">
          <div class="b-lot">${o.lot}</div>
          <div class="b-pt">${o.patient}</div>
          <div class="b-sku">${o.sku}</div>
          <div class="b-foot"><span>ETA ${o.eta}</span><span class="b-sx">Sx ${o.surgery}</span></div>
        </div>`).join('')}
    </div>
  `).join("");

  // SKU mix summary
  const skuCount = {};
  allOrders.forEach(o => {
    const model = o.sku.startsWith('EVO+') ? 'EVO+' : o.sku.startsWith('EVO TICL') ? 'EVO TICL' : 'EVO';
    skuCount[model] = (skuCount[model] || 0) + 1;
  });

  return `
    ${moduleHead("01 · ORDER · STAAR", "Every ICL in flight, end to end.", "Real-time order status across your clinic — SKUs, ETAs, logistics exceptions, and surgery-date alignment.")}

    <!-- KPI STRIP -->
    <div class="grid grid-kpi">
      <div class="card kpi">
        <span class="kpi-label">Active orders</span>
        <span class="kpi-value">${allOrders.filter(o => o.status !== 'received').length} <span class="unit">of ${allOrders.length}</span></span>
        <span class="muted small">In pipeline right now</span>
      </div>
      <div class="card kpi" style="${criticalCount > 0 ? 'border-color:rgba(228,81,103,.4);background:rgba(228,81,103,.04)' : ''}">
        <span class="kpi-label" style="color:${criticalCount > 0 ? '#B03144' : ''}">Critical alerts</span>
        <span class="kpi-value" style="color:${criticalCount > 0 ? '#B03144' : ''}">${criticalCount}</span>
        <span class="muted small">Delayed or ETA past surgery</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">Watch list</span>
        <span class="kpi-value" style="color:${warningCount > 0 ? '#A1641A' : ''}">${warningCount}</span>
        <span class="muted small">Tight margin to surgery</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">Arriving this week</span>
        <span class="kpi-value">${arrivingThisWeek}</span>
        <span class="muted small">ETA ≤ 7 days</span>
      </div>
    </div>

    ${alertsOrders.length > 0 ? `
      <div class="panel mt-18">
        <div class="panel-head">
          <h3>Active alerts</h3>
          <span class="chip" style="background:rgba(228,81,103,.12);color:#B03144">${criticalCount} critical · ${warningCount} watch</span>
        </div>
        <p class="muted" style="margin-bottom:12px">Orders that need attention — delayed shipments, ETA past surgery, or tight delivery margin.</p>
        <div class="ord-alert-list">${alertItemsHtml}</div>
      </div>` : ''}

    <div class="panel mt-18">
      <div class="panel-head">
        <h3>Orders by status</h3>
        <span class="chip">${allOrders.length} total</span>
      </div>
      <p class="muted" style="margin-bottom:12px">Kanban-style view of every order in the clinic.</p>
      <div class="ord-bucket-grid">${statusGridHtml}</div>
    </div>

    <div class="panel mt-18">
      <div class="panel-head">
        <h3>All orders</h3>
        <button class="btn btn-ghost small">Export CSV</button>
      </div>
      <p class="muted" style="margin-bottom:12px">Full table with ETA delta and surgery-date alignment.</p>
      <table class="tbl ord-table">
        <thead><tr><th>Lot · Patient</th><th>SKU</th><th>ETA</th><th>Surgery date</th><th>Status</th><th>Alert</th></tr></thead>
        <tbody>${orderRows}</tbody>
      </table>
    </div>

    <div class="mod-grid cols-3 mt-18">
      <div class="card kpi"><span class="kpi-label">Orders this month</span><span class="kpi-value">62</span><span class="muted small">Auto-created from recommendations</span></div>
      <div class="card kpi"><span class="kpi-label">Avg lead time</span><span class="kpi-value">4.1 <span class="unit">days</span></span><span class="muted small">Down from 6.3 in 2025</span></div>
      <div class="card kpi"><span class="kpi-label">Fill-rate accuracy</span><span class="kpi-value">100<span class="unit">%</span></span><span class="muted small">Zero wrong-lot incidents</span></div>
    </div>

    <div class="panel mt-18">
      <div class="panel-head">
        <h3>SKU mix · last 30 days</h3>
        <span class="chip">${allOrders.length} units</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:4px">
        <div class="ord-sku-tile evo"><div class="s-nm">EVO</div><div class="s-ct">${skuCount.EVO || 0}</div><div class="s-sub">Standard myopic</div></div>
        <div class="ord-sku-tile evop"><div class="s-nm">EVO+</div><div class="s-ct">${skuCount['EVO+'] || 0}</div><div class="s-sub">High-power / extended range</div></div>
        <div class="ord-sku-tile toric"><div class="s-nm">EVO TICL</div><div class="s-ct">${skuCount['EVO TICL'] || 0}</div><div class="s-sub">Toric · astigmatism correction</div></div>
      </div>
    </div>
  `;
}

function renderSurgery() {
  const orRows = DATA.orSchedule.map(o => `
    <tr>
      <td><b>${o.time}</b></td>
      <td><b>${o.patient}</b></td>
      <td class="subtle">${o.power}</td>
      <td class="subtle">${o.lot}</td>
      <td><span class="status ${o.status === 'done' ? 'done' : o.status === 'active' ? 'ok' : 'wait'}"><span class="sdot"></span>${o.status === 'done' ? 'Completed' : o.status === 'active' ? 'In OR' : 'Pre-op'}</span></td>
    </tr>
  `).join("");

  return `
    ${moduleHead("04 · SURGERY · OR CAPTURE", "Structured capture of every implant.", "Lot, power, vault, rotation — logged as the surgery happens. No retrospective chart review, no missing fields.")}
    <div class="mod-grid split-hero">
      <div class="panel or-card" style="background: linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%); color: white; border: none;">
        <span class="ai-eyebrow" style="color: var(--gold-lt)">● LIVE · QUIRÓFANO 2</span>
        <h3 style="color:white; font-size:16px; margin-top:6px">M. Herrera · OD · EVO+ 12.6 / -8.00</h3>
        <div class="or-timer">00:12:48</div>
        <div class="or-meta" style="color:#C7CBFF">
          <div>Surgeon · <b style="color:white">Dr. Roberto Zaldivar</b></div>
          <div>Stage · <b style="color:white">Injection</b></div>
          <div>Lot · <b style="color:white">LOT-241018-A</b></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3>Intra-op capture</h3>
          <span class="chip ai">Auto-fill from order</span>
        </div>
        <div class="capture-grid">
          <div class="field"><label>Lot number</label><input value="LOT-241018-A"></div>
          <div class="field"><label>Power (D)</label><input value="-8.00"></div>
          <div class="field"><label>Size (mm)</label><input value="12.6"></div>
          <div class="field"><label>Eye</label><select><option>OD</option><option>OS</option></select></div>
          <div class="field"><label>Vault (µm)</label><input value="520" placeholder="—"></div>
          <div class="field"><label>Rotation (°)</label><input value="0" placeholder="—"></div>
          <div class="field"><label>IOP post (mmHg)</label><input value="14" placeholder="—"></div>
          <div class="field"><label>Incidents</label><select><option>None</option><option>Rotation needed</option></select></div>
        </div>
        <button class="btn btn-primary mt-14">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Lock record
        </button>
      </div>
    </div>

    <div class="panel mt-18">
      <div class="panel-head">
        <h3>Today's OR schedule</h3>
        <span class="chip">3 cases</span>
      </div>
      <table class="tbl">
        <thead><tr><th>Time</th><th>Patient</th><th>Power</th><th>Lot</th><th>Status</th></tr></thead>
        <tbody>${orRows}</tbody>
      </table>
    </div>
  `;
}

function renderPostop() {
  const tl = [
    { d: "Day 1 · Apr 24",  t: "Post-op check",   b: "IOP 14 · vault 520µm · cornea clear · no pain.", tag: "done" },
    { d: "Week 1 · May 1",  t: "Follow-up",       b: "UCVA 20/20 OD · PROMs completed (92% comfort).", tag: "done" },
    { d: "Month 1 · May 24",t: "1-month review",  b: "Stable vault · no halos reported · adherence 100%.", tag: "done" },
    { d: "Month 3 · Jul 24",t: "3-month review",  b: "Scheduled · reminder sent · AS-OCT booked.", tag: "next" },
    { d: "Month 6",         t: "6-month review",  b: "Auto-schedule at M4.", tag: "" },
    { d: "Month 12",        t: "Annual review",   b: "AAA data capture · PROMs.", tag: "" },
  ];
  const tlHtml = tl.map(x => `
    <div class="tl-item ${x.tag}">
      <div class="date">${x.d}</div>
      <div class="title">${x.t}</div>
      <div class="body">${x.b}</div>
    </div>
  `).join("");

  const promHtml = DATA.proms.map(p => `
    <div class="prom-row ${p.tier}">
      <span class="lbl">${p.k}</span>
      <span class="gauge"><span style="width:${p.v}%"></span></span>
      <span class="val">${p.v}</span>
    </div>
  `).join("");

  return `
    ${moduleHead("05 · POST-OP · PROMs", "Longitudinal outcomes, captured automatically.", "Every follow-up, every PROM, every complication alert — compounding into the only AAA-grade ICL dataset in the world.")}
    <div class="mod-grid cols-2">
      <div class="panel">
        <div class="panel-head">
          <h3>Follow-up timeline · M. Herrera</h3>
          <span class="chip live">On track</span>
        </div>
        <div class="timeline">${tlHtml}</div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3>PROMs dashboard · last 90 days</h3>
          <span class="chip">412 responses</span>
        </div>
        ${promHtml}
        <div class="muted small mt-14" style="padding-top:12px; border-top:1px solid var(--line);">
          Night-vision and halo metrics below threshold — AI flag triggered for patients ${DATA.patients.slice(0,2).map(p => p.name).join(", ")}.
        </div>
      </div>
    </div>

    <div class="mod-grid cols-3 mt-18">
      <div class="card kpi">
        <span class="kpi-label">Vault accuracy 12m</span>
        <span class="kpi-value">96<span class="unit">%</span> <span class="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>+4%</span></span>
        <span class="muted small">Within 250–750 µm target</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">Complication rate</span>
        <span class="kpi-value">0.4<span class="unit">%</span></span>
        <span class="muted small">Below global benchmark 1.1%</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">Adherence to drops</span>
        <span class="kpi-value">94<span class="unit">%</span></span>
        <span class="muted small">AI nudges delivered via WhatsApp</span>
      </div>
    </div>
  `;
}

function renderCommunity() {
  const storiesHtml = DATA.stories.map(s => `
    <div class="story">
      <div class="story-ring ${s.add ? 'add' : s.state}">
        <div class="inner">${s.add ? '+' : s.av}</div>
      </div>
      <div class="nm">${s.name}</div>
    </div>
  `).join("");

  const verifiedSvg = `<svg class="verified" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 2.3 3.3-.3.3 3.3L20.3 10l-2.3 2.4.3 3.3-3.3.3L12 18l-2.4-2-3.3-.3-.3-3.3L3.7 10l2.3-2.4-.3-3.3 3.3-.3zm-1 11.4l5-5-1.4-1.4-3.6 3.6-1.8-1.8-1.4 1.4 3.2 3.2z"/></svg>`;

  const feedHtml = DATA.feed.map(f => {
    const comments = (f.topComments || []).map(c => `
      <div class="comment">
        <div class="av">${c.av}</div>
        <div style="flex:1">
          <div class="bubble"><b>${c.name}</b>${c.body}</div>
          <div class="comment-meta">
            <span>${c.time} ago</span>
            <button>${c.likes} likes</button>
            <button>Reply</button>
          </div>
        </div>
      </div>
    `).join("");
    return `
      <div class="post">
        <div class="post-head">
          <div class="av">${f.av}</div>
          <div>
            <div class="name">${f.name}${f.verified ? verifiedSvg : ''}</div>
            <div class="meta">${f.role} · ${f.time} ago · <span style="color:var(--gold)">Anonymized case</span></div>
          </div>
          <button class="more">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
        </div>
        <div class="post-body">${f.body}</div>
        ${f.hasMedia ? `
          <div class="post-media">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
            <span class="plabel">${f.mediaLabel}</span>
          </div>` : ''}
        <div class="post-stats">
          <span><b style="color:var(--ink)">${f.likes}</b> likes</span>
          <span><b style="color:var(--ink)">${f.comments}</b> comments</span>
          <span><b style="color:var(--ink)">${f.shares}</b> shares</span>
          <span style="margin-left:auto">${f.views} views</span>
        </div>
        <div class="post-actions">
          <button class="${f.likes > 500 ? 'liked' : ''}">
            <svg viewBox="0 0 24 24" fill="${f.likes > 500 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 000-7.78z"/></svg>
            Like
          </button>
          <button>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Comment
          </button>
          <button>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            Share
          </button>
          <button>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            Save
          </button>
        </div>
        ${comments ? `<div style="padding-top:6px; border-top:1px solid var(--line)">${comments}</div>` : ''}
      </div>
    `;
  }).join("");

  const pollHtml = DATA.poll.options.map(o => `
    <div class="poll-opt">
      <span class="fill" style="width:${o.pct}%"></span>
      <span class="txt">${o.txt}</span>
      <span class="pct">${o.pct}%</span>
    </div>
  `).join("");

  const trendingHtml = DATA.trending.map(t => `
    <div class="trend-item">
      <div class="cat">${t.cat}</div>
      <div class="tag">${t.tag}</div>
      <div class="posts">${t.posts}</div>
    </div>
  `).join("");

  const followHtml = DATA.whoToFollow.map(w => `
    <div class="follow-item">
      <div class="av">${w.av}</div>
      <div>
        <div class="name">${w.name}</div>
        <div class="sub">${w.sub}</div>
      </div>
      <button class="btn-follow">Follow</button>
    </div>
  `).join("");

  return `
    ${moduleHead("06 · COMMUNITY", "Surgeons teach surgeons.", "A full social network built for ICL surgeons — share cases, learn from peers, trend and poll across 412 clinics globally.")}
    <div class="mod-grid split-hero">
      <div>
        <div class="panel">
          <div class="panel-head">
            <h3>Global feed</h3>
            <div style="display:flex; gap:6px;">
              <span class="chip live">412 online</span>
              <span class="chip">+1.2k posts this week</span>
            </div>
          </div>

          <div class="stories">${storiesHtml}</div>

          <div class="composer">
            <div class="av">DC</div>
            <div class="composer-main">
              <input placeholder="Share a case, ask the community, or start a poll…">
              <div class="composer-bar">
                <button>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  Media
                </button>
                <button>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3h18v18H3zM3 12h18M12 3v18"/></svg>
                  Poll
                </button>
                <button>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15h6"/></svg>
                  Case
                </button>
                <button><span class="tag-ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>AI Draft</span></button>
                <span class="spacer"></span>
                <button class="post">Post</button>
              </div>
            </div>
          </div>

          ${feedHtml}
        </div>
      </div>

      <div>
        <div class="panel">
          <div class="panel-head">
            <h3>Trending in ICL</h3>
            <span class="chip">Now</span>
          </div>
          <div class="trending-list">${trendingHtml}</div>
        </div>

        <div class="panel mt-18">
          <div class="panel-head">
            <h3>Today's poll</h3>
            <span class="chip ai">${DATA.poll.votes} votes</span>
          </div>
          <div style="font-weight:600; font-size:13px; margin-bottom:10px; line-height:1.45">${DATA.poll.question}</div>
          ${pollHtml}
        </div>

        <div class="panel mt-18">
          <div class="panel-head">
            <h3>Who to follow</h3>
            <span class="chip">For you</span>
          </div>
          <div class="follow-list">${followHtml}</div>
        </div>
      </div>
    </div>
  `;
}
