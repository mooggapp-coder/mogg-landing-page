import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
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
import {
  fetchArenaEnergy,
  grantEnergyForParticipation,
  spendEnergyForExposure,
} from "@/lib/arena-energy";
import { track } from "@/lib/analytics";
import { AppHeader } from "@/components/AppHeader";
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

type GenderValue = "male" | "female";

type Competitor = {
  user_id: string;
  username: string | null;
  name: string | null;
  photo_urls: string[] | null;
  gender: string | null;
  country: string | null;
  mogg_score: number | null;
  battle_count: number | null;
  total_wins: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
};

// App tables are not in the marketing Database types — cast for these queries.
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

function isDuplicateVoteError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const status = "status" in error ? Number((error as { status?: unknown }).status) : NaN;
  const message =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message.toLowerCase()
      : "";
  return (
    code === "23505" ||
    status === 409 ||
    message.includes("duplicate") ||
    message.includes("unique") ||
    message.includes("conflict")
  );
}

function normalizeGender(value: unknown): GenderValue | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "male" || normalized === "female") return normalized;
  return null;
}

function getPhotos(competitor: Competitor): string[] {
  return Array.isArray(competitor.photo_urls)
    ? competitor.photo_urls.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];
}

/** Stable hash so (A,B) and (B,A) match. voter_id/pair_hash are text columns. */
function makePairHash(aId: string, bId: string): string {
  return [String(aId), String(bId)].sort().join("|");
}

type SeenPairRow = {
  pair_hash: string;
  seen_at: string | null;
};

/**
 * Prefer a random unseen pair. If every pair was already seen, reuse the
 * oldest seen_at so the voter can keep playing. Returns null only when pool < 2.
 */
function pickPairAvoidingSeen(
  pool: Competitor[],
  seenPairs: SeenPairRow[],
): [Competitor, Competitor] | null {
  if (pool.length < 2) return null;

  const seenAtByHash = new Map<string, number>();
  for (const row of seenPairs) {
    const hash = String(row.pair_hash);
    const parsed = row.seen_at ? Date.parse(row.seen_at) : NaN;
    const timestamp = Number.isFinite(parsed) ? parsed : 0;
    const existing = seenAtByHash.get(hash);
    if (existing == null || timestamp < existing) {
      seenAtByHash.set(hash, timestamp);
    }
  }

  type Candidate = {
    a: Competitor;
    b: Competitor;
    hash: string;
    seenAt: number | null;
  };

  const candidates: Candidate[] = [];
  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const a = pool[i];
      const b = pool[j];
      const hash = makePairHash(a.user_id, b.user_id);
      candidates.push({
        a,
        b,
        hash,
        seenAt: seenAtByHash.has(hash) ? (seenAtByHash.get(hash) as number) : null,
      });
    }
  }

  if (candidates.length === 0) return null;

  const unseen = candidates.filter((candidate) => candidate.seenAt == null);
  if (unseen.length > 0) {
    const pick = unseen[Math.floor(Math.random() * unseen.length)];
    return [pick.a, pick.b];
  }

  // All pairs already seen — recycle the oldest.
  candidates.sort((left, right) => (left.seenAt ?? 0) - (right.seenAt ?? 0));
  const oldest = candidates[0];
  return [oldest.a, oldest.b];
}

const Arena = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [emptyPool, setEmptyPool] = useState(false);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [competitorA, setCompetitorA] = useState<Competitor | null>(null);
  const [competitorB, setCompetitorB] = useState<Competitor | null>(null);
  const [photoIndexA, setPhotoIndexA] = useState(0);
  const [photoIndexB, setPhotoIndexB] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const [moderationTarget, setModerationTarget] = useState<Competitor | null>(null);
  const [moderationStep, setModerationStep] = useState<ModerationStep>("menu");
  const [moderationBusy, setModerationBusy] = useState(false);
  const [arenaEnergy, setArenaEnergy] = useState<number | null>(null);

  const votingLockRef = useRef(false);
  const loadInFlightRef = useRef(false);
  const votedBattleIdsRef = useRef<Set<string>>(new Set());
  const nextBattleTimerRef = useRef<number | null>(null);
  const poolCacheRef = useRef<Competitor[] | null>(null);
  const voterGenderRef = useRef<GenderValue | null>(null);

  const clearNextBattleTimer = () => {
    if (nextBattleTimerRef.current != null) {
      window.clearTimeout(nextBattleTimerRef.current);
      nextBattleTimerRef.current = null;
    }
  };

  const loadBattle = useCallback(async () => {
    if (!user?.id) return;
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;

    clearNextBattleTimer();
    votingLockRef.current = false;
    setVoting(false);
    setWinnerId(null);
    setLoading(true);
    setEmptyPool(false);

    try {
      if (!voterGenderRef.current || !poolCacheRef.current) {
        const { data: me, error: meError } = await db
          .from("users")
          .select("user_id, gender")
          .eq("user_id", user.id)
          .maybeSingle();

        if (meError) throw meError;

        const gender = normalizeGender(me?.gender);
        if (!gender) {
          throw new Error("Your profile is missing a gender. Finish setup first.");
        }
        voterGenderRef.current = gender;

        const [competitorsRes, blocksRes] = await Promise.all([
          db
            .from("users")
            .select(
              "user_id, username, name, photo_urls, gender, country, mogg_score, battle_count, total_wins, height_cm, weight_kg, age, arena_energy",
            )
            .eq("is_competitor", true)
            .eq("is_competing", true)
            .eq("is_blocked", false)
            .eq("battle_consent", true)
            .gt("arena_energy", 0)
            .neq("user_id", user.id)
            .limit(120),
          db.from("user_blocks").select("blocked_user_id").eq("blocker_id", user.id),
        ]);

        if (competitorsRes.error) throw competitorsRes.error;
        if (blocksRes.error) throw blocksRes.error;

        const blockedIds = new Set(
          ((blocksRes.data as Array<{ blocked_user_id: string }> | null) ?? []).map(
            (row) => row.blocked_user_id,
          ),
        );

        const pool = ((competitorsRes.data as Competitor[] | null) ?? []).filter((competitor) => {
          if (blockedIds.has(competitor.user_id)) return false;
          if (normalizeGender(competitor.gender) !== gender) return false;
          return getPhotos(competitor).length >= 1;
        });

        poolCacheRef.current = pool;
      }

      const pool = poolCacheRef.current ?? [];
      if (pool.length < 2) {
        setCompetitorA(null);
        setCompetitorB(null);
        setBattleId(null);
        setEmptyPool(true);
        return;
      }

      const { data: seenPairsData, error: seenPairsError } = await db
        .from("voter_seen_pairs")
        .select("pair_hash, seen_at")
        .eq("voter_id", String(user.id));

      if (seenPairsError) throw seenPairsError;

      const pair = pickPairAvoidingSeen(
        pool,
        (seenPairsData as SeenPairRow[] | null) ?? [],
      );
      if (!pair) {
        setCompetitorA(null);
        setCompetitorB(null);
        setBattleId(null);
        setEmptyPool(true);
        return;
      }

      const [a, b] = pair;

      const { data: battleData, error: battleError } = await db
        .from("battles")
        .insert({ user_a_id: a.user_id, user_b_id: b.user_id })
        .select("battle_id")
        .single();

      if (battleError) throw battleError;
      if (!battleData?.battle_id) {
        throw new Error("Battle insert returned no battle_id");
      }

      // Competitors appear to the voter — spend energy (non-blocking).
      spendEnergyForExposure([a.user_id, b.user_id]);

      setCompetitorA(a);
      setCompetitorB(b);
      setBattleId(battleData.battle_id);
      setPhotoIndexA(0);
      setPhotoIndexB(0);
    } catch (error) {
      toast({
        title: "Could not load battle",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      loadInFlightRef.current = false;
    }
  }, [user?.id, toast]);

  useEffect(() => {
    void loadBattle();
    return () => {
      clearNextBattleTimer();
    };
  }, [loadBattle]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void fetchArenaEnergy(user.id)
      .then((value) => {
        if (!cancelled) setArenaEnergy(value);
      })
      .catch((error) => {
        console.error("Failed to load arena energy:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const cyclePhoto = (side: "a" | "b", event: MouseEvent) => {
    if (votingLockRef.current || voting || winnerId) return;

    const competitor = side === "a" ? competitorA : competitorB;
    if (!competitor) return;

    const photos = getPhotos(competitor);
    // Only intercept the click to cycle when there are multiple photos;
    // otherwise let it bubble so the card vote handler runs.
    if (photos.length <= 1) return;

    event.stopPropagation();
    event.preventDefault();
    if (side === "a") {
      setPhotoIndexA((prev) => (prev + 1) % photos.length);
    } else {
      setPhotoIndexB((prev) => (prev + 1) % photos.length);
    }
  };

  const handleVote = async (votedForId: string) => {
    if (!user?.id || !battleId || !competitorA || !competitorB) return;
    if (votingLockRef.current || voting || winnerId) return;
    if (votedBattleIdsRef.current.has(battleId)) return;

    // Lock immediately so a second click / StrictMode double-fire cannot vote again.
    votingLockRef.current = true;
    votedBattleIdsRef.current.add(battleId);
    setVoting(true);
    setWinnerId(votedForId);

    const activeBattleId = battleId;
    const loserId = votedForId === competitorA.user_id ? competitorB.user_id : competitorA.user_id;
    const voteColumn: "votes_a" | "votes_b" =
      votedForId === competitorA.user_id ? "votes_a" : "votes_b";

    try {
      const { error: voteError } = await db.from("votes").insert({
        battle_id: activeBattleId,
        voter_id: user.id,
        voted_for_id: votedForId,
      });

      // Unique (voter_id, battle_id) conflict = vote already recorded — treat as success.
      if (voteError && !isDuplicateVoteError(voteError)) {
        throw voteError;
      }

      const { error: incrementError } = await db.rpc("increment_vote", {
        p_battle_id: activeBattleId,
        p_vote_column: voteColumn,
        p_voted_for_user_id: votedForId,
      });
      if (incrementError && !isDuplicateVoteError(incrementError)) {
        throw incrementError;
      }

      const { error: eloError } = await db.rpc("record_battle_result_rpc", {
        p_winner_id: votedForId,
        p_loser_id: loserId,
      });
      if (eloError) {
        toast({
          title: "Score update failed",
          description: getErrorMessage(eloError),
          variant: "destructive",
        });
      }

      // Record seen pair (non-blocking).
      const pairHash = makePairHash(competitorA.user_id, competitorB.user_id);
      void db
        .from("voter_seen_pairs")
        .upsert(
          {
            voter_id: String(user.id),
            pair_hash: pairHash,
            seen_at: new Date().toISOString(),
            battles_since: 0,
          },
          { onConflict: "voter_id,pair_hash" },
        )
        .then(({ error: seenPairError }: { error: { message: string } | null }) => {
          if (seenPairError) {
            console.error("voter_seen_pairs upsert failed:", seenPairError.message);
          }
        });

      // Earn energy for participating (await so the top-bar value updates).
      try {
        const nextEnergy = await grantEnergyForParticipation();
        setArenaEnergy(nextEnergy);
      } catch (energyError) {
        console.error("grant_energy_for_participation failed:", energyError);
      }

      track("vote_cast", {
        winner_id: votedForId,
        loser_id: loserId,
      });

      clearNextBattleTimer();
      nextBattleTimerRef.current = window.setTimeout(() => {
        void loadBattle();
      }, 1000);
    } catch (error) {
      votingLockRef.current = false;
      votedBattleIdsRef.current.delete(activeBattleId);
      setVoting(false);
      setWinnerId(null);
      toast({
        title: "Vote failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    if (votingLockRef.current || voting || winnerId) return;
    track("battle_skipped");
    void loadBattle();
  };

  const closeModeration = () => {
    if (moderationBusy) return;
    setModerationTarget(null);
    setModerationStep("menu");
  };

  const openModeration = (competitor: Competitor, event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (!user?.id || competitor.user_id === user.id) return;
    setModerationTarget(competitor);
    setModerationStep("menu");
  };

  const handleReport = async (reason: ReportReason) => {
    if (!user?.id || !moderationTarget) return;
    if (moderationTarget.user_id === user.id) return;

    setModerationBusy(true);
    try {
      await submitUserReport(user.id, moderationTarget.user_id, reason);
      track("user_reported", { reason });
      toast({
        title: "Report submitted — we'll review within 24 hours",
      });
      setModerationTarget(null);
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
    if (!user?.id || !moderationTarget) return;
    if (moderationTarget.user_id === user.id) return;

    const blockedId = moderationTarget.user_id;
    setModerationBusy(true);
    try {
      await blockUser(user.id, blockedId);
      // Clear pool cache so loadBattle re-fetches competitors + user_blocks.
      poolCacheRef.current = null;

      track("user_blocked");
      toast({
        title: "User blocked",
        description: "They won't appear in your battles anymore.",
      });
      setModerationTarget(null);
      setModerationStep("menu");
      void loadBattle();
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

  const moderationDisplayName =
    moderationTarget?.name?.trim() ||
    moderationTarget?.username ||
    "Competitor";

  const renderCompetitorCard = (competitor: Competitor, side: "a" | "b") => {
    const photos = getPhotos(competitor);
    const photoIndex = side === "a" ? photoIndexA : photoIndexB;
    const photoUrl = photos[photoIndex] ?? photos[0];
    const isWinner = winnerId === competitor.user_id;
    const isLoser = winnerId != null && winnerId !== competitor.user_id;
    const displayName = competitor.name?.trim() || competitor.username || "Competitor";
    const canVote = !voting && !winnerId;

    return (
      <div
        role="button"
        tabIndex={canVote ? 0 : -1}
        onClick={() => {
          if (!canVote) return;
          void handleVote(competitor.user_id);
        }}
        onKeyDown={(event) => {
          if (!canVote) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void handleVote(competitor.user_id);
          }
        }}
        className={cn(
          "group relative flex h-fit w-full flex-col overflow-hidden surface-card text-left transition-transform duration-150",
          isWinner &&
            "z-10 border-primary ring-2 ring-primary bg-primary/10 shadow-primary-glow scale-[1.02] animate-win-pulse",
          isLoser && "opacity-40 scale-[0.98]",
          canVote && "hover:border-primary/60 cursor-pointer active:scale-[0.97]",
          !canVote && "cursor-default",
        )}
      >
        <div
          className="relative mx-auto w-full shrink-0 overflow-hidden bg-secondary aspect-[3/4] max-h-[min(38dvh,100%)] sm:max-h-[min(56dvh,100%)]"
          onClick={(event) => cyclePhoto(side, event)}
          role="presentation"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              className="h-full w-full object-cover object-center"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground font-body">
              No photo
            </div>
          )}

          {competitor.user_id !== user?.id && (
            <button
              type="button"
              aria-label={`More options for ${displayName}`}
              onClick={(event) => openModeration(competitor, event)}
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm transition hover:bg-black/70"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}

          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              {photos.map((_, index) => (
                <span
                  key={`${competitor.user_id}-dot-${index}`}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    index === photoIndex ? "bg-white" : "bg-white/40",
                  )}
                />
              ))}
            </div>
          )}
          {isWinner && (
            <div className="absolute inset-x-0 top-0 bg-primary px-4 py-2 text-center shadow-primary-glow">
              <span className="text-section text-primary-foreground tracking-widest">WIN</span>
            </div>
          )}
        </div>
        <div className="space-y-0 p-2 sm:space-y-2 sm:p-4 shrink-0">
          <p className="truncate text-section text-foreground tracking-tight">
            {displayName}
          </p>
          <p className="truncate text-meta">
            {competitor.country || "Unknown country"}
          </p>
          {photos.length > 1 && (
            <p className="hidden sm:block text-meta">
              Tap photo to see more · Tap card to vote
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-background text-foreground">
      <AppHeader energy={arenaEnergy} compact />

      <div className="container mx-auto flex w-full max-w-4xl sm:max-w-6xl flex-1 flex-col px-6 py-2 sm:px-8 sm:py-4 min-h-0">
        <div className="mb-0 shrink-0 text-center sm:mb-4">
          <p className="hidden sm:block text-eyebrow mb-2">Arena</p>
          <h1 className="text-page-title text-primary leading-[0.85]">
            Who wins?
          </h1>
          <p className="mt-2 hidden text-meta sm:block">
            Tap a competitor to cast your vote
          </p>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : emptyPool ? (
          <div className="mx-auto max-w-md surface-card p-8 text-center">
            <p className="text-lg font-semibold font-body text-foreground">
              No challengers available
            </p>
            <Button asChild className="mt-6 font-body">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        ) : competitorA && competitorB ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative grid grid-cols-1 content-start items-start gap-4 sm:grid-cols-2 sm:gap-6">
              {renderCompetitorCard(competitorA, "a")}

              {/* Between stacked cards on mobile; centred over the gap on desktop */}
              <div
                className="relative z-20 flex justify-center sm:pointer-events-none sm:absolute sm:left-1/2 sm:top-[42%] sm:z-20 sm:-translate-x-1/2 sm:-translate-y-1/2"
                aria-hidden
              >
                <div className="vs-badge shrink-0">VS</div>
              </div>

              {renderCompetitorCard(competitorB, "b")}
            </div>

            <div className="mt-2 flex shrink-0 justify-center pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={voting || !!winnerId}
                className="min-w-[140px]"
              >
                Skip
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground font-body">Unable to load this battle.</p>
          </div>
        )}
      </div>

      <Dialog
        open={!!moderationTarget}
        onOpenChange={(open) => {
          if (!open) closeModeration();
        }}
      >
        <DialogContent className="max-w-sm">
          {moderationStep === "menu" && (
            <>
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
                  variant="destructive"
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
                  variant="outline"
                  className="font-body"
                  disabled={moderationBusy}
                  onClick={closeModeration}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {moderationStep === "report" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-tight">Report</DialogTitle>
                <DialogDescription className="font-body">
                  Why are you reporting {moderationDisplayName}?
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    disabled={moderationBusy}
                    onClick={() => void handleReport(reason)}
                    className="w-full surface-card px-4 py-4 text-left text-sm font-body text-foreground transition hover:border-primary/50 hover:bg-secondary disabled:opacity-50"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="font-body"
                  disabled={moderationBusy}
                  onClick={() => setModerationStep("menu")}
                >
                  Back
                </Button>
              </DialogFooter>
            </>
          )}

          {moderationStep === "blockConfirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-tight">Block user</DialogTitle>
                <DialogDescription className="font-body">
                  Block {moderationDisplayName}? They won&apos;t appear in your battles anymore.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
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
                      Blocking...
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Block"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Arena;

