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
    ? `<div class="val novault" title="STAAR's manufacturer nomogram (OCOS) returns the recommended ICL size only — it does not estimate postoperative vault. Pair it with a vault-prediction formula (Reinstein, Lasso, KS or ICL Guru) for a complete sizing decision.">—<em></em></div>
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
  pt: { w: 594.96, h: 841.92 },                    // page box, in PDF points
  name: { x: 78.4, baseline: 89.4, size: 12 },     // "Patient:" value
  badge: { cx: 252.6, cy: 87.5, r: 12.5, fill: '#3689E7', size: 9.5 },
  /* Page 2 · "Results": four size cards, measured from the source PDF.
     The sample report has 12.1 ringed; the ring is repainted onto whichever
     size ICL Guru actually recommends for this case. */
  cards: {
    page: 2, sizes: [12.1, 12.6, 13.2, 13.7],
    x0: 31.2, w: 119.9, step: 138.0, y0: 247.0, h: 273.9, r: 7.9,
    grow: 0.8,                       // the selected card's ring sits 0.8 pt outside
    on: '#4966FF', off: '#EEECF4'    // ring colours, sampled from the render
  }
};

/* Repaint the "selected size" ring of page 2 onto the recommended size:
   white over the ring that is there, then the ring where it belongs. */
function _guruSizeRings(pageNo, size) {
  var C = ICLGURU_REPORT.cards;
  if (pageNo !== C.page || size == null) return '';
  var want = -1, best = 0.051;
  for (var i = 0; i < C.sizes.length; i++) {
    var d = Math.abs(C.sizes[i] - Number(size));
    if (d < best) { best = d; want = i; }
  }
  if (want < 0 || want === 0) return '';   // 0 is already the ringed card
  function box(i, grow) {
    return { x: C.x0 + C.step * i - grow, y: C.y0 - grow,
             w: C.w + grow * 2, h: C.h + grow * 2, r: C.r + grow };
  }
  function rect(b, stroke, w) {
    return '<rect x="' + b.x.toFixed(2) + '" y="' + b.y.toFixed(2) + '" width="' + b.w.toFixed(2) +
      '" height="' + b.h.toFixed(2) + '" rx="' + b.r.toFixed(2) + '" fill="none" stroke="' + stroke +
      '" stroke-width="' + w + '"/>';
  }
  return rect(box(0, C.grow), '#fff', 4) + rect(box(0, 0), C.off, 1) +
         rect(box(want, 0), '#fff', 3)   + rect(box(want, C.grow), C.on, 1.5);
}

function _guruPage(src, name, eye, pageNo, size) {
  var R = ICLGURU_REPORT;
  // keep a long name inside the gap between "Patient:" and the OD/OS badge
  var fsize = R.name.size;
  if (String(name).length > 20) fsize = Math.max(8, fsize * 20 / String(name).length);
  return '<div class="guru-page">' +
    '<img src="' + src + '" alt="ICL Guru PRO report page" loading="lazy">' +
    '<svg class="guru-page-ovl" viewBox="0 0 ' + R.pt.w + ' ' + R.pt.h + '" aria-hidden="true">' +
      '<text x="' + R.name.x + '" y="' + R.name.baseline + '" font-family="Inter, system-ui, sans-serif"' +
        ' font-size="' + fsize.toFixed(2) + '" fill="#000">' + _esc(name) + '</text>' +
      '<circle cx="' + R.badge.cx + '" cy="' + R.badge.cy + '" r="' + R.badge.r + '" fill="' + R.badge.fill + '"/>' +
      '<text x="' + R.badge.cx + '" y="' + (R.badge.cy + R.badge.size * 0.35) + '" text-anchor="middle"' +
        ' font-family="Inter, system-ui, sans-serif" font-size="' + R.badge.size + '" font-weight="700"' +
        ' fill="#fff">' + _esc(eye) + '</text>' +
      _guruSizeRings(pageNo, size) +
    '</svg></div>';
}
function _esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
  return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

function openIclGuruPdf(patientId, size){
  const pt = (DATA.patients || []).find(p => p.id === patientId);
  if (!pt) return;
  closeIclGuruPdf();

  // The eye the surgeon is working on, falling back to the patient's own.
  var eye = (typeof EYE_SCOPE !== 'undefined' && (EYE_SCOPE === 'OD' || EYE_SCOPE === 'OS'))
    ? EYE_SCOPE
    : String(pt.eye || 'OD').split('/')[0].trim().toUpperCase();
  if (eye !== 'OD' && eye !== 'OS') eye = 'OD';

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
        ICLGURU_REPORT.pages.map(function (p, i) { return _guruPage(p.src, pt.name, eye, i + 1, size); }).join('') +
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
