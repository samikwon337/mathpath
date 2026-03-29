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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { getRoadmaps, getRoadmapSteps, getPublisherById } from "@/lib/api";
import { DifficultyLevel, Roadmap } from "@/data/types";
import { useAuthContext } from "@/hooks/auth-context";

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
      {d.note && <div className="text-[10px] text-gray-500 mt-1">{d.note}</div>}
      {d.isOptional && <div className="text-[9px] text-gray-400 mt-0.5">(선택)</div>}
    </div>
  );
}

const nodeTypes = { workbook: WorkbookNode };

function RoadmapFlowChart({
  roadmapId,
  isLoggedIn,
  getWorkbookStatus,
  onNodeClick,
}: {
  roadmapId: string;
  isLoggedIn: boolean;
  getWorkbookStatus: (id: string) => { status: string } | undefined;
  onNodeClick: (e: React.MouseEvent, node: Node) => void;
}) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const steps = getRoadmapSteps(roadmapId);
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const stepGroups = new Map<number, typeof steps>();
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

        nodes.push({
          id: step.id,
          type: "workbook",
          position: { x: colIndex * 250, y: rowIndex * 100 },
          data: {
            label: step.workbook.title,
            publisher: publisher?.name || "",
            level: step.workbook.difficultyLevel as DifficultyLevel,
            isOptional: step.isOptional,
            note: step.note,
            isCompleted: userStatus?.status === "completed",
            workbookId: step.workbookId,
          },
        });

        if (colIndex > 0) {
          const prevOrder = sortedOrders[colIndex - 1];
          const prevMainSteps = (stepGroups.get(prevOrder) || []).filter(
            (s) => !s.isOptional
          );
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

    return { nodes, edges };
  }, [roadmapId, isLoggedIn, getWorkbookStatus]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-950 overflow-hidden" style={{ height: 400 }}>
      <ReactFlow
        key={roadmapId}
        nodes={initialNodes}
        edges={initialEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
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
  activeTab,
  setActiveTab,
  renderDescription,
}: {
  roadmapList: Roadmap[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  renderDescription: (rm: Roadmap) => React.ReactNode;
}) {
  const router = useRouter();
  const { isLoggedIn, getWorkbookStatus } = useAuthContext();

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as { workbookId: string };
      if (data.workbookId) {
        router.push(`/workbooks/${data.workbookId}`);
      }
    },
    [router]
  );

  const activeRoadmap = roadmapList.find((r) => r.id === activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4 flex-wrap h-auto gap-1">
        {roadmapList.map((rm) => (
          <TabsTrigger key={rm.id} value={rm.id} className="text-sm">
            {rm.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {roadmapList.map((rm) => (
        <TabsContent key={rm.id} value={rm.id}>
          {activeRoadmap && activeRoadmap.id === rm.id && (
            <>
              <Card className="mb-4">
                <CardContent className="p-4">
                  {renderDescription(rm)}
                </CardContent>
              </Card>

              <RoadmapFlowChart
                roadmapId={rm.id}
                isLoggedIn={isLoggedIn}
                getWorkbookStatus={getWorkbookStatus}
                onNodeClick={onNodeClick}
              />

              <RoadmapLegend isLoggedIn={isLoggedIn} />
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

import { Suspense } from "react";

function RoadmapPageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const gradeRoadmaps = getRoadmaps("grade");
  const publisherRoadmaps = getRoadmaps("publisher");

  const isPublisherTab = publisherRoadmaps.some((r) => r.id === tabParam);
  const isGradeTab = gradeRoadmaps.some((r) => r.id === tabParam);

  const [activeGradeTab, setActiveGradeTab] = useState(
    isGradeTab && tabParam ? tabParam : gradeRoadmaps[0]?.id || ""
  );
  const [activePublisherTab, setActivePublisherTab] = useState(
    isPublisherTab && tabParam ? tabParam : publisherRoadmaps[0]?.id || ""
  );
  const [section, setSection] = useState<"grade" | "publisher">(
    isPublisherTab ? "publisher" : "grade"
  );

  // URL 파라미터 변경 시 탭 동기화
  useEffect(() => {
    if (!tabParam) return;
    if (gradeRoadmaps.some((r) => r.id === tabParam)) {
      setSection("grade");
      setActiveGradeTab(tabParam);
    } else if (publisherRoadmaps.some((r) => r.id === tabParam)) {
      setSection("publisher");
      setActivePublisherTab(tabParam);
    }
  }, [tabParam, gradeRoadmaps, publisherRoadmaps]);

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
          activeTab={activeGradeTab}
          setActiveTab={setActiveGradeTab}
          renderDescription={(rm) => (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <LevelBadge level={Math.min(rm.targetStartLevel, 5) as DifficultyLevel} size="sm" />
                <span className="text-muted-foreground mx-1">&rarr;</span>
                <LevelBadge level={Math.min(rm.targetEndLevel, 5) as DifficultyLevel} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">{rm.description}</p>
            </div>
          )}
        />
      )}

      {section === "publisher" && (
        <RoadmapSection
          roadmapList={publisherRoadmaps}
          activeTab={activePublisherTab}
          setActiveTab={setActivePublisherTab}
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
