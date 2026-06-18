"use client";

import { useState, useCallback, useEffect } from "react";
import { Profile, UserWorkbook, WorkbookStatus } from "@/data/types";
import { supabase } from "@/lib/supabase";
import {
  fetchUserWorkbooks,
  upsertUserWorkbook,
  deleteUserWorkbook,
  fetchProfile,
} from "@/lib/db/user-data";
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
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [uws, prof] = await Promise.all([
        fetchUserWorkbooks(userId),
        fetchProfile(userId),
      ]);
      setUserWorkbooks(uws);
      if (prof) setProfile(prof);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // 초기 세션 확인 + 세션 변경 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setProfile(userToProfile(session.user));
        loadUserData(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setProfile(userToProfile(session.user));
        loadUserData(session.user.id);
      } else {
        setIsLoggedIn(false);
        setProfile(null);
        setUserWorkbooks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

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
    async (workbookId: string, status: WorkbookStatus) => {
      const userId = profile?.id;
      if (!userId) return;
      const snapshot = userWorkbooks;
      const now = new Date().toISOString().split("T")[0];
      const existing = snapshot.find((uw) => uw.workbookId === workbookId);
      const startedAt =
        status === "in_progress" && !existing?.startedAt
          ? now
          : existing?.startedAt;
      const completedAt = status === "completed" ? now : undefined;

      setUserWorkbooks((prev) => {
        const found = prev.find((uw) => uw.workbookId === workbookId);
        if (found) {
          return prev.map((uw) =>
            uw.workbookId === workbookId
              ? { ...uw, status, startedAt, completedAt }
              : uw
          );
        }
        return [
          ...prev,
          {
            id: `uw-${Date.now()}`,
            userId,
            workbookId,
            status,
            startedAt,
            completedAt,
          },
        ];
      });

      try {
        await upsertUserWorkbook({
          userId,
          workbookId,
          status,
          startedAt,
          completedAt,
        });
      } catch (e) {
        setUserWorkbooks(snapshot); // 롤백
        setError((e as Error).message);
      }
    },
    [profile, userWorkbooks]
  );

  const removeWorkbook = useCallback(
    async (workbookId: string) => {
      const userId = profile?.id;
      if (!userId) return;
      const snapshot = userWorkbooks;
      setUserWorkbooks((prev) =>
        prev.filter((uw) => uw.workbookId !== workbookId)
      );
      try {
        await deleteUserWorkbook(userId, workbookId);
      } catch (e) {
        setUserWorkbooks(snapshot); // 롤백
        setError((e as Error).message);
      }
    },
    [profile, userWorkbooks]
  );

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
    error,
    login,
    logout,
    updateWorkbookStatus,
    removeWorkbook,
    getWorkbookStatus,
    setProfile,
  };
}
