export const refreshFolders: Record<string, string>;
export interface RefreshManifest {
  schemaVersion: number;
  reviewOnly: boolean;
  beforeRevision: string;
  afterRevision: string;
  artifactSha256: Record<string, string>;
  baseline: Record<string, { captureId: string; sha256: string }>;
  runs: Record<string, { baseline: string; merged: string }>;
}
export function loadProaRefresh(
  root: string,
  input: unknown,
  buffers: Record<string, Uint8Array>,
): {
  manifest: RefreshManifest;
  captures: Record<string, { baseline: unknown; merged: unknown }>;
};
export function validateProaPair(
  suite: string,
  pair: unknown,
  base: unknown,
  manifest: unknown,
): void;
