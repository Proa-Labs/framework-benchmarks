// Lossless compressed evidence. Readers also support earlier plain artifacts.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
export function readRaw(path) {
  const bytes = readFileSync(path);
  return path.endsWith(".gz") ? gunzipSync(bytes) : bytes;
}
export function readRawJson(path) {
  return JSON.parse(readRaw(path).toString("utf8"));
}
export function writeRawJson(path, value) {
  writeFileSync(path, gzipSync(JSON.stringify(value), { level: 9 }), {
    flag: "wx",
  });
}
