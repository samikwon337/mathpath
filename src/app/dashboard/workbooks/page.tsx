"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { BookTypeBadge } from "@/components/workbook/BookTypeBadge";
import { StatusToggle } from "@/components/workbook/StatusToggle";
import { WorkbookCoverPlaceholder } from "@/components/workbook/WorkbookCoverPlaceholder";
import { useAuthContext } from "@/hooks/auth-context";
import { getWorkbookById, getPublisherById } from "@/lib/api";
import { DifficultyLevel, WorkbookStatus } from "@/data/types";

export default function MyWorkbooksPage() {
  const router = useRouter();
  const { isLoggedIn, userWorkbooks, updateWorkbookStatus, removeWorkbook } =
    useAuthContext();
  const [tab, setTab] = useState<"all" | WorkbookStatus>("all");

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  const filteredWorkbooks = useMemo(() => {
    const items = userWorkbooks
      .map((uw) => ({
        ...uw,
        workbook: getWorkbookById(uw.workbookId),
        publisher: getWorkbookById(uw.workbookId)
          ? getPublisherById(getWorkbookById(uw.workbookId)!.publisherId)
          : undefined,
      }))
      .filter((item) => item.workbook != null);

    if (tab === "all") return items;
    return items.filter((item) => item.status === tab);
  }, [userWorkbooks, tab]);

  if (!isLoggedIn) return null;

  const counts = {
    all: userWorkbooks.length,
    planned: userWorkbooks.filter((uw) => uw.status === "planned").length,
    in_progress: userWorkbooks.filter((uw) => uw.status === "in_progress").length,
    completed: userWorkbooks.filter((uw) => uw.status === "completed").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">내 문제집</h1>
          <p className="mt-1 text-muted-foreground">
            문제집 학습 상태를 관리하세요
          </p>
        </div>
        <Link href="/workbooks">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">전체 ({counts.all})</TabsTrigger>
          <TabsTrigger value="planned">예정 ({counts.planned})</TabsTrigger>
          <TabsTrigger value="in_progress">
            진행중 ({counts.in_progress})
          </TabsTrigger>
          <TabsTrigger value="completed">완료 ({counts.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {filteredWorkbooks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">문제집이 없습니다</p>
              <p className="text-sm mt-1">문제집 카탈로그에서 문제집을 추가해보세요</p>
              <Link href="/workbooks">
                <Button variant="outline" className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" />
                  문제집 둘러보기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWorkbooks.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <Link href={`/workbooks/${item.workbook!.id}`} className="shrink-0">
                        <WorkbookCoverPlaceholder
                          title={item.workbook!.title}
                          publisher={item.publisher?.name || ""}
                          level={item.workbook!.difficultyLevel as DifficultyLevel}
                          coverImageUrl={item.workbook!.coverImageUrl}
                          className="w-16 h-20 text-[10px]"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <LevelBadge
                            level={item.workbook!.difficultyLevel as DifficultyLevel}
                            size="xs"
                            showLabel={false}
                          />
                          <BookTypeBadge bookType={item.workbook!.bookType} />
                        </div>
                        <Link href={`/workbooks/${item.workbook!.id}`}>
                          <h3 className="font-semibold text-sm hover:text-primary transition-colors">
                            {item.workbook!.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {item.publisher?.name}
                        </p>

                        {/* Dates */}
                        <div className="text-xs text-muted-foreground mt-1 space-x-3">
                          {item.startedAt && <span>시작: {item.startedAt}</span>}
                          {item.completedAt && <span>완료: {item.completedAt}</span>}
                          {item.startedAt && item.completedAt && (
                            <span>
                              (
                              {Math.ceil(
                                (new Date(item.completedAt).getTime() -
                                  new Date(item.startedAt).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}
                              일)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 self-center">
                        <StatusToggle
                          status={item.status}
                          onStatusChange={(s) =>
                            updateWorkbookStatus(item.workbookId, s)
                          }
                          onRemove={() => removeWorkbook(item.workbookId)}
                          size="sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
