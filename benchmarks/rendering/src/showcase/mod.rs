//! Shared prepared showcase data. Every measured backend executes native code
//! generated from the same fixed layout, branches and collection records.
use serde::Deserialize;

pub const IDS: [&str; 5] = [
    "airbnb-home",
    "nike-catalog",
    "github-pr",
    "sentry-otel",
    "espn",
];
#[derive(Debug)]
pub struct Data {
    pub texts: Vec<String>,
    pub groups: Vec<Vec<&'static Data>>,
    pub variants: Vec<usize>,
}
impl Data {
    pub fn variant(&self, index: usize) -> usize {
        self.variants[index]
    }
}
#[derive(Deserialize)]
struct RawData {
    texts: Vec<String>,
    groups: Vec<Vec<usize>>,
    variants: Vec<usize>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Controls {
    pub title_index: usize,
    pub request_index: usize,
    pub text: TextControl,
}
#[derive(Deserialize)]
pub struct TextControl {
    pub record: usize,
    pub slot: usize,
}
#[derive(Deserialize)]
struct Definition {
    root: usize,
    controls: Controls,
}
pub struct Fixture {
    pub data: &'static Data,
    pub controls: Controls,
}
// proa-perf-ok(scope): one-time, process-lifetime input preparation; never called in a render timer.
pub fn prepare(id: &str) -> Fixture {
    prepare_with_probe(id, "baseline")
}

// proa-perf-ok(scope): independent fixture inputs for untimed native admission.
pub fn prepare_with_probe(id: &str, probe: &str) -> Fixture {
    let (definition, records) = match id {
        "airbnb-home" => (
            include_str!("../../showcase/fixtures/airbnb-home.json"),
            include_str!("../../showcase/fixtures/airbnb-home.jsonl"),
        ),
        "nike-catalog" => (
            include_str!("../../showcase/fixtures/nike-catalog.json"),
            include_str!("../../showcase/fixtures/nike-catalog.jsonl"),
        ),
        "github-pr" => (
            include_str!("../../showcase/fixtures/github-pr.json"),
            include_str!("../../showcase/fixtures/github-pr.jsonl"),
        ),
        "sentry-otel" => (
            include_str!("../../showcase/fixtures/sentry-otel.json"),
            include_str!("../../showcase/fixtures/sentry-otel.jsonl"),
        ),
        "espn" => (
            include_str!("../../showcase/fixtures/espn.json"),
            include_str!("../../showcase/fixtures/espn.jsonl"),
        ),
        _ => panic!("unknown showcase fixture"),
    };
    let definition: Definition = serde_json::from_str(definition).unwrap();
    let mut raw: Vec<RawData> = records
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    let changed = "</span><img id=\"escaped-probe\" src=x> & < > \" ' ✓";
    match probe {
        "baseline" => {}
        "title" => raw[definition.root].texts[definition.controls.title_index] = changed.into(),
        "request" => raw[definition.root].texts[definition.controls.request_index] = changed.into(),
        "text" => {
            raw[definition.controls.text.record].texts[definition.controls.text.slot] =
                changed.into()
        }
        _ => panic!("unknown input probe"),
    }
    let mut pool: Vec<Option<&'static Data>> = vec![None; raw.len()];
    for (index, record) in raw.into_iter().enumerate().rev() {
        let groups = record
            .groups
            .into_iter()
            .map(|ids| {
                ids.into_iter()
                    .map(|child| {
                        assert!(
                            child > index,
                            "fixture records must be acyclic and topologically ordered"
                        );
                        pool[child].unwrap()
                    })
                    .collect()
            })
            .collect();
        pool[index] = Some(Box::leak(Box::new(Data {
            texts: record.texts,
            groups,
            variants: record.variants,
        })));
    }
    Fixture {
        data: pool[definition.root].unwrap(),
        controls: definition.controls,
    }
}
include!(concat!(env!("OUT_DIR"), "/showcase_generated.rs"));

pub fn render_proa(id: &str, data: &'static Data, request: &str) -> proa_core::RenderBuffer {
    match id {
        "airbnb-home" => proa::airbnb_home::render(data, request),
        "nike-catalog" => proa::nike_catalog::render(data, request),
        "github-pr" => proa::github_pr::render(data, request),
        "sentry-otel" => proa::sentry_otel::render(data, request),
        "espn" => proa::espn::render(data, request),
        _ => panic!("unknown showcase fixture"),
    }
}

pub fn render_template(engine: &str, id: &str, data: &'static Data, request: &str) -> String {
    match (engine, id) {
        ("askama", "airbnb-home") => askama::airbnb_home::render(data, request),
        ("askama", "nike-catalog") => askama::nike_catalog::render(data, request),
        ("askama", "github-pr") => askama::github_pr::render(data, request),
        ("askama", "sentry-otel") => askama::sentry_otel::render(data, request),
        ("askama", "espn") => askama::espn::render(data, request),
        ("sailfish", "airbnb-home") => sailfish::airbnb_home::render(data, request),
        ("sailfish", "nike-catalog") => sailfish::nike_catalog::render(data, request),
        ("sailfish", "github-pr") => sailfish::github_pr::render(data, request),
        ("sailfish", "sentry-otel") => sailfish::sentry_otel::render(data, request),
        ("sailfish", "espn") => sailfish::espn::render(data, request),
        ("leptos", "airbnb-home") => leptos::airbnb_home::render(data, request),
        ("leptos", "nike-catalog") => leptos::nike_catalog::render(data, request),
        ("leptos", "github-pr") => leptos::github_pr::render(data, request),
        ("leptos", "sentry-otel") => leptos::sentry_otel::render(data, request),
        ("leptos", "espn") => leptos::espn::render(data, request),
        ("dioxus", "airbnb-home") => dioxus::airbnb_home::render(data, request),
        ("dioxus", "nike-catalog") => dioxus::nike_catalog::render(data, request),
        ("dioxus", "github-pr") => dioxus::github_pr::render(data, request),
        ("dioxus", "sentry-otel") => dioxus::sentry_otel::render(data, request),
        ("dioxus", "espn") => dioxus::espn::render(data, request),
        _ => panic!("unknown showcase template"),
    }
}

/// A native Leptos view for the complete-document HTTP renderer.
pub fn leptos_view(id: &str, data: &'static Data, request: &str) -> ::leptos::prelude::AnyView {
    match id {
        "airbnb-home" => leptos::airbnb_home::view(data, request),
        "nike-catalog" => leptos::nike_catalog::view(data, request),
        "github-pr" => leptos::github_pr::view(data, request),
        "sentry-otel" => leptos::sentry_otel::view(data, request),
        "espn" => leptos::espn::view(data, request),
        _ => panic!("unknown showcase fixture"),
    }
}

#[cfg(feature = "topcoat")]
pub fn render_topcoat(
    cx: &::topcoat::context::Cx,
    id: &str,
    data: &'static Data,
    request: &str,
) -> String {
    match id {
        "airbnb-home" => topcoat::airbnb_home::render(cx, data, request),
        "nike-catalog" => topcoat::nike_catalog::render(cx, data, request),
        "github-pr" => topcoat::github_pr::render(cx, data, request),
        "sentry-otel" => topcoat::sentry_otel::render(cx, data, request),
        "espn" => topcoat::espn::render(cx, data, request),
        _ => panic!("unknown showcase fixture"),
    }
}

// Dioxus SSR 0.6.2 writes dynamic attribute strings verbatim. Escape at the
// attribute boundary, inside the measured native component construction. Text
// nodes retain Dioxus's ordinary escaping. Most prepared attributes borrow.
pub fn escape_dioxus_attribute(value: &str) -> std::borrow::Cow<'_, str> {
    if !value
        .bytes()
        .any(|c| matches!(c, b'&' | b'"' | b'<' | b'>'))
    {
        return std::borrow::Cow::Borrowed(value);
    }
    let mut escaped = String::new();
    for c in value.chars() {
        match c {
            '&' => escaped.push_str("&amp;"),
            '"' => escaped.push_str("&quot;"),
            '<' => escaped.push_str("&lt;"),
            '>' => escaped.push_str("&gt;"),
            _ => escaped.push(c),
        }
    }
    std::borrow::Cow::Owned(escaped)
}

pub fn render_proa_into<L: proa_core::DataLoader>(
    id: &str,
    data: &'static Data,
    request: &str,
    cx: &mut proa_core::WebContext<L>,
) -> Result<(), proa_core::WriteError> {
    match id {
        "airbnb-home" => proa::airbnb_home::render_into(data, request, cx),
        "nike-catalog" => proa::nike_catalog::render_into(data, request, cx),
        "github-pr" => proa::github_pr::render_into(data, request, cx),
        "sentry-otel" => proa::sentry_otel::render_into(data, request, cx),
        "espn" => proa::espn::render_into(data, request, cx),
        _ => panic!("unknown showcase fixture"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use proa_core::WriteBuf;
    #[test]
    fn showcase_outputs_own_independent_pages() {
        for id in IDS {
            let fixture = prepare(id);
            let first = render_proa(id, fixture.data, "first");
            let saved = first.to_vec();
            let second = render_proa(id, fixture.data, "second");
            assert_ne!(
                first.slices().next().unwrap().as_ptr(),
                second.slices().next().unwrap().as_ptr()
            );
            assert_ne!(first.to_vec(), second.to_vec());
            drop(second);
            assert_eq!(first.to_vec(), saved);
            assert!(first.page_count() > 1);
        }
    }
}
