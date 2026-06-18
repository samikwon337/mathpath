import { Subject } from "./types";

export const subjects: Subject[] = [
  { id: "sub-common1", name: "공통수학1", category: "common", studyPeriod: "고1 1학기", displayOrder: 1 },
  { id: "sub-common2", name: "공통수학2", category: "common", studyPeriod: "고1 2학기", displayOrder: 2 },
  { id: "sub-algebra", name: "대수", category: "general", studyPeriod: "고2 1학기", displayOrder: 3 },
  { id: "sub-calculus1", name: "미적분I", category: "general", studyPeriod: "고2 2학기", displayOrder: 4 },
  { id: "sub-stats", name: "확률과 통계", category: "general", studyPeriod: "고2 2학기", displayOrder: 5 },
  { id: "sub-calculus2", name: "미적분II", category: "career", studyPeriod: "고3 1학기", displayOrder: 6 },
  { id: "sub-geometry", name: "기하", category: "career", studyPeriod: "고3 2학기", displayOrder: 7 },
];
