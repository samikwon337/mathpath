"use client";

import { useMemo } from "react";
import { useAuthContext } from "@/hooks/auth-context";
import { getHomeTiles, type HomeTileKey } from "@/components/home/homeTiles";
import { BentoGrid } from "@/components/home/BentoGrid";
import { HeroTile } from "@/components/home/HeroTile";
import { QuickRecommendTile } from "@/components/home/QuickRecommendTile";
import { GradeRoadmapTile } from "@/components/home/GradeRoadmapTile";
import { PublisherLineupTile } from "@/components/home/PublisherLineupTile";
import { LevelShortcutTile } from "@/components/home/LevelShortcutTile";
import { EmptyRoadmapTile } from "@/components/home/EmptyRoadmapTile";
import { GreetingStatsTile } from "@/components/home/GreetingStatsTile";
import { ProgressTile } from "@/components/home/ProgressTile";
import { AddBookTile } from "@/components/home/AddBookTile";
import { MyRoadmapTile } from "@/components/home/MyRoadmapTile";
import { NextStepsTile } from "@/components/home/NextStepsTile";
import { MyBooksTile } from "@/components/home/MyBooksTile";
import { useMyRoadmapData } from "@/components/home/useMyRoadmapData";
import type { Workbook, Publisher, WorkbookRelation, Roadmap } from "@/data/types";

export interface HomeViewProps {
  workbooks: Workbook[];
  publishers: Publisher[];
  relations: WorkbookRelation[];
  roadmaps: Roadmap[];
}

export function HomeView({ workbooks, publishers, relations, roadmaps }: HomeViewProps) {
  const { isLoggedIn, profile } = useAuthContext();

  const workbooksById = useMemo(
    () => new Map(workbooks.map((w) => [w.id, w])),
    [workbooks]
  );
  const publisherName = (id: string) => publishers.find((p) => p.id === id)?.name ?? "";

  const my = useMyRoadmapData(workbooksById, relations);

  const tiles = getHomeTiles({ isLoggedIn, hasWorkbooks: my.hasWorkbooks });

  const renderTile = (key: HomeTileKey) => {
    switch (key) {
      case "hero":
        return <HeroTile />;
      case "quickRecommend":
        return <QuickRecommendTile workbooks={workbooks} publishers={publishers} />;
      case "gradeRoadmap":
      case "recommendedRoadmap":
        return <GradeRoadmapTile roadmaps={roadmaps} />;
      case "publisherLineup":
        return <PublisherLineupTile roadmaps={roadmaps} />;
      case "levelShortcut":
        return <LevelShortcutTile />;
      case "emptyRoadmap":
        return <EmptyRoadmapTile />;
      case "greetingStats":
        return (
          <GreetingStatsTile
            displayName={profile?.displayName}
            completed={my.stats.completed}
            inProgress={my.stats.inProgress}
            planned={my.stats.planned}
          />
        );
      case "progress":
        return <ProgressTile pct={my.stats.pct} />;
      case "addBook":
        return <AddBookTile />;
      case "myRoadmap":
        return (
          <MyRoadmapTile
            nodes={my.nodes}
            edges={my.edges}
            suggestedNext={my.suggestedNext}
            publishers={publishers}
          />
        );
      case "nextSteps":
        return <NextStepsTile suggestedNext={my.suggestedNext} publisherName={publisherName} />;
      case "myBooks":
        return <MyBooksTile nodes={my.nodes} publisherName={publisherName} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <BentoGrid>
        {tiles.map((t) => (
          <div key={t.key} className={t.span}>
            {renderTile(t.key)}
          </div>
        ))}
      </BentoGrid>
    </div>
  );
}
