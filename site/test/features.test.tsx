import assert from "node:assert/strict";
import test from "node:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadInputs, normalize } from "../data.ts";
import type { Project, SupportStatus } from "../feature-schema.ts";
import { expandedFeatures } from "../feature-schema.ts";
import {
  featureEvidence,
  featureGroups,
  featureRows,
  features,
  supportStates,
} from "../features-data.ts";
import { required } from "../required.ts";
import { CoverageBar, FeaturesPage } from "../src/pages/FeaturesPage.tsx";

const renderCoverageBar = (
  row: Parameters<typeof CoverageBar>[0]["row"],
  group = "all",
) =>
  renderToStaticMarkup(
    createElement(CoverageBar, { row, group, onSelect() {} }),
  );
const renderFeatures = (renderers: Project[]) =>
  renderToStaticMarkup(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({
          initialEntries: ["/features?display=matrix"],
        }),
      })}
    >
      <FeaturesPage rows={featureRows(renderers)} />
    </RouterContextProvider>,
  );

import {
  brandStyle,
  contrastRatio,
  readableBrand,
} from "../src/brand-colors.ts";
import { readToolSelection } from "../src/feature-selection.ts";
import {
  sortCoverageRows,
  summarizeCapabilities,
} from "../src/feature-summary.ts";

test("every roster entry has explicit capability states and sourced support claims", async () => {
  const renderers = normalize((await loadInputs()).input).ecosystem;
  const rows = featureRows(renderers);
  assert.deepEqual(
    rows.map((row) => row.id),
    renderers.map((renderer) => renderer.id),
  );
  assert.equal(
    new Set(features.map((feature) => feature.id)).size,
    features.length,
  );
  const categories = new Set(featureGroups.map((group) => group.id));
  assert.equal(categories.size, featureGroups.length);
  for (const feature of features) assert.ok(categories.has(feature.group));
  for (const group of featureGroups) {
    assert.ok(group.description);
    assert.ok(features.some((feature) => feature.group === group.id));
  }
  for (const evidence of Object.values(featureEvidence))
    for (const key of Object.keys(evidence))
      assert.ok(
        key === "scope" || features.some((feature) => feature.id === key),
      );
  for (const row of rows) {
    assert.ok(row.scope);
    assert.match(row.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.deepEqual(
      Object.keys(row.capabilities),
      features.map((feature) => feature.id),
    );
    for (const capability of Object.values(row.capabilities)) {
      assert.notEqual(capability.status, "unknown", `${row.id} needs review`);
      assert.ok(Object.hasOwn(supportStates, capability.status));
      assert.ok(capability.note);
      if (capability.assessment) {
        assert.notEqual(capability.status, "unknown");
        assert.ok(capability.assessment.summary);
        assert.ok(capability.assessment.strengths.length);
        assert.ok(capability.assessment.tradeoffs.length);
      }
      if (capability.status !== "unknown") {
        assert.equal(new URL(required(capability.url)).protocol, "https:");
        assert.equal(new URL(required(capability.url)).username, "");
      }
    }
  }
  assert.throws(() =>
    featureRows([
      {
        id: "unreviewed-new-project",
        label: "Fixture",
        kind: "Renderer",
        logo: "fixture.svg",
        color: "#000000",
      },
    ]),
  );
});

test("coverage counts keep limited, planned, and unestablished findings separate", () => {
  const states = Object.keys(supportStates) as SupportStatus[];
  const row = {
    capabilities: Object.fromEntries(
      features.map((feature, index) => [
        feature.id,
        { status: states[index % states.length] },
      ]),
    ),
  };
  const all = summarizeCapabilities(row);
  assert.equal(all.total, features.length);
  assert.equal(
    Object.values(all.counts).reduce((sum, count) => sum + count, 0),
    all.total,
  );
  for (const [index, status] of states.entries()) {
    assert.equal(
      all.counts[status],
      features.filter((_, i) => i % states.length === index).length,
    );
  }
  const rendering = summarizeCapabilities(row, "rendering");
  const selected = features.filter((feature) => feature.group === "rendering");
  assert.equal(rendering.total, selected.length);
  assert.deepEqual(
    Object.values(rendering.counts),
    states.map(
      (status) =>
        selected.filter(
          (feature) => row.capabilities[feature.id].status === status,
        ).length,
    ),
  );
});

test("supported totals include packages and exclude qualifications and unknowns", () => {
  const statuses: SupportStatus[] = [
    "native",
    "official",
    "community",
    "partial",
    "planned",
    "undocumented",
    "scope",
    "unknown",
  ];
  const row = {
    capabilities: Object.fromEntries(
      features.map((feature, index) => [
        feature.id,
        { status: statuses[index] || "scope" },
      ]),
    ),
  };
  assert.equal(summarizeCapabilities(row).supported, 3);
  assert.equal(summarizeCapabilities(row, "rendering").supported, 3);
  const bar = renderCoverageBar({ ...row, label: "Fixture" });
  assert.deepEqual(
    [...bar.matchAll(/data-coverage="([^"]+)"/g)].map((match) => match[1]),
    ["native", "official", "community"],
  );
  const width = [...bar.matchAll(/--coverage-width:([\d.]+)%/g)].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  );
  assert.ok(Math.abs(width - 300 / features.length) < 1e-8);
});

test("coverage sorting uses the chosen counts, category, and direction", () => {
  const fixture = (label: string, status: SupportStatus, count: number) => ({
    label,
    capabilities: Object.fromEntries(
      features.map((feature, index) => [
        feature.id,
        { status: index < count ? status : "scope" },
      ]),
    ),
  });
  const rows = [
    fixture("Beta", "native", 2),
    fixture("Gamma", "partial", 8),
    fixture("Alpha", "community", 3),
  ];
  const labels = (key: string, direction: string, group = "rendering") =>
    sortCoverageRows(rows, group, key, direction).map((row) => row.label);
  assert.deepEqual(labels("tool", "asc"), ["Alpha", "Beta", "Gamma"]);
  assert.deepEqual(labels("tool", "desc"), ["Gamma", "Beta", "Alpha"]);
  assert.deepEqual(labels("support", "desc"), ["Alpha", "Beta", "Gamma"]);
  assert.deepEqual(labels("support", "asc"), ["Gamma", "Beta", "Alpha"]);
  assert.deepEqual(labels("supported", "desc"), ["Alpha", "Beta", "Gamma"]);
  assert.deepEqual(labels("support", "desc", "server"), [
    "Alpha",
    "Beta",
    "Gamma",
  ]);
  assert.deepEqual(
    rows.map((row) => row.label),
    ["Beta", "Gamma", "Alpha"],
  );
});

test("the static matrix retains evidence controls and escapes project labels", () => {
  const html = renderFeatures([
    {
      id: "react",
      label: '<script>alert("x")</script>',
      kind: "UI library",
      logo: "logos/react.svg",
      color: "#000000",
    },
  ]);
  assert.doesNotMatch(html, /<script>/);
  assert.equal(
    (html.match(/data-feature-cell=/g) || []).length,
    features.length,
  );
  assert.match(html, /<caption class="sr-only">/);
  assert.match(html, /aria-labelledby="feature-dialog-title"/);
  assert.match(html, /<input type="checkbox" data-feature-type=/);
  assert.match(html, /role="combobox"[^>]*aria-controls="fw-tool-options"/);
  assert.match(html, /role="listbox"[^>]*aria-multiselectable="true"/);
});

test("tool selection preserves saved comparisons and distinguishes all from none", () => {
  const rows = [
    { id: "nextjs", label: "Next.js" },
    { id: "astro", label: "Astro" },
    { id: "react", label: "React" },
  ];
  assert.equal(readToolSelection(new URLSearchParams(), rows), null);
  assert.deepEqual(
    [...required(readToolSelection(new URLSearchParams("tools="), rows))],
    [],
  );
  assert.deepEqual(
    [
      ...required(
        readToolSelection(
          new URLSearchParams("tools=nextjs,bogus,nextjs,astro"),
          rows,
        ),
      ),
    ],
    ["nextjs", "astro"],
  );
  assert.deepEqual(
    [
      ...required(
        readToolSelection(new URLSearchParams("q=Next.js,Astro"), rows),
      ),
    ],
    ["nextjs", "astro"],
  );
  assert.deepEqual(
    [
      ...required(
        readToolSelection(new URLSearchParams("q=does-not-exist"), rows),
      ),
    ],
    [],
  );
});

test("feature-only projects never acquire timed benchmark rows", async () => {
  const data = normalize((await loadInputs()).input);
  for (const id of [
    "remix",
    "tanstack-start",
    "solid",
    "solidstart",
    "nuxt",
    "laravel",
  ]) {
    assert.ok(data.ecosystem.some((project) => project.id === id));
    assert.ok(!data.renderers.some((renderer) => renderer.id === id));
    for (const rows of Object.values(data.rendering.rows))
      assert.ok(!rows.some((row) => row.id === id));
  }
});

test("review qualifications distinguish delivered APIs from adjacent behavior", () => {
  for (const feature of [
    "orm",
    "migrations",
    "transactions",
    "jobs",
    "mail",
    "uploads",
    "realtime",
  ])
    assert.equal(featureEvidence.rails[feature].status, "native");
  assert.equal(featureEvidence.php.orm.status, "scope");
  assert.equal(featureEvidence.php.transactions.status, "official");
  assert.equal(featureEvidence.laravel.orm.status, "native");
  assert.equal(featureEvidence.exact.suspense.status, "undocumented");
  assert.equal(featureEvidence.vue.suspense.status, "partial");
  assert.equal(featureEvidence.nuxt.streaming.status, "partial");
  assert.equal(featureEvidence.react.observability.status, "native");
  assert.equal(
    featureEvidence["go-html-template"].types.status,
    "undocumented",
  );
  for (const entry of Object.values(featureEvidence))
    for (const finding of Object.values(entry))
      if (finding.status === "partial")
        assert.ok(finding.label && finding.reviewedOn);
});

test("every brand hue has readable hover shades in both themes", async () => {
  const renderers = normalize((await loadInputs()).input).ecosystem;
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(contrastRatio("#777777", "#777777"), 1);
  for (const renderer of renderers) {
    if (renderer.color === "var(--fw-fg)") {
      assert.equal(brandStyle(renderer.color), "--brand:var(--fw-fg)");
      continue;
    }
    for (const background of ["#eaf0f7", "#0e1116"]) {
      const shade = readableBrand(renderer.color, background);
      assert.ok(contrastRatio(shade, background) >= 4.5, renderer.id);
      if (contrastRatio(renderer.color, background) >= 4.5)
        assert.equal(shade, renderer.color);
    }
  }
  assert.throws(() => brandStyle("red;display:none"));
});

test("navigation and security distinguish prefetch, soft visits, animation and nonce coordination", () => {
  const byId = new Map(features.map((feature) => [feature.id, feature]));
  assert.equal(required(byId.get("prefetch")).label, "Link prefetching");
  assert.equal(required(byId.get("softNavigation")).group, "routing");
  assert.equal(required(byId.get("viewTransitions")).group, "routing");
  assert.equal(required(byId.get("cspNonce")).group, "security");
  assert.equal(featureEvidence.proa.softNavigation.status, "community");
  assert.equal(featureEvidence.rails.softNavigation.status, "official");
  assert.equal(featureEvidence.exact.softNavigation.status, "native");
  assert.equal(featureEvidence.remix.viewTransitions.status, "undocumented");
  assert.equal(
    featureEvidence["tanstack-start"].viewTransitions.status,
    "native",
  );
  assert.equal(featureEvidence.nextjs.viewTransitions.status, "partial");
  assert.equal(featureEvidence.astro.cspNonce.status, "undocumented");
  assert.equal(featureEvidence.laravel.cspNonce.status, "partial");
  assert.equal(featureEvidence.nuxt.cspNonce.status, "community");
  assert.equal(featureEvidence.sveltekit.cspNonce.status, "native");
  assert.equal(featureEvidence.askama.cspNonce.status, "scope");
  assert.equal(featureEvidence.php.softNavigation.status, "scope");
  for (const row of Object.values(featureEvidence))
    for (const key of ["softNavigation", "viewTransitions", "cspNonce"])
      assert.equal(row[key].reviewedOn, "2026-11-11");
});

test("expanded review keeps security, mutation and host-library contracts distinct", () => {
  assert.equal(expandedFeatures.length, 22);
  for (const entry of Object.values(featureEvidence)) {
    for (const feature of expandedFeatures) {
      const finding = entry[feature.id];
      assert.equal(finding.reviewedOn, "2026-11-11");
      assert.notEqual(finding.status, "unknown");
      assert.ok(finding.url && finding.note);
    }
  }
  assert.equal(featureEvidence.php.xssEscaping.status, "partial");
  assert.equal(featureEvidence.rails.htmlSanitization.status, "native");
  assert.equal(featureEvidence.proa.htmlSanitization.status, "undocumented");
  assert.equal(featureEvidence.laravel.authorization.status, "native");
  assert.equal(featureEvidence.nextjs.authorization.status, "partial");
  assert.equal(featureEvidence.rails.scheduling.status, "official");
  assert.equal(featureEvidence.laravel.scheduling.status, "native");
  assert.equal(featureEvidence.php.fieldEncryption.status, "scope");
  assert.equal(featureEvidence.react.requestCancellation.status, "community");
  assert.notEqual(
    featureEvidence.remix.requestCancellation.status,
    "community",
  );
  assert.equal(
    featureEvidence.svelte.navigationAccessibility.status,
    "official",
  );
  assert.equal(
    featureEvidence.sveltekit.navigationAccessibility.status,
    "native",
  );
  assert.equal(featureEvidence.vue.requestCancellation.status, "partial");
  assert.equal(featureEvidence.exact.optimisticUi.status, "native");
  assert.equal(featureEvidence.proa.optimisticUi.status, "undocumented");
  for (const key of ["forms", "orm", "environment", "serverHosting"]) {
    const entries = Object.values(featureEvidence).filter(
      (entry) => entry[key]?.assessment,
    );
    assert.ok(entries.length > 0);
    for (const entry of entries) {
      assert.ok(required(entry[key].assessment).strengths.length);
      assert.ok(required(entry[key].assessment).tradeoffs.length);
    }
  }
});
