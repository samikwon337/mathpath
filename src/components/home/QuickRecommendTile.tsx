import { QuickRecommend } from "@/components/workbook/QuickRecommend";
import type { Workbook, Publisher } from "@/data/types";

interface QuickRecommendTileProps {
  workbooks: Workbook[];
  publishers: Publisher[];
}

export function QuickRecommendTile({ workbooks, publishers }: QuickRecommendTileProps) {
  return <QuickRecommend workbooks={workbooks} publishers={publishers} />;
}
