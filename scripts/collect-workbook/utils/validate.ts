import { BOOK_TYPES, DIFFICULTY_LEVELS } from "../config";
import type { WorkbookDraft } from "../types";

export interface ValidationIssue {
  level: "error" | "warn";
  field: string;
  message: string;
}

export function validateDraft(draft: WorkbookDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!draft.id?.startsWith("wb-")) {
    issues.push({ level: "error", field: "id", message: "id는 wb- 로 시작해야 합니다." });
  }
  if (!draft.publisherId?.startsWith("pub-")) {
    issues.push({ level: "error", field: "publisherId", message: "publisherId가 필요합니다." });
  }
  if (!draft.subjectIds?.length) {
    issues.push({ level: "error", field: "subjectIds", message: "subjectIds가 비어 있습니다." });
  }
  if (!draft.title?.trim()) {
    issues.push({ level: "error", field: "title", message: "title이 필요합니다." });
  }
  if (!BOOK_TYPES.includes(draft.bookType)) {
    issues.push({ level: "error", field: "bookType", message: `bookType: ${BOOK_TYPES.join(" | ")}` });
  }
  if (!DIFFICULTY_LEVELS.includes(draft.difficultyLevel)) {
    issues.push({ level: "error", field: "difficultyLevel", message: "difficultyLevel은 1~5" });
  }
  if (!draft.summary?.trim()) {
    issues.push({ level: "error", field: "summary", message: "summary(한줄 요약)가 필요합니다." });
  } else if (draft.summary.length > 80) {
    issues.push({ level: "warn", field: "summary", message: "summary가 80자를 넘습니다. 카드 UI용으로 줄이세요." });
  }
  if (!draft.description?.trim()) {
    issues.push({ level: "error", field: "description", message: "description이 필요합니다." });
  }
  if (!draft.pros?.length || draft.pros.length < 2) {
    issues.push({ level: "warn", field: "pros", message: "pros는 최소 2개 권장" });
  }
  if (!draft.cons?.length || draft.cons.length < 2) {
    issues.push({ level: "warn", field: "cons", message: "cons는 최소 2개 권장" });
  }
  if (!draft.recommendedFor?.trim()) {
    issues.push({ level: "error", field: "recommendedFor", message: "recommendedFor가 필요합니다." });
  }
  if (!draft.targetAudience?.trim()) {
    issues.push({ level: "error", field: "targetAudience", message: "targetAudience가 필요합니다." });
  }
  if (!draft.tags?.length) {
    issues.push({ level: "warn", field: "tags", message: "tags가 비어 있습니다." });
  }
  if (!draft.purchaseUrlKyobo && !draft.purchaseUrlYes24) {
    issues.push({ level: "warn", field: "purchaseUrl", message: "구매 링크가 없습니다." });
  }
  if (!draft.coverImageUrl) {
    issues.push({ level: "warn", field: "coverImageUrl", message: "표지 이미지 URL이 없습니다." });
  }

  return issues;
}

export function printValidation(issues: ValidationIssue[]): boolean {
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");

  for (const issue of errors) {
    console.error(`  [ERROR] ${issue.field}: ${issue.message}`);
  }
  for (const issue of warns) {
    console.warn(`  [WARN]  ${issue.field}: ${issue.message}`);
  }

  return errors.length === 0;
}
