// Copyright Proa Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use proa_core::{RenderBuffer, WebContext};
use proa_demo::github_pr_diff::{GithubPrDiffPage, GithubPrDiffProps};
use proa_showcase::{
    airbnb::home::{self, HomeData},
    sentry_otel,
};
use std::{hint::black_box, time::Instant};

fn main() {
    let args: Vec<_> = std::env::args().collect();
    let page = &args[1];
    let props = GithubPrDiffProps::default();
    let home = HomeData::default_la();
    let render = || match page.as_str() {
        "github" => proa_core::render_to_string(GithubPrDiffPage { props: &props }),
        "airbnb" => {
            let mut out = RenderBuffer::new();
            home::render_into(&mut WebContext::with_buffer(&mut out), &home);
            out.into_string()
        }
        "sentry" => sentry_otel::render_benchmark_rows(400),
        _ => panic!("unknown page"),
    };
    if args[2] == "dump" {
        print!("{}", render());
        return;
    }
    let warmup: usize = args[2].parse().unwrap();
    let iterations: usize = args[3].parse().unwrap();
    for _ in 0..warmup {
        black_box(render());
    }
    let mut samples = Vec::with_capacity(iterations);
    let mut bytes = 0;
    for _ in 0..iterations {
        let started = Instant::now();
        let html = black_box(render());
        let elapsed = started.elapsed().as_secs_f64() * 1_000_000.0;
        bytes = black_box(html.len());
        samples.push(elapsed);
        drop(html);
    }
    println!(
        "{}",
        serde_json::json!({"samples_us": samples, "output_bytes": bytes})
    );
}
