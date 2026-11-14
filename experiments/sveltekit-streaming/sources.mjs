import { sourceFiles as kitSources } from '../../benchmarks/rendering/external/sveltekit/benchmark.mjs';

// Every measured server implementation, shared fixture, and load/browser driver.
// Reporting code and retained artifacts do not participate in these timings.
export const sourceFiles = [...new Set([...kitSources,
  '.nvmrc', 'Cargo.lock', 'Cargo.toml', 'package.json', 'bun.lock', 'bunfig.toml',
  'tooling/load/driver.mjs', 'tooling/load/worker.mjs', 'benchmarks/http/scenario.mjs',
  'benchmarks/rendering/Cargo.toml', 'benchmarks/rendering/src/http_load.rs',
  'benchmarks/rendering/src/bin/proa_suspense_server.rs', 'benchmarks/rendering/src/topcoat_product_grid.rs',
  'benchmarks/rendering/external/shared/suite_data.mjs',
  'benchmarks/streaming/scenario.mjs', 'tooling/stats.mjs', 'benchmarks/streaming/validate.mjs',
  'experiments/sveltekit-streaming/refresh-proa.mjs', 'experiments/sveltekit-streaming/run.mjs', 'experiments/sveltekit-streaming/browser.mjs', 'experiments/sveltekit-streaming/sources.mjs',
])].sort();
