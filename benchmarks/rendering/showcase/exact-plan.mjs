// Closed, finite Contract shapes and native named-style bindings for Exact.
// This projection is explicitly adapted: it keeps every business value and
// collection but cannot preserve browser class strings, selectors or all tags.
import assert from "node:assert/strict";
export function exactPlan(original, prepared, styles) {
  assert.equal(
    styles.fixtureDomSha256,
    original.expectedDomSha256,
    "Refresh the Exact style projection after changing a fixture",
  );
  const definition = structuredClone(original),
    indices = new Map(prepared.map((r, i) => [r, i]));
  const specs = definition.templates.map((template) => {
    const spec = { texts: 0, variants: 0, styles: 0, groups: [], template };
    function visit(n) {
      if (n.kind === "element") {
        n.exactStyle = spec.styles++;
        n.styleChoices = [];
      }
      for (const value of [n.value, ...(n.attrs ?? []).map((a) => a[1])].filter(
        Boolean,
      ))
        if (typeof value === "object" && "slot" in value)
          spec.texts = Math.max(spec.texts, value.slot + 1);
      if (n.kind === "variant")
        spec.variants = Math.max(spec.variants, n.selector + 1);
      if (n.kind === "repeat") {
        n.exactGroup = spec.groups.length;
        spec.groups.push(n);
      }
      for (const child of n.children ?? n.cases ?? []) visit(child);
    }
    visit(template);
    return spec;
  });
  function bind(n, data, inBody = false) {
    if (n.kind === "repeat") {
      for (const child of data.groups[n.group])
        bind(definition.templates[n.template], child, inBody);
      return;
    }
    if (n.kind === "variant") {
      bind(n.cases[data.variants[n.selector]], data, inBody);
      return;
    }
    if (n.tag === "body") inBody = true;
    if (n.kind === "element" && inBody) {
      const choice = styles.recordStyles[indices.get(data)][n.exactStyle];
      assert.ok(Number.isInteger(choice));
      if (!n.styleChoices.includes(choice)) n.styleChoices.push(choice);
    }
    for (const child of n.children ?? []) bind(child, data, inBody);
  }
  bind(definition.templates[definition.entry], prepared[definition.root]);
  const numericAttrs = new Set([
    "aria-level",
    "cx",
    "cy",
    "r",
    "x1",
    "x2",
    "y1",
    "y2",
    "stroke-width",
    "stroke-dashoffset",
    "colspan",
  ]);
  for (const spec of specs) {
    spec.css = [];
    spec.numbers = [];
    function numeric(n) {
      n.exactNumbers = {};
      for (const [name, value] of n.attrs ?? [])
        if (numericAttrs.has(name) && "slot" in value) {
          let index = spec.numbers.indexOf(value.slot);
          if (index < 0) {
            index = spec.numbers.length;
            spec.numbers.push(value.slot);
          }
          n.exactNumbers[name] = index;
        }
      for (const c of n.children ?? n.cases ?? []) numeric(c);
    }
    numeric(spec.template);
    function fields(n) {
      if (n.kind === "element" && n.styleChoices.length > 2) {
        n.exactDynamic = [];
        for (const property of Object.keys(
          styles.palette[n.styleChoices[0]],
        ).filter((k) => !k.startsWith("$"))) {
          const values = n.styleChoices.map((i) => styles.palette[i][property]);
          if (new Set(values).size < 2) continue;
          const field = {
            node: n,
            property,
            values,
            numeric: values.every((v) => /^-?\d+(?:\.\d+)?$/.test(v)),
            index: spec.css.length,
          };
          n.exactDynamic.push(field);
          spec.css.push(field);
        }
      }
      for (const c of n.children ?? n.cases ?? []) fields(c);
    }
    fields(spec.template);
  }
  function typedInput(data) {
    const memo = new Map();
    function record(index, data) {
      if (!memo.has(data)) memo.set(data, new Map());
      const entries = memo.get(data);
      if (entries.has(index)) return entries.get(index);
      const spec = specs[index],
        value = [];
      entries.set(index, value);
      for (let i = 0; i < spec.texts; i++) value.push(data.texts[i] ?? "");
      for (let i = 0; i < spec.variants; i++) value.push(data.variants[i] ?? 0);
      for (let i = 0; i < spec.styles; i++)
        value.push(styles.recordStyles[indices.get(data)][i] ?? 0);
      for (const slot of spec.numbers) {
        const number = Number(data.texts[slot] ?? 0);
        assert.ok(Number.isFinite(number));
        value.push(number);
      }
      for (const field of spec.css) {
        const id =
          styles.recordStyles[indices.get(data)][field.node.exactStyle];
        const raw =
          styles.palette[id ?? field.node.styleChoices[0]][field.property];
        value.push(field.numeric ? Number(raw) : raw);
      }
      const active = new Set();
      function find(n) {
        if (n.kind === "repeat") {
          active.add(n);
          return;
        }
        if (n.kind === "variant") {
          find(n.cases[data.variants[n.selector]]);
          return;
        }
        for (const c of n.children ?? []) find(c);
      }
      find(spec.template);
      if (spec.texts + spec.variants + spec.styles + spec.groups.length === 0)
        value.push(false);
      for (const group of spec.groups)
        value.push(
          active.has(group)
            ? data.groups[group.group].map((child) =>
                record(group.template, child),
              )
            : [],
        );
      return value;
    }
    return record(definition.entry, data);
  }
  return { definition, specs, typedInput };
}
const directTags = new Set([
  "main",
  "header",
  "nav",
  "section",
  "footer",
  "article",
  "aside",
  "button",
  "input",
  "select",
  "option",
  "table",
  "caption",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "dl",
  "dt",
  "dd",
  "svg",
  "path",
  "circle",
  "line",
  "polyline",
  "hr",
]);
const attributes = new Set([
  "id",
  "href",
  "alt",
  "placeholder",
  "value",
  "type",
  "name",
  "role",
  "aria-label",
  "aria-hidden",
  "aria-current",
  "aria-expanded",
  "aria-haspopup",
  "aria-level",
  "aria-pressed",
  "aria-selected",
  "aria-controls",
  "colspan",
  "viewBox",
  "d",
  "cx",
  "cy",
  "r",
  "x1",
  "x2",
  "y1",
  "y2",
  "points",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-dashoffset",
  "fill",
  "fill-rule",
  "clip-rule",
  "transform",
]);
export function exactContract(
  plan,
  styles,
  { omitStyles = new Set(), omitAttributes = new Set() } = {},
) {
  const { definition, specs } = plan,
    lines = [],
    styleLines = new Map(),
    attrLines = new Map(),
    dataWords = new Set();
  const line = (value) => lines.push(value),
    quote = JSON.stringify;
  for (const [index, spec] of specs.entries()) {
    line(`shape Shape${index}`);
    for (let i = 0; i < spec.texts; i++) line(`  t${i}: string`);
    for (let i = 0; i < spec.variants; i++) line(`  v${i}: number`);
    for (let i = 0; i < spec.styles; i++) line(`  s${i}: number`);
    for (const [index] of spec.numbers.entries()) line(`  n${index}: number`);
    for (const field of spec.css)
      line(`  c${field.index}: ${field.numeric ? "number" : "string"}`);
    for (const g of spec.groups)
      line(`  g${g.exactGroup}: Shape${g.template}[]`);
    // Contract records cannot be empty; a constant component has a dummy field.
    if (spec.texts + spec.variants + spec.styles + spec.groups.length === 0)
      line("  unused: bool");
  }
  for (const [index, style] of styles.palette.entries()) {
    line(`style Style${index}`);
    let count = 0;
    for (const [property, value] of Object.entries(style)) {
      if (property.startsWith("$")) continue;
      const key = JSON.stringify([style.$scope ?? "html", property, value]);
      if (omitStyles.has(key)) continue;
      styleLines.set(lines.length + 1, { key, property, value });
      line(
        `  ${property}=${/^-?\d+(?:\.\d+)?$/.test(value) ? String(Number(value)) : quote(value)}`,
      );
      count++;
    }
    if (!count) line("  opacity=1");
  }
  line("component App");
  line(
    `  resource page = prepared() as shape Shape${definition.entry} else empty()`,
  );
  // A tiny separately seeded record carries each render's fresh request value.
  line(
    "  resource freshness = preparedRequest() as shape Freshness else empty()",
  );
  line("  view");
  line("    view");
  line(
    `      Component${definition.entry}(data=page, request=freshness.value)`,
  );
  line("shape Freshness");
  line("  value: string");
  let component,
    dataAlias = "data";
  const expression = (v) =>
    "literal" in v
      ? quote(v.literal)
      : component === definition.entry &&
          v.slot === definition.controls.requestIndex
        ? "request"
        : `${dataAlias}.t${v.slot}`;
  function emit(n, depth = 2, svg = false, _forcedStyle) {
    const pad = "  ".repeat(depth);
    if (
      n.kind === "raw" ||
      n.tag === "head" ||
      n.tag === "colgroup" ||
      n.tag === "col"
    )
      return;
    if (n.kind === "text") {
      line(`${pad}${svg ? "tspan" : "text"} ${expression(n.value)}`);
      return;
    }
    if (n.kind === "fragment" || n.tag === "html") {
      for (const c of n.children) emit(c, depth, svg);
      return;
    }
    if (n.kind === "repeat") {
      const child = `child${depth}`,
        index = `index${depth}`;
      line(
        `${pad}for ${child}, ${index} in ${dataAlias}.g${n.exactGroup} key=${index}`,
      );
      const target = definition.templates[n.template];
      if (target.tag === "text") {
        const priorAlias = dataAlias,
          priorComponent = component;
        dataAlias = child;
        component = n.template;
        emit(target, depth + 1, true);
        dataAlias = priorAlias;
        component = priorComponent;
      } else
        line(`${pad}  Component${n.template}(data=${child}, request=request)`);
      return;
    }
    if (n.kind === "variant") {
      for (const [index, c] of n.cases.entries()) {
        line(`${pad}if ${dataAlias}.v${n.selector} == ${index}`);
        emit(c, depth + 1, svg);
      }
      return;
    }
    let tag =
      n.tag === "img"
        ? "image"
        : n.tag === "a"
          ? "link"
          : n.tag === "text"
            ? "text"
            : directTags.has(n.tag)
              ? n.tag
              : "view";
    const attrs = [];
    if (/^h[1-6]$/.test(n.tag))
      attrs.push('role="heading"', `aria-level=${n.tag.slice(1)}`);
    if (n.styleChoices.length) {
      const choices =
        n.styleChoices.length > 2 ? [n.styleChoices[0]] : n.styleChoices;
      attrs.push(
        `class=${
          choices.length === 1
            ? `Style${choices[0]}`
            : "(" +
              choices
                .slice(0, -1)
                .map(
                  (i) => `${dataAlias}.s${n.exactStyle} == ${i} ? Style${i} : `,
                )
                .join("") +
              `Style${choices.at(-1)})`
        }`,
      );
    }
    for (const field of n.exactDynamic ?? []) {
      const scope = styles.palette[n.styleChoices[0]].$scope ?? "html";
      if (
        field.values.every(
          (value) =>
            !omitStyles.has(JSON.stringify([scope, field.property, value])),
        )
      )
        attrs.push(`${field.property}=${dataAlias}.c${field.index}`);
    }
    const position =
      n.tag === "img"
        ? n.attrs.find(([name]) => name === "src")?.[1]
        : undefined;
    if (position) tag += ` ${expression(position)}`;
    for (const [name, v] of n.attrs) {
      if (
        (!attributes.has(name) && !name.startsWith("data-")) ||
        omitAttributes.has(name)
      )
        continue;
      if (name.startsWith("data-") && name !== "data-testid")
        dataWords.add(name.slice(5));
      const bool = [
        "aria-hidden",
        "aria-expanded",
        "aria-pressed",
        "aria-selected",
      ].includes(name);
      const value = Number.isInteger(n.exactNumbers[name])
        ? `${dataAlias}.n${n.exactNumbers[name]}`
        : bool
          ? "literal" in v
            ? String(v.literal === "true")
            : `(${expression(v)} == "true")`
          : "literal" in v &&
              [
                "width",
                "height",
                "cx",
                "cy",
                "r",
                "x1",
                "x2",
                "y1",
                "y2",
                "colspan",
                "aria-level",
                "stroke-width",
                "stroke-dashoffset",
              ].includes(name) &&
              /^[-\d.]+$/.test(v.literal)
            ? String(Number(v.literal))
            : expression(v);
      attrs.push(`${name === "data-testid" ? "testId" : name}=${value}`);
    }
    attrLines.set(
      lines.length + 1,
      n.attrs.map(([name]) => name),
    );
    line(`${pad}${tag}${attrs.length ? ` ${attrs.join(" ")}` : ""}`);
    for (const c of n.children)
      emit(c, depth + 1, svg || n.tag === "svg" || n.tag === "text");
  }
  for (const [index, spec] of specs.entries()) {
    if (spec.template.tag === "text") continue;
    component = index;
    line(`component Component${index}`);
    line("  props");
    line(`    data: Shape${index}`);
    line("    request: string");
    line("  view");
    emit(spec.template);
  }
  return {
    source: `${lines.join("\n")}\n`,
    styleLines,
    attrLines,
    dataWords: [...dataWords],
  };
}
