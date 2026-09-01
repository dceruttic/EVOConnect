/* ================================================================
   AI COPILOT (floating chat, global)
================================================================ */
const COPILOT_HISTORY = [
  { from: "ai", body: "Hi Roger. I'm REVAI Copilot. I have access to today's OR schedule, your patient pipeline, and STAAR lot status. What can I help with?", time: "now" },
  { from: "me", body: "Summarize the 10:15 case for me in 3 lines.", time: "now" },
  { from: "ai", body: "<b>M. Herrera · OD · -8.00 D · EVO+ 12.6</b><br>• AS-OCT: ATA 12.1, STS 11.9, ACD 3.24 → ICL Guru recommends 12.6 at 89% confidence.<br>• STAAR lot LOT-241018-A arrived yesterday, serial verified.<br>• Surgeon: Dr. Roberto Zaldivar · anesthesia ready at 09:50. No flags.", time: "now" },
];
const SUGGESTED_PROMPTS = [
  "What patients are flagged as high-risk this week?",
  "Draft a follow-up message to P. Martínez for D7",
  "Summarize today's OR block in one paragraph",
  "Which cases need re-sizing based on latest PROMs?",
  "Compare my vault accuracy vs. global benchmark",
];

function openCopilot() {
  document.getElementById("copilotPanel").classList.add("open");
  document.getElementById("copilotInput").focus();
}
function closeCopilot() {
  document.getElementById("copilotPanel").classList.remove("open");
}
function renderCopilotMessages() {
  const el = document.getElementById("copilotMessages");
  el.innerHTML = COPILOT_HISTORY.map(m => `
    <div class="co-msg ${m.from}">
      ${m.from === "ai" ? '<div class="co-av ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg></div>' : '<div class="co-av me">DC</div>'}
      <div class="co-bubble">${m.body}</div>
    </div>
  `).join("");
  el.scrollTop = el.scrollHeight;
}
function sendCopilotMsg() {
  const input = document.getElementById("copilotInput");
  const v = input.value.trim();
  if (!v) return;
  COPILOT_HISTORY.push({ from: "me", body: v, time: "now" });
  input.value = "";
  renderCopilotMessages();
  setTimeout(() => {
    COPILOT_HISTORY.push({ from: "ai", body: aiReply(v), time: "now" });
    renderCopilotMessages();
  }, 650);
}
function aiReply(q) {
  const ql = q.toLowerCase();
  if (ql.includes("risk") || ql.includes("flag") || ql.includes("riesgo"))
    return "I've scanned the 1,248 active patients. <b>3 high-risk flags</b>:<br>• <b>S. Ortega</b> — borderline ACD (2.98 mm) + high pupil (6.1 mm mesopic). Consider PRK.<br>• <b>A. Duarte</b> — -9.25 D · ECC dropping 2% YoY → watch.<br>• <b>P. Martínez</b> — night-vision PROMs trending down. Schedule D14 review.";
  if (ql.includes("follow") || ql.includes("d7") || ql.includes("mensaje"))
    return "Draft ready — <b>Hi P.,</b> it's been 7 days since your ICL surgery. We hope you're seeing beautifully! Quick check: any halos at night, any discomfort, using your drops? Reply with a 1–5 score for each. — Dr. Gregory Parkhurst <br><br><button class='tag-ai' style='margin-top:8px'>Send via WhatsApp</button>";
  if (ql.includes("or") || ql.includes("schedule") || ql.includes("block"))
    return "<b>Today's block · OR 2 · Dr. Roberto Zaldivar</b> — 3 ICL cases, all EVO+. Martínez (-6.5) done at 08:58 (clean, vault 490). Herrera (-8.0) currently in the injection stage at 10:15. Castro (-4.25) prep at 11:45, expect knife-to-skin 12:10. Total OR time ≈ 3h 45m. No incidents. Lot verification complete for all three.";
  if (ql.includes("vault") || ql.includes("benchmark"))
    return "<b>Your clinic</b> · vault-in-target 96% (250–750 µm) · <b>Global benchmark 2025</b> · 81.4%. You're in the top 5% of ICL surgeons in the REVAI network. Biggest driver: adoption of ICL Guru AI sizing (+12 pts accuracy since Sept 2025).";
  return "Got it — let me check the patient record and cross-reference with today's schedule. One moment.<br><br><span class='muted small'>This is a demo response. In production I'd use the clinic's live patient + STAAR + ICL Guru data.</span>";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) {
    e.preventDefault(); openCopilot();
  }
});

// Initial render of the copilot widget (after COPILOT_HISTORY / SUGGESTED_PROMPTS are defined)
renderCopilotMessages();
renderCopilotSuggest();


// === Consolidated build: dashboard is the landing view; EVO Connect opens via marketplace card ===
// closeUniverse just hides the overlay (no external navigation — dashboard is always behind it)
window.closeUniverse = function(){
  const v = document.getElementById('universeView');
  if (v) v.classList.remove('open');
  document.body.style.overflow = '';
};
