import type { WorkbookDraft } from "../types";

function quote(value: string): string {
  return JSON.stringify(value);
}

function formatStringArray(items: string[], indent: string): string {
  if (!items.length) return "[]";
  return `[\n${items.map((item) => `${indent}  ${quote(item)},`).join("\n")}\n${indent}]`;
}

/** workbooks.ts에 붙여넣을 TypeScript 객체 문자열 */
export function formatWorkbookTs(draft: WorkbookDraft): string {
  const lines: string[] = ["  {"];
  lines.push(`    id: ${quote(draft.id)},`);

  if (draft.coverImageUrl) {
    lines.push(`    coverImageUrl: ${quote(draft.coverImageUrl)},`);
  }

  lines.push(`    publisherId: ${quote(draft.publisherId)},`);
  lines.push(
    `    subjectIds: [${draft.subjectIds.map((s) => quote(s)).join(", ")}],`
  );
  lines.push(`    title: ${quote(draft.title)},`);

  if (draft.subtitle) lines.push(`    subtitle: ${quote(draft.subtitle)},`);

  lines.push(`    bookType: ${quote(draft.bookType)},`);
  lines.push(`    difficultyLevel: ${draft.difficultyLevel},`);

  if (draft.difficultySub) {
    lines.push(`    difficultySub: ${quote(draft.difficultySub)},`);
  }
  if (draft.problemCount != null) {
    lines.push(`    problemCount: ${draft.problemCount},`);
  }

  lines.push(`    targetAudience: ${quote(draft.targetAudience)},`);
  lines.push(`    summary: ${quote(draft.summary)},`);
  lines.push(`    description: ${quote(draft.description)},`);
  lines.push(`    pros: ${formatStringArray(draft.pros, "    ")},`);
  lines.push(`    cons: ${formatStringArray(draft.cons, "    ")},`);
  lines.push(`    recommendedFor: ${quote(draft.recommendedFor)},`);

  if (draft.studyTips?.length) {
    lines.push(`    studyTips: ${formatStringArray(draft.studyTips, "    ")},`);
  }
  if (draft.purchaseUrlKyobo) {
    lines.push(`    purchaseUrlKyobo: ${quote(draft.purchaseUrlKyobo)},`);
  }
  if (draft.purchaseUrlYes24) {
    lines.push(`    purchaseUrlYes24: ${quote(draft.purchaseUrlYes24)},`);
  }

  lines.push(`    tags: ${formatStringArray(draft.tags, "    ")},`);
  lines.push(`    isActive: ${draft.isActive},`);
  lines.push("  },");

  return lines.join("\n");
}
