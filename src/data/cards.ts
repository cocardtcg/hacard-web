import catalogUrl from './catalog.json?url';
import type { Card } from '../types';

export let cards: Card[] = [];
export let cardsById = new Map<string, Card>();
export let schools: string[] = [];
export let products: [string, string][] = [];
export let sourceUrl = '';
export let fetchedAt = '';
export async function loadCatalog() {
  const response = await fetch(catalogUrl);
  if (!response.ok) throw new Error('카드 데이터를 불러오지 못했습니다.');
  const catalog = await response.json();
  if (!Array.isArray(catalog.items) || !catalog.items.length) throw new Error('카드 데이터가 비어 있습니다.');
  cards = catalog.items;
  cardsById = new Map(cards.map(card => [card.id, card]));
  schools = [...new Set(cards.flatMap(card => card.schools))];
  products = [...new Map(cards.map(card => [card.productId, card.productName])).entries()];
  sourceUrl = catalog.source;
  fetchedAt = catalog.fetchedAt;
}
