"use client";

import { ClipboardList, BookOpen, CheckCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkbookStatus, STATUS_LABELS } from "@/data/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  WorkbookStatus,
  { icon: typeof ClipboardList; color: string; bg: string }
> = {
  planned: {
    icon: ClipboardList,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
  },
  in_progress: {
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60",
  },
  completed: {
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60",
  },
};

const NEXT_STATUS: Record<WorkbookStatus, WorkbookStatus> = {
  planned: "in_progress",
  in_progress: "completed",
  completed: "planned",
};

export function StatusToggle({
  status,
  onStatusChange,
  onAdd,
  onRemove,
  size = "sm",
}: {
  status?: WorkbookStatus;
  onStatusChange?: (status: WorkbookStatus) => void;
  onAdd?: () => void;
  onRemove?: () => void;
  size?: "sm" | "md";
}) {
  if (!status) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAdd?.();
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        내 문제집에 추가
      </Button>
    );
  }

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStatusChange?.(NEXT_STATUS[status]);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
          config.color,
          config.bg,
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        )}
      >
        <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        {STATUS_LABELS[status]}
      </button>
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
