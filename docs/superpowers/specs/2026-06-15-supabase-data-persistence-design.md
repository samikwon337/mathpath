# 카탈로그·사용자 데이터 Supabase 전면 연동 — 설계

- 날짜: 2026-06-15
- 상태: 설계 승인 대기 → 구현 계획(writing-plans)으로 전환 예정
- 범위: P0(데이터 영구 저장) + 카탈로그 전면 DB화

## 1. 배경 / 문제

현재 MathPath는 다음 상태다.

- 인증은 Supabase Auth(구글 OAuth)로 동작하지만, 사용자가 추가한 문제집·진행상황(`userWorkbooks`)이 **React state에만 존재**한다. `src/hooks/use-auth.ts`는 로그인 시 세션의 auth 메타데이터만 읽고 `userWorkbooks`는 `useState([])`로 시작하며, `updateWorkbookStatus`/`removeWorkbook`도 메모리 state만 변경한다.
- **결과: 새로고침/재로그인하면 "나의 로드맵"·진행상황·대시보드가 전부 초기화된다.** 앱의 핵심 가치가 영구적이지 않다.
- 카탈로그(문제집·출판사·과목·관계·로드맵·유튜브 링크)는 정적 `src/data/*.ts`에서 동기 함수(`src/lib/api.ts`)로 읽는다.
- `supabase/schema.sql`에는 `user_workbooks`, `profiles`, `workbook_reviews`, `review_likes`까지 RLS·트리거·생성 컬럼과 함께 완성돼 있으나 앱이 사용자 데이터에 대해 이를 전혀 사용하지 않는다.

## 2. 목표 / 비목표

### 목표
- 모든 데이터(카탈로그 + 사용자 데이터)의 **단일 출처를 Supabase로** 통일하고, 사용자 데이터를 **영구 저장**한다.
- 카탈로그는 **Server Component**에서 조회·렌더한다(Next 16 정석, 성능·SEO).
- 카탈로그 편집 원본은 `src/data/*.ts`로 유지하고 **시드 스크립트**로 DB에 반영한다.

### 비목표 (이번 범위 제외)
- 인증의 SSR(쿠키 기반) 전환. 인증은 현행 클라이언트 세션을 유지한다.
- 리뷰/평점 UI, 개인화 온보딩 UI(별도 P1 작업). 단, 본 작업에서 `profiles` read/write 배선은 포함.
- 어드민/편집 UI.

## 3. 핵심 결정

### (a) 사용자 데이터는 클라이언트에서 fetch/렌더
- 데이터 저장소는 Supabase(서버)다. "클라이언트"는 **fetch·렌더 위치**만을 뜻한다.
- 서버 컴포넌트가 사용자별 데이터를 렌더하려면 서버가 세션 주체를 알아야 하고, 이는 쿠키 기반 SSR 인증(`@supabase/ssr` + 미들웨어)으로의 전환을 요구한다. 그 마이그레이션 위험을 피하기 위해 사용자 데이터는 브라우저 Supabase 클라이언트로 읽고 쓰며 클라이언트 아일랜드에서 렌더한다.
- 향후 옵션: 필요 시 인증 SSR 전환으로 사용자 데이터도 서버 렌더로 이행 가능.

### (b) 카탈로그 ID를 TEXT로 변경
- `src/data`는 슬러그 ID를 쓴다(`pub-shinsago`, `wb-ssen`, `sub-common1`). URL도 슬러그를 쓴다(`/workbooks/wb-ssen`).
- `schema.sql`은 카탈로그 PK/FK를 모두 `UUID`로 선언했다 → 충돌.
- 해결: 카탈로그 테이블의 PK/FK를 `UUID` → `TEXT`로 변경(슬러그 유지, URL 불변). 시딩이 단순 upsert가 되고 URL이 바뀌지 않는다.
- `profiles.id`는 `auth.users` UUID 유지, `user_workbooks.id`도 UUID 유지. `user_workbooks.workbook_id`, `workbook_reviews.workbook_id` 등 카탈로그 참조 FK는 `TEXT`로 변경.

## 4. 아키텍처

### 서버/클라이언트 경계
- **카탈로그(공개 읽기) → Server Component.** 인증 불필요 → 서버에서 anon key로 조회. 새 의존성 불필요(`@supabase/supabase-js`를 서버에서 사용).
- **사용자 데이터(개인·상호작용) → Client island.** 브라우저 Supabase 클라이언트로 읽기/쓰기, 낙관적 업데이트 + 롤백.

### 모듈 구성 (현재 `api.ts`가 카탈로그 조회 + 순수 변환을 혼재 → 분리)
```
src/lib/supabase-server.ts   # 서버용 클라이언트 (anon key, 공개 읽기)
src/lib/supabase.ts          # (기존) 브라우저 클라이언트 — 인증·사용자 데이터
src/lib/db/catalog.ts        # async 서버 카탈로그 조회: getWorkbooks/getWorkbookById/
                             #   getPublishers/getSubjects/getWorkbookRelations/
                             #   getRoadmaps/getRoadmapSteps/getYoutubeLinks...
src/lib/db/user-data.ts      # 클라이언트 user_workbooks/profiles CRUD
src/lib/transform.ts         # 순수 함수: buildMyRoadmap, 관계 enrich, roadmap-timeline
```
- 순수 변환(`transform.ts`)은 입력 데이터를 받아 가공하며 서버/클라이언트 어디서나 호출 가능. 기존 `roadmap-timeline.ts`와 그 테스트는 이 계층으로 정리.

### 페이지 전환 패턴 — 서버 셸이 데이터를 fetch → 클라이언트 아일랜드로 props 전달
- `app/workbooks/[id]/page.tsx`: async 서버 컴포넌트가 문제집·출판사·관계·유튜브·동일출판사 책을 조회해 정적 부분을 서버 렌더. 상호작용(`StatusToggle`)만 `<WorkbookStatusControl>` 클라이언트 아일랜드로 분리. (현재 `use(params)` → 서버에선 `await params`.) 없는 id는 `notFound()`.
- `app/workbooks/page.tsx`: 서버에서 카탈로그+필터 조회. 필터/검색은 URL searchParams 기반.
- `app/page.tsx`(홈)·`app/dashboard/*`: 카탈로그 부분(추천 로드맵, 난이도 링크 등)은 서버에서 데이터 주입. `MyRoadmapSection`·대시보드 통계 등 사용자 데이터 의존부는 클라이언트 아일랜드 유지.

> **Next 16 주의**: `AGENTS.md` 지침대로, 구현 전 `node_modules/next/dist/docs/`에서 async `params`/`searchParams`, 캐싱(`fetch` 옵션, `cache()`), route segment 설정 규약을 확인한다.

## 5. 스키마 정합 + 시딩

- **스키마 마이그레이션**: 카탈로그 테이블 PK/FK `UUID` → `TEXT`. 참조하는 사용자 테이블 FK도 `TEXT`. 마이그레이션 SQL을 `supabase/`에 추가.
- **시드 스크립트**: `collect` 파이프라인에 명령 추가(`scripts/collect-workbook/`). `src/data/*.ts`를 읽어 Supabase에 **멱등 upsert**. 기존 수작업 `supabase/seed.sql`(부분·stale)을 이 생성형 시드로 대체.
- **검증**: 시드 후 행 수·FK 무결성 체크(기존 `validate-seed` 확장).

## 6. 사용자 데이터 영구 저장

- 로그인 시 `useAuth`가 `user_workbooks`를 Supabase에서 로드(현재 빈 배열 시작 버그 수정).
- `updateWorkbookStatus`/`removeWorkbook`: **낙관적 업데이트** — 즉시 로컬 state 반영 → Supabase upsert/delete → 실패 시 스냅샷으로 롤백 + 에러 피드백.
- `profiles`: 로그인 후 프로필 행 로드(학년·수준·목표). 가입 시 트리거가 자동 생성하므로 read 위주. (온보딩 UI는 별도 작업.)

## 7. 단계(Phase) — 위험 관리

1. **기반**: 스키마 마이그레이션(TEXT id) + 시드 스크립트 + 서버 Supabase 클라이언트. (앱 동작 변화 없음, DB만 채움)
2. **카탈로그 읽기 전환**: `db/catalog.ts` 작성 → 상세·목록·홈 카탈로그 부분을 Server Component로. 정적 `src/data` import 제거(원본 파일은 시드용으로 유지). `api.ts`는 `db/catalog.ts` + `transform.ts`로 분해.
3. **사용자 데이터 영구화**: `useAuth` ↔ Supabase 연결, 낙관적 업데이트, 로딩/에러 상태.
4. **정리**: 로딩/에러/`notFound` UI, 데이터 계층 테스트.

각 단계는 독립적으로 동작/배포 가능해야 한다.

## 8. 테스트 · 에러 처리

- 순수 변환(`transform.ts`)·시드 매핑: 유닛 테스트(`tsx --test`, 기존 패턴).
- 사용자 CRUD: 통합 테스트(테스트 Supabase 프로젝트 또는 로컬 Supabase).
- 모든 비동기 경계에 로딩/에러 UI. 카탈로그 누락 시 `notFound()`. 사용자 데이터 변경 실패 시 롤백 + 사용자 메시지.
- 커버리지 목표 80%(공통 testing 규칙).

## 9. 리스크

- **인증 세션과 클라이언트 fetch 타이밍**: 로그인 직후 `user_workbooks` 로드 경합 → `onAuthStateChange`에서 명시적 로드.
- **ID 타입 변경 파급**: 마이그레이션 시 기존 데이터/FK 영향 — 신규 프로젝트면 재생성, 기존 데이터 있으면 변환 스크립트 필요.
- **두 출처 동기화**: `src/data`와 DB는 시드로만 동기화 — 시드 미실행 시 불일치. CI/배포에 시드 단계 포함 고려.
- **Next 16 규약 차이**: 학습데이터와 다를 수 있어 공식 docs 확인 필수.
