import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Workbook, DifficultyLevel } from "@/data/types";
import { getPublisherById } from "@/lib/api";
import { LevelBadge } from "./LevelBadge";
import { BookTypeBadge } from "./BookTypeBadge";
import { WorkbookCoverPlaceholder } from "./WorkbookCoverPlaceholder";

export function WorkbookCard({ workbook }: { workbook: Workbook }) {
  const publisher = getPublisherById(workbook.publisherId);

  return (
    <Link href={`/workbooks/${workbook.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
        <WorkbookCoverPlaceholder
          title={workbook.title}
          publisher={publisher?.name || ""}
          level={workbook.difficultyLevel as DifficultyLevel}
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
          {workbook.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{workbook.avgRating}</span>
              <span>({workbook.reviewCount})</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
