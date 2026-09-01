/* ========= COPILOT: synthetic data for coherent answers ========= */
// AR orders this month (April 2026), by SKU. Rolled up from clinic telemetry.
const AR_ORDERS_THIS_MONTH = {
  month: 'April 2026',
  totalLenses: 4160,
  deltaMom: '+14.2%',
  deltaYoy: '+28.4%',
  bySku: [
    { sku:'EVO Viva',       code:'VIVA',  lenses:320,  share:7.7,  momDelta:'+41%',  note:'Just launched in AR (March 2026)' },
    { sku:'EVO+ Sphere',    code:'EVO+',  lenses:1840, share:44.2, momDelta:'+12%',  note:'Top SKU · -10D to -18D concentration' },
    { sku:'EVO+ TICL',      code:'TICL+', lenses:980,  share:23.6, momDelta:'+18%',  note:'Astigmatism segment accelerating' },
    { sku:'EVO Sphere',     code:'EVO',   lenses:690,  share:16.6, momDelta:'-4%',   note:'Cannibalized by EVO+ upgrade path' },
    { sku:'EVO TICL',       code:'TICL',  lenses:330,  share:7.9,  momDelta:'+3%',   note:'Stable legacy volume' }
  ],
  byClinic: [
    { clinic:'IZ. Sede Callao',           region:'Capital Federal',    lenses:628, delta:'+16%' },
    { clinic:'IZ. Sede Mendoza',          region:'Mendoza',            lenses:612, delta:'+19%' },
    { clinic:'VS. Sede Mendoza',          region:'Mendoza',            lenses:548, delta:'+12%' },
    { clinic:'Instituto de la Visión',    region:'Buenos Aires',       lenses:296, delta:'+22%' },
    { clinic:'Centro de Ojos Quilmes',    region:'Buenos Aires',       lenses:178, delta:'+8%' },
    { clinic:'FZ. Sede Mendoza',          region:'Mendoza',            lenses:142, delta:'+6%' },
    { clinic:'Centro Oftalmológico Rosario', region:'Santa Fe',       lenses:126, delta:'+31%' },
    { clinic:'24 other AR clinics',       region:'—',                  lenses:1630, delta:'+14%' }
  ]
};

// AR 3-month forecast (global Demand Forecaster · MAPE 4.1%)
const AR_FORECAST = {
  horizon: 'May–July 2026',
  mape: 4.1,
  months: [
    { m:'May 2026',  base:4640, low:4450, high:4810, dom:'+11.5%', top:'EVO+ Sphere' },
    { m:'Jun 2026',  base:4920, low:4700, high:5140, dom:'+6.0%',  top:'EVO+ TICL'    },
    { m:'Jul 2026',  base:5210, low:4960, high:5480, dom:'+5.9%',  top:'EVO+ TICL'    }
  ],
  drivers: [
    'Seasonal uplift: pre-winter AR surgery peak (May–July)',
    'EVO Viva ramp-up: +54% MoM as 6 new surgeons complete certification',
    'Campaign-driven: IZ. Callao DTC TikTok +2.1M views (Dr. Wallace Chamon reshare)',
    'Competitor friction: ICL-L distributor stockout in Buenos Aires (21 days)'
  ],
  risk: 'Medium: ANMAT customs window tightens in June — 4 day shipment delays expected. Safety stock: +12% recommended.'
};

// Dissatisfied patients (dPROMs score < 30 on 100-point NEI-VFQ-25)
// 142 patients globally over last 6 months. These are the top characteristics.
const DISSAT = {
  total: 142,
  pct: 0.080, // 0.08% of 177,980 surgeries
  avgScoreDissat: 24.8,
  avgScoreBaseline: 87.3,
  topCountries: [
    { iso:'CN', n:'China',    flag:'🇨🇳', count:38, rate:0.18, ctx:'Night halos; high myopia segment' },
    { iso:'IN', n:'India',    flag:'🇮🇳', count:21, rate:0.15, ctx:'Starburst + shallow ACD cohort' },
    { iso:'BR', n:'Brazil',   flag:'🇧🇷', count:18, rate:0.12, ctx:'Early EVO (non-Viva), older surgeons' },
    { iso:'MX', n:'Mexico',   flag:'🇲🇽', count:13, rate:0.11, ctx:'Dry eye pre-op, undertreated' },
    { iso:'AR', n:'Argentina',flag:'🇦🇷', count:9,  rate:0.04, ctx:'Large pupils >6.8mm mesopic' },
    { iso:'JP', n:'Japan',    flag:'🇯🇵', count:8,  rate:0.06, ctx:'Residual cyl >0.75D' },
    { iso:'KR', n:'Korea',    flag:'🇰🇷', count:7,  rate:0.08, ctx:'Halo · high-order aberrations' }
  ],
  topClinics: [
    { c:'ClearVision Beijing',       iso:'CN', flag:'🇨🇳', count:11, rate:0.38 },
    { c:'Parkway Eye Shanghai',      iso:'CN', flag:'🇨🇳', count:9,  rate:0.24 },
    { c:'Centre for Sight — Delhi',  iso:'IN', flag:'🇮🇳', count:8,  rate:0.22 },
    { c:'Santa Lucia — São Paulo',   iso:'BR', flag:'🇧🇷', count:7,  rate:0.19 },
    { c:'Salauddin Eye Hospital',    iso:'IN', flag:'🇮🇳', count:6,  rate:0.18 },
    { c:'Visionprime — Guadalajara', iso:'MX', flag:'🇲🇽', count:5,  rate:0.15 },
    { c:'IZ. Sede Callao',           iso:'AR', flag:'🇦🇷', count:4,  rate:0.09 }
  ],
  topSurgeons: [
    { s:'Dr. Wei Zhang',    clinic:'ClearVision Beijing',       iso:'CN', count:8, note:'High-volume >3K/yr · pupil screen gap' },
    { s:'Dr. Rajesh Menon', clinic:'Centre for Sight — Delhi',  iso:'IN', count:6, note:'Pre-op tomography incomplete in 23% of cases' },
    { s:'Dr. Liu Yang',     clinic:'Parkway Eye Shanghai',      iso:'CN', count:5, note:'Non-Viva EVO in high myopia' },
    { s:'Dr. Carlos Moraes',clinic:'Santa Lucia — São Paulo',   iso:'BR', count:4, note:'Pre-TO certification cohort' },
    { s:'Dr. Priya Sharma', clinic:'Salauddin Eye Hospital',    iso:'IN', count:3, note:'Residual cyl >1.25D in 3/3 cases' }
  ],
  commonTraits: [
    { label:'Mesopic pupil ≥ 6.5 mm',       pct:68, baseline:22 },
    { label:'High myopia (−10D to −18D)',    pct:61, baseline:34 },
    { label:'Age 38–47 yrs',                 pct:54, baseline:41 },
    { label:'Pre-op dry-eye (OSDI > 22)',    pct:47, baseline:18 },
    { label:'Non-Viva EVO (no extended DoF)', pct:43, baseline:28 },
    { label:'Astigmatism >1.0D residual',    pct:38, baseline:7  },
    { label:'Night-driving occupation',      pct:31, baseline:12 }
  ],
  topComplaints: [
    { c:'Halos & glare at night',   pct:72 },
    { c:'Starburst around lights',  pct:54 },
    { c:'Reduced contrast (mesopic)', pct:41 },
    { c:'Dry-eye symptoms',         pct:38 },
    { c:'Residual refractive error',pct:27 }
  ]
};
