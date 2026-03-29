import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))]">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-white/70 bg-white/85">
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-white/70 bg-white/85">
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((__, itemIndex) => (
                <Skeleton key={itemIndex} className="h-24 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
