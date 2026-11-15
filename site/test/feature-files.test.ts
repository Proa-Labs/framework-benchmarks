import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { FeatureReview } from "../feature-schema.ts";
import { loadFeatureReviews } from "../features-data.ts";

function withReviews(run: (directory: string, review: FeatureReview) => void) {
  const directory = mkdtempSync(join(tmpdir(), "feature-reviews-"));
  const review = JSON.parse(
    readFileSync(
      new URL("../data/features/reviews/askama.json", import.meta.url),
      "utf8",
    ),
  ) as FeatureReview;
  try {
    run(directory, review);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("framework review files are discovered automatically in stable ID order", () => {
  withReviews((directory, review) => {
    const save = (id: string) =>
      writeFileSync(
        join(directory, `${id}.json`),
        JSON.stringify({ ...review, id }),
      );
    save("zeta");
    save("alpha");
    writeFileSync(join(directory, "README.md"), "Not a review");
    assert.deepEqual(
      [...loadFeatureReviews(directory).keys()],
      ["alpha", "zeta"],
    );
    save("beta");
    const loaded = loadFeatureReviews(directory);
    assert.deepEqual([...loaded.keys()], ["alpha", "beta", "zeta"]);
    assert.deepEqual(loaded.get("beta")?.capabilities, review.capabilities);
  });
});

test("review files reject missing/new feature mismatches and invalid support states", () => {
  withReviews((directory, review) => {
    for (const [mutate, error] of [
      [
        (r: FeatureReview) => {
          delete r.capabilities.ssr;
        },
        /findings must match feature definitions/,
      ],
      [
        (r: FeatureReview) => {
          r.capabilities.futureFeature = r.capabilities.ssr;
        },
        /findings must match feature definitions/,
      ],
      [
        (r: FeatureReview) => {
          Object.assign(r.capabilities.ssr, { status: "supported-ish" });
        },
        /invalid support status/,
      ],
    ] as const) {
      const invalid = structuredClone(review);
      mutate(invalid);
      writeFileSync(join(directory, "askama.json"), JSON.stringify(invalid));
      assert.throws(() => loadFeatureReviews(directory), error);
    }
  });
});

test("review filenames and chronology cannot silently misidentify a framework", () => {
  withReviews((directory, review) => {
    writeFileSync(
      join(directory, "different-project.json"),
      JSON.stringify(review),
    );
    assert.throws(
      () => loadFeatureReviews(directory),
      /ID must match filename/,
    );
    rmSync(join(directory, "different-project.json"));
    writeFileSync(
      join(directory, "askama.json"),
      JSON.stringify({ ...review, updatedOn: "2000-01-01" }),
    );
    assert.throws(
      () => loadFeatureReviews(directory),
      /review is newer than update/,
    );
  });
});
