# Supabase 데이터 영구 저장 & 카탈로그 전면 DB화 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카탈로그(문제집·출판사·과목·관계·로드맵·유튜브)를 Supabase에서 Server Component로 읽고, 사용자 데이터(`user_workbooks`·`profiles`)를 Supabase에 영구 저장해 새로고침에도 "나의 로드맵"이 유지되게 한다.

**Architecture:** 카탈로그는 공개 읽기 → 서버에서 anon key로 조회(`React.cache`로 요청당 1회). 순수 가공 로직(필터/관계/로드맵 빌더)은 클라이언트·서버 공용 `transform.ts`로 분리. 사용자 데이터는 기존 클라이언트 세션 인증을 유지한 채 브라우저에서 Supabase에 읽기/쓰기(낙관적 업데이트 + 롤백). `src/data/*.ts`는 편집 원본으로 유지하고 service-role 시드 스크립트로 DB에 upsert.

**Tech Stack:** Next.js 16 (App Router, async Server Components) · React 19 · `@supabase/supabase-js` · TypeScript · `tsx --test`(node:test) · Tailwind 4.

**근거 스펙:** `docs/superpowers/specs/2026-06-15-supabase-data-persistence-design.md`

---

## 사전 지식 (구현자가 반드시 알아야 할 것)

- **이 Next.js는 학습 데이터와 다를 수 있다.** 코드 작성 전 `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `06-fetching-data.md`를 확인한다. 핵심: 페이지는 기본 async Server Component, `params`/`searchParams`는 **Promise**라 `await` 해야 한다. 서버 컴포넌트에서 DB 클라이언트로 직접 조회 가능. 요청 단위 중복 제거는 `import { cache } from "react"`.
- **현재 데이터 흐름**: 모든 페이지가 `"use client"`이고 `src/lib/api.ts`의 **동기** 함수로 정적 `src/data/*.ts`를 읽는다. 사용자 데이터(`userWorkbooks`)는 `src/hooks/use-auth.ts`의 `useState`에만 존재해 새로고침 시 사라진다(이 계획이 고치는 핵심 버그).
- **ID 규약**: `src/data`는 슬러그 ID(`pub-shinsago`, `wb-ssen`, `sub-common1`)를 쓰고 URL도 슬러그다. 따라서 DB 카탈로그 PK/FK는 `TEXT`여야 한다(스펙 결정 b).
- **테스트 스타일**: `import { describe, it } from "node:test"; import assert from "node:assert/strict";`. 실행은 `npx tsx --test <파일>`.
- **RLS**: 카탈로그 테이블은 `SELECT`만 공개. 쓰기 정책이 없으므로 **시드 스크립트는 service-role 키**(RLS 우회)로 써야 한다. 이 키는 절대 `NEXT_PUBLIC_` 접두어를 붙이지 않는다(클라이언트 노출 금지).

## 파일 구조 (생성/수정)

**생성**
- `src/lib/supabase-server.ts` — 서버 읽기용 Supabase 클라이언트(anon key)
- `src/lib/db/mappers.ts` — DB row(snake_case) → 도메인 타입(camelCase) 매핑 (순수)
- `src/lib/db/catalog.ts` — async 카탈로그 조회 (server-only, `React.cache`)
- `src/lib/db/user-data.ts` — 클라이언트 `user_workbooks`/`profiles` CRUD
- `src/lib/transform.ts` — 순수 가공: `filterWorkbooks`, `enrichRelations`, `buildMyRoadmap` (기존 `api.ts`에서 추출)
- `src/lib/db/mappers.test.ts`, `src/lib/transform.test.ts` — 유닛 테스트
- `src/components/workbook/WorkbookStatusControl.tsx` — 상세 페이지 상태 토글 클라이언트 island
- `src/app/workbooks/[id]/WorkbookDetailActions.tsx` 등 필요한 island (각 태스크에서 명시)
- `scripts/collect-workbook/utils/seed-rows.ts` — 도메인 → DB row 매핑 (순수, 테스트)
- `scripts/collect-workbook/utils/seed-rows.test.ts`
- `scripts/collect-workbook/utils/seed-supabase.ts` — 시드 실행기(I/O)
- `src/app/workbooks/loading.tsx`, `src/app/workbooks/[id]/loading.tsx` — 스트리밍 로딩 UI

**수정**
- `supabase/schema.sql` — 카탈로그 PK/FK `UUID→TEXT`, 누락 컬럼 추가
- `src/lib/api.ts` — 카탈로그 조회는 `db/catalog.ts`로, 순수 로직은 `transform.ts`로 이관 후 제거/축소
- `src/hooks/use-auth.ts` — `user_workbooks`/`profiles` 영구 저장 연결
- `src/components/workbook/WorkbookCard.tsx` — presentational화(`publisherName` prop)
- 페이지 6개: `src/app/page.tsx`, `src/app/workbooks/page.tsx`, `src/app/workbooks/[id]/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/dashboard/workbooks/page.tsx`, `src/app/roadmap/page.tsx`
- `scripts/collect-workbook/index.ts` — `seed` 명령 추가
- `package.json` — `seed` 스크립트, `.env.local.example` — service-role 키
- `src/data/roadmaps.ts` 등 정적 파일은 **유지**(시드 원본)

> **주의:** `roadmapGradeGroups`(roadmaps.ts)는 카탈로그 엔티티가 아니라 로드맵 페이지의 표현용 그룹 메타데이터다. DB로 옮기지 않고 정적 유지한다(YAGNI).

---

# Phase 1 — 기반 (스키마 정합 + 시드). 앱 동작 변화 없음, DB만 채움.

### Task 1: 스키마 정합 (TEXT id + 누락 컬럼)

**Files:**
- Modify: `supabase/schema.sql`

카탈로그 테이블의 모든 PK/FK를 `UUID`에서 `TEXT`로 바꾸고, 도메인 타입에는 있으나 스키마에 없는 컬럼 3개를 추가한다. (DB에 실데이터가 없으므로 전체 재적용 방식. 기존 배포가 있으면 카탈로그 테이블 DROP 후 재생성 — 데이터는 시드로 복구된다.)

- [ ] **Step 1: 카탈로그 테이블 id/FK 타입 변경**

`supabase/schema.sql`에서 다음을 수정한다.
- `publishers.id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()` → `TEXT PRIMARY KEY`
- `subjects.id`: `UUID ... gen_random_uuid()` → `TEXT PRIMARY KEY`
- `workbooks.id`: → `TEXT PRIMARY KEY`, `workbooks.publisher_id`: `UUID REFERENCES publishers(id)` → `TEXT REFERENCES publishers(id) ON DELETE CASCADE`
- `workbook_subjects.workbook_id`, `workbook_subjects.subject_id`: `UUID` → `TEXT` (REFERENCES 유지)
- `workbook_relations.id` → `TEXT PRIMARY KEY`; `from_workbook_id`, `to_workbook_id`: `UUID` → `TEXT`
- `workbook_youtube_links.id` → `TEXT PRIMARY KEY`; `workbook_id`: `UUID` → `TEXT`
- `roadmaps.id` → `TEXT PRIMARY KEY`; `publisher_id`: `UUID` → `TEXT`
- `roadmap_steps.id` → `TEXT PRIMARY KEY`; `roadmap_id`, `workbook_id`: `UUID` → `TEXT`
- `user_workbooks.workbook_id`: `UUID` → `TEXT` (단 `user_workbooks.id`, `user_id`는 UUID 유지)
- `workbook_reviews.workbook_id`: `UUID` → `TEXT` (`id`, `user_id`는 UUID 유지)

`profiles.id`(auth.users 참조)와 `review_likes`는 변경하지 않는다.

- [ ] **Step 2: 누락 컬럼 추가**

`workbooks` 테이블 `tags` 줄 다음에 추가:
```sql
  study_tips JSONB DEFAULT '[]',
```
`roadmap_steps` 테이블 `note TEXT` 다음에 추가:
```sql
  estimated_study_days INT,
```
`workbook_youtube_links` 테이블 `video_title TEXT` 다음에 추가:
```sql
  display_order INT DEFAULT 0,
```

- [ ] **Step 3: 검증 (로컬 파싱)**

Supabase 프로젝트의 SQL Editor 또는 로컬 `supabase db reset`로 `schema.sql` 전체를 재적용해 문법 오류가 없는지 확인한다. 로컬 Supabase가 없으면 최소한 `id` 컬럼 정의에 `UUID`가 카탈로그 테이블에 남아있지 않은지 확인:

Run: `grep -nE "(publishers|subjects|workbooks|workbook_subjects|workbook_relations|workbook_youtube_links|roadmaps|roadmap_steps)\b" supabase/schema.sql | grep -i uuid`
Expected: 출력 없음 (카탈로그 테이블에 UUID 잔존 없음). `user_workbooks`/`workbook_reviews`/`profiles`의 `id`/`user_id` UUID는 정상.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(db): use TEXT ids for catalog tables, add study_tips/estimated_study_days/display_order"
```

---

### Task 2: 시드용 service-role 클라이언트 + 환경변수

**Files:**
- Modify: `.env.local.example`
- Create: `scripts/collect-workbook/utils/supabase-admin.ts`

- [ ] **Step 1: 환경변수 예시 추가**

`.env.local.example`의 Supabase 블록에 추가(클라이언트 노출 금지 주석 포함):
```bash
# 시드 스크립트 전용 — 서버/CLI에서만 사용, 절대 NEXT_PUBLIC_ 금지
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 2: admin 클라이언트 작성**

`scripts/collect-workbook/utils/supabase-admin.ts`:
```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** 시드 전용: service-role 키로 RLS를 우회한다. CLI에서만 호출. */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL 가 설정되지 않았습니다.");
  if (!serviceKey)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다 (시드 전용).");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add .env.local.example scripts/collect-workbook/utils/supabase-admin.ts
git commit -m "feat(seed): add service-role admin client for seeding"
```

---

### Task 3: 도메인 → DB row 매핑 (TDD)

**Files:**
- Create: `scripts/collect-workbook/utils/seed-rows.ts`
- Test: `scripts/collect-workbook/utils/seed-rows.test.ts`

순수 함수로 `src/data` 도메인 객체를 Supabase row(snake_case)로 변환한다. 테이블별 매핑을 한 곳에 모은다.

- [ ] **Step 1: 실패 테스트 작성**

`scripts/collect-workbook/utils/seed-rows.test.ts`:
```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx tsx --test scripts/collect-workbook/utils/seed-rows.test.ts`
Expected: FAIL — `Cannot find module './seed-rows'`

- [ ] **Step 3: 매핑 구현**

`scripts/collect-workbook/utils/seed-rows.ts`:
```ts
import type {
  Publisher,
  Subject,
  Workbook,
  WorkbookRelation,
  Roadmap,
  RoadmapStep,
  WorkbookYoutubeLink,
} from "../../../src/data/types";

export function toPublisherRow(p: Publisher) {
  return { id: p.id, name: p.name, logo_url: p.logoUrl, website_url: p.websiteUrl };
}

export function toSubjectRow(s: Subject) {
  return { id: s.id, name: s.name, category: s.category, display_order: s.displayOrder };
}

export function toWorkbookRow(w: Workbook) {
  return {
    id: w.id,
    publisher_id: w.publisherId,
    title: w.title,
    subtitle: w.subtitle,
    book_type: w.bookType,
    difficulty_level: w.difficultyLevel,
    difficulty_sub: w.difficultySub,
    problem_count: w.problemCount,
    target_audience: w.targetAudience,
    cover_image_url: w.coverImageUrl,
    summary: w.summary,
    description: w.description,
    pros: w.pros,
    cons: w.cons,
    recommended_for: w.recommendedFor,
    study_tips: w.studyTips ?? [],
    purchase_url_kyobo: w.purchaseUrlKyobo,
    purchase_url_yes24: w.purchaseUrlYes24,
    tags: w.tags,
    is_active: w.isActive,
  };
}

export function toWorkbookSubjectRows(w: Workbook) {
  return w.subjectIds.map((subjectId) => ({
    workbook_id: w.id,
    subject_id: subjectId,
  }));
}

export function toRelationRow(r: WorkbookRelation) {
  return {
    id: r.id,
    from_workbook_id: r.fromWorkbookId,
    to_workbook_id: r.toWorkbookId,
    relation_type: r.relationType,
    note: r.note,
    display_order: r.displayOrder,
  };
}

export function toRoadmapRow(r: Roadmap) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    type: r.type,
    publisher_id: r.publisherId,
    target_start_level: r.targetStartLevel,
    target_end_level: r.targetEndLevel,
    display_order: r.displayOrder,
  };
}

export function toRoadmapStepRow(s: RoadmapStep) {
  return {
    id: s.id,
    roadmap_id: s.roadmapId,
    workbook_id: s.workbookId,
    step_order: s.stepOrder,
    is_optional: s.isOptional,
    note: s.note,
    estimated_study_days: s.estimatedStudyDays,
  };
}

export function toYoutubeLinkRow(l: WorkbookYoutubeLink) {
  return {
    id: l.id,
    workbook_id: l.workbookId,
    youtube_url: l.youtubeUrl,
    video_title: l.videoTitle,
    channel_name: l.channelName,
    display_order: l.displayOrder,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx tsx --test scripts/collect-workbook/utils/seed-rows.test.ts`
Expected: PASS (4 describe 블록 통과)

- [ ] **Step 5: Commit**

```bash
git add scripts/collect-workbook/utils/seed-rows.ts scripts/collect-workbook/utils/seed-rows.test.ts
git commit -m "feat(seed): add domain-to-row mappers with tests"
```

---

### Task 4: 시드 실행기 + `seed` 명령

**Files:**
- Create: `scripts/collect-workbook/utils/seed-supabase.ts`
- Modify: `scripts/collect-workbook/index.ts`
- Modify: `package.json`

- [ ] **Step 1: 시드 실행기 작성**

`scripts/collect-workbook/utils/seed-supabase.ts`:
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { publishers } from "../../../src/data/publishers";
import { subjects } from "../../../src/data/subjects";
import { workbooks } from "../../../src/data/workbooks";
import { workbookRelations } from "../../../src/data/relations";
import { roadmaps, roadmapSteps } from "../../../src/data/roadmaps";
import { workbookYoutubeLinks } from "../../../src/data/youtube-links";
import {
  toPublisherRow,
  toSubjectRow,
  toWorkbookRow,
  toWorkbookSubjectRows,
  toRelationRow,
  toRoadmapRow,
  toRoadmapStepRow,
  toYoutubeLinkRow,
} from "./seed-rows";

async function upsert(sb: SupabaseClient, table: string, rows: unknown[]) {
  if (rows.length === 0) return;
  const { error } = await sb.from(table).upsert(rows as never, { onConflict: "id" });
  if (error) throw new Error(`${table} upsert 실패: ${error.message}`);
  console.log(`  ✓ ${table}: ${rows.length}행`);
}

/** src/data 전체를 Supabase에 멱등 upsert. 부모→자식 순서로 FK 보장. */
export async function seedAll(sb: SupabaseClient): Promise<void> {
  await upsert(sb, "publishers", publishers.map(toPublisherRow));
  await upsert(sb, "subjects", subjects.map(toSubjectRow));
  await upsert(sb, "workbooks", workbooks.map(toWorkbookRow));

  // 다대다 조인: 워크북별 기존 매핑 삭제 후 재삽입(멱등)
  const subjectRows = workbooks.flatMap(toWorkbookSubjectRows);
  const workbookIds = workbooks.map((w) => w.id);
  const { error: delErr } = await sb
    .from("workbook_subjects")
    .delete()
    .in("workbook_id", workbookIds);
  if (delErr) throw new Error(`workbook_subjects 정리 실패: ${delErr.message}`);
  if (subjectRows.length > 0) {
    const { error } = await sb.from("workbook_subjects").insert(subjectRows as never);
    if (error) throw new Error(`workbook_subjects insert 실패: ${error.message}`);
    console.log(`  ✓ workbook_subjects: ${subjectRows.length}행`);
  }

  await upsert(sb, "workbook_relations", workbookRelations.map(toRelationRow));
  await upsert(sb, "roadmaps", roadmaps.map(toRoadmapRow));
  await upsert(sb, "roadmap_steps", roadmapSteps.map(toRoadmapStepRow));
  await upsert(sb, "workbook_youtube_links", workbookYoutubeLinks.map(toYoutubeLinkRow));
}
```

- [ ] **Step 2: index.ts에 `seed` 명령 추가**

`scripts/collect-workbook/index.ts` 상단 import 블록에 추가:
```ts
import { createAdminClient } from "./utils/supabase-admin";
import { seedAll } from "./utils/seed-supabase";
```
`usage()` 문자열의 명령 목록에 한 줄 추가:
```
  npm run collect -- seed                                 # src/data → Supabase upsert
```
`cmdValidateSeed` 함수 다음에 새 함수 추가:
```ts
async function cmdSeed() {
  console.log("Supabase 시딩 시작 (src/data → DB)\n");
  const sb = createAdminClient();
  await seedAll(sb);
  console.log("\n시딩 완료.");
}
```
`main()`의 `switch`에 case 추가(`validate-seed` case 다음):
```ts
      case "seed":
        await cmdSeed();
        break;
```

- [ ] **Step 3: package.json에 스크립트 추가**

`scripts`에 한 줄 추가:
```json
    "seed": "tsx scripts/collect-workbook/index.ts seed",
```

- [ ] **Step 4: 시드 실행 검증**

`.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 설정 후:
Run: `npm run seed`
Expected: 각 테이블별 `✓ <table>: N행` 출력, 마지막 `시딩 완료.` 오류 없음. (실 키가 없으면 `SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다` 메시지로 명확히 실패 — 이는 정상 동작 확인.)

- [ ] **Step 5: Commit**

```bash
git add scripts/collect-workbook/utils/seed-supabase.ts scripts/collect-workbook/index.ts package.json
git commit -m "feat(seed): add idempotent supabase seed command from src/data"
```

---

# Phase 2 — 카탈로그 읽기를 서버로 전환

### Task 5: 서버 읽기 클라이언트

**Files:**
- Create: `src/lib/supabase-server.ts`

- [ ] **Step 1: 작성**

`src/lib/supabase-server.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

/** 서버 컴포넌트에서 공개 카탈로그를 읽는다. 세션 불필요(anon key). */
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase-server.ts
git commit -m "feat(db): add server-side supabase read client"
```

---

### Task 6: row → 도메인 매퍼 (TDD)

**Files:**
- Create: `src/lib/db/mappers.ts`
- Test: `src/lib/db/mappers.test.ts`

DB row(snake_case)를 앱이 이미 쓰는 도메인 타입(`Workbook` 등 camelCase)으로 되돌린다. `workbooks` row + 해당 workbook의 `subjectIds` 배열을 합쳐 `Workbook`을 만든다.

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/db/mappers.test.ts`:
```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx tsx --test src/lib/db/mappers.test.ts`
Expected: FAIL — `Cannot find module './mappers'`

- [ ] **Step 3: 구현**

`src/lib/db/mappers.ts`:
```ts
import type {
  Publisher, Subject, Workbook, WorkbookRelation,
  Roadmap, RoadmapStep, WorkbookYoutubeLink,
  BookType, DifficultyLevel, RelationType, RoadmapType,
} from "@/data/types";

type Row = Record<string, any>;
const orUndef = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);

export function mapPublisher(r: Row): Publisher {
  return { id: r.id, name: r.name, logoUrl: orUndef(r.logo_url), websiteUrl: orUndef(r.website_url) };
}

export function mapSubject(r: Row): Subject {
  return { id: r.id, name: r.name, category: r.category, displayOrder: r.display_order };
}

export function mapWorkbook(r: Row, subjectIds: string[]): Workbook {
  return {
    id: r.id,
    publisherId: r.publisher_id,
    subjectIds,
    title: r.title,
    subtitle: orUndef(r.subtitle),
    bookType: r.book_type as BookType,
    difficultyLevel: r.difficulty_level as DifficultyLevel,
    difficultySub: orUndef(r.difficulty_sub),
    problemCount: orUndef(r.problem_count),
    targetAudience: orUndef(r.target_audience),
    coverImageUrl: orUndef(r.cover_image_url),
    summary: r.summary ?? "",
    description: orUndef(r.description),
    pros: r.pros ?? [],
    cons: r.cons ?? [],
    recommendedFor: orUndef(r.recommended_for),
    studyTips: orUndef(r.study_tips),
    purchaseUrlKyobo: orUndef(r.purchase_url_kyobo),
    purchaseUrlYes24: orUndef(r.purchase_url_yes24),
    tags: r.tags ?? [],
    isActive: r.is_active,
  };
}

export function mapRelation(r: Row): WorkbookRelation {
  return {
    id: r.id,
    fromWorkbookId: r.from_workbook_id,
    toWorkbookId: r.to_workbook_id,
    relationType: r.relation_type as RelationType,
    note: orUndef(r.note),
    displayOrder: r.display_order ?? 0,
  };
}

export function mapRoadmap(r: Row): Roadmap {
  return {
    id: r.id,
    name: r.name,
    description: orUndef(r.description),
    type: r.type as RoadmapType,
    targetStartLevel: r.target_start_level,
    targetEndLevel: r.target_end_level,
    publisherId: orUndef(r.publisher_id),
    displayOrder: r.display_order ?? 0,
  };
}

export function mapRoadmapStep(r: Row): RoadmapStep {
  return {
    id: r.id,
    roadmapId: r.roadmap_id,
    workbookId: r.workbook_id,
    stepOrder: r.step_order,
    isOptional: r.is_optional,
    note: orUndef(r.note),
    estimatedStudyDays: orUndef(r.estimated_study_days),
  };
}

export function mapYoutubeLink(r: Row): WorkbookYoutubeLink {
  return {
    id: r.id,
    workbookId: r.workbook_id,
    youtubeUrl: r.youtube_url,
    videoTitle: r.video_title,
    channelName: orUndef(r.channel_name),
    displayOrder: r.display_order ?? 0,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx tsx --test src/lib/db/mappers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/mappers.ts src/lib/db/mappers.test.ts
git commit -m "feat(db): add row-to-domain mappers with tests"
```

---

### Task 7: 순수 가공 로직 추출 (TDD)

**Files:**
- Create: `src/lib/transform.ts`
- Test: `src/lib/transform.test.ts`

`api.ts`의 순수 로직(필터/검색/정렬, 관계 enrich, `buildMyRoadmap`)을 정적 import 없이 인자로 받는 순수 함수로 옮긴다. 클라이언트·서버 공용.

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/transform.test.ts`:
```ts
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
    assert.deepEqual(r.map((w) => w.title), ["р쎈".slice(1) === "쎈" ? "쎈" : "쎈", "일품"].sort((a,b)=>a.localeCompare(b,"ko")));
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
```
> 정렬 테스트의 표현이 거추장스러우면 `assert.deepEqual(r.map(w=>w.title), ["쎈","일품"])`로 단순화해도 된다(한국어 localeCompare에서 "쎈" < "일품").

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx tsx --test src/lib/transform.test.ts`
Expected: FAIL — `Cannot find module './transform'`

- [ ] **Step 3: 구현 (api.ts에서 로직 이식)**

`src/lib/transform.ts`:
```ts
import type {
  Workbook, Publisher, WorkbookRelation, BookType, DifficultyLevel, UserWorkbook,
} from "@/data/types";

export interface WorkbookFilters {
  subjectId?: string;
  publisherId?: string;
  difficultyLevel?: DifficultyLevel;
  bookType?: BookType;
  search?: string;
  sort?: "difficulty" | "name";
}

export function filterWorkbooks(
  workbooks: Workbook[],
  publishers: Publisher[],
  filters?: WorkbookFilters
): Workbook[] {
  const pubById = new Map(publishers.map((p) => [p.id, p]));
  let result = workbooks.filter((w) => w.isActive);

  if (filters?.subjectId) result = result.filter((w) => w.subjectIds.includes(filters.subjectId!));
  if (filters?.publisherId) result = result.filter((w) => w.publisherId === filters.publisherId);
  if (filters?.difficultyLevel) result = result.filter((w) => w.difficultyLevel === filters.difficultyLevel);
  if (filters?.bookType) result = result.filter((w) => w.bookType === filters.bookType);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((w) =>
      w.title.toLowerCase().includes(q) ||
      (pubById.get(w.publisherId)?.name.toLowerCase().includes(q) ?? false)
    );
  }
  if (filters?.sort === "difficulty") {
    result = [...result].sort((a, b) => a.difficultyLevel - b.difficultyLevel);
  } else if (filters?.sort === "name") {
    result = [...result].sort((a, b) => a.title.localeCompare(b.title, "ko"));
  }
  return result;
}

type RelWithWb = WorkbookRelation & { workbook: Workbook };
export interface EnrichedRelations {
  nextSteps: RelWithWb[];
  complements: RelWithWb[];
  alternatives: RelWithWb[];
  previousSteps: RelWithWb[];
}

export function enrichRelations(
  workbookId: string,
  relations: WorkbookRelation[],
  workbooksById: Map<string, Workbook>
): EnrichedRelations {
  const forward = relations.filter((r) => r.fromWorkbookId === workbookId);
  const backward = relations.filter((r) => r.toWorkbookId === workbookId);
  const enrich = (rels: WorkbookRelation[], getId: (r: WorkbookRelation) => string) =>
    rels
      .map((r) => {
        const workbook = workbooksById.get(getId(r));
        return workbook ? { ...r, workbook } : null;
      })
      .filter(Boolean) as RelWithWb[];
  return {
    nextSteps: enrich(forward.filter((r) => r.relationType === "next_step"), (r) => r.toWorkbookId),
    complements: enrich(forward.filter((r) => r.relationType === "complement"), (r) => r.toWorkbookId),
    alternatives: enrich(forward.filter((r) => r.relationType === "alternative"), (r) => r.toWorkbookId),
    previousSteps: enrich(backward.filter((r) => r.relationType === "next_step"), (r) => r.fromWorkbookId),
  };
}

export interface MyRoadmapNode {
  workbook: Workbook;
  status: UserWorkbook["status"];
  startedAt?: string;
  completedAt?: string;
}
export interface MyRoadmapEdge {
  from: string;
  to: string;
  type: "next_step" | "complement";
  note?: string;
}

export function buildMyRoadmap(
  userWorkbooks: UserWorkbook[],
  workbooksById: Map<string, Workbook>,
  relations: WorkbookRelation[]
): {
  nodes: MyRoadmapNode[];
  edges: MyRoadmapEdge[];
  suggestedNext: (Workbook & { reason: string })[];
} {
  const statusOrder = { completed: 0, in_progress: 1, planned: 2 };
  const nodes = userWorkbooks
    .map((uw) => {
      const workbook = workbooksById.get(uw.workbookId);
      if (!workbook) return null;
      return { workbook, status: uw.status, startedAt: uw.startedAt, completedAt: uw.completedAt };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dA = a!.workbook.difficultyLevel, dB = b!.workbook.difficultyLevel;
      if (dA !== dB) return dA - dB;
      return statusOrder[a!.status] - statusOrder[b!.status];
    }) as MyRoadmapNode[];

  const ids = new Set(userWorkbooks.map((uw) => uw.workbookId));
  const edges: MyRoadmapEdge[] = [];
  for (const rel of relations) {
    if (ids.has(rel.fromWorkbookId) && ids.has(rel.toWorkbookId) &&
      (rel.relationType === "next_step" || rel.relationType === "complement")) {
      edges.push({ from: rel.fromWorkbookId, to: rel.toWorkbookId, type: rel.relationType, note: rel.note });
    }
  }
  if (edges.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ from: nodes[i].workbook.id, to: nodes[i + 1].workbook.id, type: "next_step" });
    }
  }

  const suggestedNext: (Workbook & { reason: string })[] = [];
  const seen = new Set<string>();
  for (const uw of userWorkbooks) {
    const rels = relations.filter((r) => r.fromWorkbookId === uw.workbookId && r.relationType === "next_step");
    for (const rel of rels) {
      if (!ids.has(rel.toWorkbookId) && !seen.has(rel.toWorkbookId)) {
        const wb = workbooksById.get(rel.toWorkbookId);
        if (wb) {
          const fromWb = workbooksById.get(uw.workbookId);
          suggestedNext.push({ ...wb, reason: `${fromWb?.title || ""} 다음 단계` });
          seen.add(rel.toWorkbookId);
        }
      }
    }
  }
  return { nodes, edges, suggestedNext };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx tsx --test src/lib/transform.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/transform.ts src/lib/transform.test.ts
git commit -m "feat(lib): extract pure catalog transforms with tests"
```

---

### Task 8: 서버 카탈로그 조회 계층

**Files:**
- Create: `src/lib/db/catalog.ts`

전체 카탈로그를 한 번에(요청당 1회, `React.cache`) 조회해 도메인 객체로 매핑하고, 기존 `api.ts`와 동일한 이름의 **async** 접근자를 제공한다. 필터/관계 로직은 `transform.ts` 재사용.

- [ ] **Step 1: 작성**

`src/lib/db/catalog.ts`:
```ts
import "server-only";
import { cache } from "react";
import { createServerSupabase } from "../supabase-server";
import {
  mapWorkbook, mapPublisher, mapSubject, mapRelation,
  mapRoadmap, mapRoadmapStep, mapYoutubeLink,
} from "./mappers";
import { filterWorkbooks, enrichRelations, type WorkbookFilters } from "../transform";
import type { Workbook } from "@/data/types";

export interface Catalog {
  workbooks: Workbook[];
  workbooksById: Map<string, Workbook>;
  publishers: ReturnType<typeof mapPublisher>[];
  subjects: ReturnType<typeof mapSubject>[];
  relations: ReturnType<typeof mapRelation>[];
  roadmaps: ReturnType<typeof mapRoadmap>[];
  roadmapSteps: ReturnType<typeof mapRoadmapStep>[];
  youtubeLinks: ReturnType<typeof mapYoutubeLink>[];
}

export const getCatalog = cache(async (): Promise<Catalog> => {
  const sb = createServerSupabase();
  const [wb, ws, sub, pub, rel, rm, steps, yt] = await Promise.all([
    sb.from("workbooks").select("*"),
    sb.from("workbook_subjects").select("*"),
    sb.from("subjects").select("*"),
    sb.from("publishers").select("*"),
    sb.from("workbook_relations").select("*"),
    sb.from("roadmaps").select("*"),
    sb.from("roadmap_steps").select("*"),
    sb.from("workbook_youtube_links").select("*"),
  ]);
  for (const res of [wb, ws, sub, pub, rel, rm, steps, yt]) {
    if (res.error) throw new Error(`카탈로그 조회 실패: ${res.error.message}`);
  }

  const subjectsByWorkbook = new Map<string, string[]>();
  for (const row of ws.data ?? []) {
    const list = subjectsByWorkbook.get(row.workbook_id) ?? [];
    list.push(row.subject_id);
    subjectsByWorkbook.set(row.workbook_id, list);
  }

  const workbooks = (wb.data ?? []).map((r) => mapWorkbook(r, subjectsByWorkbook.get(r.id) ?? []));
  return {
    workbooks,
    workbooksById: new Map(workbooks.map((w) => [w.id, w])),
    publishers: (pub.data ?? []).map(mapPublisher),
    subjects: (sub.data ?? []).map(mapSubject),
    relations: (rel.data ?? []).map(mapRelation),
    roadmaps: (rm.data ?? []).map(mapRoadmap),
    roadmapSteps: (steps.data ?? []).map(mapRoadmapStep),
    youtubeLinks: (yt.data ?? []).map(mapYoutubeLink),
  };
});

// ── api.ts와 동일 이름의 async 접근자 ──
export async function getWorkbooks(filters?: WorkbookFilters) {
  const c = await getCatalog();
  return filterWorkbooks(c.workbooks, c.publishers, filters);
}
export async function getWorkbookById(id: string) {
  return (await getCatalog()).workbooksById.get(id);
}
export async function getPublishers() {
  return (await getCatalog()).publishers;
}
export async function getPublisherById(id: string) {
  return (await getCatalog()).publishers.find((p) => p.id === id);
}
export async function getSubjects() {
  return (await getCatalog()).subjects;
}
export async function getWorkbooksByPublisher(publisherId: string) {
  const c = await getCatalog();
  return c.workbooks.filter((w) => w.publisherId === publisherId && w.isActive);
}
export async function getWorkbookRelations(workbookId: string) {
  const c = await getCatalog();
  return enrichRelations(workbookId, c.relations, c.workbooksById);
}
export async function getRoadmaps(type?: "grade" | "publisher") {
  const c = await getCatalog();
  const r = type ? c.roadmaps.filter((x) => x.type === type) : c.roadmaps;
  return [...r].sort((a, b) => a.displayOrder - b.displayOrder);
}
export async function getRoadmapById(id: string) {
  return (await getCatalog()).roadmaps.find((r) => r.id === id);
}
export async function getRoadmapSteps(roadmapId: string) {
  const c = await getCatalog();
  return c.roadmapSteps
    .filter((s) => s.roadmapId === roadmapId)
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((s) => {
      const workbook = c.workbooksById.get(s.workbookId);
      return workbook ? { ...s, workbook } : null;
    })
    .filter(Boolean) as (ReturnType<typeof mapRoadmapStep> & { workbook: Workbook })[];
}
export async function getYoutubeLinksByWorkbookId(workbookId: string) {
  const c = await getCatalog();
  return c.youtubeLinks
    .filter((l) => l.workbookId === workbookId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
```
> `server-only` 패키지가 미설치라 import 에러가 나면 `npm i -D server-only` 후 진행하거나 첫 줄 `import "server-only";`를 제거한다(선택 사항이며 안전장치일 뿐).

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: `catalog.ts` 관련 신규 에러 없음. (기존 `api.ts`를 아직 안 지웠으므로 양립.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/catalog.ts
git commit -m "feat(db): add server catalog data-access layer"
```

---

### Task 9: WorkbookCard presentational화

**Files:**
- Modify: `src/components/workbook/WorkbookCard.tsx`

`getPublisherById`(동기 api) 의존을 제거하고 `publisherName`을 prop으로 받아 서버/클라 양쪽에서 사용 가능하게 한다.

- [ ] **Step 1: 수정**

`WorkbookCard.tsx`에서 `import { getPublisherById } from "@/lib/api";` 줄을 삭제하고, props·본문을 다음과 같이 바꾼다:
```tsx
interface WorkbookCardProps {
  workbook: Workbook;
  publisherName?: string;
  onCompareToggle?: (workbookId: string) => void;
  isCompared?: boolean;
}

export function WorkbookCard({
  workbook,
  publisherName,
  onCompareToggle,
  isCompared,
}: WorkbookCardProps) {
  // const publisher = getPublisherById(...) 제거
```
본문에서 `publisher?.name || ""` → `publisherName || ""`, `{publisher?.name}` → `{publisherName}`로 치환(2곳).

- [ ] **Step 2: 호출부 임시 정합**

이 시점 호출부(`WorkbookCompare.tsx`, 상세 페이지)는 Task 10·13에서 `publisherName`을 넘기도록 고친다. 지금은 타입 체크만:
Run: `npx tsc --noEmit`
Expected: `publisherName` 미전달 호출부가 있어도 optional이라 에러 없음(이름은 단순히 비게 됨). 빌드 깨짐 없음.

- [ ] **Step 3: Commit**

```bash
git add src/components/workbook/WorkbookCard.tsx
git commit -m "refactor(ui): make WorkbookCard presentational with publisherName prop"
```

---

### Task 10: `/workbooks/[id]` 상세 페이지 서버 컴포넌트화

**Files:**
- Modify: `src/app/workbooks/[id]/page.tsx`
- Create: `src/app/workbooks/[id]/WorkbookStatusControl.tsx`
- Create: `src/app/workbooks/[id]/loading.tsx`

정적 카탈로그 부분은 서버에서 렌더하고, 인증이 필요한 상태 토글 + `router.back()`만 클라이언트 island로 분리한다.

- [ ] **Step 1: 상태 토글 island 작성**

`src/app/workbooks/[id]/WorkbookStatusControl.tsx`:
```tsx
"use client";

import { StatusToggle } from "@/components/workbook/StatusToggle";
import { useAuthContext } from "@/hooks/auth-context";

export function WorkbookStatusControl({ workbookId }: { workbookId: string }) {
  const { isLoggedIn, getWorkbookStatus, updateWorkbookStatus, removeWorkbook } = useAuthContext();
  if (!isLoggedIn) return null;
  const userStatus = getWorkbookStatus(workbookId);
  return (
    <div className="flex justify-center">
      <StatusToggle
        status={userStatus?.status}
        onStatusChange={(s) => updateWorkbookStatus(workbookId, s)}
        onAdd={() => updateWorkbookStatus(workbookId, "planned")}
        onRemove={() => removeWorkbook(workbookId)}
        size="md"
      />
    </div>
  );
}
```

- [ ] **Step 2: 뒤로가기 island 작성 (페이지 내 동일 파일에 둬도 되나 분리)**

`src/app/workbooks/[id]/BackButton.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();
  return (
    <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 gap-1 -ml-2">
      <ArrowLeft className="h-4 w-4" />
      뒤로
    </Button>
  );
}
```

- [ ] **Step 3: 페이지를 async 서버 컴포넌트로 변환**

`src/app/workbooks/[id]/page.tsx` 상단을 다음으로 교체한다. `"use client"`·`use(params)`·`useRouter`·`useAuthContext`·`StatusToggle` import를 제거하고, 데이터는 `db/catalog`에서 await로 받는다:
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ThumbsUp, ThumbsDown, ChevronRight, BookOpen, Lightbulb, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { BookTypeBadge } from "@/components/workbook/BookTypeBadge";
import { WorkbookCoverPlaceholder } from "@/components/workbook/WorkbookCoverPlaceholder";
import { WorkbookCard } from "@/components/workbook/WorkbookCard";
import {
  getWorkbookById, getPublisherById, getWorkbookRelations,
  getWorkbooksByPublisher, getYoutubeLinksByWorkbookId,
} from "@/lib/db/catalog";
import { DifficultyLevel } from "@/data/types";
import { WorkbookStatusControl } from "./WorkbookStatusControl";
import { BackButton } from "./BackButton";

export default async function WorkbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workbook = await getWorkbookById(id);
  if (!workbook) notFound();

  const [publisher, relations, publisherWorkbooksAll, youtubeLinks] = await Promise.all([
    getPublisherById(workbook.publisherId),
    getWorkbookRelations(id),
    getWorkbooksByPublisher(workbook.publisherId),
    getYoutubeLinksByWorkbookId(id),
  ]);
  const publisherWorkbooks = publisherWorkbooksAll.filter((w) => w.id !== id);
```
이후 JSX는 기존과 동일하되 다음 3가지만 바꾼다:
1. 최상단 `<Button ... onClick={router.back()}>...뒤로</Button>` 블록을 `<BackButton />`로 교체.
2. `{isLoggedIn && (<div ...><StatusToggle .../></div>)}` 블록 전체를 `<WorkbookStatusControl workbookId={id} />`로 교체.
3. 동일 출판사 카드: `<WorkbookCard key={wb.id} workbook={wb} />` → `<WorkbookCard key={wb.id} workbook={wb} publisherName={publisher?.name} />`.

(나머지 정적 마크업은 그대로 둔다.)

- [ ] **Step 4: 로딩 UI 작성**

`src/app/workbooks/[id]/loading.tsx`:
```tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="h-8 w-16 rounded bg-muted animate-pulse mb-4" />
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="aspect-[3/4] w-full max-w-[300px] mx-auto rounded-lg bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-20 w-full rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 빌드/타입 체크**

Run: `npx tsc --noEmit`
Expected: 상세 페이지 관련 에러 없음.

Run: `npm run build`
Expected: 빌드 성공. (Supabase 환경변수가 빌드 시 필요하면 `.env.local`이 설정돼 있어야 함.)

- [ ] **Step 6: 수동 검증**

`npm run dev` 후 `/workbooks/wb-ssen` 접속 → 문제집 상세가 DB 데이터로 렌더되는지, 로그인 시 상태 토글이 보이는지 확인.

- [ ] **Step 7: Commit**

```bash
git add src/app/workbooks/[id]/
git commit -m "feat(workbooks): render detail page as server component from DB"
```

---

### Task 11: `/workbooks` 목록 페이지 서버 컴포넌트화

**Files:**
- Modify: `src/app/workbooks/page.tsx`
- Create: `src/app/workbooks/WorkbookBrowser.tsx` (클라이언트 필터/검색/비교 island)
- Create: `src/app/workbooks/loading.tsx`

목록 페이지는 카탈로그 전체를 서버에서 받아 클라이언트 island(`WorkbookBrowser`)로 넘긴다. 필터·검색·비교·상태 토글 등 상호작용은 island에서 처리하며, URL `searchParams`(`level`, `publisher` 등)는 서버에서 읽어 초기값으로 전달한다.

- [ ] **Step 1: 현재 페이지 파악**

Run: `sed -n '1,60p' src/app/workbooks/page.tsx`
Expected: 현재 `"use client"` 페이지가 `getWorkbooks`/`getPublishers` 등을 동기 호출하고 `useSearchParams`로 필터 상태를 관리함을 확인.

- [ ] **Step 2: 클라이언트 island 작성**

기존 `src/app/workbooks/page.tsx`의 본문(필터 UI, 그리드, 검색, 비교 로직)을 거의 그대로 옮긴 `"use client"` 컴포넌트 `WorkbookBrowser`를 만든다. 단, 데이터는 import 대신 props로 받는다:
```tsx
"use client";

import type { Workbook, Publisher, Subject } from "@/data/types";
// ...기존 page.tsx가 쓰던 UI import 그대로...

export function WorkbookBrowser({
  workbooks,
  publishers,
  subjects,
  initialLevel,
  initialPublisherId,
}: {
  workbooks: Workbook[];
  publishers: Publisher[];
  subjects: Subject[];
  initialLevel?: number;
  initialPublisherId?: string;
}) {
  const publisherName = (id: string) => publishers.find((p) => p.id === id)?.name ?? "";
  // 기존 page.tsx의 useState/필터/검색/정렬 로직을 여기로 이식.
  // 정적 api 호출(getWorkbooks/getPublishers/getPublisherById)은 모두
  // 위 props + filterWorkbooks(@/lib/transform) 로 대체한다.
  // WorkbookCard 사용 시 publisherName={publisherName(wb.publisherId)} 전달.
}
```
> 필터링은 클라이언트에서 `filterWorkbooks(workbooks, publishers, {...})`(`@/lib/transform`)를 재사용한다. 비교/상태 토글 등 기존 상호작용 로직은 그대로 유지한다.

- [ ] **Step 3: 페이지를 서버 컴포넌트로 교체**

`src/app/workbooks/page.tsx` 전체:
```tsx
import { getCatalog } from "@/lib/db/catalog";
import { WorkbookBrowser } from "./WorkbookBrowser";

export default async function WorkbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; publisher?: string }>;
}) {
  const sp = await searchParams;
  const { workbooks, publishers, subjects } = await getCatalog();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <WorkbookBrowser
        workbooks={workbooks}
        publishers={publishers}
        subjects={subjects}
        initialLevel={sp.level ? Number(sp.level) : undefined}
        initialPublisherId={sp.publisher}
      />
    </div>
  );
}
```
(헤더/제목 등 기존 정적 마크업은 서버 페이지 또는 island 상단으로 옮긴다.)

- [ ] **Step 4: 로딩 UI 작성**

`src/app/workbooks/loading.tsx`:
```tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="h-8 w-40 rounded bg-muted animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 빌드/타입/수동 검증**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공.
수동: `/workbooks?level=3` 접속 → 난이도 3 초기 필터 적용, 검색·비교 동작 확인.

- [ ] **Step 6: Commit**

```bash
git add src/app/workbooks/
git commit -m "feat(workbooks): server-render list, move browsing UI to client island"
```

---

### Task 12: 홈 `/` 전환 (서버 카탈로그 → 클라이언트 셸)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/HomeView.tsx` (클라이언트 셸)

홈은 인증 상태에 따라 분기하고 `buildMyRoadmap`을 쓰므로, 서버 페이지가 카탈로그를 받아 클라이언트 셸 `HomeView`에 props로 넘긴다. `MyRoadmapSection`/`QuickRecommend`/`RecommendedRoadmaps`는 `HomeView` 내부로 이동하고 정적 api 호출을 props로 대체한다.

- [ ] **Step 1: 클라이언트 셸 작성**

`src/app/HomeView.tsx`에 기존 `page.tsx`의 클라이언트 로직 전체(컴포넌트 `MyRoadmapSection`, `RecommendedRoadmaps`, `HomePage` 본문)를 이식하되 데이터는 props로:
```tsx
"use client";

import type { Workbook, Publisher, WorkbookRelation, Roadmap } from "@/data/types";
import { buildMyRoadmap } from "@/lib/transform";
import { useAuthContext } from "@/hooks/auth-context";
// ...기존 UI import 그대로...

export interface HomeViewProps {
  workbooks: Workbook[];
  publishers: Publisher[];
  relations: WorkbookRelation[];
  roadmaps: Roadmap[];
}

export function HomeView({ workbooks, publishers, relations, roadmaps }: HomeViewProps) {
  const workbooksById = new Map(workbooks.map((w) => [w.id, w]));
  const publisherName = (id: string) => publishers.find((p) => p.id === id)?.name ?? "";
  // MyRoadmapSection 내부: buildMyRoadmap(userWorkbooks, workbooksById, relations) 사용.
  // RecommendedRoadmaps: getRoadmaps(...) 대신 roadmaps.filter(type) 사용.
  // getPublisherById → publisherName(id) 로 대체.
}
```
- `MyRoadmapSection`의 `buildMyRoadmap(userWorkbooks)` → `buildMyRoadmap(userWorkbooks, workbooksById, relations)`.
- `getPublisherById(...)` 호출 → `publisherName(...)`.
- `RecommendedRoadmaps`의 `getRoadmaps("grade"/"publisher")` → `roadmaps.filter((r) => r.type === ...).sort(byDisplayOrder)`.
- `QuickRecommend`는 Task 13에서 props화하므로 여기선 `<QuickRecommend workbooks={workbooks} publishers={publishers} />`로 호출(시그니처는 Task 13에서 맞춤).

- [ ] **Step 2: 서버 페이지로 교체**

`src/app/page.tsx` 전체:
```tsx
import { getCatalog } from "@/lib/db/catalog";
import { HomeView } from "./HomeView";

export default async function Page() {
  const { workbooks, publishers, relations, roadmaps } = await getCatalog();
  return (
    <HomeView
      workbooks={workbooks}
      publishers={publishers}
      relations={relations}
      roadmaps={roadmaps}
    />
  );
}
```

- [ ] **Step 3: 빌드/타입 체크**

Run: `npx tsc --noEmit`
Expected: `QuickRecommend` 시그니처 불일치만 남을 수 있음(Task 13에서 해결). 그 외 홈 관련 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/HomeView.tsx
git commit -m "feat(home): server-fetch catalog, render via client shell"
```

---

### Task 13: 나머지 카탈로그 소비처 props화 (QuickRecommend, WorkbookCompare, MyRoadmapFlow, dashboard, roadmap)

**Files:**
- Modify: `src/components/workbook/QuickRecommend.tsx`
- Modify: `src/components/workbook/WorkbookCompare.tsx`
- Modify: `src/components/roadmap/MyRoadmapFlow.tsx`
- Modify: `src/app/dashboard/page.tsx`, `src/app/dashboard/workbooks/page.tsx`, `src/app/roadmap/page.tsx`

남은 `@/lib/api` 동기 소비처를 props 기반으로 바꾼다. 페이지(dashboard/roadmap)는 홈과 같은 패턴(서버 페이지가 `getCatalog()` → 클라이언트 셸/뷰에 props 전달)으로 전환한다.

- [ ] **Step 1: 각 소비처의 api 사용 확인**

Run: `grep -n "@/lib/api" src/components/workbook/QuickRecommend.tsx src/components/workbook/WorkbookCompare.tsx src/components/roadmap/MyRoadmapFlow.tsx src/app/dashboard/page.tsx src/app/dashboard/workbooks/page.tsx src/app/roadmap/page.tsx`
Expected: 각 파일이 호출하는 정확한 api 함수 목록 확인.

- [ ] **Step 2: QuickRecommend props화**

`QuickRecommend.tsx`에서 `import { getWorkbooks, getPublisherById } from "@/lib/api";` 제거. props로 `workbooks: Workbook[]`, `publishers: Publisher[]`를 받고, 내부 `getWorkbooks({difficultyLevel, bookType, sort})` 호출을 `filterWorkbooks(workbooks, publishers, {...})`(`@/lib/transform`)로, `getPublisherById(id)`를 `publishers.find((p)=>p.id===id)`로 대체.

- [ ] **Step 3: WorkbookCompare / MyRoadmapFlow props화**

두 컴포넌트가 쓰는 api 함수(예: `getPublisherById`, `getWorkbookById`)를 props(예: `publishers`, `workbooksById`)로 대체한다. 호출부(상세/홈/roadmap 페이지)에서 카탈로그 슬라이스를 넘긴다.

- [ ] **Step 4: dashboard / dashboard/workbooks / roadmap 서버 전환**

각 페이지를 다음 패턴으로 바꾼다 — 서버 페이지가 `getCatalog()`로 데이터를 받아 기존 클라이언트 본문을 옮긴 `*View` 클라이언트 컴포넌트에 props로 전달:
```tsx
// 예: src/app/dashboard/page.tsx
import { getCatalog } from "@/lib/db/catalog";
import { DashboardView } from "./DashboardView";

export default async function DashboardPage() {
  const { workbooks } = await getCatalog();
  return <DashboardView workbooks={workbooks} />;
}
```
`DashboardView`(클라이언트)는 기존 `dashboard/page.tsx` 본문을 옮기고 `getWorkbookById(uw.workbookId)`를 `workbooksById.get(...)`(props로 받은 Map 또는 배열에서 조회)로 대체한다. `roadmap/page.tsx`도 동일 패턴(`getRoadmaps`/`getRoadmapSteps` → `getCatalog()` 결과 + `transform`/정렬). `roadmapGradeGroups`는 계속 `@/data/roadmaps`에서 직접 import(표현용 정적 데이터).

- [ ] **Step 5: 빌드/타입/수동 검증**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공. 남은 `@/lib/api` import 0건이어야 한다:
Run: `grep -rn "@/lib/api" src; echo "exit=$?"`
Expected: 매치 없음.

수동: 홈·대시보드·로드맵·비교 기능이 DB 데이터로 정상 동작.

- [ ] **Step 6: Commit**

```bash
git add src/components src/app/dashboard src/app/roadmap
git commit -m "feat(catalog): migrate remaining catalog consumers to props/server fetch"
```

---

### Task 14: 구 `api.ts` 제거 (정적 import 정리)

**Files:**
- Delete: `src/lib/api.ts`
- (유지) `src/data/*.ts` — 시드 원본

- [ ] **Step 1: 잔존 참조 확인**

Run: `grep -rn "from \"@/lib/api\"\|from '@/lib/api'" src; echo done`
Expected: 출력 없음(Task 13에서 모두 이관됨).

- [ ] **Step 2: 삭제 + 정적 data import 점검**

`src/lib/api.ts` 삭제. 앱 코드(`src/app`, `src/components`, `src/hooks`)가 `@/data/workbooks` 등 **데이터 배열**을 직접 import하지 않는지 확인(타입·상수 import는 허용):
Run: `grep -rn "@/data/\(workbooks\|publishers\|relations\|roadmaps\|subjects\|youtube-links\)" src/app src/components src/hooks`
Expected: `roadmapGradeGroups`(roadmap View)와 `@/data/types`·상수 외 데이터 배열 import 없음. 데이터 배열 직접 import가 남아있으면 props/카탈로그 조회로 마저 전환.

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 4: Commit**

```bash
git rm src/lib/api.ts
git commit -m "refactor: remove static api layer in favor of server catalog + transforms"
```

---

# Phase 3 — 사용자 데이터 영구 저장

### Task 15: 사용자 데이터 CRUD 모듈

**Files:**
- Create: `src/lib/db/user-data.ts`

브라우저 Supabase 클라이언트로 `user_workbooks`/`profiles`를 읽고 쓴다. RLS가 본인 행만 허용하므로 별도 권한 처리 불필요.

- [ ] **Step 1: 작성**

`src/lib/db/user-data.ts`:
```ts
import { supabase } from "@/lib/supabase";
import type { UserWorkbook, WorkbookStatus, Profile } from "@/data/types";

function mapUserWorkbook(r: Record<string, any>): UserWorkbook {
  return {
    id: r.id,
    userId: r.user_id,
    workbookId: r.workbook_id,
    status: r.status,
    startedAt: r.started_at ?? undefined,
    completedAt: r.completed_at ?? undefined,
    note: r.note ?? undefined,
  };
}

export async function fetchUserWorkbooks(userId: string): Promise<UserWorkbook[]> {
  const { data, error } = await supabase
    .from("user_workbooks")
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(`내 문제집 조회 실패: ${error.message}`);
  return (data ?? []).map(mapUserWorkbook);
}

export async function upsertUserWorkbook(input: {
  userId: string;
  workbookId: string;
  status: WorkbookStatus;
  startedAt?: string;
  completedAt?: string;
}): Promise<void> {
  const { error } = await supabase.from("user_workbooks").upsert(
    {
      user_id: input.userId,
      workbook_id: input.workbookId,
      status: input.status,
      started_at: input.startedAt ?? null,
      completed_at: input.completedAt ?? null,
    },
    { onConflict: "user_id,workbook_id" }
  );
  if (error) throw new Error(`상태 저장 실패: ${error.message}`);
}

export async function deleteUserWorkbook(userId: string, workbookId: string): Promise<void> {
  const { error } = await supabase
    .from("user_workbooks")
    .delete()
    .eq("user_id", userId)
    .eq("workbook_id", workbookId);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`프로필 조회 실패: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    displayName: data.display_name ?? "사용자",
    avatarUrl: data.avatar_url ?? undefined,
    currentGrade: data.current_grade ?? undefined,
    currentLevel: data.current_level ?? undefined,
    targetLevel: data.target_level ?? undefined,
  };
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/user-data.ts
git commit -m "feat(db): add client user-data CRUD (user_workbooks, profiles)"
```

---

### Task 16: `useAuth` 영구 저장 연결 (낙관적 업데이트 + 롤백)

**Files:**
- Modify: `src/hooks/use-auth.ts`

로그인 시 `user_workbooks`/`profiles`를 로드하고, 상태 변경/삭제를 Supabase에 반영한다. UI 즉시 반응을 위해 낙관적 업데이트 후 실패 시 스냅샷으로 롤백한다.

- [ ] **Step 1: 로드 연결**

`use-auth.ts`에 `import { fetchUserWorkbooks, upsertUserWorkbook, deleteUserWorkbook, fetchProfile } from "@/lib/db/user-data";`와 `const [error, setError] = useState<string | null>(null);` 추가.

세션 확정 시 사용자 데이터를 로드하는 헬퍼를 추가하고 `getSession().then(...)`과 `onAuthStateChange` 양쪽에서 호출:
```ts
const loadUserData = useCallback(async (userId: string) => {
  try {
    const [uws, prof] = await Promise.all([
      fetchUserWorkbooks(userId),
      fetchProfile(userId),
    ]);
    setUserWorkbooks(uws);
    if (prof) setProfile(prof);
  } catch (e) {
    setError((e as Error).message);
  }
}, []);
```
`getSession().then(({data:{session}})=>{ if (session?.user){ setIsLoggedIn(true); setProfile(userToProfile(session.user)); loadUserData(session.user.id); } setLoading(false); })` 형태로, `onAuthStateChange`의 로그인 분기에서도 `loadUserData(session.user.id)` 호출. 로그아웃 분기는 기존대로 초기화.

- [ ] **Step 2: 낙관적 업데이트 + 롤백으로 변경**

`updateWorkbookStatus`를 다음으로 교체(기존 state 계산식은 유지하되 비동기 영속화 + 롤백 추가):
```ts
const updateWorkbookStatus = useCallback(
  async (workbookId: string, status: WorkbookStatus) => {
    const userId = profile?.id;
    if (!userId) return;
    const snapshot = userWorkbooks;
    const now = new Date().toISOString().split("T")[0];
    const existing = snapshot.find((uw) => uw.workbookId === workbookId);
    const startedAt =
      status === "in_progress" && !existing?.startedAt ? now : existing?.startedAt;
    const completedAt = status === "completed" ? now : undefined;

    // 낙관적 반영
    setUserWorkbooks((prev) => {
      const found = prev.find((uw) => uw.workbookId === workbookId);
      if (found) {
        return prev.map((uw) =>
          uw.workbookId === workbookId ? { ...uw, status, startedAt, completedAt } : uw
        );
      }
      return [
        ...prev,
        { id: `uw-${Date.now()}`, userId, workbookId, status, startedAt, completedAt },
      ];
    });

    try {
      await upsertUserWorkbook({ userId, workbookId, status, startedAt, completedAt });
    } catch (e) {
      setUserWorkbooks(snapshot); // 롤백
      setError((e as Error).message);
    }
  },
  [profile, userWorkbooks]
);
```
`removeWorkbook`도 동일 패턴:
```ts
const removeWorkbook = useCallback(
  async (workbookId: string) => {
    const userId = profile?.id;
    if (!userId) return;
    const snapshot = userWorkbooks;
    setUserWorkbooks((prev) => prev.filter((uw) => uw.workbookId !== workbookId));
    try {
      await deleteUserWorkbook(userId, workbookId);
    } catch (e) {
      setUserWorkbooks(snapshot);
      setError((e as Error).message);
    }
  },
  [profile, userWorkbooks]
);
```
`return { ... }`에 `error`를 추가한다. (`StatusToggle`/island의 `onStatusChange`는 `void` 콜백이라 async 함수를 그대로 넘겨도 호환된다.)

- [ ] **Step 3: 빌드/타입 체크**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공.

- [ ] **Step 4: 수동 검증 — 영속성**

`npm run dev`, 로그인 → `/workbooks/wb-ssen`에서 "내 문제집에 추가" → 상태를 "진행중"으로 → **새로고침** → 상태가 유지되는지 확인(핵심 버그 해결 검증). 대시보드·홈 로드맵에도 반영 확인.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-auth.ts
git commit -m "feat(auth): persist user_workbooks/profiles to supabase with optimistic updates"
```

---

### Task 17: 저장 실패 피드백 노출

**Files:**
- Modify: `src/app/providers.tsx`
- Create: `src/components/layout/ErrorToast.tsx`

`useAuth`의 `error`를 사용자에게 보이게 한다. (간단한 고정 토스트 — 외부 라이브러리 없이.)

- [ ] **Step 1: 토스트 컴포넌트 작성**

`src/components/layout/ErrorToast.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/hooks/auth-context";

export function ErrorToast() {
  const { error } = useAuthContext() as { error?: string | null };
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => {}, 4000);
    return () => clearTimeout(t);
  }, [error]);
  if (!error) return null;
  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-lg"
    >
      {error}
    </div>
  );
}
```
> 더 정교한 자동 소멸이 필요하면 `useAuth`에 `clearError`를 추가해 timeout에서 호출한다. 최소 구현은 위로 충분.

- [ ] **Step 2: providers에 장착**

`src/app/providers.tsx`의 `<Footer />` 다음에 `<ErrorToast />` 추가하고 import.

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 4: Commit**

```bash
git add src/app/providers.tsx src/components/layout/ErrorToast.tsx
git commit -m "feat(ui): surface user-data save errors via toast"
```

---

# Phase 4 — 정리 & 검증

### Task 18: 카탈로그 누락/로딩 마감

**Files:**
- Create: `src/app/workbooks/[id]/not-found.tsx` (선택)

- [ ] **Step 1: not-found UI(선택) 작성**

`src/app/workbooks/[id]/not-found.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-xl font-bold">문제집을 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">존재하지 않거나 비활성화된 문제집입니다.</p>
      <Link href="/workbooks">
        <Button className="mt-4">문제집 목록으로</Button>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: 검증**

`/workbooks/없는id` 접속 → 위 not-found 렌더 확인.

- [ ] **Step 3: Commit**

```bash
git add src/app/workbooks/[id]/not-found.tsx
git commit -m "feat(workbooks): add not-found UI for missing detail"
```

---

### Task 19: 사용자 CRUD 통합 테스트 (게이트)

**Files:**
- Create: `src/lib/db/user-data.itest.ts`

실 Supabase(테스트 프로젝트 또는 로컬)가 필요하므로 환경변수가 없으면 스킵한다.

- [ ] **Step 1: 테스트 작성**

`src/lib/db/user-data.itest.ts`:
```ts
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
```
> 주의: `user-data.ts`는 브라우저 클라이언트(`@/lib/supabase`)를 쓴다. Node 통합 테스트에서 RLS를 통과하려면 테스트용 인증 세션이 필요하다. 간단히는 별도 테스트 클라이언트(서비스 롤 또는 테스트 유저 로그인)를 주입하도록 `user-data.ts`를 약간 일반화하거나, 이 테스트를 RLS 우회가 가능한 환경에서만 돌린다. 환경이 없으면 스킵되므로 CI를 막지 않는다.

- [ ] **Step 2: 실행(환경 없으면 스킵 확인)**

Run: `npx tsx --test src/lib/db/user-data.itest.ts`
Expected: 환경변수 미설정 시 `skip` 표시로 통과. 설정 시 실제 upsert→fetch→delete 통과.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/user-data.itest.ts
git commit -m "test(db): add gated integration test for user-data CRUD"
```

---

### Task 20: 전체 검증 & 마무리

- [ ] **Step 1: 전체 테스트**

Run: `npx tsx --test scripts/collect-workbook/utils/seed-rows.test.ts src/lib/db/mappers.test.ts src/lib/transform.test.ts src/lib/roadmap-timeline.test.ts`
Expected: 전부 PASS.

- [ ] **Step 2: 린트 & 타입 & 빌드**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: 모두 통과.

- [ ] **Step 3: 핵심 시나리오 수동 검증**

1. 비로그인 홈/목록/상세 → DB 카탈로그 정상 렌더.
2. 로그인 → 문제집 추가/상태변경/삭제 → **새로고침 후 유지**.
3. 대시보드 통계·홈 로드맵·추천 다음 단계 반영.
4. 저장 실패(네트워크 차단) 시 롤백 + 토스트.

- [ ] **Step 4: README/문서 갱신 커밋(선택)**

데이터 흐름이 바뀌었으므로 `README.md`의 "기술 스택"에 시드 명령(`npm run seed`)과 Supabase 의존을 한 줄 추가하고 커밋:
```bash
git add README.md
git commit -m "docs: note supabase seeding and data flow"
```

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지**
- 카탈로그 단일 출처=Supabase, 영구 저장 → Phase 1(시드)+Phase 2(읽기)+Phase 3(쓰기) 커버.
- 카탈로그 Server Component → Task 10~13.
- src/data 원본 유지 + 시드 → Task 3·4(원본 유지, upsert).
- 사용자 데이터 클라이언트 fetch/렌더(인증 현행) → Task 15·16(브라우저 클라이언트, 낙관적).
- TEXT id 결정 → Task 1.
- 로딩/에러/notFound → Task 10·11·17·18.
- 테스트 → Task 3·6·7(유닛), 19(통합).
- 단계별 독립 동작 → Phase 경계가 빌드 통과 지점.

**2. Placeholder 스캔**: 코드 단계는 실제 코드 포함. "기존 본문 이식"으로 표기한 Task 11~13의 island는 **현재 페이지의 검증된 UI를 옮기고 데이터 소스만 props/transform으로 치환**하는 기계적 작업으로, 치환 규칙(어느 api 호출을 무엇으로 바꾸는지)을 명시했다.

**3. 타입 일관성**: `Catalog.workbooksById`(Task 8) ↔ `buildMyRoadmap(_, workbooksById, relations)`(Task 7) ↔ `HomeView`/`DashboardView`에서 Map 구성 일치. `filterWorkbooks`/`enrichRelations` 시그니처가 Task 7 정의와 Task 8·11·13 사용처에서 일치. `upsertUserWorkbook` 인자 형태가 Task 15 정의와 Task 16 호출에서 일치. row 매퍼(snake→camel, Task 6)와 시드 매퍼(camel→snake, Task 3)가 동일 컬럼명 규약 사용.

**알려진 제약**: Task 19 통합 테스트는 RLS 때문에 인증 세션이 필요해 기본 스킵된다(환경 갖춰질 때만 실행). Task 11~13은 기존 클라이언트 UI 분량이 커서 island 이식 시 import 정리가 동반된다 — 빌드/`grep @/lib/api` 0건으로 검증한다.
