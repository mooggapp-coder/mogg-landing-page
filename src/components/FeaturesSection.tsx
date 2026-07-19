import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} id="features" className="bg-background py-ds-4 lg:py-ds-5">
      <div className="container mx-auto px-ds-2 sm:px-ds-3">
        <div className="mb-ds-4 max-w-2xl text-left">
          <h2
            className={cn(
              "text-page-title text-foreground",
              isVisible ? "animate-fade-in" : "opacity-0",
            )}
          >
            How do you want to play?
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-ds-3 md:grid-cols-2 md:gap-ds-4">
          {/* Arena — flagship */}
          <div
            className={cn(
              "surface-card flex flex-col gap-ds-3 border-primary p-ds-3 sm:p-ds-4",
              "transition-[border-color,box-shadow] duration-150 hover:border-primary hover:shadow-primary-glow",
              isVisible ? "animate-fade-in-up" : "opacity-0",
            )}
          >
            <h3 className="text-stat uppercase leading-[0.85] text-primary">Arena</h3>
            <div className="space-y-ds-1">
              <p className="text-body text-muted-foreground">Vote head-to-head.</p>
              <p className="text-body text-muted-foreground">Beat real people.</p>
              <p className="text-body text-muted-foreground">Climb the world ranking.</p>
            </div>
            <Link
              to="/arena"
              className="mt-auto inline-flex h-btn-primary min-h-btn-primary w-full items-center justify-center rounded-md bg-primary px-ds-3 font-bold text-primary-foreground shadow-primary-glow transition-[transform,background-color] duration-150 hover:bg-primary/90 active:scale-[0.97] font-body"
            >
              Enter Arena
            </Link>
          </div>

          {/* PSL — equal weight, lighter chrome */}
          <div
            className={cn(
              "surface-card flex flex-col gap-ds-3 border-border p-ds-3 sm:p-ds-4",
              "transition-[border-color,box-shadow] duration-150 hover:border-muted-foreground/40 hover:bg-card/80",
              isVisible ? "animate-fade-in-up" : "opacity-0",
            )}
            style={{ animationDelay: "60ms" }}
          >
            <h3 className="text-stat uppercase leading-[0.85] text-foreground">PSL</h3>
            <div className="space-y-ds-1">
              <p className="text-body text-muted-foreground">Get rated 1 to 10.</p>
              <p className="text-body text-muted-foreground">Compare your average.</p>
              <p className="text-body text-muted-foreground">Watch it move.</p>
            </div>
            <Link
              to="/rate"
              className="mt-auto inline-flex h-btn-primary min-h-btn-primary w-full items-center justify-center rounded-md border border-border bg-secondary px-ds-3 font-bold text-foreground transition-[transform,background-color] duration-150 hover:bg-secondary/80 active:scale-[0.97] font-body"
            >
              Get Rated
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
