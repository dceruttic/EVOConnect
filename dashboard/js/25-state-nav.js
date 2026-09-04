/* ================================================================
   STATE + NAV
================================================================ */
/* ================================================================
   Brand assets — REVAI + STAAR Surgical logos
================================================================ */
const STAAR_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjMuOTkgNS45OCAzMzQuNTYgMjQuNDIiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDojZmZmO3N0cm9rZS13aWR0aDowcHg7fTwvc3R5bGU+PC9kZWZzPjxnIGlkPSJfUl8iPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0ibTMzMy42MSwxNS44OGMtMi43MywwLTQuOTUtMi4yMi00Ljk1LTQuOTVzMi4yMi00Ljk0LDQuOTUtNC45NCw0Ljk0LDIuMTksNC45NCw0Ljk0LTIuMTksNC45NS00Ljk0LDQuOTVabTAtOS4yMWMtMi4zOCwwLTQuMjksMS44OS00LjI5LDQuMjdzMS45MSw0LjI5LDQuMjksNC4yOSw0LjI3LTEuOTQsNC4yNy00LjI5LTEuOTEtNC4yNy00LjI3LTQuMjdabTEuMzUsNy4xMWwtMS40Ny0yLjI0aC0xLjAzdjIuMjRoLS43NXYtNS42N2gyLjMxYy45NiwwLDEuOC42OCwxLjgsMS43MywwLDEuMjYtMS4xMiwxLjY4LTEuNDUsMS42OGwxLjUyLDIuMjZoLS45M1ptLS45My01LjAyaC0xLjU2djIuMWgxLjU2Yy40OSwwLDEuMDMtLjQ0LDEuMDMtMS4wMywwLS42My0uNTQtMS4wNy0xLjAzLTEuMDdaIi8+PC9nPjxnIGlkPSJTVEFBUl9TVVJHSUNBTCI+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtNTYsMTYuNTRjLTEuNDYtMi4xMi0zLjUzLTQuMDEtNi4xNS01LjYxLTUuMi0zLjE5LTEyLjA3LTQuOTUtMTkuMzYtNC45NXMtMTQuMTYsMS43Ni0xOS4zNiw0Ljk1Yy0yLjYyLDEuNi00LjY4LDMuNDktNi4xNSw1LjYxLS4zNy41NC0uNywxLjA5LS45OSwxLjY1aDMuOWMuNDYsMCwuOS0uMiwxLjIxLS41NSwxLjA2LTEuMjEsMi40My0yLjM0LDQuMDgtMy4zNiw0LjU5LTIuODEsMTAuNzMtNC4zNiwxNy4zLTQuMzZzMTIuNzEsMS41NSwxNy4zLDQuMzZjMS43NSwxLjA3LDMuMTgsMi4yOCw0LjI2LDMuNTYuMTcuMi4xNy40OSwwLC42OS0xLjA4LDEuMjktMi41MSwyLjQ5LTQuMjYsMy41Ni0xLjcxLDEuMDUtMy41MSwxLjkyLTUuNDIsMi42MSwxLjMxLTEuODgsMi4xNS00LjEsMi4zNC02LjUxaC0zLjk2Yy0uNTMsNC42NS00LjQ5LDguMjctOS4yNyw4LjI3cy04Ljc1LTMuNjItOS4yOC04LjI3aC0zLjk1Yy41NCw2LjgyLDYuMjcsMTIuMjUsMTMuMjMsMTIuMjEsNi44Ny0uMDMsMTMuMTctMS43NiwxOC4zNy00Ljk0LDIuNjItMS42LDQuNjgtMy40OSw2LjE1LTUuNjEuMTktLjI4LjM3LS41Ni41NC0uODQuMy0uNS4zLTEuMTMsMC0xLjYzLS4xNy0uMjgtLjM1LS41Ni0uNTQtLjg0Ii8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtMTE3LjM0LDkuODloLTMuMDZjLS40MywwLS44MS4yNi0uOTcuNjZsLTYuMzYsMTUuODJoNGwuODYtMi4yNGg4LjAybC44NiwyLjI0aDRsLTYuMzYtMTUuODJjLS4xNi0uNC0uNTUtLjY2LS45Ny0uNjZabS00LjMzLDExLjA3bDIuNzktNy4yOSwyLjc5LDcuMjloLTUuNTlaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtMTQ0Ljc3LDI2LjM3aDRsLTYuMzYtMTUuODJjLS4xNi0uNC0uNTUtLjY2LS45Ny0uNjZoLTMuMDZjLS40MywwLS44MS4yNi0uOTcuNjZsLTYuMzYsMTUuODJoNGwuODYtMi4yNGg4LjAybC44NiwyLjI0Wm0tNy42Ni01LjQxbDIuNzktNy4yOSwyLjc5LDcuMjloLTUuNTlaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtNzQuMTYsMTYuMTVjLTEuODYtLjQzLTMuNDYtLjgtMy40Ni0xLjcyczEuMDEtMS41NiwyLjUxLTEuNTdjMi4wOS0uMDEsMy40OS43NSw0LjM0LDEuMzkuNDMuMzIsMS4wMy4yNSwxLjM4LS4xNmwxLjU4LTEuODktLjI3LS4yNGMtMS43LTEuNTItNC4wMy0yLjMyLTYuNzQtMi4zMi0zLjk1LDAtNi43MiwyLjA2LTYuNzIsNSwwLDMuNTksMy41NCw0LjQsNi4zOSw1LjA2LDIuMjkuNTMsMy42OS45MiwzLjY5LDEuOTYsMCwuODYtLjgsMS43OC0zLjA1LDEuNzgtMi43OSwwLTQuNTYtMS40NS01LjE5LTIuMDdsLS4zMy0uMzItMi4yMSwyLjc3LjI1LjI0YzEuODIsMS43MSw0LjM2LDIuNjEsNy4zNSwyLjYxLDUuMjQsMCw3LjExLTIuNzIsNy4xMS01LjI2LDAtMy43Mi0zLjY3LTQuNTctNi42Mi01LjI1WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0ibTg3LjI0LDEzLjI1aDUuNXYxMy4xM2gzLjd2LTEzLjEzaDUuNDF2LTIuMzRjMC0uNTYtLjQ1LTEuMDEtMS4wMS0xLjAxaC0xMy42djMuMzVaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtMTgxLjIzLDE0LjA5YzAtMS41NiwxLjQ5LTIuNjIsMy41Mi0yLjYyLDEuNTYsMCwzLjA2LjQxLDQuMjcsMS4zNC40Mi4zMywxLjAzLjI1LDEuMzctLjE1bC42MS0uNzJjLTEuNDQtMS40Ni0zLjQ3LTIuMzItNi4wNy0yLjMyLTMuNCwwLTUuOTEsMS44OC01LjkxLDQuNTksMCw1Ljg4LDEwLjE2LDMuNTEsMTAuMTYsNy43NiwwLDEuMjgtLjk4LDIuODctNC4wNCwyLjg3LTIuNDIsMC00LjI3LTEuMTQtNS4zNy0yLjM3bC0xLjI4LDEuNThjMS40MSwxLjUzLDMuNjIsMi42Miw2LjU4LDIuNjIsNC42MiwwLDYuMzItMi40Nyw2LjMyLTQuODQsMC02LjE1LTEwLjE1LTQuMDMtMTAuMTUtNy43M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0yMTEuMDMsMTkuOTJjMCwzLjAxLTEuOTYsNC45Mi01LDQuOTJzLTQuOTctMS45LTQuOTctNC45MnYtMTAuMDNoLTEuMDdjLS41NiwwLTEuMDEuNDUtMS4wMSwxLjAxdjkuMDdjMCw0LjA1LDIuNiw2LjcsNy4wNCw2LjdzNy4wNy0yLjYyLDcuMDctNi43MnYtMTAuMDZoLTIuMDd2MTAuMDNaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtMzIwLjc1LDI0LjY1di0xMy42NGMwLS41Ni0uNDUtMS4wMS0xLjAxLTEuMDFoLTEuMDR2MTYuNDhoMTAuNDF2LTEuODNoLTguMzZaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtMjM0LjM0LDE1LjE0Yy4xNi0yLjg2LTIuMS01LjIyLTQuOTItNS4yNGgwcy04LjA5LDAtOC4wOSwwdjE1LjQ3YzAsLjU2LjQ1LDEuMDEsMS4wMSwxLjAxaDEuMDR2LTYuNTVoMi44Nmw1LjQ4LDYuNTVoMi43N2wtNS40OS02LjU1aC4xYzIuNjgsMCw1LjA5LTIuMDEsNS4yNC00LjY5Wm0tMTAuOTYsMi44OHYtNi4zaDUuNjhjMS43NCwwLDMuMTUsMS40MSwzLjE1LDMuMTVzLTEuNDEsMy4xNS0zLjE1LDMuMTVoLTUuNjhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtMjgxLjAzLDExLjg1YzIuMTktLjQ1LDQuMi4yLDUuNjUsMS40OC4zMi4yOS44MS4zLDEuMTguMDdsMS4wMy0uNjVjLTEuNjktMS45OS00LjI1LTMuMi03LjEyLTIuOTktNC4wMi4zLTcuMzgsMy41MS03LjgyLDcuNTItLjU3LDUuMTUsMy40NCw5LjUsOC40Nyw5LjUsMi42LDAsNC45MS0xLjE4LDYuNDctMy4wMmwtMS43LTEuMDhjLTEuMTksMS4yOS0yLjg3LDIuMTItNC43NywyLjEyLTQuMDgsMC03LjI5LTMuNzMtNi40LTcuOTYuNTItMi40OCwyLjUzLTQuNDcsNS4wMS00Ljk4WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0ibTE2MC4zOCwyNi4zN3YtNS4zNGgxLjE3bDQuODEsNS4zNGg0LjY0bC01LTUuNGMyLjg4LS40Myw1LjA1LTMuMDcsNC43MS02LjEzLS4zMS0yLjg3LTIuOTItNC45NS01LjgxLTQuOTVoLTguMjJ2MTUuNDdjMCwuNTYuNDUsMS4wMSwxLjAxLDEuMDFoMi42OVptMC0xMy4xM2g0LjRjMS4yMiwwLDIuMjEuOTksMi4yMSwyLjIxcy0uOTksMi4yMi0yLjIxLDIuMjJoLTQuNHYtNC40M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0yNjQuNDcsMTF2MTUuNDdoMi4wNVYxMGgtMS4wNGMtLjU2LDAtMS4wMS40NS0xLjAxLDEuMDFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJtMjU0LjU5LDE4aC00Ljg1di44MmgwYzAsLjU2LjQ1LDEuMDEsMS4wMSwxLjAxaDMuODR2Mi43OGMtMS4xOSwxLjM0LTIuOTIsMi4xOC00Ljg1LDIuMTgtMy42MSwwLTYuNTQtMi45My02LjU0LTYuNTRzMi45My02LjU0LDYuNTQtNi41NGMxLjksMCwzLjU5LjgyLDQuNzcsMi4xMmwxLjctMS4wOGMtMS41Ni0xLjg0LTMuODctMy4wMi02LjQ3LTMuMDItNC43MSwwLTguNTIsMy44Mi04LjUyLDguNTJzMy44Miw4LjUyLDguNTIsOC41MmMyLjgyLDAsNS4zLTEuMzgsNi44NS0zLjQ5di01LjI4aC0xLjk5WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0ibTMxMS42LDI2LjQ4bC02LjM2LTE1LjgxYy0uMTUtLjM4LS41Mi0uNjMtLjk0LS42M2gtLjhzLS44LDAtLjgsMGMtLjQxLDAtLjc4LjI1LS45NC42M2wtNi4zNiwxNS44MWgyLjRsNS43LTE0LjY4LDUuNywxNC42OGgyLjRaIi8+PHJlY3QgY2xhc3M9ImNscy0xIiB4PSIyOTcuMzQiIHk9IjIxLjg4IiB3aWR0aD0iMTIuMzIiIGhlaWdodD0iMS44Ii8+PC9nPjwvc3ZnPg==';

// Real REVAI short logo (two interlinked loops) — uses authentic brand colors
// from the official asset: indigo #384898 + grey #9E9DAF. No gradient/background.
const REVAI_LOGO_SVG = `<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" aria-label="EVO Connect">
  <g transform="translate(0, 6) scale(0.32)">
    <path d="m115.83 21.1321c1.081-14.85305-12.32-24.2165-26.5103-20.10392-7.0766 2.093-12.43 7.34388-19.5433 9.40012-5.3552 1.658-11 2.1634-16.5639 1.4831-5.564-.6803-10.9215-2.53088-15.7211-5.43039-9.57-6.719654-22.495-9.9326-31.73501-.97307-20.66169 24.74886 22.77001 35.67296-1.13666 75.42166-12.50334 19.6264 1.99833 40.4284 24.71337 32.0374 6.6916-3.066 11.8433-7.509 19.305-9.18 7.8841-1.982 16.1938-1.396 23.7233 1.671 4.95 1.965 9.0567 5.233 13.915 7.344 14.3916 6.867 31.2946-3.213 29.2236-19.8835-1.064-15.5323-18.5719-21.7379-31.0203-14.4307-12.4483 7.3071-25.0983 12.3193-39.16 7.0685-14.7766-4.3146-19.14-20.8934-16.8116-34.8835 2.2916-20.1222 23.0633-26.8052 40.315-21.6644 8.03 2.1664 14.2083 8.3904 22.3666 10.0794 11.1283 2.7173 24.1633-5.6364 24.6213-17.6253" fill="#384898"/>
    <path d="m149.581 118.383c-9.405-15.183-10.248-30.3853-1.081-45.7707 2.346-4.5348 4.565-8.4271 5.298-12.8518 2.42-17.203-13.713-27.1907-29.132-20.7832-8.965 4.5532-16.61 10.41-27.4995 10.3182-11.5317.8262-20.1667-5.2325-29.535-10.208-8.8-4.2044-21.01-2.093-26.3634 6.5728-8.855 15.3854 2.75 34.0388 20.7167 30.4954 8.3417-1.6707 14.96-8.0415 23.265-10.3548 13.2-3.8372 30.4512-.8813 37.1252 12.0072 4.968 9.4002 4.876 26.0529-1.192 35.3239-7.517 11.402-24.0165 13.55-36.4649 9.694-13.475-4.663-22.7883-16.34-38.0416-6.995-16.72 11.585-7.7734 38.555 13.3833 35.893 10.12-.716 16.61-8.904 26.4917-10.887 8.1424-1.975 16.6995-1.333 24.4565 1.836 6.6 2.717 12.082 7.876 19.342 8.959 19.745 3.067 29.425-17.203 19.396-33.047z" fill="#9E9DAF"/>
  </g>
  <text x="62" y="38" fill="#0F1D40" font-family="Inter, sans-serif" font-weight="800" font-size="26" letter-spacing="1.5">EVO</text>
</svg>`;

/* ================================================================
   Patients module — rich list of every patient + stage
================================================================ */
const PATIENT_STAGE_CFG = {
  "Consult":     { cls: "consult",   color: "#0071B0", label: "Consult" },
  "Biometry":    { cls: "biometry",  color: "#2472D3", label: "Biometry" },
  "Eligibility": { cls: "biometry",  color: "#2472D3", label: "Eligibility" },
  "Sizing":      { cls: "sizing",    color: "#00D5E1", label: "Sizing" },
  "Scheduled":   { cls: "scheduled", color: "#E78A27", label: "Scheduled" },
  "Post-op":     { cls: "postop",    color: "#009C76", label: "Post-op" },
};
const PATIENT_STAGE_PROGRESS = {
  "Consult": 15, "Biometry": 30, "Eligibility": 40, "Sizing": 55, "Scheduled": 75, "Post-op": 95,
};

function _patientNextAction(pt) {
  switch (pt.stage) {
    case "Consult":     return { date: "Apr 25", action: "Eligibility workup" };
    case "Biometry":    return { date: "Apr 24", action: "IOLMaster + Pentacam" };
    case "Eligibility": return { date: "Apr 26", action: "AI Sentinel review" };
    case "Sizing":      return { date: "Apr 28", action: "ICL Guru recommendation" };
    case "Scheduled":   return { date: pt.iclGuru ? "May 08 · OR-2" : "May 08 · OR-2", action: "Surgery" };
    case "Post-op":     return { date: "May 18", action: "Month 1 follow-up" };
    default:            return { date: "—", action: "—" };
  }
}

function renderPatients() {
  const list = DATA.patients;
  const total = list.length;
  const byStage = (s) => list.filter(p => {
    if (s === "Pre-op") return ["Consult","Biometry","Eligibility"].includes(p.stage);
    return p.stage === s;
  });
  const riskCount = list.filter(p => p.risk).length;
  const highRisk  = list.filter(p => p.risk && p.risk.level === "high").length;

  const kpiRow = `
    <div class="grid grid-kpi pt-list-kpis">
      <div class="card kpi pt-kpi">
        <span class="kpi-label">Total patients</span>
        <span class="kpi-value">${total} <span class="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>+${Math.max(1, Math.round(total*0.15))}</span></span>
        <span class="muted small">Active in clinic</span>
      </div>
      <div class="card kpi pt-kpi">
        <span class="kpi-label">In pre-op</span>
        <span class="kpi-value">${byStage("Pre-op").length}</span>
        <span class="muted small">Consult · biometry · eligibility</span>
      </div>
      <div class="card kpi pt-kpi">
        <span class="kpi-label">In sizing</span>
        <span class="kpi-value">${byStage("Sizing").length}</span>
        <span class="muted small">Awaiting ICL Guru</span>
      </div>
      <div class="card kpi pt-kpi">
        <span class="kpi-label">Scheduled</span>
        <span class="kpi-value">${byStage("Scheduled").length}</span>
        <span class="muted small">Surgery confirmed</span>
      </div>
      <div class="card kpi pt-kpi">
        <span class="kpi-label">At-risk flags</span>
        <span class="kpi-value" style="color:${highRisk > 0 ? '#B03144' : 'var(--warn)'}">${riskCount}</span>
        <span class="muted small">${highRisk} high · ${riskCount - highRisk} other</span>
      </div>
    </div>`;

  // Stage filter chips
  const stages = ["All","Pre-op","Sizing","Scheduled","Post-op","At-risk"];
  const chipsHtml = stages.map((s, i) => {
    const count = s === "All" ? total
                : s === "At-risk" ? riskCount
                : byStage(s).length;
    return `<button class="pt-chip ${i === 0 ? 'active' : ''}" data-stage="${s}" onclick="filterPatients('${s}')">${s}<span class="pt-chip-ct">${count}</span></button>`;
  }).join("");

  // Patient cards
  const cardsHtml = list.map(pt => _patientListCard(pt)).join("");
  const rowsHtml  = list.map(pt => _patientListRow(pt)).join("");

  return `
    <div class="pt-list-hero">
      <div class="pt-list-hero-brand">
        <div class="pt-list-logo">${REVAI_LOGO_SVG}</div>
        <div>
          <div class="pt-list-eyebrow">EVO CONNECT · Patient Registry</div>
          <h1 class="pt-list-title">Patients</h1>
          <p class="pt-list-sub">Every active patient in your clinic — stage, risk, next action and one-click access to the full record.</p>
        </div>
      </div>
      <div class="pt-list-actions">
        <div class="pt-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
          <input placeholder="Search by name, ID, or refraction..." oninput="searchPatients(this.value)"/>
        </div>
        <button class="btn btn-primary small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>New patient</button>
      </div>
    </div>

    ${kpiRow}

    <div class="pt-list-filterbar">
      <div class="pt-chips-row">${chipsHtml}</div>
      <div class="pt-viewtoggle" role="group" aria-label="View">
        <button type="button" class="ptv active" data-view="tiles" onclick="setPatientsView('tiles')" title="Tile view">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          Tiles
        </button>
        <button type="button" class="ptv" data-view="table" onclick="setPatientsView('table')" title="Table view">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          Table
        </button>
      </div>
      <div class="pt-sort">
        <label>Sort:</label>
        <select onchange="sortPatients(this.value)">
          <option value="stage">By stage</option>
          <option value="risk">By risk</option>
          <option value="name">By name</option>
          <option value="age">By age</option>
        </select>
      </div>
    </div>

    <div class="pt-list-grid" id="patientsListGrid">${cardsHtml}</div>

    <div class="pt-list-table-wrap" id="patientsListTable" hidden>
      <table class="pt-table">
        <thead>
          <tr>
            <th class="c-pt">Patient</th><th>Stage</th><th>Eye</th><th class="c-num">Power</th>
            <th>Lens</th><th>Risk</th><th>Journey</th><th>Next action</th><th></th>
          </tr>
        </thead>
        <tbody id="patientsTableBody">${rowsHtml}</tbody>
      </table>
    </div>

    <div class="pt-list-footer">
      <div class="pt-list-powered">
        <span class="ptp-label">Powered by</span>
        <img class="ptp-logo" src="${STAAR_LOGO}" alt="STAAR Surgical"/>
        <span class="ptp-divider">·</span>
        <span class="ptp-partner">Clinical intelligence partner</span>
      </div>
      <div class="pt-list-footnote">
        All patient data is stored locally in your clinic's Vault. No PHI leaves the facility. ICL Guru recommendations are generated from STAAR-validated biometry models.
      </div>
    </div>
  `;
}

function _patientListCard(pt) {
  const cfg = PATIENT_STAGE_CFG[pt.stage] || PATIENT_STAGE_CFG["Consult"];
  const progress = PATIENT_STAGE_PROGRESS[pt.stage] || 10;
  const next = _patientNextAction(pt);
  const riskBadge = pt.risk ? `
    <span class="pt-card-risk risk-${pt.risk.level}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
      ${pt.risk.level.toUpperCase()} risk · ${pt.risk.score}/100
    </span>` : `<span class="pt-card-risk safe">✓ No risk flags</span>`;
  const iclGuruBadge = pt.iclGuru ? `<span class="pt-card-guru-badge">ICL Guru report ✓</span>` : '';

  // Search-friendly data attrs
  const searchStr = `${pt.name} ${pt.id} ${pt.power} ${pt.eye} ${pt.stage}`.toLowerCase();

  return `
    <button class="pt-card ${cfg.cls}" data-patient-id="${pt.id}" data-stage="${pt.stage}" data-risk="${pt.risk ? pt.risk.level : 'none'}" data-search="${searchStr}" onclick="openPatientFile('${pt.id}')">
      <div class="pt-card-top" style="background: linear-gradient(135deg, ${cfg.color}18, ${cfg.color}05)">
        <div class="pt-card-avatar">${patientAvatar(pt)}</div>
        <div class="pt-card-head-info">
          <div class="pt-card-name">${pt.name}</div>
          <div class="pt-card-meta">REV-${pt.id} · ${pt.age}y · ${pt.sex}</div>
        </div>
        <div class="pt-card-stage-badge" style="background:${cfg.color}">${cfg.label}</div>
      </div>

      <div class="pt-card-mid">
        <div class="pt-card-row">
          <div class="pt-card-cell">
            <span class="c-lbl">Eye</span>
            <span class="c-val">${pt.eye}</span>
          </div>
          <div class="pt-card-cell">
            <span class="c-lbl">Power</span>
            <span class="c-val mono">${pt.power} D</span>
          </div>
          ${pt.iclGuru ? `
          <div class="pt-card-cell">
            <span class="c-lbl">Lens</span>
            <span class="c-val">${(pt.iclGuru.sizing.find(s=>s.selected)||{}).size} mm</span>
          </div>` : ''}
        </div>

        <div class="pt-card-progress">
          <div class="ppb-track"><span style="width:${progress}%; background:${cfg.color}"></span></div>
          <div class="ppb-meta"><span>Journey ${progress}%</span><span>${pt.stage}</span></div>
        </div>

        <div class="pt-card-badges">
          ${riskBadge}
          ${iclGuruBadge}
        </div>
      </div>

      <div class="pt-card-foot">
        <div class="pt-card-next">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
          <div>
            <span class="pn-label">Next</span>
            <span class="pn-val"><b>${next.date}</b> · ${next.action}</span>
          </div>
        </div>
        <div class="pt-card-cta">
          <span class="pt-open-lbl">Open file</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </div>
      </div>
    </button>
  `;
}

/* Table view of the same registry — same data attributes as the tiles, so the
   stage chips, the search box and the sort control drive both. */
function _patientListRow(pt) {
  const cfg = PATIENT_STAGE_CFG[pt.stage] || PATIENT_STAGE_CFG["Consult"];
  const progress = PATIENT_STAGE_PROGRESS[pt.stage] || 10;
  const next = _patientNextAction(pt);
  const lens = pt.iclGuru ? ((pt.iclGuru.sizing.find(s => s.selected) || {}).size || '—') + ' mm' : '—';
  const risk = pt.risk
    ? `<span class="pt-trisk risk-${pt.risk.level}">${pt.risk.level.toUpperCase()} · ${pt.risk.score}</span>`
    : `<span class="pt-trisk safe">No flags</span>`;
  const searchStr = `${pt.name} ${pt.id} ${pt.power} ${pt.eye} ${pt.stage}`.toLowerCase();
  return `
    <tr class="pt-row" data-patient-id="${pt.id}" data-stage="${pt.stage}" data-risk="${pt.risk ? pt.risk.level : 'none'}" data-search="${searchStr}" onclick="openPatientFile('${pt.id}')" tabindex="0">
      <td class="c-pt">
        <span class="pt-trow-av">${patientAvatar(pt)}</span>
        <span class="pt-trow-id"><b>${pt.name}</b><em>REV-${pt.id} · ${pt.age}y · ${pt.sex}</em></span>
      </td>
      <td><span class="pt-tstage" style="background:${cfg.color}">${cfg.label}</span></td>
      <td>${pt.eye}</td>
      <td class="c-num mono">${pt.power} D</td>
      <td>${lens}</td>
      <td>${risk}</td>
      <td class="c-prog">
        <span class="pt-tbar"><i style="width:${progress}%;background:${cfg.color}"></i></span>
        <em>${progress}%</em>
      </td>
            <td class="c-next">${next ? `<b>${next.date}</b> ${next.action}` : "—"}</td>
      <td class="c-go">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </td>
    </tr>`;
}

var PATIENTS_VIEW = 'tiles';
function setPatientsView(view) {
  PATIENTS_VIEW = view === 'table' ? 'table' : 'tiles';
  try { localStorage.setItem('evo_patients_view', PATIENTS_VIEW); } catch (e) {}
  const grid  = document.getElementById('patientsListGrid');
  const table = document.getElementById('patientsListTable');
  if (grid)  grid.hidden  = PATIENTS_VIEW !== 'tiles';
  if (table) table.hidden = PATIENTS_VIEW !== 'table';
  document.querySelectorAll('.pt-viewtoggle .ptv').forEach(b => {
    b.classList.toggle('active', b.dataset.view === PATIENTS_VIEW);
  });
}
/* restore the last view once the registry is on screen */
function _restorePatientsView() {
  var v = 'tiles';
  try { v = localStorage.getItem('evo_patients_view') || 'tiles'; } catch (e) {}
  if (document.getElementById('patientsListGrid')) setPatientsView(v);
}

function filterPatients(stage) {
  document.querySelectorAll('.pt-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-stage') === stage));
  document.querySelectorAll('.pt-card, .pt-row').forEach(c => {
    const ptStage = c.getAttribute('data-stage');
    const risk = c.getAttribute('data-risk');
    let show = true;
    if (stage === 'All') show = true;
    else if (stage === 'Pre-op') show = ["Consult","Biometry","Eligibility"].includes(ptStage);
    else if (stage === 'At-risk') show = risk !== 'none';
    else show = ptStage === stage;
    c.style.display = show ? '' : 'none';
  });
}

function searchPatients(query) {
  const q = (query || '').toLowerCase().trim();
  document.querySelectorAll('.pt-card, .pt-row').forEach(c => {
    const hay = c.getAttribute('data-search') || '';
    c.style.display = (q === '' || hay.includes(q)) ? '' : 'none';
  });
}

function sortPatients(mode) {
  const grid = document.getElementById('patientsListGrid');
  const body = document.getElementById('patientsTableBody');
  if (!grid && !body) return;
  const stageOrder = { "Consult": 0, "Biometry": 1, "Eligibility": 2, "Sizing": 3, "Scheduled": 4, "Post-op": 5 };
  const riskOrder  = { "high": 0, "med": 1, "low": 2, "none": 3 };
  const byId = {};
  (DATA.patients || []).forEach(p => { byId[p.id] = p; });
  const cmp = (a, b) => {
    const pa = byId[a.getAttribute('data-patient-id')] || {}, pb = byId[b.getAttribute('data-patient-id')] || {};
    if (mode === 'stage') return (stageOrder[a.getAttribute('data-stage')] ?? 99) - (stageOrder[b.getAttribute('data-stage')] ?? 99);
    if (mode === 'risk')  return (riskOrder[a.getAttribute('data-risk')] ?? 99) - (riskOrder[b.getAttribute('data-risk')] ?? 99);
    if (mode === 'name')  return String(pa.name || '').localeCompare(String(pb.name || ''));
    if (mode === 'age')   return (pa.age || 0) - (pb.age || 0);
    return 0;
  };
  if (grid) Array.from(grid.querySelectorAll('.pt-card')).sort(cmp).forEach(c => grid.appendChild(c));
  if (body) Array.from(body.querySelectorAll('.pt-row')).sort(cmp).forEach(r => body.appendChild(r));
}

function renderEvoCredits() {
  // Dynamic STAAR order stats from the live counter (incremented by STELLA orders)
  var _orders = (window.STAAR_ORDERS && window.STAAR_ORDERS.count) || 5;
  var _lensEvo = _orders * 20;
  var _lensDelta = _orders >= 5 ? '+' + ((_orders - 5) * 20 + 20) : '+20';
  return `
  <div class="evo-credits-page">
    <div class="evo-page-header">
      <div>
        <div class="evo-page-eyebrow">08 · BILLING</div>
        <h1 class="evo-page-title">EVO Credits</h1>
        <p class="evo-page-sub">Earn credits by contributing to the network. Spend them on platform access.</p>
      </div>
      <div class="evo-clinic-pill">
        <div class="evo-clinic-pill-avatar">CR</div>
        <span>Clínica Refractiva Buenos Aires</span>
      </div>
    </div>

    <div class="evo-hero-grid">
      <div class="evo-balance-card">
        <div class="evo-balance-top">
          <div>
            <div class="evo-balance-label">Current Balance</div>
            <div class="evo-balance-amount"><span data-evo-balance>290</span><sup>EVO</sup></div>
          </div>
          <button class="evo-buy-btn" onclick="openEvoBuy()" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M12 5v14M5 12h14"/></svg>
            Buy credits
          </button>
        </div>
        <div class="evo-balance-projection">
          <div class="proj-row">
            <span class="proj-op">−</span>
            <span class="proj-val">150 EVO</span>
            <span class="proj-tag">platform fee · Apr 30</span>
          </div>
          <div class="proj-row total">
            <span class="proj-op">=</span>
            <span class="proj-val big">140 EVO</span>
            <span class="proj-tag">balance after fee</span>
          </div>
        </div>
        <div class="evo-balance-meta">
          <div class="evo-balance-meta-item"><span class="lbl">Earned this month</span><span class="val pos" data-evo-earned-mo>+ 240</span></div>
          <div class="evo-balance-meta-item"><span class="lbl">Net 30 days</span><span class="val pos">+ 90</span></div>
          <div class="evo-balance-meta-item"><span class="lbl">Lifetime earned</span><span class="val">11,680</span></div>
        </div>
      </div>

      <div class="evo-debit-card">
        <div class="eyebrow"><span class="dot"></span>Monthly Platform Fee</div>
        <h3>− 150 EVO due Apr 30</h3>
        <p>Auto-debited at month end for your EVO Connect platform subscription.</p>
        <div class="evo-debit-amount-row">
          <span class="num">−150</span>
          <span class="when">in 4 days</span>
        </div>
        <div class="evo-debit-progress-track"><div class="evo-debit-progress-fill"></div></div>
        <div class="evo-debit-progress-meta">
          <span>Coverage from this month's earnings</span>
          <span>416% covered</span>
        </div>
      </div>
    </div>

    <div class="evo-section-title">How You Earn</div>
    <div class="evo-sources-grid">
      <div class="evo-source-card">
        <div class="evo-source-icon community">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h4>Community Contributions</h4>
        <p class="sub">Sharing anonymized cases, posting in forums, answering peer questions. <strong style="color:#001E60;">10 EVO per post.</strong></p>
        <div class="credits">60<span class="unit">EVO</span></div>
        <span class="delta">↑ +20 vs last mo</span>
        <div class="evo-source-detail">
          <div class="evo-source-detail-row"><span class="k">Cases shared</span><span class="v">2 × 10 = 20 EVO</span></div>
          <div class="evo-source-detail-row"><span class="k">Forum posts</span><span class="v">3 × 10 = 30 EVO</span></div>
          <div class="evo-source-detail-row"><span class="k">Peer answers</span><span class="v">1 × 10 = 10 EVO</span></div>
        </div>
      </div>

      <div class="evo-source-card">
        <div class="evo-source-icon postop">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h4>Post-op Data Quality</h4>
        <p class="sub">Submitting structured 1-mo, 3-mo, 6-mo follow-ups, vault scans, PROMs. <strong style="color:#001E60;">10 EVO per event.</strong></p>
        <div class="credits">80<span class="unit">EVO</span></div>
        <span class="delta">↑ +30 vs last mo</span>
        <div class="evo-source-detail">
          <div class="evo-source-detail-row"><span class="k">1-mo follow-ups</span><span class="v">3 × 10 = 30 EVO</span></div>
          <div class="evo-source-detail-row"><span class="k">3 / 6-mo follow-ups</span><span class="v">2 × 10 = 20 EVO</span></div>
          <div class="evo-source-detail-row"><span class="k">PROMs completed</span><span class="v">3 × 10 = 30 EVO</span></div>
        </div>
      </div>

      <div class="evo-source-card">
        <div class="evo-source-icon orders">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <h4>STAAR Lens Orders</h4>
        <p class="sub">Each EVO ICL ordered through the platform earns credits, scaling with volume. <strong style="color:#001E60;">20 EVO per lens.</strong></p>
        <div class="credits">${_lensEvo}<span class="unit">EVO</span></div>
        <span class="delta">↑ ${_lensDelta} vs last mo</span>
        <div class="evo-source-detail">
          <div class="evo-source-detail-row"><span class="k">Lenses ordered</span><span class="v">${_orders} × 20 = ${_lensEvo} EVO</span></div>
          <div class="evo-source-detail-row"><span class="k">Volume bonus tier</span><span class="v">${_orders >= 10 ? 'Silver (×1.2)' : '— (entry tier)'}</span></div>
          <div class="evo-source-detail-row"><span class="k">Bonus credits</span><span class="v">+${_orders >= 10 ? Math.round(_lensEvo * 0.2) : 0} EVO</span></div>
        </div>
      </div>
    </div>

    <div class="evo-bottom-grid">
      <div class="evo-ledger">
        <div class="evo-ledger-head">
          <h3>Recent Activity</h3>
          <div class="evo-ledger-filter">
            <button class="active" onclick="evoLedgerFilter(this)">All</button>
            <button onclick="evoLedgerFilter(this)">Earned</button>
            <button onclick="evoLedgerFilter(this)">Spent</button>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Activity</th><th>Source</th><th>Date</th><th>Credits</th></tr>
          </thead>
          <tbody>
            <tr><td><div class="desc">3-month follow-up: Mariela G.</div><div class="when">Vault + PROMs submitted · 1 event</div></td><td><span class="src-tag postop">Post-op</span></td><td>Apr 25</td><td><span class="amt pos">+ 10</span></td></tr>
            <tr><td><div class="desc">Posted case: ATA narrow, V4c sized 13.2</div><div class="when">8 peer reactions, 3 comments</div></td><td><span class="src-tag community">Community</span></td><td>Apr 24</td><td><span class="amt pos">+ 10</span></td></tr>
            <tr><td><div class="desc">EVO ICL order #4429</div><div class="when">2 lenses · OD/OS · 2 × 20</div></td><td><span class="src-tag orders">Order</span></td><td>Apr 24</td><td><span class="amt pos">+ 40</span></td></tr>
            <tr><td><div class="desc">Answered: Centration drift after rotation</div><div class="when">Marked helpful by 4 surgeons</div></td><td><span class="src-tag community">Community</span></td><td>Apr 22</td><td><span class="amt pos">+ 10</span></td></tr>
            <tr><td><div class="desc">1-month follow-up: Daniel S.</div><div class="when">UDVA 20/20, vault 760 · 1 event</div></td><td><span class="src-tag postop">Post-op</span></td><td>Apr 21</td><td><span class="amt pos">+ 10</span></td></tr>
            <tr><td><div class="desc">EVO ICL order #4422</div><div class="when">1 lens · toric · 1 × 20</div></td><td><span class="src-tag orders">Order</span></td><td>Apr 19</td><td><span class="amt pos">+ 20</span></td></tr>
            <tr><td><div class="desc">March platform fee</div><div class="when">EVO Connect subscription</div></td><td><span class="src-tag platform">Platform</span></td><td>Mar 31</td><td><span class="amt neg">− 150</span></td></tr>
          </tbody>
        </table>
      </div>

      <div class="evo-trend-card">
        <div class="evo-trend-head">
          <div>
            <h3>Credits Earned · Last 6 Months</h3>
            <p class="sub">Stacked by source.</p>
          </div>
          <div class="evo-trend-summary">
            <span class="lbl">This month</span>
            <span class="val">240 <em>EVO</em></span>
          </div>
        </div>
        <svg class="evo-trend-chart" viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="bar-clip-nov"><rect x="38"  width="22" y="138" height="32" rx="4"/></clipPath>
            <clipPath id="bar-clip-dec"><rect x="86"  width="22" y="124" height="46" rx="4"/></clipPath>
            <clipPath id="bar-clip-jan"><rect x="134" width="22" y="106" height="64" rx="4"/></clipPath>
            <clipPath id="bar-clip-feb"><rect x="182" width="22" y="92"  height="78" rx="4"/></clipPath>
            <clipPath id="bar-clip-mar"><rect x="230" width="22" y="58"  height="112" rx="4"/></clipPath>
            <clipPath id="bar-clip-apr"><rect x="278" width="22" y="22"  height="148" rx="4"/></clipPath>
          </defs>
          <!-- Y-axis gridlines + labels -->
          <g font-family="Inter, sans-serif" font-size="9" fill="#63708A">
            <line x1="32" y1="22"  x2="316" y2="22"  stroke="#EAEEF5" stroke-width="1" stroke-dasharray="2 3"/>
            <line x1="32" y1="86"  x2="316" y2="86"  stroke="#EAEEF5" stroke-width="1" stroke-dasharray="2 3"/>
            <line x1="32" y1="150" x2="316" y2="150" stroke="#EAEEF5" stroke-width="1" stroke-dasharray="2 3"/>
            <line x1="32" y1="170" x2="316" y2="170" stroke="#E1E5EE" stroke-width="1"/>
            <text x="28" y="25"  text-anchor="end">1500</text>
            <text x="28" y="89"  text-anchor="end">1000</text>
            <text x="28" y="153" text-anchor="end">500</text>
            <text x="28" y="173" text-anchor="end">0</text>
          </g>
          <!-- Bars (each: clipped to a rounded rect, then 3 stacked segments fill the inside) -->
          <g>
            <!-- Nov: orders 80, post-op 200, community 320 = 600 -->
            <g clip-path="url(#bar-clip-nov)">
              <rect x="38" y="138" width="22" height="11" fill="#5BA3D6"/>
              <rect x="38" y="149" width="22" height="21" fill="#22C55E"/>
              <rect x="38" y="160" width="22" height="10" fill="#001E60"/>
            </g>
            <text x="49" y="186" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" fill="#5A6478">Nov</text>
            <!-- Dec: 100/220/360 = 680 -->
            <g clip-path="url(#bar-clip-dec)">
              <rect x="86"  y="124" width="22" height="13" fill="#5BA3D6"/>
              <rect x="86"  y="137" width="22" height="22" fill="#22C55E"/>
              <rect x="86"  y="159" width="22" height="11" fill="#001E60"/>
            </g>
            <text x="97" y="186" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" fill="#5A6478">Dec</text>
            <!-- Jan: 140/260/410 = 810 -->
            <g clip-path="url(#bar-clip-jan)">
              <rect x="134" y="106" width="22" height="14" fill="#5BA3D6"/>
              <rect x="134" y="120" width="22" height="38" fill="#22C55E"/>
              <rect x="134" y="158" width="22" height="12" fill="#001E60"/>
            </g>
            <text x="145" y="186" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" fill="#5A6478">Jan</text>
            <!-- Feb: 170/310/450 = 930 -->
            <g clip-path="url(#bar-clip-feb)">
              <rect x="182" y="92"  width="22" height="16" fill="#5BA3D6"/>
              <rect x="182" y="108" width="22" height="49" fill="#22C55E"/>
              <rect x="182" y="157" width="22" height="13" fill="#001E60"/>
            </g>
            <text x="193" y="186" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" fill="#5A6478">Feb</text>
            <!-- Mar: 240/410/470 = 1120 -->
            <g clip-path="url(#bar-clip-mar)">
              <rect x="230" y="58"  width="22" height="22" fill="#5BA3D6"/>
              <rect x="230" y="80"  width="22" height="76" fill="#22C55E"/>
              <rect x="230" y="156" width="22" height="14" fill="#001E60"/>
            </g>
            <text x="241" y="186" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" fill="#5A6478">Mar</text>
            <!-- Apr (current month, highlighted): 432/540/530 = 1502 -->
            <g clip-path="url(#bar-clip-apr)">
              <rect x="278" y="22"  width="22" height="42" fill="#5BA3D6"/>
              <rect x="278" y="64"  width="22" height="53" fill="#22C55E"/>
              <rect x="278" y="117" width="22" height="53" fill="#001E60"/>
            </g>
            <text x="289" y="186" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#001E60">Apr</text>
            <!-- Apr value pill -->
            <g>
              <rect x="261" y="2" width="56" height="18" rx="9" fill="#001E60"/>
              <text x="289" y="14.5" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#fff">240</text>
            </g>
          </g>
        </svg>
        <div class="evo-trend-legend">
          <div class="evo-trend-legend-item"><span class="swatch" style="background:#5BA3D6;"></span>Orders</div>
          <div class="evo-trend-legend-item"><span class="swatch" style="background:#22C55E;"></span>Post-op data</div>
          <div class="evo-trend-legend-item"><span class="swatch" style="background:#001E60;"></span>Community</div>
        </div>
      </div>
    </div>

    <!-- Buy Credits modal (hidden by default) -->
    <div class="evo-buy-modal" id="evoBuyModal" role="dialog" aria-modal="true" aria-labelledby="evoBuyTitle" onclick="if(event.target===this) closeEvoBuy()">
      <div class="evo-buy-dialog">
        <div class="evo-buy-head">
          <div>
            <h3 id="evoBuyTitle">Buy EVO Credits</h3>
            <p>1 EVO = 1 USD · charged to your billing account on file.</p>
          </div>
          <button class="evo-buy-close" onclick="closeEvoBuy()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div class="evo-buy-section">
          <div class="evo-buy-section-lbl">Quick amounts</div>
          <div class="evo-buy-presets">
            <button type="button" class="evo-preset" onclick="setEvoBuyAmount(100)">100<span>EVO</span></button>
            <button type="button" class="evo-preset active" onclick="setEvoBuyAmount(250)">250<span>EVO</span></button>
            <button type="button" class="evo-preset" onclick="setEvoBuyAmount(500)">500<span>EVO</span></button>
            <button type="button" class="evo-preset" onclick="setEvoBuyAmount(1000)">1,000<span>EVO</span></button>
            <button type="button" class="evo-preset" onclick="setEvoBuyAmount(2500)">2,500<span>EVO</span></button>
          </div>
        </div>

        <div class="evo-buy-section">
          <div class="evo-buy-section-lbl">Custom amount</div>
          <div class="evo-buy-input-row">
            <input type="number" id="evoBuyInput" min="10" max="50000" step="10" value="250" oninput="syncEvoBuyAmount(this.value)">
            <span class="evo-buy-input-suffix">EVO</span>
          </div>
        </div>

        <div class="evo-buy-summary">
          <div class="row"><span>Credits</span><span class="val"><span id="evoBuySumQty">250</span> EVO</span></div>
          <div class="row"><span>Unit price</span><span class="val">$1.00 / EVO</span></div>
          <div class="row total"><span>Total</span><span class="val big">$<span id="evoBuySumTotal">250.00</span> USD</span></div>
        </div>

        <div class="evo-buy-pay">
          <div class="evo-buy-pm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:#5A6478;"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            <span>Visa ending in 4429</span>
            <a href="javascript:void(0)" class="evo-buy-pm-change">Change</a>
          </div>
          <div class="evo-buy-actions">
            <button type="button" class="evo-buy-cancel" onclick="closeEvoBuy()">Cancel</button>
            <button type="button" class="evo-buy-confirm" onclick="confirmEvoBuy()">Pay $<span id="evoBuyBtnTotal">250.00</span></button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function evoLedgerFilter(btn){
  if (!btn || !btn.parentNode) return;
  btn.parentNode.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
}

// === EVO Buy Credits modal handlers ===
function openEvoBuy(){
  var m = document.getElementById('evoBuyModal');
  if (m){ m.classList.add('open'); document.body.style.overflow='hidden'; }
}
function closeEvoBuy(){
  var m = document.getElementById('evoBuyModal');
  if (m){ m.classList.remove('open'); document.body.style.overflow=''; }
}
function setEvoBuyAmount(n){
  var input = document.getElementById('evoBuyInput');
  if (input) input.value = n;
  document.querySelectorAll('.evo-preset').forEach(function(b){ b.classList.remove('active'); });
  // Highlight matching preset (if any)
  document.querySelectorAll('.evo-preset').forEach(function(b){
    var v = parseInt((b.textContent||'').replace(/[^\d]/g,''), 10);
    if (v === n) b.classList.add('active');
  });
  syncEvoBuyAmount(n);
}
function syncEvoBuyAmount(v){
  var n = Math.max(10, Math.min(50000, parseInt(v, 10) || 0));
  var qty = document.getElementById('evoBuySumQty');
  var tot = document.getElementById('evoBuySumTotal');
  var btn = document.getElementById('evoBuyBtnTotal');
  if (qty) qty.textContent = n.toLocaleString('en-US');
  if (tot) tot.textContent = n.toFixed(2);
  if (btn) btn.textContent = n.toFixed(2);
}
function confirmEvoBuy(){
  var n = parseInt(document.getElementById('evoBuyInput').value, 10) || 0;
  alert('Demo: charged $' + n.toFixed(2) + ' to Visa ending in 4429.\n+ ' + n.toLocaleString('en-US') + ' EVO credited to your balance.');
  closeEvoBuy();
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    var m = document.getElementById('evoBuyModal');
    if (m && m.classList.contains('open')) closeEvoBuy();
  }
});
