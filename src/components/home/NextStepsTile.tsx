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
