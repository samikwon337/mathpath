"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
// Tabs UI replaced with plain buttons due to Base UI controlled-mode issues
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { getRoadmaps, getRoadmapSteps, getPublisherById } from "@/lib/api";
import {
  DifficultyLevel,
  Roadmap,
  RoadmapStep,
  Workbook,
} from "@/data/types";
import { roadmapGradeGroups, RoadmapGradeGroup } from "@/data/roadmaps";
import { useAuthContext } from "@/hooks/auth-context";
import { useStudyHoursPerDay } from "@/hooks/use-study-hours-per-day";
import { RoadmapTimeline } from "@/components/roadmap/RoadmapTimeline";
import { StudyHoursControl } from "@/components/roadmap/StudyHoursControl";
import { getStepDuration } from "@/lib/roadmap-timeline";

const COL_WIDTH = 240;
const ROW_HEIGHT = 95;
const GROUP_GAP = 48;
const GROUP_PAD_X = 20;
const GROUP_PAD_Y = 16;
const GROUP_LABEL_H = 40;

const LEVEL_BG: Record<DifficultyLevel, string> = {
  1: "#d1fae5",
  2: "#dbeafe",
  3: "#ede9fe",
  4: "#ffedd5",
  5: "#fee2e2",
};

const LEVEL_BORDER: Record<DifficultyLevel, string> = {
  1: "#10b981",
  2: "#3b82f6",
  3: "#8b5cf6",
  4: "#f97316",
  5: "#ef4444",
};

function WorkbookNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    publisher: string;
    level: DifficultyLevel;
    isOptional: boolean;
    note?: string;
    isCompleted?: boolean;
    workbookId: string;
    durationWeeks?: number;
  };

  return (
    <div
      className="relative rounded-lg border-2 px-4 py-3 shadow-sm cursor-pointer transition-transform hover:scale-105"
      style={{
        backgroundColor: d.isCompleted ? "#f0fdf4" : LEVEL_BG[d.level],
        borderColor: d.isCompleted ? "#22c55e" : LEVEL_BORDER[d.level],
        borderStyle: d.isOptional ? "dashed" : "solid",
        minWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
      {d.isCompleted && (
        <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
          ✓
        </div>
      )}
      <div className="text-sm font-semibold">{d.label}</div>
      <div className="text-[10px] text-gray-600 mt-0.5">{d.publisher}</div>
      {d.durationWeeks != null && (
        <div className="text-[10px] font-medium text-indigo-600 mt-0.5">
          약 {d.durationWeeks}주
        </div>
      )}
      {d.note && <div className="text-[10px] text-gray-500 mt-1">{d.note}</div>}
      {d.isOptional && <div className="text-[9px] text-gray-400 mt-0.5">(선택)</div>}
    </div>
  );
}

function GradeGroupNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    sublabel?: string;
    width: number;
    height: number;
    bgColor: string;
    borderColor: string;
  };

  return (
    <div
      className="rounded-xl pointer-events-none"
      style={{
        width: d.width,
        height: d.height,
        backgroundColor: d.bgColor,
        border: `2px solid ${d.borderColor}`,
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: `${d.borderColor}40` }}
      >
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: d.borderColor }}
        >
          {d.label}
        </span>
        {d.sublabel && (
          <span className="text-xs font-medium" style={{ color: d.borderColor }}>
            {d.sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { workbook: WorkbookNode, gradeGroup: GradeGroupNode };

type EnrichedStep = RoadmapStep & { workbook: Workbook };

function buildFlatFlow(
  steps: EnrichedStep[],
  isLoggedIn: boolean,
  getWorkbookStatus: (id: string) => { status: string } | undefined,
  hoursPerDay: number
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const stepGroups = new Map<number, EnrichedStep[]>();
  for (const step of steps) {
    const group = stepGroups.get(step.stepOrder) || [];
    group.push(step);
    stepGroups.set(step.stepOrder, group);
  }

  const sortedOrders = Array.from(stepGroups.keys()).sort((a, b) => a - b);

  sortedOrders.forEach((order, colIndex) => {
    const group = stepGroups.get(order) || [];
    const mainSteps = group.filter((s) => !s.isOptional);
    const optionalSteps = group.filter((s) => s.isOptional);
    const allSteps = [...mainSteps, ...optionalSteps];

    allSteps.forEach((step, rowIndex) => {
      const publisher = getPublisherById(step.workbook.publisherId);
      const userStatus = isLoggedIn ? getWorkbookStatus(step.workbookId) : undefined;
      const duration = getStepDuration(step, step.workbook, hoursPerDay);

      nodes.push({
        id: step.id,
        type: "workbook",
        position: { x: colIndex * COL_WIDTH, y: rowIndex * ROW_HEIGHT },
        data: {
          label: step.workbook.title,
          publisher: publisher?.name || "",
          level: step.workbook.difficultyLevel as DifficultyLevel,
          isOptional: step.isOptional,
          note: step.note,
          isCompleted: userStatus?.status === "completed",
          workbookId: step.workbookId,
          durationWeeks: duration.weeks,
        },
      });

      if (colIndex > 0) {
        const prevOrder = sortedOrders[colIndex - 1];
        const prevMainSteps = (stepGroups.get(prevOrder) || []).filter((s) => !s.isOptional);
        if (prevMainSteps.length > 0) {
          edges.push({
            id: `e-${prevMainSteps[0].id}-${step.id}`,
            source: prevMainSteps[0].id,
            target: step.id,
            animated: !step.isOptional,
            style: {
              stroke: step.isOptional ? "#94a3b8" : "#6366f1",
              strokeDasharray: step.isOptional ? "5,5" : undefined,
            },
          });
        }
      }
    });
  });

  return { nodes, edges, chartHeight: 400 };
}

function buildGroupedFlow(
  steps: EnrichedStep[],
  gradeGroups: RoadmapGradeGroup[],
  isLoggedIn: boolean,
  getWorkbookStatus: (id: string) => { status: string } | undefined,
  hoursPerDay: number
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let groupOffsetX = 0;
  let maxGroupHeight = 0;
  let prevGroupLastMainStepId: string | null = null;

  for (const gradeGroup of gradeGroups) {
    const groupSteps = steps.filter((s) => gradeGroup.stepOrders.includes(s.stepOrder));
    if (groupSteps.length === 0) continue;

    const stepGroups = new Map<number, EnrichedStep[]>();
    for (const step of groupSteps) {
      const g = stepGroups.get(step.stepOrder) || [];
      g.push(step);
      stepGroups.set(step.stepOrder, g);
    }

    const sortedOrders = gradeGroup.stepOrders.filter((o) => stepGroups.has(o));
    let maxRows = 0;
    for (const order of sortedOrders) {
      maxRows = Math.max(maxRows, (stepGroups.get(order) || []).length);
    }

    const groupWidth = sortedOrders.length * COL_WIDTH + GROUP_PAD_X * 2;
    const groupHeight =
      maxRows * ROW_HEIGHT + GROUP_PAD_Y * 2 + GROUP_LABEL_H;
    maxGroupHeight = Math.max(maxGroupHeight, groupHeight);

    nodes.push({
      id: gradeGroup.id,
      type: "gradeGroup",
      position: { x: groupOffsetX, y: 0 },
      zIndex: -1,
      selectable: false,
      draggable: false,
      connectable: false,
      focusable: false,
      data: {
        label: gradeGroup.label,
        sublabel: gradeGroup.sublabel,
        width: groupWidth,
        height: groupHeight,
        bgColor: gradeGroup.bgColor,
        borderColor: gradeGroup.borderColor,
      },
    });

    let groupLastMainStepId: string | null = null;

    sortedOrders.forEach((order, localColIndex) => {
      const group = stepGroups.get(order) || [];
      const mainSteps = group.filter((s) => !s.isOptional);
      const optionalSteps = group.filter((s) => s.isOptional);
      const allSteps = [...mainSteps, ...optionalSteps];

      if (mainSteps.length > 0) {
        groupLastMainStepId = mainSteps[0].id;
      }

      allSteps.forEach((step, rowIndex) => {
        const publisher = getPublisherById(step.workbook.publisherId);
        const userStatus = isLoggedIn ? getWorkbookStatus(step.workbookId) : undefined;
        const duration = getStepDuration(step, step.workbook, hoursPerDay);

        nodes.push({
          id: step.id,
          type: "workbook",
          position: {
            x: groupOffsetX + GROUP_PAD_X + localColIndex * COL_WIDTH,
            y: GROUP_PAD_Y + GROUP_LABEL_H + rowIndex * ROW_HEIGHT,
          },
          zIndex: 1,
          data: {
            label: step.workbook.title,
            publisher: publisher?.name || "",
            level: step.workbook.difficultyLevel as DifficultyLevel,
            isOptional: step.isOptional,
            note: step.note?.replace(/^\[[^\]]+\]\s*/, ""),
            isCompleted: userStatus?.status === "completed",
            workbookId: step.workbookId,
            durationWeeks: duration.weeks,
          },
        });

        if (localColIndex > 0) {
          const prevOrder = sortedOrders[localColIndex - 1];
          const prevMainSteps = (stepGroups.get(prevOrder) || []).filter((s) => !s.isOptional);
          if (prevMainSteps.length > 0) {
            edges.push({
              id: `e-${prevMainSteps[0].id}-${step.id}`,
              source: prevMainSteps[0].id,
              target: step.id,
              animated: !step.isOptional,
              style: {
                stroke: step.isOptional ? "#94a3b8" : "#6366f1",
                strokeDasharray: step.isOptional ? "5,5" : undefined,
              },
            });
          }
        } else if (prevGroupLastMainStepId) {
          edges.push({
            id: `e-grp-${prevGroupLastMainStepId}-${step.id}`,
            source: prevGroupLastMainStepId,
            target: step.id,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          });
        }
      });
    });

    prevGroupLastMainStepId = groupLastMainStepId;
    groupOffsetX += groupWidth + GROUP_GAP;
  }

  return { nodes, edges, chartHeight: Math.max(420, maxGroupHeight + 40) };
}

function RoadmapFlowChart({
  roadmapId,
  isLoggedIn,
  getWorkbookStatus,
  onNodeClick,
  hoursPerDay,
}: {
  roadmapId: string;
  isLoggedIn: boolean;
  getWorkbookStatus: (id: string) => { status: string } | undefined;
  onNodeClick: (e: React.MouseEvent, node: Node) => void;
  hoursPerDay: number;
}) {
  const { nodes: initialNodes, edges: initialEdges, chartHeight } = useMemo(() => {
    const steps = getRoadmapSteps(roadmapId);
    const gradeGroups = roadmapGradeGroups[roadmapId];

    if (gradeGroups) {
      return buildGroupedFlow(
        steps,
        gradeGroups,
        isLoggedIn,
        getWorkbookStatus,
        hoursPerDay
      );
    }
    return buildFlatFlow(steps, isLoggedIn, getWorkbookStatus, hoursPerDay);
  }, [roadmapId, isLoggedIn, getWorkbookStatus, hoursPerDay]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div
      className="rounded-lg border bg-white dark:bg-gray-950 overflow-hidden"
      style={{ height: chartHeight }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function RoadmapLegend({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-6 rounded border-2 border-indigo-500 bg-indigo-50" />
        필수 교재
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-6 rounded border-2 border-dashed border-gray-400 bg-gray-50" />
        선택 / 타사 확장
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-0.5 w-6 bg-indigo-500" />
        필수 경로
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-0.5 w-6 border-t-2 border-dashed border-gray-400" />
        선택 경로
      </div>
      {isLoggedIn && (
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">
            ✓
          </div>
          완료
        </div>
      )}
    </div>
  );
}

function RoadmapSection({
  roadmapList,
  defaultTab,
  renderDescription,
  enableTimeline = false,
  hoursPerDay,
  onHoursChange,
  defaultView = "timeline",
}: {
  roadmapList: Roadmap[];
  defaultTab: string;
  renderDescription: (rm: Roadmap) => React.ReactNode;
  enableTimeline?: boolean;
  hoursPerDay: number;
  onHoursChange: (hours: number) => void;
  defaultView?: "timeline" | "flow";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, getWorkbookStatus } = useAuthContext();
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const viewParam = searchParams.get("view");
  const [viewMode, setViewMode] = useState<"timeline" | "flow">(
    viewParam === "flow" || viewParam === "timeline"
      ? viewParam
      : defaultView
  );

  useEffect(() => {
    if (viewParam === "flow" || viewParam === "timeline") {
      setViewMode(viewParam);
    }
  }, [viewParam]);

  const setView = useCallback(
    (view: "timeline" | "flow") => {
      setViewMode(view);
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", view);
      params.set("tab", currentTab);
      router.replace(`/roadmap?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, currentTab]
  );

  const onTabChange = useCallback(
    (tabId: string) => {
      setCurrentTab(tabId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabId);
      if (enableTimeline) {
        params.set("view", viewMode);
      }
      router.replace(`/roadmap?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, enableTimeline, viewMode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== "workbook") return;
      const data = node.data as { workbookId?: string };
      if (data.workbookId) {
        router.push(`/workbooks/${data.workbookId}`);
      }
    },
    [router]
  );

  return (
    <div>
      {/* Tab buttons - plain buttons instead of Base UI Tabs */}
      <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-[3px] mb-4">
        {roadmapList.map((rm) => (
          <button
            key={rm.id}
            onClick={() => onTabChange(rm.id)}
            className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              currentTab === rm.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {rm.name}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {roadmapList.map((rm) =>
        rm.id === currentTab ? (
          <div key={rm.id}>
            <Card className="mb-4">
              <CardContent className="p-4">
                {renderDescription(rm)}
              </CardContent>
            </Card>

            {enableTimeline && (
              <div className="inline-flex gap-1 rounded-lg bg-muted p-[3px] mb-4">
                <button
                  type="button"
                  onClick={() => setView("timeline")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === "timeline"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  타임라인
                </button>
                <button
                  type="button"
                  onClick={() => setView("flow")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === "flow"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  플로우
                </button>
              </div>
            )}

            {enableTimeline && viewMode === "timeline" ? (
              <RoadmapTimeline
                roadmapId={rm.id}
                roadmapName={rm.name}
                hoursPerDay={hoursPerDay}
                onHoursChange={onHoursChange}
                isLoggedIn={isLoggedIn}
                getWorkbookStatus={getWorkbookStatus}
              />
            ) : (
              <>
                {enableTimeline && (
                  <div className="mb-4">
                    <StudyHoursControl
                      hoursPerDay={hoursPerDay}
                      onChange={onHoursChange}
                    />
                  </div>
                )}
                <RoadmapFlowChart
                  key={`${rm.id}-${hoursPerDay}`}
                  roadmapId={rm.id}
                  isLoggedIn={isLoggedIn}
                  getWorkbookStatus={getWorkbookStatus}
                  onNodeClick={onNodeClick}
                  hoursPerDay={hoursPerDay}
                />
              </>
            )}

            <RoadmapLegend isLoggedIn={isLoggedIn} />
          </div>
        ) : null
      )}
    </div>
  );
}

import { Suspense } from "react";

function RoadmapPageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { hoursPerDay, setHoursPerDay } = useStudyHoursPerDay();

  const gradeRoadmaps = getRoadmaps("grade");
  const publisherRoadmaps = getRoadmaps("publisher");

  const isPublisherTab = publisherRoadmaps.some((r) => r.id === tabParam);

  const [section, setSection] = useState<"grade" | "publisher">(
    isPublisherTab ? "publisher" : "grade"
  );

  const defaultGradeTab = (tabParam && gradeRoadmaps.some((r) => r.id === tabParam))
    ? tabParam : gradeRoadmaps[0]?.id || "";
  const defaultPublisherTab = (tabParam && publisherRoadmaps.some((r) => r.id === tabParam))
    ? tabParam : publisherRoadmaps[0]?.id || "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">학습 로드맵</h1>
        <p className="mt-1 text-muted-foreground">
          등급별/출판사별 맞춤 문제집 학습 경로를 확인하세요
        </p>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSection("grade")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            section === "grade"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          등급별 로드맵
        </button>
        <button
          onClick={() => setSection("publisher")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            section === "publisher"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          출판사별 로드맵
        </button>
      </div>

      {section === "grade" && (
        <RoadmapSection
          roadmapList={gradeRoadmaps}
          defaultTab={defaultGradeTab}
          enableTimeline
          hoursPerDay={hoursPerDay}
          onHoursChange={setHoursPerDay}
          defaultView="timeline"
          renderDescription={(rm) => (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold">
                  {rm.targetStartLevel}등급
                </span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 px-2.5 py-0.5 text-xs font-semibold">
                  {rm.id === "rm-5to-top" ? "최상위" : `${rm.targetEndLevel}등급`}
                </span>
              </div>
              {rm.id === "rm-5to-top" && (
                <div className="flex flex-wrap gap-1.5">
                  {roadmapGradeGroups["rm-5to-top"]?.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: g.borderColor }}
                    >
                      {g.label}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">{rm.description}</p>
            </div>
          )}
        />
      )}

      {section === "publisher" && (
        <RoadmapSection
          roadmapList={publisherRoadmaps}
          defaultTab={defaultPublisherTab}
          hoursPerDay={hoursPerDay}
          onHoursChange={setHoursPerDay}
          renderDescription={(rm) => {
            const publisher = rm.publisherId ? getPublisherById(rm.publisherId) : null;
            return (
              <div className="flex items-center gap-3">
                {publisher && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium">
                    {publisher.name}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <LevelBadge level={Math.min(rm.targetStartLevel, 5) as DifficultyLevel} size="xs" showLabel={false} />
                  <span className="text-muted-foreground text-xs">&rarr;</span>
                  <LevelBadge level={Math.min(rm.targetEndLevel, 5) as DifficultyLevel} size="xs" showLabel={false} />
                </div>
                <p className="text-sm text-muted-foreground">{rm.description}</p>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense>
      <RoadmapPageInner />
    </Suspense>
  );
}
