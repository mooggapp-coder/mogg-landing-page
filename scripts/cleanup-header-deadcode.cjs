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

const LOGOUT_FN =
  /\n  const handleLogout = async \(\) => \{[\s\S]*?\n  \};\n/;

for (const name of [
  "Rate.tsx",
  "Leaderboard.tsx",
  "Profile.tsx",
  "PublicProfile.tsx",
  "Feedback.tsx",
]) {
  const file = path.join(root, name);
  let s = fs.readFileSync(file, "utf8");

  s = s.replace(LOGOUT_FN, "\n");

  // Auth: keep user only (PublicProfile/Profile/etc still need user)
  s = s.replace(
    /const \{ user, signOut \} = useAuth\(\);/g,
    "const { user } = useAuth();",
  );

  // NavLink unused? Check if NavLink still appears in JSX
  if (!s.includes("<NavLink")) {
    s = s.replace(/, NavLink/g, "");
    s = s.replace(/NavLink, /g, "");
  }

  // navigate: keep if still used
  if (!s.includes("navigate(") && !s.includes("useNavigate")) {
    // nothing
  } else if (!s.includes("navigate(")) {
    s = s.replace(/, useNavigate/g, "");
    s = s.replace(/useNavigate, /g, "");
    s = s.replace(/\n  const navigate = useNavigate\(\);\n/, "\n");
  }

  // Link: keep if used
  if (!s.includes("<Link") && !s.includes("Link ")) {
    s = s.replace(/Link, /g, "");
    s = s.replace(/, Link/g, "");
  }

  fs.writeFileSync(file, s);
  console.log("cleaned", name);
}
