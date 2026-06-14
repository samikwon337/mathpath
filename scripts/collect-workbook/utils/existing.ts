import { readFileSync } from "fs";
import { join } from "path";

const WORKBOOKS_PATH = join(process.cwd(), "src/data/workbooks.ts");

export function loadExistingWorkbookIds(): Set<string> {
  const content = readFileSync(WORKBOOKS_PATH, "utf-8");
  const ids = new Set<string>();
  const pattern = /id:\s*"(wb-[^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

export function loadExistingWorkbookTitles(): Map<string, string> {
  const content = readFileSync(WORKBOOKS_PATH, "utf-8");
  const map = new Map<string, string>();
  const blocks = content.split(/\n  \{/);
  for (const block of blocks) {
    const idMatch = block.match(/id:\s*"(wb-[^"]+)"/);
    const titleMatch = block.match(/title:\s*"([^"]+)"/);
    if (idMatch && titleMatch) {
      map.set(idMatch[1], titleMatch[1]);
    }
  }
  return map;
}

export function isDuplicateTitle(title: string, existing: Map<string, string>): boolean {
  const normalized = title.trim().toLowerCase();
  for (const t of existing.values()) {
    if (t.trim().toLowerCase() === normalized) return true;
  }
  return false;
}
