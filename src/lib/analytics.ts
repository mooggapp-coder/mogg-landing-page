import posthog from "posthog-js";

let initialized = false;
let energyDepletedTracked = false;

/** Call once at app boot (main.tsx). No-ops if VITE_POSTHOG_KEY is missing. */
export function initAnalytics(): void {
  try {
    if (initialized) return;
    const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
    if (!key) return;

    const host =
      (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
      "https://us.i.posthog.com";

    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      persistence: "localStorage+cookie",
    });
    initialized = true;
  } catch {
    // Analytics must never break the app.
  }
}

export function track(
  event: string,
  props?: Record<string, unknown>,
): void {
  try {
    if (!initialized) return;
    posthog.capture(event, props);
  } catch {
    // ignore
  }
}

export function identify(
  userId: string,
  props?: Record<string, unknown>,
): void {
  try {
    if (!initialized) return;
    posthog.identify(userId, props);
  } catch {
    // ignore
  }
}

export function resetIdentity(): void {
  try {
    if (!initialized) return;
    posthog.reset();
    energyDepletedTracked = false;
  } catch {
    // ignore
  }
}

/** Fire `energy_depleted` once per identity when arena_energy reads 0. */
export function trackEnergyDepletedIfZero(energy: number | null | undefined): void {
  try {
    if (energy !== 0 || energyDepletedTracked) return;
    energyDepletedTracked = true;
    track("energy_depleted");
  } catch {
    // ignore
  }
}
