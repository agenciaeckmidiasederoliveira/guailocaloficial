import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import { forwardRef } from "react";

interface BadgePremiumProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BadgePremium = forwardRef<HTMLSpanElement, BadgePremiumProps>(
  ({ className, size = "md" }, ref) => {
    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
      lg: "px-4 py-1.5 text-base",
    };

    const iconSizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 font-semibold text-white shadow-md premium-glow",
          sizeClasses[size],
          className
        )}
      >
        <Crown className={iconSizes[size]} />
        Premium
      </span>
    );
  }
);

BadgePremium.displayName = "BadgePremium";
