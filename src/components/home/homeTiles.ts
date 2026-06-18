export type HomeTileKey =
  | "hero"
  | "quickRecommend"
  | "gradeRoadmap"
  | "publisherLineup"
  | "levelShortcut"
  | "emptyRoadmap"
  | "greetingStats"
  | "progress"
  | "addBook"
  | "myRoadmap"
  | "nextSteps"
  | "myBooks"
  | "recommendedRoadmap";

export interface HomeTileSpec {
  key: HomeTileKey;
  /** Tailwind 그리드 span 클래스 (모바일 1열, md에서 4열) */
  span: string;
}

export interface HomeTileContext {
  isLoggedIn: boolean;
  hasWorkbooks: boolean;
}

const LOGGED_OUT: readonly HomeTileSpec[] = [
  { key: "hero", span: "md:col-span-2" },
  { key: "quickRecommend", span: "md:col-span-2" },
  { key: "gradeRoadmap", span: "md:col-span-2" },
  { key: "publisherLineup", span: "md:col-span-2" },
  { key: "levelShortcut", span: "md:col-span-4" },
];

const LOGGED_IN_EMPTY: readonly HomeTileSpec[] = [
  { key: "emptyRoadmap", span: "md:col-span-4" },
  { key: "quickRecommend", span: "md:col-span-2" },
  { key: "gradeRoadmap", span: "md:col-span-2" },
  { key: "levelShortcut", span: "md:col-span-4" },
];

const LOGGED_IN_FULL: readonly HomeTileSpec[] = [
  { key: "greetingStats", span: "md:col-span-2" },
  { key: "progress", span: "md:col-span-1" },
  { key: "addBook", span: "md:col-span-1" },
  { key: "myRoadmap", span: "md:col-span-3" },
  { key: "nextSteps", span: "md:col-span-1" },
  { key: "myBooks", span: "md:col-span-2" },
  { key: "quickRecommend", span: "md:col-span-2" },
  { key: "recommendedRoadmap", span: "md:col-span-2" },
  { key: "levelShortcut", span: "md:col-span-2" },
];

export function getHomeTiles(ctx: HomeTileContext): readonly HomeTileSpec[] {
  if (!ctx.isLoggedIn) return LOGGED_OUT;
  return ctx.hasWorkbooks ? LOGGED_IN_FULL : LOGGED_IN_EMPTY;
}
