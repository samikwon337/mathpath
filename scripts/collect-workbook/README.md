# 문제집 데이터 수집 스크립트

PRD 2.6 명세에 따라 교보문고·YES24·알라딘에서 문제집 메타데이터를 수집하고, `src/data/workbooks.ts` 시드 형식으로 변환합니다.

> 전체 문서: [`docs/data-collection.md`](../../../docs/data-collection.md)

## 설치

```bash
# mathpath 루트에서 (tsx는 devDependency로 포함)
npm install
```

## 환경변수 (선택)

`.env.local` 또는 셸에 설정:

```bash
ALADIN_TTB_KEY=your_aladin_ttb_key   # 알라딘 search/aladin 명령용
```

알라딘 TTB 키 발급: https://www.aladin.co.kr/ttb/wblog_manage.aspx

## 워크플로우

```
search → build/batch-build → (수동 보완) → validate → workbooks.ts → download-covers → validate-seed
```

1. **search** — 후보 교재 검색
2. **build / batch-build** — 메타 수집 → draft JSON
3. **수동 보완** — summary, pros, cons 등
4. **enrich / validate** — 품질 체크 + TS 스니펫
5. **workbooks.ts 반영**
6. **download-covers** — `public/covers/` 저장
7. **validate-seed** — 시드 전체 검증
8. **catalog-gap** — PRD 목표 대비 갭 확인

## 명령어

### 검색

```bash
npm run collect -- search "쎈 공통수학1"
npm run collect -- search "블랙라벨 미적분" --limit 5 --out scripts/collect-workbook/drafts/search.json
```

### 단일 소스 수집

```bash
npm run collect -- kyobo S000215651354
npm run collect -- yes24 123456789
npm run collect -- aladin 12345678
```

### 복합 빌드 (권장)

교보문고 + YES24를 합쳐 드래프트 JSON 생성:

```bash
npm run collect -- build \
  --kyobo S000215651354 \
  --yes24 123456789 \
  --book-type past_exam \
  --difficulty-level 2 \
  --subject-ids sub-common1 \
  --target-audience "중위권" \
  --out scripts/collect-workbook/drafts/wanja-gichul.json
```

### 드래프트 보완·TS 출력

`drafts/*.json`에서 `TODO` 필드를 직접 수정한 뒤:

```bash
npm run collect -- enrich scripts/collect-workbook/drafts/wanja-gichul.json \
  --emit-ts scripts/collect-workbook/drafts/wanja-gichul.ts
```

### 검증만

```bash
npm run collect -- validate scripts/collect-workbook/drafts/wanja-gichul.json
```

### 카탈로그 갭 리포트

```bash
npm run collect -- catalog-gap
```

PRD 출판사별 최소 수집 수, 과목별 권수, 로드맵 참조 누락을 출력합니다.

### 시드 전체 검증

```bash
npm run collect -- validate-seed
```

`workbooks.ts` 전 권에 대해 draft 검증 + 표지 파일 존재 여부를 확인합니다.

### 표지 다운로드

```bash
npm run collect -- download-covers --all
npm run collect -- download-covers scripts/collect-workbook/drafts/wanja-gichul.json
```

### 배치 빌드

`examples/manifest.example.json` 형식의 매니페스트로 여러 교재를 순차 수집:

```bash
npm run collect -- batch-build scripts/collect-workbook/drafts/manifest.json
```

### 테스트

```bash
npm run test:collect
```

## 수동 보완 필드

자동 수집 후 **반드시 사람이 작성**해야 하는 필드:

| 필드 | 설명 |
|------|------|
| `summary` | 카드용 한줄 요약 (50자 내외) |
| `description` | 상세 설명 2~4문장 |
| `pros` / `cons` | 리뷰 기반 장단점 각 2~5개 |
| `recommendedFor` | 추천 대상 |
| `bookType` | concept / type_basic / type_advanced / deep / past_exam |
| `difficultyLevel` | 1~5 |
| `subjectIds` | 과목 미감지 시 수동 지정 |
| `studyTips` | 학습 팁 (선택) |

## 출력 위치

- `scripts/collect-workbook/drafts/` — 수집 JSON·TS (gitignore 권장)

## 트러블슈팅

- **교보문고 빈 응답**: 네트워크/봇 차단 시 VPN 또는 알라딘 API 사용
- **출판사 매핑 실패**: `config.ts`의 `PUBLISHER_NAME_MAP`에 추가
- **구 교육과정 경고**: 수학I/수학II 등 구명칭 교재는 제외
