import type {
  Publisher,
  Subject,
  Workbook,
  WorkbookRelation,
  Roadmap,
  RoadmapStep,
  WorkbookYoutubeLink,
  BookType,
  DifficultyLevel,
  RelationType,
  RoadmapType,
} from "@/data/types";

// DB row는 외부(untrusted) 입력이므로 unknown으로 받고, 매퍼가 경계에서 좁힌다.
type Row = Record<string, unknown>;
const str = (v: unknown): string => v as string;
const num = (v: unknown): number => v as number;
const bool = (v: unknown): boolean => v as boolean;
const strArr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
const orUndef = <T>(v: unknown): T | undefined => (v == null ? undefined : (v as T));

export function mapPublisher(r: Row): Publisher {
  return {
    id: str(r.id),
    name: str(r.name),
    logoUrl: orUndef<string>(r.logo_url),
    websiteUrl: orUndef<string>(r.website_url),
  };
}

export function mapSubject(r: Row): Subject {
  return {
    id: str(r.id),
    name: str(r.name),
    category: r.category as Subject["category"],
    displayOrder: num(r.display_order),
  };
}

export function mapWorkbook(r: Row, subjectIds: string[]): Workbook {
  return {
    id: str(r.id),
    publisherId: str(r.publisher_id),
    subjectIds,
    title: str(r.title),
    subtitle: orUndef<string>(r.subtitle),
    bookType: r.book_type as BookType,
    difficultyLevel: r.difficulty_level as DifficultyLevel,
    difficultySub: orUndef<Workbook["difficultySub"]>(r.difficulty_sub),
    problemCount: orUndef<number>(r.problem_count),
    targetAudience: orUndef<string>(r.target_audience),
    coverImageUrl: orUndef<string>(r.cover_image_url),
    summary: orUndef<string>(r.summary) ?? "",
    description: orUndef<string>(r.description),
    pros: strArr(r.pros),
    cons: strArr(r.cons),
    recommendedFor: orUndef<string>(r.recommended_for),
    studyTips: orUndef<string[]>(r.study_tips),
    purchaseUrlKyobo: orUndef<string>(r.purchase_url_kyobo),
    purchaseUrlYes24: orUndef<string>(r.purchase_url_yes24),
    tags: strArr(r.tags),
    isActive: bool(r.is_active),
  };
}

export function mapRelation(r: Row): WorkbookRelation {
  return {
    id: str(r.id),
    fromWorkbookId: str(r.from_workbook_id),
    toWorkbookId: str(r.to_workbook_id),
    relationType: r.relation_type as RelationType,
    note: orUndef<string>(r.note),
    displayOrder: orUndef<number>(r.display_order) ?? 0,
  };
}

export function mapRoadmap(r: Row): Roadmap {
  return {
    id: str(r.id),
    name: str(r.name),
    description: orUndef<string>(r.description),
    type: r.type as RoadmapType,
    targetStartLevel: orUndef<number>(r.target_start_level) ?? 0,
    targetEndLevel: orUndef<number>(r.target_end_level) ?? 0,
    publisherId: orUndef<string>(r.publisher_id),
    displayOrder: orUndef<number>(r.display_order) ?? 0,
  };
}

export function mapRoadmapStep(r: Row): RoadmapStep {
  return {
    id: str(r.id),
    roadmapId: str(r.roadmap_id),
    workbookId: str(r.workbook_id),
    stepOrder: num(r.step_order),
    isOptional: bool(r.is_optional),
    note: orUndef<string>(r.note),
    estimatedStudyDays: orUndef<number>(r.estimated_study_days),
  };
}

export function mapYoutubeLink(r: Row): WorkbookYoutubeLink {
  return {
    id: str(r.id),
    workbookId: str(r.workbook_id),
    youtubeUrl: str(r.youtube_url),
    videoTitle: str(r.video_title),
    channelName: orUndef<string>(r.channel_name),
    displayOrder: orUndef<number>(r.display_order) ?? 0,
  };
}
