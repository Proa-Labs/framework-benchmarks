import type { Answer, Result, Sources } from "./app.contract.d.ts";
import fixture from "./cards.json";
export const appId = "run.frameworks.ssrbench";
export const grants = "";
const cards: Result<"loadCards"> = fixture;
const sources: Sources = { loadCards: async () => cards };
export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
