import { Link, Outlet } from "@tanstack/react-router";
import { use } from "react";
import { formatPostDate, posts } from "../blog/posts.ts";
import { Footer } from "../components/Footer.tsx";
import { Header } from "../components/Header.tsx";

export function BlogLayout() {
  return (
    <div id="frameworks-explorer">
      <a className="skip-link" href="#blog-content">
        Skip to content
      </a>
      <Header active="blog" />
      <main id="blog-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function PostByline({ author, date }: { author: string; date: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
      <span className="text-ink">{author}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={date}>{formatPostDate(date)}</time>
    </p>
  );
}

export function BlogIndex() {
  return (
    <>
      <div className="grid items-end gap-4 border-b border-line py-10 sm:grid-cols-2 sm:gap-8 sm:py-14">
        <h1 className="font-serif text-[clamp(3rem,8vw,5.5rem)] leading-none tracking-tight">
          Blog
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">
          Notes on how we build, validate, and interpret web framework
          benchmarks.
        </p>
      </div>
      <ul className="m-0 grid list-none gap-5 py-8 pl-0 sm:grid-cols-2 sm:py-10">
        {posts.map(({ slugs, url, data }) => (
          <li key={url}>
            <article className="h-full">
              <Link
                to="/blog/$slug"
                params={{ slug: slugs[0] }}
                aria-labelledby={`post-${slugs[0]}`}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface hover:border-border focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {data.cover && (
                  <img
                    src={data.cover.src}
                    alt={data.cover.alt}
                    width="840"
                    height="420"
                    decoding="async"
                    className="aspect-[2/1] w-full border-b border-line object-cover object-top"
                  />
                )}
                <div className="flex flex-1 flex-col gap-3 p-5 sm:p-7">
                  <PostByline author={data.author} date={data.date} />
                  <h2
                    id={`post-${slugs[0]}`}
                    className="font-serif text-3xl leading-tight tracking-tight underline-offset-4 group-hover:underline"
                  >
                    {data.title}
                  </h2>
                  <p className="max-w-prose text-base leading-relaxed text-muted">
                    {data.description}
                  </p>
                </div>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}

export function BlogArticle({ post }: { post: (typeof posts)[number] }) {
  const { author, body: Content, date, description, title } = post.data;
  const { toc } = use(post.data.load());
  const relatedPosts = posts.filter(({ url }) => url !== post.url).slice(0, 2);

  return (
    <article className="mx-auto max-w-5xl py-8 sm:py-12">
      <Link to="/blog" className="text-sm text-muted underline hover:text-ink">
        All posts
      </Link>
      <div className="mt-8 border-b border-line pb-7">
        <h1 className="max-w-[23ch] text-balance font-serif text-[clamp(2.25rem,6vw,4rem)] leading-[1.06] tracking-tight">
          {title}
        </h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted">
          {description}
        </p>
        <div className="mt-5">
          <PostByline author={author} date={date} />
        </div>
      </div>
      <div className="mt-7 grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_14rem] md:gap-12">
        <aside className="rounded-md border border-line bg-surface p-4 md:sticky md:top-8 md:col-start-2 md:row-start-1">
          {toc.length > 0 && (
            <nav aria-labelledby="post-toc">
              <h2 id="post-toc" className="text-sm font-semibold text-ink">
                On this page
              </h2>
              <ul className="mt-3 grid list-none gap-3 pl-0 text-sm leading-snug text-muted">
                {toc.map(({ url, title, depth }) => (
                  <li key={url} className={depth > 2 ? "pl-3" : undefined}>
                    <a
                      href={url}
                      className="block underline-offset-4 hover:text-ink hover:underline"
                    >
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {relatedPosts.length > 0 && (
            <nav
              aria-labelledby="more-posts"
              className={
                toc.length > 0 ? "mt-5 border-t border-line pt-4" : undefined
              }
            >
              <h2 id="more-posts" className="text-sm font-semibold text-ink">
                More posts
              </h2>
              <ul className="mt-3 grid list-none gap-3 pl-0 text-sm leading-snug text-muted">
                {relatedPosts.map(({ slugs, url, data }) => (
                  <li key={url}>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: slugs[0] }}
                      className="block underline-offset-4 hover:text-ink hover:underline"
                    >
                      {data.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>
        <div className="fw-blog-prose min-w-0 max-w-[66ch] text-base leading-[1.8] text-muted md:col-start-1 md:row-start-1">
          <Content />
        </div>
      </div>
    </article>
  );
}
