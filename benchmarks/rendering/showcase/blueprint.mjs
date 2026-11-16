// Compile fixture DOM to native-template instructions and prepared records.
// This compiler runs before builds and timing; renderers never interpret a DOM.
import assert from "node:assert/strict";
import { parse } from "parse5";

const omitted = new Set(["script"]);
export function readDocument(html, { addRequest = false } = {}) {
  const document = parse(html);
  const countIslands = (node) =>
    Number(node.tagName === "rsjs-island") +
    (node.childNodes ?? []).reduce(
      (sum, child) => sum + countIslands(child),
      0,
    );
  const singleIslandRoot = countIslands(document) === 1;
  function read(node) {
    if (node.nodeName === "#comment" || node.nodeName === "#documentType")
      return null;
    if (node.nodeName === "#text") return { kind: "text", value: node.value };
    if (omitted.has(node.tagName)) return null;
    // Next's empty metadata Suspense boundary is transport, not a page element.
    // Require its exact marker pair; ordinary hidden business nodes remain.
    if (
      node.tagName === "div" &&
      node.attrs.length === 1 &&
      node.attrs[0].name === "hidden" &&
      node.attrs[0].value === "" &&
      node.childNodes.length === 2 &&
      node.childNodes[0].nodeName === "#comment" &&
      node.childNodes[0].data === "$" &&
      node.childNodes[1].nodeName === "#comment" &&
      node.childNodes[1].data === "/$"
    )
      return null;
    // React image preload links and framework activation transports aren't
    // business HTML. No browser runtime is measured in either SSR experiment.
    if (
      node.tagName === "link" &&
      node.attrs.some(
        (a) => a.name === "rel" && /preload|modulepreload/.test(a.value),
      )
    )
      return null;
    const children = (
      node.tagName === "template"
        ? node.content.childNodes
        : (node.childNodes ?? [])
    )
      .flatMap(read)
      .filter(Boolean);
    if (!node.tagName) return { kind: "fragment", children };
    if (node.tagName === "style")
      return {
        kind: "raw",
        value: `<style${node.attrs.map((a) => ` ${a.name}="${a.value.replaceAll('"', "&quot;")}"`).join("")}>${children.map((n) => n.value).join("")}</style>`,
      };
    const attrs = node.attrs
      .filter(
        ({ name }) => name !== "data-rsjs" && !name.startsWith("data-rsjs-"),
      )
      .map(({ name, value, prefix }) => [
        prefix ? `${prefix}:${name}` : name,
        value,
      ]);
    // A single activation root is transport. In a multi-island page only the
    // outer document wrapper is transport: nested wrappers affect CSS selectors
    // (notably Airbnb rail spacing) and must remain ordinary native elements.
    if (
      node.tagName === "rsjs-island" &&
      attrs.length === 0 &&
      (singleIslandRoot || node.parentNode?.tagName === "body")
    )
      return children;
    return { kind: "element", tag: node.tagName, attrs, children };
  }
  const tree = read(document);
  const body = tree.children
    .find((n) => n.tag === "html")
    ?.children.find((n) => n.tag === "body");
  assert.ok(body, "Fixture needs a complete HTML document");
  const target = body.children.find((n) => n.kind === "element");
  assert.ok(target, "Fixture needs a body element for the freshness control");
  if (
    addRequest &&
    !target.attrs.some(([name]) => name === "data-bench-request")
  )
    target.attrs.push(["data-bench-request", "benchmark-request"]);
  return tree;
}

// Values are deliberately excluded from shapes. Matching siblings share one
// compiled component/loop while their differing text and attrs become inputs.
const outerShape = (n) =>
  n.kind === "element"
    ? `${n.tag}[${n.attrs.map((a) => a[0]).join(",")}]`
    : n.kind;
function runs(children) {
  const result = [];
  for (const child of children) {
    const last = result.at(-1),
      key = outerShape(child);
    if (child.kind === "element" && last?.key === key) last.nodes.push(child);
    else result.push({ key, nodes: [child] });
  }
  return result;
}
const shapeCache = new WeakMap();
function shape(n) {
  if (!shapeCache.has(n))
    shapeCache.set(
      n,
      `${outerShape(n)}(${runs(n.children ?? [])
        .map((r) => r.key)
        .join("|")})`,
    );
  return shapeCache.get(n);
}
export function compileBlueprint(html, { id, label, source }) {
  const records = [],
    templates = [];
  let titleIndex, requestIndex, textControl;
  const ids = new WeakMap();
  const record = () => ({ texts: [], groups: [], variants: [] });
  const save = (r) => {
    const index = records.length;
    ids.set(r, index);
    records.push(r);
    return index;
  };
  const rootRecord = record(),
    root = save(rootRecord),
    initial = readDocument(html, { addRequest: true });
  // Conditional branches may need different field counts. Allocate the next
  // common index and pad the inactive branch's fields before rejoining it.
  function field(contexts, key, values, fallback) {
    const index = Math.max(...contexts.map((c) => c[key].length));
    for (const [i, c] of contexts.entries()) {
      while (c[key].length < index) c[key].push(fallback());
      c[key].push(values[i]);
    }
    return index;
  }
  function slot(values, contexts, { force = false, control } = {}) {
    if (!force && values.every((value) => value === values[0]))
      return { literal: values[0] };
    const index = field(contexts, "texts", values, () => "");
    if (control === "title") titleIndex = index;
    if (control === "request") requestIndex = index;
    return { slot: index };
  }
  function variant(nodes, contexts, parentTag) {
    const keys = [...new Set(nodes.map(shape))];
    if (keys.length === 1) return node(nodes, contexts, parentTag);
    const selector = field(
      contexts,
      "variants",
      nodes.map((n) => keys.indexOf(shape(n))),
      () => 0,
    );
    const cases = keys.map((key) => {
      const selected = nodes
        .map((n, i) => (shape(n) === key ? i : -1))
        .filter((i) => i >= 0);
      return node(
        selected.map((i) => nodes[i]),
        selected.map((i) => contexts[i]),
        parentTag,
      );
    });
    return { kind: "variant", selector, cases };
  }
  function node(nodes, contexts, parentTag) {
    const first = nodes[0];
    assert.ok(nodes.every((n) => shape(n) === shape(first)));
    if (first.kind === "text") {
      const value = slot(
        nodes.map((n) => n.value),
        contexts,
        {
          force: contexts[0] !== rootRecord || parentTag === "title",
          control:
            contexts[0] === rootRecord && parentTag === "title"
              ? "title"
              : undefined,
        },
      );
      if (!textControl && contexts[0] !== rootRecord && "slot" in value) {
        const at = nodes.findIndex((n) => n.value.trim());
        if (at >= 0)
          textControl = { record: ids.get(contexts[at]), slot: value.slot };
      }
      return { kind: "text", value };
    }
    if (first.kind === "raw") {
      assert.ok(
        nodes.every((n) => n.value === first.value),
        "A raw stylesheet cannot contain variable fixture data",
      );
      return first;
    }
    const childRuns = nodes.map((n) => runs(n.children)),
      children = [];
    for (let r = 0; r < childRuns[0].length; r++) {
      const selections = childRuns.map((rs) => rs[r].nodes);
      if (selections.some((ns) => ns.length > 1)) {
        const refs = [],
          childNodes = [],
          childRecords = [];
        for (const selection of selections) {
          const ids = [];
          for (const n of selection) {
            const child = record();
            ids.push(save(child));
            childRecords.push(child);
            childNodes.push(n);
          }
          refs.push(ids);
        }
        const group = field(contexts, "groups", refs, () => []),
          template = templates.length;
        templates.push(null);
        templates[template] = variant(childNodes, childRecords, first.tag);
        children.push({ kind: "repeat", group, template });
      } else
        children.push(
          variant(
            selections.map((ns) => ns[0]),
            contexts,
            first.tag,
          ),
        );
    }
    if (first.kind === "fragment") return { kind: "fragment", children };
    const attrs = first.attrs.map(([name], i) => [
      name,
      slot(
        nodes.map((n) => n.attrs[i][1]),
        contexts,
        {
          force:
            (contexts[0] === rootRecord && name === "data-bench-request") ||
            (contexts[0] !== rootRecord &&
              /^(?:src|href|alt|title|value|id|aria-label|aria-describedby|aria-labelledby|style)$/.test(
                name,
              )),
          control: name === "data-bench-request" ? "request" : undefined,
        },
      ),
    ]);
    return { kind: "element", tag: first.tag, attrs, children };
  }
  templates.push(null);
  templates[0] = node([initial], [rootRecord]);
  assert.equal(typeof titleIndex, "number");
  assert.equal(typeof requestIndex, "number");
  // Intern repeated native component definitions bottom-up. Keep only source
  // templates, never cached rendered HTML; prepared records stay distinct.
  const interned = [],
    byBody = new Map(),
    byId = new Map();
  function intern(id) {
    if (byId.has(id)) return byId.get(id);
    const rewrite = (n) =>
      n.kind === "repeat"
        ? { ...n, template: intern(n.template) }
        : n.kind === "variant"
          ? { ...n, cases: n.cases.map(rewrite) }
          : n.children
            ? { ...n, children: n.children.map(rewrite) }
            : n;
    const body = rewrite(templates[id]);
    const key = JSON.stringify(body);
    let index = byBody.get(key);
    if (index === undefined) {
      index = interned.length;
      interned.push(body);
      byBody.set(key, index);
    }
    byId.set(id, index);
    return index;
  }
  const entry = intern(0);
  return {
    definition: {
      schemaVersion: 1,
      id,
      label,
      source,
      root,
      entry,
      controls: { titleIndex, requestIndex, text: textControl },
      templates: interned,
    },
    records,
  };
}
