/* ============== FULL TAKEOVER VIEW (STAAR-Copilot style, light) ============== */
const RCP_TAKEOVER_TEMPLATE = `
  <div class="rcp-stickyhead">
    <div class="rcp-stickyhead-inner">
      <button class="rcp-close" onclick="dashCopilotCloseTakeover()" title="Close (Esc)">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <div class="rcp-hero">
        <div class="rcp-hero-orb">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7L12 2z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/></svg>
        </div>
        <div class="rcp-hero-text">
          <h1>Ask <span class="rcp-grad">REVAI Copilot</span></h1>
          <p>Natural-language access to your clinical cohort — ${dchDisplayTotal()} surgeries (cataract, ICL, LASIK, SMILE), biometry, post-op PROMs and geographic distribution. Every answer is cited and stays inside your clinic.</p>
          <div class="rcp-hero-pill" style="display:inline-flex;align-items:center;gap:8px;margin-top:10px;padding:6px 12px;background:rgba(92,24,171,.08);border:1px solid rgba(92,24,171,.2);border-radius:999px;font-size:12px;font-weight:700;color:#5C18AB"><span style="width:6px;height:6px;border-radius:50%;background:#03A180"></span>${dchDisplayTotal()} cases · cataract · ICL · LASIK · SMILE</div>
        </div>
        <div class="rcp-hero-status">
          <span class="rcp-status-pill"><span class="dot"></span>Online</span>
          <span class="meta">Copilot v1.2 · private</span>
        </div>
      </div>

      <form class="rcp-input-wrap" onsubmit="return dashCopilotTakeoverSubmit(event)" autocomplete="off">
        <div class="rcp-input-row">
          <svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          <input id="rcpInput" class="rcp-input" placeholder="Ask me anything… e.g. Where are my dissatisfied patients located geographically?" autocomplete="off"/>
          <button type="submit" class="rcp-send">
            Ask
            <svg viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div class="rcp-sugs">
          <span class="rcp-sug" onclick="dashCopilotAsk('Who are my dissatisfied patients?')">😟 Dissatisfied patients</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('What common characteristics do my dissatisfied patients share?')">🧬 Common characteristics</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('Where are my dissatisfied patients located geographically?')">🗺️ Patient map</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('What is my surgery mix?')">🔬 Surgery mix</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('What are my surgical results by doctor?')">👨‍⚕️ Results by doctor</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('Compare IOL outcomes across the network')">📊 IOL benchmark</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('What is my month-by-month surgery evolution?')">📈 Monthly evolution</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('Which patients are overdue in post-op?')">⏰ Overdue post-op</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('How are my LASIK and SMILE outcomes?')">💊 LASIK / SMILE</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('What is my vault accuracy by surgeon for ICL?')">🎯 Vault accuracy (ICL)</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('Which refractive patients had over- or under-correction?')">⚠️ Over/under-correction</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('How does my NPS compare to peer clinics?')">📊 NPS vs peers</span>
          <span class="rcp-sug" onclick="dashCopilotAsk('How is my pipeline this week?')">🔭 This week's pipeline</span>
        </div>
      </form>
    </div>
  </div>

  <div class="rcp-scroll" id="rcpScroll">
    <div class="rcp-scroll-inner">
      <div class="rcp-stream" id="rcpStream">
        <div class="rcp-msg">
          <div class="rcp-av"><svg viewBox="0 0 24 24"><path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7L12 2z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/></svg></div>
          <div class="rcp-bubble">
            <h4>👋 Hi Roger — how can I help? <span class="ptag live">Copilot v1.2 · online</span></h4>
            <p>I'm connected to your clinical cohort: <b>${dchDisplayTotal()} surgeries</b> (cataract, ICL, LASIK, SMILE), full biometry, post-op PROMs at 1·3·6 months, and geographic distribution by province. Tap a suggestion or ask me any question — English or Spanish.</p>
            <p style="color:#7d6fa3;font-size:12px">All responses stay within your clinic. I never expose PHI from other centers. The analysis is advisory — final clinical decisions are yours.</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

function dashCopilotEnsureTakeover(){
  // Find the host container — prefer whichever main-content area is currently
  // visible (clinic dashboard vs EVO Connect have different containers).
  // Walk in order of preference; the takeover anchors via position:absolute.
  function pickHost(){
    const candidates = [
      document.querySelector('.home-body'),   // clinic dashboard (Good evening · My Schedule)
      document.querySelector('.home-main'),   // clinic dashboard outer wrapper
      document.getElementById('usMain'),       // EVO Connect main
      document.querySelector('.home-content'), // narrower fallback
    ];
    for (const el of candidates) {
      if (el && el.offsetParent !== null) return el;  // visible
    }
    return candidates.find(Boolean) || document.body;
  }

  let t = document.getElementById('rcpTakeover');
  const host = pickHost();
  // Make sure host can anchor an absolutely-positioned child
  if (host !== document.body) {
    const cs = window.getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
  }
  if (t) {
    // If the takeover exists but is in the wrong container (user navigated), move it
    if (t.parentNode !== host) host.appendChild(t);
    return t;
  }
  t = document.createElement('div');
  t.className = 'rcp-takeover';
  t.id = 'rcpTakeover';
  t.innerHTML = RCP_TAKEOVER_TEMPLATE;
  host.appendChild(t);
  return t;
}
function dashCopilotOpenTakeover(){
  const hero = document.getElementById('dashCopilotHero');
  if (hero && hero.classList.contains('is-locked')){
    if (typeof showToast === 'function') showToast('REVAI Copilot unlocks in Phase 5 & 6');
    return;
  }
  const t = dashCopilotEnsureTakeover();
  t.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const inp = document.getElementById('rcpInput'); if (inp) inp.focus(); }, 80);
}
function dashCopilotCloseTakeover(){
  const t = document.getElementById('rcpTakeover');
  if (t){
    t.classList.remove('open');
    // Reset compact-hero so next opening starts at full size if the chat is empty
    const stream = document.getElementById('rcpStream');
    const userMsgs = stream ? stream.querySelectorAll('.rcp-msg.user').length : 0;
    if (!userMsgs) t.classList.remove('has-chat');
  }
  document.body.style.overflow = '';
}

function dashCopilotAsk(qText){
  // Phase Demo guard
  const hero = document.getElementById('dashCopilotHero');
  if (hero && hero.classList.contains('is-locked')){
    if (typeof showToast === 'function') showToast('REVAI Copilot unlocks in Phase 5 & 6');
    return;
  }
  dashCopilotOpenTakeover();
  const stream = document.getElementById('rcpStream');
  if (!stream) return;
  // Compact-hero mode: as soon as the first user message lands, shrink the hero
  const takeover = document.getElementById('rcpTakeover');
  if (takeover) takeover.classList.add('has-chat');
  // User bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'rcp-msg user';
  userDiv.innerHTML = `<div class="rcp-bubble">${dchEsc(qText)}</div>`;
  stream.appendChild(userDiv);
  // Typing
  const typing = document.createElement('div');
  typing.className = 'rcp-msg';
  typing.innerHTML = `
    <div class="rcp-av"><svg viewBox="0 0 24 24"><path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7L12 2z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/></svg></div>
    <div class="rcp-bubble"><span class="dch-typing"><span></span><span></span><span></span></span></div>`;
  stream.appendChild(typing);
  // Scroll
  const scroll = document.getElementById('rcpScroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
  // Clear input
  const inp = document.getElementById('rcpInput'); if (inp) inp.value = '';
  // Resolve
  setTimeout(() => {
    const intent = dchMatchIntent(qText);
    const html = dchAnswer(intent, qText);
    typing.querySelector('.rcp-bubble').innerHTML = html;
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
    // Wire any geo dot tooltips inside the freshly-rendered bubble
    rcpWireGeoTooltips(typing);
  }, 560);
}
function dashCopilotSubmit(e){ if (e) e.preventDefault(); return false; } // legacy noop
function dashCopilotTakeoverSubmit(e){
  if (e) e.preventDefault();
  const inp = document.getElementById('rcpInput');
  if (!inp) return false;
  const q = (inp.value || '').trim();
  if (!q) return false;
  dashCopilotAsk(q);
  return false;
}
function dashCopilotFootSubmit(e){ return dashCopilotTakeoverSubmit(e); } // legacy alias

document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){
    const t = document.getElementById('rcpTakeover');
    if (t && t.classList.contains('open')){ dashCopilotCloseTakeover(); }
  }
});

window.dashCopilotAsk = dashCopilotAsk;
window.dashCopilotSubmit = dashCopilotSubmit;
window.dashCopilotOpenTakeover = dashCopilotOpenTakeover;
window.dashCopilotCloseTakeover = dashCopilotCloseTakeover;
window.dashCopilotTakeoverSubmit = dashCopilotTakeoverSubmit;
window.dashCopilotFootSubmit = dashCopilotFootSubmit;
// Legacy compat
window.dashCopilotClose = dashCopilotCloseTakeover;
