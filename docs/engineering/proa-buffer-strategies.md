# Proa output construction strategies

The [latest engineering tables](../reports/engineering.md#proa-engineering-refresh) retain fresh owned output, an explicit String-copy control, and reused-buffer diagnostics. Compare these paths only within their stated fixture and capture.

The public render-only contract includes allocating and rendering into a fresh owned `RenderBuffer`. Flattening, parity checks, hashing and output destruction are outside its timer. Reused output measures a separate optimization and must not replace that contract. Each standalone Criterion experiment retains its own declared timing boundary.

If reused output is presented as production performance, measure it in an HTTP suite where each framework uses its normal response-management strategy. Superseded numeric tables are available in Git history.
