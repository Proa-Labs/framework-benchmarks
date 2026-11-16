export interface ProcessMemory {
  metric: "native-process-peak-rss-v2";
  peak_rss_bytes: number;
  method: "os-process-resource-usage";
  scope: string;
}
export interface MemorySummary extends ProcessMemory {
  process_peak_rss_bytes: number[];
}
export const memoryMetric: ProcessMemory["metric"];
export const memoryScope: string;
export function summarizeMemory(
  cells: { memory?: ProcessMemory }[],
): MemorySummary | undefined;
export function validateProcessMemory(
  memory: unknown,
): asserts memory is ProcessMemory;
export function runWithMemory(
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: Record<string, string | undefined>;
    maxBuffer?: number;
  },
): { stdout: string; memory: ProcessMemory };
