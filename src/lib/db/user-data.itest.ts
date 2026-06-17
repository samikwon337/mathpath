import { describe, it } from "node:test";
import assert from "node:assert/strict";

const RUN = !!process.env.SUPABASE_TEST_USER_ID && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

describe("user-data integration", { skip: !RUN ? "테스트 환경변수 없음" : false }, () => {
  it("upserts then fetches then deletes a user workbook", async () => {
    const { fetchUserWorkbooks, upsertUserWorkbook, deleteUserWorkbook } = await import("./user-data");
    const userId = process.env.SUPABASE_TEST_USER_ID!;
    const workbookId = "wb-ssen";
    await upsertUserWorkbook({ userId, workbookId, status: "in_progress" });
    const after = await fetchUserWorkbooks(userId);
    assert.ok(after.some((u) => u.workbookId === workbookId && u.status === "in_progress"));
    await deleteUserWorkbook(userId, workbookId);
    const cleaned = await fetchUserWorkbooks(userId);
    assert.ok(!cleaned.some((u) => u.workbookId === workbookId));
  });
});
