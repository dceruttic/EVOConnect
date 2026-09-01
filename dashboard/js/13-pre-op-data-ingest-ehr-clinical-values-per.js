// ===== Pre-op data ingest: EHR clinical values + per-modality scan attachments =====
// These flow through PT_PREOP_DATA[ptId] which is consumed by ICL Selection,
// so the surgeon never has to import the same study twice.
function renderPreopDataIngestSection(pt){
  const store = _ensurePreopStore(pt.id);
  // When the EHR import has happened, show the parsed values inside the card itself
  // so the surgeon sees what's in-hand without having to open another modal.
  let ehrCardBody;
  if (store.ehrImported && store.ehrValues) {
    const v = store.ehrValues;
    ehrCardBody = `
      <span class="preop-ehr-chip imported">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        Imported · ${store.ehrPatientName || pt.name}
      </span>
      <div class="preop-ehr-values">
        <div class="pev-cell"><span class="pev-l">AL</span><span class="pev-v">${v.al}<em>mm</em></span></div>
        <div class="pev-cell"><span class="pev-l">K1</span><span class="pev-v">${v.k1}<em>D</em></span></div>
        <div class="pev-cell"><span class="pev-l">K2</span><span class="pev-v">${v.k2}<em>D</em></span></div>
        <div class="pev-cell"><span class="pev-l">ACD</span><span class="pev-v">${v.acd}<em>mm</em></span></div>
        <div class="pev-cell"><span class="pev-l">WTW</span><span class="pev-v">${v.wtw}<em>mm</em></span></div>
        <div class="pev-cell"><span class="pev-l">CCT</span><span class="pev-v">${v.cct}<em>µm</em></span></div>
      </div>`;
  } else {
    ehrCardBody = `
      <div class="pec-status"><span class="preop-ehr-chip">Not yet imported</span></div>
      <div class="preop-ehr-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#94A0B8;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        AL · K1 · K2 · ACD · WTW · CCT · pupil will appear here once imported.
      </div>`;
  }
  const modalities = [
    { code: 'OCT',      label: 'OCT',         desc: 'AS-OCT · ATA, aRISE, ACD',                       color: '#5C18AB' },
    { code: 'UBM',      label: 'UBM',         desc: 'Ultrasound · STS, ACD, lens rise',               color: '#00609B' },
    { code: 'PENTACAM', label: 'Pentacam',    desc: 'Tomography · K1/K2, ATA, CCT, anterior chamber', color: '#E78A27' },
    { code: 'IOLM',     label: 'IOL Master',  desc: 'Biometry · AL, K1/K2, ACD, WTW',                 color: '#16B386' },
  ];
  const modBtns = modalities.map(m => `
    <button type="button" class="preop-mod-btn" data-mod="${m.code}" onclick="openPreopAttachModal('${pt.id}','${m.code}')">
      <span class="pmb-ic" style="background:${m.color}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#fff;"><path d="M12 5v14M5 12h14"/></svg>
      </span>
      <span class="pmb-body">
        <span class="pmb-lbl">${m.label}</span>
        <span class="pmb-desc">${m.desc}</span>
      </span>
    </button>`).join('');
  return `
    <div class="pd-section preop-ingest-section">
      <h4>
        <span style="display:inline-flex;align-items:center;gap:8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:#5C18AB;"><path d="M21 12V7a2 2 0 00-2-2h-3.17a2 2 0 01-1.42-.59l-1.82-1.82A2 2 0 0011.17 2H5a2 2 0 00-2 2v15a2 2 0 002 2h6"/><path d="M14 17l3 3 5-5"/></svg>
          Clinical data &amp; studies
        </span>
        <span class="tag" style="background:#F4F0FF;color:#5C18AB;">flows into ICL Selection</span>
      </h4>
      <p class="muted" style="margin:-2px 0 12px;font-size:12px;">Import once here — values and scans automatically populate the ICL Selection stage so you don't have to repeat the workflow.</p>
      <div class="preop-ingest-grid">
        <div class="preop-ehr-card${store.ehrImported ? ' has-values' : ''}">
          <div class="pec-head"><div class="pec-ttl">Clinical values</div><div class="pec-sub">AL · K1 · K2 · ACD · WTW · CCT · pupil</div></div>
          ${ehrCardBody}
          <button type="button" class="preop-import-btn" onclick="importPreopFromEHR('${pt.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="8 8 12 4 16 8"/><line x1="12" y1="4" x2="12" y2="17"/></svg>
            ${store.ehrImported ? 'Re-import from EHR' : 'Import from EHR'}
          </button>
        </div>
        <div class="preop-mods-card">
          <div class="pec-head"><div class="pec-ttl">Imaging studies</div><div class="pec-sub">Eye is selected when attaching</div></div>
          <div class="preop-mods-grid">${modBtns}</div>
        </div>
      </div>
      <div id="preopAttList" class="preop-att-list">${renderPreopAttachmentsList(pt)}</div>
    </div>
  `;
}

// Compute & render the prominent "Recommended procedure" banner above the iframe.
// Surfaces the AI-ranked outcome so the surgeon doesn't have to scroll into the iframe to see it.
