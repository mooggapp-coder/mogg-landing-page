import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  {
    tag: "COMPETE",
    title: "Battles",
    description: "Go head-to-head in high-stakes aesthetic battles",
    color: "#FF3B30",
    subs: [
      "Celebrity Battle",
      "Random User Battle — 1 vs random opponent",
      "Direct Battle — challenge a specific person",
      "Live Battle — real-time head-to-head",
      "Squad Battle — team vs team",
    ],
    fullWidth: true,
  },
  {
    tag: "GET RATED",
    title: "Rating",
    description: "Know exactly where you stand, from humans and AI",
    color: "#FF9F0A",
    subs: [
      "AI Rating — precision facial analysis",
      "Community Rating — voted on by real users",
    ],
  },
  {
    tag: "CLIMB",
    title: "Ranking",
    description: "See how you rank against everyone",
    color: "#30D158",
    subs: [
      "Global Ranking — worldwide leaderboard",
      "Local Ranking — your city and region",
      "Feature Ranking — ranked by specific traits (style, eyes, jawline, etc.)",
    ],
  },
  {
    tag: "CONNECT",
    title: "Community",
    description: "The only looksmaxing community built around real competition and real results",
    color: "#0A84FF",
    subs: [
      "Discuss, share, and learn from the top-ranked",
      "Follow your favorite competitors",
      "Community-driven feedback and debates",
    ],
  },
  {
    tag: "IMPROVE",
    title: "Challenges & Journey",
    description: "Compete, improve, and document your transformation publicly",
    color: "#BF5AF2",
    subs: [
      "Join community challenges",
      "Share your glow-up journey",
      "Track visible progress over time",
      "Get accountability from the community",
    ],
  },
  {
    tag: "ASCEND",
    title: "Personalized Ascension Plan",
    description: "A custom roadmap built around your face, your goals, your level",
    color: "#FFD60A",
    subs: [
      "Targeted by your weak areas from your rating",
      "Updated as you improve and get re-rated",
      "Covers skincare, fitness, style, and grooming",
    ],
    fullWidth: true,
  },
];

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} id="features" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-6 flex flex-col items-center">
        <h2
          className={`text-4xl md:text-6xl font-black mb-16 font-display text-foreground ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
        >
          Built for the <span className="text-primary">Elite</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mx-auto">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`relative overflow-hidden rounded-[14px] p-6 transition-all duration-150 cursor-default ${
                feature.fullWidth ? "md:col-span-2" : ""
              } ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                backgroundColor: "hsl(var(--primary) / 0.15)",
                border: "3px solid hsl(var(--primary) / 0.3)",
                boxShadow: feature.fullWidth
                  ? "7px 7px 0px hsl(var(--primary) / 0.3)"
                  : "5px 5px 0px hsl(var(--primary) / 0.3)",
                padding: "24px",
                animationDelay: `${i * 80}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(2px, 2px)";
                e.currentTarget.style.boxShadow = "3px 3px 0px hsl(var(--primary) / 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translate(0, 0)";
                e.currentTarget.style.boxShadow = feature.fullWidth
                  ? "7px 7px 0px hsl(var(--primary) / 0.3)"
                  : "5px 5px 0px hsl(var(--primary) / 0.3)";
              }}
            >
              {/* Decorative corner dot */}
              <div
                className="absolute top-3 left-3 w-5 h-5 rounded-full"
                style={{
                  backgroundColor: feature.color,
                  border: "2px solid hsl(var(--primary) / 0.4)",
                }}
              />

              <div className="ml-7">
                <span
                  className="inline-block font-bold text-[11px] uppercase tracking-[1.5px] px-2.5 py-1 rounded-[6px] mb-3 font-body"
                  style={{
                    backgroundColor: feature.color,
                    border: "2px solid hsl(var(--primary) / 0.4)",
                    color: "#FFFFFF",
                  }}
                >
                  {feature.tag}
                </span>

                <h3 className="text-[22px] font-bold font-display uppercase tracking-tight mb-1 text-foreground">
                  {feature.title}
                </h3>

                <p className="text-[13px] font-body mb-4 text-muted-foreground">
                  {feature.description}
                </p>

                <div className="flex flex-col" style={{ gap: "10px" }}>
                  {feature.subs.map((sub) => (
                    <div key={sub} className="flex items-start gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full mt-[3px] shrink-0"
                        style={{
                          backgroundColor: feature.color,
                          border: "2px solid hsl(var(--primary) / 0.4)",
                        }}
                      />
                      <span
                        className="text-[13px] font-body leading-snug text-muted-foreground"
                      >
                        {sub}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
