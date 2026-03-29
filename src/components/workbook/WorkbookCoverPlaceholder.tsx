import Image from "next/image";
import { DifficultyLevel } from "@/data/types";
import { cn } from "@/lib/utils";

const COVER_GRADIENTS: Record<DifficultyLevel, string> = {
  1: "from-emerald-400 to-teal-500",
  2: "from-blue-400 to-indigo-500",
  3: "from-violet-400 to-purple-500",
  4: "from-orange-400 to-amber-500",
  5: "from-red-400 to-rose-500",
};

export function WorkbookCoverPlaceholder({
  title,
  publisher,
  level,
  className,
  coverImageUrl,
}: {
  title: string;
  publisher: string;
  level: DifficultyLevel;
  className?: string;
  coverImageUrl?: string;
}) {
  if (coverImageUrl) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden bg-muted", className)}>
        <Image
          src={coverImageUrl}
          alt={`${title} 표지`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg bg-gradient-to-br p-4 text-white overflow-hidden",
        COVER_GRADIENTS[level],
        className
      )}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white" />
      </div>
      <span className="relative text-center text-lg font-bold leading-tight drop-shadow-sm">
        {title}
      </span>
      <span className="relative mt-2 text-xs opacity-80">{publisher}</span>
    </div>
  );
}
