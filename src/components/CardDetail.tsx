import { Plus, ExternalLink } from 'lucide-react';
import type { Card } from '../types';
import CardImage from './CardImage';

const statLabels = { serve: '서브', block: '블록', receive: '리시브', toss: '토스', attack: '어택' };
const hasText = (text: string) => Boolean(text.trim()) && text.trim() !== '-';

export default function CardDetail({ card, count, onAdd }: { card: Card; count: number; onAdd: () => void }) {
  return <div className="detail-layout">
    <div className="detail-visual"><CardImage key={card.id} card={card} eager /><a href={card.sourceUrl} target="_blank" rel="noreferrer">공식 카드 상세 <ExternalLink size={13} /></a><small>{card.copyright}</small></div>
    <div className="detail-content">
      <p className="eyebrow">{card.cardNo} · {card.rarity}</p>
      <h2 id="card-title">{card.name}</h2><p className="original-name" lang="ja">{card.nameJa}</p>
      <div className="detail-tags"><span>{card.categoryLabel}</span><span>{card.affiliation === '-' ? '소속 없음' : card.affiliation}</span>{card.position !== '-' && <span>{card.position}</span>}</div>
      <p className="product-name">{card.productName}</p>
      {card.category === 'CHARACTER' && <dl className="stats">{(Object.keys(statLabels) as Array<keyof typeof statLabels>).map(key => <div key={key}><dt>{statLabels[key]}</dt><dd>{card.stats[key] || '—'}</dd></div>)}</dl>}
      <div className="translation-label">한국어 AI 번역 초안 · 원문 확인 가능</div>
      <section className="effect"><h3>스킬</h3><p>{hasText(card.skill) ? card.skill : '스킬 없음'}</p></section>
      {hasText(card.annotation) && <section className="effect annotation"><h3>효과 설명</h3><p>{card.annotation}</p></section>}
      {card.notes.map(note => <p className="translation-note" key={note}>{note}</p>)}
      <details className="original-text"><summary>일본어 원문 보기</summary><p lang="ja">{hasText(card.skillJa) ? card.skillJa : '—'}</p>{hasText(card.annotationJa) && <p lang="ja">{card.annotationJa}</p>}<p lang="ja">{card.affiliationJa}</p></details>
      {card.illustrator && card.illustrator !== '-' && <p className="muted">Illustration: {card.illustrator}</p>}
      <button className="primary" onClick={onAdd}>현재 덱에 추가 <Plus size={17} /></button><p className="detail-count" aria-live="polite">현재 덱에 {count}장</p>
    </div>
  </div>;
}
