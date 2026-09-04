/* ================================================================
   Focus containment for modals — audit A-05
   ----------------------------------------------------------------
   Tabbing out of the ICL Guru report took the surgeon into the page
   behind it: the modal stayed on screen while the keyboard walked the
   sidebar. This keeps Tab inside whatever dialog is on top, sends the
   first Tab to the dialog rather than to the document, and gives focus
   back to the control that opened it when it closes.

   It is deliberately generic — it looks for what a dialog IS, not for a
   list of class names — so a modal added later is covered without
   anyone remembering this file exists.
================================================================ */
(function () {
  'use strict';

  var DIALOGS = '[role="dialog"][aria-modal="true"], .guru-scrim, .shx, .sh-omodal-scrim, .pd-gate';
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]),' +
                  'select:not([disabled]), textarea:not([disabled]), summary,' +
                  '[tabindex]:not([tabindex="-1"])';
  var opener = null;

  function visible(el) {
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return false;
    var r = el.getBoundingClientRect();
    return !!(r.width || r.height) && getComputedStyle(el).visibility !== 'hidden';
  }
  function topDialog() {
    var open = Array.prototype.filter.call(document.querySelectorAll(DIALOGS), visible);
    return open.length ? open[open.length - 1] : null;   // last in the DOM is on top
  }
  function stops(dlg) {
    return Array.prototype.filter.call(dlg.querySelectorAll(FOCUSABLE), visible);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var dlg = topDialog(); if (!dlg) return;
    var list = stops(dlg); if (!list.length) { e.preventDefault(); return; }
    var first = list[0], last = list[list.length - 1], active = document.activeElement;

    if (!dlg.contains(active)) {          // focus was outside: pull it in
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
      return;
    }
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }, true);

  /* remember who opened it, and hand focus back when it goes away */
  document.addEventListener('mousedown', function (e) {
    if (!topDialog() && e.target.closest && e.target.closest(FOCUSABLE)) opener = e.target.closest(FOCUSABLE);
  }, true);

  var had = false;
  var mo = new MutationObserver(function () {
    var now = !!topDialog();
    if (now && !had) {
      /* move focus into the dialog so the first Tab is already inside it */
      var dlg = topDialog(), list = stops(dlg);
      if (list.length && !dlg.contains(document.activeElement)) {
        setTimeout(function () { try { list[0].focus(); } catch (err) {} }, 30);
      }
    }
    if (!now && had && opener && document.contains(opener)) {
      try { opener.focus(); } catch (err) {}
    }
    had = now;
  });
  mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
})();
