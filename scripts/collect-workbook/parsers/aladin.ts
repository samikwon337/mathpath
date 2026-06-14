import { fetchJson } from "../fetch";
import type { SearchResultItem, StoreMetadata } from "../types";

const ALADIN_BASE = "http://www.aladin.co.kr/ttb/api";

interface AladinItem {
  itemId?: number;
  title?: string;
  author?: string;
  publisher?: string;
  pubDate?: string;
  cover?: string;
  description?: string;
  isbn13?: string;
  isbn?: string;
  priceSales?: number;
  link?: string;
}

interface AladinResponse {
  item?: AladinItem[];
  errorCode?: number;
  errorMessage?: string;
}

function getTtbKey(): string {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) {
    throw new Error(
      "ALADIN_TTB_KEY 환경변수가 필요합니다. https://www.aladin.co.kr/ttb/wblog_manage.aspx 에서 발급"
    );
  }
  return key;
}

export async function searchAladin(
  keyword: string,
  limit = 10
): Promise<SearchResultItem[]> {
  const ttbKey = getTtbKey();
  const url =
    `${ALADIN_BASE}/ItemSearch.aspx?ttbkey=${ttbKey}` +
    `&Query=${encodeURIComponent(keyword)}` +
    `&QueryType=Title&MaxResults=${limit}&start=1` +
    `&SearchTarget=Book&output=js&Version=20131101&CategoryId=0`;

  const data = await fetchJson<AladinResponse>(url);
  if (data.errorCode) {
    throw new Error(`알라딘 API 오류: ${data.errorMessage}`);
  }

  const items = Array.isArray(data.item) ? data.item : data.item ? [data.item] : [];

  return items.map((item) => ({
    source: "aladin" as const,
    sourceId: String(item.itemId || ""),
    title: item.title || "",
    publisherName: item.publisher,
    coverImageUrl: item.cover,
    price: item.priceSales,
    url: item.link || `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${item.itemId}`,
  }));
}

export async function fetchAladinProduct(itemId: string): Promise<StoreMetadata> {
  const ttbKey = getTtbKey();
  const url =
    `${ALADIN_BASE}/ItemLookUp.aspx?ttbkey=${ttbKey}` +
    `&itemId=${itemId}&output=js&Version=20131101&Cover=Big`;

  const data = await fetchJson<AladinResponse>(url);
  if (data.errorCode) {
    throw new Error(`알라딘 API 오류: ${data.errorMessage}`);
  }

  const item = Array.isArray(data.item) ? data.item[0] : data.item;
  if (!item) throw new Error(`알라딘 상품을 찾을 수 없습니다: ${itemId}`);

  return {
    source: "aladin",
    sourceId: itemId,
    title: item.title,
    author: item.author,
    publisherName: item.publisher,
    publishDate: item.pubDate,
    coverImageUrl: item.cover,
    description: item.description,
    isbn: item.isbn13 || item.isbn,
    price: item.priceSales,
    purchaseUrlAladin:
      item.link || `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`,
    raw: { item },
  };
}
