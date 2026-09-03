// === STELLA order modal — submit lens order to STAAR ===
window.STAAR_ORDERS = window.STAAR_ORDERS || { count: 5, list: [] }; // baseline = 5 lenses already this month
var _stellaCurrent = null;

function openStellaOrder(patientId, code, size, vault){
  var pt = (DATA.patients || []).find(p => p.id === patientId);
  if (!pt) return;
  // Pull values from the form / patient data
  var sphMan = parseFloat((document.getElementById('sf-rx-man-sph')||{}).value) || (parseFloat(String(pt.power).split('/')[0]) || -7);
  var cylMan = parseFloat((document.getElementById('sf-rx-man-cyl')||{}).value) || -0.50;
  var axMan  = parseInt((document.getElementById('sf-rx-man-ax')||{}).value, 10) || 178;
  var k1     = parseFloat((document.getElementById('sf-rx-man-k1')||{}).value) || 43.5;
  var k2     = parseFloat((document.getElementById('sf-rx-man-k2')||{}).value) || 44.0;
  var ata    = parseFloat((document.getElementById('sf-ata')||{}).value) || 11.45;
  var acd    = parseFloat((document.getElementById('sf-acd')||{}).value) || 3.10;
  var arise  = parseFloat((document.getElementById('sf-arise')||{}).value) || 0.20;
  // Lens model: toric if any cylinder, otherwise spherical
  var hasToric = Math.abs(cylMan) >= 0.5;
  var lensModel = hasToric ? 'EVO+ TICL' : 'EVO+ ICL';
  var lensSku   = hasToric ? 'STAAR-VTICMO' : 'STAAR-VICMO';
  // Rounded power (typical STAAR ICL power steps 0.50 D)
  var orderPower = (Math.round(sphMan * 2) / 2).toFixed(2);
  var orderCyl   = hasToric ? (Math.round(cylMan * 2) / 2).toFixed(2) : '0.00';

  var eyeLabel = (EYE_SCOPE === 'BOTH') ? 'OU (OD + OS)' : EYE_SCOPE;
  // ETA — 7-12 business days from STAAR Switzerland
  var business = 7 + Math.floor(Math.random() * 6);
  var eta = new Date(); eta.setDate(eta.getDate() + business);
  var etaStr = eta.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  // Lot tracking placeholder
  var orderId = 'STELLA-' + Date.now().toString().slice(-7);

  _stellaCurrent = {
    patientId: pt.id, patientName: pt.name, eye: eyeLabel,
    formula: code, lensModel: lensModel, lensSku: lensSku,
    size: size, power: orderPower, cyl: orderCyl, axis: axMan,
    vault: vault, k1: k1, k2: k2, ata: ata, acd: acd, arise: arise,
    eta: etaStr, etaDate: eta.toISOString().slice(0,10), orderId: orderId,
  };

  var body = document.getElementById('stellaOrderBody');
  if (!body) return;
  body.innerHTML = `
    <div class="stella-section">
      <div class="stella-section-lbl">Patient</div>
      <div class="stella-row two-col">
        <div><span>Name</span><b>${pt.name}</b></div>
        <div><span>REV ID</span><b>REV-${pt.id}</b></div>
        <div><span>Age · Sex</span><b>${pt.age||'-'}y · ${pt.sex||'-'}</b></div>
        <div><span>Eye(s)</span><b>${eyeLabel}</b></div>
      </div>
    </div>

    <div class="stella-section">
      <div class="stella-section-lbl">Lens specification</div>
      <div class="stella-lens-card">
        <div class="stella-lens-name">${lensModel}<span class="stella-lens-sku">${lensSku}</span></div>
        <div class="stella-lens-grid">
          <div class="stella-spec"><span>Size</span><b>${size}<em>mm</em></b></div>
          <div class="stella-spec"><span>Sphere</span><b>${orderPower}<em>D</em></b></div>
          <div class="stella-spec"><span>Cylinder</span><b>${orderCyl}<em>D</em></b></div>
          <div class="stella-spec"><span>Axis</span><b>${axMan}<em>°</em></b></div>
          <div class="stella-spec"><span>Predicted vault</span><b>${vault}<em>µm</em></b></div>
          <div class="stella-spec"><span>Sizing formula</span><b>${code}</b></div>
        </div>
      </div>
    </div>

    <div class="stella-section">
      <div class="stella-section-lbl">Supporting clinical data</div>
      <div class="stella-row two-col">
        <div><span>K1 / K2</span><b>${k1.toFixed(2)} / ${k2.toFixed(2)} D</b></div>
        <div><span>ATA</span><b>${ata.toFixed(2)} mm</b></div>
        <div><span>ACD</span><b>${acd.toFixed(2)} mm</b></div>
        <div><span>aRISE</span><b>${arise.toFixed(2)} mm</b></div>
      </div>
    </div>

    <div class="stella-section">
      <div class="stella-section-lbl">Shipping & delivery</div>
      <div class="stella-row two-col">
        <div><span>Surgeon</span><b>${patientSurgeon(pt).name}</b></div>
        <div><span>Clinic</span><b>${patientSurgeon(pt).clinic}</b></div>
        <div><span>Origin</span><b>STAAR Surgical · Nidau, CH</b></div>
        <div><span>Estimated arrival</span><b style="color:#15803D;">${etaStr}</b></div>
      </div>
    </div>

    <div class="stella-disclaimer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0;color:#5A6478;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
      Order is final once submitted. Charges to clinic billing account. Order ID <b>${orderId}</b>.
    </div>
  `;

  var btn = document.getElementById('stellaOrderConfirmBtn');
  if (btn){ btn.disabled = false; btn.textContent = 'Submit order to STAAR'; btn.classList.remove('confirmed'); }

  var m = document.getElementById('stellaOrderModal');
  if (m){ m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeStellaOrder(){
  var m = document.getElementById('stellaOrderModal');
  if (m){ m.classList.remove('open'); document.body.style.overflow = ''; }
}

function confirmStellaOrder(){
  if (!_stellaCurrent) return closeStellaOrder();
  // Increment global counter (one lens per eye if BOTH)
  var lenses = (EYE_SCOPE === 'BOTH') ? 2 : 1;
  window.STAAR_ORDERS.count += lenses;
  window.STAAR_ORDERS.list.push(_stellaCurrent);
  // Compute EVO points earned by this order (30 per lens, +20% Silver tier bonus)
  var earnedBase = 30 * lenses;
  var earnedBonus = Math.round(earnedBase * 0.2);
  var earnedTotal = earnedBase + earnedBonus;

  // Replace the modal body with a success state showing ETA
  var body = document.getElementById('stellaOrderBody');
  if (body){
    body.innerHTML = `
      <div class="stella-success">
        <div class="stella-success-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h4>Order submitted to STAAR</h4>
        <p>STELLA Order ID <b>${_stellaCurrent.orderId}</b> · ${_stellaCurrent.lensModel}, size ${_stellaCurrent.size} mm, ${_stellaCurrent.power} D</p>
        <div class="stella-success-eta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#15803D;"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <div>
            <span class="lbl">Estimated arrival</span>
            <span class="val">${_stellaCurrent.eta}</span>
          </div>
        </div>
        ${(typeof window.evoCreditsLocked === 'function' && window.evoCreditsLocked()) ? '' : `
        <div class="stella-success-evo">
          <span>EVO Credits earned</span>
          <b>+ ${earnedTotal} EVO</b>
          <small>${earnedBase} base + ${earnedBonus} Silver tier bonus</small>
        </div>`}
        <div class="stella-success-meta">
          <div><span>Tracking</span><b>Available 24h after dispatch</b></div>
          <div><span>Ship-to</span><b>Clínica Refractiva BA</b></div>
        </div>
      </div>
    `;
  }
  var btn = document.getElementById('stellaOrderConfirmBtn');
  if (btn){ btn.textContent = 'Done'; btn.classList.add('confirmed'); btn.onclick = closeStellaOrder; }
  // Celebratory gamification toast
  awardEvoPoints(earnedTotal, 'STAAR lens ordered', earnedBase + ' base + ' + earnedBonus + ' Silver tier');
}

// Runs only the selected formulas — reactive to user's multi-select
function runSizingFormulas(patientId) {
  const pt = DATA.patients.find(p => p.id === patientId);
  if (!pt) return;
  if (typeof MANDATORY_FORMULA !== 'undefined') SELECTED_SIZING_FORMULAS.add(MANDATORY_FORMULA);
  if (SELECTED_SIZING_FORMULAS.size === 0) {
    showToast("Select at least one formula to run");
    return;
  }
  /* Every method is computed from the case inputs by the sizing engine
     (js/42): same inputs, one engine, no hard-coded sizes. */
  const raw = (window.SIZING_ENGINE ? window.SIZING_ENGINE.readInputs() : {});
  const results = SIZING_FORMULAS
    .filter(f => SELECTED_SIZING_FORMULAS.has(f.code))
    .map(f => {
      const e = window.SIZING_ENGINE ? window.SIZING_ENGINE.run(f.code, raw) : null;
      if (!e) return { ...f, vault: null, band: 'na', inputs: raw };
      return { ...f, recSize: e.recSize, vault: f.predictsVault === false ? null : e.vault,
               band: f.predictsVault === false ? 'na' : e.band,
               target: e.target, basis: e.basis, approx: e.approx,
               derived: e.derived, inputs: e.inputs };
    });

  // Cache for selectSizingFormula() / Guru promotion
  window._SF_LAST_RESULTS = { patientId, results };

  const el = document.getElementById('sfResults');
  const list = document.getElementById('sfResultsList');
  const tag = document.getElementById('sfResultTag');
  if (!el || !list) return;
  el.style.display = '';
  el.classList.remove('sf-guru-mode');
  list.classList.remove('sf-guru-mounted');
  tag.textContent = `${results.length} formula${results.length !== 1 ? 's' : ''} · ${results.filter(r=>r.band==='ideal').length} ideal`;
  list.innerHTML = `<div class="sf-comp-grid">${results.map(r => _sfResultCard(r, patientId)).join('')}</div>`;
  try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e) {}
}

function _sfResultCard(r, patientId) {
  const noVault = r.predictsVault === false;
  const bandColor = noVault
    ? "#94A0B8"
    : ({
        "hypo": "#E45167", "low": "#F59E0B", "borderline-low": "#F59E0B",
        "ideal": "#15803D", "high": "#0080C7", "hyper": "#7E22CE"
      }[r.band] || "#5A6478");
  const bandLabel = noVault
    ? "Size only"
    : (r.band === "borderline-low" ? "Borderline low" : r.band.charAt(0).toUpperCase() + r.band.slice(1));
  const vmin = 100, vmax = 1000;
  const pct = noVault ? 0 : Math.max(2, Math.min(98, ((r.vault - vmin) / (vmax - vmin)) * 100));
  const abbrev = { ICL_GURU: 'IG', REINSTEIN: 'RE', LASSO: 'LA', KS: 'KS', STAAR_NOM: 'SN', ICL_FIT: 'IF' }[r.code] || r.code.slice(0, 2);
  const isGuru = r.code === 'ICL_GURU';
  const pdfBtn = isGuru
    ? `<button class="sf-comp-pdf" type="button" onclick="event.stopPropagation();openIclGuruPdf('${patientId}', ${r.size})" title="Open the original ICL Guru PDF report">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
         View PDF
       </button>` : '';

  // Vault display: '—' for size-only formulas, with a tooltip explaining
  const vaultValHtml = noVault
    ? `<div class="val novault" title="STAAR's manufacturer nomogram returns the recommended ICL size only — it does not estimate postoperative vault. Pair it with a vault-prediction formula (Reinstein, Lasso, KS or ICL Guru) for a complete sizing decision.">—<em></em></div>
       <div class="band-tag novault-tag">Size only · no vault prediction</div>`
    : `<div class="val" style="color:${bandColor}">${r.vault}<em>µm</em></div>
       <div class="band-tag" style="background:${bandColor}1A;color:${bandColor};">${bandLabel}</div>`;

  // Safety bar: hide marker for no-vault formulas, show "N/A" overlay
  const vaultBarHtml = noVault
    ? `<div class="sf-vault-bar novault">
         <div class="zone z-low"   style="left:0%;width:11%"></div>
         <div class="zone z-bl"    style="left:11%;width:6%"></div>
         <div class="zone z-ideal" style="left:17%;width:55%"></div>
         <div class="zone z-high"  style="left:72%;width:17%"></div>
         <div class="zone z-hyper" style="left:89%;width:11%"></div>
         <div class="bar-axis">
           <span style="left:0%">100</span>
           <span style="left:25%">325</span>
           <span style="left:50%">550</span>
           <span style="left:75%">775</span>
           <span style="left:100%">1000 µm</span>
         </div>
         <div class="novault-overlay">Vault not predicted by this formula</div>
       </div>`
    : `<div class="sf-vault-bar">
         <div class="zone z-low"   style="left:0%;width:11%"></div>
         <div class="zone z-bl"    style="left:11%;width:6%"></div>
         <div class="zone z-ideal" style="left:17%;width:55%"></div>
         <div class="zone z-high"  style="left:72%;width:17%"></div>
         <div class="zone z-hyper" style="left:89%;width:11%"></div>
         <div class="marker" style="left:${pct}%;background:${bandColor}" title="${r.vault} µm"></div>
         <div class="bar-axis">
           <span style="left:0%">100</span>
           <span style="left:25%">325</span>
           <span style="left:50%">550</span>
           <span style="left:75%">775</span>
           <span style="left:100%">1000 µm</span>
         </div>
       </div>`;

  return `
    <div class="sf-comp-card ${r.band}${noVault ? ' novault' : ''}" data-formula="${r.code}" style="--bandc:${bandColor}">
      <div class="sf-comp-head">
        <div class="sf-comp-badge" style="background:${bandColor}">${abbrev}</div>
        <div class="sf-comp-name">
          <div class="nm">${r.name}</div>
          <div class="ds">${r.author}</div>
        </div>
      </div>
      <div class="sf-comp-stats">
        <div class="stat">
          <div class="lbl">Recommended size</div>
          <div class="val">${r.recSize.toFixed(1)}<em>mm</em></div>
        </div>
        <div class="stat vault">
          <div class="lbl">Predicted vault</div>
          ${vaultValHtml}
        </div>
      </div>
      ${vaultBarHtml}
      <div class="sf-comp-foot">
        <span class="conf">${r.conf}% confidence</span>
        <div class="actions">
          ${pdfBtn}
          <button class="btn btn-primary small" onclick="selectSizingFormula('${patientId}','${r.code}','${r.recSize}',${r.vault || 0},'${bandColor}')">Select</button>
        </div>
      </div>
    </div>
  `;
}

function selectSizingFormula(patientId, code, size, vault, color) {
  document.querySelectorAll('.sf-comp-card').forEach(card => {
    card.classList.toggle('selected', card.getAttribute('data-formula') === code);
  });
  const banner = document.getElementById('sfChosenBanner');
  if (banner) {
    // For ICL Guru we already render a sticky dual action bar around the report —
    // suppress the redundant "Chosen formula" banner in that case.
    if (code === 'ICL_GURU') {
      banner.style.display = 'none';
      banner.innerHTML = '';
    } else {
      banner.style.display = '';
      banner.style.borderColor = color;
      banner.style.background = color + '14';
      banner.innerHTML = `
        <div class="sf-chosen-ic" style="background:${color}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="sf-chosen-body">
          <div class="sf-chosen-lbl">Chosen formula · flows into Surgical Planner and Surgery</div>
          <div class="sf-chosen-val"><b>${code}</b> — size <b>${size} mm</b> · vault <b style="color:${color}">${vault} µm</b></div>
        </div>
        <button class="btn btn-primary small sf-order-btn" onclick="openStellaOrder('${patientId}','${code}','${size}',${vault})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
          Order via STELLA
        </button>
      `;
    }
  }

  // === Special: when ICL Guru is chosen, expand the full ICL Guru PRO report inline ===
  if (code === 'ICL_GURU') {
    const pt = DATA.patients.find(p => p.id === patientId);
    if (!pt) return;
    const gPt = pt.iclGuru ? pt : { ...pt, iclGuru: _synthesizeIclGuruFromForm(pt, vault, parseFloat(size)) };
    const list = document.getElementById('sfResultsList');
    const el = document.getElementById('sfResults');
    if (list) {
      list.classList.add('sf-guru-mounted');
      const guruHtml = renderPtSizingGuru(gPt);

      // Sticky action bar — summary + STELLA order CTA. Mounted at TOP and BOTTOM of the report.
      const actionBar = (position) => `
        <div class="sf-guru-actionbar ${position}" data-position="${position}">
          <button class="sf-guru-back" type="button" onclick="runSizingFormulas('${patientId}')" title="Back to formula comparator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div class="sf-guru-summary">
            <div class="sga-tag">ICL Guru · selected</div>
            <div class="sga-recap">
              <span class="sga-pill"><b>${size}</b> mm</span>
              <span class="sga-pill"><b>${vault}</b> µm vault</span>
              <span class="sga-pill"><b>${pt.name}</b> · ${pt.eye || 'OD'}</span>
            </div>
          </div>
          <button class="sf-guru-stella-btn" type="button" onclick="openStellaOrder('${patientId}','${code}','${size}',${vault})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
            Order via STELLA
          </button>
        </div>
      `;

      list.innerHTML = `
        ${actionBar('top')}
        <div class="sf-guru-report">${guruHtml}</div>
        ${actionBar('bottom')}
      `;
    }
    if (el) el.classList.add('sf-guru-mode');
    try { el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e) {}
  }
}

// Build a plausible iclGuru data block from form inputs + selected formula result
function _synthesizeIclGuruFromForm(pt, vault, size){
  const getN = (id, def) => parseFloat(document.getElementById(id)?.value) || def;
  const ata = getN('sf-ata', 11.45);
  const arise = getN('sf-arise', 0.20);
  const acd = getN('sf-acd', 3.10);
  const sph = getN('sf-rx-man-sph', -7.00);
  const cyl = getN('sf-rx-man-cyl', -0.50);
  const axis = parseFloat(document.getElementById('sf-rx-man-ax')?.value) || 178;
  const sizes = [12.1, 12.6, 13.2, 13.7];
  const sizing = sizes.map((s, i) => {
    const v = i === 0 ? Math.max(160, Math.min(1200, vault + (s - size) * 600))
            : i === 1 ? Math.max(160, Math.min(1200, vault + (s - size) * 600))
            : i === 2 ? Math.max(160, Math.min(1500, vault + (s - size) * 600))
            : "HYPERVAULT";
    const isHyper = v === "HYPERVAULT";
    const numV = isHyper ? 1500 : v;
    let zones;
    if (isHyper) zones = [{ band:"hyper", pct:100, color:"#7E22CE" }];
    else if (numV < 250) zones = [{ band:"low", pct:80, color:"#F59E0B" }, { band:"ideal", pct:20, color:"#15803D" }];
    else if (numV <= 750) zones = [{ band:"ideal", pct:90, color:"#15803D" }, { band:"high", pct:10, color:"#0080C7" }];
    else if (numV <= 900) zones = [{ band:"ideal", pct:30, color:"#15803D" }, { band:"high", pct:60, color:"#0080C7" }, { band:"hyper", pct:10, color:"#7E22CE" }];
    else zones = [{ band:"high", pct:35, color:"#0080C7" }, { band:"hyper", pct:65, color:"#7E22CE" }];
    return { size: s.toFixed(1), vaultUm: v, peripheralUm: v, angle: 25 - i*4, stability: "high", zones, selected: Math.abs(s - size) < 0.05 };
  });
  return {
    calcMethod: "ICL Guru",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    iolPower: { sphere: sph, cyl: Math.abs(cyl), axis: axis },
    biometry: { ata, aRise: arise, acd },
    sizing,
    pdfPath: "./ICLCalculation-Mariela-Guzman-2026-04-22T13-47-OD.pdf",
  };
}

// Open the ICL Guru PDF in a new browser tab
/* ================================================================
   ICL Guru PRO report — the real report, opened in a modal.
   ----------------------------------------------------------------
   The two pages are the original ICL Guru PDF rendered to images, with
   the patient name and the OD/OS badge redacted out of them. Those two
   fields are drawn back on top as an SVG overlay in the page's own
   coordinate system, so they scale with the page and always match the
   patient open in EVO Connect. Everything else is the document itself.
================================================================ */
var ICLGURU_REPORT = {
  pages: [{ src: '/assets/iclguru/report-p1.webp' }, { src: '/assets/iclguru/report-p2.webp' }],
  pt: { w: 594.96, h: 841.92 },              // page box, in PDF points
  font: "Inter, 'Helvetica Neue', system-ui, sans-serif",
  /* Header values. x is the label's right edge, y the text baseline —
     both read off the source PDF, so the values land in the original slots. */
  head: {
    size: 12,
    name:     { x: 78.4,  y: 89.4 },
    gender:   { x: 79.9,  y: 107.4 },
    dob:      { x: 62.7,  y: 125.4 },
    surgery:  { x: 335.4, y: 125.4 },
    mrn:      { x: 123.4, y: 160.4 },
    calcdate: { x: 131.7, y: 178.4 },
    method:   { x: 150.4, y: 196.4 },
    sph:      { x: 287.4, y: 178.4 },
    cyl:      { x: 380.6, y: 178.4 },
    axis:     { x: 503.4, y: 178.4 },
    ata:      { x: 270.9, y: 196.4 },
    arise:    { x: 394.1, y: 196.4 },
    acd:      { x: 503.4, y: 196.4 }
  },
  badge: { cx: 252.6, cy: 87.5, r: 12.5, fill: '#3689E7', size: 9.5 },
  /* Page 1 · the vault dial. Centre, per-size ring radii and the angle of the
     0 / 1000 / 1500 µm ticks, all fitted to the source drawing. */
  dial: { page: 1, cx: 288.21, cy: 407.33, rings: [57.87, 75.54, 92.45, 108.97],
          a0: 177.12, a1000: 30.44, a1500: 1.69, dot: 4.95 },
  /* Page 2 · the four size cards. */
  cards: {
    page: 2, sizes: [12.1, 12.6, 13.2, 13.7], step: 137.98,
    x0: 31.2, w: 119.9, y0: 247.0, h: 273.9, r: 7.9, grow: 0.8,
    on: '#4966FF', off: '#EEECF4', ink: '#001DB4',
    vault:  { x: 53.2,  y: 323.4, size: 11 },
    periph: { x: 53.2,  y: 348.6, size: 7 },
    angle:  { x: 114.1, y: 348.6, size: 7 },
    pill:   { x: 55.42, y: 367.2, w: 34.49, h: 13.5, gap: 1.5, size: 10.7, y1: 377.9 },
    blob:   { path: 'M86.89 385.99C88.37 385.87 95.7 386.03 97.22 386.23C98.11 386.33 99.92 386.63 101.24 386.91C107.1 388.08 113.38 388.54 123.95 388.57L129.39 388.58L130.09 388.92C131.71 389.72 132.66 391.08 132.77 392.77C132.85 393.94 132.59 394.81 131.87 395.87C130.9 397.28 130.38 398.49 129.99 400.21C129.74 401.32 129.61 409.79 129.72 417.95C129.79 423.52 129.8 423.61 130.12 424.82C130.51 426.28 130.94 427.26 131.8 428.56C132.6 429.76 132.85 430.59 132.77 431.75C132.66 433.42 131.77 434.75 130.24 435.5L129.28 435.97L125.37 435.93C116.5 435.83 106.01 436.53 101.99 437.47L101.32 437.62C98.07 438.34 95.53 438.56 90.73 438.56C85.59 438.56 83.05 438.31 79.42 437.46C75.44 436.53 64.99 435.83 56.14 435.93L52.18 435.97L51.35 435.57C49.76 434.82 48.79 433.45 48.68 431.78C48.61 430.66 48.82 429.87 49.51 428.77L49.66 428.55C50.89 426.67 51.44 425.09 51.62 422.73C51.77 420.99 51.78 405.76 51.65 402.29L51.62 401.76C51.46 399.61 50.91 397.92 49.81 396.21L49.58 395.87C48.91 394.88 48.64 394.05 48.67 392.99L48.68 392.77C48.79 391.09 49.79 389.64 51.35 388.91L52.06 388.58L57.5 388.57C67.45 388.54 74.66 388.05 79.28 387.08C81.83 386.55 83.37 386.3 85.79 386.08L86.89 385.99Z', x: 49.17, y: 386.45, w: 83.49, h: 51.49 }
  },
  /* Vault safety bands, in µm, measured off the dial's own colour arc. */
  bands: [
    { to: 36,   key: 'critical', color: '#CF2B49' },
    { to: 139,  key: 'low',      color: '#F6BF2C' },
    { to: 644,  key: 'ideal',    color: '#03B496' },
    { to: 1002, key: 'high',     color: '#3371C3' },
    { to: 1e9,  key: 'hyper',    color: '#C144D4' }
  ],
  /* Spread of the vault estimate, as a fraction of the prediction. Drives the
     band-probability chips and the split of the vault shape. Fitted to the
     sample report; an approximation, like every formula in this demo. */
  sd: 0.35
};

function _esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
  return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

/* ---- small maths shared by the chips, the shape and the dial ---- */
function _guruErf(x) {                              // Abramowitz & Stegun 7.1.26
  var s = x < 0 ? -1 : 1; x = Math.abs(x);
  var t = 1 / (1 + 0.3275911 * x);
  var y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
function _guruCdf(x, mu, sd) { return 0.5 * (1 + _guruErf((x - mu) / (sd * Math.SQRT2))); }

/* Probability mass per safety band for a vault prediction. */
function _guruBands(vault) {
  var R = ICLGURU_REPORT, sd = Math.max(25, R.sd * vault), lo = 0, out = [];
  for (var i = 0; i < R.bands.length; i++) {
    var hi = R.bands[i].to;
    var p = _guruCdf(hi, vault, sd) - _guruCdf(lo, vault, sd);
    out.push({ key: R.bands[i].key, color: R.bands[i].color, p: p });
    lo = hi;
  }
  return out;
}
/* The one or two bands the report shows, most likely first in card order. */
function _guruTopBands(vault) {
  var all = _guruBands(vault);
  var idx = all.map(function (b, i) { return i; })
               .sort(function (a, b) { return all[b].p - all[a].p; });
  var keep = [idx[0]];
  if (all[idx[1]] && all[idx[1]].p >= 0.015) keep.push(idx[1]);
  keep.sort(function (a, b) { return a - b; });        // low band on the left
  return keep.map(function (i) {
    return { key: all[i].key, color: all[i].color, pct: Math.round(all[i].p * 100) };
  });
}
function _guruBandColor(vault) {
  var R = ICLGURU_REPORT;
  for (var i = 0; i < R.bands.length; i++) if (vault <= R.bands[i].to) return R.bands[i].color;
  return R.bands[R.bands.length - 1].color;
}
/* Vault → angle on the dial. The scale is linear to 1000 µm, then compressed. */
function _guruDialAngle(v) {
  var D = ICLGURU_REPORT.dial;
  v = Math.max(0, Math.min(1500, v));
  return v <= 1000 ? D.a0 - (D.a0 - D.a1000) * (v / 1000)
                   : D.a1000 - (D.a1000 - D.a1500) * ((v - 1000) / 500);
}

/* ---- SVG helpers ---- */
function _gText(x, y, size, txt, opt) {
  opt = opt || {};
  return '<text x="' + x + '" y="' + y + '" font-family="' + ICLGURU_REPORT.font + '"' +
    ' font-size="' + size + '" font-weight="' + (opt.weight || 400) + '"' +
    (opt.anchor ? ' text-anchor="' + opt.anchor + '"' : '') +
    ' fill="' + (opt.fill || '#000') + '">' + _esc(txt) + '</text>';
}
function _gRect(x, y, w, h, r, fill, stroke, sw) {
  return '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + w.toFixed(2) +
    '" height="' + h.toFixed(2) + '" rx="' + r.toFixed(2) + '" fill="' + (fill || 'none') + '"' +
    (stroke ? ' stroke="' + stroke + '" stroke-width="' + sw + '"' : '') + '/>';
}

/* ================= the report model, built from the live case ============= */
function _guruModel(pt, eye, size) {
  var SE = window.SIZING_ENGINE;
  var raw = (SE && SE.readInputs) ? SE.readInputs() : {};
  var run = (SE && SE.run) ? SE.run('ICL_GURU', raw) : null;
  var i = (run && run.inputs) || {};
  var curve = (SE && SE.vaultBySize) ? SE.vaultBySize('ICL_GURU', raw) : null;

  function fld(id) { var e = document.getElementById(id); return e ? String(e.value).trim() : ''; }
  function n(v) { var x = parseFloat(v); return isFinite(x) ? x : null; }
  var sph = n(fld('sf-rx-man-sph')), cyl = n(fld('sf-rx-man-cyl')), ax = n(fld('sf-rx-man-ax'));
  if (sph == null) sph = n(String(pt.power || '').split('/')[eye === 'OS' ? 1 : 0]);

  return {
    name: pt.name,
    eye: eye,
    gender: pt.sex === 'F' ? 'Female' : pt.sex === 'M' ? 'Male' : 'Other',
    dob: '-',                       // the demo records age, never a date of birth
    surgery: pt.surgeryDate || 'None',
    mrn: 'REV-' + pt.id,
    calcdate: new Date().toLocaleDateString('en-GB'),
    method: 'T2',
    sph: sph == null ? '-' : sph.toFixed(1) + ' D',
    cyl: cyl == null ? '-' : Math.abs(cyl).toFixed(1) + ' D',
    axis: ax == null ? '-' : Math.round(ax) + '\u00B0',
    ata: isFinite(i.ata) ? i.ata.toFixed(3) + ' mm' : '-',
    /* aRISE is captured in mm on the pre-op form — printed as entered, so the
       report and the form always agree. (The sizing engine reads the same
       field as µm; that unit mismatch lives in the engine, not here.) */
    arise: n(fld('sf-arise')) != null ? n(fld('sf-arise')).toFixed(3) + ' mm' : '-',
    acd: isFinite(i.acd) ? i.acd.toFixed(3) + ' mm' : '-',
    size: size,
    curve: curve || []
  };
}

/* ================= drawing ================= */
function _guruHead(m) {
  var H = ICLGURU_REPORT.head, R = ICLGURU_REPORT, o = '';
  var fs = H.size;
  if (String(m.name).length > 20) fs = Math.max(8, fs * 20 / String(m.name).length);
  o += _gText(H.name.x, H.name.y, fs.toFixed(2), m.name);
  o += '<circle cx="' + R.badge.cx + '" cy="' + R.badge.cy + '" r="' + R.badge.r + '" fill="' + R.badge.fill + '"/>';
  o += _gText(R.badge.cx, R.badge.cy + R.badge.size * 0.35, R.badge.size, m.eye,
              { anchor: 'middle', weight: 700, fill: '#fff' });
  ['gender', 'dob', 'surgery', 'mrn', 'calcdate', 'method',
   'sph', 'cyl', 'axis', 'ata', 'arise', 'acd'].forEach(function (k) {
    o += _gText(H[k].x, H[k].y, H.size, m[k]);
  });
  return o;
}

function _guruDial(m) {
  var D = ICLGURU_REPORT.dial, o = '';
  m.curve.forEach(function (c, idx) {
    if (idx >= D.rings.length) return;
    var a = _guruDialAngle(c.vault) * Math.PI / 180, r = D.rings[idx];
    o += '<circle cx="' + (D.cx + r * Math.cos(a)).toFixed(2) + '" cy="' +
         (D.cy - r * Math.sin(a)).toFixed(2) + '" r="' + D.dot.toFixed(2) +
         '" fill="' + _guruBandColor(c.vault) + '"/>';
  });
  return o;
}

function _guruCards(m) {
  var C = ICLGURU_REPORT.cards, o = '';
  var want = -1;
  for (var k = 0; k < C.sizes.length; k++) if (Math.abs(C.sizes[k] - Number(m.size)) < 0.051) want = k;

  m.curve.forEach(function (c, idx) {
    if (idx >= C.sizes.length) return;
    var dx = C.step * idx;
    var hyper = c.vault > 1002;
    var mm = (c.vault / 1000).toFixed(3) + ' mm';
    o += _gText(C.vault.x + dx, C.vault.y, C.vault.size, hyper ? 'HYPERVAULT' : mm, { weight: 600 });
    o += _gText(C.periph.x + dx, C.periph.y, C.periph.size, hyper ? 'HYPERVAULT' : mm, { weight: 500 });
    /* Angle closes as the lens vaults higher — fitted to the source report. */
    var ang = Math.max(4, 29.03 - 13.22 * (c.vault / 1000));
    o += _gText(C.angle.x + dx, C.angle.y, C.angle.size,
                (Math.round(ang * 1000) / 1000) + '\u00B0', { weight: 500 });

    var tops = _guruTopBands(c.vault);
    var P = C.pill, cx = C.x0 + dx + C.w / 2;
    var total = tops.length * P.w + (tops.length - 1) * P.gap;
    tops.forEach(function (t, j) {
      var px = cx - total / 2 + j * (P.w + P.gap);
      o += _gRect(px, P.y, P.w, P.h, P.h / 2, t.color, C.ink, 0.5);
      o += _gText(px + P.w / 2, P.y1, P.size, t.pct + '%',
                  { anchor: 'middle', weight: 600, fill: '#fff' });
    });

    var B = C.blob, cid = 'guruBlob' + idx;
    var sum = tops.reduce(function (a, t) { return a + t.pct; }, 0) || 1;
    var seg = '', run = 0;
    tops.forEach(function (t) {
      var w = B.w * (t.pct / sum);
      seg += '<rect x="' + (B.x + run).toFixed(2) + '" y="' + B.y + '" width="' + (w + 0.4).toFixed(2) +
             '" height="' + B.h + '" fill="' + t.color + '"/>';
      run += w;
    });
    o += '<g transform="translate(' + dx.toFixed(2) + ',0)">' +
           '<clipPath id="' + cid + '"><path d="' + B.path + '"/></clipPath>' +
           '<g clip-path="url(#' + cid + ')">' + seg + '</g>' +
           '<path d="' + B.path + '" fill="none" stroke="' + C.ink + '" stroke-width="1.3"/>' +
         '</g>';
  });

  /* Move the "selected size" ring onto the size this case recommends. */
  if (want > 0) {
    function box(i, g) { return { x: C.x0 + C.step * i - g, y: C.y0 - g,
                                  w: C.w + g * 2, h: C.h + g * 2, r: C.r + g }; }
    var a = box(0, C.grow), b = box(0, 0), c2 = box(want, 0), d2 = box(want, C.grow);
    o += _gRect(a.x, a.y, a.w, a.h, a.r, null, '#fff', 4) +
         _gRect(b.x, b.y, b.w, b.h, b.r, null, C.off, 1) +
         _gRect(c2.x, c2.y, c2.w, c2.h, c2.r, null, '#fff', 3) +
         _gRect(d2.x, d2.y, d2.w, d2.h, d2.r, null, C.on, 1.5);
  }
  return o;
}

function _guruPage(src, m, pageNo) {
  var R = ICLGURU_REPORT;
  return '<div class="guru-page">' +
    '<img src="' + src + '" alt="ICL Guru PRO report page" loading="lazy">' +
    '<svg class="guru-page-ovl" viewBox="0 0 ' + R.pt.w + ' ' + R.pt.h + '" aria-hidden="true">' +
      _guruHead(m) +
      (pageNo === R.dial.page ? _guruDial(m) : '') +
      (pageNo === R.cards.page ? _guruCards(m) : '') +
    '</svg></div>';
}

function openIclGuruPdf(patientId, size){
  const pt = (DATA.patients || []).find(p => p.id === patientId);
  if (!pt) return;
  closeIclGuruPdf();

  // The eye the surgeon is working on, falling back to the patient's own.
  var eye = (typeof EYE_SCOPE !== 'undefined' && (EYE_SCOPE === 'OD' || EYE_SCOPE === 'OS'))
    ? EYE_SCOPE
    : String(pt.eye || 'OD').split('/')[0].trim().toUpperCase();
  if (eye !== 'OD' && eye !== 'OS') eye = 'OD';

  var _m = _guruModel(pt, eye, size);

  const wrap = document.createElement('div');
  wrap.className = 'guru-scrim';
  wrap.id = 'guruPdfModal';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', 'ICL Guru PRO report');
  wrap.innerHTML =
    '<div class="guru-doc" role="document">' +
      '<header class="guru-doc-head">' +
        '<div class="guru-doc-id">' +
          '<span class="guru-doc-brand">ICL Guru <b>PRO</b></span>' +
          '<span class="guru-doc-sub">Sizing report · ' + _esc(pt.name) + ' · REV-' + _esc(pt.id) + ' · ' + eye + '</span>' +
        '</div>' +
        '<div class="guru-doc-actions">' +
          '<button type="button" class="guru-doc-btn" data-guru="print" title="Print or save as PDF">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>' +
            'Print / Save PDF</button>' +
          '<button type="button" class="guru-doc-close" data-guru="close" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
        '</div>' +
      '</header>' +
      '<div class="guru-doc-body">' +
        ICLGURU_REPORT.pages.map(function (p, i) { return _guruPage(p.src, _m, i + 1); }).join('') +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);
  document.body.style.overflow = 'hidden';

  wrap.addEventListener('click', function (e) {
    if (e.target === wrap) return closeIclGuruPdf();
    const b = e.target.closest('[data-guru]'); if (!b) return;
    if (b.dataset.guru === 'close') closeIclGuruPdf();
    if (b.dataset.guru === 'print') {
      document.body.classList.add('guru-printing'); window.print();
      setTimeout(function () { document.body.classList.remove('guru-printing'); }, 300);
    }
  });
  wrap.tabIndex = -1; wrap.focus();
}

function closeIclGuruPdf(){
  const m = document.getElementById('guruPdfModal');
  if (m) { m.remove(); document.body.style.overflow = ''; document.body.classList.remove('guru-printing'); }
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && document.getElementById('guruPdfModal')) closeIclGuruPdf();
});
