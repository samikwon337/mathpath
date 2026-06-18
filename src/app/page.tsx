import { getCatalog } from "@/lib/db/catalog";
import { HomeView } from "./HomeView";

// 카탈로그는 Supabase에서 읽으므로 빌드 시점 정적 프리렌더 대신 요청 시 동적 렌더한다
// (빌드가 DB 가용성에 의존하지 않게 하고, 카탈로그 변경이 즉시 반영되게 함).
export const dynamic = "force-dynamic";

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
