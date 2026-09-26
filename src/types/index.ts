export interface Card {
  id: string;
  cardNo: string;
  name: string;
  nameJa: string;
  reading: string;
  affiliation: string;
  affiliationJa: string;
  schools: string[];
  position: string;
  category: string;
  categoryLabel: string;
  productId: string;
  productName: string;
  rarity: string;
  variant: string;
  imageUrl: string;
  sourceUrl: string;
  stats: { serve: string; block: string; receive: string; toss: string; attack: string };
  skill: string;
  annotation: string;
  skillJa: string;
  annotationJa: string;
  illustrator: string;
  copyright: string;
  translationStatus: string;
  notes: string[];
}
export interface Deck { id: string; name: string; cards: Record<string, number>; }
