// ============================================================
// MATHURA OVERSEAS — main site behaviour
// Number-counter animation, scroll-reveal, active nav, navbar shrink
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Smooth-scroll for on-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const collapse = document.getElementById('navbarMain');
        if (collapse && collapse.classList.contains('show')) {
          bootstrap.Collapse.getOrCreateInstance(collapse).hide();
        }
      }
    });
  });

  /* ---------- Navbar shrink + active link on scroll ---------- */
  const nav = document.getElementById('mainNav');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);

    let current = '';
    sections.forEach(function (section) {
      const top = section.offsetTop - 90;
      if (window.scrollY >= top) current = section.getAttribute('id');
    });
    document.querySelectorAll('.navbar-nav .nav-link').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Number counter animation ---------- */
  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = (decimals > 0 ? value.toFixed(decimals) : Math.round(value)) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = (decimals > 0 ? target.toFixed(decimals) : target) + suffix;
      }
    }
    requestAnimationFrame(tick);
  }

  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(function (c) { counterObserver.observe(c); });

  /* ---------- Scroll-reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () { entry.target.classList.add('in'); }, i * 60);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(function (el) { revealObserver.observe(el); });

  /* ---------- University banner carousels (Philippines / Uzbekistan / Timor) ---------- */
  document.querySelectorAll('.uni-carousel').forEach(function (carousel) {
    const track = carousel.querySelector('.uni-track');
    const slides = carousel.querySelectorAll('.uni-slide');
    const prevBtn = carousel.querySelector('.uni-nav-prev');
    const nextBtn = carousel.querySelector('.uni-nav-next');
    const dotsWrap = carousel.querySelector('.uni-dots');
    const total = slides.length;
    let index = 0;
    let timer = null;

    // Set explicit, unambiguous sizing instead of relying on the browser's
    // default auto-width resolution for percentage flex-basis (which some
    // Chrome builds resolve differently, and which single-slide carousels
    // like Timor need too, or the banner shrinks to fit its content instead
    // of filling the card).
    const slidePercent = 100 / total;
    track.style.width = (total * 100) + '%';
    slides.forEach(function (s) { s.style.flex = '0 0 ' + slidePercent + '%'; s.style.maxWidth = slidePercent + '%'; });

    if (total <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dotsWrap) dotsWrap.style.display = 'none';
      return;
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 'uni-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
      }
    }

    function update() {
      track.style.transform = 'translate3d(-' + (index * slidePercent) + '%, 0, 0)';
      if (dotsWrap) {
        dotsWrap.querySelectorAll('.uni-dot').forEach(function (d, i) {
          d.classList.toggle('active', i === index);
        });
      }
    }
    function goTo(i) { index = (i + total) % total; update(); }

    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); restartAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); restartAutoplay(); });

    function startAutoplay() { timer = setInterval(function () { goTo(index + 1); }, 6500); }
    function restartAutoplay() { clearInterval(timer); startAutoplay(); }

    startAutoplay();
    carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
    carousel.addEventListener('mouseleave', startAutoplay);
    update();
  });

  /* ---------- Budget/Country matcher tool (news.html) ---------- */
  const matcherBtn = document.getElementById('matcherBtn');
  if (matcherBtn) {
    // Annual budget tier in INR lakhs per university, plus country and page link.
    const UNIVERSITIES = [
      { name: 'Fergana Medical Institute', country: 'Uzbekistan', budget: 3.2, page: 'Fergana.html', flag: '🇺🇿' },
      { name: 'Samarkand State Medical University', country: 'Uzbekistan', budget: 3.4, page: 'samarkand.html', flag: '🇺🇿' },
      { name: 'Tashkent Medical Academy', country: 'Uzbekistan', budget: 3.6, page: 'tashkent.html', flag: '🇺🇿' },
      { name: 'Lyceum Northwestern University', country: 'Philippines', budget: 2.8, page: 'lyceum.html', flag: '🇵🇭' },
      { name: 'AMA School of Medicine, Manila', country: 'Philippines', budget: 3.0, page: 'ama-school-of-medicine.html', flag: '🇵🇭' },
      { name: 'Brokenshire College of Medicine', country: 'Philippines', budget: 3.7, page: 'mbbs-in-philippines-brokenshire.html', flag: '🇵🇭' },
      { name: 'Southwestern University PHINMA', country: 'Philippines', budget: 3.9, page: 'southwestern.html', flag: '🇵🇭' },
      { name: 'UV Gullas College of Medicine', country: 'Philippines', budget: 4.1, page: 'uv-gullas.html', flag: '🇵🇭' },
      { name: 'Davao Medical School Foundation', country: 'Philippines', budget: 4.4, page: 'davao.html', flag: '🇵🇭' },
      { name: 'Universidade Católica Timorense', country: 'Timor-Leste', budget: 5.4, page: 'uct-timor.html', flag: '🇹🇱' }
    ];

    matcherBtn.addEventListener('click', function () {
      const budgetCeiling = parseFloat(document.getElementById('matcherBudget').value);
      const country = document.getElementById('matcherCountry').value;

      let matches = UNIVERSITIES.filter(function (u) {
        const budgetOk = budgetCeiling >= 999 ? true : u.budget <= budgetCeiling;
        const countryOk = country === 'Any' ? true : u.country === country;
        return budgetOk && countryOk;
      });
      matches.sort(function (a, b) { return a.budget - b.budget; });

      const resultsEl = document.getElementById('matcherResults');
      if (matches.length === 0) {
        resultsEl.innerHTML = '<div class="uni-fee-card text-center"><p class="text-muted mb-0">No exact match at that budget — but our counsellors often find flexible options not listed here. <a href="apply.html" target="_blank" rel="noopener">Talk to us directly</a>.</p></div>';
        return;
      }

      let html = '<div class="row g-3">';
      matches.forEach(function (u) {
        html += '<div class="col-md-6"><div class="uni-fee-card h-100" style="padding:20px;">' +
          '<h6 class="text-jade mb-1">' + u.flag + ' ' + u.name + '</h6>' +
          '<p class="text-muted small mb-2">' + u.country + ' · from ~₹' + u.budget + 'L/year</p>' +
          '<a href="' + u.page + '" class="btn btn-ghost-jade btn-sm w-100">View Details &amp; Fees</a>' +
          '</div></div>';
      });
      html += '</div>';
      resultsEl.innerHTML = html;
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* ---------- PWA: register service worker (offline support + installability) ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function (err) {
        console.warn('Service worker registration failed:', err);
      });
    });
  }

  /* ---------- Social dock peek handle (mobile/tablet slide in/out) ---------- */
  const socialDock = document.getElementById('socialDock');
  const socialHandle = document.getElementById('socialDockHandle');
  if (socialDock && socialHandle) {
    let autoCloseTimer = null;
    socialHandle.addEventListener('click', function () {
      const isOpen = socialDock.classList.toggle('open');
      clearTimeout(autoCloseTimer);
      if (isOpen) {
        autoCloseTimer = setTimeout(function () { socialDock.classList.remove('open'); }, 4000);
      }
    });
    document.addEventListener('click', function (e) {
      if (socialDock.classList.contains('open') && !socialDock.contains(e.target)) {
        socialDock.classList.remove('open');
        clearTimeout(autoCloseTimer);
      }
    });
  }

  /* ---------- Delayed application popup (once per browser session) ---------- */
  const popup = document.getElementById('applyPopup');
  if (popup) {
    const alreadyShown = sessionStorage.getItem('mo_popup_shown');
    let popupTimer = null;
    if (!alreadyShown) {
      popupTimer = setTimeout(function () {
        popup.classList.add('show');
        sessionStorage.setItem('mo_popup_shown', '1');
      }, 45000);
    }
    function closePopup() {
      popup.classList.remove('show');
      if (popupTimer) clearTimeout(popupTimer);
    }
    const closeBtn = document.getElementById('popupClose');
    const dismissBtn = document.getElementById('popupDismiss');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (dismissBtn) dismissBtn.addEventListener('click', closePopup);
    popup.addEventListener('click', function (e) { if (e.target === popup) closePopup(); });
  }

  /* ---------- Contact form (index page) — no-op guard, real form lives in apply.html ---------- */
  const legacyForm = document.querySelector('#contact form');
  if (legacyForm) {
    legacyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      window.open('apply.html', '_blank', 'noopener');
    });
  }
});