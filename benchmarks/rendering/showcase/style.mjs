// Parse prepared CSS declarations before rendering into React-style props.
// Respect quotes, escapes and parentheses (including data URLs); CSS isn't split
// on delimiters inside a quoted value or function argument.
export function styleObject(source) {
  const declarations = [];
  let start = 0,
    depth = 0,
    quote = "",
    escaped = false;
  for (let i = 0; i <= source.length; i++) {
    const c = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") depth--;
    if ((c === ";" && depth === 0) || i === source.length) {
      declarations.push(source.slice(start, i));
      start = i + 1;
    }
  }
  const properties = {};
  for (const declaration of declarations) {
    const at = declaration.indexOf(":");
    if (at < 0) continue;
    const name = declaration.slice(0, at).trim(),
      value = declaration.slice(at + 1).trim();
    const key = name.startsWith("--")
      ? name
      : name
          .replace(/^-ms-/, "ms-")
          .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (Object.hasOwn(properties, key)) delete properties[key];
    properties[key] = value;
  }
  return properties;
}
