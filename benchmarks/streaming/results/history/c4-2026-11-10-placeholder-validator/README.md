# Superseded streaming capture

Preserved unchanged for provenance. This capture required all loading placeholders
in every completed response. Marko can omit a placeholder when its boundary
resolves before flushing, so valid responses containing all resolved panels and
96 product cards were incorrectly counted as failures.

Do not use this artifact for comparisons. Aggregate results cannot reconstruct
the rejected responses. The replacement at `../../latest.json` reruns every
engine and load level with `responseValidator: resolved-content-v2`; it requires
complete resolved content during load and checks placeholder support separately
in the unloaded preflight.
