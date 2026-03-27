import { Badge } from "@/components/ui/badge";
import { BookType, BOOK_TYPE_LABELS } from "@/data/types";
import { cn } from "@/lib/utils";

const TYPE_VARIANT: Record<BookType, string> = {
  concept: "bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300",
  type_basic: "bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300",
  type_advanced: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300",
  deep: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300",
  past_exam: "bg-pink-100 text-pink-700 hover:bg-pink-100 dark:bg-pink-900/40 dark:text-pink-300",
};

export function BookTypeBadge({ bookType }: { bookType: BookType }) {
  return (
    <Badge variant="secondary" className={cn("text-[11px] font-medium border-0", TYPE_VARIANT[bookType])}>
      {BOOK_TYPE_LABELS[bookType]}
    </Badge>
  );
}
