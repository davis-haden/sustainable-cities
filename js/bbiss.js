(function () {
  "use strict";

  // Vision / Mission cards: hover flips them (CSS); click, tap or keyboard pins the flip
  document.querySelectorAll(".bb-feature__hit").forEach(function (button) {
    button.addEventListener("click", function () {
      const card = button.closest(".bb-feature");
      const flipped = !card.classList.contains("is-flipped");
      card.classList.toggle("is-flipped", flipped);
      button.setAttribute("aria-pressed", flipped);
    });
  });

  // Focus area rows: each row opens and closes on its own
  document.querySelectorAll(".bb-row button").forEach(function (button) {
    button.addEventListener("click", function () {
      const row = button.closest(".bb-row");
      const open = !row.classList.contains("is-open");
      row.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", open);
    });
  });

  // Research tiles: one opens at a time into a story card
  function setTile(tile, open) {
    const toggle = tile.querySelector(".bb-tile__toggle");
    const name = tile.querySelector("h3").textContent;
    tile.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", name + (open ? ": hide summary" : ": show summary"));
  }

  document.querySelectorAll(".bb-tile__toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      const tile = toggle.closest(".bb-tile");
      const open = !tile.classList.contains("is-open");

      document.querySelectorAll(".bb-tile.is-open").forEach(function (other) {
        setTile(other, false);
      });

      if (!open) return;
      setTile(tile, true);

      // Once the card has started to widen, scroll the band so it is in view
      window.setTimeout(function () {
        tile.parentElement.scrollTo({ left: tile.offsetLeft - 16, behavior: "smooth" });
      }, 320);
    });
  });

  document.addEventListener("keydown", function (event) {
    const open = document.querySelector(".bb-tile.is-open");
    if (event.key !== "Escape" || !open) return;
    setTile(open, false);
    open.querySelector(".bb-tile__toggle").focus();
  });
})();
