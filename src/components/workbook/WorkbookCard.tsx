import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Workbook, DifficultyLevel } from "@/data/types";
import { getPublisherById } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LevelBadge } from "./LevelBadge";
import { BookTypeBadge } from "./BookTypeBadge";
import { WorkbookCoverPlaceholder } from "./WorkbookCoverPlaceholder";

interface WorkbookCardProps {
  workbook: Workbook;
  onCompareToggle?: (workbookId: string) => void;
  isCompared?: boolean;
}

export function WorkbookCard({
  workbook,
  onCompareToggle,
  isCompared,
}: WorkbookCardProps) {
  const publisher = getPublisherById(workbook.publisherId);

  return (
    <Link href={`/workbooks/${workbook.id}`}>
      <Card
        className={cn(
          "group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 relative",
          isCompared && "ring-2 ring-primary"
        )}
      >
        {onCompareToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCompareToggle(workbook.id);
            }}
            aria-label={isCompared ? "비교에서 제거" : "비교에 추가"}
            className={cn(
              "absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
              isCompared
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40 bg-background/80 hover:border-primary"
            )}
          >
            {isCompared && <Check className="h-3.5 w-3.5" />}
          </button>
        )}
        <WorkbookCoverPlaceholder
          title={workbook.title}
          publisher={publisher?.name || ""}
          level={workbook.difficultyLevel as DifficultyLevel}
          coverImageUrl={workbook.coverImageUrl}
          className="aspect-[3/4]"
        />
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <LevelBadge level={workbook.difficultyLevel as DifficultyLevel} size="xs" showLabel={false} />
            <BookTypeBadge bookType={workbook.bookType} />
          </div>
          <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
            {workbook.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {publisher?.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {workbook.summary}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
