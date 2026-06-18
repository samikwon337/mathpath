"use client";

import { useMemo } from "react";
import { useAuthContext } from "@/hooks/auth-context";
import { buildMyRoadmap } from "@/lib/transform";
import type { Workbook, WorkbookRelation } from "@/data/types";

export function useMyRoadmapData(
  workbooksById: Map<string, Workbook>,
  relations: WorkbookRelation[]
) {
  const { userWorkbooks } = useAuthContext();

  const built = useMemo(
    () => buildMyRoadmap(userWorkbooks, workbooksById, relations),
    [userWorkbooks, workbooksById, relations]
  );

  const stats = useMemo(() => {
    const completed = userWorkbooks.filter((uw) => uw.status === "completed").length;
    const total = userWorkbooks.length;
    return {
      completed,
      inProgress: userWorkbooks.filter((uw) => uw.status === "in_progress").length,
      planned: userWorkbooks.filter((uw) => uw.status === "planned").length,
      total,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [userWorkbooks]);

  return { ...built, stats, hasWorkbooks: userWorkbooks.length > 0 };
}
