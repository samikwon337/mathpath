"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle,
  ClipboardList,
  ArrowRight,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { useAuthContext } from "@/hooks/auth-context";
import { getWorkbookById } from "@/lib/api";
import { DifficultyLevel, DIFFICULTY_LABELS } from "@/data/types";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoggedIn, profile, userWorkbooks } = useAuthContext();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  const stats = useMemo(() => {
    const planned = userWorkbooks.filter((uw) => uw.status === "planned");
    const inProgress = userWorkbooks.filter((uw) => uw.status === "in_progress");
    const completed = userWorkbooks.filter((uw) => uw.status === "completed");
    const total = userWorkbooks.length;

    // Level distribution
    const levelCounts: Record<number, { total: number; completed: number }> = {};
    for (const uw of userWorkbooks) {
      const wb = getWorkbookById(uw.workbookId);
      if (!wb) continue;
      const lv = wb.difficultyLevel;
      if (!levelCounts[lv]) levelCounts[lv] = { total: 0, completed: 0 };
      levelCounts[lv].total++;
      if (uw.status === "completed") levelCounts[lv].completed++;
    }

    // Recent activity
    const recentActivity = [...userWorkbooks]
      .filter((uw) => uw.completedAt || uw.startedAt)
      .sort((a, b) => {
        const dateA = a.completedAt || a.startedAt || "";
        const dateB = b.completedAt || b.startedAt || "";
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5)
      .map((uw) => ({
        ...uw,
        workbook: getWorkbookById(uw.workbookId),
      }));

    return {
      planned: planned.length,
      inProgress: inProgress.length,
      completed: completed.length,
      total,
      progressPercent: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      levelCounts,
      recentActivity,
    };
  }, [userWorkbooks]);

  if (!isLoggedIn) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">
          {profile?.displayName}님의 대시보드
        </h1>
        <p className="mt-1 text-muted-foreground">
          학습 진행 상황을 한눈에 확인하세요
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <ClipboardList className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.planned}</p>
              <p className="text-xs text-muted-foreground">예정</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">진행중</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">완료</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
              <Trophy className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.progressPercent}%</p>
              <p className="text-xs text-muted-foreground">달성률</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              전체 진행률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{stats.completed} / {stats.total} 완료</span>
                <span className="font-semibold">{stats.progressPercent}%</span>
              </div>
              <Progress value={stats.progressPercent} className="h-3" />
            </div>

            {/* Level breakdown */}
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">레벨별 달성 현황</p>
              {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => {
                const data = stats.levelCounts[level];
                if (!data) return null;
                const pct = Math.round((data.completed / data.total) * 100);
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <LevelBadge level={level} size="xs" />
                      <span className="text-xs text-muted-foreground">
                        {data.completed}/{data.total}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 활동이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    {item.status === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {item.workbook?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.status === "completed"
                          ? `${item.completedAt} 완료`
                          : `${item.startedAt} 시작`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <Link href="/dashboard/workbooks">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  내 문제집 관리
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
