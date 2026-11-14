import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type FeatureReview,
  features,
  type Project,
  supportStates,
} from "./feature-schema.ts";

export { featureGroups, features, supportStates } from "./feature-schema.ts";

// Build-time only: adding a review file needs no parallel import/ID registry.
// Public pages consume the validated .generated/features.json instead.
export function loadFeatureReviews(
  directory = fileURLToPath(
    new URL("./data/features/reviews/", import.meta.url),
  ),
) {
  const reviews = new Map<string, FeatureReview>();
  const featureIds = features.map((feature) => feature.id).sort();
  for (const file of readdirSync(directory)
    .filter((f) => f.endsWith(".json"))
    .sort()) {
    const review = JSON.parse(
      readFileSync(join(directory, file), "utf8"),
    ) as FeatureReview;
    const context = `Feature review ${file}`;
    assert.equal(
      review.id,
      file.slice(0, -5),
      `${context}: ID must match filename`,
    );
    assert.ok(review.scope, `${context}: missing scope`);
    for (const date of [review.reviewedOn, review.updatedOn]) {
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `${context}: invalid date`);
      assert.equal(
        new Date(date).toISOString().slice(0, 10),
        date,
        `${context}: invalid date`,
      );
    }
    assert.ok(
      review.reviewedOn <= review.updatedOn,
      `${context}: review is newer than update`,
    );
    assert.deepEqual(
      Object.keys(review.capabilities).sort(),
      featureIds,
      `${context}: findings must match feature definitions`,
    );
    for (const [id, finding] of Object.entries(review.capabilities)) {
      assert.ok(
        Object.hasOwn(supportStates, finding.status),
        `${context}/${id}: invalid support status`,
      );
      assert.ok(finding.note, `${context}/${id}: missing evidence note`);
      assert.equal(
        new URL(finding.url || "").protocol,
        "https:",
        `${context}/${id}: missing HTTPS source`,
      );
    }
    reviews.set(review.id, {
      ...review,
      capabilities: Object.fromEntries(
        features.map(({ id }) => [id, review.capabilities[id]]),
      ),
    });
  }
  assert.ok(reviews.size, "No feature reviews found");
  return reviews;
}

const reviews = loadFeatureReviews();
// Aggregate dates follow the individual reviews, rather than a second index.
export const reviewedOn = [...reviews.values()]
  .map((r) => r.reviewedOn)
  .sort()[0];
export const updatedOn = [...reviews.values()]
  .map((r) => r.updatedOn)
  .sort()
  .at(-1) as string;
export const featureEvidence = Object.fromEntries(
  [...reviews].map(([id, review]) => [id, review.capabilities]),
);
export function featureRows(renderers: Project[]) {
  return renderers.map((renderer) => {
    const review = reviews.get(renderer.id);
    if (!review) throw new Error(`Missing feature review for ${renderer.id}`);
    return {
      id: renderer.id,
      label: renderer.label,
      kind: renderer.kind,
      logo: renderer.logo,
      color: renderer.color,
      scope: review.scope,
      reviewedOn: review.reviewedOn,
      updatedOn: review.updatedOn,
      capabilities: review.capabilities,
    };
  });
}
