import "server-only";
import { cache } from "react";
import { createServerSupabase } from "../supabase-server";
import {
  mapWorkbook, mapPublisher, mapSubject, mapRelation,
  mapRoadmap, mapRoadmapStep, mapYoutubeLink,
} from "./mappers";
import { filterWorkbooks, enrichRelations, type WorkbookFilters } from "../transform";
import type { Workbook } from "@/data/types";

export interface Catalog {
  workbooks: Workbook[];
  workbooksById: Map<string, Workbook>;
  publishers: ReturnType<typeof mapPublisher>[];
  subjects: ReturnType<typeof mapSubject>[];
  relations: ReturnType<typeof mapRelation>[];
  roadmaps: ReturnType<typeof mapRoadmap>[];
  roadmapSteps: ReturnType<typeof mapRoadmapStep>[];
  youtubeLinks: ReturnType<typeof mapYoutubeLink>[];
}

export const getCatalog = cache(async (): Promise<Catalog> => {
  const sb = createServerSupabase();
  const [wb, ws, sub, pub, rel, rm, steps, yt] = await Promise.all([
    sb.from("workbooks").select("*"),
    sb.from("workbook_subjects").select("*"),
    sb.from("subjects").select("*"),
    sb.from("publishers").select("*"),
    sb.from("workbook_relations").select("*"),
    sb.from("roadmaps").select("*"),
    sb.from("roadmap_steps").select("*"),
    sb.from("workbook_youtube_links").select("*"),
  ]);
  for (const res of [wb, ws, sub, pub, rel, rm, steps, yt]) {
    if (res.error) throw new Error(`카탈로그 조회 실패: ${res.error.message}`);
  }

  const subjectsByWorkbook = new Map<string, string[]>();
  for (const row of ws.data ?? []) {
    const list = subjectsByWorkbook.get(row.workbook_id) ?? [];
    list.push(row.subject_id);
    subjectsByWorkbook.set(row.workbook_id, list);
  }

  const workbooks = (wb.data ?? []).map((r) => mapWorkbook(r, subjectsByWorkbook.get(r.id) ?? []));
  return {
    workbooks,
    workbooksById: new Map(workbooks.map((w) => [w.id, w])),
    publishers: (pub.data ?? []).map(mapPublisher),
    subjects: (sub.data ?? []).map(mapSubject),
    relations: (rel.data ?? []).map(mapRelation),
    roadmaps: (rm.data ?? []).map(mapRoadmap),
    roadmapSteps: (steps.data ?? []).map(mapRoadmapStep),
    youtubeLinks: (yt.data ?? []).map(mapYoutubeLink),
  };
});

// ── api.ts와 동일 이름의 async 접근자 ──
export async function getWorkbooks(filters?: WorkbookFilters) {
  const c = await getCatalog();
  return filterWorkbooks(c.workbooks, c.publishers, filters);
}
export async function getWorkbookById(id: string) {
  return (await getCatalog()).workbooksById.get(id);
}
export async function getPublishers() {
  return (await getCatalog()).publishers;
}
export async function getPublisherById(id: string) {
  return (await getCatalog()).publishers.find((p) => p.id === id);
}
export async function getSubjects() {
  return (await getCatalog()).subjects;
}
export async function getWorkbooksByPublisher(publisherId: string) {
  const c = await getCatalog();
  return c.workbooks.filter((w) => w.publisherId === publisherId && w.isActive);
}
export async function getWorkbookRelations(workbookId: string) {
  const c = await getCatalog();
  return enrichRelations(workbookId, c.relations, c.workbooksById);
}
export async function getRoadmaps(type?: "grade" | "publisher") {
  const c = await getCatalog();
  const r = type ? c.roadmaps.filter((x) => x.type === type) : c.roadmaps;
  return [...r].sort((a, b) => a.displayOrder - b.displayOrder);
}
export async function getRoadmapById(id: string) {
  return (await getCatalog()).roadmaps.find((r) => r.id === id);
}
export async function getRoadmapSteps(roadmapId: string) {
  const c = await getCatalog();
  return c.roadmapSteps
    .filter((s) => s.roadmapId === roadmapId)
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((s) => {
      const workbook = c.workbooksById.get(s.workbookId);
      return workbook ? { ...s, workbook } : null;
    })
    .filter(Boolean) as (ReturnType<typeof mapRoadmapStep> & { workbook: Workbook })[];
}
export async function getYoutubeLinksByWorkbookId(workbookId: string) {
  const c = await getCatalog();
  return c.youtubeLinks
    .filter((l) => l.workbookId === workbookId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
