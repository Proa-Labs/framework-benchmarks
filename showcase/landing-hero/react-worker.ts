// Copyright Proa Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";
import { HomePage } from "__PROA__/proa_demo/react-ssr-shared/src/home.tsx";
import { wrapInDocumentShell } from "__PROA__/proa_demo/react-ssr-shared/src/shared.tsx";
import {
  GithubPrDiffPage,
  GITHUB_PR_DIFF_CSS,
  GITHUB_PR_DIFF_JS,
} from "__PROA__/proa_demo/react-ssr-shared/src/github-pr-diff.tsx";
import {
  SentryOtelDocument,
  buildDefaultSentryLogs,
} from "__PROA__/proa_demo/react-ssr-shared/src/sentry-otel.tsx";
if (process.env.NODE_ENV !== "production")
  throw new Error("production React required");
const [page, mode, iterationArg] = process.argv.slice(2);
const css = readFileSync(
  process.env.PROA_ROOT + "/proa_showcase/src/sentry_otel/sentry_otel.css",
  "utf8",
);
const elements = {
  airbnb: React.createElement(HomePage),
  github: React.createElement(GithubPrDiffPage),
  sentry: React.createElement(SentryOtelDocument, {
    css,
    logs: buildDefaultSentryLogs(400),
    hydrate: false,
  }),
};
function render() {
  const body = renderToString(elements[page]);
  if (page === "airbnb")
    return wrapInDocumentShell(
      "Airbnb - Vacation Rentals, Cabins, Beach Houses",
      body,
    );
  if (page === "github")
    return `<!DOCTYPE html><html lang="en" data-pr-diff-demo><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Proa large PR diff demo</title><style>${GITHUB_PR_DIFF_CSS}</style></head><body>${body}<script>${GITHUB_PR_DIFF_JS}</script></body></html>`;
  if (page === "sentry") return `<!DOCTYPE html>${body}`;
  throw new Error("unknown page");
}
if (mode === "dump") process.stdout.write(render());
else {
  for (let i = 0; i < Number(mode); i++) render();
  const samples_us = [];
  let output_bytes = 0;
  let last = "";
  for (let i = 0; i < Number(iterationArg); i++) {
    const start = process.hrtime.bigint();
    last = render();
    samples_us.push(Number(process.hrtime.bigint() - start) / 1000);
    output_bytes = Buffer.byteLength(last);
  }
  console.log(
    JSON.stringify({
      samples_us,
      output_bytes,
      react: React.version,
      node: process.version,
    }),
  );
}
