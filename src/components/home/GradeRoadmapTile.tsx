import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BentoTile } from "./BentoTile";
import type { Roadmap } from "@/data/types";

export function GradeRoadmapTile({ roadmaps }: { roadmaps: Roadmap[] }) {
  const grade = roadmaps
    .filter((r) => r.type === "grade")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <BentoTile>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">등급별 로드맵</h3>
        <Link href="/roadmap" className="flex items-center gap-1 text-sm text-primary hover:underline">
          전체 보기 <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="space-y-1.5">
        {grade.slice(0, 5).map((rm) => (
          <li key={rm.id}>
            <Link
              href={`/roadmap?tab=${rm.id}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <span className="font-medium">{rm.name}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </BentoTile>
  );
}
