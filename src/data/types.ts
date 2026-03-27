export interface Publisher {
  id: string;
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface Subject {
  id: string;
  name: string;
  category: "common" | "general" | "career";
  displayOrder: number;
}

export type BookType =
  | "concept"
  | "type_basic"
  | "type_advanced"
  | "deep"
  | "past_exam";

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface Workbook {
  id: string;
  publisherId: string;
  subjectIds: string[]; // 여러 과목 지원 가능
  title: string;
  subtitle?: string;
  bookType: BookType;
  difficultyLevel: DifficultyLevel;
  difficultySub?: "low" | "mid" | "high";
  problemCount?: number;
  targetAudience?: string;
  coverImageUrl?: string;
  summary: string;
  description?: string;
  pros: string[];
  cons: string[];
  recommendedFor?: string;
  purchaseUrlKyobo?: string;
  purchaseUrlYes24?: string;
  tags: string[];
  isActive: boolean;
  avgRating: number;
  reviewCount: number;
}

export type RelationType = "next_step" | "complement" | "alternative";

export interface WorkbookRelation {
  id: string;
  fromWorkbookId: string;
  toWorkbookId: string;
  relationType: RelationType;
  note?: string;
  displayOrder: number;
}

export interface YoutubeLink {
  id: string;
  workbookId: string;
  youtubeUrl: string;
  channelName?: string;
  videoTitle?: string;
}

export interface Roadmap {
  id: string;
  name: string;
  description?: string;
  targetStartLevel: number;
  targetEndLevel: number;
  displayOrder: number;
}

export interface RoadmapStep {
  id: string;
  roadmapId: string;
  workbookId: string;
  stepOrder: number;
  isOptional: boolean;
  note?: string;
}

export type WorkbookStatus = "planned" | "in_progress" | "completed";

export interface UserWorkbook {
  id: string;
  userId: string;
  workbookId: string;
  status: WorkbookStatus;
  startedAt?: string;
  completedAt?: string;
  note?: string;
}

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  currentGrade?: "high1" | "high2" | "high3" | "repeater";
  currentLevel?: number;
  targetLevel?: number;
}

export interface WorkbookReview {
  id: string;
  workbookId: string;
  userId: string;
  rating: number;
  difficultyFelt?: "easy" | "moderate" | "hard";
  studyDurationDays?: number;
  title?: string;
  content: string;
  pros?: string;
  cons?: string;
  recommend: boolean;
  likesCount: number;
  createdAt: string;
}

// Constants
export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  1: "bg-emerald-500",
  2: "bg-blue-500",
  3: "bg-violet-500",
  4: "bg-orange-500",
  5: "bg-red-500",
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: "기초",
  2: "기본유형",
  3: "유형완성",
  4: "심화",
  5: "킬러",
};

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  concept: "개념서",
  type_basic: "기본유형서",
  type_advanced: "유형서",
  deep: "심화서",
  past_exam: "기출서",
};

export const GRADE_LABELS: Record<string, string> = {
  high1: "고1",
  high2: "고2",
  high3: "고3",
  repeater: "재수생",
};

export const STATUS_LABELS: Record<WorkbookStatus, string> = {
  planned: "예정",
  in_progress: "진행중",
  completed: "완료",
};

export const STATUS_ICONS: Record<WorkbookStatus, string> = {
  planned: "clipboard-list",
  in_progress: "book-open",
  completed: "check-circle",
};
