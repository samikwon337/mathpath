import type { BookType, DifficultyLevel } from "../../../src/data/types";
import type { StoreMetadata, WorkbookDraft } from "../types";
import { detectPublisherId } from "./publisher-detect";
import { detectSubjectIdsOrAll } from "./subject-detect";
import { suggestWorkbookId } from "./slug";

export interface MergeOverrides {
  id?: string;
  title?: string;
  publisherId?: string;
  subjectIds?: string[];
  bookType?: BookType;
  difficultyLevel?: DifficultyLevel;
  difficultySub?: "low" | "mid" | "high";
  problemCount?: number;
  targetAudience?: string;
  summary?: string;
  description?: string;
  pros?: string[];
  cons?: string[];
  recommendedFor?: string;
  studyTips?: string[];
  tags?: string[];
  isActive?: boolean;
}

/** 서점 메타데이터 → WorkbookDraft 초안 (수동 보완 필드 포함) */
export function mergeToDraft(
  sources: StoreMetadata[],
  overrides: MergeOverrides = {}
): WorkbookDraft {
  const primary = sources[0];
  const title = overrides.title || primary?.title || "제목 미정";
  const fullText = sources.map((s) => [s.title, s.subtitle, s.description].join(" ")).join(" ");

  const { subjectIds: detectedSubjects, warnings: subjectWarnings } =
    detectSubjectIdsOrAll(fullText);
  const { publisherId: detectedPublisher, warning: publisherWarning } =
    detectPublisherId(primary?.publisherName);

  const warnings = [...subjectWarnings];
  if (publisherWarning) warnings.push(publisherWarning);

  const kyobo = sources.find((s) => s.purchaseUrlKyobo);
  const yes24 = sources.find((s) => s.purchaseUrlYes24);

  const draft: WorkbookDraft = {
    id: overrides.id || suggestWorkbookId(title),
    publisherId: overrides.publisherId || detectedPublisher || "pub-UNKNOWN",
    subjectIds: overrides.subjectIds?.length ? overrides.subjectIds : detectedSubjects,
    title,
    subtitle: primary?.subtitle,
    bookType: overrides.bookType || "type_advanced",
    difficultyLevel: overrides.difficultyLevel || 3,
    difficultySub: overrides.difficultySub,
    problemCount: overrides.problemCount,
    targetAudience: overrides.targetAudience || "중위권",
    coverImageUrl: primary?.coverImageUrl,
    summary: overrides.summary || `TODO: ${title} 한줄 요약 작성`,
    description:
      overrides.description ||
      primary?.description?.slice(0, 300) ||
      `TODO: ${title} 상세 설명 작성`,
    pros: overrides.pros || ["TODO: 장점 1", "TODO: 장점 2"],
    cons: overrides.cons || ["TODO: 단점 1", "TODO: 단점 2"],
    recommendedFor: overrides.recommendedFor || `TODO: ${title} 추천 대상 작성`,
    studyTips: overrides.studyTips,
    purchaseUrlKyobo: kyobo?.purchaseUrlKyobo,
    purchaseUrlYes24: yes24?.purchaseUrlYes24,
    tags: overrides.tags || ["TODO"],
    isActive: overrides.isActive ?? true,
    _meta: {
      collectedAt: new Date().toISOString(),
      sources,
      warnings,
    },
  };

  return draft;
}
