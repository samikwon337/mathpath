/** 출판사명 → publisher_id 매핑 */
export const PUBLISHER_NAME_MAP: Record<string, string> = {
  "좋은책신사고": "pub-shinsago",
  "개념원리": "pub-gaenyeomwonri",
  "천재교육": "pub-chunjae",
  "비상교육": "pub-visang",
  "디딤돌": "pub-didimdol",
  "디딤돌교육": "pub-didimdol",
  "수경출판사": "pub-sukyung",
  "수경": "pub-sukyung",
  "희망에듀": "pub-maple",
  "진학사": "pub-jinhaksa",
  "이투스북": "pub-etoos",
  "이투스": "pub-etoos",
  "성지출판": "pub-sungji",
  "성지": "pub-sungji",
  "지학사": "pub-jihaksa",
  "미래엔": "pub-mirae",
  "마더텅": "pub-mothertongue",
  "NE능률": "pub-neungyul",
  "능률": "pub-neungyul",
  EBS: "pub-ebs",
  "이룸이앤비": "pub-iruem",
  "동아출판": "pub-donga",
  "동아": "pub-donga",
};

export const SUBJECTS = [
  { id: "sub-common1", name: "공통수학1", keywords: ["공통수학1", "공통수학 1", "공통 수학1"] },
  { id: "sub-common2", name: "공통수학2", keywords: ["공통수학2", "공통수학 2", "공통 수학2"] },
  { id: "sub-algebra", name: "대수", keywords: ["대수"] },
  { id: "sub-calculus1", name: "미적분I", keywords: ["미적분1", "미적분Ⅰ", "미적분 I"] },
  { id: "sub-stats", name: "확률과 통계", keywords: ["확률과 통계", "확통"] },
  { id: "sub-calculus2", name: "미적분II", keywords: ["미적분2", "미적분Ⅱ", "미적분 II"] },
  { id: "sub-geometry", name: "기하", keywords: ["기하"] },
] as const;

/** 구 교육과정 키워드 — 감지 시 경고 */
export const LEGACY_CURRICULUM_PATTERNS = [
  /수학\s*Ⅰ(?!\s*I)/,
  /수학\s*I(?!I)/,
  /수학\s*Ⅱ(?!\s*I)/,
  /수학\s*II(?!I)/,
  /수학\s*\(상\)/,
  /수학\s*\(하\)/,
  /수학\s*상/,
  /수학\s*하/,
];

export const BOOK_TYPES = [
  "concept",
  "type_basic",
  "type_advanced",
  "deep",
  "past_exam",
] as const;

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

export const TARGET_AUDIENCES = [
  "하위권",
  "하위권~중위권",
  "중위권",
  "중위권~상위권",
  "상위권",
  "상위권~최상위권",
  "최상위권",
] as const;

/** PRD 2.6.7 MVP 출판사별 최소 수집 수 */
export const PUBLISHER_MIN_COUNTS: Record<string, number> = {
  "pub-shinsago": 5,
  "pub-gaenyeomwonri": 2,
  "pub-maple": 3,
  "pub-jinhaksa": 2,
  "pub-sungji": 2,
  "pub-jihaksa": 2,
  "pub-sukyung": 1,
  "pub-etoos": 2,
  "pub-chunjae": 2,
  // PRD "기타" — 등록된 소형 출판사 각 1
  "pub-visang": 1,
  "pub-didimdol": 1,
  "pub-mothertongue": 1,
  "pub-neungyul": 1,
  "pub-ebs": 1,
  "pub-iruem": 1,
  "pub-donga": 1,
  "pub-mirae": 1,
};
