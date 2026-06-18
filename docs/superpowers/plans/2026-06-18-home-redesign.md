# 홈 화면 재구성 (Bento × Ink & Signal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈(`/`)을 벤토 그리드 + 잉크&시그널 비주얼로 재구성하고, 442줄 `HomeView.tsx`를 작은 타일 컴포넌트로 분해하며, 앱 전역 테마를 시그널 블루 + Pretendard로 교체한다.

**Architecture:** `page.tsx`(서버)의 데이터 패칭은 유지. `HomeView`는 `useAuthContext()` 상태로 타일 목록(`getHomeTiles`)을 정하고 `BentoGrid`에 배치하는 얇은 오케스트레이터가 된다. 타일은 `src/components/home/`의 단일 책임 프레젠테이션 컴포넌트. 비주얼은 `globals.css` 토큰(시그널 블루, Pretendard)으로 전역 적용.

**Tech Stack:** Next.js(App Router), React, TypeScript, Tailwind v4 + shadcn(@theme/oklch 토큰), lucide-react, `tsx --test`(node:test) 단위 테스트.

**참고 스펙:** `docs/superpowers/specs/2026-06-18-home-redesign-design.md`

---

## 파일 구조

**생성:**
- `src/components/home/homeTiles.ts` — 상태별 타일 목록/스팬 (순수 로직)
- `src/components/home/homeTiles.test.ts` — 위 단위 테스트
- `src/components/home/BentoGrid.tsx` — 그리드 래퍼
- `src/components/home/BentoTile.tsx` — 공통 타일 셸(테두리/라운드/패딩)
- `src/components/home/useMyRoadmapData.ts` — 로그인 사용자 로드맵 데이터 훅
- `src/components/home/HeroTile.tsx`
- `src/components/home/QuickRecommendTile.tsx`
- `src/components/home/GradeRoadmapTile.tsx` (로그인의 "추천 로드맵"도 재사용)
- `src/components/home/PublisherLineupTile.tsx`
- `src/components/home/LevelShortcutTile.tsx`
- `src/components/home/EmptyRoadmapTile.tsx`
- `src/components/home/GreetingStatsTile.tsx`
- `src/components/home/ProgressTile.tsx`
- `src/components/home/AddBookTile.tsx`
- `src/components/home/MyRoadmapTile.tsx`
- `src/components/home/NextStepsTile.tsx`
- `src/components/home/MyBooksTile.tsx`

**수정:**
- `src/app/globals.css` — 시그널 블루 토큰 + Pretendard
- `src/app/HomeView.tsx` — 오케스트레이터로 재작성
- `package.json` — test 스크립트에 homeTiles.test.ts 추가
- `src/components/workbook/QuickRecommend.tsx` — 장식 보라/파랑 정리
- `src/components/roadmap/MyRoadmapFlow.tsx` — 장식 보라 정리
- `src/app/roadmap/RoadmapView.tsx` — 장식 보라 정리(의미색 보존)
- `src/app/dashboard/DashboardView.tsx` — 장식 보라/파랑 정리(의미색 보존)

---

## Task 1: 전역 비주얼 토큰 — 시그널 블루 + Pretendard

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Pretendard 폰트 import 추가**

`src/app/globals.css` 상단의 기존 `@import` 블록 바로 아래(즉 `@import "shadcn/tailwind.css";` 다음 줄)에 추가:

```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css");
```

- [ ] **Step 2: `--font-sans`를 Pretendard 우선으로 지정**

`globals.css`의 `:root { ... }` 블록 안 끝부분(`--radius: 0.625rem;` 다음 줄)에 추가:

```css
  --font-sans: "Pretendard Variable", var(--font-geist-sans), system-ui, -apple-system, sans-serif;
```

- [ ] **Step 3: 시그널 블루를 primary/ring에 적용 (라이트)**

`globals.css`의 `:root` 블록에서 아래 4개 변수를 교체:

```css
  --primary: oklch(0.546 0.227 262);
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.546 0.227 262);
  --sidebar-primary: oklch(0.546 0.227 262);
```

(나머지 무채색 토큰·`--border`·난이도/등급 색은 변경하지 않는다.)

- [ ] **Step 4: 시그널 블루 적용 (다크)**

`globals.css`의 `.dark` 블록에서 아래를 교체:

```css
  --primary: oklch(0.623 0.196 259);
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.623 0.196 259);
  --sidebar-primary: oklch(0.623 0.196 259);
```

- [ ] **Step 5: 빌드/타입 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음(출력 없음).

Run: `npm run build`
Expected: 빌드 성공. (CSS만 변경이라 컴파일 통과)

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): switch primary to signal blue and adopt Pretendard"
```

---

## Task 2: 타일 구성 로직 `getHomeTiles` (TDD)

**Files:**
- Create: `src/components/home/homeTiles.ts`
- Test: `src/components/home/homeTiles.test.ts`
- Modify: `package.json`

- [ ] **Step 1: test 스크립트에 테스트 경로 추가**

`package.json`의 `"test"` 스크립트 끝에 ` src/components/home/homeTiles.test.ts`를 추가:

```json
    "test": "tsx --test scripts/collect-workbook/utils/*.test.ts src/lib/roadmap-timeline.test.ts src/lib/transform.test.ts src/lib/db/mappers.test.ts src/components/home/homeTiles.test.ts",
```

- [ ] **Step 2: 실패하는 테스트 작성**

Create `src/components/home/homeTiles.test.ts`:

```ts
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
```

- [ ] **Step 3: 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './homeTiles'`.

- [ ] **Step 4: 최소 구현 작성**

Create `src/components/home/homeTiles.ts`:

```ts
export type HomeTileKey =
  | "hero"
  | "quickRecommend"
  | "gradeRoadmap"
  | "publisherLineup"
  | "levelShortcut"
  | "emptyRoadmap"
  | "greetingStats"
  | "progress"
  | "addBook"
  | "myRoadmap"
  | "nextSteps"
  | "myBooks"
  | "recommendedRoadmap";

export interface HomeTileSpec {
  key: HomeTileKey;
  /** Tailwind 그리드 span 클래스 (모바일 1열, md에서 4열) */
  span: string;
}

export interface HomeTileContext {
  isLoggedIn: boolean;
  hasWorkbooks: boolean;
}

const LOGGED_OUT: HomeTileSpec[] = [
  { key: "hero", span: "md:col-span-2" },
  { key: "quickRecommend", span: "md:col-span-2" },
  { key: "gradeRoadmap", span: "md:col-span-2" },
  { key: "publisherLineup", span: "md:col-span-2" },
  { key: "levelShortcut", span: "md:col-span-4" },
];

const LOGGED_IN_EMPTY: HomeTileSpec[] = [
  { key: "emptyRoadmap", span: "md:col-span-4" },
  { key: "quickRecommend", span: "md:col-span-2" },
  { key: "gradeRoadmap", span: "md:col-span-2" },
  { key: "levelShortcut", span: "md:col-span-4" },
];

const LOGGED_IN_FULL: HomeTileSpec[] = [
  { key: "greetingStats", span: "md:col-span-2" },
  { key: "progress", span: "md:col-span-1" },
  { key: "addBook", span: "md:col-span-1" },
  { key: "myRoadmap", span: "md:col-span-3" },
  { key: "nextSteps", span: "md:col-span-1" },
  { key: "myBooks", span: "md:col-span-2" },
  { key: "quickRecommend", span: "md:col-span-2" },
  { key: "recommendedRoadmap", span: "md:col-span-2" },
  { key: "levelShortcut", span: "md:col-span-2" },
];

export function getHomeTiles(ctx: HomeTileContext): HomeTileSpec[] {
  if (!ctx.isLoggedIn) return LOGGED_OUT;
  return ctx.hasWorkbooks ? LOGGED_IN_FULL : LOGGED_IN_EMPTY;
}
```

- [ ] **Step 5: 통과 확인**

Run: `npm test`
Expected: PASS (홈 테스트 4건 포함 전체 그린).

- [ ] **Step 6: Commit**

```bash
git add src/components/home/homeTiles.ts src/components/home/homeTiles.test.ts package.json
git commit -m "feat(home): add getHomeTiles layout resolver with tests"
```

---

## Task 3: BentoGrid + BentoTile 셸

**Files:**
- Create: `src/components/home/BentoGrid.tsx`
- Create: `src/components/home/BentoTile.tsx`

- [ ] **Step 1: BentoGrid 작성**

Create `src/components/home/BentoGrid.tsx`:

```tsx
export function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: BentoTile 셸 작성**

Create `src/components/home/BentoTile.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface BentoTileProps {
  className?: string;
  children: React.ReactNode;
}

/** 잉크&시그널 공통 타일 셸: 헤어라인 테두리 + 큰 라운드 + 플랫. */
export function BentoTile({ className, children }: BentoTileProps) {
  return (
    <div
      className={cn(
        "h-full rounded-2xl border bg-card p-5 transition-all hover:border-foreground/20",
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/BentoGrid.tsx src/components/home/BentoTile.tsx
git commit -m "feat(home): add BentoGrid and BentoTile shell"
```

---

## Task 4: 로그아웃/탐색 타일 5종

각 타일은 `src/components/home/`에 생성한다. 모두 작성 후 한 번에 타입 검증·커밋한다.

**Files:**
- Create: `HeroTile.tsx`, `QuickRecommendTile.tsx`, `GradeRoadmapTile.tsx`, `PublisherLineupTile.tsx`, `LevelShortcutTile.tsx`, `EmptyRoadmapTile.tsx`

- [ ] **Step 1: HeroTile 작성**

Create `src/components/home/HeroTile.tsx`:

```tsx
import Link from "next/link";
import { Target, LogIn, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroTile() {
  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border bg-foreground p-8 text-background">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-background/20 px-3 py-1 text-xs text-background/80">
          <Target className="h-3 w-3" />
          2022 개정 교육과정 기준
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          나만의 수학 로드맵
        </h1>
        <p className="mt-3 max-w-md text-sm text-background/70">
          풀어온 문제집을 등록하면 학습 경로가 자동으로 시각화되고, 다음에 풀면 좋은 문제집을 추천받습니다.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/login">
          <Button size="lg" className="gap-2">
            <LogIn className="h-4 w-4" />
            로그인하고 시작하기
          </Button>
        </Link>
        <Link href="/workbooks">
          <Button
            size="lg"
            variant="outline"
            className="gap-2 border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
          >
            <BookOpen className="h-4 w-4" />
            문제집 둘러보기
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: QuickRecommendTile 작성**

Create `src/components/home/QuickRecommendTile.tsx`:

```tsx
import { QuickRecommend } from "@/components/workbook/QuickRecommend";
import type { Workbook, Publisher } from "@/data/types";

interface QuickRecommendTileProps {
  workbooks: Workbook[];
  publishers: Publisher[];
}

export function QuickRecommendTile({ workbooks, publishers }: QuickRecommendTileProps) {
  return <QuickRecommend workbooks={workbooks} publishers={publishers} />;
}
```

- [ ] **Step 3: GradeRoadmapTile 작성** (로그인 "추천 로드맵"도 이 컴포넌트를 재사용)

Create `src/components/home/GradeRoadmapTile.tsx`:

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BentoTile } from "./BentoTile";
import type { Roadmap } from "@/data/types";

export function GradeRoadmapTile({ roadmaps }: { roadmaps: Roadmap[] }) {
  const grade = roadmaps
    .filter((r) => r.type === "grade")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <BentoTile>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">등급별 로드맵</h3>
        <Link href="/roadmap" className="flex items-center gap-1 text-sm text-primary hover:underline">
          전체 보기 <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="space-y-1.5">
        {grade.slice(0, 5).map((rm) => (
          <li key={rm.id}>
            <Link
              href={`/roadmap?tab=${rm.id}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <span className="font-medium">{rm.name}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </BentoTile>
  );
}
```

- [ ] **Step 4: PublisherLineupTile 작성**

Create `src/components/home/PublisherLineupTile.tsx`:

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BentoTile } from "./BentoTile";
import type { Roadmap } from "@/data/types";

export function PublisherLineupTile({ roadmaps }: { roadmaps: Roadmap[] }) {
  const publisherRoadmaps = roadmaps
    .filter((r) => r.type === "publisher")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <BentoTile>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">출판사별 라인업</h3>
        <Link href="/roadmap" className="flex items-center gap-1 text-sm text-primary hover:underline">
          전체 보기 <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {publisherRoadmaps.map((rm) => (
          <Link key={rm.id} href={`/roadmap?tab=${rm.id}`} className="shrink-0">
            <div className="w-40 rounded-lg border p-3 transition-colors hover:bg-accent">
              <h4 className="truncate text-sm font-semibold">{rm.name}</h4>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                {rm.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </BentoTile>
  );
}
```

- [ ] **Step 5: LevelShortcutTile 작성**

Create `src/components/home/LevelShortcutTile.tsx`:

```tsx
import Link from "next/link";
import { BentoTile } from "./BentoTile";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import type { DifficultyLevel } from "@/data/types";

export function LevelShortcutTile() {
  return (
    <BentoTile>
      <h3 className="mb-3 font-semibold">난이도별 문제집</h3>
      <div className="grid grid-cols-5 gap-2">
        {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => (
          <Link key={level} href={`/workbooks?level=${level}`}>
            <div className="flex items-center justify-center rounded-lg border py-3 transition-colors hover:bg-accent">
              <LevelBadge level={level} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </BentoTile>
  );
}
```

- [ ] **Step 6: EmptyRoadmapTile 작성** (로그인 + 문제집 없음)

Create `src/components/home/EmptyRoadmapTile.tsx`:

```tsx
import Link from "next/link";
import { Map as MapIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyRoadmapTile() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MapIcon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">나의 로드맵을 시작하세요</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        풀었거나 풀고 있는 문제집을 추가하면 나만의 학습 로드맵이 자동으로 만들어집니다
      </p>
      <Link href="/workbooks">
        <Button className="mt-4 gap-2">
          <Plus className="h-4 w-4" />
          문제집 추가하기
        </Button>
      </Link>
    </div>
  );
}
```

- [ ] **Step 7: 타입/린트 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

Run: `npx eslint src/components/home/*.tsx`
Expected: 에러 없음.

- [ ] **Step 8: Commit**

```bash
git add src/components/home/HeroTile.tsx src/components/home/QuickRecommendTile.tsx src/components/home/GradeRoadmapTile.tsx src/components/home/PublisherLineupTile.tsx src/components/home/LevelShortcutTile.tsx src/components/home/EmptyRoadmapTile.tsx
git commit -m "feat(home): add logged-out and explore tiles"
```

---

## Task 5: 로그인 대시보드 타일 + 데이터 훅

**Files:**
- Create: `useMyRoadmapData.ts`, `GreetingStatsTile.tsx`, `ProgressTile.tsx`, `AddBookTile.tsx`, `MyRoadmapTile.tsx`, `NextStepsTile.tsx`, `MyBooksTile.tsx`

- [ ] **Step 1: useMyRoadmapData 훅 작성**

Create `src/components/home/useMyRoadmapData.ts`:

```ts
"use client";

import { useMemo } from "react";
import { useAuthContext } from "@/hooks/auth-context";
import { buildMyRoadmap } from "@/lib/transform";
import type { Workbook, WorkbookRelation } from "@/data/types";

export function useMyRoadmapData(
  workbooksById: Map<string, Workbook>,
  relations: WorkbookRelation[]
) {
  const { userWorkbooks } = useAuthContext();

  const built = useMemo(
    () => buildMyRoadmap(userWorkbooks, workbooksById, relations),
    [userWorkbooks, workbooksById, relations]
  );

  const stats = useMemo(() => {
    const completed = userWorkbooks.filter((uw) => uw.status === "completed").length;
    const total = userWorkbooks.length;
    return {
      completed,
      inProgress: userWorkbooks.filter((uw) => uw.status === "in_progress").length,
      planned: userWorkbooks.filter((uw) => uw.status === "planned").length,
      total,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [userWorkbooks]);

  return { ...built, stats, hasWorkbooks: userWorkbooks.length > 0 };
}
```

- [ ] **Step 2: GreetingStatsTile 작성**

Create `src/components/home/GreetingStatsTile.tsx`:

```tsx
import { CheckCircle, BookOpen } from "lucide-react";
import { BentoTile } from "./BentoTile";

interface GreetingStatsTileProps {
  displayName?: string;
  completed: number;
  inProgress: number;
  planned: number;
}

export function GreetingStatsTile({ displayName, completed, inProgress, planned }: GreetingStatsTileProps) {
  return (
    <BentoTile>
      <h2 className="text-lg font-bold">{displayName ? `${displayName}님의 로드맵` : "나의 로드맵"}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold">{completed}</span>
          <span className="text-muted-foreground">완료</span>
        </span>
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-semibold">{inProgress}</span>
          <span className="text-muted-foreground">진행중</span>
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="font-semibold text-foreground">{planned}</span>
          예정
        </span>
      </div>
    </BentoTile>
  );
}
```

- [ ] **Step 3: ProgressTile 작성**

Create `src/components/home/ProgressTile.tsx`:

```tsx
import { BentoTile } from "./BentoTile";
import { Progress } from "@/components/ui/progress";

export function ProgressTile({ pct }: { pct: number }) {
  return (
    <BentoTile>
      <p className="text-sm text-muted-foreground">달성률</p>
      <p className="mt-1 text-3xl font-extrabold">{pct}%</p>
      <Progress value={pct} className="mt-2 h-2" />
    </BentoTile>
  );
}
```

- [ ] **Step 4: AddBookTile 작성**

Create `src/components/home/AddBookTile.tsx`:

```tsx
import Link from "next/link";
import { Plus } from "lucide-react";

export function AddBookTile() {
  return (
    <Link href="/workbooks" className="h-full">
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-5 text-center transition-colors hover:border-primary hover:bg-accent">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Plus className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">문제집 추가</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: MyRoadmapTile 작성**

Create `src/components/home/MyRoadmapTile.tsx`:

```tsx
import { BentoTile } from "./BentoTile";
import { MyRoadmapFlow } from "@/components/roadmap/MyRoadmapFlow";
import type { Publisher } from "@/data/types";
import type { MyRoadmapNode, MyRoadmapEdge } from "@/lib/transform";

interface MyRoadmapTileProps {
  nodes: MyRoadmapNode[];
  edges: MyRoadmapEdge[];
  suggestedNext: Parameters<typeof MyRoadmapFlow>[0]["suggestedNext"];
  publishers: Publisher[];
}

export function MyRoadmapTile({ nodes, edges, suggestedNext, publishers }: MyRoadmapTileProps) {
  return (
    <BentoTile className="p-3">
      <MyRoadmapFlow
        myNodes={nodes}
        myEdges={edges}
        suggestedNext={suggestedNext.slice(0, 2)}
        publishers={publishers}
        height={Math.max(300, nodes.length * 60 + 100)}
      />
    </BentoTile>
  );
}
```

(주의: `MyRoadmapNode`/`MyRoadmapEdge`가 `src/lib/transform.ts`에서 export 되어 있어야 한다. 이미 export 되어 있으면 그대로 사용. 아니면 Step 6에서 처리.)

- [ ] **Step 6: transform 타입 export 확인/보강**

Run: `grep -n "export interface MyRoadmapNode\|export interface MyRoadmapEdge" src/lib/transform.ts`
Expected: 두 줄 모두 출력(이미 export 됨). 출력이 없으면 `src/lib/transform.ts`에서 해당 `interface` 앞에 `export`를 추가한다.

- [ ] **Step 7: NextStepsTile 작성**

Create `src/components/home/NextStepsTile.tsx`:

```tsx
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { BentoTile } from "./BentoTile";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { WorkbookCoverPlaceholder } from "@/components/workbook/WorkbookCoverPlaceholder";
import type { Workbook, DifficultyLevel } from "@/data/types";

interface NextStepsTileProps {
  suggestedNext: (Workbook & { reason: string })[];
  publisherName: (id: string) => string;
}

export function NextStepsTile({ suggestedNext, publisherName }: NextStepsTileProps) {
  return (
    <BentoTile>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Plus className="h-3.5 w-3.5" />
        다음에 풀면 좋은 문제집
      </h3>
      {suggestedNext.length === 0 ? (
        <p className="text-xs text-muted-foreground">문제집을 더 추가하면 추천이 표시됩니다.</p>
      ) : (
        <div className="space-y-2">
          {suggestedNext.slice(0, 3).map((s) => {
            const pubName = publisherName(s.publisherId);
            return (
              <Link key={s.id} href={`/workbooks/${s.id}`}>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-primary/40 p-2.5 transition-colors hover:bg-accent">
                  <WorkbookCoverPlaceholder
                    title={s.title}
                    publisher={pubName}
                    level={s.difficultyLevel as DifficultyLevel}
                    coverImageUrl={s.coverImageUrl}
                    className="h-13 w-10 text-[8px] opacity-70"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <LevelBadge level={s.difficultyLevel as DifficultyLevel} size="xs" showLabel={false} />
                      <span className="text-[10px] text-muted-foreground">{pubName}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-primary">{s.reason}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </BentoTile>
  );
}
```

- [ ] **Step 8: MyBooksTile 작성**

Create `src/components/home/MyBooksTile.tsx`:

```tsx
"use client";

import Link from "next/link";
import { BentoTile } from "./BentoTile";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { WorkbookCoverPlaceholder } from "@/components/workbook/WorkbookCoverPlaceholder";
import { StatusToggle } from "@/components/workbook/StatusToggle";
import { useAuthContext } from "@/hooks/auth-context";
import type { DifficultyLevel } from "@/data/types";
import type { MyRoadmapNode } from "@/lib/transform";

interface MyBooksTileProps {
  nodes: MyRoadmapNode[];
  publisherName: (id: string) => string;
}

export function MyBooksTile({ nodes, publisherName }: MyBooksTileProps) {
  const { updateWorkbookStatus, removeWorkbook } = useAuthContext();

  return (
    <BentoTile>
      <h3 className="mb-2 text-sm font-semibold">내 문제집</h3>
      <div className="space-y-2">
        {nodes.map((n) => {
          const pubName = publisherName(n.workbook.publisherId);
          return (
            <div key={n.workbook.id} className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-accent/50">
              <Link href={`/workbooks/${n.workbook.id}`} className="shrink-0">
                <WorkbookCoverPlaceholder
                  title={n.workbook.title}
                  publisher={pubName}
                  level={n.workbook.difficultyLevel as DifficultyLevel}
                  coverImageUrl={n.workbook.coverImageUrl}
                  className="h-13 w-10 text-[8px]"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/workbooks/${n.workbook.id}`}>
                  <p className="truncate text-sm font-medium hover:text-primary">{n.workbook.title}</p>
                </Link>
                <div className="mt-0.5 flex items-center gap-1">
                  <LevelBadge level={n.workbook.difficultyLevel as DifficultyLevel} size="xs" showLabel={false} />
                  <span className="text-[10px] text-muted-foreground">{pubName}</span>
                </div>
              </div>
              <StatusToggle
                status={n.status}
                onStatusChange={(s) => updateWorkbookStatus(n.workbook.id, s)}
                onRemove={() => removeWorkbook(n.workbook.id)}
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </BentoTile>
  );
}
```

- [ ] **Step 9: 타입/린트 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

Run: `npx eslint src/components/home/*.tsx src/components/home/*.ts`
Expected: 에러 없음.

- [ ] **Step 10: Commit**

```bash
git add src/components/home/useMyRoadmapData.ts src/components/home/GreetingStatsTile.tsx src/components/home/ProgressTile.tsx src/components/home/AddBookTile.tsx src/components/home/MyRoadmapTile.tsx src/components/home/NextStepsTile.tsx src/components/home/MyBooksTile.tsx src/lib/transform.ts
git commit -m "feat(home): add logged-in dashboard tiles and data hook"
```

---

## Task 6: HomeView 재작성 (오케스트레이터)

**Files:**
- Modify: `src/app/HomeView.tsx` (전체 교체)

- [ ] **Step 1: HomeView 전체 교체**

`src/app/HomeView.tsx` 전체를 아래로 교체:

```tsx
"use client";

import { useMemo } from "react";
import { useAuthContext } from "@/hooks/auth-context";
import { getHomeTiles, type HomeTileKey } from "@/components/home/homeTiles";
import { BentoGrid } from "@/components/home/BentoGrid";
import { HeroTile } from "@/components/home/HeroTile";
import { QuickRecommendTile } from "@/components/home/QuickRecommendTile";
import { GradeRoadmapTile } from "@/components/home/GradeRoadmapTile";
import { PublisherLineupTile } from "@/components/home/PublisherLineupTile";
import { LevelShortcutTile } from "@/components/home/LevelShortcutTile";
import { EmptyRoadmapTile } from "@/components/home/EmptyRoadmapTile";
import { GreetingStatsTile } from "@/components/home/GreetingStatsTile";
import { ProgressTile } from "@/components/home/ProgressTile";
import { AddBookTile } from "@/components/home/AddBookTile";
import { MyRoadmapTile } from "@/components/home/MyRoadmapTile";
import { NextStepsTile } from "@/components/home/NextStepsTile";
import { MyBooksTile } from "@/components/home/MyBooksTile";
import { useMyRoadmapData } from "@/components/home/useMyRoadmapData";
import type { Workbook, Publisher, WorkbookRelation, Roadmap } from "@/data/types";

export interface HomeViewProps {
  workbooks: Workbook[];
  publishers: Publisher[];
  relations: WorkbookRelation[];
  roadmaps: Roadmap[];
}

export function HomeView({ workbooks, publishers, relations, roadmaps }: HomeViewProps) {
  const { isLoggedIn, profile } = useAuthContext();

  const workbooksById = useMemo(
    () => new Map(workbooks.map((w) => [w.id, w])),
    [workbooks]
  );
  const publisherName = (id: string) => publishers.find((p) => p.id === id)?.name ?? "";

  const my = useMyRoadmapData(workbooksById, relations);

  const tiles = getHomeTiles({ isLoggedIn, hasWorkbooks: my.hasWorkbooks });

  const renderTile = (key: HomeTileKey) => {
    switch (key) {
      case "hero":
        return <HeroTile />;
      case "quickRecommend":
        return <QuickRecommendTile workbooks={workbooks} publishers={publishers} />;
      case "gradeRoadmap":
      case "recommendedRoadmap":
        return <GradeRoadmapTile roadmaps={roadmaps} />;
      case "publisherLineup":
        return <PublisherLineupTile roadmaps={roadmaps} />;
      case "levelShortcut":
        return <LevelShortcutTile />;
      case "emptyRoadmap":
        return <EmptyRoadmapTile />;
      case "greetingStats":
        return (
          <GreetingStatsTile
            displayName={profile?.displayName}
            completed={my.stats.completed}
            inProgress={my.stats.inProgress}
            planned={my.stats.planned}
          />
        );
      case "progress":
        return <ProgressTile pct={my.stats.pct} />;
      case "addBook":
        return <AddBookTile />;
      case "myRoadmap":
        return (
          <MyRoadmapTile
            nodes={my.nodes}
            edges={my.edges}
            suggestedNext={my.suggestedNext}
            publishers={publishers}
          />
        );
      case "nextSteps":
        return <NextStepsTile suggestedNext={my.suggestedNext} publisherName={publisherName} />;
      case "myBooks":
        return <MyBooksTile nodes={my.nodes} publisherName={publisherName} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <BentoGrid>
        {tiles.map((t) => (
          <div key={t.key} className={t.span}>
            {renderTile(t.key)}
          </div>
        ))}
      </BentoGrid>
    </div>
  );
}
```

- [ ] **Step 2: 타입/린트 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

Run: `npx eslint src/app/HomeView.tsx`
Expected: 에러 없음.

- [ ] **Step 3: 단위 테스트 전체 통과 확인**

Run: `npm test`
Expected: 전체 PASS.

- [ ] **Step 4: 수동 시각 확인 (로그아웃)**

Run: `npm run dev` 후 브라우저에서 `http://localhost:3000/` (로그아웃 상태) 확인.
Expected: 히어로(잉크 면 + 블루 CTA) + 빠른 추천 퀴즈 상단 2열, 등급/출판사 2열, 난이도 전폭. 320/768/1024/1440에서 오버플로우 없음, 모바일 1열.

- [ ] **Step 5: Commit**

```bash
git add src/app/HomeView.tsx
git commit -m "refactor(home): rebuild HomeView as bento orchestrator"
```

---

## Task 7: 전역 장식 보라/파랑 정리 (의미색 보존)

**규칙:** 파랑/보라가 **난이도(Lv)·등급 그룹** 의미면 **보존**. 단순 장식/브랜드 강조면 `primary`(시그널) 또는 중립으로 교체.

**Files:**
- Modify: `src/components/workbook/QuickRecommend.tsx`
- Modify: `src/components/roadmap/MyRoadmapFlow.tsx`
- Modify: `src/app/roadmap/RoadmapView.tsx`
- Modify: `src/app/dashboard/DashboardView.tsx`

- [ ] **Step 1: QuickRecommend 배경/강조 정리**

`src/components/workbook/QuickRecommend.tsx`에서 최상위 `<section>`의 장식 그라데이션 클래스를 중립 카드로 교체:

찾기:
```
className="rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border p-6 md:p-8"
```
교체:
```
className="rounded-2xl border bg-card p-6 md:p-8"
```

같은 파일에서 아이콘 배지·강조 텍스트의 보라(`bg-violet-100`, `text-violet-600`, `dark:bg-violet-900/50`, `dark:text-violet-400`, hover의 `hover:bg-violet-100`/`hover:border-violet-300` 등)를 시그널 토큰으로 교체: `bg-primary/10`, `text-primary`, hover는 `hover:bg-accent`/`hover:border-primary`. (난이도 `LevelBadge`/`BookTypeBadge` 호출은 그대로 둔다.)

- [ ] **Step 2: MyRoadmapFlow 추천 강조색 정리**

Run: `grep -n "violet\|indigo\|to-blue\|from-blue" src/components/roadmap/MyRoadmapFlow.tsx`
각 매치에 대해: "추천 다음 단계" 등 **장식/강조** 보라는 `primary`(시그널)로 교체(예: `border-violet-500` → `border-primary`, `text-violet-…` → `text-primary`, `bg-violet-50` → `bg-primary/5`). 노드 상태색이 **완료(emerald)/진행(blue=의미)/예정(slate)** 의미라면 보존.
판단 기준: 범례·상태 표시는 의미색(보존), "추천/다음 단계" 점선 강조는 시그널(교체).

- [ ] **Step 3: RoadmapView 설명 배지 정리**

Run: `grep -n "violet\|indigo" src/app/roadmap/RoadmapView.tsx`
설명 카드의 **장식** 보라(예: 끝 등급 배지 `bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300`)를 시그널로 교체: `bg-primary/10 text-primary`. **등급 그룹 칩(`roadmapGradeGroups`의 `borderColor` 인라인 스타일)은 의미색이므로 보존.**

- [ ] **Step 4: DashboardView 장식색 정리**

Run: `grep -n "violet\|indigo\|to-blue\|from-blue\|bg-blue\|text-blue" src/app/dashboard/DashboardView.tsx`
각 매치에 동일 규칙 적용(장식→`primary`/중립, 난이도·상태 의미색 보존).

- [ ] **Step 5: 의미색 보존 회귀 확인**

Run: `grep -rn "violet\|indigo" src/components/workbook/LevelBadge.tsx src/components/workbook/BookTypeBadge.tsx src/data/types.ts src/data/roadmaps.ts`
Expected: 이 파일들의 보라/파랑(난이도·등급 의미색)은 **변경되지 않은 채 그대로** 존재.

- [ ] **Step 6: 타입/린트/테스트**

Run: `npx tsc --noEmit && npx eslint src/components/workbook/QuickRecommend.tsx src/components/roadmap/MyRoadmapFlow.tsx src/app/roadmap/RoadmapView.tsx src/app/dashboard/DashboardView.tsx && npm test`
Expected: 모두 통과.

- [ ] **Step 7: Commit**

```bash
git add src/components/workbook/QuickRecommend.tsx src/components/roadmap/MyRoadmapFlow.tsx src/app/roadmap/RoadmapView.tsx src/app/dashboard/DashboardView.tsx
git commit -m "style: migrate decorative violet/blue to signal token (keep semantic colors)"
```

---

## Task 8: 최종 검증

**Files:** 없음(검증 전용)

- [ ] **Step 1: 빌드/타입/린트/테스트 일괄**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: 전부 통과. (`npm run lint`에 기존 `RoadmapView.tsx:469` set-state-in-effect 경고가 남아 있을 수 있음 — 본 작업과 무관, 별도 처리.)

- [ ] **Step 2: 수동 시각 검증 매트릭스**

`npm run dev` 후 아래 조합을 확인:
- 상태: 로그아웃 / 로그인(문제집 0개) / 로그인(문제집 ≥1)
- 폭: 320 / 768 / 1024 / 1440
- 테마: 라이트 / 다크

Expected: 오버플로우 없음, 타일 1열↔4열 전환 정상, CTA·링크가 시그널 블루, 난이도/등급 색 보존, 다크에서 대비 양호, Pretendard 적용(한글 글자체 변경 확인).

- [ ] **Step 3: 접근성 스폿 체크**

키보드 Tab으로 히어로 CTA → 타일 링크 → StatusToggle 포커스 이동 및 포커스 링(시그널) 가시성 확인. 브라우저 확대/`prefers-reduced-motion`에서 깨짐 없음.

- [ ] **Step 4: 최종 커밋(필요 시)**

남은 변경이 있으면:
```bash
git add -A
git commit -m "chore(home): final verification adjustments"
```

---

## 후속 과제(이 계획 범위 밖, 명시)
- **Playwright 비주얼 회귀 하니스 도입**: 레포에 현재 Playwright가 없고 로그인 상태가 auth-gated라 본 계획에서는 수동 시각 검증으로 대체함. 별도 계획으로 320/768/1024/1440 × 라이트/다크 × 상태 스크린샷 회귀를 구축 권장.
- **Pretendard self-host**: 현재 jsdelivr CDN import. 성능/안정성을 위해 woff2 self-host + preload로 전환 권장.
- `RoadmapView.tsx:469` set-state-in-effect 린트 정리(기존 이슈).
