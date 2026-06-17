"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();
  return (
    <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 gap-1 -ml-2">
      <ArrowLeft className="h-4 w-4" />
      뒤로
    </Button>
  );
}
