import cards from "../../cards.json";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Catalog({ searchParams }) {
  const { request = "" } = await searchParams;
  return (
    <main data-bench-page="catalog">
      <h1>Product catalog</h1>
      <div data-bench-request="true">{request}</div>
      {cards.map((card) => (
        <article key={card.id} data-bench-card={card.id}>
          <h2 data-bench-title={card.id}>{card.title}</h2>
          <div data-bench-category={card.id}>{card.category}</div>
          <div data-bench-description={card.id}>{card.description}</div>
          <div
            data-bench-price={card.id}
          >{`$${(card.priceCents / 100).toFixed(2)}`}</div>
          <div data-bench-stock={card.id}>
            {card.inStock ? "In stock" : "Out of stock"}
          </div>
          <div role="list" aria-label="Tags" data-bench-tags={card.id}>
            {card.tags.map((tag) => (
              <div role="listitem" key={tag}>
                {tag}
              </div>
            ))}
          </div>
        </article>
      ))}
    </main>
  );
}
