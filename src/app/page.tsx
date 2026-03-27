import Link from "next/link";
import { ArrowRight, BookOpen, Map, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge } from "@/components/workbook/LevelBadge";
import { DifficultyLevel } from "@/data/types";

const FEATURES = [
  {
    icon: BookOpen,
    title: "문제집 카탈로그",
    desc: "과목, 난이도, 유형별로 40+ 문제집을 한눈에 비교하세요",
  },
  {
    icon: Map,
    title: "학습 로드맵",
    desc: "등급별 맞춤 경로를 플로우차트로 시각화합니다",
  },
  {
    icon: BarChart3,
    title: "달성도 추적",
    desc: "문제집 풀이 진행도를 기록하고 성장을 확인하세요",
  },
];

const LEVELS: { level: DifficultyLevel; examples: string[] }[] = [
  { level: 1, examples: ["풍산자", "개념쎈", "베이직쎈"] },
  { level: 2, examples: ["라이트쎈", "RPM", "올림포스"] },
  { level: 3, examples: ["쎈", "마플시너지", "자이스토리"] },
  { level: 4, examples: ["블랙라벨", "고쟁이", "일등급수학"] },
  { level: 5, examples: ["절대등급", "최강TOT", "수학의신"] },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              2022 개정 교육과정 기준
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              나에게 맞는
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                수학 문제집
              </span>
              을 찾아보세요
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              실력에 맞는 문제집 추천, 단계별 로드맵, 풀이 달성도 추적까지.
              <br className="hidden sm:block" />
              MathPath와 함께 체계적으로 수학을 정복하세요.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/workbooks">
                <Button size="lg" className="gap-2">
                  문제집 둘러보기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/roadmap">
                <Button variant="outline" size="lg" className="gap-2">
                  <Map className="h-4 w-4" />
                  로드맵 보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border-0 shadow-none bg-muted/50">
                <CardContent className="p-6">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Difficulty Levels Preview */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold md:text-3xl">5단계 난이도 체계</h2>
          <p className="mt-2 text-muted-foreground">
            자신의 실력에 맞는 단계부터 시작하세요
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LEVELS.map(({ level, examples }) => (
            <Card key={level} className="text-center">
              <CardContent className="p-4">
                <div className="flex justify-center mb-2">
                  <LevelBadge level={level} size="md" />
                </div>
                <div className="mt-2 space-y-1">
                  {examples.map((name) => (
                    <p key={name} className="text-xs text-muted-foreground">
                      {name}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/workbooks">
            <Button variant="outline" className="gap-2">
              전체 문제집 보기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Roadmap Preview */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold md:text-3xl">등급별 학습 로드맵</h2>
            <p className="mt-2 text-muted-foreground">
              목표 등급에 맞는 문제집 순서를 확인하세요
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "5등급 → 3등급", desc: "풍산자 → 라이트쎈 → 쎈 → 자이스토리", color: "from-emerald-500 to-blue-500" },
              { name: "3등급 → 2등급", desc: "개념원리 → 쎈 → 일품 → 마플기출", color: "from-blue-500 to-violet-500" },
              { name: "2등급 → 1등급", desc: "정석(기본) → 블랙라벨 → 절대등급 → 기출", color: "from-violet-500 to-orange-500" },
              { name: "만점 목표", desc: "정석(실력) → 최강TOT → 기출 반복", color: "from-orange-500 to-red-500" },
            ].map((rm) => (
              <Card key={rm.name}>
                <CardContent className="p-4">
                  <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${rm.color} mb-3`} />
                  <h3 className="font-semibold">{rm.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{rm.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/roadmap">
              <Button className="gap-2">
                로드맵 자세히 보기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
