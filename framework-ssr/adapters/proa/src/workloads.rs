//! Cross-framework business fixture. Native Proa components render directly to
//! the production response buffer; no pre-rendered HTML is stored or reused.
use super::Currency;
use chrono::{Datelike, Timelike};
use proa_core::{DataLoader, WebContext, WebRenderSync, WriteError};
use proa_macros::{html_sync, text};
use serde::Deserialize;
use std::fmt::Write as _;
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Fixture {
    sections: Vec<Section>,
    products: Vec<Product>,
    rows: Vec<Account>,
    headers: Vec<String>,
    star_path: String,
    star_indexes: Vec<u8>,
}
#[derive(Deserialize)]
struct Section {
    id: String,
    title: String,
    cards: Vec<Card>,
}
#[derive(Deserialize)]
struct Card {
    id: String,
    title: String,
    description: String,
    features: Vec<String>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Product {
    id: u64,
    name: String,
    category: String,
    price_cents: u64,
    rating_tenths: u64,
    review_count: u64,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Account {
    id: u64,
    name: String,
    email: String,
    status: String,
    amount_cents: u64,
    tax_cents: u64,
    created_unix: i64,
    updated_unix: i64,
    score_bps: u64,
    country: String,
    tags: Vec<String>,
}
pub struct Page {
    pub fixture: &'static Fixture,
    pub workload: &'static str,
    pub request: String,
}
struct Date(i64, bool);
impl<L: DataLoader> WebRenderSync<L> for Date {
    fn render(self, cx: &mut WebContext<L>) -> Result<(), WriteError> {
        let date = chrono::DateTime::from_timestamp(self.0, 0).expect("valid fixture timestamp");
        if self.1 {
            text!(
                "{:04}-{:02}-{:02} {}:{:02} {}",
                date.year(),
                date.month(),
                date.day(),
                date.hour12().1,
                date.minute(),
                if date.hour12().0 { "PM" } else { "AM" }
            )
            .render(cx)
        } else {
            text!("{:04}-{:02}-{:02}", date.year(), date.month(), date.day()).render(cx)
        }
    }
}
impl<L: DataLoader> WebRenderSync<L> for Page {
    fn render(self, cx: &mut WebContext<L>) -> Result<(), WriteError> {
        let f = self.fixture;
        let title = match self.workload {
            "cards" => "SSR Framework Benchmark",
            "products" => "All products",
            _ => "Customer Accounts",
        };
        html_sync! {
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>{title}</title>
                </head>
                <body>
                    <main data-component="workload" data-bench-page={self.workload}>
                        <h1>{title}</h1>
                        <div data-bench-request="true">{self.request}</div>
                        {match self.workload {
                        "cards"=> {html_sync! {{for section in &f.sections {html_sync! {<section data-bench-section={section.id.as_str()}><h2>{section.title.as_str()}</h2>{for card in &section.cards {html_sync! {<article data-bench-card={card.id.as_str()}><h3>{card.title.as_str()}</h3><div data-bench-description={card.id.as_str()}>{card.description.as_str()}</div><div _a11y_ok role="list" aria-label="Features">{for feature in &card.features {html_sync! {<div _a11y_ok role="listitem">{feature.as_str()}</div>}}}</div></article>}}}</section>}}}}.render(cx)?;},
                        "products"=>{html_sync! {{for p in &f.products {let mut href=arrayvec::ArrayString::<40>::new(); write!(&mut href,"/products/{}",p.id).expect("bounded fixture URL");html_sync! {<article data-bench-product={p.id}><a href={href.as_str()}><h2>{p.name.as_str()}</h2></a><div>{p.category.as_str()}</div><div>{Currency(p.price_cents)}</div><div>{text!("{}.{:01} ({})",p.rating_tenths/10,p.rating_tenths%10,p.review_count)}</div><div aria-label="Rating">{for index in &f.star_indexes {html_sync! {<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-filled={if u64::from(*index)<(p.rating_tenths+5)/10 {"true"}else{"false"}}><path d={f.star_path.as_str()}></path></svg>}}}</div></article>}}}}.render(cx)?;},
                        _=>{html_sync! {<table><caption>"Customer Accounts"</caption><thead><tr>{for header in &f.headers {html_sync! {<th scope="col">{header.as_str()}</th>}}}</tr></thead><tbody>{for r in &f.rows {html_sync! {<tr data-bench-row={r.id}><td>{r.id}</td><td>{r.name.as_str()}</td><td>{r.email.as_str()}</td><td data-active={if r.status=="Active" {"true"}else{"false"}}>{r.status.as_str()}</td><td>{Currency(r.amount_cents)}</td><td>{Currency(r.tax_cents)}</td><td>{Currency(r.amount_cents+r.tax_cents)}</td><td>{Date(r.created_unix,false)}</td><td>{Date(r.updated_unix,true)}</td><td>{text!("{}.{:01}%",r.score_bps/100,(r.score_bps%100)/10)}</td><td>{r.country.as_str()}</td><td><div _a11y_ok role="list" aria-label="Tags">{for tag in &r.tags {html_sync! {<div _a11y_ok role="listitem">{tag.as_str()}</div>}}}</div></td></tr>}}}</tbody></table>}.render(cx)?;}
                        }}
                    </main>
                </body>
            </html>
        }.render(cx)
    }
}
