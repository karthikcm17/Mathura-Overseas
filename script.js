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

  /* ---------- Mobile accordion for country groups (Destinations section) ---------- */
  document.querySelectorAll('.country-toggle').forEach(function (head) {
    const wrap = head.nextElementSibling;
    if (!wrap || !wrap.classList.contains('country-cards-wrap')) return;

    // Fill in the live card count badge
    const countEl = head.querySelector('.cg-count-num');
    if (countEl) {
      const cardCount = wrap.querySelectorAll('.banner-card').length;
      countEl.textContent = cardCount + (cardCount === 1 ? ' university' : ' universities');
    }

    function toggle() {
      const isOpen = wrap.classList.toggle('open');
      head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    head.addEventListener('click', toggle);
    head.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  /* ---------- News list: category filter (All / NEET UG / NEET PG) + pagination ----------
     Built for high volume (250-300+ posts over time). All posts always stay in
     the HTML for SEO — this just controls how many are VISIBLE at once, so the
     page stays fast and scannable no matter how large the list grows. */
  const newsList = document.getElementById('newsList');
  if (newsList) {
    const BATCH_SIZE = 6;
    const filterTabs = document.querySelectorAll('.feed-filter-tab');
    const loadMoreBtn = document.getElementById('newsLoadMore');
    const countLabel = document.getElementById('newsListCount');
    const allRows = Array.prototype.slice.call(newsList.querySelectorAll('.news-row'));
    let currentFilter = 'all';
    let visibleCount = BATCH_SIZE;

    function getFilteredRows() {
      return allRows.filter(function (row) {
        return currentFilter === 'all' || row.getAttribute('data-exam') === currentFilter;
      });
    }

    function render() {
      const filtered = getFilteredRows();
      allRows.forEach(function (row) { row.classList.add('hidden-row'); });
      filtered.slice(0, visibleCount).forEach(function (row) { row.classList.remove('hidden-row'); });

      const shown = Math.min(visibleCount, filtered.length);
      countLabel.textContent = 'Showing ' + shown + ' of ' + filtered.length + ' updates';
      if (shown >= filtered.length) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = 'All caught up';
      } else {
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = 'Load More <i class="bi bi-chevron-down ms-1"></i>';
      }
    }

    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        filterTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter');
        visibleCount = BATCH_SIZE;
        render();
      });
    });

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        visibleCount += BATCH_SIZE;
        render();
      });
    }

    render();
  }

  /* ---------- News item "View More" expand/collapse ---------- */
  document.querySelectorAll('.news-view-more').forEach(function (btn) {
    const fullText = btn.previousElementSibling;
    if (!fullText || !fullText.classList.contains('news-full-text')) return;
    btn.addEventListener('click', function () {
      const isOpen = fullText.classList.toggle('expanded');
      btn.classList.toggle('expanded', isOpen);
      btn.querySelector('span').textContent = isOpen ? 'View Less' : 'View More';
    });
  });

  /* ---------- AI Chat widget ---------- */
  // Paste your deployed Cloudflare Worker URL here once it's live
  // (see /home/claude/ai-chat-worker/worker.js deployment notes).
  const AI_CHAT_CONFIG = {
    WORKER_URL: 'https://mathura-ai-chat.mathuraoverseas.workers.dev/'
  };

  const aiChatBubble = document.getElementById('aiChatBubble');
  if (aiChatBubble) {
    const aiChatPanel = document.getElementById('aiChatPanel');
    const aiChatClose = document.getElementById('aiChatClose');
    const aiChatMessages = document.getElementById('aiChatMessages');
    const aiChatForm = document.getElementById('aiChatForm');
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatSend = document.getElementById('aiChatSend');
    const aiChatSuggestions = document.getElementById('aiChatSuggestions');
    const history = [];

    function toggleChat() {
      aiChatPanel.classList.toggle('open');
      const isOpen = aiChatPanel.classList.contains('open');
      aiChatBubble.classList.toggle('hidden', isOpen);
      if (isOpen) {
        aiChatInput.focus();
        // don't let the two overlays show at once
        const applyPopupEl = document.getElementById('applyPopup');
        if (applyPopupEl) applyPopupEl.classList.remove('show');
      }
    }
    aiChatBubble.addEventListener('click', toggleChat);
    aiChatClose.addEventListener('click', toggleChat);

    function addMessage(text, sender) {
      const div = document.createElement('div');
      div.className = 'ai-msg ai-msg-' + sender;
      div.textContent = text;
      aiChatMessages.appendChild(div);
      aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
      return div;
    }

    function showTyping() {
      const div = document.createElement('div');
      div.className = 'ai-typing';
      div.id = 'aiTypingIndicator';
      div.innerHTML = '<span></span><span></span><span></span>';
      aiChatMessages.appendChild(div);
      aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }
    function hideTyping() {
      const el = document.getElementById('aiTypingIndicator');
      if (el) el.remove();
    }

    async function sendMessage(text) {
      if (!text.trim()) return;
      if (aiChatSuggestions) aiChatSuggestions.style.display = 'none';

      addMessage(text, 'user');
      history.push({ role: 'user', text: text });
      aiChatInput.value = '';
      aiChatSend.disabled = true;
      showTyping();

      const noEndpointConfigured = AI_CHAT_CONFIG.WORKER_URL.indexOf('PASTE_YOUR') === 0;
      if (noEndpointConfigured) {
        hideTyping();
        addMessage('The AI assistant isn\'t connected yet. In the meantime, please use the Apply Now form or WhatsApp!', 'error');
        aiChatSend.disabled = false;
        return;
      }

      try {
        const res = await fetch(AI_CHAT_CONFIG.WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: history.slice(0, -1) })
        });
        const data = await res.json();
        hideTyping();
        if (!res.ok) {
          addMessage(data.error || 'Something went wrong. Please try again.', 'error');
        } else {
          addMessage(data.reply, 'bot');
          history.push({ role: 'assistant', text: data.reply });
        }
      } catch (err) {
        hideTyping();
        addMessage('Could not reach the assistant — check your connection and try again, or message us on WhatsApp.', 'error');
      }
      aiChatSend.disabled = false;
    }

    aiChatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sendMessage(aiChatInput.value);
    });

    if (aiChatSuggestions) {
      aiChatSuggestions.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          sendMessage(btn.getAttribute('data-q'));
        });
      });
    }
  }


  /* ---------- Budget/Country matcher tool (neet-2026-updates.html) ---------- */
  const matcherBtn = document.getElementById('matcherBtn');
  if (matcherBtn) {
    // Annual budget tier in INR lakhs per university, plus country and page link.
    const UNIVERSITIES = [
      { name: 'Fergana Medical Institute', country: 'Uzbekistan', budget: 3.2, page: 'mbbs-in-uzbekistan-fergana.html', flag: '🇺🇿' },
      { name: 'Samarkand State Medical University', country: 'Uzbekistan', budget: 3.4, page: 'mbbs-in-uzbekistan-samarkand.html', flag: '🇺🇿' },
      { name: 'Tashkent Medical Academy', country: 'Uzbekistan', budget: 3.6, page: 'mbbs-in-uzbekistan-tashkent.html', flag: '🇺🇿' },
      { name: 'MBBS in Vietnam', country: 'Vietnam', budget: 3.5, page: 'mbbs-in-vietnam.html', flag: '🇻🇳' },
      { name: 'Lyceum Northwestern University', country: 'Philippines', budget: 2.8, page: 'mbbs-in-philippines-lyceum.html', flag: '🇵🇭' },
      { name: 'AMA School of Medicine, Manila', country: 'Philippines', budget: 3.0, page: 'mbbs-in-philippines-ama-school-of-medicine.html', flag: '🇵🇭' },
      { name: 'Brokenshire College of Medicine', country: 'Philippines', budget: 3.7, page: 'mbbs-in-philippines-brokenshire.html', flag: '🇵🇭' },
      { name: 'Southwestern University PHINMA', country: 'Philippines', budget: 3.9, page: 'mbbs-in-philippines-southwestern.html', flag: '🇵🇭' },
      { name: 'UV Gullas College of Medicine', country: 'Philippines', budget: 4.1, page: 'mbbs-in-philippines-uv-gullas.html', flag: '🇵🇭' },
      { name: 'Davao Medical School Foundation', country: 'Philippines', budget: 4.4, page: 'mbbs-in-philippines-davao.html', flag: '🇵🇭' },
      { name: 'Universidade Católica Timorense', country: 'Timor-Leste', budget: 5.4, page: 'mbbs-in-timor-uct-timor.html', flag: '🇹🇱' }
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
      resultsEl.classList.add('show');
      const closeBtnHtml = '<button type="button" class="mrp-close" id="mrpCloseBtn" aria-label="Close results">&times;</button>';

      if (matches.length === 0) {
        resultsEl.innerHTML = closeBtnHtml + '<div class="matcher-card text-center"><p class="text-muted mb-0">No exact match at that budget — but our counsellors often find flexible options not listed here. <a href="apply.html" target="_blank" rel="noopener">Talk to us directly</a>.</p></div>';
        document.getElementById('mrpCloseBtn').addEventListener('click', function () { resultsEl.classList.remove('show'); });
        return;
      }

      let html = closeBtnHtml + '<div class="mrp-head"><i class="bi bi-check-circle-fill text-marigold"></i> ' + matches.length + ' matching ' + (matches.length === 1 ? 'university' : 'universities') + '</div>';
      html += '<div class="row g-3">';
      matches.forEach(function (u) {
        html += '<div class="col-lg-3 col-md-6"><div class="matcher-card h-100" style="padding:20px;">' +
          '<h6 class="text-jade mb-1">' + u.flag + ' ' + u.name + '</h6>' +
          '<p class="text-muted small mb-2">' + u.country + ' · from ~₹' + u.budget + 'L/year</p>' +
          '<a href="' + u.page + '" class="btn btn-ghost-jade btn-sm w-100">View Details &amp; Fees</a>' +
          '</div></div>';
      });
      html += '</div>';
      resultsEl.innerHTML = html;
      document.getElementById('mrpCloseBtn').addEventListener('click', function () { resultsEl.classList.remove('show'); });
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

  /* ---------- Delayed application popup — fires 3 times per page load (15s/60s/120s) ---------- */
  const popup = document.getElementById('applyPopup');
  if (popup) {
    const popupTimes = [20000, 60000]; // 20s, 60s
    const popupTimers = [];

    function showPopup() {
      const chatPanelEl = document.getElementById('aiChatPanel');
      if (chatPanelEl && chatPanelEl.classList.contains('open')) return; // don't interrupt an active chat
      popup.classList.add('show');
    }

    function closePopup() {
      popup.classList.remove('show');
    }

    popupTimes.forEach((time) => {
      popupTimers.push(
        setTimeout(showPopup, time)
      );
    });

    const closeBtn = document.getElementById('popupClose');
    const dismissBtn = document.getElementById('popupDismiss');

    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (dismissBtn) dismissBtn.addEventListener('click', closePopup);

    popup.addEventListener('click', function (e) {
      if (e.target === popup) closePopup();
    });
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