/* Keep the theme controls and Bootstrap color mode in sync. */
(function () {
  "use strict";

  const root = document.documentElement;
  const themeButtons = document.querySelectorAll("[data-theme-set]");

  function setTheme(theme) {
    root.dataset.theme = theme;
    root.setAttribute("data-bs-theme", theme === "dark" ? "dark" : "light");
    themeButtons.forEach((button) => {
      const active = button.dataset.themeSet === theme;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.themeSet;
      setTheme(theme);
      try {
        localStorage.setItem("vd-theme", theme);
      } catch (_error) {
        // Theme changes still apply when storage is unavailable.
      }
    });
  });

  setTheme(root.dataset.theme || "dark");
})();
