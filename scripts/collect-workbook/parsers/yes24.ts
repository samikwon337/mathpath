import { fetchText, extractMeta, stripHtml } from "../fetch";
import type { SearchResultItem, StoreMetadata } from "../types";

export function parseYes24Id(input: string): string {
  const urlMatch = input.match(/Goods\/([0-9]+)/i);
  if (urlMatch) return urlMatch[1];
  if (/^[0-9]+$/.test(input)) return input;
  throw new Error(`YES24 ID 형식이 아닙니다: ${input}`);
}

export async function fetchYes24Product(goodsNo: string): Promise<StoreMetadata> {
  const url = `https://www.yes24.com/Product/Goods/${goodsNo}`;
  const html = await fetchText(url);

  const ogTitle = extractMeta(html, "og:title");
  const ogImage = extractMeta(html, "og:image");
  const ogDescription = extractMeta(html, "og:description");

  const title = ogTitle?.replace(/\s*-\s*YES24.*$/i, "").trim();
  const publisherName = extractYes24Publisher(html);
  const isbn = extractYes24Isbn(html);
  const price = extractYes24Price(html);

  return {
    source: "yes24",
    sourceId: goodsNo,
    title,
    publisherName,
    coverImageUrl: ogImage,
    description: ogDescription,
    isbn,
    price,
    purchaseUrlYes24: url,
  };
}

export async function searchYes24(
  keyword: string,
  limit = 10
): Promise<SearchResultItem[]> {
  const url = `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(keyword)}`;
  const html = await fetchText(url);

  const results: SearchResultItem[] = [];
  const pattern = /\/Product\/Goods\/([0-9]+)/g;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null && results.length < limit) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const chunk = html.slice(Math.max(0, match.index - 600), match.index + 600);
    const titleMatch =
      chunk.match(/class="[^"]*goods_name[^"]*"[^>]*>([^<]+)</i) ||
      chunk.match(/title="([^"]{4,120})"/i);
    const imgMatch = chunk.match(/src="(https:\/\/image\.yes24\.com[^"]+)"/i);

    results.push({
      source: "yes24",
      sourceId: id,
      title: titleMatch?.[1] ? stripHtml(titleMatch[1]) : `YES24 ${id}`,
      coverImageUrl: imgMatch?.[1],
      url: `https://www.yes24.com/Product/Goods/${id}`,
    });
  }

  return results;
}

function extractYes24Publisher(html: string): string | undefined {
  const match =
    html.match(/출판사[^>]*>[\s\S]*?<a[^>]*>([^<]+)</i) ||
    html.match(/"brand"\s*:\s*"([^"]+)"/i);
  return match?.[1] ? stripHtml(match[1]) : undefined;
}

function extractYes24Isbn(html: string): string | undefined {
  const match = html.match(/ISBN(?:-13)?[^0-9]*([0-9]{13}|[0-9]{10})/i);
  return match?.[1];
}

function extractYes24Price(html: string): number | undefined {
  const match = html.match(/salePrc['":\s]+([0-9]+)/i) || html.match(/판매가[^0-9]*([0-9,]+)/i);
  if (!match) return undefined;
  return Number(match[1].replace(/,/g, ""));
}
