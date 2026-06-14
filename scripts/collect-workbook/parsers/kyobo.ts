import { fetchText, extractJsonLd, extractMeta, stripHtml } from "../fetch";
import type { SearchResultItem, StoreMetadata } from "../types";

export function parseKyoboId(input: string): string {
  const urlMatch = input.match(/\/detail\/(S[0-9A-Z]+)/i);
  if (urlMatch) return urlMatch[1];
  if (/^S[0-9A-Z]+$/i.test(input)) return input;
  throw new Error(`교보문고 ID 형식이 아닙니다: ${input}`);
}

export async function fetchKyoboProduct(saleCmdtId: string): Promise<StoreMetadata> {
  const url = `https://product.kyobobook.co.kr/detail/${saleCmdtId}`;
  const html = await fetchText(url);

  const jsonLd = extractJsonLd(html);
  const ogTitle = extractMeta(html, "og:title");
  const ogImage = extractMeta(html, "og:image");
  const ogDescription = extractMeta(html, "og:description");

  const title =
    (jsonLd?.name as string | undefined) ||
    ogTitle?.replace(/\s*\|\s*교보문고.*$/, "").trim();

  const publisherName =
    (jsonLd?.publisher as { name?: string } | undefined)?.name ||
    extractPublisherFromHtml(html);

  const isbn = (jsonLd?.isbn as string | undefined) || extractIsbn(html);

  return {
    source: "kyobo",
    sourceId: saleCmdtId,
    title,
    publisherName,
    coverImageUrl: (jsonLd?.image as string | undefined) || ogImage,
    description: ogDescription || (jsonLd?.description as string | undefined),
    isbn,
    purchaseUrlKyobo: url,
    raw: jsonLd ? { jsonLd } : undefined,
  };
}

export async function searchKyobo(
  keyword: string,
  limit = 10
): Promise<SearchResultItem[]> {
  const url = `https://search.kyobobook.co.kr/search?keyword=${encodeURIComponent(keyword)}&target=total&gbCode=TOT`;
  const html = await fetchText(url);

  const results: SearchResultItem[] = [];
  const idPattern = /\/detail\/(S[0-9A-Z]+)/gi;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = idPattern.exec(html)) !== null && results.length < limit) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const chunk = html.slice(Math.max(0, match.index - 500), match.index + 800);
    const titleMatch = chunk.match(/alt="([^"]{2,120})"/) || chunk.match(/title="([^"]{2,120})"/);
    const imgMatch = chunk.match(/src="(https:\/\/contents\.kyobobook\.co\.kr[^"]+)"/);

    results.push({
      source: "kyobo",
      sourceId: id,
      title: titleMatch?.[1]?.replace(/&amp;/g, "&") || `교보문고 ${id}`,
      coverImageUrl: imgMatch?.[1],
      url: `https://product.kyobobook.co.kr/detail/${id}`,
    });
  }

  // fallback: 다른 링크 패턴
  if (results.length === 0) {
    const altPattern = /data-sale-cmdt-id="(S[0-9A-Z]+)"[^>]*data-name="([^"]+)"/gi;
    while ((match = altPattern.exec(html)) !== null && results.length < limit) {
      results.push({
        source: "kyobo",
        sourceId: match[1],
        title: match[2],
        url: `https://product.kyobobook.co.kr/detail/${match[1]}`,
      });
    }
  }

  return results;
}

function extractPublisherFromHtml(html: string): string | undefined {
  const match = html.match(/출판사[^<]*<[^>]+>([^<]{2,40})</i);
  if (match) return stripHtml(match[1]);
  const pipeMatch = html.match(/og:title"[^>]+content="[^|]+\|\s*([^|]+?)\s*-/i);
  return pipeMatch?.[1]?.trim();
}

function extractIsbn(html: string): string | undefined {
  const match = html.match(/ISBN(?:-13)?[^0-9]*([0-9]{13}|[0-9]{10})/i);
  return match?.[1];
}
