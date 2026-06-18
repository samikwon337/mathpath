import Link from "next/link";
import { Plus } from "lucide-react";

export function AddBookTile() {
  return (
    <Link href="/workbooks" className="h-full">
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-5 text-center transition-colors hover:border-primary hover:bg-accent">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Plus className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">문제집 추가</span>
      </div>
    </Link>
  );
}
