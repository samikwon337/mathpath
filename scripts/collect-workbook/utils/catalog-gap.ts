import type { Workbook } from "../../src/data/types";

export interface PublisherGap {
  publisherId: string;
  current: number;
  minimum: number;
  status: "ok" | "below";
}

export interface SubjectCount {
  subjectId: string;
  name: string;
  count: number;
}

export interface CatalogGapReport {
  totalWorkbooks: number;
  publisherGaps: PublisherGap[];
  subjectCounts: SubjectCount[];
  missingRoadmapIds: string[];
}

interface AnalyzeInput {
  workbooks: Pick<Workbook, "id" | "publisherId" | "subjectIds" | "title">[];
  roadmapWorkbookIds: string[];
  publisherMinCounts: Record<string, number>;
  subjectNames: Record<string, string>;
}

export function analyzeCatalogGap(input: AnalyzeInput): CatalogGapReport {
  const active = input.workbooks;
  const byPublisher = new Map<string, number>();
  for (const wb of active) {
    byPublisher.set(wb.publisherId, (byPublisher.get(wb.publisherId) ?? 0) + 1);
  }

  const publisherGaps: PublisherGap[] = Object.entries(input.publisherMinCounts).map(
    ([publisherId, minimum]) => {
      const current = byPublisher.get(publisherId) ?? 0;
      return {
        publisherId,
        current,
        minimum,
        status: current >= minimum ? "ok" : "below",
      };
    }
  );

  const subjectCountsMap = new Map<string, number>();
  for (const wb of active) {
    for (const sid of wb.subjectIds) {
      subjectCountsMap.set(sid, (subjectCountsMap.get(sid) ?? 0) + 1);
    }
  }
  const subjectCounts: SubjectCount[] = [...subjectCountsMap.entries()]
    .map(([subjectId, count]) => ({
      subjectId,
      name: input.subjectNames[subjectId] ?? subjectId,
      count,
    }))
    .sort((a, b) => a.subjectId.localeCompare(b.subjectId));

  const catalogIds = new Set(active.map((w) => w.id));
  const missingRoadmapIds = [...new Set(input.roadmapWorkbookIds)].filter(
    (id) => !catalogIds.has(id)
  );

  return {
    totalWorkbooks: active.length,
    publisherGaps,
    subjectCounts,
    missingRoadmapIds,
  };
}

export function printCatalogGapReport(report: CatalogGapReport): number {
  console.log(`\n총 문제집: ${report.totalWorkbooks}권 (목표: 35+)\n`);

  const below = report.publisherGaps.filter((g) => g.status === "below");
  console.log("── 출판사별 (PRD 최소) ──");
  for (const g of report.publisherGaps.sort((a, b) => a.publisherId.localeCompare(b.publisherId))) {
    const mark = g.status === "ok" ? "✓" : "✗";
    console.log(`  ${mark} ${g.publisherId}: ${g.current}/${g.minimum}`);
  }

  console.log("\n── 과목별 권수 (정보) ──");
  for (const s of report.subjectCounts) {
    console.log(`  ${s.name} (${s.subjectId}): ${s.count}권`);
  }

  if (report.missingRoadmapIds.length) {
    console.log("\n── 로드맵 누락 ──");
    report.missingRoadmapIds.forEach((id) => console.log(`  ✗ ${id}`));
  } else {
    console.log("\n── 로드맵 참조: 모두 존재 ✓");
  }

  const issues =
    below.length +
    report.missingRoadmapIds.length +
    (report.totalWorkbooks < 35 ? 1 : 0);

  if (report.totalWorkbooks < 35) {
    console.log(`\n✗ 전체 권수 미달: ${report.totalWorkbooks}/35`);
  }

  return issues > 0 ? 1 : 0;
}
