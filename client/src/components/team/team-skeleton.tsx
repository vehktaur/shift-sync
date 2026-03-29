import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamSkeleton() {
  return (
    <div className="space-y-5">
      <Card className="border-white/70 bg-white/85">
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-7 w-52" />
        </CardHeader>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="border-white/70 bg-white/85">
          <CardContent className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-36 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/70 bg-white/85">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
