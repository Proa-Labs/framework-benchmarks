import reviewData from "./feature-reviews.json" with { type: "json" };
import {
  type Capability,
  type FeatureReview,
  type Project,
  supportStates,
} from "./feature-schema.ts";

export { featureGroups, features, supportStates } from "./feature-schema.ts";
export const { reviewedOn, updatedOn } = reviewData;

// The registry contains final findings, rather than a chain of review patches.
const reviews = new Map<string, FeatureReview>(
  reviewData.reviews.map((review) => [
    review.id,
    {
      ...review,
      capabilities: Object.fromEntries(
        Object.entries(review.capabilities).map(([id, finding]) => {
          if (!(finding.status in supportStates))
            throw new Error(`Invalid support status: ${review.id}/${id}`);
          return [id, finding as Capability];
        }),
      ),
    },
  ]),
);
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
