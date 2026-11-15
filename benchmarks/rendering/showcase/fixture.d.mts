export const fixtures: {id: string; label: string; cardinality: number}[];
export function loadFixture(id: string): {definition: object; data: object};
export function renderReference(definition: object, data: object): string;
