import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const WaitlistSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="bg-surface-dark py-ds-4 lg:py-ds-5">
      <div className="container mx-auto px-ds-2 sm:px-ds-3">
        <div
          className={cn(
            "max-w-lg text-left md:ml-auto md:text-right",
            isVisible ? "animate-fade-in" : "opacity-0",
          )}
        >
          <h2 className="text-page-title mb-ds-3 text-surface-dark-fg">
            Battles and <span className="text-primary">ratings</span>
          </h2>

          <div className="space-y-ds-2">
            <Link
              to="/signup"
              className="inline-flex h-btn-primary min-h-btn-primary w-full items-center justify-center rounded-md bg-primary px-ds-3 font-bold text-primary-foreground shadow-primary-glow transition-[transform,background-color] duration-150 hover:bg-primary/90 active:scale-[0.97] font-body"
            >
              Join free
            </Link>
            <p className="text-center text-sm text-surface-dark-fg/50 font-body md:text-right">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-surface-dark-fg underline underline-offset-2 transition-colors hover:text-primary"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
