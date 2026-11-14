import type { Answer, Result, Sources } from "./app.contract.d.ts";
import fixture from "./fixture.json";
export const appId = "run.frameworks.ssrbench";
export const grants = "";
const sections: Result<"loadSections"> = fixture.sections.map(
  ({ id, title, cards }) => ({
    id,
    title,
    cards: cards.map(({ id, title, description, features }) => ({
      id,
      title,
      description,
      features,
    })),
  }),
);
const products: Result<"loadProducts"> = fixture.products;
const rows: Result<"loadRows"> = fixture.rows;
const sources: Sources = {
  loadSections: async ([route]) => (route === "cards" ? sections : []),
  loadProducts: async ([route]) => (route === "products" ? products : []),
  loadRows: async ([route]) => (route === "table" ? rows : []),
};
export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
