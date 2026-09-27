import type { Card, Deck } from '../types/index.ts';

const PREFIX = '#deck=';
const MAX_LENGTH = 16000;
const invalid = () => new Error('공유 링크가 올바르지 않거나 일부가 잘렸습니다. 전체 링크를 다시 받아 주세요.');
export function encodeDeck(deck: Deck): string {
  const bytes = new TextEncoder().encode(JSON.stringify([1, deck.name, Object.entries(deck.cards)]));
  const code = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  if (code.length > MAX_LENGTH) throw new Error('덱이 너무 커서 링크로 공유할 수 없습니다. 카드 수를 줄이거나 파일 백업을 사용하세요.');
  return code;
}
export function decodeDeck(code: string, cards: Map<string, Card>): Deck {
  if (!code || code.length > MAX_LENGTH || !/^[A-Za-z0-9_-]+$/.test(code)) throw invalid();
  let value: unknown;
  try {
    const binary = atob(code.replaceAll('-', '+').replaceAll('_', '/'));
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
  } catch { throw invalid(); }
  if (!Array.isArray(value) || value.length !== 3 || value[0] !== 1 || typeof value[1] !== 'string' || value[1].length > 60 || !Array.isArray(value[2]) || value[2].length > cards.size) throw invalid();
  const entries: [string, number][] = [];
  const seen = new Set<string>();
  let total = 0;
  for (const entry of value[2]) {
    if (!Array.isArray(entry) || entry.length !== 2) throw invalid();
    const [id, n] = entry;
    if (typeof id !== 'string' || seen.has(id) || typeof n !== 'number' || !Number.isSafeInteger(n) || n <= 0 || !Number.isSafeInteger(total + n)) throw invalid();
    if (!cards.has(id)) throw new Error('현재 도감에 없는 카드가 포함된 링크입니다. 사이트를 새로고침한 뒤 다시 열어 주세요.');
    seen.add(id); total += n; entries.push([id, n]);
  }
  return { id: crypto.randomUUID(), name: value[1], cards: Object.fromEntries(entries) };
}
export function deckShareUrl(deck: Deck, currentUrl: string): string {
  const url = new URL(currentUrl);
  url.search = '';
  url.hash = PREFIX + encodeDeck(deck);
  return url.href;
}
export function readSharedDeck(hash: string, cards: Map<string, Card>): { deck: Deck | null; error: string } {
  if (!hash.startsWith(PREFIX)) return { deck: null, error: '' };
  try { return { deck: decodeDeck(hash.slice(PREFIX.length), cards), error: '' }; }
  catch (error) { return { deck: null, error: error instanceof Error ? error.message : '공유 링크를 읽을 수 없습니다.' }; }
}
