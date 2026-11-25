//! Shared core fixture rendered as Leptos elements for each request.
use chrono::{Datelike, Timelike};
use leptos::prelude::*;
use serde::Deserialize;

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

pub fn page(workload: &'static str, fixture: &'static Fixture, request: &str) -> impl IntoView {
    let (title, body) = match workload {
        "cards" => ("SSR Framework Benchmark", cards(fixture).into_any()),
        "products" => ("All products", products(fixture).into_any()),
        "table" => ("Customer Accounts", table(fixture).into_any()),
        _ => unreachable!("registered workload"),
    };
    view! {
        <!DOCTYPE html>
        <html lang="en">
            <head><title>{title}</title></head>
            <body>
                <main data-component="workload" data-bench-page=workload>
                    <h1>{title}</h1>
                    <div data-bench-request="true">{request.to_owned()}</div>
                    {body}
                </main>
            </body>
        </html>
    }
}

fn cards(fixture: &'static Fixture) -> impl IntoView {
    fixture.sections.iter().map(|section| view! {
        <section data-bench-section=section.id.as_str()>
            <h2>{section.title.as_str()}</h2>
            {section.cards.iter().map(|card| view! {
                <article data-bench-card=card.id.as_str()>
                    <h3>{card.title.as_str()}</h3>
                    <div data-bench-description=card.id.as_str()>{card.description.as_str()}</div>
                    <div role="list" aria-label="Features">
                        {card.features.iter().map(|feature| view! {
                            <div role="listitem">{feature.as_str()}</div>
                        }).collect_view()}
                    </div>
                </article>
            }).collect_view()}
        </section>
    }).collect_view()
}

fn products(fixture: &'static Fixture) -> impl IntoView {
    fixture
        .products
        .iter()
        .map(|product| {
            view! {
                <article data-bench-product=product.id>
                    <a href=format!("/products/{}", product.id)><h2>{product.name.as_str()}</h2></a>
                    <div>{product.category.as_str()}</div>
                    <div>{currency(product.price_cents)}</div>
                    <div>{format!(
                        "{}.{:01} ({})",
                        product.rating_tenths / 10,
                        product.rating_tenths % 10,
                        product.review_count,
                    )}</div>
                    <div aria-label="Rating">
                        {fixture.star_indexes.iter().map(|index| {
                            let filled = u64::from(*index) < (product.rating_tenths + 5) / 10;
                            view! {
                                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                                    data-filled=if filled { "true" } else { "false" }>
                                    <path d=fixture.star_path.as_str()></path>
                                </svg>
                            }
                        }).collect_view()}
                    </div>
                </article>
            }
        })
        .collect_view()
}

fn table(fixture: &'static Fixture) -> impl IntoView {
    view! {
        <table>
            <caption>"Customer Accounts"</caption>
            <thead><tr>{fixture.headers.iter().map(|header| view! {
                <th scope="col">{header.as_str()}</th>
            }).collect_view()}</tr></thead>
            <tbody>{fixture.rows.iter().map(|row| view! {
                <tr data-bench-row=row.id>
                    <td>{row.id}</td><td>{row.name.as_str()}</td><td>{row.email.as_str()}</td>
                    <td data-active=if row.status == "Active" { "true" } else { "false" }>
                        {row.status.as_str()}
                    </td>
                    <td>{currency(row.amount_cents)}</td>
                    <td>{currency(row.tax_cents)}</td>
                    <td>{currency(row.amount_cents + row.tax_cents)}</td>
                    <td>{date(row.created_unix, false)}</td>
                    <td>{date(row.updated_unix, true)}</td>
                    <td>{format!("{}.{:01}%", row.score_bps / 100, (row.score_bps % 100) / 10)}</td>
                    <td>{row.country.as_str()}</td>
                    <td><div role="list" aria-label="Tags">
                        {row.tags.iter().map(|tag| view! { <div role="listitem">{tag.as_str()}</div> }).collect_view()}
                    </div></td>
                </tr>
            }).collect_view()}</tbody>
        </table>
    }
}

fn currency(cents: u64) -> String {
    format!("${}.{:02}", cents / 100, cents % 100)
}

fn date(timestamp: i64, with_time: bool) -> String {
    let date = chrono::DateTime::from_timestamp(timestamp, 0).expect("valid fixture timestamp");
    if with_time {
        let (pm, hour) = date.hour12();
        format!(
            "{:04}-{:02}-{:02} {}:{:02} {}",
            date.year(),
            date.month(),
            date.day(),
            hour,
            date.minute(),
            if pm { "PM" } else { "AM" },
        )
    } else {
        format!("{:04}-{:02}-{:02}", date.year(), date.month(), date.day())
    }
}
