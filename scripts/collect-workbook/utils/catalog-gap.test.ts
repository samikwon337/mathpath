import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeCatalogGap, type CatalogGapReport } from "./catalog-gap";

describe("analyzeCatalogGap", () => {
  it("flags publisher below PRD minimum", () => {
    const report = analyzeCatalogGap({
      workbooks: [
        { id: "wb-a", publisherId: "pub-mirae", subjectIds: ["sub-common1"], title: "A" },
      ],
      roadmapWorkbookIds: ["wb-a"],
      publisherMinCounts: { "pub-mirae": 1, "pub-shinsago": 5 },
      subjectNames: { "sub-common1": "공통수학1" },
    });
    const mirae = report.publisherGaps.find((g) => g.publisherId === "pub-mirae");
    assert.equal(mirae?.status, "ok");
    const shinsago = report.publisherGaps.find((g) => g.publisherId === "pub-shinsago");
    assert.equal(shinsago?.status, "below");
    assert.equal(shinsago?.current, 0);
    assert.equal(shinsago?.minimum, 5);
  });

  it("flags missing roadmap workbook", () => {
    const report = analyzeCatalogGap({
      workbooks: [{ id: "wb-a", publisherId: "pub-mirae", subjectIds: [], title: "A" }],
      roadmapWorkbookIds: ["wb-a", "wb-missing"],
      publisherMinCounts: {},
      subjectNames: {},
    });
    assert.deepEqual(report.missingRoadmapIds, ["wb-missing"]);
  });
});
