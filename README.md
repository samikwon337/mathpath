# MathPath

고등학생 맞춤형 수학 문제집 가이드 웹 앱 (Next.js 16)

## 문서

전체 프로젝트 문서는 레포지토리 루트의 [`docs/`](../docs/README.md)를 참고하세요.

- [개발 가이드](../docs/development.md)
- [아키텍처](../docs/architecture.md)
- [PRD](../PRD.md)

## 빠른 시작

```bash
npm install
# .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 설정
npm run dev
```

http://localhost:3000

## 주요 명령

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 빌드 |
| `npm run collect` | 문제집 데이터 수집 CLI |
| `npm run seed` | `src/data/*` 카탈로그를 Supabase에 시딩 (멱등 upsert, `SUPABASE_SERVICE_ROLE_KEY` 필요) |

## 데이터 흐름

카탈로그(문제집·출판사·로드맵 등)는 `src/data/*.ts`를 편집 원본으로 두고 `npm run seed`로 Supabase에 반영하며, 페이지는 Server Component에서 DB로부터 읽습니다. 사용자 데이터(`user_workbooks`·`profiles`)는 로그인 세션으로 Supabase에 영구 저장됩니다.

## 기술 스택

Next.js 16 · React 19 · Tailwind CSS 4 · Supabase (Auth + DB) · @xyflow/react
