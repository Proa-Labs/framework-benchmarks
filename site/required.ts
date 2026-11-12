/** Fail clearly when a validated capture or rendered UI contract is incomplete. */
export function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined)
    throw new Error("Required value is missing");
  return value;
}
