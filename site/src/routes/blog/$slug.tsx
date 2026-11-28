import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPost } from "../../../blog-tooling/posts.ts";
import { pageMeta } from "../../page-meta.ts";
import { BlogArticle } from "../../pages/BlogPage.tsx";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params: { slug } }) => {
    const { getPost } = await import("../../../blog-tooling/posts.ts");
    const post = getPost(slug);
    if (!post) throw notFound({ routeId: "__root__" });
    await post.data.preload();
    const { title, description, date, author } = post.data;
    return { title, description, date, author, url: post.url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { title, description, date, author, url } = loaderData;
    const head = pageMeta(`${title} · Frameworks`, description, url, "article");
    head.meta.push(
      { name: "author", content: author },
      { property: "article:published_time", content: date },
    );
    return head;
  },
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const post = getPost(slug);
  if (!post) throw notFound({ routeId: "__root__" });
  return <BlogArticle post={post} />;
}
