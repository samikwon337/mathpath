"use client";

import { useState, useCallback, useEffect } from "react";
import { Profile, UserWorkbook, WorkbookStatus } from "@/data/types";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

function userToProfile(user: User): Profile {
  return {
    id: user.id,
    displayName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "사용자",
    avatarUrl: user.user_metadata?.avatar_url,
    currentGrade: undefined,
    currentLevel: undefined,
    targetLevel: undefined,
  };
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userWorkbooks, setUserWorkbooks] = useState<UserWorkbook[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 세션 확인 + 세션 변경 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setProfile(userToProfile(session.user));
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setProfile(userToProfile(session.user));
      } else {
        setIsLoggedIn(false);
        setProfile(null);
        setUserWorkbooks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
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
              userId: profile?.id || "",
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
    loading,
    login,
    logout,
    updateWorkbookStatus,
    removeWorkbook,
    getWorkbookStatus,
    setProfile,
  };
}
