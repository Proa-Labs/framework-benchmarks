import definitions from "./feature-definitions.json" with { type: "json" };

export const featureGroups = definitions.featureGroups;
export const features = definitions.features;
export const supportStates = definitions.supportStates;
export const expandedFeatures = features.filter((feature) =>
  definitions.expandedFeatureIds.includes(feature.id),
);
export type Feature = (typeof features)[number];
export type SupportStatus = keyof typeof supportStates;
export interface Capability {
  status: SupportStatus;
  note: string;
  url?: string;
  label?: string;
  reviewedOn?: string;
  assessment?: {
    summary: string;
    strengths: string[];
    tradeoffs: string[];
  };
}
export interface FeatureReview {
  id: string;
  scope: string;
  reviewedOn: string;
  updatedOn: string;
  capabilities: Record<string, Capability>;
}
export interface Project {
  id: string;
  label: string;
  kind: string;
  logo: string;
  color: string;
}
export type FeatureRow = Project & FeatureReview;
