export function readRaw(path: string): Buffer;
export function readRawJson<T = unknown>(path: string): T;
export function writeRawJson(path: string, value: unknown): void;
