"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/hooks/auth-context";

const AUTO_DISMISS_MS = 4000;

export function ErrorToast() {
  const { error } = useAuthContext() as { error?: string | null };
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!error) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [error]);

  if (!error || !visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-lg"
    >
      {error}
    </div>
  );
}
