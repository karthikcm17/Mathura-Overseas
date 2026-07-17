// ============================================================
// MATHURA OVERSEAS — application form submission
//
// HOW THIS SAVES TO A DATABASE:
// A static HTML site has no server of its own, so "the database" here
// is a Google Sheet, written to via a free Google Apps Script Web App.
// Paste the deployed Web App URL below. Full setup steps are in
// GOOGLE_SHEETS_SETUP.md (5–10 minutes, no coding required).
// ============================================================

const CONFIG = {
  // 1. Follow GOOGLE_SHEETS_SETUP.md to deploy the Apps Script.
  // 2. Paste the resulting Web App URL here, replacing the placeholder.
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyj4TOlzTES7scyNsMQR9Wcxc7UKYFOjUF2s4bYx4xWFCAIYFH6u9aLJ2Ork23wQKgd/exec'
};

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('applyForm');
  const formPanel = document.getElementById('formPanel');
  const successPanel = document.getElementById('successPanel');
  const refDisplay = document.getElementById('refDisplay');
  const hiddenFrame = document.getElementById('hiddenFrame');
  const submitBtn = document.getElementById('submitBtn');

  function makeRefCode() {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const stamp = Date.now().toString().slice(-5);
    return 'MO-' + stamp + rand;
  }

  function saveLocalCopy(data) {
    try {
      const existing = JSON.parse(localStorage.getItem('mathura_applications') || '[]');
      existing.push(data);
      localStorage.setItem('mathura_applications', JSON.stringify(existing));
    } catch (err) {
      console.warn('Local backup copy could not be saved:', err);
    }
  }

  let submitted = false;

  form.addEventListener('submit', function (e) {
    // Honeypot check — silently drop obvious bots
    const honeypot = form.querySelector('input[name="website"]').value;
    if (honeypot) { e.preventDefault(); return; }

    const ref = makeRefCode();
    document.getElementById('refCode').value = ref;
    document.getElementById('submittedAt').value = new Date().toISOString();

    // Build a plain object for the local backup copy
    const formData = new FormData(form);
    const record = {};
    formData.forEach(function (value, key) { record[key] = value; });
    saveLocalCopy(record);

    const noEndpointConfigured = CONFIG.GOOGLE_SCRIPT_URL.indexOf('PASTE_YOUR') === 0;

    if (noEndpointConfigured) {
      // No Sheet connected yet — don't let the form POST into a dead URL.
      // Show success locally so the flow can still be demoed/tested end to end.
      e.preventDefault();
      console.info('No Google Sheet endpoint configured yet — see GOOGLE_SHEETS_SETUP.md. Submission kept in local storage only.');
      showSuccess(ref);
      return;
    }

    // Real submission: point the form at the configured Apps Script URL
    // and let the browser POST it into the hidden iframe (avoids CORS
    // issues entirely, unlike a fetch() call to an Apps Script endpoint).
    form.action = CONFIG.GOOGLE_SCRIPT_URL;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

    submitted = true;
    // form submits natively here (not prevented) — success shown on iframe load below
    showSuccess(ref);
  });

  hiddenFrame.addEventListener('load', function () {
    if (submitted) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-send me-2"></i>Submit Application';
    }
  });

  function showSuccess(ref) {
    refDisplay.textContent = ref;
    formPanel.style.display = 'none';
    successPanel.classList.add('show');
  }
});
