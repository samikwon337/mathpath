import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterWorkbooks, enrichRelations } from "./transform";
import type { Workbook, Publisher, WorkbookRelation } from "@/data/types";

const pubs: Publisher[] = [{ id: "pub-a", name: "에이출판" }];
const base = {
  publisherId: "pub-a", subjectIds: ["sub-1"], bookType: "concept" as const,
  summary: "s", pros: [], cons: [], tags: [], isActive: true,
};
const wbs: Workbook[] = [
  { ...base, id: "wb-1", title: "쎈", difficultyLevel: 1 },
  { ...base, id: "wb-2", title: "일품", difficultyLevel: 3, bookType: "deep" },
];

describe("filterWorkbooks", () => {
  it("filters by difficulty level", () => {
    const r = filterWorkbooks(wbs, pubs, { difficultyLevel: 3 });
    assert.deepEqual(r.map((w) => w.id), ["wb-2"]);
  });
  it("searches by publisher name", () => {
    const r = filterWorkbooks(wbs, pubs, { search: "에이" });
    assert.equal(r.length, 2);
  });
  it("sorts by name (ko)", () => {
    const r = filterWorkbooks(wbs, pubs, { sort: "name" });
    assert.deepEqual(r.map((w) => w.title), ["쎈", "일품"]);
  });
});

describe("enrichRelations", () => {
  it("groups forward/backward relations", () => {
    const rels: WorkbookRelation[] = [
      { id: "r1", fromWorkbookId: "wb-1", toWorkbookId: "wb-2", relationType: "next_step", displayOrder: 0 },
    ];
    const byId = new Map(wbs.map((w) => [w.id, w]));
    const out = enrichRelations("wb-1", rels, byId);
    assert.equal(out.nextSteps.length, 1);
    assert.equal(out.nextSteps[0].workbook.id, "wb-2");
    const back = enrichRelations("wb-2", rels, byId);
    assert.equal(back.previousSteps.length, 1);
    assert.equal(back.previousSteps[0].workbook.id, "wb-1");
  });
});
