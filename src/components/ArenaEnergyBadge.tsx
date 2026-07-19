import { useEffect } from "react";
import { Zap } from "lucide-react";
import { trackEnergyDepletedIfZero } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type ArenaEnergyBadgeProps = {
  energy: number | null;
  className?: string;
};

/** Compact lightning + energy count for the app top bar. */
export function ArenaEnergyBadge({ energy, className }: ArenaEnergyBadgeProps) {
  useEffect(() => {
    trackEnergyDepletedIfZero(energy);
  }, [energy]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-2 py-2 text-meta font-medium tabular-nums text-foreground shrink-0",
        className,
      )}
      title="Arena Energy"
      aria-label={energy == null ? "Arena energy loading" : `Arena energy ${energy}`}
    >
      <Zap className="h-3.5 w-3.5 text-primary fill-primary/20" aria-hidden />
      <span key={energy ?? "x"} className="animate-number-pop text-primary">
        {energy == null ? "—" : energy}
      </span>
    </div>
  );
}
