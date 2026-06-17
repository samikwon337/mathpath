import { getCatalog } from "@/lib/db/catalog";
import { HomeView } from "./HomeView";

export default async function Page() {
  const { workbooks, publishers, relations, roadmaps } = await getCatalog();
  return (
    <HomeView
      workbooks={workbooks}
      publishers={publishers}
      relations={relations}
      roadmaps={roadmaps}
    />
  );
}
