import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
};

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <Card className="border-white/70 bg-white/85">
      <CardContent className="space-y-3 p-5">
        <Badge variant="outline" className="w-fit">
          {label}
        </Badge>
        <div className="space-y-1">
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
