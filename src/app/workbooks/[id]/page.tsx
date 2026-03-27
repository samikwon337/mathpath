"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Play,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { BookTypeBadge } from "@/components/workbook/BookTypeBadge";
import { WorkbookCoverPlaceholder } from "@/components/workbook/WorkbookCoverPlaceholder";
import { StatusToggle } from "@/components/workbook/StatusToggle";
import { WorkbookCard } from "@/components/workbook/WorkbookCard";
import {
  getWorkbookById,
  getPublisherById,
  getWorkbookRelations,
  getWorkbooksByPublisher,
  getYoutubeLinks,
} from "@/lib/api";
import { useAuthContext } from "@/hooks/auth-context";
import { DifficultyLevel } from "@/data/types";
import { notFound } from "next/navigation";

export default function WorkbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoggedIn, getWorkbookStatus, updateWorkbookStatus, removeWorkbook } =
    useAuthContext();

  const workbook = getWorkbookById(id);
  if (!workbook) return notFound();

  const publisher = getPublisherById(workbook.publisherId);
  const relations = getWorkbookRelations(id);
  const youtubeLinks = getYoutubeLinks(id);
  const publisherWorkbooks = getWorkbooksByPublisher(workbook.publisherId).filter(
    (w) => w.id !== id
  );
  const userStatus = isLoggedIn ? getWorkbookStatus(id) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 gap-1 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        뒤로
      </Button>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Cover + Actions */}
        <div className="space-y-4">
          <WorkbookCoverPlaceholder
            title={workbook.title}
            publisher={publisher?.name || ""}
            level={workbook.difficultyLevel as DifficultyLevel}
            className="aspect-[3/4] w-full max-w-[300px] mx-auto text-2xl"
          />

          {/* Auth Actions */}
          {isLoggedIn && (
            <div className="flex justify-center">
              <StatusToggle
                status={userStatus?.status}
                onStatusChange={(s) => updateWorkbookStatus(id, s)}
                onAdd={() => updateWorkbookStatus(id, "planned")}
                onRemove={() => removeWorkbook(id)}
                size="md"
              />
            </div>
          )}

          {/* Purchase Links */}
          <div className="space-y-2">
            {workbook.purchaseUrlKyobo && (
              <a href={workbook.purchaseUrlKyobo} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  교보문고에서 구매
                </Button>
              </a>
            )}
            {workbook.purchaseUrlYes24 && (
              <a href={workbook.purchaseUrlYes24} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  YES24에서 구매
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Title Area */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <LevelBadge level={workbook.difficultyLevel as DifficultyLevel} size="md" />
              <BookTypeBadge bookType={workbook.bookType} />
              {workbook.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">{workbook.title}</h1>
            <p className="text-muted-foreground mt-1">
              {publisher?.name}
              {workbook.problemCount && ` | ${workbook.problemCount}문제`}
              {workbook.targetAudience && ` | ${workbook.targetAudience}`}
            </p>
            {workbook.reviewCount > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{workbook.avgRating}</span>
                <span className="text-sm text-muted-foreground">
                  ({workbook.reviewCount}개 리뷰)
                </span>
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <p className="text-lg">{workbook.summary}</p>
            {workbook.description && (
              <p className="mt-2 text-muted-foreground">{workbook.description}</p>
            )}
          </div>

          {/* Pros & Cons */}
          {(workbook.pros.length > 0 || workbook.cons.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {workbook.pros.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5 text-emerald-600">
                      <ThumbsUp className="h-4 w-4" />
                      장점
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {workbook.pros.map((pro, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">+</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {workbook.cons.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5 text-orange-600">
                      <ThumbsDown className="h-4 w-4" />
                      단점
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {workbook.cons.map((con, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Recommended For */}
          {workbook.recommendedFor && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium mb-1">추천 대상</p>
              <p className="text-sm text-muted-foreground">{workbook.recommendedFor}</p>
            </div>
          )}

          <Separator />

          {/* Related Workbooks */}
          {(relations.previousSteps.length > 0 || relations.nextSteps.length > 0) && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                학습 경로
              </h2>
              <div className="space-y-3">
                {relations.previousSteps.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">이전 단계</p>
                    <div className="flex flex-wrap gap-2">
                      {relations.previousSteps.map((r) => (
                        <Link key={r.id} href={`/workbooks/${r.workbook.id}`}>
                          <Badge variant="secondary" className="gap-1 py-1 px-2 cursor-pointer hover:bg-accent">
                            <LevelBadge level={r.workbook.difficultyLevel as DifficultyLevel} size="xs" showLabel={false} />
                            {r.workbook.title}
                            <ChevronRight className="h-3 w-3" />
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {relations.nextSteps.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">다음 단계</p>
                    <div className="flex flex-wrap gap-2">
                      {relations.nextSteps.map((r) => (
                        <Link key={r.id} href={`/workbooks/${r.workbook.id}`}>
                          <Badge variant="secondary" className="gap-1 py-1 px-2 cursor-pointer hover:bg-accent">
                            {r.workbook.title}
                            <LevelBadge level={r.workbook.difficultyLevel as DifficultyLevel} size="xs" showLabel={false} />
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complements */}
          {relations.complements.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">보완 추천</h2>
              <div className="flex flex-wrap gap-2">
                {relations.complements.map((r) => (
                  <Link key={r.id} href={`/workbooks/${r.workbook.id}`}>
                    <Badge variant="outline" className="gap-1 py-1 px-2 cursor-pointer hover:bg-accent">
                      {r.workbook.title}
                      {r.note && <span className="text-muted-foreground">- {r.note}</span>}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {relations.alternatives.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">대안 교재</h2>
              <div className="flex flex-wrap gap-2">
                {relations.alternatives.map((r) => (
                  <Link key={r.id} href={`/workbooks/${r.workbook.id}`}>
                    <Badge variant="outline" className="gap-1 py-1 px-2 cursor-pointer hover:bg-accent">
                      {r.workbook.title}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* YouTube Links */}
          {youtubeLinks.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Play className="h-5 w-5 text-red-500" />
                  유튜브 리뷰
                </h2>
                <div className="space-y-2">
                  {youtubeLinks.map((yl) => (
                    <a
                      key={yl.id}
                      href={yl.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-red-100 text-red-500 shrink-0">
                        <Play className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {yl.videoTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {yl.channelName}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Same Publisher */}
          {publisherWorkbooks.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-lg font-semibold mb-3">
                  {publisher?.name} 다른 교재
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {publisherWorkbooks.slice(0, 4).map((wb) => (
                    <WorkbookCard key={wb.id} workbook={wb} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
