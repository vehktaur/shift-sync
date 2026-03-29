import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1  border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.16em] uppercase",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary/10 text-primary",
        secondary: "border-secondary/50 bg-secondary text-secondary-foreground",
        outline: "border-border/80 bg-background/60 text-foreground",
        warning: "border-amber-500/20 bg-amber-500/12 text-amber-800",
        critical: "border-rose-500/20 bg-rose-500/12 text-rose-700",
        success: "border-emerald-500/20 bg-emerald-500/12 text-emerald-700",
        neutral: "border-slate-500/15 bg-slate-500/10 text-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
