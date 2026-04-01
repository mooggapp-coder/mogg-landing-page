import moggLogo from "@/assets/mogg-logo.png";

const Header = () => {

  return (
    <>
      {/* Announcement Bar — clean pill style */}
      <div className="announcement-bar-gradient py-2.5 text-center border-b border-border">
        <div className="inline-flex items-center gap-2 bg-background/30 backdrop-blur-sm rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
          <p className="text-xs font-medium tracking-wide text-foreground font-body">
            Beta launching soon — <a href="#waitlist" className="underline underline-offset-2 hover:text-primary transition-colors">Join the waitlist</a> to secure your spot
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <img src={moggLogo} alt="MOGG" className="h-14 md:h-16" />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium font-body">Features</a>
            <a href="#waitlist" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium font-body">Waitlist</a>
          </nav>

          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 bg-foreground hover:bg-primary text-background font-semibold px-5 py-2 rounded-lg text-sm transition-all font-body"
          >
            Join the Exclusive Waitlist
          </a>
        </div>
      </header>
    </>
  );
};

export default Header;
