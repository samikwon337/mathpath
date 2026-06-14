"use client";

import {
  clampStudyHours,
  MAX_STUDY_HOURS_PER_DAY,
  MIN_STUDY_HOURS_PER_DAY,
  STUDY_HOURS_PRESETS,
  STUDY_HOURS_STEP,
} from "@/lib/roadmap-timeline";

interface StudyHoursControlProps {
  hoursPerDay: number;
  onChange: (hours: number) => void;
}

export function StudyHoursControl({
  hoursPerDay,
  onChange,
}: StudyHoursControlProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium shrink-0">하루 공부 시간</span>
        <div className="flex flex-wrap gap-1.5">
          {STUDY_HOURS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                hoursPerDay === preset
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border hover:bg-muted"
              }`}
            >
              {preset}h
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={MIN_STUDY_HOURS_PER_DAY}
          max={MAX_STUDY_HOURS_PER_DAY}
          step={STUDY_HOURS_STEP}
          value={hoursPerDay}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary"
          aria-label="하루 공부 시간 슬라이더"
        />
        <span className="text-sm font-semibold tabular-nums w-12 text-right">
          {clampStudyHours(hoursPerDay)}h
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        2시간/일 기준 데이터 · 현재 설정에 맞게 환산됨
      </p>
    </div>
  );
}
