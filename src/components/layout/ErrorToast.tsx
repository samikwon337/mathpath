"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/hooks/auth-context";

const AUTO_DISMISS_MS = 4000;

export function ErrorToast() {
  const { error } = useAuthContext() as { error?: string | null };
  // 자동 소멸: 타이머가 비동기로 dismissed를 갱신하고, 표시 여부는 파생값으로 계산한다
  // (effect 본문에서 동기 setState를 호출하지 않아 cascading render를 피함).
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setDismissed(error), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [error]);

  if (!error || dismissed === error) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-lg"
    >
      {error}
    </div>
  );
}
