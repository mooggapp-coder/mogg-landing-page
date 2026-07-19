import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  fetchArenaEnergy,
  grantEnergyForParticipation,
  spendEnergyForExposure,
} from "@/lib/arena-energy";
import { track } from "@/lib/analytics";
import {
  PSL_FEEDBACK_COMMENT_MAX,
  PSL_FEEDBACK_TAGS,
  type PslFeedbackTag,
} from "@/lib/psl-feedback";
import { shareInvite } from "@/lib/share";
import { AppHeader } from "@/components/AppHeader";
import {
  GenderPoolToggle,
  type PslGenderMode,
} from "@/components/GenderPoolToggle";
import { PslRatingSlider } from "@/components/PslRatingSlider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type GenderValue = "male" | "female";

type RateableUser = {
  user_id: string;
  username: string | null;
  name: string | null;
  photo_urls: string[] | null;
  gender: string | null;
  country: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

type SubmitResult = {
  average: number;
  count: number;
};

// App tables are not in the marketing Database types — cast for these queries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function formatCompetitorMeta(person: Pick<RateableUser, "age" | "height_cm" | "weight_kg">): string | null {
  const parts: string[] = [];
  if (person.age != null && Number.isFinite(Number(person.age))) {
    parts.push(String(Math.round(Number(person.age))));
  }
  if (person.height_cm != null && Number.isFinite(Number(person.height_cm))) {
    parts.push(`${Math.round(Number(person.height_cm))} cm`);
  }
  if (person.weight_kg != null && Number.isFinite(Number(person.weight_kg))) {
    parts.push(`${Math.round(Number(person.weight_kg))} kg`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return String(error);
}

function getPhotos(person: RateableUser): string[] {
  return Array.isArray(person.photo_urls)
    ? person.photo_urls.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];
}

function normalizeGender(value: unknown): GenderValue | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "male" || normalized === "female") return normalized;
  return null;
}

function formatScoreDisplay(value: number): string {
  // Show 2 decimals when fractional (e.g. 7.25), else whole number (e.g. 8).
  if (Math.abs(value - Math.round(value)) < 1e-9) {
    return String(Math.round(value));
  }
  return value.toFixed(2);
}

function parseRpcResult(data: unknown): SubmitResult {
  const payload = Array.isArray(data) ? data[0] : data;
  if (!payload || typeof payload !== "object") {
    throw new Error("Rating submitted but no result was returned.");
  }
  const record = payload as { average?: unknown; count?: unknown };
  const average = Number(record.average);
  const count = Number(record.count);
  if (!Number.isFinite(average) || !Number.isFinite(count)) {
    throw new Error("Rating submitted but the result was invalid.");
  }
  return { average, count };
}

const DEFAULT_SCORE = 5;

const Rate = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [emptyPool, setEmptyPool] = useState(false);
  const [person, setPerson] = useState<RateableUser | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [score, setScore] = useState(DEFAULT_SCORE);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [arenaEnergy, setArenaEnergy] = useState<number | null>(null);
  /** PSL gender mode — defaults to Random (combined pool). */
  const [genderMode, setGenderMode] = useState<PslGenderMode>("random");
  const [strongest, setStrongest] = useState<PslFeedbackTag | null>(null);
  const [needsWork, setNeedsWork] = useState<PslFeedbackTag | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");

  const loadInFlightRef = useRef(false);

  const resetFeedback = () => {
    setStrongest(null);
    setNeedsWork(null);
    setFeedbackNote("");
  };

  const loadNextPerson = useCallback(async () => {
    if (!user?.id) return;
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;

    setLoading(true);
    setEmptyPool(false);
    setPerson(null);
    setPhotoIndex(0);
    setScore(DEFAULT_SCORE);
    setResult(null);
    setMyScore(null);
    resetFeedback();

    try {
      let competitorsQuery = db
        .from("users")
        .select(
          "user_id, username, name, photo_urls, gender, country, age, height_cm, weight_kg, arena_energy",
        )
        .eq("is_competitor", true)
        .eq("is_competing", true)
        .eq("is_blocked", false)
        .gt("arena_energy", 0)
        .not("photo_urls", "is", null)
        .neq("user_id", user.id)
        .limit(200);

      if (genderMode === "male" || genderMode === "female") {
        competitorsQuery = competitorsQuery.eq("gender", genderMode);
      }

      const [competitorsRes, ratingsRes, blocksRes] = await Promise.all([
        competitorsQuery,
        db.from("psl_ratings").select("rated_user_id").eq("rater_id", user.id),
        db.from("user_blocks").select("blocked_user_id").eq("blocker_id", user.id),
      ]);

      if (competitorsRes.error) throw competitorsRes.error;
      if (ratingsRes.error) throw ratingsRes.error;
      if (blocksRes.error) throw blocksRes.error;

      const alreadyRated = new Set(
        ((ratingsRes.data as Array<{ rated_user_id: string }> | null) ?? []).map(
          (row) => row.rated_user_id,
        ),
      );
      const blockedIds = new Set(
        ((blocksRes.data as Array<{ blocked_user_id: string }> | null) ?? []).map(
          (row) => row.blocked_user_id,
        ),
      );

      const pool = ((competitorsRes.data as RateableUser[] | null) ?? []).filter((candidate) => {
        if (alreadyRated.has(candidate.user_id)) return false;
        if (blockedIds.has(candidate.user_id)) return false;
        if (genderMode !== "random" && normalizeGender(candidate.gender) !== genderMode) {
          return false;
        }
        return getPhotos(candidate).length >= 1;
      });

      if (pool.length === 0) {
        setEmptyPool(true);
        return;
      }

      const pick = pool[Math.floor(Math.random() * pool.length)];
      setPerson(pick);
      setPhotoIndex(0);

      // Person is shown to the rater — spend energy (non-blocking).
      spendEnergyForExposure([pick.user_id]);
    } catch (error) {
      toast({
        title: "Could not load someone to rate",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      loadInFlightRef.current = false;
    }
  }, [user?.id, toast, genderMode]);

  useEffect(() => {
    void loadNextPerson();
  }, [loadNextPerson]);

  const handleGenderModeChange = (next: PslGenderMode) => {
    if (next === genderMode) return;
    loadInFlightRef.current = false;
    setPerson(null);
    setEmptyPool(false);
    setLoading(true);
    setGenderMode(next);
  };

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


  const handlePhotoTap = () => {
    if (!person) return;
    const photos = getPhotos(person);
    if (photos.length <= 1) return;
    setPhotoIndex((current) => (current + 1) % photos.length);
  };

  const trimmedNote = feedbackNote.trim();
  const noteNeedsTag = trimmedNote.length > 0 && !strongest && !needsWork;

  const handleSubmit = async () => {
    if (!user?.id || !person || submitting || result) return;
    if (noteNeedsTag) return;

    setSubmitting(true);
    try {
      const { data, error } = await db.rpc("submit_psl_rating", {
        p_rated_user_id: person.user_id,
        p_score: score,
      });

      if (error) throw error;

      const parsed = parseRpcResult(data);
      setResult(parsed);
      setMyScore(score);

      track("psl_rating_submitted", { score });

      if (strongest || needsWork) {
        try {
          const { error: feedbackError } = await db.from("psl_feedback").upsert(
            {
              author_id: user.id,
              target_user_id: person.user_id,
              strongest: strongest ?? null,
              needs_work: needsWork ?? null,
              comment: trimmedNote.length > 0 ? trimmedNote.slice(0, PSL_FEEDBACK_COMMENT_MAX) : null,
            },
            { onConflict: "author_id,target_user_id" },
          );

          if (feedbackError) throw feedbackError;

          track("psl_feedback_given", {
            strongest: strongest ?? null,
            needs_work: needsWork ?? null,
            has_note: trimmedNote.length > 0,
          });
        } catch (feedbackError) {
          toast({
            title: "Rating saved, but feedback failed",
            description: getErrorMessage(feedbackError),
            variant: "destructive",
          });
        }
      }

      try {
        const nextEnergy = await grantEnergyForParticipation();
        setArenaEnergy(nextEnergy);
      } catch (energyError) {
        console.error("grant_energy_for_participation failed:", energyError);
      }
    } catch (error) {
      toast({
        title: "Could not submit rating",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const photos = person ? getPhotos(person) : [];
  const displayName = person?.name?.trim() || person?.username || "Competitor";
  const currentPhoto = photos[photoIndex] ?? photos[0] ?? null;
  const metaLine = person ? formatCompetitorMeta(person) : null;

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-background text-foreground sm:h-dvh sm:overflow-hidden">
      <AppHeader energy={arenaEnergy} compact />

      <div className="container mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 py-2 sm:overflow-hidden sm:px-6">
        <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1 text-left">
            <p className="text-eyebrow mb-0">PSL</p>
            <h1 className="text-section text-foreground">PSL Rating</h1>
          </div>
          <GenderPoolToggle
            variant="psl"
            value={genderMode}
            onChange={handleGenderModeChange}
            disabled={loading || submitting}
            className="shrink-0"
          />
        </div>

        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : emptyPool ? (
          <div className="mx-auto max-w-md surface-card space-y-4 p-8 text-center">
            <p className="text-lg font-semibold font-body text-foreground">
              You've rated every challenger. Invite more people in and come back for new faces.
            </p>
            <Button
              type="button"
              className="w-full font-body"
              onClick={() => {
                void shareInvite("psl").then((result) => {
                  if (result.copied) {
                    toast({ title: "Link copied" });
                  }
                });
              }}
            >
              MOGG YOUR FRIENDS
            </Button>
            <Button asChild variant="outline" className="w-full font-body">
              <Link to="/arena">Go to Arena</Link>
            </Button>
          </div>
        ) : person && currentPhoto ? (
          <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-2 overflow-hidden sm:gap-4">
            <div className="shrink-0 overflow-hidden surface-card">
              <button
                type="button"
                onClick={handlePhotoTap}
                className="relative mx-auto block h-[20dvh] w-full max-h-[180px] bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-[22dvh] sm:max-h-[220px]"
                aria-label={photos.length > 1 ? "Tap to see next photo" : "Photo"}
              >
                <img
                  src={currentPhoto}
                  alt={displayName}
                  className="h-full w-full object-cover object-center"
                />
                {photos.length > 1 && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-2">
                    <p className="text-meta text-white/90">
                      Tap photo · {photoIndex + 1}/{photos.length}
                    </p>
                  </div>
                )}
              </button>
              <div className="space-y-0 px-4 py-2">
                <p className="truncate text-section text-foreground tracking-tight">
                  {displayName}
                </p>
                <p className="truncate text-meta">
                  {person.country || "Unknown country"}
                </p>
                {metaLine && (
                  <p className="truncate text-meta leading-tight">
                    {metaLine}
                  </p>
                )}
              </div>
            </div>

            {result && myScore != null ? (
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto surface-card border-primary/50 p-4 text-center shadow-primary-glow sm:space-y-4 sm:p-6">
                <p className="text-eyebrow">Community average</p>
                <p className="text-stat-hero text-primary">
                  {Number(result.average).toFixed(2)}
                </p>
                <p className="text-meta">
                  Based on {result.count} {result.count === 1 ? "rating" : "ratings"}
                </p>
                <div className="mx-auto h-px w-16 bg-border" />
                <p className="text-meta">Your rating</p>
                <p className="text-stat-sm text-foreground">{formatScoreDisplay(myScore)}</p>
                <Button
                  type="button"
                  onClick={() => void loadNextPerson()}
                  className="w-full font-body"
                >
                  Next
                </Button>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto surface-card p-4 sm:gap-4 sm:p-6">
                <div className="shrink-0 text-center">
                  <p className="text-meta mb-2">Your PSL</p>
                  <p
                    key={score}
                    className="text-stat-hero text-primary animate-stat-tick"
                  >
                    {formatScoreDisplay(score)}
                  </p>
                </div>

                <div className="shrink-0">
                  <PslRatingSlider
                    value={score}
                    onValueChange={setScore}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-3 border-t border-border pt-3">
                  <div className="space-y-2">
                    <p className="text-meta">Strongest feature</p>
                    <div className="flex flex-wrap gap-2">
                      {PSL_FEEDBACK_TAGS.map((tag) => {
                        const active = strongest === tag;
                        return (
                          <button
                            key={`strong-${tag}`}
                            type="button"
                            disabled={submitting}
                            onClick={() => setStrongest(active ? null : tag)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-semibold font-body transition-colors",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-meta">Needs work</p>
                    <div className="flex flex-wrap gap-2">
                      {PSL_FEEDBACK_TAGS.map((tag) => {
                        const active = needsWork === tag;
                        return (
                          <button
                            key={`needs-${tag}`}
                            type="button"
                            disabled={submitting}
                            onClick={() => setNeedsWork(active ? null : tag)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-semibold font-body transition-colors",
                              active
                                ? "border-border bg-foreground text-background"
                                : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-meta">Add a note (optional)</p>
                      <p className="text-meta tabular-nums">
                        {feedbackNote.length}/{PSL_FEEDBACK_COMMENT_MAX}
                      </p>
                    </div>
                    <Textarea
                      value={feedbackNote}
                      onChange={(e) =>
                        setFeedbackNote(e.target.value.slice(0, PSL_FEEDBACK_COMMENT_MAX))
                      }
                      disabled={submitting}
                      maxLength={PSL_FEEDBACK_COMMENT_MAX}
                      placeholder="Be specific and constructive — what would you actually change?"
                      className="min-h-[88px] resize-none text-sm"
                    />
                    {noteNeedsTag && (
                      <p className="text-xs font-body text-destructive">
                        Pick a strongest or needs-work tag to leave a note.
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting || noteNeedsTag}
                  className="w-full shrink-0 font-body"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Rating"
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground font-body">Unable to load someone to rate.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Rate;
