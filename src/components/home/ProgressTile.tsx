import { BentoTile } from "./BentoTile";
import { Progress } from "@/components/ui/progress";

export function ProgressTile({ pct }: { pct: number }) {
  return (
    <BentoTile>
      <p className="text-sm text-muted-foreground">달성률</p>
      <p className="mt-1 text-3xl font-extrabold">{pct}%</p>
      <Progress value={pct} className="mt-2 h-2" />
    </BentoTile>
  );
}
