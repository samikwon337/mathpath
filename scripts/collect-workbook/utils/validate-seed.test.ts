import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateSeedWorkbook } from "./validate-seed";
import type { Workbook } from "../../../src/data/types";

const base: Workbook = {
  id: "wb-test",
  publisherId: "pub-shinsago",
  subjectIds: ["sub-common1"],
  title: "테스트",
  bookType: "concept",
  difficultyLevel: 1,
  targetAudience: "중위권",
  coverImageUrl: "/covers/test.jpg",
  summary: "테스트 요약",
  description: "테스트 설명",
  pros: ["a", "b"],
  cons: ["c", "d"],
  recommendedFor: "테스트",
  tags: ["test"],
  isActive: true,
};

describe("validateSeedWorkbook", () => {
  it("errors when cover file missing", () => {
    const issues = validateSeedWorkbook(base, { coverExists: false });
    assert.ok(issues.some((i) => i.level === "error" && i.field === "coverImageUrl"));
  });

  it("warns on long summary", () => {
    const issues = validateSeedWorkbook(
      { ...base, summary: "가".repeat(81) },
      { coverExists: true }
    );
    assert.ok(issues.some((i) => i.field === "summary"));
  });
});
