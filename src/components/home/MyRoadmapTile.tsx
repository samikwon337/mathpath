import { BentoTile } from "./BentoTile";
import { MyRoadmapFlow } from "@/components/roadmap/MyRoadmapFlow";
import type { Publisher } from "@/data/types";
import type { MyRoadmapNode, MyRoadmapEdge } from "@/lib/transform";

interface MyRoadmapTileProps {
  nodes: MyRoadmapNode[];
  edges: MyRoadmapEdge[];
  suggestedNext: Parameters<typeof MyRoadmapFlow>[0]["suggestedNext"];
  publishers: Publisher[];
}

export function MyRoadmapTile({ nodes, edges, suggestedNext, publishers }: MyRoadmapTileProps) {
  return (
    <BentoTile className="p-3">
      <MyRoadmapFlow
        myNodes={nodes}
        myEdges={edges}
        suggestedNext={suggestedNext.slice(0, 2)}
        publishers={publishers}
        height={Math.max(300, nodes.length * 60 + 100)}
      />
    </BentoTile>
  );
}
