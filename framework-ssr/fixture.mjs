export const SCENARIO_ID = "framework_catalog_v1";
export const cards = Array.from({ length: 32 }, (_, index) => ({
  id: String(index + 1),
  title: `${["Canvas <carryall>", "Lamp & shade", 'Desk "compact"', "Reader's stand"][index % 4]} ${index + 1}`,
  category: ["Home", "Travel", "Office", "Books"][index % 4],
  description: `Item ${index + 1}: <b>plain text</b>, quotes "double", 'single' & an ampersand.`,
  priceCents: 1299 + index * 137,
  inStock: index % 3 !== 0,
  tags: [
    `tag-${index % 5}`,
    "new & useful",
    index % 2 ? "small < large" : 'ready "today"',
  ],
}));
export const price = (card) => `$${(card.priceCents / 100).toFixed(2)}`;
