import { existsSync } from "fs";
import type { Workbook } from "../../../src/data/types";
import { validateDraft, type ValidationIssue } from "./validate";
import type { WorkbookDraft } from "../types";
import { resolveLocalCoverPath, coverFilenameFromPath } from "./download-cover";

export function workbookToDraft(wb: Workbook): WorkbookDraft {
  return {
    id: wb.id,
    publisherId: wb.publisherId,
    subjectIds: wb.subjectIds,
    title: wb.title,
    subtitle: wb.subtitle,
    bookType: wb.bookType,
    difficultyLevel: wb.difficultyLevel,
    difficultySub: wb.difficultySub,
    problemCount: wb.problemCount,
    targetAudience: wb.targetAudience ?? "",
    coverImageUrl: wb.coverImageUrl,
    summary: wb.summary,
    description: wb.description ?? "",
    pros: wb.pros,
    cons: wb.cons,
    recommendedFor: wb.recommendedFor ?? "",
    studyTips: wb.studyTips,
    purchaseUrlKyobo: wb.purchaseUrlKyobo,
    purchaseUrlYes24: wb.purchaseUrlYes24,
    tags: wb.tags,
    isActive: wb.isActive,
  };
}

export function validateSeedWorkbook(
  wb: Workbook,
  opts: { coverExists: boolean }
): ValidationIssue[] {
  const issues = validateDraft(workbookToDraft(wb));

  if (wb.coverImageUrl?.startsWith("/covers/")) {
    if (!opts.coverExists) {
      issues.push({
        level: "error",
        field: "coverImageUrl",
        message: `public/covers 파일 없음: ${wb.coverImageUrl}`,
      });
    }
  }

  if (wb.summary.length > 70 || wb.summary.length < 20) {
    issues.push({
      level: "warn",
      field: "summary",
      message: `summary ${wb.summary.length}자 — 50자 내외 권장`,
    });
  }

  if (!wb.studyTips?.length) {
    issues.push({
      level: "warn",
      field: "studyTips",
      message: "studyTips 미입력",
    });
  }

  return issues;
}

export function coverFileExists(coverImageUrl?: string): boolean {
  if (!coverImageUrl?.startsWith("/covers/")) return false;
  try {
    const filename = coverFilenameFromPath(coverImageUrl);
    return existsSync(resolveLocalCoverPath(filename));
  } catch {
    return false;
  }
}

export function validateAllSeedWorkbooks(workbooks: Workbook[]): ValidationIssue[] {
  const all: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  for (const wb of workbooks.filter((w) => w.isActive)) {
    if (seenIds.has(wb.id)) {
      all.push({ level: "error", field: "id", message: `중복 ID: ${wb.id}` });
    }
    seenIds.add(wb.id);

    const normTitle = wb.title.trim().toLowerCase();
    if (seenTitles.has(normTitle)) {
      all.push({ level: "warn", field: "title", message: `중복 제목 가능: ${wb.title}` });
    }
    seenTitles.add(normTitle);

    const issues = validateSeedWorkbook(wb, { coverExists: coverFileExists(wb.coverImageUrl) });
    for (const issue of issues) {
      all.push({
        ...issue,
        message: `[${wb.id}] ${issue.message}`,
      });
    }
  }
  return all;
}
