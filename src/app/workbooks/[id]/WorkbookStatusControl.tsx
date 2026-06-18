"use client";

import { StatusToggle } from "@/components/workbook/StatusToggle";
import { useAuthContext } from "@/hooks/auth-context";

export function WorkbookStatusControl({ workbookId }: { workbookId: string }) {
  const { isLoggedIn, getWorkbookStatus, updateWorkbookStatus, removeWorkbook } = useAuthContext();
  if (!isLoggedIn) return null;
  const userStatus = getWorkbookStatus(workbookId);
  return (
    <div className="flex justify-center">
      <StatusToggle
        status={userStatus?.status}
        onStatusChange={(s) => updateWorkbookStatus(workbookId, s)}
        onAdd={() => updateWorkbookStatus(workbookId, "planned")}
        onRemove={() => removeWorkbook(workbookId)}
        size="md"
      />
    </div>
  );
}
