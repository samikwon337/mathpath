"use client";

import { useState, useCallback } from "react";
import { Profile, UserWorkbook, WorkbookStatus } from "@/data/types";

const MOCK_PROFILE: Profile = {
  id: "user-mock",
  displayName: "테스트 학생",
  avatarUrl: undefined,
  currentGrade: "high2",
  currentLevel: 3,
  targetLevel: 1,
};

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userWorkbooks, setUserWorkbooks] = useState<UserWorkbook[]>([]);

  const login = useCallback(() => {
    setIsLoggedIn(true);
    setProfile(MOCK_PROFILE);
    // Load mock user workbooks
    setUserWorkbooks([
      {
        id: "uw-1",
        userId: "user-mock",
        workbookId: "wb-gaenyeomwonri",
        status: "completed",
        startedAt: "2025-01-15",
        completedAt: "2025-02-20",
      },
      {
        id: "uw-2",
        userId: "user-mock",
        workbookId: "wb-rpm",
        status: "completed",
        startedAt: "2025-02-25",
        completedAt: "2025-03-20",
      },
      {
        id: "uw-3",
        userId: "user-mock",
        workbookId: "wb-ssen",
        status: "in_progress",
        startedAt: "2025-03-22",
      },
      {
        id: "uw-4",
        userId: "user-mock",
        workbookId: "wb-jaistory",
        status: "planned",
      },
    ]);
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setProfile(null);
    setUserWorkbooks([]);
  }, []);

  const updateWorkbookStatus = useCallback(
    (workbookId: string, status: WorkbookStatus) => {
      setUserWorkbooks((prev) => {
        const existing = prev.find((uw) => uw.workbookId === workbookId);
        const now = new Date().toISOString().split("T")[0];

        if (existing) {
          return prev.map((uw) =>
            uw.workbookId === workbookId
              ? {
                  ...uw,
                  status,
                  startedAt:
                    status === "in_progress" && !uw.startedAt
                      ? now
                      : uw.startedAt,
                  completedAt: status === "completed" ? now : undefined,
                }
              : uw
          );
        } else {
          return [
            ...prev,
            {
              id: `uw-${Date.now()}`,
              userId: profile?.id || "user-mock",
              workbookId,
              status,
              startedAt: status === "in_progress" ? now : undefined,
              completedAt: status === "completed" ? now : undefined,
            },
          ];
        }
      });
    },
    [profile]
  );

  const removeWorkbook = useCallback((workbookId: string) => {
    setUserWorkbooks((prev) =>
      prev.filter((uw) => uw.workbookId !== workbookId)
    );
  }, []);

  const getWorkbookStatus = useCallback(
    (workbookId: string) => {
      return userWorkbooks.find((uw) => uw.workbookId === workbookId);
    },
    [userWorkbooks]
  );

  return {
    isLoggedIn,
    profile,
    userWorkbooks,
    login,
    logout,
    updateWorkbookStatus,
    removeWorkbook,
    getWorkbookStatus,
    setProfile,
  };
}
