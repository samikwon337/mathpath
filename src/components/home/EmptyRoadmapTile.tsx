import Link from "next/link";
import { Map as MapIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyRoadmapTile() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MapIcon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">나의 로드맵을 시작하세요</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        풀었거나 풀고 있는 문제집을 추가하면 나만의 학습 로드맵이 자동으로 만들어집니다
      </p>
      <Link href="/workbooks">
        <Button className="mt-4 gap-2">
          <Plus className="h-4 w-4" />
          문제집 추가하기
        </Button>
      </Link>
    </div>
  );
}
