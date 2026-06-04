import { Card, CardContent } from "@/components/ui/card";
import type { WidgetProps } from "@/lib/widgets/types";

export interface TextBlockConfig {
  /** Reiner Text (Plain). Markdown-Support kommt in Phase F. */
  text: string;
  /** Optional als Section-Header darstellen */
  variant?: "body" | "heading";
}

export function TextBlockWidget({
  config,
  title,
}: WidgetProps<TextBlockConfig>) {
  const variant = config.variant ?? "body";

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col justify-center p-5">
        {title && (
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            {title}
          </h3>
        )}
        {variant === "heading" ? (
          <p className="text-lg font-semibold text-foreground">{config.text}</p>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {config.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
