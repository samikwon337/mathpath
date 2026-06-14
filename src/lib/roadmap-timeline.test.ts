import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clampStudyHours,
  DEFAULT_STUDY_HOURS_PER_DAY,
  getRoadmapTimeline,
  getStepDuration,
} from "./roadmap-timeline";
import type { RoadmapStep } from "@/data/types";

const sampleStep: RoadmapStep = {
  id: "test-step",
  roadmapId: "rm-test",
  workbookId: "wb-pungsanja",
  stepOrder: 1,
  isOptional: false,
  estimatedStudyDays: 21,
};

describe("clampStudyHours", () => {
  it("clamps to min/max and rounds to step", () => {
    assert.equal(clampStudyHours(0.1), 0.5);
    assert.equal(clampStudyHours(9), 8);
    assert.equal(clampStudyHours(2.3), 2.5);
  });
});

describe("getStepDuration", () => {
  it("returns 21 days at default 2h/day", () => {
    const d = getStepDuration(sampleStep, undefined, 2);
    assert.equal(d.totalHours, 42);
    assert.equal(d.days, 21);
    assert.equal(d.weeks, 3);
  });

  it("halves days when hours per day doubles", () => {
    const at2h = getStepDuration(sampleStep, undefined, 2);
    const at4h = getStepDuration(sampleStep, undefined, 4);
    assert.equal(at4h.days, Math.ceil(at2h.totalHours / 4));
    assert.equal(at4h.totalHours, at2h.totalHours);
  });
});

describe("getRoadmapTimeline", () => {
  it("excludes optional steps from total", () => {
    const timeline = getRoadmapTimeline("rm-5to-top", DEFAULT_STUDY_HOURS_PER_DAY);
    const mandatoryHours = timeline.steps
      .filter((s) => !s.isOptional)
      .reduce((sum, s) => sum + s.duration.totalHours, 0);
    assert.equal(timeline.total.totalHours, mandatoryHours);
    assert.ok(timeline.steps.some((s) => s.isOptional));
  });

  it("recalculates total when hours per day changes", () => {
    const at2h = getRoadmapTimeline("rm-5to3", 2);
    const at4h = getRoadmapTimeline("rm-5to3", 4);
    assert.equal(at4h.total.totalHours, at2h.total.totalHours);
    assert.ok(at4h.total.days < at2h.total.days);
  });
});
