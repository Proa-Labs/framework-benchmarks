import { loader } from "fumadocs-core/source";
import { defineCollections } from "fumadocs-mdx/macro";
import { z } from "zod";

const articles = defineCollections({
  type: "doc",
  dir: "content/blog",
  files: ["*.mdx"],
  async: true,
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    author: z.string().min(1),
    date: z.iso.date(),
    cover: z
      .object({
        src: z.string().startsWith("/"),
        alt: z.string().min(1),
      })
      .optional(),
  }),
});

const source = loader({
  baseUrl: "/blog",
  source: articles.toFumadocsSource(),
});

export const posts = source
  .getPages()
  .toSorted((left, right) => right.data.date.localeCompare(left.data.date));

export const getPost = (slug: string) => source.getPage([slug]);

const postDateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function formatPostDate(date: string) {
  return postDateFormat.format(new Date(date));
}
