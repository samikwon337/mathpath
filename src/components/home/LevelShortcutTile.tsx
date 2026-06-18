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
