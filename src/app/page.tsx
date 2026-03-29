"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowRight,
  BookOpen,
  Map,
  Plus,
  LogIn,
  CheckCircle,
  ChevronRight,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { BookTypeBadge } from "@/components/workbook/BookTypeBadge";
import { WorkbookCoverPlaceholder } from "@/components/workbook/WorkbookCoverPlaceholder";
import { StatusToggle } from "@/components/workbook/StatusToggle";
import { MyRoadmapFlow } from "@/components/roadmap/MyRoadmapFlow";
import { useAuthContext } from "@/hooks/auth-context";
import {
  buildMyRoadmap,
  getWorkbookById,
  getPublisherById,
  getRoadmaps,
} from "@/lib/api";
import { DifficultyLevel, WorkbookStatus } from "@/data/types";

function MyRoadmapSection() {
  const router = useRouter();
  const { userWorkbooks, updateWorkbookStatus, removeWorkbook } = useAuthContext();

  const { nodes, edges, suggestedNext } = useMemo(
    () => buildMyRoadmap(userWorkbooks),
    [userWorkbooks]
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

  if (userWorkbooks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Map className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold">나의 로드맵을 시작하세요</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            풀었거나 풀고 있는 문제집을 추가하면
            <br />
            나만의 학습 로드맵이 자동으로 만들어집니다
          </p>
          <Link href="/workbooks">
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              문제집 추가하기
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold">{stats.completed}</span>
            <span className="text-muted-foreground">완료</span>
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span className="font-semibold">{stats.inProgress}</span>
            <span className="text-muted-foreground">진행중</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.planned}</span>
            예정
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">달성률</span>
          <Progress value={stats.pct} className="h-2 w-24" />
          <span className="font-semibold">{stats.pct}%</span>
        </div>
      </div>

      {/* Flow Chart */}
      <MyRoadmapFlow
        myNodes={nodes}
        myEdges={edges}
        suggestedNext={suggestedNext.slice(0, 2)}
        height={Math.max(300, nodes.length * 60 + 100)}
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          완료
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          진행중
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-slate-400" />
          예정
        </div>
        {suggestedNext.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border-2 border-dashed border-violet-500" />
            추천 다음 단계
          </div>
        )}
      </div>

      {/* My Workbook List (compact) */}
      <div className="grid gap-2 sm:grid-cols-2">
        {nodes.map((n) => {
          const publisher = getPublisherById(n.workbook.publisherId);
          return (
            <div
              key={n.workbook.id}
              className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-accent/50 transition-colors"
            >
              <Link href={`/workbooks/${n.workbook.id}`} className="shrink-0">
                <WorkbookCoverPlaceholder
                  title={n.workbook.title}
                  publisher={publisher?.name || ""}
                  level={n.workbook.difficultyLevel as DifficultyLevel}
                  className="w-10 h-13 text-[8px]"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/workbooks/${n.workbook.id}`}>
                  <p className="text-sm font-medium truncate hover:text-primary">
                    {n.workbook.title}
                  </p>
                </Link>
                <div className="flex items-center gap-1 mt-0.5">
                  <LevelBadge
                    level={n.workbook.difficultyLevel as DifficultyLevel}
                    size="xs"
                    showLabel={false}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {publisher?.name}
                  </span>
                </div>
              </div>
              <StatusToggle
                status={n.status}
                onStatusChange={(s) => updateWorkbookStatus(n.workbook.id, s)}
                onRemove={() => removeWorkbook(n.workbook.id)}
                size="sm"
              />
            </div>
          );
        })}
      </div>

      {/* Suggested Next */}
      {suggestedNext.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-violet-700 dark:text-violet-400">
            <Plus className="h-3.5 w-3.5" />
            다음에 풀면 좋은 문제집
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestedNext.map((s) => {
              const publisher = getPublisherById(s.publisherId);
              return (
                <Link key={s.id} href={`/workbooks/${s.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-violet-300 dark:border-violet-700 p-2.5 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                    <WorkbookCoverPlaceholder
                      title={s.title}
                      publisher={publisher?.name || ""}
                      level={s.difficultyLevel as DifficultyLevel}
                      className="w-10 h-13 text-[8px] opacity-70"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <LevelBadge
                          level={s.difficultyLevel as DifficultyLevel}
                          size="xs"
                          showLabel={false}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {publisher?.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-0.5">
                        {s.reason}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/workbooks">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            문제집 추가
          </Button>
        </Link>
        <Link href="/dashboard/workbooks">
          <Button variant="ghost" size="sm" className="gap-1.5">
            내 문제집 관리
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function RecommendedRoadmaps() {
  const gradeRoadmaps = getRoadmaps("grade");
  const publisherRoadmaps = getRoadmaps("publisher");

  const GRADE_COLORS = [
    "from-emerald-500 to-blue-500",
    "from-blue-500 to-violet-500",
    "from-violet-500 to-orange-500",
    "from-orange-500 to-red-500",
  ];

  return (
    <div className="space-y-6">
      {/* Grade Roadmaps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">등급별 추천 로드맵</h3>
          <Link href="/roadmap" className="text-sm text-primary hover:underline flex items-center gap-1">
            전체 보기 <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {gradeRoadmaps.map((rm, i) => (
            <Link key={rm.id} href="/roadmap">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${GRADE_COLORS[i] || GRADE_COLORS[0]} mb-2`} />
                  <h4 className="font-semibold text-sm">{rm.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {rm.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Publisher Roadmaps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">출판사별 라인업</h3>
          <Link href="/roadmap" className="text-sm text-primary hover:underline flex items-center gap-1">
            전체 보기 <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {publisherRoadmaps.map((rm) => (
            <Link key={rm.id} href="/roadmap" className="shrink-0">
              <Card className="hover:shadow-md transition-shadow cursor-pointer w-44">
                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm truncate">{rm.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {rm.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isLoggedIn, profile } = useAuthContext();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-8">
      {/* Header */}
      {isLoggedIn ? (
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {profile?.displayName}님의 로드맵
          </h1>
          <p className="mt-1 text-muted-foreground">
            나의 문제집 학습 경로를 확인하고 다음 단계를 계획하세요
          </p>
        </div>
      ) : (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-violet-500/5 border p-8 md:p-12">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              2022 개정 교육과정 기준
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              나만의{" "}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                수학 로드맵
              </span>
              을 만들어보세요
            </h1>
            <p className="mt-3 text-muted-foreground">
              풀어온 문제집을 등록하면 나의 학습 경로가 자동으로 시각화되고,
              다음에 풀면 좋은 문제집을 추천받을 수 있습니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  로그인하고 시작하기
                </Button>
              </Link>
              <Link href="/workbooks">
                <Button variant="outline" size="lg" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  문제집 둘러보기
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* My Roadmap (logged in) */}
      {isLoggedIn && <MyRoadmapSection />}

      {/* Recommended Roadmaps */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold md:text-2xl">추천 로드맵</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            목표 등급이나 선호 출판사에 맞는 로드맵을 참고하세요
          </p>
        </div>
        <RecommendedRoadmaps />
      </section>

      {/* Quick Access: Difficulty Levels */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold md:text-2xl">난이도별 문제집</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            자신의 실력에 맞는 단계의 문제집을 찾아보세요
          </p>
        </div>
        <div className="grid gap-2 grid-cols-5">
          {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => (
            <Link key={level} href={`/workbooks?level=${level}`}>
              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex justify-center">
                    <LevelBadge level={level} size="sm" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
