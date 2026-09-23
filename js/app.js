/**
 * Kalarikkal Sri Vishnumaya Temple Web Application
 * Core Script: Bilingual Translation Engine, Realtime Status Tracker,
 * Interactive Tabs, and Map Navigation.
 */

document.addEventListener("DOMContentLoaded", () => {
  // State
  let currentLang = localStorage.getItem("temple_lang") || "en";

  // Elements
  const langToggleBtn    = document.getElementById("langToggleBtn");
  const copyAddressBtn   = document.getElementById("copyAddressBtn");
  const copyToast        = document.getElementById("copyToast");
  const livePulseDot     = document.getElementById("livePulseDot");
  const liveStatusText   = document.getElementById("liveStatusText");
  const liveHoursSub     = document.querySelector(".live-hours-sub");
  const liveDarshanCard  = document.getElementById("liveDarshanCard");

  // ── Temple Schedule Constants (must be defined before first use) ────────────
  // Fri(5), Sat(6), Sun(0), Mon(1), Tue(2) → 9:00 AM – 1:00 PM  (remedies)
  // Wed(3), Thu(4)                          → 9:00 AM – 10:00 AM (poojas only)
  const REMEDY_DAYS  = new Set([0, 1, 2, 5, 6]);
  const POOJA_DAYS   = new Set([3, 4]);
  const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAY_NAMES_TA = ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"];

  function isOpenAt(day, timeDec) {
    if (REMEDY_DAYS.has(day)) return timeDec >= 9.0 && timeDec < 13.0;
    if (POOJA_DAYS.has(day))  return timeDec >= 9.0 && timeDec < 10.0;
    return false;
  }

  function hoursForDay(day) {
    if (REMEDY_DAYS.has(day)) return "9:00 AM – 1:00 PM";
    if (POOJA_DAYS.has(day))  return "9:00 AM – 10:00 AM";
    return null;
  }

  function hoursForDayTa(day) {
    if (REMEDY_DAYS.has(day)) return "காலை 9:00 – மதியம் 1:00";
    if (POOJA_DAYS.has(day))  return "காலை 9:00 – 10:00";
    return null;
  }

  // Initialize Language
  applyLanguage(currentLang);

  // Initialize Darshan Status
  updateDarshanStatus();
  setInterval(updateDarshanStatus, 60000); // Check every minute

  // Language Toggle Events
  const footerLangToggleBtn = document.getElementById("footerLangToggleBtn");

  function toggleLanguage() {
    currentLang = currentLang === "en" ? "ta" : "en";
    localStorage.setItem("temple_lang", currentLang);
    applyLanguage(currentLang);
  }

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", toggleLanguage);
  }
  if (footerLangToggleBtn) {
    footerLangToggleBtn.addEventListener("click", toggleLanguage);
  }

  // Function to Apply Language
  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.body.setAttribute("data-lang", lang);

    const langData = translations[lang] || translations.en;

    // Update all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (langData[key]) {
        el.innerHTML = langData[key];
      }
    });

    // Update Title tag
    document.title =
      lang === "ta"
        ? "களரிக்கல் ஸ்ரீ விஷ்ணுமாயா திருக்கோயில் | அதிகாரப்பூர்வ இணையதளம்"
        : "Kalarikkal Sri Vishnumaya Temple | Official Website";

    // Update Language Toggle Button Appearance (No flags)
    const langBtnText = document.getElementById("langBtnText");
    const footerLangBtnText = document.getElementById("footerLangBtnText");
    const targetText = lang === "en" ? "தமிழ்" : "English";
    if (langBtnText) {
      langBtnText.textContent = targetText;
    }
    if (footerLangBtnText) {
      footerLangBtnText.textContent = targetText;
    }

    // Refresh Darshan status label in new language
    updateDarshanStatus();
  }

  // ── Real-time Darshan & Consultation Status Engine ──────────────────────────
  function updateDarshanStatus() {
    if (!livePulseDot || !liveStatusText) return;

    const now         = new Date();
    const day         = now.getDay();                        // 0=Sun … 6=Sat
    const timeDec     = now.getHours() + now.getMinutes() / 60;
    const isTa        = currentLang === "ta";
    const dayNames    = isTa ? DAY_NAMES_TA : DAY_NAMES_EN;
    const langData    = translations[currentLang] || translations.en;
    const open        = isOpenAt(day, timeDec);

    // ── 1. Pulse dot & card state ────────────────────────────────────────────
    if (open) {
      livePulseDot.classList.remove("closed");
      if (liveDarshanCard) liveDarshanCard.setAttribute("data-status", "open");
    } else {
      livePulseDot.classList.add("closed");
      if (liveDarshanCard) liveDarshanCard.setAttribute("data-status", "closed");
    }

    // ── 2. Main status text ──────────────────────────────────────────────────
    liveStatusText.textContent = open ? langData.status_open : langData.status_closed;

    // ── 3. Contextual sub-text ───────────────────────────────────────────────
    if (liveHoursSub) {
      if (open) {
        // Show today's closing time
        const closeTime = REMEDY_DAYS.has(day) ? (isTa ? "மதியம் 1:00 மணி" : "1:00 PM") : (isTa ? "காலை 10:00 மணி" : "10:00 AM");
        liveHoursSub.textContent = isTa
          ? `இன்று திறந்திருக்கும் நேரம்: ${hoursForDayTa(day)} | ${closeTime} வரை திறந்திருக்கும்`
          : `Today (${dayNames[day]}): ${hoursForDay(day)} — Temple is open now`;
      } else {
        // Find next opening day
        let nextDay = day;
        let daysAhead = 0;
        for (let i = 1; i <= 7; i++) {
          const d = (day + i) % 7;
          if (REMEDY_DAYS.has(d) || POOJA_DAYS.has(d)) {
            nextDay = d;
            daysAhead = i;
            break;
          }
        }
        const nextHours = isTa ? hoursForDayTa(nextDay) : hoursForDay(nextDay);
        const nextName  = dayNames[nextDay];

        // If before opening today
        if ((REMEDY_DAYS.has(day) || POOJA_DAYS.has(day)) && timeDec < 9.0) {
          liveHoursSub.textContent = isTa
            ? `இன்று ${hoursForDayTa(day)} திறக்கும்`
            : `Opens today at 9:00 AM (${hoursForDay(day)})`;
        } else if (daysAhead === 1) {
          liveHoursSub.textContent = isTa
            ? `நாளை (${nextName}) ${nextHours} திறக்கும்`
            : `Opens tomorrow (${nextName}) at 9:00 AM · ${nextHours}`;
        } else {
          liveHoursSub.textContent = isTa
            ? `அடுத்த திறப்பு: ${nextName} ${nextHours}`
            : `Next opening: ${nextName} · ${nextHours}`;
        }
      }
    }
  }

  // Interactive Tabs: Pooja & Services Sections
  const poojaTabBtns = document.querySelectorAll(".pooja-tab-btn");
  const poojaPanes = document.querySelectorAll(".pooja-pane");

  poojaTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");

      poojaTabBtns.forEach((b) => b.classList.remove("active"));
      poojaPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Interactive Tabs: Transit / Ways to Reach
  const transitTabBtns = document.querySelectorAll(".transit-tab-btn");
  const transitPanes = document.querySelectorAll(".transit-pane");

  // Route image modals
  const byBusModal  = document.getElementById("byBusModal");
  const byTrainModal = document.getElementById("byTrainModal");
  const closeByBusModal  = document.getElementById("closeByBusModal");
  const closeByTrainModal = document.getElementById("closeByTrainModal");
  let routeModalTimer = null;
  let reachSectionTriggered = false; // show byBusModal only once on first scroll-in

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function clearRouteTimer() {
    if (routeModalTimer) {
      clearTimeout(routeModalTimer);
      routeModalTimer = null;
    }
  }

  function closeAllRouteModals() {
    closeModal(byBusModal);
    closeModal(byTrainModal);
  }

  // Close button handlers
  if (closeByBusModal)  closeByBusModal.addEventListener("click",  () => closeModal(byBusModal));
  if (closeByTrainModal) closeByTrainModal.addEventListener("click", () => closeModal(byTrainModal));

  // Backdrop click to close
  [byBusModal, byTrainModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Escape key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllRouteModals();
  });

  // Tab click handler
  transitTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-transit");

      transitTabBtns.forEach((b) => b.classList.remove("active"));
      transitPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");

      // Cancel any pending timer and close open modals
      clearRouteTimer();
      closeAllRouteModals();

      // Show the appropriate popup after 2 seconds
      if (targetId === "byBusTab") {
        routeModalTimer = setTimeout(() => openModal(byBusModal), 2000);
      } else if (targetId === "byTrainTab") {
        routeModalTimer = setTimeout(() => openModal(byTrainModal), 2000);
      }
      // By Road tab: no popup image available
    });
  });

  // Auto-trigger byBusModal the FIRST TIME the reach section scrolls into view
  // (By Bus is the default active tab)
  const reachSection = document.getElementById("reach");
  if (reachSection && byBusModal) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !reachSectionTriggered) {
          reachSectionTriggered = true;
          observer.unobserve(reachSection); // fire only once
          // Check that By Bus tab is still the active one
          const activeTab = document.querySelector(".transit-tab-btn.active");
          const activeTabId = activeTab ? activeTab.getAttribute("data-transit") : "byBusTab";
          if (activeTabId === "byBusTab") {
            clearRouteTimer();
            routeModalTimer = setTimeout(() => openModal(byBusModal), 2000);
          }
        }
      });
    }, { threshold: 0.3 }); // trigger when 30% of section is visible
    observer.observe(reachSection);
  }

  // Copy Address to Clipboard
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener("click", () => {
      const addressText = document.getElementById("templeAddressDisplay")?.textContent || 
        "Pallampetty House, Thrangali Mannanur Po, Kavalappara Via Shornur, Palakkad, Kerala 679523";

      navigator.clipboard.writeText(addressText.trim()).then(() => {
        showToast();
      }).catch(() => {
        // Fallback
        const dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = addressText.trim();
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        showToast();
      });
    });
  }

  function showToast() {
    if (!copyToast) return;
    copyToast.classList.add("show");
    setTimeout(() => {
      copyToast.classList.remove("show");
    }, 3000);
  }

  // Scroll To Top
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
