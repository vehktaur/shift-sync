import { Skeleton } from "@/components/ui/skeleton";

export function CoverageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 w-full border border-white/70 bg-white/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-28 w-full border border-white/70 bg-white/70"
          />
        ))}
      </div>
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_24rem]">
        <Skeleton className="h-[48rem] w-full border border-white/70 bg-white/70" />
        <Skeleton className="h-[34rem] w-full border border-white/70 bg-white/70" />
      </div>
    </div>
  );
}
