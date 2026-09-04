/* ================================================================
   TOAST + SHARE-TO-FEED
================================================================ */
function showToast(msg) {
  let el = document.getElementById("globalToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "globalToast";
    el.className = "toast";
    /* audit A-05: a toast that is not announced is invisible to anyone not
       looking at that corner of the screen */
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.innerHTML = `<span class="chk">&#10003;</span>${msg}`;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2800);
}

// ===== EVO Points gamification — celebratory toast + balance counter =====
// Live balance (initial 290 to match the seeded state in EVO Credits page)
window.EVO_BAL = window.EVO_BAL || 290;
window.EVO_EARNED_MO = window.EVO_EARNED_MO || 240;

// Confetti emojis used as quick celebratory accent (rotated/randomly placed)
const _EVO_CONFETTI = ['◆','★','●','▲','✦','◇'];

function showEvoToast(amount, action, sublabel){
  let el = document.getElementById('evoToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'evoToast';
    el.className = 'evo-toast';
    document.body.appendChild(el);
  }
  // Build confetti spans (8 random pieces)
  let confetti = '';
  for (let i = 0; i < 8; i++){
    const c = _EVO_CONFETTI[Math.floor(Math.random() * _EVO_CONFETTI.length)];
    const left = Math.round(10 + Math.random() * 80);
    const delay = Math.round(Math.random() * 400);
    const dur = 700 + Math.round(Math.random() * 600);
    const rot = Math.round(Math.random() * 360);
    const sz = 9 + Math.round(Math.random() * 6);
    confetti += `<span class="evo-toast-confetti" style="left:${left}%;animation-delay:${delay}ms;animation-duration:${dur}ms;font-size:${sz}px;transform:rotate(${rot}deg);">${c}</span>`;
  }
  el.innerHTML = `
    <div class="evo-toast-confetti-layer">${confetti}</div>
    <div class="evo-toast-body">
      <div class="evo-toast-ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M12 2l2.6 6.4L21 9l-5 4.5L17.5 21 12 17.6 6.5 21 8 13.5 3 9l6.4-.6L12 2z"/></svg>
      </div>
      <div class="evo-toast-text">
        <div class="evo-toast-amount">+${amount}<span class="evo-toast-unit">EVO</span></div>
        <div class="evo-toast-action">${action}</div>
        ${sublabel ? `<div class="evo-toast-sub">${sublabel}</div>` : ''}
      </div>
      <div class="evo-toast-balance">
        <div class="etb-lbl">New balance</div>
        <div class="etb-val">${window.EVO_BAL.toLocaleString()}</div>
      </div>
    </div>
  `;
  el.classList.remove('show'); void el.offsetWidth;  // reset animation
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4000);
}

// Returns true if the EVO Credits feature is locked under the current Phase Demo
// settings (mapped to a later phase than currentPhase, or marked "out of scope").
// When locked, awardEvoPoints becomes a no-op so the gamification layer matches
// what the client will actually see in that phase of the rollout.
function _isEvoCreditsLocked(){
  var pd = window.PHASE_DEMO;
  if (!pd || !pd.enabled) return false;   // demo off → EVO available as normal
  var phase = pd.map ? pd.map['evo-credits'] : null;
  if (phase === 0) return true;            // out of scope
  if (pd.showAllPhases) return false;
  if (phase && phase > pd.currentPhase) return true;
  return false;
}
/* Exposed so the UI can hide every mention of EVO points — chips, hints,
   earned-credits blocks — in the phases where EVO Credits does not exist yet.
   Silently not awarding points is not enough: the copy must not promise them. */
window.evoCreditsLocked = _isEvoCreditsLocked;

// Award points: increments balance, updates any DOM badges, fires the gamification toast.
// Respects Phase Demo — if EVO Credits unlocks in a later phase, this is a silent no-op
// (no toast, no balance change). The action itself still happens normally.
function awardEvoPoints(amount, action, sublabel){
  if (typeof amount !== 'number' || amount <= 0) return;
  if (_isEvoCreditsLocked()) return;  // EVO Credits not yet available in current phase
  window.EVO_BAL += amount;
  window.EVO_EARNED_MO += amount;
  // Live-update sidebar nav badge (".us-nav-evo .mod-num") and the EVO Credits page balance if visible
  const navBadge = document.querySelector('.us-nav-evo .mod-num');
  if (navBadge) navBadge.textContent = String(window.EVO_BAL).padStart(2, '0');
  document.querySelectorAll('[data-evo-balance]').forEach(el => { el.textContent = window.EVO_BAL.toLocaleString(); });
  document.querySelectorAll('[data-evo-earned-mo]').forEach(el => { el.textContent = '+ ' + window.EVO_EARNED_MO; });
  showEvoToast(amount, action, sublabel);
}

function shareToFeed(patientId) {
  const p = DATA.patients.find(x => x.id === patientId);
  if (!p) return;
  // Build an anonymized community post prepended to the feed
  const riskLine = p.risk
    ? `Sentinel flagged <b>${p.risk.level === 'high' ? 'high' : (p.risk.level === 'med' ? 'medium' : 'low')} risk</b>. ${p.risk.flag}`
    : "No active risk flags — sharing for a second opinion on sizing strategy.";
  const firstName = p.name.split(" ").slice(-1)[0] || p.name;
  const post = {
    av: "DC",
    name: "Dr. Diego Cerutti",
    role: "Argentina · case shared · " + p.stage,
    time: "just now",
    verified: true,
    hasMedia: true,
    mediaLabel: `AS-OCT · anonymized case REV-${p.id.slice(-4)}`,
    body: `Sharing an anonymized case from my queue: <b>${p.age}y · ${p.eye} · ${p.power} D</b>. ${riskLine} Curious how the community would approach sizing here. <span class='hashtag'>#CaseReview</span> <span class='hashtag'>#ICLGuru</span> <span class='hashtag'>#Sentinel</span>`,
    likes: 0, comments: 0, shares: 0, views: "0",
    topComments: [],
  };
  DATA.feed.unshift(post);
  awardEvoPoints(10, 'Community case shared', firstName + '’s case posted to the feed');
  if (CURRENT_MOD === "community") renderModule("community");
}
