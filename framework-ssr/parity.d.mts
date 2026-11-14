export function validateSemanticHtml(
  body: string,
  request: string,
  workload?: "cards" | "products" | "table" | "catalog",
): string;
export function sha256(body: string | Uint8Array): string;
export function createValidator(options: {
  expectedSha256: string;
}): (body: string | Uint8Array) => void;
