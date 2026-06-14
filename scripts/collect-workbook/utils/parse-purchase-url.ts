export function parsePurchaseUrl(url: string): { kyobo?: string; yes24?: string } {
  const result: { kyobo?: string; yes24?: string } = {};
  const kyobo = url.match(/kyobobook\.co\.kr\/detail\/(S[0-9A-Z]+)/i);
  if (kyobo) result.kyobo = kyobo[1];
  const yes24 = url.match(/yes24\.com\/product\/goods\/(\d+)/i);
  if (yes24) result.yes24 = yes24[1];
  return result;
}
