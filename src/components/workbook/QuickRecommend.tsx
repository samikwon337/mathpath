"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RotateCcw, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "./LevelBadge";
import { BookTypeBadge } from "./BookTypeBadge";
import { WorkbookCoverPlaceholder } from "./WorkbookCoverPlaceholder";
import { getWorkbooks, getPublisherById } from "@/lib/api";
import { BookType, DifficultyLevel } from "@/data/types";

type GradeChoice = "1-2" | "3" | "4-5";
type NeedChoice = "concept" | "type" | "advanced" | "past_exam";

const GRADE_OPTIONS: { label: string; value: GradeChoice }[] = [
  { label: "1~2등급", value: "1-2" },
  { label: "3등급", value: "3" },
  { label: "4~5등급 이하", value: "4-5" },
];

const NEED_OPTIONS: { label: string; value: NeedChoice }[] = [
  { label: "개념부터 다시", value: "concept" },
  { label: "유형 연습", value: "type" },
  { label: "심화 도전", value: "advanced" },
  { label: "기출 풀기", value: "past_exam" },
];

function getRecommendFilters(
  grade: GradeChoice,
  need: NeedChoice
): { levels: DifficultyLevel[]; bookTypes: BookType[] } {
  // Any grade + past exams → past_exam books
  if (need === "past_exam") {
    return { levels: [1, 2, 3, 4, 5], bookTypes: ["past_exam"] };
  }

  // Low grade (4-5) + concept → Lv.1 concept books
  if (grade === "4-5" && need === "concept") {
    return { levels: [1], bookTypes: ["concept"] };
  }
  // Low grade (4-5) + type → Lv.1-2 concept + type_basic
  if (grade === "4-5" && need === "type") {
    return { levels: [1, 2], bookTypes: ["concept", "type_basic"] };
  }
  // Low grade (4-5) + advanced → Lv.2-3 type_basic/type_advanced
  if (grade === "4-5" && need === "advanced") {
    return { levels: [2, 3], bookTypes: ["type_basic", "type_advanced"] };
  }

  // Mid grade (3) + concept → Lv.1-2 concept books
  if (grade === "3" && need === "concept") {
    return { levels: [1, 2], bookTypes: ["concept"] };
  }
  // Mid grade (3) + type → Lv.2-3 type_basic/type_advanced books
  if (grade === "3" && need === "type") {
    return { levels: [2, 3], bookTypes: ["type_basic", "type_advanced"] };
  }
  // Mid grade (3) + advanced → Lv.3-4 type_advanced/deep books
  if (grade === "3" && need === "advanced") {
    return { levels: [3, 4], bookTypes: ["type_advanced", "deep"] };
  }

  // High grade (1-2) + concept → Lv.1-2 concept books
  if (grade === "1-2" && need === "concept") {
    return { levels: [1, 2], bookTypes: ["concept"] };
  }
  // High grade (1-2) + type → Lv.3 type_advanced books
  if (grade === "1-2" && need === "type") {
    return { levels: [3], bookTypes: ["type_advanced"] };
  }
  // High grade (1-2) + advanced → Lv.4-5 deep books
  if (grade === "1-2" && need === "advanced") {
    return { levels: [4, 5], bookTypes: ["deep"] };
  }

  return { levels: [1, 2, 3], bookTypes: ["concept", "type_basic"] };
}

export function QuickRecommend() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [grade, setGrade] = useState<GradeChoice | null>(null);
  const [need, setNeed] = useState<NeedChoice | null>(null);

  const recommendations = useMemo(() => {
    if (!grade || !need) return [];
    const { levels, bookTypes } = getRecommendFilters(grade, need);

    // Gather workbooks matching any of the level+bookType combos
    const results = new Map<string, ReturnType<typeof getWorkbooks>[number]>();
    for (const level of levels) {
      for (const bookType of bookTypes) {
        const books = getWorkbooks({
          difficultyLevel: level,
          bookType,
          sort: "name",
        });
        for (const book of books) {
          if (!results.has(book.id)) {
            results.set(book.id, book);
          }
        }
      }
    }

    return Array.from(results.values()).slice(0, 5);
  }, [grade, need]);

  const handleGradeSelect = (value: GradeChoice) => {
    setGrade(value);
    setStep(2);
  };

  const handleNeedSelect = (value: NeedChoice) => {
    setNeed(value);
    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setGrade(null);
    setNeed(null);
  };

  return (
    <section className="rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border p-6 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold">나에게 맞는 문제집 찾기</h2>
          <p className="text-xs text-muted-foreground">
            2가지 질문으로 딱 맞는 문제집을 추천해 드려요
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                s <= step
                  ? "bg-violet-500"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
            {s < 3 && (
              <div
                className={`h-px w-6 transition-colors ${
                  s < step
                    ? "bg-violet-400"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {step}/3 단계
        </span>
      </div>

      {/* Step 1: Grade */}
      {step === 1 && (
        <div>
          <h3 className="font-semibold mb-3">현재 수학 등급은?</h3>
          <div className="flex flex-wrap gap-2">
            {GRADE_OPTIONS.map((opt) => (
              <Button
                key={opt.label}
                variant="outline"
                size="sm"
                className="bg-white/70 dark:bg-slate-800/70 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:border-violet-300"
                onClick={() => handleGradeSelect(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Need */}
      {step === 2 && (
        <div>
          <h3 className="font-semibold mb-3">어떤 유형의 교재가 필요해?</h3>
          <div className="flex flex-wrap gap-2">
            {NEED_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                className="bg-white/70 dark:bg-slate-800/70 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:border-violet-300"
                onClick={() => handleNeedSelect(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            className="mt-3 text-xs"
          >
            ← 이전 단계
          </Button>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">추천 문제집</h3>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3" />
              다시하기
            </Button>
          </div>
          {recommendations.length > 0 ? (
            <div className="grid gap-2">
              {recommendations.map((book) => {
                const publisher = getPublisherById(book.publisherId);
                return (
                  <Link key={book.id} href={`/workbooks/${book.id}`}>
                    <div className="flex items-center gap-3 rounded-lg bg-white/80 dark:bg-slate-800/80 border p-3 hover:shadow-md transition-all hover:-translate-y-0.5">
                      <WorkbookCoverPlaceholder
                        title={book.title}
                        publisher={publisher?.name || ""}
                        level={book.difficultyLevel as DifficultyLevel}
                        coverImageUrl={book.coverImageUrl}
                        className="w-11 h-14 text-[8px] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {book.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <LevelBadge
                            level={book.difficultyLevel as DifficultyLevel}
                            size="xs"
                            showLabel={false}
                          />
                          <BookTypeBadge bookType={book.bookType} />
                          <span className="text-[10px] text-muted-foreground">
                            {publisher?.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {book.summary}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                조건에 맞는 문제집이 없습니다. 다른 조건으로 다시 시도해 보세요.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={handleReset}
              >
                <RotateCcw className="h-3 w-3" />
                다시하기
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
