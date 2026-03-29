import { Skeleton } from "@/components/ui/skeleton";

export function ScheduleSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 w-full border border-white/70 bg-white/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-32 w-full border border-white/70 bg-white/70"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-36 w-full border border-white/70 bg-white/70"
          />
        ))}
      </div>
      <Skeleton className="h-24 w-full border border-white/70 bg-white/70" />
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-80 w-full border border-white/70 bg-white/70"
          />
        ))}
      </div>
    </div>
  );
}
