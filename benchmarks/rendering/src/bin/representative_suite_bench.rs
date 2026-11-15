//! Fixed-workload runner for the representative cross-framework SSR matrix.

use std::{
    env, fs,
    path::PathBuf,
    ptr,
    time::{Instant, SystemTime, UNIX_EPOCH},
};

use proa_bench::representative_suite::{self, Workload, TABLE_ROW_COUNT};
use proa_core::{RenderBuffer, WriteBuf};
use serde::Serialize;
use topcoat::context::Cx;

const MEMCPY_BYTES_PER_SAMPLE: usize = 16 * 1024 * 1024;

#[derive(Clone, Copy, Debug)]
enum Implementation {
    Memcpy,
    Proa,
    ProaString,
    Leptos,
    Dioxus,
    Topcoat,
    Askama,
    Sailfish,
}

impl Implementation {
    fn parse(value: &str) -> Option<Self> {
        match value {
            "memcpy" => Some(Self::Memcpy),
            "proa" => Some(Self::Proa),
            "proa-string" => Some(Self::ProaString),
            "leptos" => Some(Self::Leptos),
            "dioxus" => Some(Self::Dioxus),
            "topcoat" => Some(Self::Topcoat),
            "askama" => Some(Self::Askama),
            "sailfish" => Some(Self::Sailfish),
            _ => None,
        }
    }

    const fn id(self) -> &'static str {
        match self {
            Self::Memcpy => "memcpy",
            Self::Proa => "proa",
            Self::ProaString => "proa-string",
            Self::Leptos => "leptos",
            Self::Dioxus => "dioxus",
            Self::Topcoat => "topcoat",
            Self::Askama => "askama",
            Self::Sailfish => "sailfish",
        }
    }

    const fn label(self) -> &'static str {
        match self {
            Self::Memcpy => "Memcpy control",
            Self::Proa => "Proa",
            Self::ProaString => "Proa String control",
            Self::Leptos => "Leptos",
            Self::Dioxus => "Dioxus",
            Self::Topcoat => "Topcoat",
            Self::Askama => "Askama",
            Self::Sailfish => "Sailfish",
        }
    }

    const fn language(self) -> &'static str {
        match self {
            Self::Memcpy => "Rust intrinsic",
            Self::Proa
            | Self::ProaString
            | Self::Leptos
            | Self::Dioxus
            | Self::Topcoat
            | Self::Askama
            | Self::Sailfish => "Rust",
        }
    }

    const fn allocation_policy(self) -> &'static str {
        match self {
            Self::Memcpy => {
                "pre-rendered Proa bytes; copy_nonoverlapping into a warmed reused buffer; allocation excluded"
            }
            Self::Topcoat => "fresh View construction and serialization into a fresh owned String",
            Self::Proa => "fresh owned RenderBuffer; standard WebContext; no flattening or String conversion",
            Self::ProaString => "render_to_string control; fresh owned String including page flattening",
            Self::Dioxus => "standard empty String with no caller capacity hint; fresh owned String",
            Self::Leptos => "fresh owned String",
            Self::Askama => "compiled Askama template; fresh owned String",
            Self::Sailfish => "compiled Sailfish template; fresh owned String",
        }
    }

    const fn comparison_role(self) -> &'static str {
        match self {
            Self::Memcpy => "mechanism control",
            Self::ProaString => "String conversion control",
            Self::Proa
            | Self::Leptos
            | Self::Dioxus
            | Self::Topcoat
            | Self::Askama
            | Self::Sailfish => "renderer",
        }
    }
}

struct Args {
    implementation: Implementation,
    workload: Workload,
    iterations: usize,
    warmup: usize,
    out: Option<PathBuf>,
    dump: Option<PathBuf>,
    dump_only: bool,
}

fn parse_args() -> Args {
    let mut implementation = None;
    let mut workload = None;
    let mut iterations = None;
    let mut warmup = None;
    let mut out = None;
    let mut dump = None;
    let mut dump_only = false;

    let mut args = env::args().skip(1);
    while let Some(argument) = args.next() {
        match argument.as_str() {
            "--framework" => {
                let value = args.next().expect("--framework requires a value");
                implementation = Some(Implementation::parse(&value).unwrap_or_else(|| {
                    panic!(
                        "unknown framework `{value}`; expected memcpy|proa|proa-string|leptos|dioxus|topcoat|askama|sailfish"
                    )
                }));
            }
            "--workload" => {
                let value = args.next().expect("--workload requires a value");
                workload = Some(Workload::parse(&value).unwrap_or_else(|| {
                    panic!("unknown workload `{value}`; expected cards|table|products")
                }));
            }
            "--iterations" => {
                iterations = Some(
                    args.next()
                        .expect("--iterations requires a value")
                        .parse()
                        .expect("--iterations must be an integer"),
                );
            }
            "--warmup" => {
                warmup = Some(
                    args.next()
                        .expect("--warmup requires a value")
                        .parse()
                        .expect("--warmup must be an integer"),
                );
            }
            "--out" => out = Some(PathBuf::from(args.next().expect("--out requires a path"))),
            "--dump" => dump = Some(PathBuf::from(args.next().expect("--dump requires a path"))),
            "--dump-only" => dump_only = true,
            other => panic!("unknown argument `{other}`"),
        }
    }

    let implementation = implementation.expect("--framework is required");
    let workload = workload.expect("--workload is required");
    let default_iterations = match workload {
        Workload::Cards => 2_000,
        Workload::Table => 200,
        Workload::Products => 500,
    };
    let default_warmup = match workload {
        Workload::Cards => 200,
        Workload::Table => 20,
        Workload::Products => 50,
    };

    Args {
        implementation,
        workload,
        iterations: iterations.unwrap_or(default_iterations),
        warmup: warmup.unwrap_or(default_warmup),
        out,
        dump,
        dump_only,
    }
}

enum RenderedOutput {
    Pages(RenderBuffer),
    Text(String),
}

impl RenderedOutput {
    // Length and flattening are used only outside the measured render loop.
    fn len(&self) -> usize {
        match self {
            Self::Pages(pages) => pages.len(),
            Self::Text(text) => text.len(),
        }
    }
    fn dump_bytes(&self) -> Vec<u8> {
        match self {
            Self::Pages(pages) => pages.to_vec(),
            Self::Text(text) => text.as_bytes().to_vec(),
        }
    }
    fn memcpy_source(&self) -> &[u8] {
        match self {
            Self::Text(text) => text.as_bytes(),
            Self::Pages(_) => unreachable!("memcpy uses an untimed contiguous reference"),
        }
    }
}

fn render(implementation: Implementation, workload: Workload, cx: &Cx) -> RenderedOutput {
    if matches!(implementation, Implementation::Proa) {
        return RenderedOutput::Pages(proa_bench::native_output::render_canonical(workload));
    }
    RenderedOutput::Text(match implementation {
        Implementation::Memcpy | Implementation::ProaString => {
            representative_suite::render_proa(workload)
        }
        Implementation::Proa => unreachable!(),
        Implementation::Leptos => representative_suite::render_leptos(workload),
        Implementation::Dioxus => representative_suite::render_dioxus(workload),
        Implementation::Topcoat => representative_suite::render_topcoat(cx, workload),
        Implementation::Askama => representative_suite::render_askama(workload),
        Implementation::Sailfish => representative_suite::render_sailfish(workload),
    })
}

fn memcpy_operations_per_sample(output_bytes: usize) -> usize {
    assert!(output_bytes > 0, "memcpy source must not be empty");
    MEMCPY_BYTES_PER_SAMPLE.div_ceil(output_bytes)
}

#[inline(always)]
fn memcpy_once(source: &[u8], destination: &mut [u8]) {
    debug_assert_eq!(source.len(), destination.len());
    // SAFETY: source and destination are distinct allocations, both valid for
    // exactly source.len() bytes. Black-box barriers keep every timed copy
    // observable without adding allocation, hashing, or traversal to it.
    unsafe {
        ptr::copy_nonoverlapping(
            std::hint::black_box(source.as_ptr()),
            std::hint::black_box(destination.as_mut_ptr()),
            source.len(),
        );
    }
    std::hint::black_box(&mut *destination);
}

fn percentile(sorted: &[f64], percent: f64) -> f64 {
    let rank = percent / 100.0 * (sorted.len() - 1) as f64;
    let lower = rank.floor() as usize;
    let upper = rank.ceil() as usize;
    if lower == upper {
        sorted[lower]
    } else {
        sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower as f64)
    }
}

#[derive(Serialize)]
struct ResultSummary {
    schema_version: u32,
    framework: &'static str,
    framework_id: &'static str,
    language: &'static str,
    comparison_role: &'static str,
    workload: &'static str,
    workload_cardinality: usize,
    allocation_policy: &'static str,
    build_profile: &'static str,
    optimization_level: &'static str,
    debug_assertions: bool,
    timed_operation: &'static str,
    output_destruction_timed: bool,
    samples_us: Vec<f64>,
    iterations: usize,
    warmup: usize,
    operations_per_sample: usize,
    output_bytes: usize,
    min_us: f64,
    mean_us: f64,
    p50_us: f64,
    p95_us: f64,
    p99_us: f64,
    max_us: f64,
    timestamp_unix: u64,
}

fn record_owned_render<T>(previous: &mut T, render: impl FnOnce() -> T, record: impl FnOnce(f64)) {
    let started = Instant::now();
    let output = render();
    std::hint::black_box(&output);
    let elapsed_us = started.elapsed().as_secs_f64() * 1_000_000.0;
    record(elapsed_us);
    // Replacing the prior output runs its destructor only after timing stops.
    *previous = output;
}

fn main() {
    assert_eq!(
        env!("PROA_BENCH_PROFILE"),
        "release",
        "use cargo build --release"
    );
    assert_ne!(
        env!("PROA_BENCH_OPT_LEVEL"),
        "0",
        "render benchmarks require optimization"
    );
    assert!(
        !cfg!(debug_assertions),
        "render benchmarks require disabled debug assertions"
    );
    let args = parse_args();
    assert!(
        args.iterations > 0,
        "--iterations must be greater than zero"
    );
    let cx = Cx::default();
    let mut html = render(args.implementation, args.workload, &cx);

    if let Some(path) = &args.dump {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("create dump directory");
        }
        fs::write(path, html.dump_bytes()).expect("write HTML dump");
    }
    if args.dump_only {
        println!(
            "{} {}: {} bytes",
            args.implementation.label(),
            args.workload.id(),
            html.len()
        );
        return;
    }

    let operations_per_sample = match args.implementation {
        Implementation::Memcpy => memcpy_operations_per_sample(html.len()),
        Implementation::Proa
        | Implementation::ProaString
        | Implementation::Leptos
        | Implementation::Dioxus
        | Implementation::Topcoat
        | Implementation::Askama
        | Implementation::Sailfish => 1,
    };
    let mut samples = Vec::with_capacity(args.iterations);
    if matches!(args.implementation, Implementation::Memcpy) {
        let mut destination = vec![0_u8; html.len()];
        for _ in 0..args.warmup {
            for _ in 0..operations_per_sample {
                memcpy_once(html.memcpy_source(), &mut destination);
            }
        }
        for _ in 0..args.iterations {
            let started = Instant::now();
            for _ in 0..operations_per_sample {
                memcpy_once(html.memcpy_source(), &mut destination);
            }
            samples
                .push(started.elapsed().as_secs_f64() * 1_000_000.0 / operations_per_sample as f64);
        }
        assert_eq!(
            destination,
            html.memcpy_source(),
            "memcpy output changed bytes"
        );
    } else {
        for _ in 0..args.warmup {
            html = render(args.implementation, args.workload, &cx);
            std::hint::black_box(&html);
        }
        for _ in 0..args.iterations {
            record_owned_render(
                &mut html,
                || render(args.implementation, args.workload, &cx),
                |elapsed| samples.push(elapsed),
            );
        }
    }
    // Retain capture-order observations; sorting and serialization are untimed.
    let raw_samples = samples.clone();
    samples.sort_by(f64::total_cmp);

    let mean = samples.iter().sum::<f64>() / samples.len() as f64;
    let cardinality = match args.workload {
        Workload::Cards => 32,
        Workload::Table => TABLE_ROW_COUNT,
        Workload::Products => representative_suite::product_count(),
    };
    let summary = ResultSummary {
        schema_version: 1,
        framework: args.implementation.label(),
        framework_id: args.implementation.id(),
        language: args.implementation.language(),
        comparison_role: args.implementation.comparison_role(),
        workload: args.workload.id(),
        workload_cardinality: cardinality,
        allocation_policy: args.implementation.allocation_policy(),
        build_profile: env!("PROA_BENCH_PROFILE"),
        optimization_level: env!("PROA_BENCH_OPT_LEVEL"),
        debug_assertions: cfg!(debug_assertions),
        timed_operation: if matches!(args.implementation, Implementation::Memcpy) {
            "copy_only"
        } else {
            "allocate_and_render_fresh_owned_output"
        },
        output_destruction_timed: false,
        samples_us: raw_samples,
        iterations: args.iterations,
        warmup: args.warmup,
        operations_per_sample,
        output_bytes: html.len(),
        min_us: samples[0],
        mean_us: mean,
        p50_us: percentile(&samples, 50.0),
        p95_us: percentile(&samples, 95.0),
        p99_us: percentile(&samples, 99.0),
        max_us: *samples.last().expect("non-empty samples"),
        timestamp_unix: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock before Unix epoch")
            .as_secs(),
    };
    let json = serde_json::to_string_pretty(&summary).expect("serialize summary");

    println!(
        "{} {:<8} {:>9.2} µs p50  {:>9.2} µs p95  {:>8} bytes",
        summary.framework, summary.workload, summary.p50_us, summary.p95_us, summary.output_bytes
    );
    if let Some(path) = args.out {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("create result directory");
        }
        fs::write(&path, format!("{json}\n")).expect("write result JSON");
        println!("Result written to {}", path.display());
    } else {
        println!("{json}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recording_stops_before_replacing_or_destroying_owned_outputs() {
        use std::cell::{Cell, RefCell};
        use std::rc::Rc;
        struct Output {
            generation: usize,
            timing: Rc<Cell<bool>>,
            drops: Rc<RefCell<Vec<usize>>>,
        }
        impl Drop for Output {
            fn drop(&mut self) {
                assert!(!self.timing.get(), "output was destroyed inside the timer");
                self.drops.borrow_mut().push(self.generation);
            }
        }
        let timing = Rc::new(Cell::new(false));
        let drops = Rc::new(RefCell::new(Vec::new()));
        let output = |generation| Output {
            generation,
            timing: Rc::clone(&timing),
            drops: Rc::clone(&drops),
        };
        let mut previous = output(0);
        for generation in 1..=3 {
            record_owned_render(
                &mut previous,
                || {
                    timing.set(true);
                    output(generation)
                },
                |elapsed| {
                    assert!(elapsed.is_finite() && elapsed >= 0.0);
                    timing.set(false);
                },
            );
            assert_eq!(previous.generation, generation);
            assert_eq!(drops.borrow().len(), generation);
        }
        drop(previous);
        assert_eq!(*drops.borrow(), vec![0, 1, 2, 3]);
    }

    #[test]
    fn proa_output_stays_paged_and_matches_the_contiguous_control() {
        let cx = Cx::default();
        for workload in [Workload::Cards, Workload::Table, Workload::Products] {
            let native = render(Implementation::Proa, workload, &cx);
            let string = render(Implementation::ProaString, workload, &cx);
            assert!(matches!(native, RenderedOutput::Pages(_)));
            assert_eq!(native.dump_bytes(), string.dump_bytes());
        }
    }

    #[test]
    fn memcpy_batch_covers_at_least_the_target_byte_count() {
        for output_bytes in [25_108, 284_908, 988_509] {
            let operations = memcpy_operations_per_sample(output_bytes);
            assert!(operations * output_bytes >= MEMCPY_BYTES_PER_SAMPLE);
            assert!((operations - 1) * output_bytes < MEMCPY_BYTES_PER_SAMPLE);
        }
    }

    #[test]
    fn memcpy_once_copies_every_byte() {
        let source = (0_u8..=255).cycle().take(8_193).collect::<Vec<_>>();
        let mut destination = vec![0_u8; source.len()];
        memcpy_once(&source, &mut destination);
        assert_eq!(destination, source);
    }
}
