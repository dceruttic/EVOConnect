/* ================================================================
   PROMs interactive question picker
================================================================ */
// Shared state + redraw for the "question evolution" chart in Clinic Analytics
const _PROMS_EV = {
  qCodes: ["A1","A2","A3","A4","A5","A6","A7","A8","A9"],
  qShort: { A1:"Satisfaction", A2:"Near freedom", A3:"Mid freedom", A4:"Distance freedom", A5:"No medical glasses", A6:"Match expectations", A7:"Night clarity", A8:"Daytime driving", A9:"Nighttime driving" },
  qText: {
    A1:"Rate your satisfaction with the outcome of the surgery.",
    A2:"How often would you wear glasses for near-distance activities? (reading, mobile)",
    A3:"How often would you wear glasses for mid-distance activities? (cooking, PC)",
    A4:"How often would you wear glasses for distance activities? (driving, TV)",
    A5:"Do you still wear glasses for medical reasons? (e.g. residual astigmatism)",
    A6:"Do you now have the visual outcomes that you discussed and agreed with your surgeon?",
    A7:"Do you experience vision disturbances in the evening/night?",
    A8:"Do you experience vision disturbances driving during daytime?",
    A9:"Do you experience vision disturbances driving during nighttime?",
  },
  byLens: {
    "12.1": { A1:[8.1,8.8,9.1,9.3], A2:[6.3,6.8,7.0,7.2], A3:[7.4,7.9,8.2,8.4], A4:[8.7,9.1,9.3,9.4], A5:[9.2,9.3,9.3,9.4], A6:[8.6,9.0,9.2,9.3], A7:[5.6,7.2,8.0,8.3], A8:[8.8,9.1,9.2,9.3], A9:[5.4,7.1,7.9,8.2] },
    "12.6": { A1:[8.3,9.0,9.3,9.5], A2:[5.8,6.2,6.4,6.6], A3:[7.2,7.8,8.1,8.3], A4:[9.1,9.5,9.6,9.7], A5:[9.0,9.1,9.2,9.2], A6:[8.9,9.2,9.3,9.4], A7:[5.4,7.1,8.1,8.5], A8:[9.0,9.3,9.3,9.4], A9:[5.3,7.1,8.0,8.4] },
    "13.2": { A1:[8.2,8.9,9.2,9.4], A2:[4.9,5.4,5.6,5.8], A3:[6.8,7.4,7.7,8.0], A4:[9.3,9.6,9.7,9.7], A5:[8.8,9.0,9.1,9.1], A6:[8.8,9.1,9.3,9.3], A7:[5.1,6.9,7.9,8.3], A8:[9.1,9.3,9.4,9.5], A9:[5.0,7.0,7.9,8.3] },
    "13.7": { A1:[7.9,8.7,9.0,9.2], A2:[4.4,4.9,5.1,5.3], A3:[6.4,7.0,7.4,7.7], A4:[9.3,9.6,9.7,9.8], A5:[8.6,8.8,8.9,9.0], A6:[8.6,9.0,9.2,9.2], A7:[4.6,6.5,7.6,8.1], A8:[9.0,9.2,9.4,9.4], A9:[4.5,6.6,7.7,8.1] },
  },
  colors: { "12.1":"#22d3ee", "12.6":"#4a9eff", "13.2":"#7F21E0", "13.7":"#E78A27" },
  timeline: ["M1","M3","M6","M12"],
  W: 520, H: 310, PL: 44, PR: 24, PT: 22, PB: 40,
};

function _promsEvSvg(qCode) {
  const E = _PROMS_EV;
  const px = (i) => E.PL + (i * (E.W - E.PL - E.PR) / (E.timeline.length - 1));
  const py = (v) => E.H - E.PB - ((v - 3) / 7) * (E.H - E.PT - E.PB);
  const grid = [3,4,5,6,7,8,9,10].map(val => {
    const y = py(val);
    return `<line x1="${E.PL}" y1="${y}" x2="${E.W - E.PR}" y2="${y}" stroke="rgba(15,29,64,0.08)"/><text x="${E.PL - 8}" y="${y + 4}" text-anchor="end" font-family="Inter" font-size="10" font-weight="600" fill="#6C6278">${val}</text>`;
  }).join("");
  const xLabels = E.timeline.map((m, i) => `<text x="${px(i)}" y="${E.H - 14}" text-anchor="middle" font-family="Inter" font-size="13" font-weight="700" fill="#0F1D40">${m}</text>`).join("");
  const series = Object.entries(E.byLens).map(([size, qvals]) => {
    const vals = qvals[qCode];
    const path = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(" ");
    const dots = vals.map((v, i) => `
      <g>
        <circle cx="${px(i)}" cy="${py(v)}" r="5" fill="#fff" stroke="${E.colors[size]}" stroke-width="2.4"/>
        ${i === vals.length - 1 ? `<text x="${px(i) + 8}" y="${py(v) + 4}" font-family="Inter" font-size="11" font-weight="800" fill="${E.colors[size]}">${v.toFixed(1)}</text>` : ''}
      </g>`).join("");
    return `<path d="${path}" stroke="${E.colors[size]}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
  }).join("");
  return `
    <svg class="proms-ev-svg" viewBox="0 0 ${E.W} ${E.H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      ${grid}
      ${series}
      ${xLabels}
      <line x1="${E.PL}" y1="${E.PT}" x2="${E.PL}" y2="${E.H - E.PB}" stroke="#0F1D40" stroke-width="1.5" opacity="0.5"/>
      <line x1="${E.PL}" y1="${E.H - E.PB}" x2="${E.W - E.PR}" y2="${E.H - E.PB}" stroke="#0F1D40" stroke-width="1.5" opacity="0.5"/>
    </svg>
  `;
}

function setPromsQ(qCode) {
  const chartEl = document.getElementById("promsEvChart");
  const qLabel  = document.getElementById("pqcQ");
  if (!chartEl) return;
  chartEl.innerHTML = _promsEvSvg(qCode);
  if (qLabel) qLabel.textContent = _PROMS_EV.qText[qCode] || qCode;
  document.querySelectorAll("#promsQPicker .proms-q-chip").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-q") === qCode);
  });
}
