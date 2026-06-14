"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { getRoadmapTimeline } from "@/lib/roadmap-timeline";
import { roadmapGradeGroups } from "@/data/roadmaps";
import { StudyHoursControl } from "./StudyHoursControl";

interface RoadmapTimelineProps {
  roadmapId: string;
  roadmapName: string;
  hoursPerDay: number;
  onHoursChange: (hours: number) => void;
  isLoggedIn: boolean;
  getWorkbookStatus: (id: string) => { status: string } | undefined;
}

export function RoadmapTimeline({
  roadmapId,
  roadmapName,
  hoursPerDay,
  onHoursChange,
  isLoggedIn,
  getWorkbookStatus,
}: RoadmapTimelineProps) {
  const router = useRouter();
  const timeline = useMemo(
    () => getRoadmapTimeline(roadmapId, hoursPerDay),
    [roadmapId, hoursPerDay]
  );
  const gradeGroups = roadmapGradeGroups[roadmapId];

  const stepsByOrder = useMemo(() => {
    const map = new Map<number, typeof timeline.steps>();
    for (const step of timeline.steps) {
      const group = map.get(step.stepOrder) || [];
      group.push(step);
      map.set(step.stepOrder, group);
    }
    return map;
  }, [timeline.steps]);

  let cumulativeDays = 0;

  const renderStep = (step: (typeof timeline.steps)[0]) => {
    const isCompleted =
      isLoggedIn && getWorkbookStatus(step.workbookId)?.status === "completed";
    if (!step.isOptional) {
      cumulativeDays += step.duration.days;
    }
    const cumulativeWeeks = Math.ceil(cumulativeDays / 7);

    return (
      <button
        key={step.id}
        type="button"
        onClick={() => router.push(`/workbooks/${step.workbookId}`)}
        className={`w-full text-left rounded-lg border-2 px-4 py-3 transition-colors hover:bg-muted/50 ${
          step.isOptional
            ? "border-dashed border-muted-foreground/40 bg-muted/20"
            : "border-solid border-border"
        } ${isCompleted ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400" : "bg-background"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">
                {step.workbook.title}
              </span>
              {step.isOptional && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  (선택)
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            {step.note && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {step.note.replace(/^\[[^\]]+\]\s*/, "")}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-medium tabular-nums">
              약 {step.duration.weeks}주
            </div>
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {step.duration.totalHours}h
            </div>
            {!step.isOptional && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                누적 {cumulativeWeeks}주
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderFlatList = () => {
    cumulativeDays = 0;
    const orders = Array.from(stepsByOrder.keys()).sort((a, b) => a - b);
    return (
      <div className="space-y-2">
        {orders.flatMap((order) =>
          (stepsByOrder.get(order) || []).map((step) => renderStep(step))
        )}
      </div>
    );
  };

  const renderGroupedList = () => {
    cumulativeDays = 0;
    return (
      <div className="space-y-6">
        {timeline.groups.map(({ group, cumulativeWeeks }) => {
          const groupOrders = group.stepOrders.filter((o) =>
            stepsByOrder.has(o)
          );
          return (
            <div key={group.id}>
              <div
                className="flex items-center justify-between rounded-lg px-3 py-2 mb-3"
                style={{
                  backgroundColor: group.bgColor,
                  borderLeft: `4px solid ${group.borderColor}`,
                }}
              >
                <div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: group.borderColor }}
                  >
                    {group.label}
                  </span>
                  {group.sublabel && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {group.sublabel}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  누적 {cumulativeWeeks}주
                </span>
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-muted ml-2">
                {groupOrders.flatMap((order) =>
                  (stepsByOrder.get(order) || []).map((step) =>
                    renderStep(step)
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold">{roadmapName}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          약 {timeline.total.weeks}주 ({timeline.total.days}일) · 총{" "}
          {timeline.total.totalHours}시간 · 하루 {hoursPerDay}시간 기준
        </p>
      </div>

      <StudyHoursControl hoursPerDay={hoursPerDay} onChange={onHoursChange} />

      <div className="rounded-lg border bg-card p-4">
        {gradeGroups ? renderGroupedList() : renderFlatList()}
      </div>
    </div>
  );
}
