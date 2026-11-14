import {
  date,
  headers,
  money,
  products,
  rows,
  score,
  sections,
  starIndexes,
  starPath,
  timestamp,
  titles,
  type Workload,
} from "../../../../workloads.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ workload: Workload }>;
  searchParams: Promise<{ request?: string }>;
}) {
  const { workload } = await params;
  const { request = "" } = await searchParams;
  if (!Object.hasOwn(titles, workload)) return <h1>Not found</h1>;
  return (
    <main data-bench-page={workload}>
      <h1>{titles[workload]}</h1>
      <div data-bench-request="true">{request}</div>
      {workload === "cards" ? (
        sections.map((section) => (
          <section key={section.id} data-bench-section={section.id}>
            <h2>{section.title}</h2>
            {section.cards.map((card) => (
              <article key={card.id} data-bench-card={card.id}>
                <h3>{card.title}</h3>
                <div data-bench-description={card.id}>{card.description}</div>
                <div role="list" aria-label="Features">
                  {card.features.map((feature) => (
                    <div role="listitem" key={feature}>
                      {feature}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ))
      ) : workload === "products" ? (
        products.map((product) => (
          <article key={product.id} data-bench-product={product.id}>
            <a href={`/products/${product.id}`}>
              <h2>{product.name}</h2>
            </a>
            <div>{product.category}</div>
            <div>{money(product.priceCents)}</div>
            <div>
              {(product.ratingTenths / 10).toFixed(1)} ({product.reviewCount})
            </div>
            <div role="group" aria-label="Rating">
              {starIndexes.map((index) => (
                <svg
                  key={index}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  data-filled={
                    index < Math.floor((product.ratingTenths + 5) / 10)
                      ? "true"
                      : "false"
                  }
                >
                  <path d={starPath} />
                </svg>
              ))}
            </div>
          </article>
        ))
      ) : (
        <table>
          <caption>Customer Accounts</caption>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} data-bench-row={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td data-active={row.status === "Active" ? "true" : "false"}>
                  {row.status}
                </td>
                <td>{money(row.amountCents)}</td>
                <td>{money(row.taxCents)}</td>
                <td>{money(row.amountCents + row.taxCents)}</td>
                <td>{date(row.createdUnix)}</td>
                <td>{timestamp(row.updatedUnix)}</td>
                <td>{score(row.scoreBps)}</td>
                <td>{row.country}</td>
                <td>
                  <div role="list" aria-label="Tags">
                    {row.tags.map((tag) => (
                      <div role="listitem" key={tag}>
                        {tag}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
