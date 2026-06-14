#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fetchAladinProduct, searchAladin } from "./parsers/aladin";
import { fetchKyoboProduct, parseKyoboId, searchKyobo } from "./parsers/kyobo";
import { fetchYes24Product, parseYes24Id, searchYes24 } from "./parsers/yes24";
import type { MergeOverrides } from "./utils/merge-draft";
import { mergeToDraft } from "./utils/merge-draft";
import { formatWorkbookTs } from "./utils/format-ts";
import { validateDraft, printValidation } from "./utils/validate";
import {
  isDuplicateTitle,
  loadExistingWorkbookIds,
  loadExistingWorkbookTitles,
} from "./utils/existing";
import { workbooks } from "../../src/data/workbooks";
import { roadmapSteps } from "../../src/data/roadmaps";
import { subjects } from "../../src/data/subjects";
import { PUBLISHER_MIN_COUNTS } from "./config";
import { analyzeCatalogGap, printCatalogGapReport } from "./utils/catalog-gap";
import {
  downloadAllCovers,
  downloadCoverForDraft,
} from "./utils/download-cover";
import type { SearchResultItem, StoreMetadata, WorkbookDraft } from "./types";

const DRAFTS_DIR = join(process.cwd(), "scripts/collect-workbook/drafts");

function usage(): void {
  console.log(`
MathPath 문제집 데이터 수집 CLI

사용법:
  npm run collect -- search <키워드> [--limit N] [--out 파일.json]
  npm run collect -- kyobo <S코드|URL> [--out 파일.json]
  npm run collect -- yes24 <상품번호|URL> [--out 파일.json]
  npm run collect -- aladin <itemId> [--out 파일.json]   # ALADIN_TTB_KEY 필요
  npm run collect -- build [--kyobo ID] [--yes24 ID] [--aladin ID] [--out draft.json]
  npm run collect -- enrich <draft.json> [--emit-ts 파일.ts]
  npm run collect -- validate <draft.json>
  npm run collect -- catalog-gap
  npm run collect -- download-covers --all
  npm run collect -- download-covers <draft.json>

예시:
  npm run collect -- search "완자 기출픽 공통수학1"
  npm run collect -- kyobo S000215651354
  npm run collect -- build --kyobo S000215651354 --yes24 1234567 --out drafts/wanja.json
  npm run collect -- enrich drafts/wanja.json --emit-ts drafts/wanja.ts
  npm run collect -- download-covers --all
  npm run collect -- download-covers scripts/collect-workbook/drafts/foo.json

환경변수:
  ALADIN_TTB_KEY  알라딘 Open API 키 (선택, search/aladin 명령용)
`);
}

function parseArgs(argv: string[]) {
  const args = [...argv];
  const command = args.shift() || "help";
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  while (args.length > 0) {
    const arg = args[0];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        args.splice(0, 2);
      } else {
        flags[key] = "true";
        args.shift();
      }
    } else {
      positional.push(args.shift()!);
    }
  }

  return { command, flags, positional };
}

function ensureDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function writeJson(path: string, data: unknown) {
  ensureDir(path);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`저장: ${path}`);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function printSearchResults(results: SearchResultItem[]) {
  if (!results.length) {
    console.log("검색 결과가 없습니다.");
    return;
  }
  results.forEach((item, i) => {
    console.log(
      `${i + 1}. [${item.source}] ${item.title}` +
        (item.publisherName ? ` (${item.publisherName})` : "") +
        `\n   ID: ${item.sourceId}\n   URL: ${item.url}`
    );
  });
}

async function cmdSearch(keyword: string, limit: number, out?: string) {
  console.log(`검색: "${keyword}"\n`);

  const results: SearchResultItem[] = [];

  try {
    const kyobo = await searchKyobo(keyword, limit);
    results.push(...kyobo);
    console.log(`교보문고: ${kyobo.length}건`);
  } catch (e) {
    console.warn(`교보문고 검색 실패: ${(e as Error).message}`);
  }

  try {
    const yes24 = await searchYes24(keyword, limit);
    results.push(...yes24);
    console.log(`YES24: ${yes24.length}건`);
  } catch (e) {
    console.warn(`YES24 검색 실패: ${(e as Error).message}`);
  }

  if (process.env.ALADIN_TTB_KEY) {
    try {
      const aladin = await searchAladin(keyword, limit);
      results.push(...aladin);
      console.log(`알라딘: ${aladin.length}건`);
    } catch (e) {
      console.warn(`알라딘 검색 실패: ${(e as Error).message}`);
    }
  }

  console.log("");
  printSearchResults(results.slice(0, limit));

  const outputPath = out || join(DRAFTS_DIR, `search-${Date.now()}.json`);
  writeJson(outputPath, { keyword, results: results.slice(0, limit) });
}

async function cmdKyobo(input: string, out?: string) {
  const id = parseKyoboId(input);
  console.log(`교보문고 수집: ${id}`);
  const meta = await fetchKyoboProduct(id);
  const path = out || join(DRAFTS_DIR, `kyobo-${id}.json`);
  writeJson(path, meta);
  console.log(JSON.stringify(meta, null, 2));
}

async function cmdYes24(input: string, out?: string) {
  const id = parseYes24Id(input);
  console.log(`YES24 수집: ${id}`);
  const meta = await fetchYes24Product(id);
  const path = out || join(DRAFTS_DIR, `yes24-${id}.json`);
  writeJson(path, meta);
  console.log(JSON.stringify(meta, null, 2));
}

async function cmdAladin(itemId: string, out?: string) {
  console.log(`알라딘 수집: ${itemId}`);
  const meta = await fetchAladinProduct(itemId);
  const path = out || join(DRAFTS_DIR, `aladin-${itemId}.json`);
  writeJson(path, meta);
  console.log(JSON.stringify(meta, null, 2));
}

async function cmdBuild(flags: Record<string, string>, out?: string) {
  const sources: StoreMetadata[] = [];

  if (flags.kyobo) {
    const id = parseKyoboId(flags.kyobo);
    console.log(`  + 교보문고 ${id}`);
    sources.push(await fetchKyoboProduct(id));
  }
  if (flags.yes24) {
    const id = parseYes24Id(flags.yes24);
    console.log(`  + YES24 ${id}`);
    sources.push(await fetchYes24Product(id));
  }
  if (flags.aladin) {
    console.log(`  + 알라딘 ${flags.aladin}`);
    sources.push(await fetchAladinProduct(flags.aladin));
  }

  if (!sources.length) {
    throw new Error("최소 하나의 소스가 필요합니다: --kyobo, --yes24, --aladin");
  }

  const overrides = parseOverrides(flags);
  const draft = mergeToDraft(sources, overrides);
  const path = out || join(DRAFTS_DIR, `draft-${draft.id}.json`);

  writeJson(path, draft);

  if (draft._meta?.warnings.length) {
    console.log("\n경고:");
    draft._meta.warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  console.log("\n다음 단계: summary, pros, cons, bookType, difficultyLevel 등을 수정한 뒤");
  console.log(`  npm run collect -- enrich ${path} --emit-ts drafts/${draft.id}.ts`);
}

function parseOverrides(flags: Record<string, string>): MergeOverrides {
  const overrides: MergeOverrides = {};

  if (flags.id) overrides.id = flags.id;
  if (flags.title) overrides.title = flags.title;
  if (flags["publisher-id"]) overrides.publisherId = flags["publisher-id"];
  if (flags["book-type"]) overrides.bookType = flags["book-type"] as MergeOverrides["bookType"];
  if (flags["difficulty-level"]) {
    overrides.difficultyLevel = Number(flags["difficulty-level"]) as MergeOverrides["difficultyLevel"];
  }
  if (flags.summary) overrides.summary = flags.summary;
  if (flags.description) overrides.description = flags.description;
  if (flags["target-audience"]) overrides.targetAudience = flags["target-audience"];
  if (flags["recommended-for"]) overrides.recommendedFor = flags["recommended-for"];
  if (flags["subject-ids"]) {
    overrides.subjectIds = flags["subject-ids"].split(",").map((s) => s.trim());
  }
  if (flags.pros) overrides.pros = flags.pros.split("|").map((s) => s.trim());
  if (flags.cons) overrides.cons = flags.cons.split("|").map((s) => s.trim());
  if (flags.tags) overrides.tags = flags.tags.split(",").map((s) => s.trim());

  return overrides;
}

function cmdEnrich(draftPath: string, emitTs?: string) {
  const draft = readJson<WorkbookDraft>(draftPath);
  const existingIds = loadExistingWorkbookIds();
  const existingTitles = loadExistingWorkbookTitles();

  console.log(`드래프트: ${draft.title} (${draft.id})\n`);

  if (existingIds.has(draft.id)) {
    console.warn(`  [WARN] ID '${draft.id}' 가 workbooks.ts에 이미 존재합니다.`);
  }
  if (isDuplicateTitle(draft.title, existingTitles)) {
    console.warn(`  [WARN] 동일 제목의 문제집이 이미 있을 수 있습니다.`);
  }

  if (draft._meta?.warnings?.length) {
    console.log("수집 경고:");
    draft._meta.warnings.forEach((w) => console.warn(`  - ${w}`));
    console.log("");
  }

  console.log("검증:");
  const ok = printValidation(validateDraft(draft));

  const ts = formatWorkbookTs(draft);
  console.log("\n--- workbooks.ts 붙여넣기용 ---\n");
  console.log(ts);

  if (emitTs) {
    ensureDir(emitTs);
    writeFileSync(
      emitTs,
      `// ${draft.title} — workbooks.ts에 복사하세요\n// 생성: ${new Date().toISOString()}\n\n${ts}\n`,
      "utf-8"
    );
    console.log(`\nTS 파일 저장: ${emitTs}`);
  }

  if (!ok) {
    console.log("\nTODO 필드를 채운 뒤 다시 validate 하세요.");
    process.exitCode = 1;
  }
}

function cmdValidate(draftPath: string) {
  const draft = readJson<WorkbookDraft>(draftPath);
  console.log(`검증: ${draft.title}\n`);
  const ok = printValidation(validateDraft(draft));
  if (!ok) process.exitCode = 1;
}

function cmdCatalogGap() {
  const subjectNames = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const roadmapWorkbookIds = roadmapSteps.map((s) => s.workbookId);
  const report = analyzeCatalogGap({
    workbooks: workbooks.filter((w) => w.isActive),
    roadmapWorkbookIds,
    publisherMinCounts: PUBLISHER_MIN_COUNTS,
    subjectNames,
  });
  process.exitCode = printCatalogGapReport(report);
}

function printDownloadResults(results: Awaited<ReturnType<typeof downloadAllCovers>>) {
  let failed = 0;
  for (const r of results) {
    const icon = r.status === "ok" ? "✓" : r.status === "skipped" ? "-" : "✗";
    console.log(`${icon} ${r.id} (${r.title})${r.message ? `: ${r.message}` : ""}`);
    if (r.status === "failed") failed++;
  }
  if (failed) process.exitCode = 1;
}

async function cmdDownloadCovers(flags: Record<string, string>, draftPath?: string) {
  if (flags.all) {
    const active = workbooks.filter((w) => w.isActive);
    console.log(`표지 다운로드: ${active.length}권\n`);
    const results = await downloadAllCovers(active);
    printDownloadResults(results);
    return;
  }
  if (draftPath) {
    const draft = readJson<WorkbookDraft>(draftPath);
    const result = await downloadCoverForDraft(draft);
    printDownloadResults([result]);
    return;
  }
  throw new Error("--all 또는 draft.json 경로가 필요합니다");
}

async function main() {
  const { command, flags, positional } = parseArgs(process.argv.slice(2));

  try {
    switch (command) {
      case "search":
        await cmdSearch(positional[0], Number(flags.limit || 10), flags.out);
        break;
      case "kyobo":
        await cmdKyobo(positional[0], flags.out);
        break;
      case "yes24":
        await cmdYes24(positional[0], flags.out);
        break;
      case "aladin":
        await cmdAladin(positional[0], flags.out);
        break;
      case "build":
        await cmdBuild(flags, flags.out);
        break;
      case "enrich":
        cmdEnrich(positional[0], flags["emit-ts"]);
        break;
      case "validate":
        cmdValidate(positional[0]);
        break;
      case "catalog-gap":
        cmdCatalogGap();
        break;
      case "download-covers":
        await cmdDownloadCovers(flags, positional[0]);
        break;
      case "help":
      default:
        usage();
        break;
    }
  } catch (error) {
    console.error(`\n오류: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}

main();
