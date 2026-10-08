(() => {
  "use strict";

  const init = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const header = document.getElementById("site-header");
    const hero = document.getElementById("home");
    const navbarCollapse = document.getElementById("primary-menu");

    /* ==============================================================
       Lenis initialization
       ============================================================ */
    window.lenis = null;

    if (!reduceMotion.matches && typeof window.Lenis !== "undefined") {
      window.lenis = new window.Lenis({ lerp: 0.1 });

      const raf = (time) => {
        if (!window.lenis) return;
        window.lenis.raf(time);
        window.requestAnimationFrame(raf);
      };

      window.requestAnimationFrame(raf);
    }

    /* ==============================================================
       Sticky nav background
       ============================================================ */
    const updateHeader = () => {
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 120;
      const headerOffset = header ? header.offsetHeight : 0;
      header?.classList.toggle("is-scrolled", window.scrollY >= heroBottom - headerOffset);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader, { passive: true });

    if (navbarCollapse && header) {
      navbarCollapse.addEventListener("show.bs.collapse", () => header.classList.add("menu-open"));
      navbarCollapse.addEventListener("hidden.bs.collapse", () => header.classList.remove("menu-open"));
    }

    /* ==============================================================
       Smooth anchor scrolling + mobile close-on-link-click
       ============================================================ */
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        const offset = -((header?.offsetHeight || 0) + 10);

        if (window.lenis && !reduceMotion.matches) {
          window.lenis.scrollTo(target, { offset });
        } else {
          const top = target.getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({ top, behavior: reduceMotion.matches ? "auto" : "smooth" });
        }

        window.history.replaceState(null, "", link.getAttribute("href"));

        if (navbarCollapse?.classList.contains("show") && typeof window.bootstrap !== "undefined") {
          window.bootstrap.Collapse.getOrCreateInstance(navbarCollapse).hide();
        }
      });
    });

    /* ==============================================================
       IntersectionObserver reveal system
       ============================================================ */
    const revealItems = Array.from(document.querySelectorAll(".reveal"));
    const animatedItems = revealItems.slice(0, 20);

    revealItems.slice(20).forEach((item) => item.classList.add("is-visible"));

    if (reduceMotion.matches || typeof window.IntersectionObserver === "undefined") {
      animatedItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -45px" });

      animatedItems.forEach((item) => revealObserver.observe(item));
    }

    /* ==============================================================
       Swiper initialization: testimonials only
       ============================================================ */
    if (typeof window.Swiper !== "undefined") {
      new window.Swiper(".testimonials-swiper", {
        slidesPerView: 1,
        spaceBetween: 18,
        grabCursor: true,
        watchOverflow: true,
        pagination: {
          el: ".testimonials-swiper .swiper-pagination",
          clickable: true
        },
        navigation: {
          nextEl: ".review-next",
          prevEl: ".review-prev"
        },
        breakpoints: {
          768: { slidesPerView: 2, spaceBetween: 22 },
          1200: { slidesPerView: 3, spaceBetween: 24 }
        }
      });
    }

    /* ==============================================================
       Contact form visual-only handler
       ============================================================ */
    const estimateForm = document.getElementById("estimate-form");
    const successMessage = document.getElementById("form-success");

    estimateForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!estimateForm.checkValidity()) {
        estimateForm.classList.add("was-validated");
        estimateForm.querySelector(":invalid")?.focus();
        return;
      }

      estimateForm.classList.remove("was-validated");
      estimateForm.reset();
      successMessage?.classList.add("is-visible");
      successMessage?.focus();
    });

    estimateForm?.addEventListener("input", () => successMessage?.classList.remove("is-visible"));

    /* ==============================================================
       Current year
       ============================================================ */
    const year = document.getElementById("current-year");
    if (year) year.textContent = String(new Date().getFullYear());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

/* ================================================================
   Get Estimate / Service Booking Page
   Append this entire file to assets/js/script.js
   ================================================================ */

(() => {
  "use strict";

  const initQuoteRequestForm = () => {
    const form = document.getElementById("quote-request-form");
    if (!form) return;

    const preferredDate = document.getElementById("quote-date");
    const steps = Array.from(form.querySelectorAll("[data-form-step]"));
    const indicators = Array.from(document.querySelectorAll("[data-step-indicator]"));
    const progress = document.getElementById("quote-progress");
    const progressBar = document.getElementById("quote-progress-bar");
    const stepStatus = document.getElementById("quote-step-status");
    const formPanel = document.querySelector(".quote-form-panel");
    const siteHeader = document.getElementById("site-header");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stepNames = ["Contact Information", "Property Information", "Service Details", "Preferred Date & Time", "Final Details"];
    let currentStep = 0;

    if (preferredDate) {
      const today = new Date();
      const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      preferredDate.min = localToday;
    }

    const scrollToFormTop = () => {
      if (!formPanel) return;

      const offset = -((siteHeader?.offsetHeight || 0) + 18);

      if (window.lenis && !reduceMotion.matches) {
        window.lenis.scrollTo(formPanel, { offset });
        return;
      }

      const top = formPanel.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: reduceMotion.matches ? "auto" : "smooth" });
    };

    const showStep = (index, options = {}) => {
      const { focus = true, scroll = true } = options;
      currentStep = Math.max(0, Math.min(index, steps.length - 1));

      steps.forEach((step, stepIndex) => {
        const active = stepIndex === currentStep;
        step.hidden = !active;
        step.classList.toggle("is-active", active);
      });

      indicators.forEach((indicator, indicatorIndex) => {
        indicator.classList.toggle("is-active", indicatorIndex === currentStep);
        indicator.classList.toggle("is-complete", indicatorIndex < currentStep);

        if (indicatorIndex === currentStep) {
          indicator.setAttribute("aria-current", "step");
        } else {
          indicator.removeAttribute("aria-current");
        }
      });

      const progressValue = ((currentStep + 1) / steps.length) * 100;
      if (progressBar) progressBar.style.width = `${progressValue}%`;
      progress?.setAttribute("aria-valuenow", String(currentStep + 1));

      if (stepStatus) {
        stepStatus.textContent = `Step ${currentStep + 1} of ${steps.length} · ${stepNames[currentStep]}`;
      }

      if (scroll) scrollToFormTop();

      if (focus) {
        window.setTimeout(() => {
          steps[currentStep].querySelector("legend")?.focus({ preventScroll: true });
        }, reduceMotion.matches ? 0 : 280);
      }
    };

    const validateStep = (step) => {
      const controls = Array.from(step.querySelectorAll("input, select, textarea"));
      const invalidControl = controls.find((control) => !control.checkValidity());

      step.classList.add("was-validated");

      if (invalidControl) {
        invalidControl.focus();
        return false;
      }

      return true;
    };

    form.addEventListener("click", (event) => {
      const nextButton = event.target.closest("[data-step-next]");
      const previousButton = event.target.closest("[data-step-prev]");

      if (nextButton) {
        if (validateStep(steps[currentStep])) showStep(currentStep + 1);
        return;
      }

      if (previousButton) showStep(currentStep - 1);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (currentStep < steps.length - 1) {
        if (validateStep(steps[currentStep])) showStep(currentStep + 1);
        return;
      }

      if (!validateStep(steps[currentStep])) return;

      const invalidControl = Array.from(form.elements).find((control) => {
        return typeof control.checkValidity === "function" && !control.checkValidity();
      });

      if (invalidControl) {
        const invalidStep = invalidControl.closest("[data-form-step]");
        const invalidStepIndex = steps.indexOf(invalidStep);

        if (invalidStepIndex >= 0) {
          invalidStep.classList.add("was-validated");
          showStep(invalidStepIndex);
          window.setTimeout(() => invalidControl.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 300);
        }

        return;
      }

      // Demo only: a valid form intentionally performs no submission,
      // upload, reset, success message, or data storage.
    });

    showStep(0, { focus: false, scroll: false });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuoteRequestForm, { once: true });
  } else {
    initQuoteRequestForm();
  }
})();
