import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapWorkbook, mapPublisher, mapRoadmapStep } from "./mappers";

describe("mapWorkbook", () => {
  it("maps snake_case row + subjectIds to Workbook", () => {
    const row = {
      id: "wb-ssen",
      publisher_id: "pub-shinsago",
      title: "쎈",
      book_type: "type_advanced",
      difficulty_level: 3,
      summary: "유형",
      pros: ["a"],
      cons: ["b"],
      study_tips: ["t"],
      tags: ["x"],
      is_active: true,
    };
    const wb = mapWorkbook(row, ["sub-common1"]);
    assert.equal(wb.id, "wb-ssen");
    assert.equal(wb.publisherId, "pub-shinsago");
    assert.equal(wb.bookType, "type_advanced");
    assert.equal(wb.difficultyLevel, 3);
    assert.equal(wb.isActive, true);
    assert.deepEqual(wb.subjectIds, ["sub-common1"]);
    assert.deepEqual(wb.studyTips, ["t"]);
  });
});

describe("mapPublisher", () => {
  it("maps logo_url to logoUrl", () => {
    const p = mapPublisher({ id: "pub-x", name: "X", logo_url: "/l.png", website_url: null });
    assert.equal(p.logoUrl, "/l.png");
    assert.equal(p.websiteUrl, undefined);
  });
});

describe("mapRoadmapStep", () => {
  it("maps estimated_study_days to estimatedStudyDays", () => {
    const s = mapRoadmapStep({
      id: "rs-1", roadmap_id: "rm-1", workbook_id: "wb-ssen",
      step_order: 2, is_optional: false, note: null, estimated_study_days: 21,
    });
    assert.equal(s.estimatedStudyDays, 21);
    assert.equal(s.stepOrder, 2);
  });
});
