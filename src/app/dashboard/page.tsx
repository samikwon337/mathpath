import { getCatalog } from "@/lib/db/catalog";
import { DashboardView } from "./DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { workbooks } = await getCatalog();
  return <DashboardView workbooks={workbooks} />;
}
