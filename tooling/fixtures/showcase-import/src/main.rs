//! Export upstream showcase HTML once for native, cross-framework fixtures.
//! There are no benchmark timings in this program.
use std::{collections::BTreeMap, path::PathBuf};

use proa_core::{RenderBuffer, WebContext, WebRenderSync};
use serde::Serialize;
use sha2::{Digest, Sha256};

const REVISION: &str = "ceffd9f305acabbb0584fa181df4f4e2d7883e94";
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    schema_version: u32,
    revision: &'static str,
    debug_assertions: bool,
    pages: BTreeMap<&'static str, Page>,
}
#[derive(Serialize)]
struct Page {
    sha256: String,
    bytes: usize,
}

fn main() {
    let mut args = std::env::args().skip(1);
    assert_eq!(args.next().as_deref(), Some("--out"));
    let directory = PathBuf::from(args.next().expect("--out directory"));
    assert!(args.next().is_none());
    assert!(!cfg!(debug_assertions), "Export through a release build");
    std::fs::create_dir_all(&directory).unwrap();
    let mut pages = BTreeMap::new();
    for id in [
        "airbnb-home",
        "nike-catalog",
        "github-pr",
        "sentry-otel",
        "espn",
    ] {
        let mut output = RenderBuffer::new();
        {
            let mut cx = WebContext::with_buffer(&mut output);
            match id {
                "airbnb-home" => proa_showcase::airbnb::home::render_into(
                    &mut cx,
                    &proa_showcase::airbnb::home::HomeData::default_la(),
                ),
                "nike-catalog" => proa_showcase::nike::catalog::render_into(
                    &mut cx,
                    &proa_showcase::nike::catalog::default_data(),
                ),
                "github-pr" => proa_demo::github_pr_diff::GithubPrDiffPage {
                    props: &proa_demo::github_pr_diff::GithubPrDiffProps::default(),
                }
                .render(&mut cx)
                .unwrap(),
                "sentry-otel" => {
                    proa_showcase::sentry_otel::render_benchmark_rows_into(&mut cx, 400).unwrap()
                }
                "espn" => {
                    proa_showcase::espn::render_into(&mut cx, &proa_showcase::espn::GAME).unwrap()
                }
                _ => unreachable!(),
            }
        }
        // This untimed export includes final flattening. Published Proa render
        // benchmarks allocate and return a fresh RenderBuffer without this copy.
        let html = output.into_string();
        std::fs::write(directory.join(format!("{id}.html")), &html).unwrap();
        pages.insert(
            id,
            Page {
                sha256: Sha256::digest(html.as_bytes())
                    .iter()
                    .map(|byte| format!("{byte:02x}"))
                    .collect(),
                bytes: html.len(),
            },
        );
    }
    let manifest = Manifest {
        schema_version: 1,
        revision: REVISION,
        debug_assertions: cfg!(debug_assertions),
        pages,
    };
    std::fs::write(
        directory.join("manifest.json"),
        serde_json::to_vec_pretty(&manifest).unwrap(),
    )
    .unwrap();
}
