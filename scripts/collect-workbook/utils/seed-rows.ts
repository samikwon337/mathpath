import type {
  Publisher,
  Subject,
  Workbook,
  WorkbookRelation,
  Roadmap,
  RoadmapStep,
  WorkbookYoutubeLink,
} from "../../../src/data/types";

export function toPublisherRow(p: Publisher) {
  return { id: p.id, name: p.name, logo_url: p.logoUrl, website_url: p.websiteUrl };
}

export function toSubjectRow(s: Subject) {
  return { id: s.id, name: s.name, category: s.category, display_order: s.displayOrder };
}

export function toWorkbookRow(w: Workbook) {
  return {
    id: w.id,
    publisher_id: w.publisherId,
    title: w.title,
    subtitle: w.subtitle,
    book_type: w.bookType,
    difficulty_level: w.difficultyLevel,
    difficulty_sub: w.difficultySub,
    problem_count: w.problemCount,
    target_audience: w.targetAudience,
    cover_image_url: w.coverImageUrl,
    summary: w.summary,
    description: w.description,
    pros: w.pros,
    cons: w.cons,
    recommended_for: w.recommendedFor,
    study_tips: w.studyTips ?? [],
    purchase_url_kyobo: w.purchaseUrlKyobo,
    purchase_url_yes24: w.purchaseUrlYes24,
    tags: w.tags,
    is_active: w.isActive,
  };
}

export function toWorkbookSubjectRows(w: Workbook) {
  return w.subjectIds.map((subjectId) => ({
    workbook_id: w.id,
    subject_id: subjectId,
  }));
}

export function toRelationRow(r: WorkbookRelation) {
  return {
    id: r.id,
    from_workbook_id: r.fromWorkbookId,
    to_workbook_id: r.toWorkbookId,
    relation_type: r.relationType,
    note: r.note,
    display_order: r.displayOrder,
  };
}

export function toRoadmapRow(r: Roadmap) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    type: r.type,
    publisher_id: r.publisherId,
    target_start_level: r.targetStartLevel,
    target_end_level: r.targetEndLevel,
    display_order: r.displayOrder,
  };
}

export function toRoadmapStepRow(s: RoadmapStep) {
  return {
    id: s.id,
    roadmap_id: s.roadmapId,
    workbook_id: s.workbookId,
    step_order: s.stepOrder,
    is_optional: s.isOptional,
    note: s.note,
    estimated_study_days: s.estimatedStudyDays,
  };
}

export function toYoutubeLinkRow(l: WorkbookYoutubeLink) {
  return {
    id: l.id,
    workbook_id: l.workbookId,
    youtube_url: l.youtubeUrl,
    video_title: l.videoTitle,
    channel_name: l.channelName,
    display_order: l.displayOrder,
  };
}
