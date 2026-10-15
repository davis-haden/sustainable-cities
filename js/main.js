(function () {
  "use strict";

  const DESKTOP_QUERY = window.matchMedia("(min-width: 768px)");

  const body = document.body;
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const overlay = document.querySelector(".nav-overlay");

  if (!toggle || !nav) return;

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
