"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { WorkbookCard } from "@/components/workbook/WorkbookCard";
import { getWorkbooks, getPublishers, getSubjects } from "@/lib/api";
import {
  BookType,
  DifficultyLevel,
  BOOK_TYPE_LABELS,
  DIFFICULTY_LABELS,
} from "@/data/types";

type SortOption = "difficulty" | "name" | "rating";

function WorkbooksPageInner() {
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level") || "";

  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [publisherId, setPublisherId] = useState<string>("");
  const [difficultyLevel, setDifficultyLevel] = useState<string>(levelParam);
  const [bookType, setBookType] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("difficulty");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const publishers = getPublishers();
  const subjects = getSubjects();

  const workbooks = useMemo(() => {
    return getWorkbooks({
      search: search || undefined,
      subjectId: subjectId || undefined,
      publisherId: publisherId || undefined,
      difficultyLevel: difficultyLevel
        ? (Number(difficultyLevel) as DifficultyLevel)
        : undefined,
      bookType: bookType ? (bookType as BookType) : undefined,
      sort,
    });
  }, [search, subjectId, publisherId, difficultyLevel, bookType, sort]);

  const activeFilterCount = [subjectId, publisherId, difficultyLevel, bookType].filter(Boolean).length;

  const clearFilters = () => {
    setSubjectId("");
    setPublisherId("");
    setDifficultyLevel("");
    setBookType("");
    setSearch("");
  };

  const SUBJECT_OPTIONS = [
    { value: "_all", label: "전체" },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ];
  const PUBLISHER_OPTIONS = [
    { value: "_all", label: "전체" },
    ...publishers.map((p) => ({ value: p.id, label: p.name })),
  ];
  const DIFFICULTY_OPTIONS = [
    { value: "_all", label: "전체" },
    ...([1, 2, 3, 4, 5] as DifficultyLevel[]).map((lv) => ({
      value: String(lv),
      label: `Lv.${lv} ${DIFFICULTY_LABELS[lv]}`,
    })),
  ];
  const BOOK_TYPE_OPTIONS = [
    { value: "_all", label: "전체" },
    ...Object.entries(BOOK_TYPE_LABELS).map(([key, label]) => ({
      value: key,
      label,
    })),
  ];

  const handleSelect = (setter: (v: string) => void) => (v: string | null) =>
    setter(!v || v === "_all" ? "" : v);

  const FilterControls = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">과목</label>
        <Select value={subjectId || "_all"} onValueChange={handleSelect(setSubjectId)}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">출판사</label>
        <Select value={publisherId || "_all"} onValueChange={handleSelect(setPublisherId)}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {PUBLISHER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">난이도</label>
        <Select value={difficultyLevel || "_all"} onValueChange={handleSelect(setDifficultyLevel)}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">유형</label>
        <Select value={bookType || "_all"} onValueChange={handleSelect(setBookType)}>
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {BOOK_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full gap-1">
          <X className="h-3.5 w-3.5" />
          필터 초기화
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">문제집 카탈로그</h1>
        <p className="mt-1 text-muted-foreground">
          {workbooks.length}개의 문제집
        </p>
      </div>

      {/* Search + Sort + Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="문제집명 또는 출판사 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort((v ?? "difficulty") as SortOption)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="difficulty">난이도순</SelectItem>
            <SelectItem value="name">이름순</SelectItem>
            <SelectItem value="rating">평점순</SelectItem>
          </SelectContent>
        </Select>

        {/* Mobile filter trigger */}
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetTrigger
            className="md:hidden"
            render={
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                필터
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            }
          />
          <SheetContent side="left" className="w-72">
            <SheetTitle className="text-lg font-semibold mb-4 mt-4">필터</SheetTitle>
            <FilterControls />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20">
            <h3 className="text-sm font-semibold mb-3">필터</h3>
            <FilterControls />
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {workbooks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">검색 결과가 없습니다</p>
              <p className="text-sm mt-1">다른 필터 조건을 시도해보세요</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                필터 초기화
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {workbooks.map((wb) => (
                <WorkbookCard key={wb.id} workbook={wb} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkbooksPage() {
  return (
    <Suspense>
      <WorkbooksPageInner />
    </Suspense>
  );
}
