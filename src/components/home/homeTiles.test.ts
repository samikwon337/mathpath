import { test } from "node:test";
import assert from "node:assert/strict";
import { getHomeTiles } from "./homeTiles";

test("로그아웃: 설득/탐색 타일 순서", () => {
  const keys = getHomeTiles({ isLoggedIn: false, hasWorkbooks: false }).map((t) => t.key);
  assert.deepEqual(keys, ["hero", "quickRecommend", "gradeRoadmap", "publisherLineup", "levelShortcut"]);
});

test("로그인 + 문제집 없음: 빈 로드맵 + 탐색 타일", () => {
  const keys = getHomeTiles({ isLoggedIn: true, hasWorkbooks: false }).map((t) => t.key);
  assert.deepEqual(keys, ["emptyRoadmap", "quickRecommend", "gradeRoadmap", "levelShortcut"]);
});

test("로그인 + 문제집 있음: 대시보드 타일", () => {
  const keys = getHomeTiles({ isLoggedIn: true, hasWorkbooks: true }).map((t) => t.key);
  assert.deepEqual(keys, [
    "greetingStats", "progress", "addBook",
    "myRoadmap", "nextSteps",
    "myBooks", "quickRecommend",
    "recommendedRoadmap", "levelShortcut",
  ]);
});

test("모든 타일에 span 클래스가 있다", () => {
  for (const flag of [false, true]) {
    for (const t of getHomeTiles({ isLoggedIn: flag, hasWorkbooks: flag })) {
      assert.ok(t.span.includes("col-span"), `${t.key} 에 span 없음`);
    }
  }
});
