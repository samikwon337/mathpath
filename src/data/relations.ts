import { WorkbookRelation } from "./types";

export const workbookRelations: WorkbookRelation[] = [
  // ── 좋은책신사고 라인업 ──
  { id: "rel-1", fromWorkbookId: "wb-gaenyeomssen", toWorkbookId: "wb-lightssen", relationType: "next_step", note: "개념 학습 후 유형 연습", displayOrder: 1 },
  { id: "rel-2", fromWorkbookId: "wb-lightssen", toWorkbookId: "wb-ssen", relationType: "next_step", note: "기본 유형 후 전체 유형 마스터", displayOrder: 2 },
  { id: "rel-3", fromWorkbookId: "wb-ssen", toWorkbookId: "wb-ilpum", relationType: "next_step", note: "유형 완성 후 심화 입문", displayOrder: 3 },
  { id: "rel-4", fromWorkbookId: "wb-basicssen", toWorkbookId: "wb-lightssen", relationType: "next_step", note: "기본 연산 후 유형 연습", displayOrder: 1 },

  // ── 개념원리 라인업 ──
  { id: "rel-5", fromWorkbookId: "wb-gaenyeomwonri", toWorkbookId: "wb-rpm", relationType: "next_step", note: "개념 학습 후 유형 훈련", displayOrder: 1 },
  { id: "rel-6", fromWorkbookId: "wb-rpm", toWorkbookId: "wb-ssen", relationType: "next_step", note: "유형 보강을 위해 쎈으로 이동", displayOrder: 2 },

  // ── 마플 라인업 ──
  { id: "rel-7", fromWorkbookId: "wb-maple-textbook", toWorkbookId: "wb-maple-synergy", relationType: "next_step", note: "개념 후 유형+심화", displayOrder: 1 },
  { id: "rel-8", fromWorkbookId: "wb-maple-synergy", toWorkbookId: "wb-maple-gichul", relationType: "next_step", note: "유형 후 기출 연습", displayOrder: 2 },

  // ── 지학사 라인업 ──
  { id: "rel-9", fromWorkbookId: "wb-pungsanja", toWorkbookId: "wb-pungsanja-type", relationType: "next_step", note: "개념 후 필수유형", displayOrder: 1 },
  { id: "rel-10", fromWorkbookId: "wb-pungsanja-type", toWorkbookId: "wb-lightssen", relationType: "next_step", note: "유형서로 레벨업", displayOrder: 2 },

  // ── 정석 라인업 ──
  { id: "rel-11", fromWorkbookId: "wb-jungseok-basic", toWorkbookId: "wb-jungseok-advanced", relationType: "next_step", note: "기본편 완료 후 실력편", displayOrder: 1 },

  // ── 크로스 출판사 보완 ──
  { id: "rel-12", fromWorkbookId: "wb-rpm", toWorkbookId: "wb-maple-synergy", relationType: "complement", note: "RPM 후 마플시너지로 유형 보강", displayOrder: 1 },
  { id: "rel-13", fromWorkbookId: "wb-ssen", toWorkbookId: "wb-gojjaengi", relationType: "complement", note: "쎈 C단계 어려울 때 고쟁이로 보완", displayOrder: 1 },
  { id: "rel-14", fromWorkbookId: "wb-ilpum", toWorkbookId: "wb-blacklabel", relationType: "next_step", note: "심화 입문 후 본격 심화", displayOrder: 1 },
  { id: "rel-15", fromWorkbookId: "wb-blacklabel", toWorkbookId: "wb-absolutegrade", relationType: "next_step", note: "심화 후 킬러급", displayOrder: 1 },

  // ── 기출서 보완 ──
  { id: "rel-16", fromWorkbookId: "wb-ssen", toWorkbookId: "wb-jaistory", relationType: "complement", note: "기출 연습 병행", displayOrder: 2 },
  { id: "rel-17", fromWorkbookId: "wb-ssen", toWorkbookId: "wb-mothertongue", relationType: "complement", note: "기출 연습 병행", displayOrder: 3 },
  { id: "rel-18", fromWorkbookId: "wb-ssen", toWorkbookId: "wb-maple-gichul", relationType: "complement", note: "기출 연습 병행", displayOrder: 4 },

  // ── 대안 관계 ──
  { id: "rel-19", fromWorkbookId: "wb-gaenyeomwonri", toWorkbookId: "wb-gaenyeomssen", relationType: "alternative", note: "개념서 대안", displayOrder: 1 },
  { id: "rel-20", fromWorkbookId: "wb-lightssen", toWorkbookId: "wb-rpm", relationType: "alternative", note: "유형서 대안", displayOrder: 1 },
  { id: "rel-21", fromWorkbookId: "wb-jaistory", toWorkbookId: "wb-mothertongue", relationType: "alternative", note: "기출서 대안", displayOrder: 1 },
  { id: "rel-22", fromWorkbookId: "wb-jaistory", toWorkbookId: "wb-maple-gichul", relationType: "alternative", note: "기출서 대안", displayOrder: 2 },

  // ── 최상위 라인업 ──
  { id: "rel-23", fromWorkbookId: "wb-jungseok-advanced", toWorkbookId: "wb-choigangtot", relationType: "next_step", note: "정석 실력편 후 최고 난도", displayOrder: 1 },
  { id: "rel-24", fromWorkbookId: "wb-absolutegrade", toWorkbookId: "wb-mathgod", relationType: "alternative", note: "킬러급 대안", displayOrder: 1 },

  // ── 완자 라인업 ──
  { id: "rel-25", fromWorkbookId: "wb-wanja", toWorkbookId: "wb-wanja-gichul", relationType: "next_step", note: "개념 후 기출", displayOrder: 1 },
  { id: "rel-26", fromWorkbookId: "wb-wanja", toWorkbookId: "wb-rpm", relationType: "alternative", note: "개념+유형 대안", displayOrder: 1 },

  // ── 디딤돌·입문 ──
  { id: "rel-27", fromWorkbookId: "wb-didimdol-concept", toWorkbookId: "wb-pungsanja", relationType: "alternative", note: "기초 개념서 대안", displayOrder: 1 },
  { id: "rel-28", fromWorkbookId: "wb-startup", toWorkbookId: "wb-gaenyeomssen", relationType: "next_step", note: "입문 후 개념쎈", displayOrder: 1 },
  { id: "rel-29", fromWorkbookId: "wb-goodbi", toWorkbookId: "wb-wanja", relationType: "alternative", note: "입문서 대안", displayOrder: 1 },

  // ── 천재교육 라인업 ──
  { id: "rel-30", fromWorkbookId: "wb-conceptplustype", toWorkbookId: "wb-choigangtot", relationType: "next_step", note: "유형 후 최고난도", displayOrder: 1 },
  { id: "rel-31", fromWorkbookId: "wb-conceptplustype", toWorkbookId: "wb-lightssen", relationType: "alternative", note: "유형서 대안", displayOrder: 1 },

  // ── 이투스 라인업 ──
  { id: "rel-32", fromWorkbookId: "wb-bible", toWorkbookId: "wb-gojjaengi", relationType: "complement", note: "개념 후 심화 보완", displayOrder: 1 },

  // ── EBS 라인업 ──
  { id: "rel-33", fromWorkbookId: "wb-olympos", toWorkbookId: "wb-mothertongue", relationType: "alternative", note: "수능 대비 대안", displayOrder: 1 },
  { id: "rel-34", fromWorkbookId: "wb-olympos", toWorkbookId: "wb-olympos-hard", relationType: "next_step", note: "기본 후 실전", displayOrder: 1 },
  { id: "rel-35", fromWorkbookId: "wb-olympos-hard", toWorkbookId: "wb-choigangtot", relationType: "complement", note: "고난도 보완", displayOrder: 1 },

  // ── 마플·개념원리 교차 ──
  { id: "rel-36", fromWorkbookId: "wb-maple-textbook", toWorkbookId: "wb-gaenyeomwonri", relationType: "alternative", note: "개념서 대안", displayOrder: 1 },
  { id: "rel-37", fromWorkbookId: "wb-jungseok-basic", toWorkbookId: "wb-gaenyeomwonri", relationType: "complement", note: "개념 보완", displayOrder: 1 },

  // ── 풍산자·마플 교차 ──
  { id: "rel-38", fromWorkbookId: "wb-pungsanja-type", toWorkbookId: "wb-maple-synergy", relationType: "alternative", note: "유형서 대안", displayOrder: 1 },

  // ── 진학사·능률 ──
  { id: "rel-39", fromWorkbookId: "wb-ildeunggup", toWorkbookId: "wb-blacklabel", relationType: "next_step", note: "준킬러 후 심화", displayOrder: 1 },
  { id: "rel-40", fromWorkbookId: "wb-haebeob", toWorkbookId: "wb-gaenyeomwonri", relationType: "alternative", note: "개념서 대안", displayOrder: 1 },

  // ── 신규 교재 (미래엔·쎈 과목별) ──
  { id: "rel-41", fromWorkbookId: "wb-mirae-jungseok", toWorkbookId: "wb-lightssen", relationType: "alternative", note: "미래엔 기본 후 쎈 대안", displayOrder: 1 },
  { id: "rel-42", fromWorkbookId: "wb-ssen", toWorkbookId: "wb-ssen-stats", relationType: "complement", note: "확통 유형 보강", displayOrder: 5 },
  { id: "rel-43", fromWorkbookId: "wb-ssen", toWorkbookId: "wb-ssen-geometry", relationType: "complement", note: "기하 유형 보강", displayOrder: 6 },
];
