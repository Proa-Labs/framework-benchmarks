export function repositoryRoot(from?: string | URL): string;
export function findRepositoryRoot(from?: string | URL): string | null;
export const previousDirectories: Record<string, string>;
export function currentPath(path: string): string;
export function evidencePath(root: string, path: string): string;
