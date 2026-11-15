// Reuse the canonical raw inputs. Formatting, escaping, loops and branches stay
// in each framework's timed production render; no rendered HTML is shared.
import {
  buildProducts,
  buildTableRows,
  STAR_PATH,
} from "../rendering/external/shared/suite_data.mjs";
import { cards } from "./fixture.mjs";
export const features = [
  "Sub-millisecond response times",
  "Zero-copy rendering pipeline",
  "SIMD-accelerated escaping",
  "Pre-allocated buffers",
  "Minimal heap allocations",
];
export const sections = [
  "Performance Metrics",
  "Rendering Speed",
  "Memory Efficiency",
  "Framework Comparison",
].map((title, index) => ({
  id: String(index + 1),
  title,
  cards: cards
    .slice(index * 8, index * 8 + 8)
    .map((card) => ({ ...card, features })),
}));
export const rows = buildTableRows();
export const products = buildProducts(96);
export const starPath = STAR_PATH;
export const starIndexes = [0, 1, 2, 3, 4];
export const headers = [
  "ID",
  "Name",
  "Email",
  "Status",
  "Amount",
  "Tax",
  "Total",
  "Created",
  "Updated",
  "Score",
  "Country",
  "Tags",
];
export const fixture = {
  sections,
  rows,
  products,
  starPath,
  starIndexes,
  headers,
};
export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export const date = (unix: number) =>
  new Date(unix * 1000).toISOString().slice(0, 10);
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});
export const timestamp = (unix: number) =>
  `${date(unix)} ${timeFormatter.format(new Date(unix * 1000))}`;
export const score = (bps: number) =>
  `${(Math.floor(bps / 10) / 10).toFixed(1)}%`;
export const titles = {
  cards: "SSR Framework Benchmark",
  products: "All products",
  table: "Customer Accounts",
};
export type Workload = keyof typeof titles;
