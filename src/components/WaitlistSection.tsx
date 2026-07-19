import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const WaitlistSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-12 lg:py-16 bg-surface-dark">
      <div className="container mx-auto px-6">
        <div className={`max-w-lg ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
          <h2 className="text-page-title mb-4 text-surface-dark-fg">
            Your ranking <span className="text-primary">starts here</span>
          </h2>
          <p className="text-surface-dark-fg/60 text-body mb-8 font-body">
            Create your account and enter the arena — climb or get forgotten.
          </p>

          <div className="space-y-4">
            <Link
              to="/signup"
              className="w-full inline-flex h-btn-primary min-h-btn-primary items-center justify-center rounded-md bg-primary px-6 font-bold text-primary-foreground shadow-primary-glow transition-[transform,background-color] duration-150 hover:bg-primary/90 active:scale-[0.97] font-body"
            >
              Enter the Arena — Free
            </Link>
            <p className="text-sm text-surface-dark-fg/50 font-body text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-surface-dark-fg hover:text-primary underline underline-offset-2 font-medium transition-colors">
                Log in
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6 text-xs text-surface-dark-fg/40 font-body">
            <span>Free to join</span>
            <span className="w-1 h-1 rounded-full bg-surface-dark-fg/20" />
            <span>No credit card required</span>
            <span className="w-1 h-1 rounded-full bg-surface-dark-fg/20" />
            <span>Compete worldwide</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
