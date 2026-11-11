import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const system = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let preference = null;
      try {
        preference = localStorage.getItem("frameworks-theme");
      } catch {
        /* System theme works without storage. */
      }
      const next =
        preference === "dark" || (preference !== "light" && system.matches);
      document.documentElement.dataset.theme = next ? "dark" : "light";
      setDark(next);
    };
    sync();
    system.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => {
      system.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const toggle = () => {
    const next = !dark;
    try {
      localStorage.setItem("frameworks-theme", next ? "dark" : "light");
    } catch {
      /* Keep the current-tab theme when storage is unavailable. */
    }
    document.documentElement.dataset.theme = next ? "dark" : "light";
    setDark(next);
  };
  return (
    <button
      type="button"
      data-component="theme-toggle"
      data-theme-toggle=""
      aria-label="Toggle theme"
      aria-pressed={dark}
      title={`Switch to ${dark ? "light" : "dark"} theme`}
      className="theme-toggle-button"
      onClick={toggle}
    >
      <svg
        className="theme-toggle-icon theme-toggle-moon"
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.99 12.79A9 9 0 1 1 11.21 3.01 7 7 0 0 0 20.99 12.79Z" />
      </svg>
      <svg
        className="theme-toggle-icon theme-toggle-sun"
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    </button>
  );
}
