import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import legendGigachad from "@/assets/legend-gigachad.jpg";
import legendBabystickly from "@/assets/legend-babystickly.jpg";
import legendClavicular from "@/assets/legend-clavicular.webp";

const legends = [
  { name: "Giga Chad", score: 9.5, rank: 1, image: legendGigachad },
  { name: "Baby Stickly", score: 8.0, rank: 2, image: legendBabystickly },
  { name: "Clavicular", score: 7.8, rank: 3, image: legendClavicular },
];

const ChadRankSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-6 flex flex-col items-center">
        <div className="flex flex-col items-center gap-3 mb-2 text-center">
          <h2
            className={`text-4xl md:text-6xl font-black font-display ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
          >
            The Current <span className="text-primary">Legends</span>
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full font-body ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse-dot" />
            LIVE
          </span>
        </div>
        <p
          className={`text-xs text-muted-foreground font-body mb-12 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.3s" }}
        >
          Updated daily
        </p>

        <div className="max-w-3xl w-full mx-auto">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_72px_1fr_100px] md:grid-cols-[80px_88px_1fr_120px] border-b-2 border-foreground pb-3 mb-0">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display">Rank</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display"></span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display">Name</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display text-right">Score</span>
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
                  {legend.score} / 10
                </span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default ChadRankSection;
