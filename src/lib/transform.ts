import type {
  Workbook, Publisher, WorkbookRelation, BookType, DifficultyLevel, UserWorkbook,
} from "@/data/types";

export interface WorkbookFilters {
  subjectId?: string;
  publisherId?: string;
  difficultyLevel?: DifficultyLevel;
  bookType?: BookType;
  search?: string;
  sort?: "difficulty" | "name";
}

export function filterWorkbooks(
  workbooks: Workbook[],
  publishers: Publisher[],
  filters?: WorkbookFilters
): Workbook[] {
  const pubById = new Map(publishers.map((p) => [p.id, p]));
  let result = workbooks.filter((w) => w.isActive);

  if (filters?.subjectId) result = result.filter((w) => w.subjectIds.includes(filters.subjectId!));
  if (filters?.publisherId) result = result.filter((w) => w.publisherId === filters.publisherId);
  if (filters?.difficultyLevel) result = result.filter((w) => w.difficultyLevel === filters.difficultyLevel);
  if (filters?.bookType) result = result.filter((w) => w.bookType === filters.bookType);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((w) =>
      w.title.toLowerCase().includes(q) ||
      (pubById.get(w.publisherId)?.name.toLowerCase().includes(q) ?? false)
    );
  }
  if (filters?.sort === "difficulty") {
    result = [...result].sort((a, b) => a.difficultyLevel - b.difficultyLevel);
  } else if (filters?.sort === "name") {
    result = [...result].sort((a, b) => a.title.localeCompare(b.title, "ko"));
  }
  return result;
}

type RelWithWb = WorkbookRelation & { workbook: Workbook };
export interface EnrichedRelations {
  nextSteps: RelWithWb[];
  complements: RelWithWb[];
  alternatives: RelWithWb[];
  previousSteps: RelWithWb[];
}

export function enrichRelations(
  workbookId: string,
  relations: WorkbookRelation[],
  workbooksById: Map<string, Workbook>
): EnrichedRelations {
  const forward = relations.filter((r) => r.fromWorkbookId === workbookId);
  const backward = relations.filter((r) => r.toWorkbookId === workbookId);
  const enrich = (rels: WorkbookRelation[], getId: (r: WorkbookRelation) => string) =>
    rels
      .map((r) => {
        const workbook = workbooksById.get(getId(r));
        return workbook ? { ...r, workbook } : null;
      })
      .filter(Boolean) as RelWithWb[];
  return {
    nextSteps: enrich(forward.filter((r) => r.relationType === "next_step"), (r) => r.toWorkbookId),
    complements: enrich(forward.filter((r) => r.relationType === "complement"), (r) => r.toWorkbookId),
    alternatives: enrich(forward.filter((r) => r.relationType === "alternative"), (r) => r.toWorkbookId),
    previousSteps: enrich(backward.filter((r) => r.relationType === "next_step"), (r) => r.fromWorkbookId),
  };
}

export interface MyRoadmapNode {
  workbook: Workbook;
  status: UserWorkbook["status"];
  startedAt?: string;
  completedAt?: string;
}
export interface MyRoadmapEdge {
  from: string;
  to: string;
  type: "next_step" | "complement";
  note?: string;
}

export function buildMyRoadmap(
  userWorkbooks: UserWorkbook[],
  workbooksById: Map<string, Workbook>,
  relations: WorkbookRelation[]
): {
  nodes: MyRoadmapNode[];
  edges: MyRoadmapEdge[];
  suggestedNext: (Workbook & { reason: string })[];
} {
  const statusOrder = { completed: 0, in_progress: 1, planned: 2 };
  const nodes = userWorkbooks
    .map((uw) => {
      const workbook = workbooksById.get(uw.workbookId);
      if (!workbook) return null;
      return { workbook, status: uw.status, startedAt: uw.startedAt, completedAt: uw.completedAt };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dA = a!.workbook.difficultyLevel, dB = b!.workbook.difficultyLevel;
      if (dA !== dB) return dA - dB;
      return statusOrder[a!.status] - statusOrder[b!.status];
    }) as MyRoadmapNode[];

  const ids = new Set(userWorkbooks.map((uw) => uw.workbookId));
  const edges: MyRoadmapEdge[] = [];
  for (const rel of relations) {
    if (ids.has(rel.fromWorkbookId) && ids.has(rel.toWorkbookId) &&
      (rel.relationType === "next_step" || rel.relationType === "complement")) {
      edges.push({ from: rel.fromWorkbookId, to: rel.toWorkbookId, type: rel.relationType, note: rel.note });
    }
  }
  if (edges.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ from: nodes[i].workbook.id, to: nodes[i + 1].workbook.id, type: "next_step" });
    }
  }

  const suggestedNext: (Workbook & { reason: string })[] = [];
  const seen = new Set<string>();
  for (const uw of userWorkbooks) {
    const rels = relations.filter((r) => r.fromWorkbookId === uw.workbookId && r.relationType === "next_step");
    for (const rel of rels) {
      if (!ids.has(rel.toWorkbookId) && !seen.has(rel.toWorkbookId)) {
        const wb = workbooksById.get(rel.toWorkbookId);
        if (wb) {
          const fromWb = workbooksById.get(uw.workbookId);
          suggestedNext.push({ ...wb, reason: `${fromWb?.title || ""} 다음 단계` });
          seen.add(rel.toWorkbookId);
        }
      }
    }
  }
  return { nodes, edges, suggestedNext };
}
