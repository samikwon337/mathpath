import { cn } from "@/lib/utils";

interface BentoTileProps {
  className?: string;
  children: React.ReactNode;
}

/** 잉크&시그널 공통 타일 셸: 헤어라인 테두리 + 큰 라운드 + 플랫. */
export function BentoTile({ className, children }: BentoTileProps) {
  return (
    <div
      className={cn(
        "h-full rounded-2xl border bg-card p-5 transition-all hover:border-foreground/20",
        className
      )}
    >
      {children}
    </div>
  );
}
