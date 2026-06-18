"use client";

import Link from "next/link";
import { BentoTile } from "./BentoTile";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { WorkbookCoverPlaceholder } from "@/components/workbook/WorkbookCoverPlaceholder";
import { StatusToggle } from "@/components/workbook/StatusToggle";
import { useAuthContext } from "@/hooks/auth-context";
import type { DifficultyLevel } from "@/data/types";
import type { MyRoadmapNode } from "@/lib/transform";

interface MyBooksTileProps {
  nodes: MyRoadmapNode[];
  publisherName: (id: string) => string;
}

export function MyBooksTile({ nodes, publisherName }: MyBooksTileProps) {
  const { updateWorkbookStatus, removeWorkbook } = useAuthContext();

  return (
    <BentoTile>
      <h3 className="mb-2 text-sm font-semibold">내 문제집</h3>
      <div className="space-y-2">
        {nodes.map((n) => {
          const pubName = publisherName(n.workbook.publisherId);
          return (
            <div key={n.workbook.id} className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-accent/50">
              <Link href={`/workbooks/${n.workbook.id}`} className="shrink-0">
                <WorkbookCoverPlaceholder
                  title={n.workbook.title}
                  publisher={pubName}
                  level={n.workbook.difficultyLevel as DifficultyLevel}
                  coverImageUrl={n.workbook.coverImageUrl}
                  className="h-13 w-10 text-[8px]"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/workbooks/${n.workbook.id}`}>
                  <p className="truncate text-sm font-medium hover:text-primary">{n.workbook.title}</p>
                </Link>
                <div className="mt-0.5 flex items-center gap-1">
                  <LevelBadge level={n.workbook.difficultyLevel as DifficultyLevel} size="xs" showLabel={false} />
                  <span className="text-[10px] text-muted-foreground">{pubName}</span>
                </div>
              </div>
              <StatusToggle
                status={n.status}
                onStatusChange={(s) => updateWorkbookStatus(n.workbook.id, s)}
                onRemove={() => removeWorkbook(n.workbook.id)}
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </BentoTile>
  );
}
