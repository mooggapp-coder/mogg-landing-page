import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@/lib/analytics";

/** Captures `$pageview` on every React Router location change. */
export function PostHogPageview() {
  const location = useLocation();

  useEffect(() => {
    track("$pageview", {
      path: location.pathname,
      search: location.search || undefined,
    });
  }, [location.pathname, location.search]);

  return null;
}
