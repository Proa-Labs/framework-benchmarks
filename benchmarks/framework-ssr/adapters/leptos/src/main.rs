//! Complete HTML responses from the native Leptos SSR integration.
mod workloads;

use axum::{
    extract::{Query, Request},
    http::header::CACHE_CONTROL,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use leptos::{nonce::Nonce, reactive::owner::take_context};
use leptos_axum::render_app_async_with_context;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct Parameters {
    request: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Health {
    status: &'static str,
    engine: &'static str,
    framework: &'static str,
    runtime: &'static str,
    worker_threads: usize,
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let fixture: &'static workloads::Fixture = Box::leak(Box::new(serde_json::from_str(
        include_str!("../fixture.json"),
    )?));
    let mut router = Router::new()
        .route(
            "/health",
            get(|| async {
                Json(Health {
                    status: "ok",
                    engine: "leptos",
                    framework: "Leptos 0.7.8",
                    runtime: "Rust / Tokio",
                    worker_threads: 1,
                })
            }),
        )
        .route("/metrics", get(|| async { Json(process_metrics()) }));
    for (workload, path) in [
        ("cards", "/cards"),
        ("products", "/products"),
        ("table", "/table"),
    ] {
        router = router.route(
            path,
            get(
                move |Query(parameters): Query<Parameters>, request: Request| async move {
                    let token = parameters.request.unwrap_or_default();
                    let handler = render_app_async_with_context(omit_unused_nonce, move || {
                        workloads::page(workload, fixture, &token)
                    });
                    ([(CACHE_CONTROL, "no-store")], handler(request).await).into_response()
                },
            ),
        );
    }
    for (id, path) in [
        ("airbnb-home", "/showcase/airbnb-home"),
        ("nike-catalog", "/showcase/nike-catalog"),
        ("github-pr", "/showcase/github-pr"),
        ("sentry-otel", "/showcase/sentry-otel"),
        ("espn", "/showcase/espn"),
    ] {
        let prepared = proa_bench::showcase::prepare(id);
        let data = prepared.data;
        let default_token = data.texts[prepared.controls.request_index].as_str();
        router = router.route(
            path,
            get(
                move |Query(parameters): Query<Parameters>, request: Request| async move {
                    let token = parameters
                        .request
                        .unwrap_or_else(|| default_token.to_owned());
                    let handler = render_app_async_with_context(omit_unused_nonce, move || {
                        proa_bench::showcase::leptos_view(id, data, &token)
                    });
                    ([(CACHE_CONTROL, "no-store")], handler(request).await).into_response()
                },
            ),
        );
    }
    let port: u16 = std::env::var("PORT")?.parse()?;
    let listener = tokio::net::TcpListener::bind(("127.0.0.1", port)).await?;
    axum::serve(listener, router).await?;
    Ok(())
}

fn omit_unused_nonce() {
    // The fixtures omit client hydration and CSP. Discard the integration's
    // request nonce so identical URLs satisfy the complete-byte check.
    let _ = take_context::<Nonce>();
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Metrics {
    cpu_time_micros: u64,
}

fn process_metrics() -> Metrics {
    let mut usage = std::mem::MaybeUninit::<libc::rusage>::uninit();
    // SAFETY: getrusage initializes the output on success. Failure never reads it.
    if unsafe { libc::getrusage(libc::RUSAGE_SELF, usage.as_mut_ptr()) } != 0 {
        return Metrics { cpu_time_micros: 0 };
    }
    // SAFETY: the successful call initialized the whole rusage above.
    let usage = unsafe { usage.assume_init() };
    Metrics {
        cpu_time_micros: (usage.ru_utime.tv_sec + usage.ru_stime.tv_sec) as u64 * 1_000_000
            + (usage.ru_utime.tv_usec + usage.ru_stime.tv_usec) as u64,
    }
}
