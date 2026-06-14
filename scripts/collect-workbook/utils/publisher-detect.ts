import { PUBLISHER_NAME_MAP } from "../config";

export function detectPublisherId(publisherName?: string): {
  publisherId?: string;
  warning?: string;
} {
  if (!publisherName) {
    return { warning: "출판사명을 찾지 못했습니다. publisherId를 수동 입력하세요." };
  }

  const trimmed = publisherName.trim();

  if (PUBLISHER_NAME_MAP[trimmed]) {
    return { publisherId: PUBLISHER_NAME_MAP[trimmed] };
  }

  for (const [name, id] of Object.entries(PUBLISHER_NAME_MAP)) {
    if (trimmed.includes(name) || name.includes(trimmed)) {
      return { publisherId: id };
    }
  }

  return {
    warning: `출판사 '${trimmed}' 매핑 실패. config.ts PUBLISHER_NAME_MAP에 추가하세요.`,
  };
}
