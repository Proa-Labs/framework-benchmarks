// null means all tools; an empty Set intentionally means no tools.
export function readToolSelection(params, rows) {
  if (params.has("tools")) {
    const ids = new Set(rows.map((row) => row.id));
    return new Set(
      params
        .get("tools")
        .split(",")
        .filter((id) => ids.has(id)),
    );
  }
  const terms = (params.get("q") || "")
    .toLowerCase()
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
  return terms.length
    ? new Set(
        rows
          .filter((row) =>
            terms.some((term) => row.label.toLowerCase().includes(term)),
          )
          .map((row) => row.id),
      )
    : null;
}
