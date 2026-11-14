export interface TableRow { id:number; name:string; email:string; status:string; amountCents:number; taxCents:number; createdUnix:number; updatedUnix:number; scoreBps:number; country:string; tags:string[] }
export interface Product {id:number;name:string;category:string;priceCents:number;ratingTenths:number;reviewCount:number}
export function buildTableRows(count?:number):TableRow[];
export function buildProducts(count?:number):Product[];
export const STAR_PATH:string;
export const PRODUCT_COUNT:number;
export const TABLE_ROW_COUNT:number;
export const STATUS_CLASSES:Record<string,string>;
export function buildCardSections():{dataSection:string;title:string;cards:{dataCardId:string;title:string;features:string[]}[]}[];
export function formatCurrency(value:number):string;
export function formatDate(value:number):string;
export function formatDateTime(value:number):string;
export function formatPercent(value:number):string;
export function formatPrice(value:number):string;
export function formatRating(value:number):string;
export function formatCount(value:number):string;
