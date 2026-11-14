export interface Summary {
  count: number;
  min: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}
export function percentile(sortedValues: number[], percent: number): number;
export function summarize(values: number[]): Summary;
export function mean(values: number[]): number;
export function successfulCompletionThroughput(
  responses: { ok: boolean; completedAt: number }[],
  startedAt: number,
  endedAt: number,
): { completedResponses: number; responsesPerSecond: number };
