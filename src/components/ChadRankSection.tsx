import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import legendGigachad from "@/assets/legend-gigachad.jpg";
import legendBabystickly from "@/assets/legend-babystickly.jpg";
import legendClavicular from "@/assets/legend-clavicular.webp";
import { cn } from "@/lib/utils";

const legends = [
  { name: "Competitor One", rank: 1, image: legendGigachad },
  { name: "Competitor Two", rank: 2, image: legendBabystickly },
  { name: "Competitor Three", rank: 3, image: legendClavicular },
];

const ChadRankSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="bg-background py-ds-4 lg:py-ds-5">
      <div className="container mx-auto px-ds-2 sm:px-ds-3">
        <div className="grid grid-cols-1 items-start gap-ds-4 md:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)] md:gap-ds-5">
          <div
            className={cn(
              "text-left md:order-2 md:text-right",
              isVisible ? "animate-fade-in" : "opacity-0",
            )}
          >
            <h2 className="text-stat uppercase leading-[0.8] text-foreground">
              <span className="block">Top</span>
              <span className="block text-primary">Competitors</span>
            </h2>
          </div>

          <div className={cn("w-full md:order-1", isVisible ? "animate-fade-in" : "opacity-0")}>
            <div className="grid grid-cols-[auto_1fr] gap-ds-2 border-b-2 border-foreground pb-ds-2 sm:grid-cols-[auto_auto_1fr] sm:gap-ds-3">
              <span className="text-meta uppercase tracking-widest">Rank</span>
              <span className="hidden text-meta uppercase tracking-widest sm:block" />
              <span className="text-meta uppercase tracking-widest">Name</span>
            </div>

            {legends.map((legend, i) => (
              <div
                key={legend.name}
                className={cn(
                  "grid grid-cols-[auto_1fr] items-center gap-ds-2 border-b border-border py-ds-3 sm:grid-cols-[auto_auto_1fr] sm:gap-ds-3",
                  legend.rank === 1 && "border-l-4 border-l-primary bg-primary/5 pl-ds-2",
                  isVisible ? "animate-fade-in-up" : "opacity-0",
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className={cn(
                    "text-stat-sm leading-none",
                    legend.rank === 1 ? "text-primary" : "text-border",
                  )}
                >
                  #{legend.rank}
                </span>
                <img
                  src={legend.image}
                  alt={legend.name}
                  className={cn(
                    "hidden h-16 w-16 rounded-full object-cover sm:block",
                    legend.rank === 1 ? "border-2 border-primary shadow-primary-glow-sm" : "border-2 border-border",
                  )}
                />
                <span className="text-section tracking-tight text-foreground">{legend.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChadRankSection;
