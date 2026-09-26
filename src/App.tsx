import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, Layers, Plus, Minus, Search, X, Volleyball, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { cards, cardsById, schools, products, sourceUrl, fetchedAt } from './data/cards';
import CardImage from './components/CardImage';
import CardDetail from './components/CardDetail';
import type { Card, Deck } from './types';
import { blankDeck as blank, loadDecks, saveDecks, importDeck, deckRules, RULES_URL, DECK_KEY } from './lib/decks';

const PAGE_SIZE = 24;
function download(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [page, setPage] = useState<'cards' | 'decks'>('cards');
  const [query, setQuery] = useState('');
  const [school, setSchool] = useState('');
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState('');
  const [listPage, setListPage] = useState(1);
  const [initial] = useState(() => loadDecks({ getItem: key => localStorage.getItem(key) }, cardsById));
  const [decks, setDecks] = useState<Deck[]>(initial.decks);
  const [backupKey] = useState(() => `${DECK_KEY}-backup-${crypto.randomUUID()}`);
  const [message, setMessage] = useState('');
  const [deleted, setDeleted] = useState<Deck | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(decks[0].id);
  const [detail, setDetail] = useState<Card | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const deckPanel = useRef<HTMLElement>(null);
  const catalogPanel = useRef<HTMLElement>(null);
  const deck = decks.find(d => d.id === active) || decks[0];
  const rules = deckRules(deck, cardsById);
  const total = rules.total;

  useEffect(() => {
    if (initial.blocked) { setSaveStatus('자동 저장 중지 · 덱을 내보내 보관하세요'); return; }
    try { saveDecks(localStorage, decks, initial.backup, backupKey); setSaveStatus('이 브라우저에 자동 저장됨'); }
    catch { setSaveStatus('저장 불가 · 덱을 내보내 보관하세요'); }
  }, [decks, initial, backupKey]);
  useEffect(() => { if (detail) dialog.current?.showModal(); else dialog.current?.close(); }, [detail]);

  function change(id: string, delta: number) {
    setDecks(ds => ds.map(d => {
      if (d.id !== deck.id) return d;
      const next = { ...d.cards };
      const n = (next[id] || 0) + delta;
      if (!Number.isSafeInteger(n) || !Number.isSafeInteger(Object.values(next).reduce((a, b) => a + b, 0) + delta)) return d;
      if (n > 0) next[id] = n; else delete next[id];
      return { ...d, cards: next };
    }));
  }
  function showDeck() { setPage('decks'); deckPanel.current?.scrollIntoView({ block: 'start' }); }
  function create() {
    const d = { ...blank(), name: `새로운 덱 ${decks.length + 1}` };
    setDecks(ds => [...ds, d]); setActive(d.id); showDeck();
  }
  function exportDeck() {
    const payload = { version: 2, source: sourceUrl, deck, cardReferences: Object.keys(deck.cards).map(id => {
      const c = cardsById.get(id)!;
      return { id: c.id, cardNo: c.cardNo, rarity: c.rarity, variant: c.variant };
    }) };
    download(JSON.stringify(payload, null, 2), 'haikyu-deck.json');
  }
  async function readImport(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('1MB 이하의 덱 JSON 파일을 선택하세요.');
      const imported = importDeck(await file.text(), cardsById);
      setDecks(ds => [...ds, imported]); setActive(imported.id); showDeck();
      setMessage(`“${imported.name || '이름 없는 덱'}” 덱을 가져왔습니다.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : '덱을 가져오지 못했습니다.'); }
  }
  function removeDeck() {
    setDeleted(deck);
    const remaining = decks.filter(d => d.id !== deck.id);
    if (!remaining.length) remaining.push(blank());
    setDecks(remaining); setActive(remaining[0].id);
    setMessage('덱을 삭제했습니다. 되돌리기로 복원할 수 있습니다.');
  }
  function undoDelete() {
    if (!deleted) return;
    setDecks(ds => [...ds, deleted]); setActive(deleted.id); setDeleted(null); setMessage('덱을 복원했습니다.');
  }

  function resetFilters() { setQuery(''); setSchool(''); setProduct(''); setCategory(''); setListPage(1); }
  function movePage(next: number) { setListPage(next); catalogPanel.current?.scrollIntoView({ block: 'start' }); }
  const filtered = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return cards.filter(c => {
      const text = `${c.name} ${c.nameJa} ${c.reading} ${c.cardNo} ${c.affiliation} ${c.affiliationJa} ${c.skill} ${c.skillJa}`.toLocaleLowerCase();
      return (!school || c.schools.includes(school)) && (!product || c.productId === product) && (!category || c.category === category) && words.every(word => text.includes(word));
    });
  }, [query, school, product, category]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleCards = filtered.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  return <>
    <header><a className="brand" href="./"><Volleyball size={30} /><span>ハイキュー!!<small>BABOCA BREAK</small></span></a>
      <nav><button className={page === 'cards' ? 'selected' : ''} onClick={() => { setPage('cards'); catalogPanel.current?.scrollIntoView({ block: 'start' }); }}><BookOpen size={17} />카드 도감</button><button className={page === 'decks' ? 'selected' : ''} onClick={showDeck}><Layers size={17} />내 덱 <span>{decks.length}</span></button></nav><span className="prototype">FAN CARD ARCHIVE</span>
    </header>
    <main>
      <section className="hero"><div><p className="eyebrow">YOUR TEAM. YOUR NEXT PLAY.</p><h1>한 장의 카드에서,<br />우리 팀의 다음 플레이로.</h1><p>좋아하는 선수를 발견하고, 나만의 팀을 완성하세요.</p><button className="primary" onClick={create}>새 덱 만들기 <ArrowUpRight size={18} /></button></div><div className="hero-court" aria-hidden="true"><span className="court-line" /><Volleyball /><strong>繋げ。</strong><small>CONNECT THE NEXT PLAY</small></div></section>
      <div className="notice"><span>공식 카드 데이터</span><div>타카라토미 카드 {cards.length}개 · 패러렐 포함 · 한국어는 AI 번역 초안입니다. <a href={sourceUrl} target="_blank" rel="noreferrer">원본 사이트 ↗</a></div></div>
      <div className="workspace">
        <section className="catalog" ref={catalogPanel}>
          <div className="section-heading"><div><p className="eyebrow">{page === 'cards' ? 'CARD COLLECTION' : 'DECK WORKSPACE'}</p><h2>{page === 'cards' ? '카드 도감' : '덱 메이커'} <span>{cards.length}</span></h2></div><span className="muted">원하는 카드를 찾아 덱에 추가하세요</span></div>
          <label className="search"><Search size={19} /><input aria-label="카드 검색" placeholder="이름, 카드 번호, 스킬 검색 (한국어·일본어)" value={query} onChange={e => { setQuery(e.target.value); setListPage(1); }} />{query && <button aria-label="검색어 지우기" onClick={() => { setQuery(''); setListPage(1); }}><X size={16} /></button>}</label>
          <div className="catalog-filters">
            <label>학교·소속<select value={school} onChange={e => { setSchool(e.target.value); setListPage(1); }}><option value="">전체 소속</option>{schools.map(s => <option key={s}>{s}</option>)}</select></label>
            <label>수록 상품<select value={product} onChange={e => { setProduct(e.target.value); setListPage(1); }}><option value="">전체 상품</option>{products.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
            <label>카드 종류<select value={category} onChange={e => { setCategory(e.target.value); setListPage(1); }}><option value="">전체 종류</option><option value="CHARACTER">캐릭터</option><option value="EVENT">이벤트</option></select></label>
          </div>
          <div className="results" role="status">총 <b>{filtered.length}</b>개{filtered.length > 0 && <span>{(listPage - 1) * PAGE_SIZE + 1}–{Math.min(listPage * PAGE_SIZE, filtered.length)} 표시 · 패러렐 포함</span>}</div>
          <div className="card-grid">{visibleCards.map(c => <article key={c.id}>
            <button className="card-open" onClick={() => setDetail(c)} aria-label={`${c.name} ${c.cardNo} ${c.rarity} 상세`}><CardImage card={c} /></button>
            <div className="card-meta"><small>{c.cardNo} · {c.rarity}</small><h3>{c.name}</h3><span>{c.categoryLabel} · {c.schools.join(' / ') || '소속 없음'}</span><button className="add" aria-label={`${c.name} ${c.cardNo} ${c.rarity} 덱에 추가`} onClick={() => change(c.id, 1)}>{deck.cards[c.id] ? <span>{deck.cards[c.id]}</span> : <Plus size={18} />}</button></div>
          </article>)}</div>
          {!filtered.length && <div className="empty">검색 결과가 없어요.<button onClick={resetFilters}>필터 초기화</button></div>}
          {pageCount > 1 && <nav className="pagination" aria-label="카드 목록 페이지"><button disabled={listPage === 1} onClick={() => movePage(listPage - 1)} aria-label="이전 페이지"><ChevronLeft size={17} />이전</button><label><select aria-label="페이지 선택" value={listPage} onChange={e => movePage(Number(e.target.value))}>{Array.from({ length: pageCount }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} / {pageCount}</option>)}</select></label><button disabled={listPage === pageCount} onClick={() => movePage(listPage + 1)} aria-label="다음 페이지">다음<ChevronRight size={17} /></button></nav>}
        </section>
        <aside ref={deckPanel}>
          <div className="deck-top"><span><Layers size={18} /> MY DECK</span><button onClick={create} aria-label="새 덱 만들기"><Plus size={19} /></button></div>
          <label className="field-label" htmlFor="deck-select">편집할 덱</label><select id="deck-select" value={deck.id} onChange={e => setActive(e.target.value)}>{decks.map(d => <option key={d.id} value={d.id}>{d.name || '이름 없는 덱'}</option>)}</select>
          <label className="field-label" htmlFor="deck-name">덱 이름</label><input id="deck-name" className="deck-name" maxLength={60} value={deck.name} onChange={e => setDecks(ds => ds.map(d => d.id === deck.id ? { ...d, name: e.target.value } : d))} />
          <div className="deck-count"><strong>{total}<small> 장</small></strong><span>{Object.keys(deck.cards).length}개 카드 항목</span></div>
          <div className="deck-items">{total === 0 ? <div className="empty"><Volleyball size={36} /><h3>첫 플레이를 준비하세요</h3><p>카드의 + 버튼을 눌러<br />이 덱에 카드를 추가해 보세요.</p></div> : Object.entries(deck.cards).map(([id, n]) => {
            const c = cardsById.get(id)!;
            return <div className="deck-item" key={id}><button className="deck-thumbnail" aria-label={`${c.name} 상세`} onClick={() => setDetail(c)}><CardImage card={c} /></button><div><b>{c.name}</b><small>{c.cardNo} · {c.rarity}</small></div><button aria-label={`${c.name} ${c.rarity} 한 장 제거`} onClick={() => change(id, -1)}><Minus size={14} /></button><span>{n}</span><button aria-label={`${c.name} ${c.rarity} 한 장 추가`} onClick={() => change(id, 1)}><Plus size={14} /></button></div>;
          })}</div>
          <div className="deck-bottom">
            <div className="deck-validation" role="status"><strong>{rules.issues.length ? '덱 구성 확인' : '기본 덱 구성 조건 충족'}</strong><p>전체 {total}/40장 · 이벤트 {rules.events}/8장</p>{rules.issues.map(issue => <p key={issue}>{issue}</p>)}<a href={RULES_URL} target="_blank" rel="noreferrer">기본 규칙 · 동일 카드 매수 제한 없음 ↗</a></div>
            {initial.notice && <div className="recovery-notice" role="alert"><p>{initial.notice}</p>{initial.backup !== null && <button onClick={() => download(initial.backup!, 'haikyu-recovery-original.json')}>복구 전 원본 다운로드</button>}</div>}
            <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={e => { void readImport(e.target.files?.[0]); e.target.value = ''; }} />
            <button className="export" onClick={() => fileInput.current?.click()}>덱 JSON 가져오기</button>
            <button className="export" onClick={removeDeck}>현재 덱 삭제</button>
            {deleted && <button className="export" onClick={undoDelete}>삭제 되돌리기 · {deleted.name || '이름 없는 덱'}</button>}
            {message && <p role="status">{message}</p>}<button className="export" onClick={exportDeck}><Download size={16} />덱 JSON 내보내기</button><small role="status">{saveStatus}</small></div>
        </aside>
      </div>
      <footer><b>HAIKYU!! BABOCA BREAK</b><span>비공식 팬 프로젝트 · 데이터 수집 {fetchedAt.slice(0, 10)} · 이미지 권리: 각 권리자</span></footer>
    </main>
    <dialog ref={dialog} className="card-dialog" aria-labelledby="card-title" onCancel={() => setDetail(null)} onClose={() => setDetail(null)} onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
      {detail && <><button className="close" aria-label="상세 닫기" onClick={() => setDetail(null)}><X /></button><CardDetail card={detail} count={deck.cards[detail.id] || 0} onAdd={() => change(detail.id, 1)} /></>}
    </dialog>
  </>;
}
