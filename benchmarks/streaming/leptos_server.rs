use std::convert::Infallible;
use std::sync::Arc;
use std::time::Duration;

use any_spawner::Executor;
use axum::{body::Body, http::header, routing::get, Json, Router};
use futures::StreamExt;
use hydration_context::SsrSharedContext;
use leptos::prelude::*;
use proa_bench::{
    http_load::{bind_address, process_metrics},
    representative_suite::leptos_product_cards,
    topcoat_product_grid::{make_products, Product},
};
use serde_json::json;

const DELAY_TIERS_MS: [u64; 8] = [5, 8, 12, 18, 27, 40, 60, 90];

#[derive(Clone, Copy)]
struct Scenario {
    cards_per_panel: usize,
    products: &'static [Product],
    boundaries: usize,
}

fn setting(name: &str, default: usize, min: usize, max: usize) -> Result<usize, String> {
    let value = std::env::var(name)
        .ok()
        .map(|value| value.parse::<usize>())
        .transpose()
        .map_err(|error| format!("invalid {name}: {error}"))?
        .unwrap_or(default);
    if !(min..=max).contains(&value) {
        return Err(format!("{name} must be from {min} to {max}"));
    }
    Ok(value)
}

fn fallback_panel(key: String, label: String) -> impl IntoView {
    let aria_label = label.clone();
    view! {
        <section class="marketplace-panel fallback" data-panel=key.clone() data-panel-fallback=key
            aria-busy="true" aria-label=aria_label>
            <p class="panel-eyebrow">"Fallback"</p>
            <h2>{label}</h2>
            <p>"Waiting on upstream service."</p>
        </section>
    }
}

fn ready_panel(index: usize, key: String, products: &'static [Product]) -> impl IntoView {
    let ordinal = index + 1;
    let tier = index % DELAY_TIERS_MS.len();
    let delay_ms = DELAY_TIERS_MS[tier];
    view! {
        <section class="marketplace-panel ready" data-panel=key.clone() data-panel-ready=key>
            <p class="panel-eyebrow">{format!("Priority tier {}", tier + 1)}</p>
            <h2>{format!("Panel {ordinal:02}")}</h2>
            <p>{format!("Resolved panel {ordinal:02} after {delay_ms} ms of simulated upstream work.")}</p>
            {(!products.is_empty()).then(|| view! {
                <div class="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {leptos_product_cards(products)}
                </div>
            })}
        </section>
    }
}

fn marketplace(scenario: Scenario) -> impl IntoView {
    view! {
        <main class="marketplace-pdp" data-benchmark-shell="suspense-load">
            <section class="hero-shell">
                <p class="eyebrow">"Suspense-heavy marketplace"</p>
                <h1>"Canon FD 50mm f/1.4 S.S.C. Vintage Prime Lens"</h1>
                <p class="price">"Bid US $129.50"</p>
                <p class="meta">"Condition: Used · Watchers: 214 · 12 bids"</p>
            </section>
            <div class="content-grid">
                {(0..scenario.boundaries).map(|index| {
                    let key = format!("panel-{index:02}");
                    let fallback_key = key.clone();
                    let products = &scenario.products
                        [index * scenario.cards_per_panel..(index + 1) * scenario.cards_per_panel];
                    view! {
                        <Suspense fallback=move || fallback_panel(
                            fallback_key, format!("Loading panel {:02}", index + 1),
                        )>
                            {Suspend::new(async move {
                                tokio::time::sleep(Duration::from_millis(
                                    DELAY_TIERS_MS[index % DELAY_TIERS_MS.len()],
                                )).await;
                                ready_panel(index, key, products)
                            })}
                        </Suspense>
                    }
                }).collect_view()}
            </div>
        </main>
    }
}

fn page(scenario: Scenario) -> ([(header::HeaderName, &'static str); 3], Body) {
    let owner = Owner::new_root(Some(Arc::new(SsrSharedContext::new())));
    let stream = owner.with(|| marketplace(scenario).to_html_stream_out_of_order());
    let chunks = stream.map(move |chunk| {
        // Keep per-request reactivity alive until the last boundary is sent.
        let _ = &owner;
        Ok::<_, Infallible>(chunk)
    });
    (
        [
            (header::CONTENT_TYPE, "text/html; charset=utf-8"),
            (header::CACHE_CONTROL, "no-store"),
            (
                header::HeaderName::from_static("x-benchmark-engine"),
                "leptos",
            ),
        ],
        Body::from_stream(chunks),
    )
}

#[tokio::main(flavor = "multi_thread", worker_threads = 1)]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    Executor::init_tokio()?;
    let (host, port) = bind_address(5713)?;
    let boundaries = setting("SUSPENSE_BOUNDARIES", 8, 1, 256)?;
    let cards_per_panel = setting("SUSPENSE_CARDS_PER_PANEL", 12, 0, 96)?;
    let products: &'static [Product] = make_products(boundaries * cards_per_panel).leak();
    let scenario = Scenario {
        cards_per_panel,
        products,
        boundaries,
    };
    let app = Router::new()
        .route("/", get(move || async move { page(scenario) }))
        .route("/health", get(move || async move {
            Json(json!({
                "status": "ok",
                "engine": "leptos",
                "framework": "Leptos 0.7.8",
                "workerThreads": 1,
                "debugAssertions": cfg!(debug_assertions),
                "renderPath": "Leptos Suspense and Suspend with native out-of-order streaming on Axum",
                "id": "suspense_marketplace_v2",
                "boundaries": boundaries,
                "cardsPerPanel": cards_per_panel,
                "productCards": products.len(),
                "delayTiersMs": DELAY_TIERS_MS,
                "longestDelayMs": DELAY_TIERS_MS[boundaries.min(DELAY_TIERS_MS.len()) - 1],
                "asyncValueModel": "typed in-memory delayed values; no serialization or external I/O",
                "completionBoundary": "HTTP response body end after every async boundary resolves",
                "shellBoundary": "first response body byte containing the static shell and fallbacks",
            }))
        }))
        .route("/metrics", get(|| async { Json(process_metrics()) }));

    let listener = tokio::net::TcpListener::bind((host.as_str(), port)).await?;
    println!("Leptos Suspense server listening on http://{host}:{port}");
    axum::serve(listener, app).await?;
    Ok(())
}
