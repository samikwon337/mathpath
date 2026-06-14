"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clampStudyHours,
  DEFAULT_STUDY_HOURS_PER_DAY,
  STUDY_HOURS_STORAGE_KEY,
} from "@/lib/roadmap-timeline";

function readStoredHours(): number {
  if (typeof window === "undefined") {
    return DEFAULT_STUDY_HOURS_PER_DAY;
  }
  try {
    const raw = localStorage.getItem(STUDY_HOURS_STORAGE_KEY);
    if (raw == null) return DEFAULT_STUDY_HOURS_PER_DAY;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_STUDY_HOURS_PER_DAY;
    return clampStudyHours(parsed);
  } catch {
    return DEFAULT_STUDY_HOURS_PER_DAY;
  }
}

export function useStudyHoursPerDay() {
  const [hoursPerDay, setHoursPerDayState] = useState(
    DEFAULT_STUDY_HOURS_PER_DAY
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHoursPerDayState(readStoredHours());
    setHydrated(true);
  }, []);

  const setHoursPerDay = useCallback((hours: number) => {
    const clamped = clampStudyHours(hours);
    setHoursPerDayState(clamped);
    try {
      localStorage.setItem(STUDY_HOURS_STORAGE_KEY, String(clamped));
    } catch {
      // ignore quota errors
    }
  }, []);

  return { hoursPerDay, setHoursPerDay, hydrated };
}
