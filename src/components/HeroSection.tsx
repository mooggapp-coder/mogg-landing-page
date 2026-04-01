import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HeroSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  const words = ["Mogg", "and", "Get", "Mogged"];

  return (
    <section ref={ref} className="relative min-h-[85vh] flex items-center bg-background overflow-hidden">
      {/* Animated light orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] animate-float-slow-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/8 blur-[80px] animate-pulse-glow" />
      </div>
      <div className="container mx-auto px-6 py-20 lg:py-32 relative z-10">
        <div className="max-w-5xl">
          <div className={`mb-4 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
            <span className="text-sm font-medium tracking-wide text-muted-foreground font-body">
              Currently in Exclusive Beta
            </span>
          </div>

          <h1 className="text-[9vw] md:text-[8vw] lg:text-[7vw] font-black leading-[0.9] tracking-tight font-display overflow-hidden">
            {words.map((word, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span
                  className={`inline-block ${isVisible ? "animate-word-slide-up" : "opacity-0"} ${
                    word === "Mogg" || word === "Mogged" ? "text-primary" : "text-foreground"
                  }`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {word}
                </span>
              </span>
            ))}
          </h1>

          <p
            className={`text-lg text-muted-foreground max-w-md mt-6 font-body ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.5s" }}
          >
            The #1 looksmaxxing app
          </p>

          {/* Social proof stats */}
          <div
            className={`flex items-center gap-3 mt-3 text-sm text-muted-foreground font-body ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.6s" }}
          >
            <span>2,400+ on the waitlist</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>14 countries</span>
          </div>

          <a
            href="#waitlist"
            className={`inline-flex items-center mt-10 bg-foreground hover:bg-primary text-background font-semibold px-8 py-4 rounded-lg text-sm transition-all font-body ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.7s" }}
          >
            Join the Exclusive Waitlist
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
