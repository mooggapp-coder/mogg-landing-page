import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HeroSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] flex items-center bg-background overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] animate-float-slow-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px] animate-pulse-glow" />
      </div>

      <div className="container mx-auto px-6 py-12 lg:py-16 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className={`text-eyebrow mb-4 ${isVisible ? "animate-fade-in" : "opacity-0"}`}
          >
            The competition arena
          </p>

          <h1
            className={`text-page-title text-[12vw] sm:text-[10vw] lg:text-[5.5rem] leading-[0.85] text-foreground ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: "40ms" }}
          >
            Enter the{" "}
            <span className="text-primary">arena</span>
          </h1>

          <p
            className={`mx-auto mt-6 max-w-lg text-body text-muted-foreground sm:text-lg ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: "80ms" }}
          >
            Vote head-to-head, climb the world ranking, and prove you belong at the top —
            not another feed to scroll.
          </p>

          <div
            className={`mt-8 flex flex-col items-center gap-4 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: "120ms" }}
          >
            <Link
              to="/signup"
              className="inline-flex h-btn-primary min-h-btn-primary w-full sm:w-auto items-center justify-center rounded-md bg-primary px-8 text-base font-bold text-primary-foreground shadow-primary-glow transition-[transform,box-shadow] duration-150 hover:bg-primary/90 active:scale-[0.97] font-body"
            >
              Enter the Arena
            </Link>
            <Link
              to="/login"
              className="text-meta hover:text-foreground hover:underline"
            >
              Already competing? Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
