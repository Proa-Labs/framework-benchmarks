//! Native showcase render-only runner. Input preparation, flattening, encoding,
//! parity and destruction are outside the allocation-and-render timer.
use proa_bench::showcase;
use proa_core::{RenderBuffer, WriteBuf};
use std::{fs, hint::black_box, time::Instant};

enum Output {
    Proa(RenderBuffer),
    Text(String),
}
impl Output {
    fn bytes(&self) -> Vec<u8> {
        match self {
            Self::Proa(output) => output.to_vec(),
            Self::Text(output) => output.as_bytes().to_vec(),
        }
    }
    fn len(&self) -> usize {
        match self {
            Self::Proa(output) => output.len(),
            Self::Text(output) => output.len(),
        }
    }
}
fn percentile(sorted: &[f64], fraction: f64) -> f64 {
    let rank = fraction * (sorted.len() - 1) as f64;
    let low = rank.floor() as usize;
    sorted[low] + (sorted[rank.ceil() as usize] - sorted[low]) * (rank - low as f64)
}
fn main() {
    assert_eq!(env!("PROA_BENCH_PROFILE"), "release");
    assert_eq!(env!("PROA_BENCH_OPT_LEVEL"), "3");
    assert!(!cfg!(debug_assertions));
    let args: Vec<String> = std::env::args().skip(1).collect();
    let option = |key: &str| {
        args.iter()
            .position(|arg| arg == key)
            .map(|i| args.get(i + 1).expect("option value").as_str())
    };
    let id = option("--workload").expect("--workload showcase-id");
    let engine = option("--framework").unwrap_or("proa");
    let fixture = showcase::prepare_with_probe(id, option("--probe").unwrap_or("baseline"));
    let request =
        option("--request").unwrap_or(&fixture.data.texts[fixture.controls.request_index]);
    #[cfg(feature = "topcoat")]
    let cx = ::topcoat::context::Cx::default();
    let render = || match engine {
        "proa" => Output::Proa(showcase::render_proa(id, fixture.data, request)),
        "topcoat" => {
            #[cfg(feature = "topcoat")]
            {
                Output::Text(showcase::render_topcoat(&cx, id, fixture.data, request))
            }
            #[cfg(not(feature = "topcoat"))]
            {
                panic!("Build with --features topcoat")
            }
        }
        _ => Output::Text(showcase::render_template(engine, id, fixture.data, request)),
    };
    let mut previous = render();
    if let Some(path) = option("--dump") {
        fs::write(path, previous.bytes()).unwrap();
    }
    if args.iter().any(|arg| arg == "--dump-only") || option("--probe").is_some() {
        return;
    }
    let iterations: usize = option("--iterations").unwrap_or("100").parse().unwrap();
    let warmup: usize = option("--warmup").unwrap_or("10").parse().unwrap();
    assert!(iterations > 0);
    for _ in 0..warmup {
        let output = render();
        black_box(&output);
        previous = output;
    }
    let mut samples = Vec::with_capacity(iterations);
    for _ in 0..iterations {
        let started = Instant::now();
        let output = render();
        black_box(&output);
        let elapsed = started.elapsed().as_secs_f64() * 1_000_000.0;
        // Replacing the prior whole owner destroys it only after the clock stops.
        previous = output;
        samples.push(elapsed);
    }
    let mut sorted = samples.clone();
    sorted.sort_by(f64::total_cmp);
    let (label, policy) = match engine {
        "proa" => (
            "Proa",
            "fresh owned RenderBuffer; context and buffer allocation plus native rendering; flattening and destruction untimed",
        ),
        "askama" => (
            "Askama",
            "precompiled native Askama template; fresh owned HTML String",
        ),
        "sailfish" => (
            "Sailfish",
            "precompiled native Sailfish template; fresh owned HTML String",
        ),
        "leptos" => (
            "Leptos",
            "native Leptos view construction and SSR; fresh owned HTML String",
        ),
        "dioxus" => (
            "Dioxus",
            "native Dioxus VDOM construction, attribute escaping and SSR; fresh owned HTML String",
        ),
        "topcoat" => (
            "Topcoat",
            "native Topcoat view construction and SSR; fresh owned HTML String",
        ),
        _ => unreachable!(),
    };
    let cardinality = match id {
        "airbnb-home" => 49,
        "nike-catalog" => 117,
        "github-pr" => 16,
        "sentry-otel" => 400,
        "espn" => 2,
        _ => unreachable!(),
    };
    let summary = serde_json::json!({
        "schema_version":1,"framework":label,"framework_id":engine,"language":"Rust",
        "workload":id,"workload_cardinality":cardinality,"allocation_policy":policy,
        "build_profile":env!("PROA_BENCH_PROFILE"),"optimization_level":env!("PROA_BENCH_OPT_LEVEL"),
        "debug_assertions":cfg!(debug_assertions),"timed_operation":"allocate_and_render_fresh_owned_output",
        "output_destruction_timed":false,"operations_per_sample":1,"iterations":iterations,"warmup":warmup,
        "output_bytes":previous.len(),"samples_us":samples,"min_us":sorted[0],
        "mean_us":sorted.iter().sum::<f64>() / sorted.len() as f64,
        "p50_us":percentile(&sorted,0.5),"p95_us":percentile(&sorted,0.95),"p99_us":percentile(&sorted,0.99),"max_us":sorted.last().unwrap()
    });
    let json = serde_json::to_string(&summary).unwrap();
    if let Some(path) = option("--out") {
        fs::write(path, json).unwrap();
    } else {
        println!("{json}");
    }
}
