(function () {
  "use strict";

  const DESKTOP_QUERY = window.matchMedia("(min-width: 768px)");

  const body = document.body;
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const overlay = document.querySelector(".nav-overlay");

  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Scroll reveal: elements with data-reveal fade in as they enter the viewport.
  // Only elements below the fold are hidden (is-pending), so whatever is on screen
  // when a page opens is there from the first frame and never flashes in.
  // Siblings that appear together are staggered via the --i custom property.
  const revealItems = document.querySelectorAll("[data-reveal]");

  if (!REDUCED_MOTION.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .forEach(function (entry, index) {
            entry.target.style.setProperty("--i", index);
            entry.target.classList.remove("is-pending");
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );

    revealItems.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add("is-pending");
      observer.observe(el);
    });
  }

  if (!toggle || !nav) return;

  // Index nav items so the mobile menu can stagger them in
  nav.querySelectorAll(".nav-list li").forEach(function (item, index) {
    item.style.setProperty("--i", index);
  });

  function openNav() {
    body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    const firstLink = nav.querySelector("a");
    if (firstLink) firstLink.focus();
  }

  function closeNav(returnFocus) {
    body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    if (returnFocus) toggle.focus();
  }

  function isOpen() {
    return body.classList.contains("nav-open");
  }

  toggle.addEventListener("click", function () {
    isOpen() ? closeNav(false) : openNav();
  });

  if (overlay) {
    overlay.addEventListener("click", function () {
      closeNav(true);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen()) closeNav(true);
  });

  // Reset the mobile menu when the viewport grows to desktop width
  DESKTOP_QUERY.addEventListener("change", function (event) {
    if (event.matches) closeNav(false);
  });

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
