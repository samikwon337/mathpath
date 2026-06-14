import type { BookType, DifficultyLevel } from "../../src/data/types";

/** 서점에서 자동 수집된 원시 메타데이터 */
export interface StoreMetadata {
  source: "kyobo" | "yes24" | "aladin" | "manual";
  sourceId?: string;
  title?: string;
  subtitle?: string;
  publisherName?: string;
  author?: string;
  publishDate?: string;
  price?: number;
  coverImageUrl?: string;
  description?: string;
  isbn?: string;
  pageCount?: number;
  purchaseUrlKyobo?: string;
  purchaseUrlYes24?: string;
  purchaseUrlAladin?: string;
  raw?: Record<string, unknown>;
}

/** workbooks.ts에 넣을 완성 드래프트 */
export interface WorkbookDraft {
  id: string;
  publisherId: string;
  subjectIds: string[];
  title: string;
  subtitle?: string;
  bookType: BookType;
  difficultyLevel: DifficultyLevel;
  difficultySub?: "low" | "mid" | "high";
  problemCount?: number;
  targetAudience: string;
  coverImageUrl?: string;
  summary: string;
  description: string;
  pros: string[];
  cons: string[];
  recommendedFor: string;
  studyTips?: string[];
  purchaseUrlKyobo?: string;
  purchaseUrlYes24?: string;
  tags: string[];
  isActive: boolean;
  /** 수집 출처 추적 (시드 파일에는 포함하지 않음) */
  _meta?: {
    collectedAt: string;
    sources: StoreMetadata[];
    warnings: string[];
  };
}

export interface SearchResultItem {
  source: StoreMetadata["source"];
  sourceId: string;
  title: string;
  publisherName?: string;
  coverImageUrl?: string;
  price?: number;
  url: string;
}
