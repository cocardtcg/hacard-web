import type { Card, Deck } from '../types/index.ts';

export const DECK_KEY = 'haikyu-official-decks-v1';
export const RULES_URL = 'https://www.takaratomy.co.jp/products/haikyuvobacabreak/rules/pdf/rules_general_v1.05.pdf';
export const blankDeck = (): Deck => ({ id: crypto.randomUUID(), name: '나의 첫 번째 덱', cards: {} });
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export function recoverDecks(value: unknown, cards: Map<string, Card>) {
  let repaired = false;
  const decks: Deck[] = [];
  const ids = new Set<string>();
  if (!Array.isArray(value)) return { decks, repaired: true };
  for (const item of value) {
    if (!object(item) || !object(item.cards)) { repaired = true; continue; }
    let id = typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID();
    if (ids.has(id)) id = crypto.randomUUID();
    ids.add(id);
    const name = typeof item.name === 'string' ? item.name.slice(0, 60) : '복구한 덱';
    if (id !== item.id || name !== item.name) repaired = true;
    const entries: [string, number][] = [];
    let total = 0;
    for (const [key, count] of Object.entries(item.cards)) {
      if (cards.has(key) && typeof count === 'number' && Number.isSafeInteger(count) && count > 0 && Number.isSafeInteger(total + count)) {
        entries.push([key, count]); total += count;
      } else repaired = true;
    }
    decks.push({ id, name, cards: Object.fromEntries(entries) });
  }
  return { decks, repaired };
}
export function loadDecks(storage: Pick<Storage, 'getItem'>, cards: Map<string, Card>) {
  try {
    const raw = storage.getItem(DECK_KEY);
    if (raw === null) return { decks: [blankDeck()], backup: null, blocked: false, notice: '' };
    let result;
    try { result = recoverDecks(JSON.parse(raw), cards); }
    catch { result = { decks: [], repaired: true }; }
    return { decks: result.decks.length ? result.decks : [blankDeck()], backup: result.repaired ? raw : null, blocked: false,
      notice: result.repaired ? '저장 데이터에서 읽을 수 있는 덱과 카드만 복구했습니다. 복구 전 원본을 내려받아 보관하세요.' : '' };
  } catch {
    return { decks: [blankDeck()], backup: null, blocked: true, notice: '저장 데이터를 읽을 수 없습니다. 기존 데이터 보호를 위해 자동 저장을 중지했습니다.' };
  }
}
export function saveDecks(storage: Pick<Storage, 'getItem' | 'setItem'>, decks: Deck[], backup: string | null, backupKey: string) {
  // Never replace the primary data until its exact original has been backed up.
  if (backup !== null && storage.getItem(backupKey) !== backup) storage.setItem(backupKey, backup);
  storage.setItem(DECK_KEY, JSON.stringify(decks));
}
export function importDeck(text: string, cards: Map<string, Card>): Deck {
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { throw new Error('올바른 JSON 파일이 아닙니다.'); }
  if (!object(payload) || payload.version !== 2 || !object(payload.deck) || typeof payload.deck.id !== 'string' || typeof payload.deck.name !== 'string') throw new Error('이 앱에서 내보낸 버전 2 덱 파일을 선택하세요.');
  const { decks, repaired } = recoverDecks([payload.deck], cards);
  if (repaired || decks.length !== 1) throw new Error('알 수 없는 카드나 잘못된 수량이 있습니다. 기존 덱은 변경하지 않았습니다.');
  return { ...decks[0], id: crypto.randomUUID() };
}
export function deckRules(deck: Deck, cards: Map<string, Card>) {
  let total = 0, events = 0;
  const issues: string[] = [];
  for (const [id, n] of Object.entries(deck.cards)) {
    total += n;
    if (cards.get(id)?.category === 'EVENT') events += n;
  }
  if (total !== 40) issues.push(total < 40 ? `40장까지 ${40 - total}장 더 필요합니다.` : `40장보다 ${total - 40}장 많습니다.`);
  if (events > 8) issues.push(`이벤트 카드는 최대 8장입니다. 현재 ${events}장입니다.`);
  return { total, events, issues };
}
