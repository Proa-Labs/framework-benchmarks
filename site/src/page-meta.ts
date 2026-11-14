import socialCard from "./assets/frameworks-og.png?url";

const socialImageUrl = new URL(socialCard, "https://frameworks.run").href;

export function pageMeta(title: string, description: string, path: string) {
  const url = `https://frameworks.run${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: "frameworks.run" },
      { property: "og:locale", content: "en_US" },
      {
        property: "og:image",
        content: socialImageUrl,
      },
      {
        property: "og:image:secure_url",
        content: socialImageUrl,
      },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content:
          "frameworks.run — Web frameworks. Measured. Reproducible benchmarks, features with sources, by Proa Labs.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      {
        name: "twitter:image",
        content: socialImageUrl,
      },
      {
        name: "twitter:image:alt",
        content: "frameworks.run — Web frameworks. Measured.",
      },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
