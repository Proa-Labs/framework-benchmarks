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
    route: &'static str,
    renderer: &'static str,
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
    for (id, route, renderer) in [
        (
            "airbnb-home",
            "/showcase/airbnb/proa",
            "proa_showcase::airbnb::parity::render",
        ),
        (
            "nike-catalog",
            "/showcase/nike/proa",
            "proa_showcase::nike::catalog::render_into",
        ),
        (
            "github-pr",
            "/showcase/github-pr-diff",
            "proa_demo::github_pr_diff::GithubPrDiffPage",
        ),
        (
            "sentry-otel",
            "/showcase/sentry-otel/proa",
            "proa_showcase::sentry_otel::render_benchmark_rows_into",
        ),
        (
            "espn",
            "/showcase/espn/proa",
            "proa_showcase::espn::render_into",
        ),
    ] {
        // Match the public /showcase/airbnb/proa handler in proa_showcase_web,
        // which serves parity::render(), not the older home::render_into().
        let airbnb = (id == "airbnb-home").then(proa_showcase::airbnb::parity::render);
        let mut output = RenderBuffer::new();
        {
            let mut cx = WebContext::with_buffer(&mut output);
            match id {
                "airbnb-home" => {}
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
                    // This hydration-independent counterpart uses the same SentryDocument
                    // and log rows as the public handler; visual parity is audited.
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
        let html = airbnb.unwrap_or_else(|| output.into_string());
        std::fs::write(directory.join(format!("{id}.html")), &html).unwrap();
        pages.insert(
            id,
            Page {
                route,
                renderer,
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
