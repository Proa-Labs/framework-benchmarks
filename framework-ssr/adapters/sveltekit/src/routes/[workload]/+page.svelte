<script lang="ts">
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
} from "../../../../../workloads.ts";

let { data } = $props();
</script>
<svelte:head><title>{titles[data.workload]}</title></svelte:head>
<main data-bench-page={data.workload}><h1>{titles[data.workload]}</h1><div data-bench-request="true">{data.request}</div>
{#if data.workload==='cards'}{#each sections as section}<section data-bench-section={section.id}><h2>{section.title}</h2>{#each section.cards as card}<article data-bench-card={card.id}><h3>{card.title}</h3><div data-bench-description={card.id}>{card.description}</div><div role="list" aria-label="Features">{#each card.features as feature}<div role="listitem">{feature}</div>{/each}</div></article>{/each}</section>{/each}
{:else if data.workload==='products'}{#each products as product}<article data-bench-product={product.id}><a href={'/products/'+product.id}><h2>{product.name}</h2></a><div>{product.category}</div><div>{money(product.priceCents)}</div><div>{(product.ratingTenths/10).toFixed(1)} ({product.reviewCount})</div><div aria-label="Rating">{#each starIndexes as index}<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-filled={index<Math.floor((product.ratingTenths+5)/10)?'true':'false'}><path d={starPath}/></svg>{/each}</div></article>{/each}
{:else}<table><caption>Customer Accounts</caption><thead><tr>{#each headers as header}<th scope="col">{header}</th>{/each}</tr></thead><tbody>{#each rows as row}<tr data-bench-row={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.email}</td><td data-active={row.status==='Active'?'true':'false'}>{row.status}</td><td>{money(row.amountCents)}</td><td>{money(row.taxCents)}</td><td>{money(row.amountCents+row.taxCents)}</td><td>{date(row.createdUnix)}</td><td>{timestamp(row.updatedUnix)}</td><td>{score(row.scoreBps)}</td><td>{row.country}</td><td><div role="list" aria-label="Tags">{#each row.tags as tag}<div role="listitem">{tag}</div>{/each}</div></td></tr>{/each}</tbody></table>{/if}</main>
