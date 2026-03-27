import { Roadmap, RoadmapStep } from "./types";

export const roadmaps: Roadmap[] = [
  {
    id: "rm-5to3",
    name: "5등급 → 3등급",
    description: "기초 다지기 로드맵. 개념 확립부터 기본 유형까지 단계별로 학습합니다.",
    targetStartLevel: 5,
    targetEndLevel: 3,
    displayOrder: 1,
  },
  {
    id: "rm-3to2",
    name: "3등급 → 2등급",
    description: "유형 완성 로드맵. 모든 유형을 익히고 심화 입문까지 도달합니다.",
    targetStartLevel: 3,
    targetEndLevel: 2,
    displayOrder: 2,
  },
  {
    id: "rm-2to1",
    name: "2등급 → 1등급",
    description: "심화 정복 로드맵. 고난도 문제를 정복하고 기출 반복으로 완성합니다.",
    targetStartLevel: 2,
    targetEndLevel: 1,
    displayOrder: 3,
  },
  {
    id: "rm-top",
    name: "최상위권 (만점)",
    description: "만점 목표 로드맵. 최고 난이도 문제를 정복합니다.",
    targetStartLevel: 1,
    targetEndLevel: 1,
    displayOrder: 4,
  },
];

export const roadmapSteps: RoadmapStep[] = [
  // ── 5등급 → 3등급 ──
  { id: "rs-1", roadmapId: "rm-5to3", workbookId: "wb-pungsanja", stepOrder: 1, isOptional: false, note: "개념 기초부터 시작" },
  { id: "rs-1a", roadmapId: "rm-5to3", workbookId: "wb-gaenyeomssen", stepOrder: 1, isOptional: true, note: "개념쎈도 대안으로 가능" },
  { id: "rs-2", roadmapId: "rm-5to3", workbookId: "wb-lightssen", stepOrder: 2, isOptional: false, note: "기본 유형 훈련" },
  { id: "rs-2a", roadmapId: "rm-5to3", workbookId: "wb-rpm", stepOrder: 2, isOptional: true, note: "RPM도 대안으로 가능" },
  { id: "rs-3", roadmapId: "rm-5to3", workbookId: "wb-ssen", stepOrder: 3, isOptional: false, note: "A+B단계 집중" },
  { id: "rs-4", roadmapId: "rm-5to3", workbookId: "wb-jaistory", stepOrder: 4, isOptional: false, note: "기출로 마무리" },

  // ── 3등급 → 2등급 ──
  { id: "rs-5", roadmapId: "rm-3to2", workbookId: "wb-gaenyeomwonri", stepOrder: 1, isOptional: false, note: "개념 완전 정리" },
  { id: "rs-6", roadmapId: "rm-3to2", workbookId: "wb-ssen", stepOrder: 2, isOptional: false, note: "전체 유형 마스터 (A+B+C)" },
  { id: "rs-6a", roadmapId: "rm-3to2", workbookId: "wb-maple-synergy", stepOrder: 2, isOptional: true, note: "마플시너지도 대안" },
  { id: "rs-7", roadmapId: "rm-3to2", workbookId: "wb-ilpum", stepOrder: 3, isOptional: false, note: "심화 입문" },
  { id: "rs-7a", roadmapId: "rm-3to2", workbookId: "wb-gojjaengi", stepOrder: 3, isOptional: true, note: "고쟁이도 대안" },
  { id: "rs-8", roadmapId: "rm-3to2", workbookId: "wb-maple-gichul", stepOrder: 4, isOptional: false, note: "기출 분석" },

  // ── 2등급 → 1등급 ──
  { id: "rs-9", roadmapId: "rm-2to1", workbookId: "wb-jungseok-basic", stepOrder: 1, isOptional: false, note: "개념 깊이 확보" },
  { id: "rs-10", roadmapId: "rm-2to1", workbookId: "wb-blacklabel", stepOrder: 2, isOptional: false, note: "심화 문제 정복" },
  { id: "rs-11", roadmapId: "rm-2to1", workbookId: "wb-absolutegrade", stepOrder: 3, isOptional: false, note: "킬러급 문제 도전" },
  { id: "rs-12", roadmapId: "rm-2to1", workbookId: "wb-maple-gichul", stepOrder: 4, isOptional: false, note: "기출 3회독" },
  { id: "rs-12a", roadmapId: "rm-2to1", workbookId: "wb-jaistory", stepOrder: 4, isOptional: true, note: "자이스토리 병행" },

  // ── 최상위권 (만점) ──
  { id: "rs-13", roadmapId: "rm-top", workbookId: "wb-jungseok-advanced", stepOrder: 1, isOptional: false, note: "실력편으로 심화 개념" },
  { id: "rs-14", roadmapId: "rm-top", workbookId: "wb-choigangtot", stepOrder: 2, isOptional: false, note: "최고 난이도 도전" },
  { id: "rs-14a", roadmapId: "rm-top", workbookId: "wb-mathgod", stepOrder: 2, isOptional: true, note: "수학의 신도 대안" },
  { id: "rs-15", roadmapId: "rm-top", workbookId: "wb-maple-gichul", stepOrder: 3, isOptional: false, note: "기출 반복 + N제" },
];
