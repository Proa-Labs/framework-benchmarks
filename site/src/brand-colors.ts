import { required } from "../required.ts";

// The source hue stays in the catalog. Text and small marks use the nearest
// readable shade against each theme's hover surface (WCAG normal text: 4.5:1).
const channels = (hex: string) =>
  required(hex.slice(1).match(/../g)).map((part) => Number.parseInt(part, 16));
const luminance = (rgb: number[]) =>
  rgb.reduce((sum, channel, index) => {
    const value = channel / 255;
    return (
      sum +
      (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
        [0.2126, 0.7152, 0.0722][index]
    );
  }, 0);
export function contrastRatio(first: string, second: string) {
  const a = luminance(channels(first));
  const b = luminance(channels(second));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function readableBrand(color: string, background: string) {
  if (!/^#[\da-f]{6}$/i.test(color))
    throw new Error(`Invalid brand color: ${color}`);
  const rgb = channels(color);
  const destination = luminance(channels(background)) > 0.5 ? 0 : 255;
  for (let step = 0; step <= 100; step++) {
    const shade = `#${rgb
      .map((value) =>
        Math.round(value + ((destination - value) * step) / 100)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
    if (contrastRatio(shade, background) >= 4.5) return shade;
  }
  throw new Error(`No readable shade for ${color}`);
}
export function brandStyle(color = "var(--fw-fg)") {
  if (color === "var(--fw-fg)") return "--brand:var(--fw-fg)";
  return `--brand:${color};--brand-hover:light-dark(${readableBrand(color, "#eaf0f7")},${readableBrand(color, "#0e1116")})`;
}
