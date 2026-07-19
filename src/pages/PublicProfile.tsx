import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  REPORT_REASONS,
  blockUser,
  submitUserReport,
  type ReportReason,
} from "@/lib/moderation";
import { fetchArenaEnergy } from "@/lib/arena-energy";
import { track } from "@/lib/analytics";
import { AppHeader } from "@/components/AppHeader";
import {
  PROFILE_SELECT,
  ProfileCard,
  getDisplayName,
  type ProfileUser,
  type RankHistoryRow,
} from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ModerationStep = "menu" | "report" | "blockConfirm";

// App tables are not in the marketing Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return String(error);
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [arenaEnergy, setArenaEnergy] = useState<number | null>(null);
  const [rankHistory, setRankHistory] = useState<RankHistoryRow[]>([]);
  const [notFound, setNotFound] = useState(false);

  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationStep, setModerationStep] = useState<ModerationStep>("menu");
  const [moderationBusy, setModerationBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    track("profile_viewed");
  }, [userId]);

  useEffect(() => {
    if (!user?.id || !userId) return;

    if (userId === user.id) {
      navigate("/profile", { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setProfile(null);

      try {
        const [{ data, error }, historyRes, energy] = await Promise.all([
          db.from("users").select(PROFILE_SELECT).eq("user_id", userId).maybeSingle(),
          db
            .from("rank_history")
            .select("id, date, global_rank, local_rank")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .limit(30),
          fetchArenaEnergy(user.id).catch((energyError) => {
            console.error("Failed to load arena energy:", energyError);
            return null;
          }),
        ]);

        if (error) throw error;
        if (historyRes.error) throw historyRes.error;
        if (cancelled) return;

        if (!data) {
          setNotFound(true);
          return;
        }

        setProfile(data as ProfileUser);
        setRankHistory((historyRes.data as RankHistoryRow[] | null) ?? []);
        if (typeof energy === "number") setArenaEnergy(energy);
      } catch (error) {
        toast({
          title: "Could not load profile",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, userId, navigate, toast]);


  const closeModeration = () => {
    if (moderationBusy) return;
    setModerationOpen(false);
    setModerationStep("menu");
  };

  const openModeration = () => {
    if (!user?.id || !profile || profile.user_id === user.id) return;
    setModerationStep("menu");
    setModerationOpen(true);
  };

  const handleReport = async (reason: ReportReason) => {
    if (!user?.id || !profile) return;
    if (profile.user_id === user.id) return;

    setModerationBusy(true);
    try {
      await submitUserReport(user.id, profile.user_id, reason);
      track("user_reported", { reason });
      toast({
        title: "Report submitted — we'll review within 24 hours",
      });
      setModerationOpen(false);
      setModerationStep("menu");
    } catch (error) {
      toast({
        title: "Report failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setModerationBusy(false);
    }
  };

  const handleBlockConfirm = async () => {
    if (!user?.id || !profile) return;
    if (profile.user_id === user.id) return;

    setModerationBusy(true);
    try {
      await blockUser(user.id, profile.user_id);
      track("user_blocked");
      toast({
        title: "User blocked",
        description: "They won't appear in your battles anymore.",
      });
      setModerationOpen(false);
      setModerationStep("menu");
      navigate(-1);
    } catch (error) {
      toast({
        title: "Block failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setModerationBusy(false);
    }
  };

  const moderationDisplayName = getDisplayName(profile);

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <AppHeader energy={arenaEnergy} />

      <div className="container mx-auto max-w-full overflow-x-hidden px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-6 relative text-center">
          <p className="text-eyebrow mb-2">
            Profile
          </p>
          <h1 className="text-page-title">Competitor</h1>
          {profile && profile.user_id !== user?.id && (
            <button
              type="button"
              aria-label={`More options for ${moderationDisplayName}`}
              onClick={openModeration}
              className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-secondary"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : notFound || !profile ? (
          <div className="mx-auto max-w-md surface-card p-8 text-center">
            <p className="text-sm text-muted-foreground font-body">Profile not found.</p>
            <Button asChild className="mt-4 font-body">
              <Link to="/leaderboard">Back to World Ranking</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <ProfileCard
              profile={profile}
              rankHistory={rankHistory}
              rankHistoryEmptyMessage="No rank history yet."
            />
          </div>
        )}
      </div>

      <Dialog
        open={moderationOpen}
        onOpenChange={(open) => {
          if (!open) closeModeration();
          else setModerationOpen(true);
        }}
      >
        <DialogContent className="max-w-sm">
          {moderationStep === "menu" && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display tracking-tight">
                  {moderationDisplayName}
                </DialogTitle>
                <DialogDescription className="font-body">
                  Choose an action for this competitor.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="font-body"
                  disabled={moderationBusy}
                  onClick={() => setModerationStep("report")}
                >
                  Report
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="font-body"
                  disabled={moderationBusy}
                  onClick={() => setModerationStep("blockConfirm")}
                >
                  Block
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="font-body"
                  disabled={moderationBusy}
                  onClick={closeModeration}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {moderationStep === "report" && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display tracking-tight">Report</DialogTitle>
                <DialogDescription className="font-body">
                  Why are you reporting {moderationDisplayName}?
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {REPORT_REASONS.map((reason) => (
                  <Button
                    key={reason}
                    type="button"
                    variant="outline"
                    className="font-body justify-start"
                    disabled={moderationBusy}
                    onClick={() => void handleReport(reason)}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  className="font-body"
                  disabled={moderationBusy}
                  onClick={() => setModerationStep("menu")}
                >
                  Back
                </Button>
              </DialogFooter>
            </div>
          )}

          {moderationStep === "blockConfirm" && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display tracking-tight">Block user</DialogTitle>
                <DialogDescription className="font-body">
                  Block {moderationDisplayName}? They won&apos;t appear in your battles anymore.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="font-body"
                  disabled={moderationBusy}
                  onClick={() => setModerationStep("menu")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="font-body"
                  disabled={moderationBusy}
                  onClick={() => void handleBlockConfirm()}
                >
                  {moderationBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Blocking...
                    </>
                  ) : (
                    "Block"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default PublicProfile;
