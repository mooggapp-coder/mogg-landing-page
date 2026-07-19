import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import arenaPreview from "@/assets/arena-preview.png";

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
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-3xl">
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
              className={`mt-6 max-w-lg text-body text-muted-foreground sm:text-lg ${
                isVisible ? "animate-fade-in" : "opacity-0"
              }`}
              style={{ animationDelay: "80ms" }}
            >
              Vote head-to-head, climb the world ranking, and prove you belong at the top —
              not another feed to scroll.
            </p>

            <div
              className={`mt-8 flex flex-col items-stretch gap-4 sm:items-start ${
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

          <div
            className={`relative ${isVisible ? "animate-fade-in" : "opacity-0"}`}
            style={{ animationDelay: "160ms" }}
          >
            <div className="overflow-hidden rounded-md border-2 border-primary/40 shadow-primary-glow">
              <img
                src={arenaPreview}
                alt="MOGG Arena — two competitors face off for your vote"
                className="w-full h-auto object-cover object-top"
              />
            </div>
            <p className="mt-4 text-center text-meta">
              Real faces. Real votes. Real rankings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
