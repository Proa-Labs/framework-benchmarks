//! The new shared catalog fixture over Proa's normal production Axum SSR route.
use axum::{extract::Query, routing::get, Json};
use proa_core::{DataLoader, WebContext, WebRenderSync, WriteError};
use proa_framework_axum::manifest::IslandManifest;
use proa_framework_axum::{router_from_spec, Route, RouteContextLayer, RouteResponse};
use proa_macros::{html_sync, text};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Card {
    id: String,
    title: String,
    category: String,
    description: String,
    price_cents: u64,
    in_stock: bool,
    tags: Vec<String>,
}
#[derive(Deserialize)]
struct Parameters {
    request: Option<String>,
}
struct Currency(u64);
impl<L: DataLoader> WebRenderSync<L> for Currency {
    fn render(self, cx: &mut WebContext<L>) -> Result<(), WriteError> {
        text!("${}.{:02}", self.0 / 100, self.0 % 100).render(cx)
    }
}
// This fixture's authored output contract is HTML only; no Markdown is measured.
struct Catalog {
    cards: &'static [Card],
    request: String,
}
impl<L: DataLoader> WebRenderSync<L> for Catalog {
    // Shared cross-framework contract uses explicit ARIA lists, supported by Exact.
    fn render(self, cx: &mut WebContext<L>) -> Result<(), WriteError> {
        html_sync! {
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>"Framework catalog benchmark"</title>
                </head>
                <body>
                    <main data-component="catalog" data-bench-page="catalog">
                        <h1>"Product catalog"</h1>
                        <div data-bench-request="true">{self.request}</div>
                        {for card in self.cards {
                            html_sync! {
                                <article data-bench-card={card.id.as_str()}>
                                    <h2 data-bench-title={card.id.as_str()}>{card.title.as_str()}</h2>
                                    <div data-bench-category={card.id.as_str()}>{card.category.as_str()}</div>
                                    <div data-bench-description={card.id.as_str()}>{card.description.as_str()}</div>
                                    <div data-bench-price={card.id.as_str()}>{Currency(card.price_cents)}</div>
                                    <div data-bench-stock={card.id.as_str()}>{if card.in_stock { "In stock" } else { "Out of stock" }}</div>
                                    <div _a11y_ok role="list" aria-label="Tags" data-bench-tags={card.id.as_str()}>
                                        {for tag in &card.tags { html_sync! { <div _a11y_ok role="listitem">{tag.as_str()}</div> } }}
                                    </div>
                                </article>
                            }
                        }}
                    </main>
                </body>
            </html>
        }.render(cx)
    }
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Health {
    status: &'static str,
    engine: &'static str,
    framework: &'static str,
    worker_threads: usize,
}
#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // proa-perf-ok: shared fixture deserialization and allocation happen once, before listening.
    let cards: &'static [Card] = Box::leak(
        serde_json::from_str::<Vec<Card>>(include_str!("../cards.json"))?.into_boxed_slice(),
    );
    let routes = vec![
        Route::endpoint(
            "/catalog",
            get(move |Query(parameters): Query<Parameters>| async move {
                (
                    [(axum::http::header::CACHE_CONTROL, "no-store")],
                    RouteResponse::ssr(Catalog {
                        cards,
                        request: parameters.request.unwrap_or_default(),
                    }),
                )
            }),
        ),
        Route::endpoint(
            "/health",
            get(|| async {
                Json(Health {
                    status: "ok",
                    engine: "proa",
                    framework: "Proa 7ffb8a19ecfa",
                    worker_threads: 1,
                })
            }),
        ),
        Route::endpoint(
            "/metrics",
            get(|| async { Json(proa_bench::http_load::process_metrics()) }),
        ),
    ];
    let manifest = Arc::new(IslandManifest {
        islands: Default::default(),
        assets: Default::default(),
        import_map: Default::default(),
        ssr_bundle: Default::default(),
    });
    let (router, metadata) = router_from_spec(routes);
    let port: u16 = std::env::var("PORT")?.parse()?;
    let listener = tokio::net::TcpListener::bind(("127.0.0.1", port)).await?;
    axum::serve(
        listener,
        router.layer(RouteContextLayer::new(manifest, metadata)),
    )
    .await?;
    Ok(())
}
