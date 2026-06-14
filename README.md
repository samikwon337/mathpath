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

## 기술 스택

Next.js 16 · React 19 · Tailwind CSS 4 · Supabase Auth · @xyflow/react
