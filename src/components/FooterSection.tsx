import { Instagram } from "lucide-react";
import moggLogo from "@/assets/mogg-logo.png";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const FooterSection = () => (
  <footer className="border-t border-border py-8 bg-background">
    <div className="container mx-auto px-6 flex flex-col items-center justify-center gap-6 text-center md:flex-row md:justify-center md:gap-10">
      <img src={moggLogo} alt="MOGG" className="h-10" />
      <p className="text-xs text-muted-foreground font-body">© 2026 MOGG. All rights reserved.</p>
      <div className="flex items-center gap-5">
        <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium font-body">
          About
        </a>
        <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium font-body">
          Terms of Service
        </a>
        <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium font-body">
          Privacy Policy
        </a>
        {[
          { Icon: Instagram, href: "https://www.instagram.com/mogg_app?igsh=NWZlemxpNTNhNjlk", label: "Instagram" },
          { Icon: TikTokIcon, href: "https://www.tiktok.com/@moggapp?is_from_webapp=1&sender_device=pc", label: "TikTok" },
        ].map(({ Icon, href, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon className="w-5 h-5" />
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default FooterSection;
