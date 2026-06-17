import { getCatalog } from "@/lib/db/catalog";
import { DashboardWorkbooksView } from "./DashboardWorkbooksView";

export const dynamic = "force-dynamic";

export default async function MyWorkbooksPage() {
  const { workbooks, publishers } = await getCatalog();
  return <DashboardWorkbooksView workbooks={workbooks} publishers={publishers} />;
}
