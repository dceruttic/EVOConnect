/* ================================================================
   DATA — example patients, orders, cases, etc.
================================================================ */
const DATA = {
  patient: {
    id: "REV-2126-0418",
    name: "María J. Herrera",
    age: 32, sex: "F",
    eye: "OD", power: "-8.00", cyl: "-1.25 × 85°",
    surgeryDate: "Apr 24, 2026",
    surgeon: "Dr. Roberto Zaldivar",
  },
  patients: [
    {
      id: "2126-0418", name: "M. Herrera", age: 32, sex: "F",
      eye: "OD/OS", power: "-8.00 / -7.75", stage: "Sizing", status: "wait",
      portrait: { bg: "#F5E3D0", skin: "#D9A47E", hair: "#2A1410", shirt: "#7F21E0", hairShape: "long", lips: "#B25B55" },
      risk: {
        level: "high", score: 72,
        flag: "Shallow anterior chamber — <b>ACD 3.24 mm</b> is near the lower safe threshold; risk of endothelial contact if vault runs high.",
        reco: "Confirm STS with second Pentacam; consider 12.6 EVO+ over 13.2.",
      },
    },
    {
      id: "2126-0417", name: "P. Martínez", age: 28, sex: "M",
      eye: "OD/OS", power: "-6.50 / -6.25", stage: "Scheduled", status: "ok",
      portrait: { bg: "#E6EBF5", skin: "#E8BE99", hair: "#4A2E19", shirt: "#2472D3", hairShape: "short", lips: "#A9564F" },
      risk: {
        level: "med", score: 48,
        flag: "Night-vision PROM trending down — mesopic pupil <b>6.1 mm</b> could give halos in the first 60 days.",
        reco: "Counsel explicitly on halos. Schedule D14 night-vision PROM check.",
      },
    },
    {
      id: "2126-0416", name: "L. Castro", age: 41, sex: "F",
      eye: "OD/OS", power: "-4.25 / -4.00", stage: "Biometry", status: "wait",
      portrait: { bg: "#EEE0F5", skin: "#C98E6C", hair: "#1F110A", shirt: "#58377E", hairShape: "bob", lips: "#A14C44" },
      risk: null,
    },
    {
      id: "2126-0415", name: "A. Duarte", age: 36, sex: "M",
      eye: "OD/OS", power: "-9.25 / -9.50", stage: "Consult", status: "wait",
      portrait: { bg: "#DFE8E4", skin: "#A47557", hair: "#140907", shirt: "#1E3A57", hairShape: "short", beard: true, lips: "#8E4039" },
      risk: {
        level: "med", score: 54,
        flag: "High myopia <b>-9.50 D</b> + ECC trending −2% YoY — borderline endothelial reserve for 40-year horizon.",
        reco: "Repeat specular microscopy before sizing; consider deferred implantation if ECC < 2,500.",
      },
    },
    {
      id: "2126-0414", name: "S. Ortega", age: 29, sex: "F",
      eye: "OD/OS", power: "-5.75 / -5.50", stage: "Eligibility", status: "warn",
      portrait: { bg: "#F3D7DA", skin: "#EAC098", hair: "#6E3A14", shirt: "#C14A6C", hairShape: "ponytail", lips: "#B5524F" },
      risk: {
        level: "high", score: 68,
        flag: "Borderline ACD <b>2.98 mm</b> + mesopic pupil 6.4 mm — eligibility at edge of STAAR IFU.",
        reco: "Re-scan in 7 days; if ACD stable, counsel on PRK as alternative.",
      },
    },
    {
      id: "2126-0413", name: "R. Vega", age: 34, sex: "M",
      eye: "OD", power: "-7.00", stage: "Sizing", status: "wait",
      portrait: { bg: "#E3ECE8", skin: "#DBAC86", hair: "#2A1C13", shirt: "#0F2E5C", hairShape: "short", glasses: true, lips: "#A8554C" },
      risk: {
        level: "low", score: 22,
        flag: "Family history of early cataract — flag for 24-month follow-up. No contraindication for ICL now.",
        reco: "Add to long-term ECC watchlist; no workflow change required.",
      },
    },
    {
      // Real ICL Guru PRO case — sizing report from 2026-04-22
      id: "2126-0420", name: "Mariela Guzman", age: 38, sex: "Other",
      eye: "OD", power: "-0.50", stage: "Scheduled", status: "ok",
      portrait: { bg: "#F5DDD4", skin: "#D4A085", hair: "#3B2418", shirt: "#3F4A78", hairShape: "long", lips: "#A8544B" },
      risk: {
        level: "med", score: 52,
        flag: "Significant anatomical asymmetry between both eyes · borderline ACD <b>3.00 mm</b> (exactly at STAAR IFU threshold) · high astigmatism 2.0 D requiring toric lens.",
        reco: "Proceed with 12.1 mm (89% ideal vault band) — 12.6 mm pushes vault to 544 µm (high side of safe zone). Larger sizes hypervault.",
      },
      iclGuru: {
        calcMethod: "T2",
        date: "2026-04-22",
        time: "13:47",
        iolPower: { sphere: -0.5, cyl: 2.0, axis: 1 },
        biometry: { ata: 11.78, aRise: 0.191, acd: 3.00 },
        sizing: [
          { size: "12.1", vaultUm: 243,  peripheralUm: 243,  angle: 25.816, stability: "high", zones: [ { band: "low", pct: 11, color: "#F6BF2C" }, { band: "ideal", pct: 89, color: "#03B496" } ], selected: true },
          { size: "12.6", vaultUm: 544,  peripheralUm: 544,  angle: 21.629, stability: "high", zones: [ { band: "ideal", pct: 65, color: "#03B496" }, { band: "high", pct: 35, color: "#3371C3" } ] },
          { size: "13.2", vaultUm: 1025, peripheralUm: 1025, angle: 15.48,  stability: "high", zones: [ { band: "high", pct: 45, color: "#3371C3" }, { band: "hyper", pct: 53, color: "#B845D5" } ] },
          { size: "13.7", vaultUm: "HYPERVAULT", peripheralUm: "HYPERVAULT", angle: 10.712, stability: "high", zones: [ { band: "hyper", pct: 100, color: "#B845D5" } ] },
        ],
        warning: "Significant anatomical asymmetry has been detected between both eyes. This may impact the accuracy of ICLguru surgical calculations. Review carefully using clinical judgment before proceeding.",
        pdfPath: "./ICLCalculation-Mariela-Guzman-2026-04-22T13-47-OD.pdf",
      }
    },
  ],
  biometry: {
    AL:   { v: 26.82, u: "mm",  pct: 78 },
    K1:   { v: 42.18, u: "D",   pct: 52 },
    K2:   { v: 43.64, u: "D",   pct: 58 },
    ACD:  { v:  3.24, u: "mm",  pct: 64 },
    WTW:  { v: 11.82, u: "mm",  pct: 72 },
    CCT:  { v:   518, u: "µm",  pct: 46 },
    Pupil:{ v:  4.20, u: "mm",  pct: 40 },
    ECC:  { v:  2840, u: "c/mm²", pct: 88 },
  },
  eligibility: [
    { lbl: "Age 21–45",            val: "32 y",  pass: true  },
    { lbl: "Stable refraction ≥1y",val: "1.4 y", pass: true  },
    { lbl: "ACD ≥ 3.00 mm",        val: "3.24",  pass: true  },
    { lbl: "ECC ≥ 2000 c/mm²",     val: "2840",  pass: true  },
    { lbl: "Pupil < 7mm mesopic",  val: "6.1",   pass: true  },
    { lbl: "No cataract / AMD",    val: "clear", pass: true  },
    { lbl: "IOP 10–21 mmHg",       val: "15 · 14", pass: true },
    { lbl: "Corneal pachymetry",   val: "518 µm", pass: true },
  ],
  orders: [
    { lot: "LOT-241018-A", patient: "M. Herrera",   sku: "EVO+ -8.0 / 13.2", status: "shipped", eta: "Apr 22" },
    { lot: "LOT-241017-B", patient: "P. Martínez",  sku: "EVO+ -6.5 / 12.6", status: "confirmed", eta: "Apr 23" },
    { lot: "LOT-241015-C", patient: "A. Duarte",    sku: "EVO  -9.5 / 13.7", status: "requested", eta: "Apr 26" },
    { lot: "LOT-241012-D", patient: "R. Vega",      sku: "EVO+ -7.0 / 13.2", status: "received",  eta: "—"     },
  ],
  orSchedule: [
    { time: "08:30", patient: "P. Martínez",  status: "done",   power: "-6.50 / -6.25", lot: "LOT-241017-B" },
    { time: "10:15", patient: "M. Herrera",   status: "active", power: "-8.00 / -7.75", lot: "LOT-241018-A" },
    { time: "12:00", patient: "L. Castro",    status: "wait",   power: "-4.25 / -4.00", lot: "LOT-241019-E" },
  ],
  proms: [
    { k: "Visual comfort",    v: 92, tier: "good" },
    { k: "Night vision",      v: 78, tier: "mid"  },
    { k: "Halo / glare",      v: 65, tier: "warn" },
    { k: "Quality of life",   v: 96, tier: "good" },
    { k: "Adherence drops",   v: 88, tier: "good" },
    { k: "Pain / discomfort", v: 94, tier: "good" },
  ],
  feed: [
    { av: "AV", name: "Dr. A. Velásquez", role: "Mexico · 142 cases", time: "3h",
      verified: true, hasMedia: true, mediaLabel: "AS-OCT · 12-month follow-up",
      body: "Sharing a tricky high-myopia case: <b>-14.50 OD</b> with shallow ACD (3.02 mm). Went with a <a>12.6 EVO+</a> based on ICL Guru recommendation — 12-month vault sits at 340 µm. Patient is 20/20 uncorrected. <span class='hashtag'>#HighMyopia</span> <span class='hashtag'>#VaultPrediction</span> <span class='hashtag'>#ICLGuru</span>",
      likes: 134, comments: 28, shares: 12, views: "2.4k",
      topComments: [
        { av: "PC", name: "Dr. P. Chen", body: "Beautiful result. Did you use the updated sulcus-to-sulcus measurement from Pentacam? Curious about ATA correlation.", time: "2h", likes: 18 },
        { av: "MS", name: "Dr. M. Shimizu", body: "Congrats! I've had similar success with borderline ACD using the 12.6 over 13.2 — ICL Guru confidence bands are really clutch here.", time: "1h", likes: 12 },
      ]
    },
    { av: "PC", name: "Dr. P. Chen", role: "Spain · 318 cases", time: "yesterday",
      verified: true,
      body: "Anyone else seeing better vault accuracy with the latest ICL Guru build? We moved from <b>87% → 94%</b> within-target on my last 40 cases. Loving the AS-OCT integration. <span class='hashtag'>#ICLGuru</span> <span class='hashtag'>#QualityMetrics</span>",
      likes: 256, comments: 54, shares: 38, views: "8.1k",
      topComments: [
        { av: "MS", name: "Dr. M. Shimizu", body: "Saw the same jump. What's helping most in your flow — the new confidence band or the sulcus auto-detect?", time: "18h", likes: 24 },
      ]
    },
    { av: "MS", name: "Dr. M. Shimizu", role: "Japan · 267 cases", time: "2d",
      verified: true, hasMedia: true, mediaLabel: "Before / After · UCVA 20/15",
      body: "A milestone for our clinic: <b>500 ICL cases</b> done through REVAI in 18 months. Zero wrong-lot incidents, 96% vault accuracy, 4.9★ patient NPS. Numbers only tell half the story though — the workflow change is what saves us. <span class='hashtag'>#ICL500</span> <span class='hashtag'>#DigitalClinic</span>",
      likes: 892, comments: 76, shares: 124, views: "14k",
      topComments: []
    },
  ],
  stories: [
    { av: "DC", name: "Your story", add: true },
    { av: "PC", name: "Dr. Chen", state: "new" },
    { av: "MS", name: "Shimizu", state: "new" },
    { av: "KO", name: "STAAR EDU", state: "new" },
    { av: "AV", name: "Velásquez", state: "viewed" },
    { av: "RG", name: "Dr. Gómez", state: "new" },
    { av: "LT", name: "Dr. Torres", state: "viewed" },
  ],
  trending: [
    { cat: "ICL · Clinical", tag: "#VaultPrediction", posts: "1.2k posts" },
    { cat: "Workflow",        tag: "#ICLGuru",        posts: "844 posts" },
    { cat: "Case of the week",tag: "#HighMyopia",     posts: "612 posts" },
    { cat: "Training",        tag: "#ToricRotation",  posts: "308 posts" },
    { cat: "Community",       tag: "#ICL500Club",     posts: "142 posts" },
  ],
  whoToFollow: [
    { av: "KO", name: "Dr. K. Okada",   sub: "STAAR Clinical · JP · 1.8k followers" },
    { av: "LT", name: "Dr. L. Torres",  sub: "Colombia · 89 cases · rising" },
    { av: "RG", name: "Dr. R. Gómez",   sub: "Argentina · 212 cases" },
  ],
  events: [
    { type: "launch",    mo: "May", day: "08", time: "—",      title: "STAAR launches EVO Viva · extended depth of focus",  sub: "New presbyopic ICL · global rollout phase 1 · Tokyo HQ" },
    { type: "congress",  mo: "May", day: "15", time: "09:00",  title: "ESCRS 2026 · Vienna",                  sub: "European Society of Cataract & Refractive Surgeons · 4 days · REVAI booth #E42" },
    { type: "launch",    mo: "May", day: "22", time: "18:00",  title: "ICL Guru v4 release webinar",          sub: "REVAI · new AI-vault prediction model · 2.1k registered" },
    { type: "congress",  mo: "Jun", day: "05", time: "08:30",  title: "ASCRS Annual Meeting · Los Angeles",   sub: "American Society of Cataract & Refractive Surgery · 3 days · STAAR symposium Sat" },
    { type: "training",  mo: "Jun", day: "12", time: "17:00",  title: "High-myopia masterclass · Dr. M. Shimizu",  sub: "Live · 1.0 CME credit · 8 seats left" },
    { type: "launch",    mo: "Jun", day: "20", time: "—",      title: "REVAI Copilot v2 preview",             sub: "Multimodal pre-op analysis · risk agent upgrade · early access program" },
    { type: "congress",  mo: "Jul", day: "10", time: "09:00",  title: "APACRS 2026 · Singapore",              sub: "Asia-Pacific Association of Cataract & Refractive Surgeons · 3 days" },
    { type: "community", mo: "Jul", day: "18", time: "20:00",  title: "ICL 500 Club AMA · real cases",        sub: "Community live · Dr. K. Okada + Dr. R. Gómez · 1.4k RSVPs" },
    { type: "congress",  mo: "Oct", day: "17", time: "08:30",  title: "AAO 2026 · Chicago",                   sub: "American Academy of Ophthalmology · 5 days · REVAI + STAAR pavilion" },
    { type: "training",  mo: "Oct", day: "31", time: "23:59",  title: "CME cycle deadline · 7.5 credits left", sub: "Vault prediction masterclass pending" },
  ],
  analytics: {
    // 12 months of case volume
    caseVolume: [38, 42, 51, 47, 55, 62, 58, 64, 71, 68, 74, 82],
    months:     ["May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr"],
    outcomes: { onTarget: 96, slightlyHigh: 2, slightlyLow: 1.4, reintervention: 0.6 },
    surgeons: [
      { name: "Dr. Roberto Zaldivar",  cases: 284, vault: 97, nps: 82 },
      { name: "Dr. Gregory Parkhurst", cases: 172, vault: 95, nps: 78 },
      { name: "Dr. Arthur Cummings",   cases: 108, vault: 93, nps: 74 },
      { name: "Dr. Ibarra",            cases:  68, vault: 96, nps: 80 },
    ],
    revenue: {
      months: ["Nov","Dec","Jan","Feb","Mar","Apr"],
      icl:       [186, 204, 198, 242, 268, 294],  // thousands USD
      ancillary: [ 42,  56,  62,  78,  92, 108],
    },
    funnel: [
      { label: "Consults booked",       count: 412, pct: 100 },
      { label: "Biometry completed",    count: 328, pct: 80  },
      { label: "Eligible candidates",   count: 268, pct: 65  },
      { label: "Surgery scheduled",     count: 184, pct: 45  },
      { label: "Implanted",             count: 172, pct: 42  },
    ],
    activity: [
      // 7 x 12 heatmap — rows = weekdays, cols = weeks
      [1,2,3,1,2,3,4,3,2,4,3,2],
      [2,3,4,3,4,3,2,4,3,4,4,3],
      [3,4,2,4,3,4,3,3,4,3,2,4],
      [1,2,3,2,3,4,3,4,3,4,3,4],
      [2,3,4,3,4,4,3,4,4,3,4,4],
      [0,1,0,1,0,2,1,0,1,0,1,0],
      [0,0,1,0,0,1,0,1,0,0,1,0],
    ],
  },
  poll: {
    question: "When you have a borderline ACD (3.00–3.10 mm), what's your default?",
    options: [
      { txt: "Follow AI size recommendation", pct: 58 },
      { txt: "Downsize one step manually",    pct: 22 },
      { txt: "Decline ICL, convert to LASIK", pct: 12 },
      { txt: "Refer to senior colleague",     pct:  8 },
    ],
    votes: 412,
  },
  courses: [
    { title: "Vault prediction masterclass · Dr. M. Shimizu", tag: "Advanced", len: "1h 24m", progress: 72, cme: "1.5 CME", img: "../assets/iclguru_size_card_a.svg",  imgPos: "center", category: "Vault sizing" },
    { title: "Intra-op capture: lot, power, vault workflow",   tag: "Core",     len: "48 min",  progress: 100, cme: "1.0 CME", img: "../assets/icl_implanted_v1.webp", imgPos: "center 40%", category: "OR workflow" },
    { title: "Managing toric rotation post-implant",           tag: "Clinical", len: "1h 02m",  progress: 34, cme: "1.0 CME", img: "../assets/surgery_axis_compass.svg", imgPos: "center", category: "Toric ICL" },
    { title: "Handling high-myopia over -14 D",                tag: "Advanced", len: "1h 16m",  progress: 0,  cme: "1.5 CME", img: "../assets/icl_implanted_v3.webp", imgPos: "center 35%", category: "High myopia" },
    { title: "Patient counseling: setting vault expectations", tag: "Soft",     len: "32 min",  progress: 0,  cme: "0.5 CME", img: "../assets/icl_implanted_v4.webp", imgPos: "center 30%", category: "Counseling" },
    { title: "AS-OCT interpretation for ICL candidates",       tag: "Core",     len: "54 min",  progress: 100, cme: "1.0 CME", img: "../assets/oct_real_v2.png",      imgPos: "center", category: "Imaging" },
  ],
  chat: [
    { from: "revai", av: "AI", name: "REVAI Copilot", body: "Hi Roger. I noticed the scheduled 10:15 case (M. Herrera) has ACD of 3.24 mm and K2 of 43.64. ICL Guru recommends 12.6 EVO+ with 89% confidence.", time: "09:42" },
    { from: "me",    av: "DC", name: "You", body: "Thanks. Can a STAAR clinical advisor confirm the 12.6 vs 13.2 choice given the AS-OCT shows a slightly narrow sulcus?", time: "09:43" },
    { from: "staar", av: "S",  name: "Dr. K. Okada · STAAR", body: "On it — reviewing the AS-OCT now. Sulcus-to-sulcus 11.9 mm, ATA 12.1 mm. 12.6 is the correct call; 13.2 would over-vault with this STS. Confirming.", time: "09:46" },
    { from: "revai", av: "AI", name: "REVAI Copilot", body: "Recommendation locked: 12.6 EVO+. Order auto-pre-filled in your Order module. Approve to send to STAAR.", time: "09:47" },
  ],
};
