import { styleObject } from "./style.mjs";
export function hydrateRecords(records) {
  const prepared = records.map((r) => ({
    texts: [...r.texts],
    variants: [...(r.variants ?? [])],
    groups: [],
    styles: r.styles ?? {},
  }));
  for (const [i, r] of records.entries())
    prepared[i].groups = r.groups.map((ids) => ids.map((id) => prepared[id]));
  return prepared;
}
export function prepareStyles(definition, data) {
  const walk = (node, record) => {
    if (node.kind === "variant")
      walk(node.cases[record.variants[node.selector]], record);
    else if (node.kind === "repeat")
      for (const child of record.groups[node.group])
        walk(definition.templates[node.template], child);
    else {
      for (const [name, value] of node.attrs ?? [])
        if (name === "style" && "slot" in value)
          record.styles[value.slot] = styleObject(record.texts[value.slot]);
      for (const child of node.children ?? []) walk(child, record);
    }
  };
  walk(definition.templates[definition.entry], data);
}
