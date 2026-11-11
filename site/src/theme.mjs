// Load synchronously before CSS so a saved theme applies before first paint.
(() => {
  const key = "frameworks-theme";
  const choices = ["system", "light", "dark"];
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const read = () => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  let preference = choices.includes(read()) ? read() : "system";
  const apply = () => {
    const theme =
      preference === "system"
        ? system.matches
          ? "dark"
          : "light"
        : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    for (const toggle of document.querySelectorAll("[data-theme-toggle]")) {
      toggle.setAttribute("aria-pressed", String(theme === "dark"));
      toggle.title = `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
    }
  };
  apply();
  system.addEventListener("change", () => {
    if (preference === "system") apply();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = choices.includes(event.newValue) ? event.newValue : "system";
    apply();
  });
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    for (const toggle of document.querySelectorAll("[data-theme-toggle]")) {
      toggle.addEventListener("click", () => {
        preference =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(key, preference);
        } catch {
          /* Theme still works without storage. */
        }
        apply();
      });
    }
  });
})();
