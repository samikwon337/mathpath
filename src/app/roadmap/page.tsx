"use client";

import { useState, useMemo, useCallback } from "react";
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
import { DifficultyLevel } from "@/data/types";
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

export default function RoadmapPage() {
  const router = useRouter();
  const roadmaps = getRoadmaps();
  const [activeTab, setActiveTab] = useState(roadmaps[0]?.id || "");
  const { isLoggedIn, getWorkbookStatus } = useAuthContext();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const steps = getRoadmapSteps(activeTab);
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Group steps by stepOrder
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

        // Connect from previous column's main node to this node
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
  }, [activeTab, isLoggedIn, getWorkbookStatus]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as { workbookId: string };
      if (data.workbookId) {
        router.push(`/workbooks/${data.workbookId}`);
      }
    },
    [router]
  );

  const activeRoadmap = roadmaps.find((r) => r.id === activeTab);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">학습 로드맵</h1>
        <p className="mt-1 text-muted-foreground">
          등급별 맞춤 문제집 학습 경로를 확인하세요
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {roadmaps.map((rm) => (
            <TabsTrigger key={rm.id} value={rm.id} className="text-sm">
              {rm.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {roadmaps.map((rm) => (
          <TabsContent key={rm.id} value={rm.id}>
            {activeRoadmap && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <LevelBadge level={Math.min(rm.targetStartLevel, 5) as DifficultyLevel} size="sm" />
                      <span className="text-muted-foreground mx-1">→</span>
                      <LevelBadge level={Math.min(rm.targetEndLevel, 5) as DifficultyLevel} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rm.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="rounded-lg border bg-white dark:bg-gray-950 overflow-hidden" style={{ height: 400 }}>
              <ReactFlow
                key={activeTab}
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

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded border-2 border-indigo-500 bg-indigo-50" />
                필수 교재
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded border-2 border-dashed border-gray-400 bg-gray-50" />
                선택 교재
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
