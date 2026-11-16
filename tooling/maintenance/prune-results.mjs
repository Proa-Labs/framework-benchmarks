#!/usr/bin/env bun
// Retain current measurements and the evidence needed to verify them. Git
// history preserves superseded captures; this never rewrites published history.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retainedId } from '../capture/captures.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const suites = ['rendering', 'framework-ssr', 'http', 'streaming', 'cold-start'];
const tracked = execFileSync('git', ['ls-files', '-z', '--', 'benchmarks/*/results/**', 'experiments/*/results/**'], {cwd: root, encoding: 'utf8'}).split('\0').filter(path => path && existsSync(join(root, path)));
const keep = new Set();
const preserve = path => { assert.ok(tracked.includes(path), `Missing tracked evidence: ${path}`); keep.add(path); };
function capture(directory, file) {
  const path = `${directory}/${file}`;
  preserve(path);
  const result = JSON.parse(readFileSync(join(root, path), 'utf8'));
  const id = retainedId(result);
  // The immutable selected snapshot and measured sources are current evidence.
  preserve(`${directory}/archive/${id}.json`);
  for (const candidate of tracked) if (candidate.startsWith(`${directory}/raw/${id}/`)) keep.add(candidate);
  for (const key of ['baseline_path', 'proa_path']) {
    const relative = result.refresh?.[key];
    if (relative) preserve(`${directory}/${relative}`);
  }
}
for (const suite of suites) capture(`benchmarks/${suite}/results`, 'latest.json');
capture('benchmarks/rendering/results', 'product-scaling.json');
capture('experiments/sveltekit-streaming/results', 'latest.json');
for (const path of tracked) {
  const parts = path.split('/');
  // Latest independent engineering experiments have distinct root filenames.
  if (parts.length === 4) keep.add(path);
  // All showcase raw files support its latest per-experiment results, including
  // source-only sidecars. There are no superseded showcase capture sets.
  if (path.startsWith('experiments/showcase/results/raw/')) keep.add(path);
}
const removed = tracked.filter(path => !keep.has(path));
if (process.argv.includes('--write')) {
  for (const path of removed) unlinkSync(join(root, path));
  console.log(`Removed ${removed.length} superseded result files; retained ${keep.size} current result/evidence files.`);
} else {
  for (const path of removed) console.log(path);
  console.log(`${removed.length} superseded result files; run bun tooling/maintenance/prune-results.mjs --write to remove them.`);
  if (removed.length && process.argv.includes('--check')) process.exitCode = 1;
}
