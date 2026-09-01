/* ================================================================
   PATIENT TRELLO (kanban) — on Dashboard
================================================================ */
const TRELLO_STAGES = [
  { key: "Consult",    label: "Consult",    cls: "consult" },
  { key: "Biometry",   label: "Biometry",   cls: "biometry" },
  { key: "Eligibility",label: "Eligibility",cls: "biometry" },
  { key: "Sizing",     label: "Sizing",     cls: "sizing" },
  { key: "Scheduled",  label: "Scheduled",  cls: "scheduled" },
];
// Add a synthetic post-op patient so all 5 columns show activity
if (!DATA.patients.some(p => p.stage === "Post-op")) {
  DATA.patients.push({
    id: "2126-0410", name: "J. Rivera", age: 38, sex: "M",
    eye: "OD/OS", power: "-5.25 / -5.00", stage: "Post-op", status: "done",
    surgeryDate: "Mar 28, 2026",   // Used to compute follow-up milestone dates
    portrait: { bg: "#E2EEE3", skin: "#D7A07A", hair: "#1A0F0A", shirt: "#059669", hairShape: "short", lips: "#A94C45" },
    risk: { level: "low", score: 14, flag: "Uneventful surgery — vault 420 µm at W1, IOP 14/13, UCVA 20/20.", reco: "Continue standard follow-up (M1, M3, Y1)." }
  });
}

// === Augment to 15 total — spread across every stage ===
// Existing: Herrera(Sizing), Martínez(Scheduled), Castro(Biometry), Duarte(Consult),
//           Ortega(Eligibility), Vega(Sizing), Guzman(Scheduled), Rivera(Post-op)
// Add 7 more: Consult+1, Eligibility+1, Biometry+1, Scheduled+1, Post-op+3 (different surgery dates)
(function ensureFifteenPatients(){
  if (DATA.patients.length >= 15) return;
  var extras = [
    {
      id: "2126-0421", name: "D. Romero", age: 26, sex: "M",
      eye: "OD/OS", power: "-3.25 / -3.50", stage: "Consult", status: "wait",
      portrait: { bg: "#EFE6F8", skin: "#C9966D", hair: "#1A0E07", shirt: "#3F1A8B", hairShape: "short", lips: "#9C4942" },
      risk: null,
    },
    {
      id: "2126-0422", name: "V. Sanz", age: 35, sex: "F",
      eye: "OD/OS", power: "-5.50 / -5.75", stage: "Eligibility", status: "ok",
      portrait: { bg: "#F8E6E0", skin: "#EAB9A0", hair: "#3A1F12", shirt: "#0E7C66", hairShape: "ponytail", lips: "#B85952" },
      risk: { level: "low", score: 22, flag: "All checklist items pass — no anatomical flags.", reco: "Proceed to biometry." },
    },
    {
      id: "2126-0423", name: "F. Lima", age: 41, sex: "M",
      eye: "OD", power: "-7.25", stage: "Biometry", status: "wait",
      portrait: { bg: "#E2ECE2", skin: "#B0825F", hair: "#160B05", shirt: "#374B7E", hairShape: "short", glasses: true, beard: true, lips: "#90443C" },
      risk: { level: "med", score: 41, flag: "Borderline endothelial cell count — ECC 2,180 c/mm² near 40-yr horizon threshold.", reco: "Repeat specular microscopy in 6 months pre-op." },
    },
    {
      id: "2126-0424", name: "N. Pérez", age: 30, sex: "F",
      eye: "OD/OS", power: "-6.75 / -7.00", stage: "Scheduled", status: "ok", surgeryDate: "May 7, 2026",
      portrait: { bg: "#F2D9DC", skin: "#D8A788", hair: "#241007", shirt: "#B23B5C", hairShape: "long", lips: "#A85046" },
      risk: { level: "low", score: 18, flag: "Standard pre-op profile — surgery scheduled in 2 days.", reco: "Final consent + topical antibiotic prophylaxis." },
    },
    {
      id: "2126-0425", name: "E. Navarro", age: 45, sex: "F",
      eye: "OD/OS", power: "-4.00 / -3.75", stage: "Post-op", status: "done", surgeryDate: "Feb 5, 2026",  // ~3 months ago
      portrait: { bg: "#E8E6F2", skin: "#E0BD9C", hair: "#5A3018", shirt: "#7A4A9E", hairShape: "bob", lips: "#AF534B" },
      risk: { level: "low", score: 10, flag: "Excellent 3-month outcome — UCVA 20/15, vault 480 µm, no complications.", reco: "Routine 6-month follow-up scheduled." },
    },
    {
      id: "2126-0426", name: "T. Aguilar", age: 50, sex: "M",
      eye: "OD/OS", power: "-2.50 / -2.75", stage: "Post-op", status: "done", surgeryDate: "Nov 12, 2025",  // ~6 months ago
      portrait: { bg: "#E0EAEE", skin: "#A77754", hair: "#100604", shirt: "#1F2A55", hairShape: "short", glasses: true, lips: "#7E3E37" },
      risk: { level: "low", score: 16, flag: "Stable refractive outcome at 6 months — UCVA 20/20, vault 410 µm.", reco: "Annual ECC monitoring." },
    },
    {
      id: "2126-0427", name: "B. Solís", age: 36, sex: "F",
      eye: "OD/OS", power: "-9.00 / -8.75", stage: "Post-op", status: "done", surgeryDate: "May 2, 2025",  // ~1 year ago (Year 1 ECC)
      portrait: { bg: "#F0E4F0", skin: "#C28D6A", hair: "#28140A", shirt: "#5C18AB", hairShape: "long", lips: "#9B4944" },
      risk: { level: "med", score: 38, flag: "Year-1 ECC scan due — initial ECC 2,420, at-risk for high myopia cohort.", reco: "Schedule specular microscopy + AS-OCT vault check." },
    },
  ];
  extras.forEach(function(p){
    if (!DATA.patients.some(function(x){ return x.id === p.id; })) DATA.patients.push(p);
  });
})();

// ===== Post-op follow-up overdue tracker + AI agent log =====
// For patients in Post-op stage, derive milestone dates from surgeryDate (or a sensible default)
// and flag any milestone whose date has passed AND not yet been logged. The AI agent log is a
// mock activity record that shows the surgeon WHAT the agent did to recover the missed milestone.
function _parseSurgeryDate(s){
  if (!s) return null;
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function _addMonths(d, n){ var x = new Date(d.getTime()); x.setMonth(x.getMonth() + n); return x; }
function _daysBetween(a, b){ return Math.floor((a.getTime() - b.getTime()) / 86400000); }
function _fmtDate(d){
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// Returns one entry per post-op milestone: { key, label, dueDate, status:'done|overdue|upcoming', daysOverdue, agent? }
function getPostopFollowupState(pt){
  if (pt.stage !== 'Post-op') return [];
  var sd = _parseSurgeryDate(pt.surgeryDate);
  // Fallback: assume surgery was 35 days ago
  if (!sd) { sd = new Date(); sd.setDate(sd.getDate() - 35); }
  var today = new Date();
  var milestones = [
    { key: 'po1',  label: '1 mo',  months: 1  },
    { key: 'po3',  label: '3 mo',  months: 3  },
    { key: 'po6',  label: '6 mo',  months: 6  },
    { key: 'po12', label: '12 mo', months: 12 },
  ];
  // Mock: assume done = milestones whose due date is older than (today + 30d) — tuned per patient via seed
  // The seeded patient has surgery Mar 28 2026, today May 5 2026 → 1mo overdue by ~7 days, others future
  return milestones.map(function(m){
    var due = _addMonths(sd, m.months);
    var diff = _daysBetween(today, due); // positive = overdue
    var status, agent;
    if (diff > 0) {
      status = 'overdue';
      // Synthesize a deterministic AI agent action for the flagged milestone
      var contactDay = Math.min(diff, 2); // agent reaches out within a couple of days
      var contactDate = new Date(due.getTime()); contactDate.setDate(contactDate.getDate() + contactDay);
      agent = {
        contactedAt: contactDate,
        channel: 'WhatsApp + email',
        status: diff > 14 ? 'no_response' : (diff > 5 ? 'rescheduled' : 'confirmed_visit'),
        message: diff > 14
          ? 'Multiple touchpoints sent — patient did not respond. Escalated to clinic staff.'
          : (diff > 5
              ? 'Patient confirmed reschedule for ' + _fmtDate(_addMonths(due, 0)) + '.'
              : 'Patient confirmed visit for ' + _fmtDate(_addMonths(due, 0)) + '.'),
      };
    } else if (diff > -7) {
      status = 'upcoming';
    } else {
      status = 'future';
    }
    return { key: m.key, label: m.label, dueDate: due, daysOverdue: Math.max(0, diff), status: status, agent: agent };
  });
}

function renderPatientTrello() {
  // 4 columns — Pre-op bundles Consult + Eligibility + Biometry
  const cols = [
    { key: "Preop",     label: "Pre-op",    cls: "consult",   match: p => p.stage === "Consult" || p.stage === "Eligibility" || p.stage === "Biometry" },
    { key: "Sizing",    label: "ICL Selection", cls: "sizing", match: p => p.stage === "Sizing" },
    { key: "Scheduled", label: "Scheduled", cls: "scheduled", match: p => p.stage === "Scheduled" },
    { key: "Post-op",   label: "Post-op",   cls: "postop",    match: p => p.stage === "Post-op" },
  ];
  const colsHtml = cols.map(col => {
    const list = DATA.patients.filter(col.match);
    const cards = list.map(pt => {
      const rCls = pt.risk ? pt.risk.level : "";
      return `
        <div class="trello-card ${rCls}" onclick="openPatientFile('${pt.id}')" tabindex="0">
          <div class="tc-top">
            <div class="pt-av-xs">${portraitSvg(pt.portrait)}</div>
            <div class="tc-nm" title="${pt.name}">${pt.name}</div>
          </div>
          <div class="tc-id">REV-${pt.id} · ${pt.age}y ${pt.sex}</div>
          <div class="tc-meta">
            <span class="tc-pill eye">${pt.eye}</span>
            <span class="tc-pill pwr">${pt.power} D</span>
            ${pt.risk ? `<span class="tc-pill risk" style="background:${pt.risk.level==='high'?'rgba(228,81,103,.14)':pt.risk.level==='med'?'rgba(231,138,39,.14)':'rgba(0,156,118,.14)'};color:${pt.risk.level==='high'?'#B03144':pt.risk.level==='med'?'#A1641A':'#00754F'}">${pt.risk.level.toUpperCase()}</span>` : ''}
          </div>
          ${rCls ? `<div class="tc-risk"></div>` : ''}
        </div>`;
    }).join("");
    return `
      <div class="trello-col ${col.cls}">
        <div class="trello-col-head">
          <span class="nm">${col.label}</span>
          <span class="ct">${list.length}</span>
        </div>
        ${cards || '<div class="trello-col-empty">No patients in this stage</div>'}
      </div>`;
  }).join("");
  return `<div class="trello-board">${colsHtml}</div>`;
}
