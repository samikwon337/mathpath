# 홈 화면 재구성 설계 (Bento × Ink & Signal)

- 날짜: 2026-06-18
- 대상: `/` (메인/홈) 화면 전면 재설계 + 앱 전역 비주얼 테마 교체
- 상태: 설계 확정 대기 (사용자 검토 중)

## 1. 배경 / 목표

현재 홈(`src/app/HomeView.tsx`, 442줄)은 히어로 → 추천 로드맵 → 빠른 추천 퀴즈 → 난이도별 바로가기를 세로로 나열한다. 사용자 피드백: "엉성해 보인다" — 비주얼 완성도와 정보 구조 **둘 다** 개선이 필요(전면 재설계).

목표:
- 의도적이고 완성도 높은 레이아웃(벤토)과 절제된 비주얼 시스템(잉크 & 시그널)으로 재구성한다.
- 로그아웃(설득·탐색)과 로그인(개인 로드맵 대시보드) 두 상태를 각각 잘 보여준다.
- 442줄 단일 파일을 작고 응집도 높은 타일 컴포넌트들로 분해한다.

비목표(Non-goals):
- 데이터 모델/카탈로그 변경 없음. `page.tsx`의 서버 데이터 패칭(`getCatalog`)은 그대로.
- 난이도(Lv.1~5) 의미색 체계 변경 없음.
- 홈 외 페이지의 **레이아웃** 재설계 없음(테마 토큰 변경의 파급은 받되, 구조는 유지).

## 2. 확정된 결정

| 항목 | 결정 |
|------|------|
| 레이아웃 | **벤토(Bento) 그리드**, 로그인 상태에 따라 타일 구성 분기 |
| 비주얼 | **Ink & Signal** — 무채색 베이스 + 시그널 블루 1색, 강한 타이포, 헤어라인 테두리, 플랫(그림자 최소) |
| 적용 범위 | **앱 전역 테마 교체** (토큰 레벨) |
| 폰트 | **Pretendard 도입** (self-host, `font-display: swap`) |
| CTA | **시그널 블루** (`--primary` = 시그널 블루, shadcn Button 전역 반영) |

## 3. 비주얼 시스템 (앱 전역 토큰)

현 shadcn 베이스는 이미 무채색(chroma 0)이다. 홈의 보라/파랑은 컴포넌트에 하드코딩된 유틸 클래스에서 온다. 따라서 변경은 ① 시그널 블루 도입 ② 장식용 보라/파랑 정리 ③ 타이포/폰트 강화.

### 3.1 색 토큰 (`src/app/globals.css`)
- `--primary` → 시그널 블루. 라이트 `#2563eb`(≈ `oklch(0.55 0.22 264)`), 다크 `#3b82f6`(≈ `oklch(0.62 0.19 256)`). `--primary-foreground` = 흰색.
- `--ring` → 시그널 블루 계열로 정렬(포커스 링 일관성).
- 배경/카드/뮤트/테두리 = 현 무채색 유지. 테두리는 헤어라인 그대로.
- 다크 모드 동일 원칙(베이스 무채색 + 밝은 시그널 블루).
- **난이도 팔레트(`DIFFICULTY_COLORS`, 에메랄드→주황)와 `LevelBadge`/`BookTypeBadge`는 변경 금지.**
- 등급 로드맵 그룹색(`roadmapGradeGroups`, 5등급 emerald … 최상위 orange)도 유지.

### 3.2 타이포
- **Pretendard** self-host(우선순위: `Pretendard Variable`), 폴백 `Geist`/system. `next/font/local` 또는 `@font-face` + `font-display: swap`. 임계 weight만 preload.
- 위계: 헤드라인 800/타이트 자간(`tracking-tight`), 섹션 라벨은 작은 대문자(`text-xs uppercase tracking-wide text-muted-foreground`).
- `@theme`의 `--font-sans`/`--font-heading`를 Pretendard 변수로 연결.

### 3.3 서피스/모션
- 라운드: 타일 `rounded-2xl`(현 `--radius` 토큰 스케일 활용), 칩 `rounded-full`.
- 그림자: 최소화. hover 시 미세 상승(`-translate-y-0.5`) + 테두리 강조 정도. compositor-friendly(`transform`/`opacity`)만.
- hover/focus/active 상태를 의도적으로 설계(키보드 포커스 링 = 시그널).

## 4. 컴포넌트 구조

`HomeView`를 상태별 타일 조합만 결정하는 얇은 오케스트레이터로 축소하고, 타일을 분해한다.

```
src/components/home/
  BentoGrid.tsx          // 그리드 래퍼 + 타일 span 유틸 (반응형 컬럼)
  BentoTile.tsx          // 공통 타일 셸(테두리/라운드/패딩/라벨 슬롯) — 선택적
  HeroTile.tsx           // (로그아웃) 헤드라인 + CTA(시그널 블루)
  QuickRecommendTile.tsx // 기존 QuickRecommend 래핑
  GradeRoadmapTile.tsx   // 5→4→3→2→1 미니 경로, /roadmap 링크
  PublisherLineupTile.tsx// 출판사 가로 스크롤
  LevelShortcutTile.tsx  // Lv.1~5 칩 한 줄
  StatsTile.tsx          // (로그인) 인사+완료/진행/예정 + 달성률
  MyRoadmapTile.tsx      // (로그인) 기존 MyRoadmapFlow 래핑
  NextStepsTile.tsx      // (로그인) 추천 다음 문제집
  MyBooksTile.tsx        // (로그인) 상태 토글 가능한 내 문제집 목록
  RecommendedRoadmapTile.tsx // (로그인) 등급별 추천 바로가기
```

- 각 타일: 입력은 props(이미 `page.tsx`가 패칭한 카탈로그/유저데이터), 자체 데이터 패칭 없음. 단일 책임.
- `HomeView`: `useAuthContext()`로 분기 → 로그아웃/로그인 타일 배열 구성 → `BentoGrid`에 배치.
- 기존 `QuickRecommend`, `MyRoadmapFlow`, `StatusToggle`, `LevelBadge`, `WorkbookCoverPlaceholder` 재사용.
- 파일은 200~400줄 이하 유지(코딩 스타일 준수).

## 5. 벤토 배치

데스크톱 4열 그리드 기준(span 표기는 4열 기준 열/행 점유).

### 5.1 로그아웃 (설득 + 탐색)
```
[ Hero            2×2 ] [ 빠른 추천 퀴즈   2×2 ]
[ 등급별 로드맵    2   ] [ 출판사별 라인업  2   ]
[ 난이도별 Lv.1~5            4(전폭)            ]
```

### 5.2 로그인 (개인 로드맵 대시보드)
```
[ 인사+통계 2 ] [ 달성률 1 ] [ + 문제집 추가 1 ]
[ 내 로드맵 플로우      3×2 ] [ 다음 단계   1×2 ]
[ 내 문제집        2  ] [ 빠른 추천 퀴즈    2  ]
[ 추천 로드맵      2  ] [ 난이도별 Lv.1~5   2  ]
```

## 6. 반응형
- 컬럼: 데스크톱 4 → 태블릿(`md`) 2 → 모바일 1.
- 타일 span은 브레이크포인트에서 축소: 2×2 → 모바일 전폭, 3×2 플로우 → 전폭.
- 가로 스크롤 타일(출판사)은 모바일에서도 스크롤 유지.
- 오버플로우 없음, 터치 타깃 충분.

## 7. 글로벌 스윕 (장식용 보라/파랑 → 잉크+시그널)
- `globals.css`: `--primary`/`--ring`을 시그널 블루로, (필요 시) `--signal` 별도 토큰 추가.
- 교체 대상(장식용): `HomeView.tsx`, `QuickRecommend.tsx`, `MyRoadmapFlow.tsx`(추천 강조), `RoadmapView.tsx`(설명 배지), `DashboardView.tsx`.
- **보존 대상(의미색)**: `LevelBadge.tsx`, `BookTypeBadge.tsx`, `DIFFICULTY_COLORS`(`types.ts`), `roadmapGradeGroups`(등급 그룹색), `StatusToggle`/`WorkbookCoverPlaceholder`의 레벨 연동색.
- 원칙: "이 파랑/보라가 난이도·등급 의미인가? → 유지. 단순 장식/브랜드 강조인가? → 시그널/잉크로."

## 8. 접근성
- 시그널 블루 위 흰색 텍스트, 잉크 위 텍스트 모두 WCAG AA 대비 충족 확인.
- 포커스 링(시그널) 가시성, 키보드 내비게이션(타일 링크/버튼), `prefers-reduced-motion` 존중.

## 9. 테스트
- **Playwright 비주얼 회귀**가 1차 신호: 320/768/1024/1440 × (라이트/다크) × (로그아웃/로그인) 스크린샷.
- 기존 단위 테스트(`npm test`) 그린 유지.
- 색대비 자동 점검 + 키보드/포커스 수동 확인.
- 타입체크/ESLint 클린.

## 10. 리스크 / 메모
- `--primary`를 블루로 바꾸면 앱 전역 Primary 버튼이 블루가 된다(의도된 변경). 회귀 스크린샷으로 타 페이지 영향 확인.
- Pretendard 추가는 폰트 로딩 비용 발생 → self-host + swap + 임계 weight preload로 완화.
- 장식/의미색 경계가 모호한 곳은 위 원칙으로 판단하고 PR에서 재확인.
