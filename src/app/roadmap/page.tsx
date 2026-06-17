import { getCatalog } from "@/lib/db/catalog";
import { RoadmapView } from "./RoadmapView";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const { roadmaps, roadmapSteps, publishers, workbooks } = await getCatalog();
  return (
    <RoadmapView
      roadmaps={roadmaps}
      roadmapSteps={roadmapSteps}
      publishers={publishers}
      workbooks={workbooks}
    />
  );
}
