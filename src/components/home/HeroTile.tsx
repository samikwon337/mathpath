import Link from "next/link";
import { Target, LogIn, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroTile() {
  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border bg-foreground p-8 text-background">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-background/20 px-3 py-1 text-xs text-background/80">
          <Target className="h-3 w-3" />
          2022 개정 교육과정 기준
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          나만의 수학 로드맵
        </h1>
        <p className="mt-3 max-w-md text-sm text-background/70">
          풀어온 문제집을 등록하면 학습 경로가 자동으로 시각화되고, 다음에 풀면 좋은 문제집을 추천받습니다.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/login">
          <Button size="lg" className="gap-2">
            <LogIn className="h-4 w-4" />
            로그인하고 시작하기
          </Button>
        </Link>
        <Link href="/workbooks">
          <Button
            size="lg"
            variant="outline"
            className="gap-2 border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
          >
            <BookOpen className="h-4 w-4" />
            문제집 둘러보기
          </Button>
        </Link>
      </div>
    </div>
  );
}
