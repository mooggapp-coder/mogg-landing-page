import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import legendGigachad from "@/assets/legend-gigachad.jpg";
import legendBabystickly from "@/assets/legend-babystickly.jpg";
import legendClavicular from "@/assets/legend-clavicular.webp";

const legends = [
  { name: "Competitor One", score: 2480, rank: 1, image: legendGigachad },
  { name: "Competitor Two", score: 2310, rank: 2, image: legendBabystickly },
  { name: "Competitor Three", score: 2150, rank: 3, image: legendClavicular },
];

const ChadRankSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-6 flex flex-col items-center">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <h2
            className={`text-page-title ${isVisible ? "animate-fade-in" : "opacity-0"}`}
          >
            Top <span className="text-primary">competitors</span>
          </h2>
          <span
            className={`inline-flex items-center gap-2 bg-primary text-primary-foreground text-meta font-bold px-4 py-2 rounded-full uppercase tracking-wide ${isVisible ? "animate-fade-in" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse-dot" />
            Live rankings
          </span>
        </div>
        <p
          className={`text-meta mb-8 ${isVisible ? "animate-fade-in" : "opacity-0"}`}
          style={{ animationDelay: "0.15s" }}
        >
          Updated daily — climb or fall
        </p>

        <div className="max-w-3xl w-full mx-auto">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_72px_1fr_100px] md:grid-cols-[80px_88px_1fr_120px] border-b-2 border-foreground pb-3 mb-0">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display">Rank</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display"></span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display">Name</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display text-right">Points</span>
          </div>

          {legends
            .sort((a, b) => a.rank - b.rank)
            .map((legend, i) => (
              <div
                key={legend.name}
                className={`grid grid-cols-[60px_72px_1fr_100px] md:grid-cols-[80px_88px_1fr_120px] items-center py-5 border-b border-border ${
                  legend.rank === 1 ? "border-l-4 border-l-primary pl-4 bg-primary/5" : ""
                } ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${(legends.length - i) * 150}ms` }}
              >
                <span
                  className={`text-5xl md:text-7xl font-bold font-display leading-none ${
                    legend.rank === 1 ? "text-primary" : "text-border"
                  }`}
                >
                  #{legend.rank}
                </span>
                <div className="relative flex items-center justify-center">
                  <img
                    src={legend.image}
                    alt={legend.name}
                    className={`relative z-10 w-18 h-18 md:w-20 md:h-20 rounded-full object-cover ${
                      legend.rank === 1 ? "border-2 border-primary" : "border-2 border-border"
                    }`}
                  />
                </div>
                <span className="text-lg md:text-xl font-semibold font-body">
                  {legend.name}
                </span>
                <span className="text-lg md:text-xl font-semibold font-body text-right text-muted-foreground">
                  {legend.score.toLocaleString()} pts
                </span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default ChadRankSection;
