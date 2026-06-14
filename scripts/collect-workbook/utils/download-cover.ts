import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { WorkbookDraft } from "../types";
import { fetchKyoboProduct } from "../parsers/kyobo";
import { fetchYes24Product } from "../parsers/yes24";
import { parsePurchaseUrl } from "./parse-purchase-url";

const COVERS_DIR = join(process.cwd(), "public/covers");

type CoverDownloadInput = {
  id: string;
  title: string;
  coverImageUrl?: string;
  purchaseUrlKyobo?: string;
  purchaseUrlYes24?: string;
};

export function coverFilenameFromPath(coverImageUrl: string): string {
  const name = coverImageUrl.replace(/^\/covers\//, "");
  if (!name || name.includes("..")) throw new Error(`Invalid cover path: ${coverImageUrl}`);
  return name;
}

export function resolveLocalCoverPath(filename: string): string {
  return join(COVERS_DIR, filename);
}

async function fetchRemoteCoverUrl(
  wb: Pick<CoverDownloadInput, "purchaseUrlKyobo" | "purchaseUrlYes24">
): Promise<string | undefined> {
  if (wb.purchaseUrlKyobo) {
    const { kyobo } = parsePurchaseUrl(wb.purchaseUrlKyobo);
    if (kyobo) {
      const meta = await fetchKyoboProduct(kyobo);
      if (meta.coverImageUrl) return meta.coverImageUrl;
    }
  }
  if (wb.purchaseUrlYes24) {
    const { yes24 } = parsePurchaseUrl(wb.purchaseUrlYes24);
    if (yes24) {
      const meta = await fetchYes24Product(yes24);
      if (meta.coverImageUrl) return meta.coverImageUrl;
    }
  }
  return undefined;
}

export async function downloadCoverToFile(
  remoteUrl: string,
  localPath: string
): Promise<void> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${remoteUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(join(localPath, ".."), { recursive: true });
  writeFileSync(localPath, buf);
}

export interface DownloadResult {
  id: string;
  title: string;
  filename: string;
  status: "ok" | "skipped" | "failed";
  message?: string;
}

export async function downloadCoverForWorkbook(
  wb: CoverDownloadInput
): Promise<DownloadResult> {
  if (!wb.coverImageUrl?.startsWith("/covers/")) {
    return { id: wb.id, title: wb.title, filename: "", status: "skipped", message: "no local cover path" };
  }
  const filename = coverFilenameFromPath(wb.coverImageUrl);
  const localPath = resolveLocalCoverPath(filename);
  if (existsSync(localPath)) {
    return { id: wb.id, title: wb.title, filename, status: "skipped", message: "already exists" };
  }
  try {
    const remote = await fetchRemoteCoverUrl(wb);
    if (!remote) throw new Error("no remote cover URL");
    await downloadCoverToFile(remote, localPath);
    return { id: wb.id, title: wb.title, filename, status: "ok" };
  } catch (e) {
    return {
      id: wb.id,
      title: wb.title,
      filename,
      status: "failed",
      message: (e as Error).message,
    };
  }
}

export async function downloadCoverForDraft(draft: WorkbookDraft): Promise<DownloadResult> {
  const remote =
    draft._meta?.sources.find((s) => s.coverImageUrl)?.coverImageUrl ||
    (draft.coverImageUrl?.startsWith("http") ? draft.coverImageUrl : undefined);

  if (!draft.coverImageUrl?.startsWith("/covers/")) {
    return { id: draft.id, title: draft.title, filename: "", status: "skipped", message: "no /covers/ path" };
  }
  const filename = coverFilenameFromPath(draft.coverImageUrl);
  const localPath = resolveLocalCoverPath(filename);
  if (!remote) {
    return { id: draft.id, title: draft.title, filename, status: "failed", message: "no remote URL in draft" };
  }
  try {
    await downloadCoverToFile(remote, localPath);
    return { id: draft.id, title: draft.title, filename, status: "ok" };
  } catch (e) {
    return { id: draft.id, title: draft.title, filename, status: "failed", message: (e as Error).message };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function downloadAllCovers(
  items: CoverDownloadInput[],
  delayMs = 1500
): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];
  for (const wb of items) {
    results.push(await downloadCoverForWorkbook(wb));
    await sleep(delayMs);
  }
  return results;
}
