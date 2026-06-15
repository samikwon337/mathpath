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

type Row = Record<string, any>;
const orUndef = <T>(v: T | null | undefined): T | undefined =>
  v == null ? undefined : v;

export function mapPublisher(r: Row): Publisher {
  return {
    id: r.id,
    name: r.name,
    logoUrl: orUndef(r.logo_url),
    websiteUrl: orUndef(r.website_url),
  };
}

export function mapSubject(r: Row): Subject {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    displayOrder: r.display_order,
  };
}

export function mapWorkbook(r: Row, subjectIds: string[]): Workbook {
  return {
    id: r.id,
    publisherId: r.publisher_id,
    subjectIds,
    title: r.title,
    subtitle: orUndef(r.subtitle),
    bookType: r.book_type as BookType,
    difficultyLevel: r.difficulty_level as DifficultyLevel,
    difficultySub: orUndef(r.difficulty_sub),
    problemCount: orUndef(r.problem_count),
    targetAudience: orUndef(r.target_audience),
    coverImageUrl: orUndef(r.cover_image_url),
    summary: r.summary ?? "",
    description: orUndef(r.description),
    pros: r.pros ?? [],
    cons: r.cons ?? [],
    recommendedFor: orUndef(r.recommended_for),
    studyTips: orUndef(r.study_tips),
    purchaseUrlKyobo: orUndef(r.purchase_url_kyobo),
    purchaseUrlYes24: orUndef(r.purchase_url_yes24),
    tags: r.tags ?? [],
    isActive: r.is_active,
  };
}

export function mapRelation(r: Row): WorkbookRelation {
  return {
    id: r.id,
    fromWorkbookId: r.from_workbook_id,
    toWorkbookId: r.to_workbook_id,
    relationType: r.relation_type as RelationType,
    note: orUndef(r.note),
    displayOrder: r.display_order ?? 0,
  };
}

export function mapRoadmap(r: Row): Roadmap {
  return {
    id: r.id,
    name: r.name,
    description: orUndef(r.description),
    type: r.type as RoadmapType,
    targetStartLevel: r.target_start_level,
    targetEndLevel: r.target_end_level,
    publisherId: orUndef(r.publisher_id),
    displayOrder: r.display_order ?? 0,
  };
}

export function mapRoadmapStep(r: Row): RoadmapStep {
  return {
    id: r.id,
    roadmapId: r.roadmap_id,
    workbookId: r.workbook_id,
    stepOrder: r.step_order,
    isOptional: r.is_optional,
    note: orUndef(r.note),
    estimatedStudyDays: orUndef(r.estimated_study_days),
  };
}

export function mapYoutubeLink(r: Row): WorkbookYoutubeLink {
  return {
    id: r.id,
    workbookId: r.workbook_id,
    youtubeUrl: r.youtube_url,
    videoTitle: r.video_title,
    channelName: orUndef(r.channel_name),
    displayOrder: r.display_order ?? 0,
  };
}
