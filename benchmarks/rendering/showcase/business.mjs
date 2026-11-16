import { parse } from "parse5";
export function semantic(html, allowedData) {
  const tree = parse(html),
    result = { text: "", images: [], links: [], data: [] };
  const body = tree.childNodes
    .find((n) => n.tagName === "html")
    .childNodes.find((n) => n.tagName === "body");
  function walk(n) {
    if (["script", "style"].includes(n.tagName)) return;
    if (n.nodeName === "#text") result.text += n.value;
    if (n.tagName === "img")
      result.images.push(n.attrs.find((a) => a.name === "src")?.value);
    if (n.tagName === "a")
      result.links.push(n.attrs.find((a) => a.name === "href")?.value);
    const data = (n.attrs ?? [])
      .filter(
        (a) =>
          a.name.startsWith("data-") &&
          (!allowedData || allowedData.has(a.name)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    if (data.length) result.data.push(data.map((a) => [a.name, a.value]));
    let children = n.childNodes ?? [];
    if (n === body) {
      children = children.filter(
        (c) =>
          !["script", "style"].includes(c.tagName) && c.nodeName !== "#comment",
      );
      while (
        children[0]?.nodeName === "#text" &&
        /^\s*$/.test(children[0].value)
      )
        children = children.slice(1);
      while (
        children.at(-1)?.nodeName === "#text" &&
        /^\s*$/.test(children.at(-1).value)
      )
        children = children.slice(0, -1);
    }
    for (const c of children) walk(c);
  }
  walk(body);
  return result;
}
