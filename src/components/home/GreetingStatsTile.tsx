import Link from "next/link";
import { CheckCircle, BookOpen, ChevronRight } from "lucide-react";
import { BentoTile } from "./BentoTile";

interface GreetingStatsTileProps {
  displayName?: string;
  completed: number;
  inProgress: number;
  planned: number;
}

export function GreetingStatsTile({ displayName, completed, inProgress, planned }: GreetingStatsTileProps) {
  return (
    <BentoTile>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{displayName ? `${displayName}님의 로드맵` : "나의 로드맵"}</h2>
        <Link
          href="/dashboard/workbooks"
          className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground hover:text-primary"
        >
          내 문제집 관리 <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold">{completed}</span>
          <span className="text-muted-foreground">완료</span>
        </span>
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-semibold">{inProgress}</span>
          <span className="text-muted-foreground">진행중</span>
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="font-semibold text-foreground">{planned}</span>
          예정
        </span>
      </div>
    </BentoTile>
  );
}
