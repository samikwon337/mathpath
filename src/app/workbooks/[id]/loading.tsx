export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="h-8 w-16 rounded bg-muted animate-pulse mb-4" />
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="aspect-[3/4] w-full max-w-[300px] mx-auto rounded-lg bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-20 w-full rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
