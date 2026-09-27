const labels: Record<string, string> = {
  '頂': '정',
  '秘': '사인',
  '極': '키와미',
  '頂P': '정 패러렐',
  '頂A': '정 아트',
  '極P': '키와미 패러렐',
};

export function rarityLabel(code: string): string {
  return labels[code] ?? code;
}

export function rarityDetailLabel(code: string): string {
  const label = rarityLabel(code);
  return label === code ? code : `${label} (${code})`;
}
