import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  toWorkbookRow,
  toWorkbookSubjectRows,
  toPublisherRow,
  toRoadmapStepRow,
} from "./seed-rows";
import type { Workbook, Publisher, RoadmapStep } from "../../../src/data/types";

const wb: Workbook = {
  id: "wb-ssen",
  publisherId: "pub-shinsago",
  subjectIds: ["sub-common1", "sub-common2"],
  title: "쎈",
  bookType: "type_advanced",
  difficultyLevel: 3,
  summary: "유형 완성",
  pros: ["많은 문제"],
  cons: ["해설 부족"],
  studyTips: ["반복"],
  tags: ["유형"],
  isActive: true,
};

describe("toWorkbookRow", () => {
  it("maps camelCase to snake_case columns", () => {
    const row = toWorkbookRow(wb);
    assert.equal(row.id, "wb-ssen");
    assert.equal(row.publisher_id, "pub-shinsago");
    assert.equal(row.book_type, "type_advanced");
    assert.equal(row.difficulty_level, 3);
    assert.equal(row.is_active, true);
    assert.deepEqual(row.pros, ["많은 문제"]);
    assert.deepEqual(row.study_tips, ["반복"]);
    assert.equal("subjectIds" in row, false); // join 테이블로 분리
  });
});

describe("toWorkbookSubjectRows", () => {
  it("explodes subjectIds into join rows", () => {
    const rows = toWorkbookSubjectRows(wb);
    assert.deepEqual(rows, [
      { workbook_id: "wb-ssen", subject_id: "sub-common1" },
      { workbook_id: "wb-ssen", subject_id: "sub-common2" },
    ]);
  });
});

describe("toPublisherRow", () => {
  it("maps website/logo urls", () => {
    const p: Publisher = { id: "pub-x", name: "X", logoUrl: "/l.png" };
    assert.deepEqual(toPublisherRow(p), {
      id: "pub-x",
      name: "X",
      logo_url: "/l.png",
      website_url: undefined,
    });
  });
});

describe("toRoadmapStepRow", () => {
  it("maps estimatedStudyDays", () => {
    const s: RoadmapStep = {
      id: "rs-1",
      roadmapId: "rm-1",
      workbookId: "wb-ssen",
      stepOrder: 2,
      isOptional: false,
      estimatedStudyDays: 21,
    };
    const row = toRoadmapStepRow(s);
    assert.equal(row.estimated_study_days, 21);
    assert.equal(row.step_order, 2);
    assert.equal(row.is_optional, false);
  });
});
