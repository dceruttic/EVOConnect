/* ============== PHASE DEMO LOCK HOOK ============== */
// When PHASE_DEMO is enabled and copilot's phase > currentPhase, lock the CTA.
window.applyDashCopilotHeroLock = function(){
  const hero = document.getElementById('dashCopilotHero');
  if (!hero) return;
  const st = window.PHASE_DEMO;
  if (!st || !st.enabled){
    hero.classList.remove('is-locked');
    const lk = document.getElementById('dccLockIcon'); if (lk) lk.style.display = 'none';
    hero.title = 'Ask REVAI · your clinical AI copilot';
    return;
  }
  const phase = st.map ? st.map['copilot'] : 5;
  const showAll = st.showAllPhases;
  let locked = false;
  let lockMsg = '';
  if (phase === 0){ locked = true; lockMsg = 'Out of scope · not part of any contracted phase'; }
  else if (!showAll && phase > st.currentPhase){
    locked = true;
    lockMsg = (window.PROJECT_PHASES && window.PROJECT_PHASES[phase])
      ? 'Unlocks in ' + window.PROJECT_PHASES[phase].name + ' · ' + window.PROJECT_PHASES[phase].label
      : 'Unlocks in Phase 5 & 6';
  }
  hero.classList.toggle('is-locked', locked);
  const lk = document.getElementById('dccLockIcon'); if (lk) lk.style.display = locked ? '' : 'none';
  hero.title = locked ? lockMsg : 'Ask REVAI · your clinical AI copilot';
};
// Initial apply + observer
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(window.applyDashCopilotHeroLock, 50);
});
// Re-apply whenever Phase Demo state changes (PhaseDemo.setPhase/setShowAll/toggle)
(function hookPhaseDemo(){
  const tryHook = () => {
    if (!window.PhaseDemo) return setTimeout(tryHook, 200);
    ['setPhase','setShowAll','toggleQuick','toggle','reset'].forEach(fnName => {
      const orig = window.PhaseDemo[fnName];
      if (typeof orig === 'function' && !orig._dchHooked){
        window.PhaseDemo[fnName] = function(){
          const r = orig.apply(this, arguments);
          setTimeout(window.applyDashCopilotHeroLock, 20);
          return r;
        };
        window.PhaseDemo[fnName]._dchHooked = true;
      }
    });
  };
  tryHook();
})();
