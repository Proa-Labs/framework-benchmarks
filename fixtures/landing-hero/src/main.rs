// Copyright Proa Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use proa_core::{RenderBuffer, WebContext, WebRenderSync, WriteBuf};
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
    let render = || -> RenderBuffer {
        let mut out = RenderBuffer::new();
        {
            let mut cx = WebContext::with_buffer(&mut out);
            match page.as_str() {
                "github" => GithubPrDiffPage { props: &props }.render(&mut cx).unwrap(),
                "airbnb" => home::render_into(&mut cx, &home),
                "sentry" => sentry_otel::render_benchmark_rows_into(&mut cx, 400).unwrap(),
                _ => panic!("unknown page"),
            }
        }
        out
    };
    if args[2] == "dump" {
        // Parity serialization is outside every measured render interval.
        print!("{}", render().into_string());
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
        let out = black_box(render());
        let elapsed = started.elapsed().as_secs_f64() * 1_000_000.0;
        bytes = black_box(out.len());
        samples.push(elapsed);
        drop(out);
    }
    println!(
        "{}",
        serde_json::json!({
            "samples_us": samples,
            "output_bytes": bytes,
            "output_kind": "owned-render-buffer",
            "debug_assertions": cfg!(debug_assertions),
        })
    );
}
