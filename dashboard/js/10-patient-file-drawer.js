/* ================================================================
   PATIENT FILE DRAWER
================================================================ */
// Deterministic per-patient variation from id (so each patient looks unique)
function ptSeed(id, offset) {
  let h = 0; const s = String(id) + ":" + (offset||0);
  for (let i = 0; i < s.length; i++) { h = ((h<<5) - h + s.charCodeAt(i)) & 0xffff; }
  return Math.abs(h);
}
function ptRand(id, offset, lo, hi) {
  const s = ptSeed(id, offset);
  return lo + (s % 1000) / 1000 * (hi - lo);
}

// Build per-patient biometry based on power (more myopia = longer AL) + seed
function patientBiometry(pt) {
  // Real ICL Guru data override (e.g. Mariela Guzman)
  if (pt.iclGuru) {
    const g = pt.iclGuru.biometry;
    const AL  = +(23.6 + ptRand(pt.id, 1, -0.3, 0.3)).toFixed(2);
    const K1  = +(42.8 + ptRand(pt.id, 2, -0.3, 0.3)).toFixed(2);
    const K2  = +(K1 + 2.0 + ptRand(pt.id, 3, -0.1, 0.3)).toFixed(2);
    const CCT = Math.round(525 + ptRand(pt.id, 6, -20, 20));
    const Pupil = +(5.2 + ptRand(pt.id, 7, -0.3, 0.3)).toFixed(1);
    const ECC = Math.round(2750 + ptRand(pt.id, 8, -100, 150));
    return {
      AL:    { v: AL,      u: "mm",    pct: Math.min(99, Math.round((AL-23)/5*100)) },
      K1:    { v: K1,      u: "D",     pct: Math.min(99, Math.round((K1-40)/8*100)) },
      K2:    { v: K2,      u: "D",     pct: Math.min(99, Math.round((K2-40)/8*100)) },
      ACD:   { v: g.acd,   u: "mm",    pct: Math.min(99, Math.round((g.acd-2.8)/1.2*100)) },
      WTW:   { v: g.ata,   u: "mm",    pct: Math.min(99, Math.round((g.ata-11)/2*100)) },
      CCT:   { v: CCT,     u: "µm",    pct: Math.min(99, Math.round((CCT-450)/150*100)) },
      Pupil: { v: Pupil,   u: "mm",    pct: Math.min(99, Math.round((Pupil-3)/4*100)) },
      ECC:   { v: ECC,     u: "c/mm²", pct: Math.min(99, Math.round((ECC-2000)/1500*100)) },
      aRISE: { v: g.aRise, u: "mm",    pct: Math.min(99, Math.round(g.aRise*100)) },
    };
  }
  const power = parseFloat(String(pt.power).split('/')[0]) || -6;
  const AL  = +(24.5 + Math.abs(power) * 0.25 + (ptRand(pt.id, 1, -0.4, 0.4))).toFixed(2);
  const K1  = +(41.8 + ptRand(pt.id, 2, -0.6, 1.2)).toFixed(2);
  const K2  = +(K1  + 0.6 + ptRand(pt.id, 3,  0.2, 1.4)).toFixed(2);
  const ACD = +(3.10 + ptRand(pt.id, 4, -0.1, 0.55)).toFixed(2);
  const WTW = +(11.6 + ptRand(pt.id, 5, -0.3, 0.6)).toFixed(2);
  const CCT =  Math.round(500 + ptRand(pt.id, 6, -30, 50));
  const Pupil = +(4.0 + ptRand(pt.id, 7, -0.3, 2.2)).toFixed(1);
  const ECC =  Math.round(2600 + ptRand(pt.id, 8, -300, 600));
  return {
    AL:    { v: AL,    u: "mm",    pct: Math.min(99, Math.round((AL-23)/5*100)) },
    K1:    { v: K1,    u: "D",     pct: Math.min(99, Math.round((K1-40)/8*100)) },
    K2:    { v: K2,    u: "D",     pct: Math.min(99, Math.round((K2-40)/8*100)) },
    ACD:   { v: ACD,   u: "mm",    pct: Math.min(99, Math.round((ACD-2.8)/1.2*100)) },
    WTW:   { v: WTW,   u: "mm",    pct: Math.min(99, Math.round((WTW-11)/2*100)) },
    CCT:   { v: CCT,   u: "µm",    pct: Math.min(99, Math.round((CCT-450)/150*100)) },
    Pupil: { v: Pupil, u: "mm",    pct: Math.min(99, Math.round((Pupil-3)/4*100)) },
    ECC:   { v: ECC,   u: "c/mm²", pct: Math.min(99, Math.round((ECC-2000)/1500*100)) },
  };
}

// Build per-patient eligibility checklist
// 3 reference surgeons distributed across all patients deterministically
const SURGEON_POOL = [
  { name: "Dr. Roberto Zaldivar",  short: "Dr. Zaldivar",  initials: "RZ", clinic: "Instituto Zaldivar · Mendoza, AR" },
  { name: "Dr. Gregory Parkhurst", short: "Dr. Parkhurst", initials: "GP", clinic: "Parkhurst NuVision · San Antonio, USA" },
  { name: "Dr. Arthur Cummings",   short: "Dr. Cummings",  initials: "AC", clinic: "Wellington Eye Clinic · Dublin, IE" },
];
/* A case created in this session belongs to whoever is running the demo, not
   to one of the three reference surgeons the seeded patients are spread
   across — so it opens on its own clinic and its own surgeon, and either can
   be corrected. */
var NEW_CASE_SURGEON = { name: "Dr. Diego Cerutti", short: "Dr. Cerutti", initials: "DC",
                         clinic: "Centro Oftalmológico Cuyo · Mendoza, AR" };

/* The surgeon is a property of the case, so it lives where the case's decision
   and order live: localStorage, under the case key. */
var SURGEON_KEY = 'case_surgeon';
function _surgeonStore(){ try { return JSON.parse(localStorage.getItem(SURGEON_KEY) || '{}') || {}; } catch (e) { return {}; } }
function _surgeonCaseKey(pt){ return (typeof ptCaseId === 'function') ? ptCaseId(pt) : ('REV-' + pt.id); }
window.PATIENT_SURGEON = {
  get: function (pt) { return (pt && _surgeonStore()[_surgeonCaseKey(pt)]) || null; },
  set: function (pt, s) {
    if (!pt) return;
    try {
      var all = _surgeonStore(), k = _surgeonCaseKey(pt);
      if (s) all[k] = s; else delete all[k];
      localStorage.setItem(SURGEON_KEY, JSON.stringify(all));
    } catch (e) {}
  }
};

/* A typed name that matches a reference surgeon brings that surgeon's clinic
   with it; any other name keeps the clinic the case already had — renaming the
   surgeon is not a claim about where the surgery happened. */
function surgeonFromName(name, base) {
  name = String(name == null ? '' : name).trim();
  if (!name) return null;
  for (var i = 0; i < SURGEON_POOL.length; i++) {
    if (SURGEON_POOL[i].name.toLowerCase() === name.toLowerCase()) return SURGEON_POOL[i];
  }
  if (name.toLowerCase() === NEW_CASE_SURGEON.name.toLowerCase()) return NEW_CASE_SURGEON;
  var bare = name.replace(/^(Dr|Dra|Mr|Ms|Prof)\.?\s*/i, '').trim();
  var parts = bare.split(/\s+/).filter(Boolean);
  var last = parts.length ? parts[parts.length - 1] : bare;
  var initials = ((parts[0] || '?').charAt(0) + (parts.length > 1 ? last.charAt(0) : '')).toUpperCase();
  return { name: name, short: 'Dr. ' + last, initials: initials || '?',
           clinic: (base && base.clinic) || NEW_CASE_SURGEON.clinic };
}

function patientSurgeon(pt){
  if (!pt || !pt.id) return SURGEON_POOL[0];
  var over = window.PATIENT_SURGEON ? PATIENT_SURGEON.get(pt) : null;
  if (over && over.name) return over;
  if (pt.caseKey || pt.createdAt) return NEW_CASE_SURGEON;
  // Hash on id digits → pick one of 3
  var n = 0; for (var i = 0; i < pt.id.length; i++) n += pt.id.charCodeAt(i);
  return SURGEON_POOL[n % SURGEON_POOL.length];
}

function patientEligibility(pt) {
  const b = patientBiometry(pt);
  const stable = +(1 + ptRand(pt.id, 11, 0, 2)).toFixed(1);
  // Live override: when the user has been adjusting the Procedure Recommendation sliders,
  // the eligibility checklist should reflect THOSE values, not the static patient seed.
  const live = (typeof PT_PROC_REC !== 'undefined') ? (PT_PROC_REC[pt.id] || null) : null;
  const age   = live ? (parseInt(live.age, 10) || pt.age) : pt.age;
  const acdV  = live ? (parseFloat(live.acd) || b.ACD.v) : b.ACD.v;
  const cctV  = live ? (parseInt(live.cct, 10) || b.CCT.v) : b.CCT.v;
  const pupV  = live ? (parseFloat(live.pupil) || b.Pupil.v) : b.Pupil.v;
  const lensClear = live ? (live.lens === 'clear') : true;
  const lensLbl   = live ? (live.lens === 'clear' ? 'clear' : (live.lens === 'early' ? 'early NS' : 'cataract')) : 'clear';
  return [
    { lbl: "Age 21–45",            val: age + " y",                      pass: age >= 21 && age <= 45 },
    { lbl: "Stable refraction ≥1y",val: stable + " y",                   pass: stable >= 1 },
    { lbl: "ACD ≥ 3.00 mm",        val: acdV.toFixed(2),                 pass: acdV >= 3.00 },
    { lbl: "ECC ≥ 2000 c/mm²",     val: b.ECC.v.toLocaleString(),        pass: b.ECC.v >= 2000 },
    { lbl: "Pupil < 7mm mesopic",  val: pupV.toFixed(1),                 pass: pupV < 7 },
    { lbl: "No cataract / AMD",    val: lensLbl,                         pass: lensClear },
    { lbl: "IOP 10–21 mmHg",       val: (12 + Math.round(ptRand(pt.id,12,0,6))) + " mmHg", pass: true },
    { lbl: "Corneal pachymetry",   val: cctV + " µm",                    pass: cctV >= 480 },
  ];
}

// Build per-patient lens recommendation (ICL Guru)
function patientLensReco(pt) {
  // Real ICL Guru report — use the selected size + IOL power from the report
  if (pt.iclGuru) {
    const selected = pt.iclGuru.sizing.find(s => s.selected) || pt.iclGuru.sizing[0];
    const ip = pt.iclGuru.iolPower;
    const isToric = Math.abs(ip.cyl) >= 0.5;
    const model = isToric ? "EVO TICL" : "EVO ICL";
    return {
      model, size: selected.size,
      power: ip.sphere.toFixed(2),
      cyl: ip.cyl.toFixed(2),
      axis: ip.axis,
      vault: typeof selected.vaultUm === 'number' ? selected.vaultUm : 0,
      conf: 94,
      isToric,
    };
  }
  const b = patientBiometry(pt);
  const power = parseFloat(String(pt.power).split('/')[0]) || -6;
  // Size from WTW+ACD
  let size = "12.6";
  if (b.WTW.v < 11.3) size = "12.1";
  else if (b.WTW.v < 11.7) size = "12.6";
  else if (b.WTW.v < 12.1) size = "13.2";
  else size = "13.7";
  // Model
  const model = Math.abs(power) > 8 ? "EVO+ ICL" : (Math.abs(power) > 4 ? "EVO ICL" : "EVO TICL");
  // Power string (nearest 0.25 step up to nearest whole — STAAR catalog)
  const pwrStr = power.toFixed(2);
  // Vault prediction
  const vault = Math.round(380 + ptRand(pt.id, 21, -60, 180));
  const conf  = Math.min(97, Math.max(82, Math.round(86 + ptRand(pt.id, 22, -4, 11))));
  return { model, size: String(size), power: pwrStr, vault, conf };
}

// Build full patient journey timeline — 11 steps from first consult to Year 1 post-op
// Active step derived from pt.stage; earlier steps = done, later = future
// Note: "Biometry" is still a valid pt.stage (data ingestion phase) but it is no longer
// shown as a separate step in the journey — it's folded into the pre-op workflow.
const STAGE_ACTIVE_STEP = {
  "Consult":     0,   // step 0 active (First consult)
  "Biometry":    1,   // active on Eligibility workup (early pre-op work)
  "Eligibility": 1,   // active on Eligibility workup
  "Sizing":      2,   // active on ICL Guru · AI sizing
  "Scheduled":   4,   // sizing + order done, in pre-op counseling / awaiting OR
  "Surgery":     5,   // active on Surgery · ICL implant
  "Post-op":     8,   // consult → Week 1 done, Month 1 active
};
function patientJourney(pt) {
  const reco = patientLensReco(pt);
  const b = patientBiometry(pt);
  const el = patientEligibility(pt);
  const passed = el.filter(x => x.pass).length;
  const baseVault = reco.vault;
  const variation = (off) => Math.round(ptRand(pt.id, 30+off, -40, 40));
  const lot = `LOT-${pt.id.slice(-4)}-${String.fromCharCode(65 + (ptSeed(pt.id,51)%6))}`;
  const surgDur = (13 + Math.round(ptRand(pt.id,43,-2,5)));
  const incision = (90 + Math.round(ptRand(pt.id,42,-20,20)));
  const steps = [
    { group: "Pre-op",  ttl: "First consult",         date: "Feb 12, 2026", body: "Patient history · refraction · eye dominance · BCVA/UCVA · candidacy discussion.", metrics: { BCVA: "20/20", Refraction: pt.power + " D" } },
    { group: "Pre-op",  ttl: "Eligibility workup",    date: "Mar 3, 2026",  body: "8-point STAAR IFU checklist · AI Sentinel risk screen · contraindications review.", metrics: { Checklist: passed + "/" + el.length, "Risk score": (pt.risk ? (pt.risk.score + "/100 · " + pt.risk.level.toUpperCase()) : "No active flags") } },
    { group: "Sizing",  ttl: "ICL Guru · AI sizing",  date: "Mar 18, 2026", body: "AI-driven lens selection · predicted vault · size/power confirmation.",              metrics: { Lens: reco.model + " · " + reco.power + " D · " + reco.size + " mm", "Predicted vault": "~" + reco.vault + " µm", Confidence: reco.conf + "%" } },
    { group: "Sizing",  ttl: "Lens order · STAAR",    date: "Mar 22, 2026", body: "Order placed in STAAR portal · lot assigned · customs + air-freight tracked.",      metrics: { Lot: lot, SKU: reco.model + " " + reco.power + "/" + reco.size, ETA: "Apr 16, 2026" } },
    { group: "Sizing",  ttl: "Pre-op counseling",     date: "Apr 10, 2026", body: "Halos/glare/dry-eye expectations · consent signed · surgical plan finalized.",      metrics: { Plan: "Topical anesthesia · OR-1", Counseling: "Night-vision D14 check" } },
    { group: "Sizing",  ttl: "Surgery · ICL implant", date: "Apr 18, 2026", body: "OR-1 · " + patientSurgeon(pt).name + " · topical lidocaine 1% · uneventful implantation.",            metrics: { Lot: lot, Incision: incision + "°", Duration: surgDur + " min/eye" } },
    { group: "Post-op", ttl: "Day 1 check",           date: "Apr 19, 2026", body: "IOP · vault @ 24h · cornea clarity · no pain.",                                      metrics: { IOP: "14 mmHg", Vault: (baseVault + variation(1)) + " µm", Cornea: "clear" } },
    { group: "Post-op", ttl: "Week 1 check",          date: "Apr 25, 2026", body: "Early vault stability · refractive outcome confirmed.",                              metrics: { UCVA: "20/20", IOP: "13 mmHg", Vault: (baseVault + variation(2)) + " µm" } },
    { group: "Post-op", ttl: "Month 1 review",        date: "May 18, 2026", body: "AS-OCT imaging · PROMs questionnaire · night-vision assessment.",                    metrics: { UCVA: "20/20", PROMs: "9.4/10", Halos: "none" } },
    { group: "Post-op", ttl: "Month 3 review",        date: "Jul 18, 2026", body: "Stabilized visual outcomes · patient reminder auto-sent.",                           metrics: { UCVA: "20/20", Vault: "~" + baseVault + " µm" } },
    { group: "Post-op", ttl: "Year 1 · ECC",          date: "Apr 18, 2027", body: "Endothelial cell count · long-term monitoring starts.",                              metrics: { ECC: "target ≥ 2,600 c/mm²" } },
  ];
  const active = STAGE_ACTIVE_STEP[pt.stage] != null ? STAGE_ACTIVE_STEP[pt.stage] : 0;
  steps.forEach((s, i) => {
    s.status = i < active ? "done" : (i === active ? "active" : "future");
    s.idx = i;
  });
  return steps;
}

let CURRENT_PT = null;
let CURRENT_PT_TAB = "preop";
let PREV_MOD = "patients";   // the registry, not the clinic home Phase 1 does not ship
