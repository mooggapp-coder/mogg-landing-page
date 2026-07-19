import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-ds-1 whitespace-nowrap rounded-md text-base font-body ring-offset-background transition-[transform,box-shadow,background-color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "h-btn-primary min-h-btn-primary w-full sm:w-auto px-ds-3 font-bold bg-primary text-primary-foreground shadow-primary-glow hover:bg-primary/90 active:scale-[0.97] active:shadow-primary-glow-sm",
        destructive:
          "h-btn-primary min-h-btn-primary w-full sm:w-auto px-ds-3 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.97]",
        outline:
          "h-btn-secondary min-h-btn-secondary px-ds-3 font-semibold border border-border bg-transparent text-foreground hover:bg-secondary active:scale-[0.98]",
        secondary:
          "h-btn-secondary min-h-btn-secondary px-ds-3 font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost:
          "h-btn-secondary min-h-btn-secondary px-ds-2 font-medium hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link: "h-auto p-0 text-meta text-muted-foreground underline-offset-4 hover:underline hover:text-foreground font-medium",
      },
      size: {
        default: "",
        sm: "h-btn-secondary min-h-btn-secondary px-ds-2 text-sm",
        lg: "",
        icon: "h-btn-secondary min-h-btn-secondary w-12 min-w-12 p-0",
        link: "h-auto min-h-0 p-0 w-auto",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        class: "h-auto min-h-0 w-auto px-0 shadow-none active:scale-100",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const resolvedSize = variant === "link" ? "link" : size;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size: resolvedSize, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
