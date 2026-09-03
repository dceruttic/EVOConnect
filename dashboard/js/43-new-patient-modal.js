/* ================================================================
   NEW PATIENT — modal
   ----------------------------------------------------------------
   Both "New Patient" entry points (the home action card and the
   registry header) open this. It writes a real record into
   DATA.patients, so the new patient appears in the registry, the
   table, the kanban and the KPI counters, and its file opens like
   any other.
================================================================ */
(function () {
  'use strict';

  var NP_STAGES = ['Consult', 'Biometry', 'Eligibility', 'Sizing'];

  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* DATA is declared with const in js/01, so it is NOT on window — reach it
     lexically, never through window. */
  function patients() {
    try { return (DATA && DATA.patients) ? DATA.patients : []; } catch (e) { return []; }
  }
  function nextPatientId() {
    var max = 0;
    patients().forEach(function (p) {
      var m = String(p.id).match(/^(\d+)-(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[2], 10));
    });
    var prefix = ((patients()[0] || {}).id || '2126-0400').split('-')[0];
    return prefix + '-' + String(max + 1).padStart(4, '0');
  }

  function portraitFor(sex) {
    var skins = ['#E8BE99', '#D9A579', '#B57C52', '#8C5A38', '#F1CDA8'];
    var hairs = ['#2A1410', '#4A2C1A', '#141414', '#6E4B2A', '#8A8A8A'];
    var shirts = ['#4A5A8E', '#2F6F62', '#7A3B5C', '#3D4A5C', '#8A5A2B'];
    var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
    return { bg: '#EDE4F3', skin: pick(skins), hair: pick(hairs), shirt: pick(shirts),
             lips: '#A9564F', eyes: '#2D2B3C',
             hairShape: sex === 'F' ? 'long' : 'short' };
  }

  window.openNewPatientModal = function () {
    closeNewPatientModal();
    var id = nextPatientId();
    var m = el(
      '<div class="np-modal open" id="npModal" role="dialog" aria-modal="true" aria-labelledby="npTitle">' +
        '<div class="np-dialog">' +
          '<div class="np-head">' +
            '<div><h3 id="npTitle">New patient</h3>' +
            '<p>Creates the record and opens its file. Synthetic data only.</p></div>' +
            '<button type="button" class="np-close" aria-label="Close">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
            '</button>' +
          '</div>' +
          '<form class="np-body" id="npForm" novalidate>' +
            '<label class="np-f np-wide"><span>Full name</span>' +
              '<input name="name" autocomplete="off" placeholder="e.g. M. Herrera" required>' +
              '<em class="np-err" data-err="name" hidden>Enter the patient name</em></label>' +
            '<label class="np-f"><span>Patient ID</span><input name="id" value="' + esc(id) + '" readonly></label>' +
            '<label class="np-f"><span>Age</span>' +
              '<input name="age" inputmode="numeric" placeholder="e.g. 34" required>' +
              '<em class="np-err" data-err="age" hidden>18 to 60</em></label>' +
            '<label class="np-f"><span>Sex</span>' +
              '<select name="sex"><option value="F">Female</option><option value="M">Male</option><option value="Other">Other</option></select></label>' +
            '<label class="np-f"><span>Eye</span>' +
              '<select name="eye"><option value="OD/OS">OD / OS</option><option value="OD">OD</option><option value="OS">OS</option></select></label>' +
            '<label class="np-f"><span>Sphere OD (D)</span>' +
              '<input name="od" placeholder="-8.00" required><em class="np-err" data-err="od" hidden>A number, e.g. -8.00</em></label>' +
            '<label class="np-f"><span>Sphere OS (D)</span>' +
              '<input name="os" placeholder="-7.75"><em class="np-err" data-err="os" hidden>A number, e.g. -7.75</em></label>' +
            '<label class="np-f"><span>Stage</span><select name="stage">' +
              NP_STAGES.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
            '</select></label>' +
            '<label class="np-f np-wide np-check"><input type="checkbox" name="open" checked>' +
              '<span>Open the patient file after creating</span></label>' +
          '</form>' +
          '<div class="np-foot">' +
            '<button type="button" class="np-cancel">Cancel</button>' +
            '<button type="button" class="np-save">Create patient</button>' +
          '</div>' +
        '</div>' +
      '</div>');
    document.body.appendChild(m);
    document.body.style.overflow = 'hidden';
    m.addEventListener('click', function (e) { if (e.target === m) closeNewPatientModal(); });
    m.querySelector('.np-close').addEventListener('click', closeNewPatientModal);
    m.querySelector('.np-cancel').addEventListener('click', closeNewPatientModal);
    m.querySelector('.np-save').addEventListener('click', saveNewPatient);
    m.querySelector('#npForm').addEventListener('submit', function (e) { e.preventDefault(); saveNewPatient(); });
    setTimeout(function () { var i = m.querySelector('[name="name"]'); if (i) i.focus(); }, 30);
  };

  window.closeNewPatientModal = function () {
    var m = document.getElementById('npModal');
    if (m) { m.remove(); document.body.style.overflow = ''; }
  };

  function saveNewPatient() {
    var f = document.getElementById('npForm'); if (!f) return;
    var v = function (n) { return (f.querySelector('[name="' + n + '"]') || {}).value || ''; };
    var err = function (k, on) { var n = f.querySelector('[data-err="' + k + '"]'); if (n) n.hidden = !on; return on; };
    var num = function (x) { return /^[-+]?\d{1,2}(\.\d{1,2})?$/.test(String(x).trim()); };

    var name = v('name').trim(), age = parseInt(v('age'), 10), od = v('od').trim(), os = v('os').trim();
    var bad = false;
    bad = err('name', !name) || bad;
    bad = err('age', !(age >= 18 && age <= 60)) || bad;
    bad = err('od', !num(od)) || bad;
    bad = err('os', os !== '' && !num(os)) || bad;
    if (bad) { var first = f.querySelector('.np-err:not([hidden])'); if (first) first.scrollIntoView({ block: 'center' }); return; }

    var sex = v('sex'), eye = v('eye'), stage = v('stage');
    var power = os ? (od + ' / ' + os) : od;
    var pt = {
      id: v('id'), name: name, age: age, sex: sex, eye: eye, power: power,
      stage: stage, risk: null, iclGuru: null, portrait: portraitFor(sex),
      surgeryDate: null, createdAt: new Date().toISOString()
    };
    DATA.patients.unshift(pt);
    var openIt = (f.querySelector('[name="open"]') || {}).checked;
    closeNewPatientModal();
    if (typeof showToast === 'function') showToast(name + ' created · ' + pt.id);
    if (openIt && typeof openPatientFile === 'function') openPatientFile(pt.id);
    else if (typeof renderModule === 'function') renderModule('patients');
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('npModal')) closeNewPatientModal();
  });

  /* Wire both entry points, whenever they are rendered. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b) return;
    var txt = (b.textContent || '').trim().toLowerCase();
    if (txt === 'new patient' || txt === '+ new patient') {
      e.preventDefault(); e.stopPropagation();
      openNewPatientModal();
    }
  }, true);
})();
