import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  accent?: boolean; // hebt diese Karte mit Magenta-Akzent hervor
}

export function KpiCard({ title, value, description, accent }: KpiCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-colors",
        accent && "border-accent/40"
      )}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-accent"
        />
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums text-foreground">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="mt-1 h-3 w-20" />
      </CardContent>
    </Card>
  );
}
