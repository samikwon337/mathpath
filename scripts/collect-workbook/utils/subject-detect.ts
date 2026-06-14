import { LEGACY_CURRICULUM_PATTERNS, SUBJECTS } from "../config";

export function detectLegacyCurriculum(text: string): string[] {
  const warnings: string[] = [];
  for (const pattern of LEGACY_CURRICULUM_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push(`구 교육과정 키워드 감지: ${pattern.source}`);
    }
  }
  return warnings;
}

export function detectSubjectIds(text: string): string[] {
  const normalized = text.replace(/\s+/g, "");
  const matched: string[] = [];

  for (const subject of SUBJECTS) {
    if (
      subject.keywords.some((kw) =>
        normalized.includes(kw.replace(/\s+/g, ""))
      )
    ) {
      matched.push(subject.id);
    }
  }

  // 시리즈 전 과목 교재 (과목 키워드 없음) — 수동 보완 필요
  return matched;
}

export function detectSubjectIdsOrAll(text: string): {
  subjectIds: string[];
  warnings: string[];
} {
  const warnings = detectLegacyCurriculum(text);
  const subjectIds = detectSubjectIds(text);

  if (subjectIds.length === 0) {
    warnings.push(
      "과목 키워드를 찾지 못했습니다. 시리즈 전 과목 교재일 수 있으니 subjectIds를 수동 확인하세요."
    );
  }

  return { subjectIds, warnings };
}
