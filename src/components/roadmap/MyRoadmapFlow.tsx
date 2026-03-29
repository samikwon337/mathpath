"use client";

import { useMemo, useCallback } from "react";
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
import { CheckCircle, BookOpen, ClipboardList, Plus } from "lucide-react";
import { DifficultyLevel, WorkbookStatus } from "@/data/types";
import { MyRoadmapNode as MyRoadmapNodeData } from "@/lib/api";
import { getPublisherById } from "@/lib/api";

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

const STATUS_BORDER: Record<WorkbookStatus, string> = {
  completed: "#22c55e",
  in_progress: "#3b82f6",
  planned: "#94a3b8",
};

const STATUS_BG: Record<WorkbookStatus, string> = {
  completed: "#f0fdf4",
  in_progress: "#eff6ff",
  planned: "#f8fafc",
};

function MyWorkbookNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    publisher: string;
    level: DifficultyLevel;
    status: WorkbookStatus;
    startedAt?: string;
    completedAt?: string;
  };

  const StatusIcon =
    d.status === "completed"
      ? CheckCircle
      : d.status === "in_progress"
        ? BookOpen
        : ClipboardList;

  return (
    <div
      className="relative rounded-lg border-2 px-4 py-3 shadow-sm cursor-pointer transition-transform hover:scale-105"
      style={{
        backgroundColor: STATUS_BG[d.status],
        borderColor: STATUS_BORDER[d.status],
        minWidth: 170,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />

      {/* Status icon */}
      <div
        className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px]"
        style={{ backgroundColor: STATUS_BORDER[d.status] }}
      >
        <StatusIcon className="h-3.5 w-3.5" />
      </div>

      {/* Level dot */}
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: LEVEL_BORDER[d.level] }}
        />
        <span className="text-[10px] font-medium" style={{ color: LEVEL_BORDER[d.level] }}>
          Lv.{d.level}
        </span>
      </div>

      <div className="text-sm font-semibold">{d.label}</div>
      <div className="text-[10px] text-gray-500">{d.publisher}</div>

      {/* Date info */}
      {d.completedAt && (
        <div className="text-[9px] text-emerald-600 mt-1">{d.completedAt} 완료</div>
      )}
      {!d.completedAt && d.startedAt && (
        <div className="text-[9px] text-blue-600 mt-1">{d.startedAt} 시작</div>
      )}
    </div>
  );
}

function SuggestNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    publisher: string;
    level: DifficultyLevel;
    reason: string;
  };

  return (
    <div
      className="relative rounded-lg border-2 border-dashed px-4 py-3 shadow-sm cursor-pointer transition-transform hover:scale-105 bg-white/80"
      style={{ borderColor: LEVEL_BORDER[d.level], minWidth: 170, opacity: 0.8 }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />

      <div className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center text-white">
        <Plus className="h-3.5 w-3.5" />
      </div>

      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: LEVEL_BORDER[d.level] }}
        />
        <span className="text-[10px] font-medium" style={{ color: LEVEL_BORDER[d.level] }}>
          Lv.{d.level}
        </span>
      </div>

      <div className="text-sm font-semibold">{d.label}</div>
      <div className="text-[10px] text-gray-500">{d.publisher}</div>
      <div className="text-[9px] text-violet-600 mt-1">{d.reason}</div>
    </div>
  );
}

const nodeTypes = { myWorkbook: MyWorkbookNode, suggest: SuggestNode };

export function MyRoadmapFlow({
  myNodes,
  myEdges,
  suggestedNext,
  height = 350,
}: {
  myNodes: MyRoadmapNodeData[];
  myEdges: { from: string; to: string; type: string; note?: string }[];
  suggestedNext: { id: string; title: string; publisherId: string; difficultyLevel: number; reason: string }[];
  height?: number;
}) {
  const router = useRouter();

  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Group by difficulty level for column layout
    const levelGroups = new Map<number, MyRoadmapNodeData[]>();
    for (const n of myNodes) {
      const lv = n.workbook.difficultyLevel;
      const group = levelGroups.get(lv) || [];
      group.push(n);
      levelGroups.set(lv, group);
    }

    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    let colIndex = 0;

    for (const level of sortedLevels) {
      const group = levelGroups.get(level) || [];
      group.forEach((n, rowIndex) => {
        const publisher = getPublisherById(n.workbook.publisherId);
        nodes.push({
          id: n.workbook.id,
          type: "myWorkbook",
          position: { x: colIndex * 250, y: rowIndex * 110 },
          data: {
            label: n.workbook.title,
            publisher: publisher?.name || "",
            level: n.workbook.difficultyLevel as DifficultyLevel,
            status: n.status,
            startedAt: n.startedAt,
            completedAt: n.completedAt,
          },
        });
      });
      colIndex++;
    }

    // Add edges
    for (const e of myEdges) {
      edges.push({
        id: `e-${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        animated: e.type === "next_step",
        style: {
          stroke: e.type === "complement" ? "#94a3b8" : "#6366f1",
          strokeDasharray: e.type === "complement" ? "5,5" : undefined,
          strokeWidth: 2,
        },
      });
    }

    // Add suggested next nodes
    if (suggestedNext.length > 0) {
      const maxCol = colIndex;
      suggestedNext.forEach((s, idx) => {
        const publisher = getPublisherById(s.publisherId);
        const suggestId = `suggest-${s.id}`;
        nodes.push({
          id: suggestId,
          type: "suggest",
          position: { x: maxCol * 250, y: idx * 110 },
          data: {
            label: s.title,
            publisher: publisher?.name || "",
            level: s.difficultyLevel as DifficultyLevel,
            reason: s.reason,
          },
        });

        // Find which user workbook links to this suggestion
        for (const e of myEdges) {
          // Not from myEdges - we need to check the original suggestion source
        }
        // Connect from last completed/in_progress node at highest level
        const lastNode = myNodes[myNodes.length - 1];
        if (lastNode && idx === 0) {
          edges.push({
            id: `e-${lastNode.workbook.id}-${suggestId}`,
            source: lastNode.workbook.id,
            target: suggestId,
            animated: false,
            style: { stroke: "#8b5cf6", strokeDasharray: "5,5", strokeWidth: 2 },
          });
        }
        if (idx > 0) {
          const prevSuggest = `suggest-${suggestedNext[idx - 1].id}`;
          edges.push({
            id: `e-${prevSuggest}-${suggestId}`,
            source: prevSuggest,
            target: suggestId,
            animated: false,
            style: { stroke: "#8b5cf6", strokeDasharray: "5,5", strokeWidth: 2 },
          });
        }
      });
    }

    return { nodes, edges };
  }, [myNodes, myEdges, suggestedNext]);

  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edges, , onEdgesChange] = useEdgesState(flowEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const id = node.id;
      if (id.startsWith("suggest-")) {
        router.push(`/workbooks/${id.replace("suggest-", "")}`);
      } else {
        router.push(`/workbooks/${id}`);
      }
    },
    [router]
  );

  if (myNodes.length === 0) return null;

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-950 overflow-hidden" style={{ height }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
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
