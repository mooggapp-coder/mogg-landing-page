import { supabase } from "@/integrations/supabase/client";

// App tables / RPCs are not in the marketing Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function fetchArenaEnergy(userId: string): Promise<number> {
  const { data, error } = await db
    .from("users")
    .select("arena_energy")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const value = Number(data?.arena_energy ?? 0);
  return Number.isFinite(value) ? value : 0;
}

/** +1 energy for the current user (capped at 200). Returns the new value. */
export async function grantEnergyForParticipation(): Promise<number> {
  const { data, error } = await db.rpc("grant_energy_for_participation");
  if (error) throw error;
  const value = Number(data);
  if (!Number.isFinite(value)) {
    throw new Error("Energy grant returned an invalid value.");
  }
  return value;
}

/**
 * Spend 1 energy per listed user when they appear to others.
 * Fire-and-forget — does not throw; logs failures.
 */
export function spendEnergyForExposure(userIds: string[]): void {
  const ids = userIds.filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0) return;

  void db
    .rpc("spend_energy_for_exposure", { p_user_ids: ids })
    .then(({ error }: { error: { message?: string } | null }) => {
      if (error) {
        console.error("spend_energy_for_exposure failed:", error.message ?? error);
      }
    })
    .catch((error: unknown) => {
      console.error("spend_energy_for_exposure failed:", error);
    });
}
