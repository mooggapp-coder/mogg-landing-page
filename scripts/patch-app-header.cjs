const fs = require("fs");
const path = require("path");

const root = path.join(
  "D:",
  "MOHAMED",
  "projects",
  "MOGG",
  "mogg landing page",
  "aesthetic-arena-main",
  "src",
  "pages",
);

const HEADER_RE =
  /<header className="sticky top-0[\s\S]*?<\/header>/;

const APP_HEADER = `<AppHeader energy={arenaEnergy} />`;

for (const name of [
  "Rate.tsx",
  "Leaderboard.tsx",
  "Profile.tsx",
  "PublicProfile.tsx",
  "Feedback.tsx",
]) {
  const file = path.join(root, name);
  let s = fs.readFileSync(file, "utf8");

  if (!s.includes('from "@/components/AppHeader"')) {
    if (s.includes("ArenaEnergyBadge")) {
      s = s.replace(
        /import \{ ArenaEnergyBadge \} from "@\/components\/ArenaEnergyBadge";\r?\n/,
        'import { AppHeader } from "@/components/AppHeader";\n',
      );
    } else {
      s = s.replace(
        /import \{ useToast \} from "@\/hooks\/use-toast";\r?\n/,
        'import { useToast } from "@/hooks/use-toast";\nimport { AppHeader } from "@/components/AppHeader";\n',
      );
    }
  } else {
    s = s.replace(
      /import \{ ArenaEnergyBadge \} from "@\/components\/ArenaEnergyBadge";\r?\n/,
      "",
    );
  }

  s = s.replace(/import moggLogo from "@\/assets\/mogg-logo.png";\r?\n/, "");

  // Drop Lightbulb from lucide import lists
  s = s.replace(/,\s*Lightbulb/g, "");
  s = s.replace(/Lightbulb,\s*/g, "");

  if (!HEADER_RE.test(s)) {
    console.error("No header found in", name);
    continue;
  }
  s = s.replace(HEADER_RE, APP_HEADER);

  // Prefer overflow-x-hidden on main
  s = s.replace(
    /<main className="min-h-screen bg-background text-foreground"/g,
    '<main className="min-h-dvh overflow-x-hidden bg-background text-foreground"',
  );

  fs.writeFileSync(file, s);
  console.log("updated", name);
}
