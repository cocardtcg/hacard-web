import { useState } from 'react';
import type { Card } from '../types';

export default function CardImage({ card, eager = false }: { card: Card; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="official-art">
    {failed ? <div className="image-fallback"><strong>{card.name}</strong><span>{card.cardNo} · {card.rarity}</span><small>이미지를 불러오지 못했어요</small></div>
      : <img src={card.imageUrl} alt={`${card.name} · ${card.cardNo} · ${card.rarity}`} loading={eager ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
  </div>;
}
