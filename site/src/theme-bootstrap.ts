// Runs in the document head, before CSS and React hydration, to avoid a theme flash.
try {
  const preference = localStorage.getItem("frameworks-theme");
  document.documentElement.dataset.theme =
    preference === "dark" ||
    (preference !== "light" &&
      matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
} catch {
  document.documentElement.dataset.theme = matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches
    ? "dark"
    : "light";
}
