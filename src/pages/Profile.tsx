import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchArenaEnergy } from "@/lib/arena-energy";
import { shareInvite } from "@/lib/share";
import { AppHeader } from "@/components/AppHeader";
import {
  PROFILE_SELECT,
  ProfileCard,
  type ProfileUser,
  type RankHistoryRow,
} from "@/components/profile/ProfileCard";
import { ProfileFeedbackSection } from "@/components/profile/ProfileFeedbackSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [arenaEnergy, setArenaEnergy] = useState<number | null>(null);
  const [rankHistory, setRankHistory] = useState<RankHistoryRow[]>([]);
  const [settingsBusy, setSettingsBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, historyRes] = await Promise.all([
          db.from("users").select(PROFILE_SELECT).eq("user_id", user.id).maybeSingle(),
          db
            .from("rank_history")
            .select("id, date, global_rank, local_rank")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(30),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (historyRes.error) throw historyRes.error;
        if (cancelled) return;

        const row = (profileRes.data as ProfileUser | null) ?? null;
        setProfile(row);
        setRankHistory((historyRes.data as RankHistoryRow[] | null) ?? []);
        const energy = Number(row?.arena_energy ?? 0);
        setArenaEnergy(Number.isFinite(energy) ? energy : 0);
      } catch (error) {
        toast({
          title: "Could not load profile",
          description: getErrorMessage(error),
          variant: "destructive",
        });
        try {
          const energy = await fetchArenaEnergy(user.id);
          if (!cancelled) setArenaEnergy(energy);
        } catch (energyError) {
          console.error("Failed to load arena energy:", energyError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, toast]);


  const handleToggle = async (
    field: "is_competing" | "show_on_leaderboard",
    checked: boolean,
  ) => {
    if (!user?.id || !profile || settingsBusy) return;

    const previous = Boolean(profile[field]);
    setSettingsBusy(true);
    setProfile({ ...profile, [field]: checked });

    try {
      const { error } = await db
        .from("users")
        .update({ [field]: checked })
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      setProfile({ ...profile, [field]: previous });
      toast({
        title: "Could not update setting",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSettingsBusy(false);
    }
  };

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <AppHeader energy={arenaEnergy} />

      <div className="container mx-auto max-w-full overflow-x-hidden px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-6 text-center">
          <p className="text-eyebrow mb-2">
            Profile
          </p>
          <h1 className="text-page-title">Your profile</h1>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : !profile ? (
          <div className="mx-auto max-w-md surface-card p-8 text-center">
            <p className="text-sm text-muted-foreground font-body">Profile not found.</p>
            <Button asChild className="mt-4 font-body">
              <Link to="/setup">Set up profile</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-md space-y-8">
            {arenaEnergy === 0 && (
              <div
                role="status"
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-meta text-amber-100"
              >
                You're out of energy — vote or rate to start appearing again.
              </div>
            )}

            <ProfileCard
              profile={profile}
              showEnergyMeter
              rankHistory={rankHistory}
            />

            {user?.id ? <ProfileFeedbackSection userId={user.id} /> : null}

            <Button
              type="button"
              variant="outline"
              className="w-full font-body"
              onClick={() => {
                void shareInvite("profile").then((result) => {
                  if (result.copied) {
                    toast({ title: "Link copied" });
                  }
                });
              }}
            >
              MOGG YOUR FRIENDS
            </Button>

            <section className="space-y-4">
              <h3 className="text-eyebrow text-center">Settings</h3>
              <div className="surface-card p-4 space-y-4 sm:p-6">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="competing-toggle" className="font-body text-body text-foreground">
                      Competing
                    </Label>
                    <Switch
                      id="competing-toggle"
                      checked={Boolean(profile.is_competing)}
                      disabled={settingsBusy}
                      onCheckedChange={(checked) => void handleToggle("is_competing", checked)}
                    />
                  </div>
                  <p className="mt-2 text-meta">
                    Turn off to hide yourself from battles and ratings.
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label
                      htmlFor="leaderboard-toggle"
                      className="font-body text-body text-foreground"
                    >
                      Show on World Ranking
                    </Label>
                    <Switch
                      id="leaderboard-toggle"
                      checked={Boolean(profile.show_on_leaderboard ?? true)}
                      disabled={settingsBusy}
                      onCheckedChange={(checked) =>
                        void handleToggle("show_on_leaderboard", checked)
                      }
                    />
                  </div>
                  <p className="mt-2 text-meta">
                    Off: your rank won't be visible to others
                  </p>
                </div>
              </div>
            </section>

            <Button
              type="button"
              className="w-full font-body"
              onClick={() => navigate("/setup")}
            >
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Profile;
