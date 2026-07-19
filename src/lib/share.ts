import { track } from "@/lib/analytics";

export type ShareInviteResult = {
  /** True when the invite URL was copied because Web Share was unavailable. */
  copied: boolean;
  /** True when share or copy completed successfully. */
  shared: boolean;
};

function isShareCancel(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String((error as { name: unknown }).name) : "";
  // User dismissed the system share sheet — not an error.
  return name === "AbortError" || name === "NotAllowedError";
}

/**
 * Share a MOGG invite link via the native share sheet, or copy the URL on desktop.
 */
export async function shareInvite(source: string): Promise<ShareInviteResult> {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const payload = {
    title: "MOGG",
    text: "Think you can win? Enter the arena.",
    url,
  };

  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share(payload);
      track("invite_shared", { source });
      return { shared: true, copied: false };
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      track("invite_shared", { source });
      return { shared: true, copied: true };
    }

    return { shared: false, copied: false };
  } catch (error) {
    if (isShareCancel(error)) {
      return { shared: false, copied: false };
    }
    // Clipboard or unexpected share failure — try copy as last resort.
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && url) {
        await navigator.clipboard.writeText(url);
        track("invite_shared", { source });
        return { shared: true, copied: true };
      }
    } catch {
      // ignore
    }
    return { shared: false, copied: false };
  }
}
