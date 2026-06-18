import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-xl font-bold">문제집을 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">존재하지 않거나 비활성화된 문제집입니다.</p>
      <Link href="/workbooks">
        <Button className="mt-4">문제집 목록으로</Button>
      </Link>
    </div>
  );
}
