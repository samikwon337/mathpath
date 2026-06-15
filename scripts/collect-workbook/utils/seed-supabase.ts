import type { SupabaseClient } from "@supabase/supabase-js";
import { publishers } from "../../../src/data/publishers";
import { subjects } from "../../../src/data/subjects";
import { workbooks } from "../../../src/data/workbooks";
import { workbookRelations } from "../../../src/data/relations";
import { roadmaps, roadmapSteps } from "../../../src/data/roadmaps";
import { workbookYoutubeLinks } from "../../../src/data/youtube-links";
import {
  toPublisherRow,
  toSubjectRow,
  toWorkbookRow,
  toWorkbookSubjectRows,
  toRelationRow,
  toRoadmapRow,
  toRoadmapStepRow,
  toYoutubeLinkRow,
} from "./seed-rows";

async function upsert(sb: SupabaseClient, table: string, rows: unknown[]) {
  if (rows.length === 0) return;
  const { error } = await sb.from(table).upsert(rows as never, { onConflict: "id" });
  if (error) throw new Error(`${table} upsert 실패: ${error.message}`);
  console.log(`  ✓ ${table}: ${rows.length}행`);
}

/** src/data 전체를 Supabase에 멱등 upsert. 부모→자식 순서로 FK 보장. */
export async function seedAll(sb: SupabaseClient): Promise<void> {
  await upsert(sb, "publishers", publishers.map(toPublisherRow));
  await upsert(sb, "subjects", subjects.map(toSubjectRow));
  await upsert(sb, "workbooks", workbooks.map(toWorkbookRow));

  // 다대다 조인: 워크북별 기존 매핑 삭제 후 재삽입(멱등)
  const subjectRows = workbooks.flatMap(toWorkbookSubjectRows);
  const workbookIds = workbooks.map((w) => w.id);
  const { error: delErr } = await sb
    .from("workbook_subjects")
    .delete()
    .in("workbook_id", workbookIds);
  if (delErr) throw new Error(`workbook_subjects 정리 실패: ${delErr.message}`);
  if (subjectRows.length > 0) {
    const { error } = await sb.from("workbook_subjects").insert(subjectRows as never);
    if (error) throw new Error(`workbook_subjects insert 실패: ${error.message}`);
    console.log(`  ✓ workbook_subjects: ${subjectRows.length}행`);
  }

  await upsert(sb, "workbook_relations", workbookRelations.map(toRelationRow));
  await upsert(sb, "roadmaps", roadmaps.map(toRoadmapRow));
  await upsert(sb, "roadmap_steps", roadmapSteps.map(toRoadmapStepRow));
  await upsert(sb, "workbook_youtube_links", workbookYoutubeLinks.map(toYoutubeLinkRow));
}
