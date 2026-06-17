import { getCatalog } from "@/lib/db/catalog";
import { WorkbookBrowser } from "./WorkbookBrowser";

export default async function WorkbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; publisher?: string }>;
}) {
  const sp = await searchParams;
  const { workbooks, publishers, subjects } = await getCatalog();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <WorkbookBrowser
        workbooks={workbooks}
        publishers={publishers}
        subjects={subjects}
        initialLevel={sp.level ? Number(sp.level) : undefined}
        initialPublisherId={sp.publisher}
      />
    </div>
  );
}
