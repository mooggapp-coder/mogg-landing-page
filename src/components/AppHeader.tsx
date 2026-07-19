import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Lightbulb, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArenaEnergyBadge } from "@/components/ArenaEnergyBadge";
import { ReportBugButton } from "@/components/ReportBugButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import moggLogo from "@/assets/mogg-logo.png";

const NAV_LINKS = [
  { to: "/arena", label: "Arena" },
  { to: "/rate", label: "PSL" },
  { to: "/leaderboard", label: "World Ranking" },
  { to: "/profile", label: "Profile" },
] as const;

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return String(error);
}

type AppHeaderProps = {
  energy: number | null;
  /** Shorter chrome — used on Arena so cards get more vertical room on mobile. */
  compact?: boolean;
};

/**
 * Shared app chrome: logo + energy always visible.
 * Nav + Log out inline from sm up; hamburger sheet on phones.
 */
export function AppHeader({ energy, compact = false }: AppHeaderProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setMenuOpen(false);
      navigate("/");
    } catch (error) {
      toast({
        title: "Log out failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md px-2 py-2 text-sm font-semibold font-body uppercase tracking-wide transition-colors",
      isActive
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:text-primary",
    );

  const sheetNavClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex min-h-btn-secondary items-center rounded-md px-4 text-base font-semibold font-body uppercase tracking-wide transition-colors",
      isActive
        ? "bg-primary text-primary-foreground shadow-primary-glow-sm"
        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
    );

  return (
    <header className="relative z-50 border-b border-border bg-background/95 backdrop-blur-sm sm:sticky sm:top-0">
      <div
        className={cn(
          "container mx-auto flex max-w-full items-center justify-between gap-1.5 px-3 overflow-x-hidden sm:gap-2 sm:px-6",
          compact ? "h-10 sm:h-14" : "h-11 sm:h-16",
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img
              src={moggLogo}
              alt="MOGG"
              className={cn(
                "w-auto",
                compact ? "h-7 sm:h-10 md:h-12" : "h-8 sm:h-12 md:h-14",
              )}
            />
          </Link>

          {/* Desktop / tablet nav */}
          <nav className="hidden sm:flex items-center gap-2 sm:gap-2">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8 text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
          >
            <Link to="/feedback" aria-label="Feature board">
              <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </Button>

          <ReportBugButton />

          <ArenaEnergyBadge
            energy={energy}
            className="gap-1 px-1.5 py-1 text-xs sm:gap-2 sm:px-2 sm:py-2 sm:text-meta"
          />

          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleLogout()}
            className="hidden sm:inline-flex font-body text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            Log out
          </Button>

          {/* Phone menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground sm:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)] bg-background border-border">
              <SheetHeader>
                <SheetTitle className="font-display tracking-tight text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={sheetNavClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
                <Link
                  to="/feedback"
                  className="flex min-h-btn-secondary items-center gap-2 rounded-md px-4 text-base font-medium font-body text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  <Lightbulb className="h-4 w-4" />
                  The Board
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="mt-4 flex min-h-btn-secondary items-center gap-2 rounded-md px-4 text-base font-medium font-body text-muted-foreground hover:bg-secondary/60 hover:text-foreground text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
