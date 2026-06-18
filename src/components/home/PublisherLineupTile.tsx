import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BentoTile } from "./BentoTile";
import type { Roadmap } from "@/data/types";

export function PublisherLineupTile({ roadmaps }: { roadmaps: Roadmap[] }) {
  const publisherRoadmaps = roadmaps
    .filter((r) => r.type === "publisher")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <BentoTile>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">출판사별 라인업</h3>
        <Link href="/roadmap" className="flex items-center gap-1 text-sm text-primary hover:underline">
          전체 보기 <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {publisherRoadmaps.map((rm) => (
          <Link key={rm.id} href={`/roadmap?tab=${rm.id}`} className="shrink-0">
            <div className="w-40 rounded-lg border p-3 transition-colors hover:bg-accent">
              <h4 className="truncate text-sm font-semibold">{rm.name}</h4>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                {rm.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </BentoTile>
  );
}
