import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HeroSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100dvh] items-center overflow-hidden bg-background"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px] animate-float-slow-reverse" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px] animate-pulse-glow" />
      </div>

      <div className="container relative z-10 mx-auto px-ds-2 py-ds-4 sm:px-ds-3">
        <div className="mx-auto max-w-5xl text-center">
          <h1
            className={`text-stat-hero mx-auto w-full max-w-full uppercase leading-[0.8] text-foreground ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            Find out where you rank.
          </h1>

          <div
            className={`mx-auto mt-ds-3 max-w-xl space-y-ds-1 text-body text-muted-foreground ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: "60ms" }}
          >
            <p>Vote in battles.</p>
            <p>Get rated 1-10.</p>
            <p>See what the world thinks.</p>
          </div>

          <div
            className={`mt-ds-4 flex flex-col items-center gap-ds-2 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: "100ms" }}
          >
            <Link
              to="/signup"
              className="inline-flex h-btn-primary min-h-btn-primary w-full items-center justify-center rounded-md bg-primary px-ds-4 text-base font-bold text-primary-foreground shadow-primary-glow transition-[transform,box-shadow] duration-150 hover:bg-primary/90 active:scale-[0.97] font-body sm:w-auto"
            >
              Get started
            </Link>
            <Link to="/login" className="text-meta hover:text-foreground hover:underline">
              Already competing? Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
