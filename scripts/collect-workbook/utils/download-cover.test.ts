import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coverFilenameFromPath, resolveLocalCoverPath } from "./download-cover";

describe("download-cover helpers", () => {
  it("extracts filename from coverImageUrl", () => {
    assert.equal(coverFilenameFromPath("/covers/ssen.jpg"), "ssen.jpg");
  });

  it("resolves public path", () => {
    const p = resolveLocalCoverPath("ssen.jpg");
    assert.ok(p.endsWith("public/covers/ssen.jpg"));
  });
});
