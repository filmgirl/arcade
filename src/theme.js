// Run before the stylesheet so a saved preference is applied before first paint.
(() => {
  const key = "github-arcade-theme";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const isTheme = (value) => value === "light" || value === "dark";
  const query = new URLSearchParams(window.location.search).get("scoutTheme");
  let preference = isTheme(query) ? query : null;
  let storageAvailable = true;
  let button;

  try {
    const saved = window.localStorage.getItem(key);
    if (preference === null && isTheme(saved)) preference = saved;
  } catch (error) {
    storageAvailable = false;
    console.warn("Cabinet theme storage is unavailable; using the system or preview theme.", error);
  }

  function applyTheme() {
    const theme = preference ?? (system.matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#292630" : "#ede9f0";
    if (button) {
      const description = "Changes the cabinet only, not the games."
        + (storageAvailable ? "" : " This preference cannot be saved between visits.");
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.setAttribute("aria-description", description);
      button.title = `Switch to ${theme === "dark" ? "light" : "dark"} mode. ${description}`;
    }
  }

  applyTheme();
  system.addEventListener("change", () => {
    if (preference === null) applyTheme();
  });

  document.addEventListener("DOMContentLoaded", () => {
    button = document.getElementById("theme-toggle");
    button.disabled = false;
    button.addEventListener("click", () => {
      preference = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(key, preference);
        storageAvailable = true;
      } catch (error) {
        storageAvailable = false;
        console.warn("Cabinet theme preference could not be saved; keeping it for this visit.", error);
      }
      // Keep an explicit preview URL consistent without navigating or reloading a game.
      const url = new URL(window.location.href);
      if (url.searchParams.has("scoutTheme")) {
        url.searchParams.set("scoutTheme", preference);
        window.history.replaceState(window.history.state, "", url);
      }
      applyTheme();
    });
    applyTheme();
  }, { once: true });
})();
