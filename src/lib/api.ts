import { publishers } from "@/data/publishers";
import { subjects } from "@/data/subjects";
import { workbooks } from "@/data/workbooks";
import { workbookRelations } from "@/data/relations";
import { roadmaps, roadmapSteps } from "@/data/roadmaps";
import { youtubeLinks } from "@/data/youtube-links";
import {
  BookType,
  DifficultyLevel,
  Workbook,
  WorkbookRelation,
  RoadmapStep,
} from "@/data/types";

// Publishers
export function getPublishers() {
  return publishers;
}

export function getPublisherById(id: string) {
  return publishers.find((p) => p.id === id);
}

// Subjects
export function getSubjects() {
  return subjects;
}

export function getSubjectById(id: string) {
  return subjects.find((s) => s.id === id);
}

// Workbooks
export function getWorkbooks(filters?: {
  subjectId?: string;
  publisherId?: string;
  difficultyLevel?: DifficultyLevel;
  bookType?: BookType;
  search?: string;
  sort?: "difficulty" | "name" | "rating";
}) {
  let result = workbooks.filter((w) => w.isActive);

  if (filters?.subjectId) {
    result = result.filter((w) => w.subjectIds.includes(filters.subjectId!));
  }
  if (filters?.publisherId) {
    result = result.filter((w) => w.publisherId === filters.publisherId);
  }
  if (filters?.difficultyLevel) {
    result = result.filter(
      (w) => w.difficultyLevel === filters.difficultyLevel
    );
  }
  if (filters?.bookType) {
    result = result.filter((w) => w.bookType === filters.bookType);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((w) => {
      const publisher = getPublisherById(w.publisherId);
      return (
        w.title.toLowerCase().includes(q) ||
        publisher?.name.toLowerCase().includes(q) ||
        false
      );
    });
  }

  if (filters?.sort === "difficulty") {
    result.sort((a, b) => a.difficultyLevel - b.difficultyLevel);
  } else if (filters?.sort === "name") {
    result.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  } else if (filters?.sort === "rating") {
    result.sort((a, b) => b.avgRating - a.avgRating);
  }

  return result;
}

export function getWorkbookById(id: string) {
  return workbooks.find((w) => w.id === id);
}

export function getWorkbooksByPublisher(publisherId: string) {
  return workbooks.filter(
    (w) => w.publisherId === publisherId && w.isActive
  );
}

// Relations
export function getWorkbookRelations(workbookId: string): {
  nextSteps: (WorkbookRelation & { workbook: Workbook })[];
  complements: (WorkbookRelation & { workbook: Workbook })[];
  alternatives: (WorkbookRelation & { workbook: Workbook })[];
  previousSteps: (WorkbookRelation & { workbook: Workbook })[];
} {
  const forward = workbookRelations.filter(
    (r) => r.fromWorkbookId === workbookId
  );
  const backward = workbookRelations.filter(
    (r) => r.toWorkbookId === workbookId
  );

  const enrich = (
    rels: WorkbookRelation[],
    getWorkbookIdFn: (r: WorkbookRelation) => string
  ) =>
    rels
      .map((r) => {
        const workbook = getWorkbookById(getWorkbookIdFn(r));
        return workbook ? { ...r, workbook } : null;
      })
      .filter(Boolean) as (WorkbookRelation & { workbook: Workbook })[];

  return {
    nextSteps: enrich(
      forward.filter((r) => r.relationType === "next_step"),
      (r) => r.toWorkbookId
    ),
    complements: enrich(
      forward.filter((r) => r.relationType === "complement"),
      (r) => r.toWorkbookId
    ),
    alternatives: enrich(
      forward.filter((r) => r.relationType === "alternative"),
      (r) => r.toWorkbookId
    ),
    previousSteps: enrich(
      backward.filter((r) => r.relationType === "next_step"),
      (r) => r.fromWorkbookId
    ),
  };
}

// Youtube Links
export function getYoutubeLinks(workbookId: string) {
  return youtubeLinks.filter((l) => l.workbookId === workbookId);
}

// Roadmaps
export function getRoadmaps() {
  return roadmaps.sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getRoadmapById(id: string) {
  return roadmaps.find((r) => r.id === id);
}

export function getRoadmapSteps(
  roadmapId: string
): (RoadmapStep & { workbook: Workbook })[] {
  return roadmapSteps
    .filter((s) => s.roadmapId === roadmapId)
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((s) => {
      const workbook = getWorkbookById(s.workbookId);
      return workbook ? { ...s, workbook } : null;
    })
    .filter(Boolean) as (RoadmapStep & { workbook: Workbook })[];
}
