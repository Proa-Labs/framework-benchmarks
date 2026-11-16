export const fixtures: { id: string; label: string; cardinality: number }[];
export interface FixtureDefinition {
  expectedDomSha256: string;
  controls: { titleIndex: number; requestIndex: number; text: { record: number; slot: number } };
  source: { revision: string; route: string; renderer: string; htmlSha256: string };
}
export interface FixtureData {
  texts: string[];
}
export function loadFixture(id: string): { definition: FixtureDefinition; data: FixtureData };
export function renderReference(definition: object, data: object): string;
