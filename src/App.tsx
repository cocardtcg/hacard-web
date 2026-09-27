import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, Layers, Plus, Minus, Search, X, Volleyball, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { cards, cardsById, schools, products, sourceUrl, fetchedAt } from './data/cards';
import CardImage from './components/CardImage';
import CardDetail from './components/CardDetail';
import type { Card, Deck } from './types';
import { deckShareUrl, readSharedDeck } from './lib/share';
import { blankDeck as blank, loadDecks, saveDecks, importDeck, deckRules, RULES_URL, DECK_KEY } from './lib/decks';

const PAGE_SIZE = 24;
function download(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [page, setPage] = useState<'cards' | 'decks' | 'edit' | 'add' | 'shared'>(() => location.hash.startsWith('#deck=') ? 'shared' : 'cards');
  const [shared, setShared] = useState(() => readSharedDeck(location.hash, cardsById));
  const [shareUrl, setShareUrl] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [query, setQuery] = useState('');
  const [school, setSchool] = useState('');
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState('');
  const [rarity, setRarity] = useState('');
  const rarities = useMemo(() => [...new Set(cards.map(card => card.rarity))], []);
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

  useEffect(() => {
    const onHashChange = () => {
      setShared(readSharedDeck(location.hash, cardsById));
      setDetail(null);
      setPage(location.hash.startsWith('#deck=') ? 'shared' : 'cards');
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => { setShareUrl(''); setShareStatus(''); }, [deck]);

  async function shareDeck() {
    try {
      const url = deckShareUrl(deck, location.href);
      setShareUrl(url);
      try { await navigator.clipboard.writeText(url); setShareStatus('공유 링크를 복사했습니다. 원하는 곳에 붙여넣으세요.'); }
      catch { setShareStatus('아래 링크를 선택해 복사해 주세요.'); }
    } catch (error) { setShareStatus(error instanceof Error ? error.message : '공유 링크를 만들지 못했습니다.'); }
  }
  function saveSharedDeck() {
    if (!shared.deck) return;
    const copy = { ...shared.deck, id: crypto.randomUUID(), cards: { ...shared.deck.cards } };
    setDecks(ds => [...ds, copy]); setActive(copy.id); navigate('edit');
    setMessage('공유받은 덱을 내 덱에 추가했습니다. 자유롭게 편집하세요.');
  }

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
  function navigate(next: typeof page) { if (location.hash.startsWith('#deck=')) history.replaceState(null, '', location.pathname + location.search); setShareUrl(''); setShareStatus(''); setDetail(null); setPage(next); window.scrollTo({ top: 0 }); }
  function showDeck() { navigate('decks'); }
  function openDeck(id: string) { setActive(id); navigate('edit'); }
  function addCards() { resetFilters(); navigate('add'); }
  function create() {
    const d = { ...blank(), name: `새로운 덱 ${decks.length + 1}` };
    setDecks(ds => [...ds, d]); setActive(d.id); navigate('edit');
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
      setDecks(ds => [...ds, imported]); setActive(imported.id); navigate('edit');
      setMessage(`“${imported.name || '이름 없는 덱'}” 덱을 가져왔습니다.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : '덱을 가져오지 못했습니다.'); }
  }
  function removeDeck() {
    setDeleted(deck);
    const remaining = decks.filter(d => d.id !== deck.id);
    if (!remaining.length) remaining.push(blank());
    setDecks(remaining); setActive(remaining[0].id); showDeck();
    setMessage('덱을 삭제했습니다. 되돌리기로 복원할 수 있습니다.');
  }
  function undoDelete() {
    if (!deleted) return;
    setDecks(ds => [...ds, deleted]); setActive(deleted.id); setDeleted(null); navigate('edit'); setMessage('덱을 복원했습니다.');
  }

  function resetFilters() { setQuery(''); setSchool(''); setProduct(''); setCategory(''); setRarity(''); setListPage(1); }
  function movePage(next: number) { setListPage(next); catalogPanel.current?.scrollIntoView({ block: 'start' }); }
  const filtered = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return cards.filter(c => {
      const text = `${c.name} ${c.nameJa} ${c.reading} ${c.cardNo} ${c.affiliation} ${c.affiliationJa} ${c.skill} ${c.skillJa}`.toLocaleLowerCase();
      return (!school || c.schools.includes(school)) && (!product || c.productId === product) && (!category || c.category === category) && (!rarity || c.rarity === rarity) && words.every(word => text.includes(word));
    });
  }, [query, school, product, category, rarity]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleCards = filtered.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  function quantity(card: Card) {
    const count = deck.cards[card.id] || 0;
    return <div className="quantity" aria-label={`${card.name} 수량`}>
      <button disabled={!count} aria-label={`${card.name} ${card.cardNo} ${card.rarity} 한 장 제거`} onClick={() => change(card.id, -1)}><Minus size={18} /></button>
      <span aria-live="polite">{count}장</span>
      <button aria-label={`${card.name} ${card.cardNo} ${card.rarity} 한 장 추가`} onClick={() => change(card.id, 1)}><Plus size={18} /></button>
    </div>;
  }

  return <>
    <header><a className="brand" href="./"><Volleyball size={30} /><span>ハイキュー!!<small>BABOCA BREAK</small></span></a>
      <nav aria-label="주 메뉴"><button className={page === 'cards' ? 'selected' : ''} onClick={() => navigate('cards')}><BookOpen size={17} /><span className="nav-title"><span>카드</span>{' '}<span>도감</span></span></button><button className={page !== 'cards' ? 'selected' : ''} onClick={showDeck}><Layers size={17} /><span className="nav-title">내 덱</span><span className="nav-count">{decks.length}</span></button></nav><span className="prototype">FAN CARD ARCHIVE</span>
    </header>
    <main className={`view-${page}`}>
      {page === 'cards' && <div className="notice"><span>공식 카드 데이터</span><div>타카라토미 카드 {cards.length}개 · 패러렐 포함 · 한국어는 AI 번역 초안입니다. <a href={sourceUrl} target="_blank" rel="noreferrer">원본 사이트 ↗</a></div></div>}
      {page !== 'cards' && <>
        {initial.notice && <div className="recovery-notice" role="alert"><p>{initial.notice}</p>{initial.backup !== null && <button onClick={() => download(initial.backup!, 'haikyu-recovery-original.json')}>복구 전 원본 다운로드</button>}</div>}
        {message && <p className="action-message" role="status">{message}</p>}
        {deleted && <button className="secondary" onClick={undoDelete}>삭제 되돌리기 · {deleted.name || '이름 없는 덱'}</button>}
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={e => { void readImport(e.target.files?.[0]); e.target.value = ''; }} />
      </>}
      {page === 'shared' && <section className="shared-deck">
        <p className="eyebrow">SHARED DECK</p><h1>공유받은 덱</h1>
        {shared.error ? <div role="alert"><p>{shared.error}</p><button className="secondary" onClick={showDeck}>내 덱으로</button></div> : shared.deck && <>
          <h2>{shared.deck.name || '이름 없는 덱'}</h2>
          <p>전체 {deckRules(shared.deck, cardsById).total}/40장 · 이벤트 {deckRules(shared.deck, cardsById).events}/8장</p>
          <p className="muted">공유한 시점의 구성입니다. 내 덱에 저장하면 직접 편집할 수 있습니다.</p>
          <div className="view-actions"><button className="primary" onClick={saveSharedDeck}>내 덱에 저장</button><button className="secondary" onClick={showDeck}>내 덱 목록</button></div>
          {deckRules(shared.deck, cardsById).issues.map(issue => <p key={issue}>{issue}</p>)}
          {!Object.keys(shared.deck.cards).length && <p>카드가 없는 빈 덱입니다.</p>}
          <div className="card-grid deck-card-grid">{Object.entries(shared.deck.cards).map(([id, count]) => {
            const c = cardsById.get(id)!;
            return <article key={id}><button className="card-open" aria-label={`${c.name} ${c.cardNo} 상세`} onClick={() => setDetail(c)}><CardImage card={c} /></button><div className="card-meta"><small>{c.cardNo} · {c.rarity}</small><h3>{c.name}</h3><strong>{count}장</strong></div></article>;
          })}</div>
        </>}
      </section>}
      {page === 'decks' && <section className="deck-library">
        <div className="section-heading"><div><p className="eyebrow">MY DECKS</p><h1>내 덱</h1><p className="muted">덱을 선택해 구성을 편집하거나 새로운 덱을 만드세요.</p></div></div>
        <div className="view-actions"><button className="primary" onClick={create}><Plus size={18} />새 덱 만들기</button><button className="secondary" onClick={() => fileInput.current?.click()}>덱 파일 가져오기</button></div>
        <div className="deck-library-grid">{decks.map(d => {
          const result = deckRules(d, cardsById);
          return <button className="deck-tile" key={d.id} onClick={() => openDeck(d.id)}>
            <Layers size={28} /><h2>{d.name || '이름 없는 덱'}</h2><p>{result.total}/40장 · 이벤트 {result.events}/8장</p><span>{result.issues.length ? '편집 중' : '기본 구성 충족'}</span><strong>덱 편집 <ArrowUpRight size={16} /></strong>
          </button>;
        })}</div>
        <p className="muted" role="status">{saveStatus}</p>
      </section>}
      {page === 'edit' && <section className="deck-editor">
        <button className="back-link" onClick={showDeck}><ChevronLeft size={18} />내 덱 목록</button>
        <p className="eyebrow">EDIT DECK</p><h1>덱 편집</h1>
        <label className="field-label" htmlFor="deck-name">덱 이름</label><input id="deck-name" className="deck-name" maxLength={60} value={deck.name} onChange={e => setDecks(ds => ds.map(d => d.id === deck.id ? { ...d, name: e.target.value } : d))} />
        <div className="editor-summary"><div><strong>{total}/40장</strong><span>이벤트 {rules.events}/8장 · {Object.keys(deck.cards).length}개 카드 항목</span></div><button className="primary" onClick={addCards}><Plus size={18} />카드 추가</button></div>
        <div className="deck-validation" role="status"><strong>{rules.issues.length ? '덱 구성 확인' : '기본 덱 구성 조건 충족'}</strong>{rules.issues.map(issue => <p key={issue}>{issue}</p>)}<a href={RULES_URL} target="_blank" rel="noreferrer">기본 규칙 · 동일 카드 매수 제한 없음 ↗</a></div>
        {total === 0 ? <div className="empty"><Volleyball size={36} /><h2>아직 카드가 없습니다</h2><p>위의 ‘카드 추가’를 눌러 이 덱에 넣을 카드를 고르세요.</p></div> : <div className="card-grid deck-card-grid">{Object.entries(deck.cards).map(([id]) => {
          const c = cardsById.get(id)!;
          return <article key={id}><button className="card-open" aria-label={`${c.name} ${c.cardNo} 상세`} onClick={() => setDetail(c)}><CardImage card={c} /></button><div className="card-meta"><small>{c.cardNo} · {c.rarity}</small><h3>{c.name}</h3>{quantity(c)}</div></article>;
        })}</div>}
        <div className="editor-tools"><button className="primary" onClick={() => void shareDeck()}>공유 링크 복사</button><button className="secondary" onClick={exportDeck}><Download size={16} />덱 파일 백업</button><button className="secondary danger" onClick={removeDeck}>현재 덱 삭제</button><small role="status">{saveStatus}</small></div>
        {(shareUrl || shareStatus) && <div className="share-panel"><p role="status">{shareStatus}</p>{shareUrl && <><label htmlFor="share-url">덱 공유 링크</label><input id="share-url" readOnly value={shareUrl} onFocus={e => e.target.select()} /><p className="muted">이 링크에는 현재 덱 구성이 담겨 있습니다. 덱을 수정하면 새 링크를 공유해 주세요.</p></>}</div>}
      </section>}
      {page === 'add' && <div className="add-context"><button className="back-link" onClick={() => navigate('edit')}><ChevronLeft size={18} />덱 편집으로</button><div><strong>{deck.name || '이름 없는 덱'}</strong><span role="status">{total}/40장 · 이벤트 {rules.events}/8장</span><small role="status">{saveStatus}</small></div><button className="primary" onClick={() => navigate('edit')}>추가 완료</button></div>}
      {(page === 'cards' || page === 'add') && <>
        <section className="catalog" ref={catalogPanel}>
          <div className="section-heading"><div><p className="eyebrow">{page === 'cards' ? 'CARD COLLECTION' : 'ADD CARDS'}</p><h2>{page === 'cards' ? '카드 도감' : '카드 추가'} <span>{cards.length}</span></h2></div><span className="muted">{page === 'cards' ? '카드를 눌러 상세 정보를 확인하세요' : '수량 변경은 현재 덱에 바로 반영됩니다'}</span></div>
          <label className="search"><Search size={19} /><input aria-label="카드 검색" placeholder="이름, 카드 번호, 스킬 검색 (한국어·일본어)" value={query} onChange={e => { setQuery(e.target.value); setListPage(1); }} />{query && <button aria-label="검색어 지우기" onClick={() => { setQuery(''); setListPage(1); }}><X size={16} /></button>}</label>
          <div className="catalog-filters">
            <label>학교·소속<select value={school} onChange={e => { setSchool(e.target.value); setListPage(1); }}><option value="">전체 소속</option>{schools.map(s => <option key={s}>{s}</option>)}</select></label>
            <label>수록 상품<select value={product} onChange={e => { setProduct(e.target.value); setListPage(1); }}><option value="">전체 상품</option>{products.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
            <label>카드 종류<select value={category} onChange={e => { setCategory(e.target.value); setListPage(1); }}><option value="">전체 종류</option><option value="CHARACTER">캐릭터</option><option value="EVENT">이벤트</option></select></label>
            <label>카드 등급<select aria-label="카드 등급" value={rarity} onChange={e => { setRarity(e.target.value); setListPage(1); }}><option value="">전체 등급</option>{rarities.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
          </div>
          <div className="results" role="status">총 <b>{filtered.length}</b>개{filtered.length > 0 && <span>{(listPage - 1) * PAGE_SIZE + 1}–{Math.min(listPage * PAGE_SIZE, filtered.length)} 표시 · 패러렐 포함</span>}</div>
          <div className="card-grid">{visibleCards.map(c => <article key={c.id}>
            <button className="card-open" onClick={() => setDetail(c)} aria-label={`${c.name} ${c.cardNo} ${c.rarity} 상세`}><CardImage card={c} /></button>
            <div className="card-meta"><small>{c.cardNo} · {c.rarity}</small><h3>{c.name}</h3><span>{c.categoryLabel} · {c.schools.join(' / ') || '소속 없음'}</span>{page === 'add' && quantity(c)}</div>
          </article>)}</div>
          {!filtered.length && <div className="empty">검색 결과가 없어요.<button onClick={resetFilters}>필터 초기화</button></div>}
          {pageCount > 1 && <nav className="pagination" aria-label="카드 목록 페이지"><button disabled={listPage === 1} onClick={() => movePage(listPage - 1)} aria-label="이전 페이지"><ChevronLeft size={17} />이전</button><label><select aria-label="페이지 선택" value={listPage} onChange={e => movePage(Number(e.target.value))}>{Array.from({ length: pageCount }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} / {pageCount}</option>)}</select></label><button disabled={listPage === pageCount} onClick={() => movePage(listPage + 1)} aria-label="다음 페이지">다음<ChevronRight size={17} /></button></nav>}
        </section>

      </>}
      <footer><b>HAIKYU!! BABOCA BREAK</b><span>비공식 팬 프로젝트 · 데이터 수집 {fetchedAt.slice(0, 10)} · 이미지 권리: 각 권리자</span></footer>
    </main>
    <dialog ref={dialog} className="card-dialog" aria-labelledby="card-title" onCancel={() => setDetail(null)} onClose={() => setDetail(null)} onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
      {detail && <><button className="close" aria-label="상세 닫기" onClick={() => setDetail(null)}><X /></button><CardDetail card={detail} />{(page === 'edit' || page === 'add') && <div className="detail-deck-controls"><span>{deck.name || '이름 없는 덱'}</span>{quantity(detail)}</div>}</>}
    </dialog>
  </>;
}
