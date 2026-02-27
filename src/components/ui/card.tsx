import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Card variants
// ---------------------------------------------------------------------------

const cardVariants = cva(
  "rounded-lg border text-card-foreground shadow-sm transition-shadow",
  {
    variants: {
      variant: {
        default: "border-border bg-card",
        glass:
          "border-border/50 bg-card/60 backdrop-blur-md supports-[backdrop-filter]:bg-card/40",
      },
      hover: {
        true: "hover:border-primary/50 hover:shadow-gold-md",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: false,
    },
  },
);

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover }), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

// ---------------------------------------------------------------------------
// CardHeader
// ---------------------------------------------------------------------------

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// ---------------------------------------------------------------------------
// CardTitle
// ---------------------------------------------------------------------------

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-foreground",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// ---------------------------------------------------------------------------
// CardDescription
// ---------------------------------------------------------------------------

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// ---------------------------------------------------------------------------
// CardContent
// ---------------------------------------------------------------------------

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// ---------------------------------------------------------------------------
// CardFooter
// ---------------------------------------------------------------------------

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
