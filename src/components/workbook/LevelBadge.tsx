import { cn } from "@/lib/utils";
import { DifficultyLevel, DIFFICULTY_LABELS } from "@/data/types";

const LEVEL_STYLES: Record<DifficultyLevel, string> = {
  1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  3: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  4: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  5: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const LEVEL_DOT: Record<DifficultyLevel, string> = {
  1: "bg-emerald-500",
  2: "bg-blue-500",
  3: "bg-violet-500",
  4: "bg-orange-500",
  5: "bg-red-500",
};

export function LevelBadge({
  level,
  size = "sm",
  showLabel = true,
}: {
  level: DifficultyLevel;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        LEVEL_STYLES[level],
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm"
      )}
    >
      <span className={cn("rounded-full", LEVEL_DOT[level], size === "xs" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      Lv.{level}
      {showLabel && <span className="ml-0.5">{DIFFICULTY_LABELS[level]}</span>}
    </span>
  );
}
