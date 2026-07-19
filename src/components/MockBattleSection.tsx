import jordanPhoto from "@/assets/demo-jordan.jpg";
import chicoPhoto from "@/assets/demo-chico.jpg";
import { cn } from "@/lib/utils";

/**
 * Full-bleed visual mock battle — not interactive.
 * Placed between hero and the live arena demo.
 */
const MockBattleSection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-background" aria-hidden="true">
      <div className="relative grid grid-cols-1 md:grid-cols-2">
        <div
          className={cn(
            "group relative min-h-[42dvh] overflow-hidden md:min-h-[70dvh]",
            "motion-safe:transition-transform motion-safe:duration-500",
            "hover:scale-[1.02]",
          )}
        >
          <img
            src={jordanPhoto}
            alt=""
            className="h-full w-full object-cover object-center"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/20" />
        </div>

        <div
          className={cn(
            "group relative min-h-[42dvh] overflow-hidden md:min-h-[70dvh]",
            "motion-safe:transition-transform motion-safe:duration-500",
            "hover:scale-[1.02]",
          )}
        >
          <img
            src={chicoPhoto}
            alt=""
            className="h-full w-full object-cover object-center"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 to-transparent md:bg-gradient-to-l md:from-transparent md:to-background/20" />
        </div>

        {/* VS badge — centered on seam (overlap on mobile stack) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="vs-badge animate-pulse-glow shadow-primary-glow">VS</div>
        </div>
      </div>
    </section>
  );
};

export default MockBattleSection;
