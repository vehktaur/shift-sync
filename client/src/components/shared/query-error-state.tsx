import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type QueryErrorStateProps = {
  badgeLabel: string;
  title: string;
  description: string;
  retryLabel?: string;
  onRetry: () => void;
};

export function QueryErrorState({
  badgeLabel,
  title,
  description,
  retryLabel = "Try again",
  onRetry,
}: QueryErrorStateProps) {
  return (
    <Card className="border-white/70 bg-white/85">
      <CardHeader>
        <Badge variant="critical" className="w-fit">
          {badgeLabel}
        </Badge>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRetry}>{retryLabel}</Button>
      </CardContent>
    </Card>
  );
}
