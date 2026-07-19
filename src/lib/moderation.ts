import { supabase } from "@/integrations/supabase/client";

export const REPORT_REASONS = [
  "Inappropriate photo",
  "Fake profile",
  "Underage user",
  "Harassment",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

// App tables are not in the marketing Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function submitUserReport(
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
): Promise<void> {
  const { error } = await db.from("user_reports").insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    reason,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function blockUser(blockerId: string, blockedUserId: string): Promise<void> {
  const { error } = await db.from("user_blocks").insert({
    blocker_id: blockerId,
    blocked_user_id: blockedUserId,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}
