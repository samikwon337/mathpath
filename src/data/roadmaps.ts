import { Roadmap, RoadmapStep } from "./types";

export const roadmaps: Roadmap[] = [
  // ── 등급별 로드맵 ──
  {
    id: "rm-5to3",
    name: "5등급 → 3등급",
    description: "기초 다지기 로드맵. 개념 확립부터 기본 유형까지 단계별로 학습합니다.",
    type: "grade",
    targetStartLevel: 5,
    targetEndLevel: 3,
    displayOrder: 1,
  },
  {
    id: "rm-3to2",
    name: "3등급 → 2등급",
    description: "유형 완성 로드맵. 모든 유형을 익히고 심화 입문까지 도달합니다.",
    type: "grade",
    targetStartLevel: 3,
    targetEndLevel: 2,
    displayOrder: 2,
  },
  {
    id: "rm-2to1",
    name: "2등급 → 1등급",
    description: "심화 정복 로드맵. 고난도 문제를 정복하고 기출 반복으로 완성합니다.",
    type: "grade",
    targetStartLevel: 2,
    targetEndLevel: 1,
    displayOrder: 3,
  },
  {
    id: "rm-top",
    name: "최상위권 (만점)",
    description: "만점 목표 로드맵. 최고 난이도 문제를 정복합니다.",
    type: "grade",
    targetStartLevel: 1,
    targetEndLevel: 1,
    displayOrder: 4,
  },

  // ── 출판사별 로드맵 ──
  {
    id: "rm-pub-shinsago",
    name: "좋은책신사고 (쎈)",
    description: "쎈 시리즈 라인업. 개념쎈에서 시작해 일품까지 단계별 심화.",
    type: "publisher",
    publisherId: "pub-shinsago",
    targetStartLevel: 1,
    targetEndLevel: 4,
    displayOrder: 1,
  },
  {
    id: "rm-pub-gaenyeomwonri",
    name: "개념원리",
    description: "개념원리에서 RPM으로, 이후 타사 심화서로 확장하는 루트.",
    type: "publisher",
    publisherId: "pub-gaenyeomwonri",
    targetStartLevel: 1,
    targetEndLevel: 3,
    displayOrder: 2,
  },
  {
    id: "rm-pub-maple",
    name: "희망에듀 (마플)",
    description: "마플교과서에서 마플시너지, 마플기출까지 마플 시리즈 완주.",
    type: "publisher",
    publisherId: "pub-maple",
    targetStartLevel: 2,
    targetEndLevel: 3,
    displayOrder: 3,
  },
  {
    id: "rm-pub-jihaksa",
    name: "지학사 (풍산자)",
    description: "풍산자 개념에서 필수유형, 이후 타사 유형서로 레벨업.",
    type: "publisher",
    publisherId: "pub-jihaksa",
    targetStartLevel: 1,
    targetEndLevel: 2,
    displayOrder: 4,
  },
  {
    id: "rm-pub-sungji",
    name: "성지출판 (정석)",
    description: "수학의 정석 기본편에서 실력편까지. 전통의 깊이 있는 학습.",
    type: "publisher",
    publisherId: "pub-sungji",
    targetStartLevel: 2,
    targetEndLevel: 5,
    displayOrder: 5,
  },
  {
    id: "rm-pub-etoos",
    name: "이투스북",
    description: "수학의 바이블 개념서에서 고쟁이 심화서까지.",
    type: "publisher",
    publisherId: "pub-etoos",
    targetStartLevel: 2,
    targetEndLevel: 4,
    displayOrder: 6,
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

  // ══════════════════════════════════════════
  // 출판사별 로드맵
  // ══════════════════════════════════════════

  // ── 좋은책신사고 (쎈 시리즈): 개념쎈 → 베이직쎈/라이트쎈 → 쎈 → 일품 ──
  { id: "rsp-1", roadmapId: "rm-pub-shinsago", workbookId: "wb-gaenyeomssen", stepOrder: 1, isOptional: false, note: "Lv.1 개념 확립" },
  { id: "rsp-2", roadmapId: "rm-pub-shinsago", workbookId: "wb-basicssen", stepOrder: 1, isOptional: true, note: "연산 보강 필요 시" },
  { id: "rsp-3", roadmapId: "rm-pub-shinsago", workbookId: "wb-lightssen", stepOrder: 2, isOptional: false, note: "Lv.2 필수 유형 훈련" },
  { id: "rsp-4", roadmapId: "rm-pub-shinsago", workbookId: "wb-ssen", stepOrder: 3, isOptional: false, note: "Lv.3 A/B/C 전 단계" },
  { id: "rsp-5", roadmapId: "rm-pub-shinsago", workbookId: "wb-ilpum", stepOrder: 4, isOptional: false, note: "Lv.3~4 심화 입문" },
  { id: "rsp-5a", roadmapId: "rm-pub-shinsago", workbookId: "wb-blacklabel", stepOrder: 5, isOptional: true, note: "타사 심화로 확장 가능" },

  // ── 개념원리: 개념원리 → RPM → (타사 유형/심화서) ──
  { id: "rsp-6", roadmapId: "rm-pub-gaenyeomwonri", workbookId: "wb-gaenyeomwonri", stepOrder: 1, isOptional: false, note: "Lv.1 원리 중심 개념" },
  { id: "rsp-7", roadmapId: "rm-pub-gaenyeomwonri", workbookId: "wb-rpm", stepOrder: 2, isOptional: false, note: "Lv.2 유형 훈련" },
  { id: "rsp-8", roadmapId: "rm-pub-gaenyeomwonri", workbookId: "wb-ssen", stepOrder: 3, isOptional: false, note: "→ 쎈으로 유형 보강" },
  { id: "rsp-8a", roadmapId: "rm-pub-gaenyeomwonri", workbookId: "wb-maple-synergy", stepOrder: 3, isOptional: true, note: "→ 마플시너지도 대안" },

  // ── 희망에듀 (마플): 마플교과서 → 마플시너지 → 마플기출 ──
  { id: "rsp-9", roadmapId: "rm-pub-maple", workbookId: "wb-maple-textbook", stepOrder: 1, isOptional: false, note: "Lv.2 개념+풍부한 문제" },
  { id: "rsp-10", roadmapId: "rm-pub-maple", workbookId: "wb-maple-synergy", stepOrder: 2, isOptional: false, note: "Lv.3 유형+심화 혼합" },
  { id: "rsp-11", roadmapId: "rm-pub-maple", workbookId: "wb-maple-gichul", stepOrder: 3, isOptional: false, note: "Lv.3 기출 분석" },

  // ── 지학사 (풍산자): 풍산자 → 풍산자 필수유형 → 타사 유형서 ──
  { id: "rsp-12", roadmapId: "rm-pub-jihaksa", workbookId: "wb-pungsanja", stepOrder: 1, isOptional: false, note: "Lv.1 수포자 탈출" },
  { id: "rsp-13", roadmapId: "rm-pub-jihaksa", workbookId: "wb-pungsanja-type", stepOrder: 2, isOptional: false, note: "Lv.2 필수유형" },
  { id: "rsp-14", roadmapId: "rm-pub-jihaksa", workbookId: "wb-lightssen", stepOrder: 3, isOptional: false, note: "→ 라이트쎈으로 레벨업" },
  { id: "rsp-14a", roadmapId: "rm-pub-jihaksa", workbookId: "wb-rpm", stepOrder: 3, isOptional: true, note: "→ RPM도 대안" },

  // ── 성지출판 (정석): 기본편 → 실력편 → (타사 최고난도) ──
  { id: "rsp-15", roadmapId: "rm-pub-sungji", workbookId: "wb-jungseok-basic", stepOrder: 1, isOptional: false, note: "Lv.2 깊이 있는 개념" },
  { id: "rsp-16", roadmapId: "rm-pub-sungji", workbookId: "wb-jungseok-advanced", stepOrder: 2, isOptional: false, note: "Lv.4~5 심화 개념" },
  { id: "rsp-17", roadmapId: "rm-pub-sungji", workbookId: "wb-choigangtot", stepOrder: 3, isOptional: true, note: "→ 최강TOT로 확장" },
  { id: "rsp-17a", roadmapId: "rm-pub-sungji", workbookId: "wb-mathgod", stepOrder: 3, isOptional: true, note: "→ 수학의 신도 대안" },

  // ── 이투스북: 바이블 → 고쟁이 ──
  { id: "rsp-18", roadmapId: "rm-pub-etoos", workbookId: "wb-bible", stepOrder: 1, isOptional: false, note: "Lv.2 이해 중심 개념" },
  { id: "rsp-19", roadmapId: "rm-pub-etoos", workbookId: "wb-gojjaengi", stepOrder: 2, isOptional: false, note: "Lv.3~4 심화 유형" },
  { id: "rsp-19a", roadmapId: "rm-pub-etoos", workbookId: "wb-blacklabel", stepOrder: 3, isOptional: true, note: "→ 블랙라벨로 확장" },
];
