import { Link } from "react-router-dom";
import moggLogo from "@/assets/mogg-logo.png";

const Header = () => {
  return (
    <>
      <div className="announcement-bar-gradient py-2 text-center border-b border-border">
        <div className="inline-flex items-center gap-2 bg-background/30 backdrop-blur-sm rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
          <p className="text-meta font-medium tracking-wide text-foreground">
            The arena is live —{" "}
            <Link
              to="/signup"
              className="underline underline-offset-2 text-primary hover:text-primary/80 transition-colors"
            >
              claim your spot
            </Link>{" "}
            and start competing
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 flex items-center justify-between h-20 md:h-24 gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src={moggLogo}
              alt="MOGG"
              className="h-20 md:h-28 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium font-body"
            >
              Why MOGG
            </a>
            <Link
              to="/signup"
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium font-body"
            >
              Compete
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-meta hover:text-foreground transition-colors font-medium"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 sm:px-6 h-btn-secondary min-h-btn-secondary font-bold text-sm text-primary-foreground shadow-primary-glow-sm transition-[transform,background-color] duration-150 hover:bg-primary/90 active:scale-[0.97] font-body"
            >
              Enter Arena
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
