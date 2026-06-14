import {
  BookType,
  RoadmapStep,
  Workbook,
} from "@/data/types";
import {
  roadmapGradeGroups,
  roadmapSteps,
  RoadmapGradeGroup,
} from "@/data/roadmaps";
import { workbooks } from "@/data/workbooks";

export const DEFAULT_STUDY_HOURS_PER_DAY = 2;
export const STUDY_HOURS_STORAGE_KEY = "mathpath:study-hours-per-day";
export const MIN_STUDY_HOURS_PER_DAY = 0.5;
export const MAX_STUDY_HOURS_PER_DAY = 8;
export const STUDY_HOURS_STEP = 0.5;

export const STUDY_HOURS_PRESETS = [1, 1.5, 2, 2.5, 3, 4] as const;

const BOOK_TYPE_FALLBACK_DAYS: Record<BookType, number> = {
  concept: 21,
  type_basic: 28,
  type_advanced: 42,
  past_exam: 28,
  deep: 35,
};

const warnedSteps = new Set<string>();

export interface StepDuration {
  totalHours: number;
  days: number;
  weeks: number;
}

export type TimelineStep = RoadmapStep & {
  workbook: Workbook;
  duration: StepDuration;
};

export interface RoadmapTimelineResult {
  steps: TimelineStep[];
  groups: Array<{ group: RoadmapGradeGroup; cumulativeWeeks: number }>;
  total: StepDuration;
}

function getWorkbookById(id: string): Workbook | undefined {
  return workbooks.find((w) => w.id === id);
}

function getEstimatedStudyDaysAt2h(
  step: RoadmapStep,
  workbook: Workbook | undefined
): number {
  if (step.estimatedStudyDays != null) {
    return step.estimatedStudyDays;
  }
  if (workbook?.bookType) {
    return BOOK_TYPE_FALLBACK_DAYS[workbook.bookType];
  }
  if (!warnedSteps.has(step.id)) {
    warnedSteps.add(step.id);
    console.warn(
      `[roadmap-timeline] missing estimatedStudyDays for step ${step.id}`
    );
  }
  return 28;
}

export function clampStudyHours(hours: number): number {
  const stepped = Math.round(hours / STUDY_HOURS_STEP) * STUDY_HOURS_STEP;
  return Math.min(
    MAX_STUDY_HOURS_PER_DAY,
    Math.max(MIN_STUDY_HOURS_PER_DAY, stepped)
  );
}

export function getStepDuration(
  step: RoadmapStep,
  workbook: Workbook | undefined,
  hoursPerDay: number
): StepDuration {
  const safeHours = clampStudyHours(hoursPerDay);
  const baseDays = getEstimatedStudyDaysAt2h(step, workbook);
  const totalHours = baseDays * DEFAULT_STUDY_HOURS_PER_DAY;
  const days = Math.ceil(totalHours / safeHours);
  const weeks = Math.ceil(days / 7);
  return { totalHours, days, weeks };
}

export function formatDurationWeeks(weeks: number): string {
  return `약 ${weeks}주`;
}

export function sumStepDurations(steps: TimelineStep[]): StepDuration {
  const totalDays = steps.reduce((sum, s) => sum + s.duration.days, 0);
  const totalHours = steps.reduce((sum, s) => sum + s.duration.totalHours, 0);
  return {
    totalHours,
    days: totalDays,
    weeks: Math.ceil(totalDays / 7),
  };
}

export function getDefaultSelectedStepIds(steps: TimelineStep[]): string[] {
  return steps.filter((s) => !s.isOptional).map((s) => s.id);
}

export function getRoadmapTimeline(
  roadmapId: string,
  hoursPerDay: number
): RoadmapTimelineResult {
  const steps: TimelineStep[] = roadmapSteps
    .filter((s) => s.roadmapId === roadmapId)
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((s) => {
      const workbook = getWorkbookById(s.workbookId);
      if (!workbook) return null;
      return {
        ...s,
        workbook,
        duration: getStepDuration(s, workbook, hoursPerDay),
      };
    })
    .filter((s): s is TimelineStep => s !== null);

  const mandatorySteps = steps.filter((s) => !s.isOptional);
  const totalDays = mandatorySteps.reduce((sum, s) => sum + s.duration.days, 0);
  const totalHours = mandatorySteps.reduce(
    (sum, s) => sum + s.duration.totalHours,
    0
  );
  const total: StepDuration = {
    totalHours,
    days: totalDays,
    weeks: Math.ceil(totalDays / 7),
  };

  const gradeGroups = roadmapGradeGroups[roadmapId];
  let groups: Array<{ group: RoadmapGradeGroup; cumulativeWeeks: number }> =
    [];

  if (gradeGroups) {
    let cumulativeDays = 0;
    groups = gradeGroups.map((group) => {
      const groupMandatory = mandatorySteps.filter((s) =>
        group.stepOrders.includes(s.stepOrder)
      );
      cumulativeDays += groupMandatory.reduce(
        (sum, s) => sum + s.duration.days,
        0
      );
      return {
        group,
        cumulativeWeeks: Math.ceil(cumulativeDays / 7),
      };
    });
  }

  return { steps, groups, total };
}
