//! Fresh framework-native output: keep the rendered pages owned by the caller.
//!
//! This is the ordinary synchronous render-to-string pipeline up to its final
//! conversion. Allocation and rendering happen here; flattening is deliberately
//! left to untimed parity checks or to an explicitly named String control.
use proa_core::{NoLoader, RenderBuffer, WebContext, WebRenderSync};

pub fn render_buffer<R: WebRenderSync<NoLoader, RenderBuffer>>(root: R) -> RenderBuffer {
    let mut cx = WebContext::new();
    root.render(&mut cx).unwrap();
    cx.into_output()
}

#[cfg(feature = "topcoat")]
pub fn render_canonical(workload: crate::representative_suite::Workload) -> RenderBuffer {
    use crate::{data_table_page, proa_page, representative_suite, topcoat_product_grid};
    use representative_suite::Workload;
    match workload {
        Workload::Cards => render_buffer(proa_page::SafeTextBenchmarkPage),
        Workload::Table => render_buffer(data_table_page::DataTablePage {
            rows: representative_suite::table_rows(),
        }),
        Workload::Products => render_buffer(topcoat_product_grid::ProaProductGrid::new(
            representative_suite::products(),
        )),
    }
}

#[cfg(all(test, feature = "topcoat"))]
mod tests {
    use super::*;
    use crate::representative_suite::{self, Workload};
    use proa_core::WriteBuf;

    #[test]
    fn owned_pages_match_string_bytes_for_every_canonical_workload() {
        for workload in [Workload::Cards, Workload::Table, Workload::Products] {
            let expected = representative_suite::render_proa(workload);
            let first = render_canonical(workload);
            let second = render_canonical(workload);
            assert!(
                first.page_count() > 1,
                "exercise the former flattening copy"
            );
            assert_ne!(
                first.slices().next().unwrap().as_ptr(),
                second.slices().next().unwrap().as_ptr()
            );
            assert_eq!(first.len(), expected.len());
            assert_eq!(first.to_vec(), expected.as_bytes());
            assert_eq!(second.to_vec(), expected.as_bytes());
            drop(second);
            assert_eq!(
                first.to_vec(),
                expected.as_bytes(),
                "outputs own independent pages"
            );
        }
    }
}
