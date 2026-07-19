import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchArenaEnergy } from "@/lib/arena-energy";
import { track } from "@/lib/analytics";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type LeaderboardRow = {
  user_id: string;
  username: string | null;
  name: string | null;
  photo_urls: string[] | null;
  country: string | null;
  mogg_score: number | null;
  /** Rank from the displayed snapshot (or live order when falling back). */
  snapshotRank: number | null;
};

type RankSnapshotRow = {
  user_id: string;
  global_rank: number | null;
  local_rank: number | null;
  mogg_score: number | null;
  date?: string;
};

type UserProfileRow = {
  user_id: string;
  username: string | null;
  name: string | null;
  photo_urls: string[] | null;
  country: string | null;
};

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

function getFirstPhoto(row: LeaderboardRow): string | null {
  if (!Array.isArray(row.photo_urls)) return null;
  const url = row.photo_urls.find((item) => typeof item === "string" && item.length > 0);
  return url ?? null;
}

function hasPhotos(row: LeaderboardRow): boolean {
  return getFirstPhoto(row) != null;
}

function formatSnapshotDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildRankMap(
  rows: RankSnapshotRow[],
  field: "global_rank" | "local_rank",
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const rank = row[field];
    if (!row.user_id) continue;
    if (typeof rank === "number" && rank > 0) {
      map.set(row.user_id, rank);
    }
  }
  return map;
}

function RankMovement({
  currentRank,
  previousRank,
}: {
  currentRank: number;
  previousRank: number | undefined;
}) {
  if (previousRank == null) {
    return <span className="text-xs font-body text-muted-foreground">NEW</span>;
  }

  const diff = previousRank - currentRank;
  if (diff === 0) {
    return <span className="text-xs font-body text-muted-foreground">—</span>;
  }

  if (diff > 0) {
    return (
      <span className="inline-flex items-center justify-end gap-2 text-meta font-semibold text-primary">
        <ChevronUp className="h-4 w-4" />
        {diff}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-end gap-2 text-meta font-semibold text-red-400/80">
      <ChevronDown className="h-4 w-4" />
      {Math.abs(diff)}
    </span>
  );
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"global" | "local">("global");
  const [loading, setLoading] = useState(true);
  const [voterCountry, setVoterCountry] = useState<string | null>(null);
  const [globalRows, setGlobalRows] = useState<LeaderboardRow[]>([]);
  const [localRows, setLocalRows] = useState<LeaderboardRow[]>([]);
  const [previousGlobalRanks, setPreviousGlobalRanks] = useState<Map<string, number>>(new Map());
  const [previousLocalRanks, setPreviousLocalRanks] = useState<Map<string, number>>(new Map());
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [isLiveFallback, setIsLiveFallback] = useState(false);
  const [arenaEnergy, setArenaEnergy] = useState<number | null>(null);

  const loadLiveFallback = async (country: string | null) => {
    const { data: globalData, error: globalError } = await db
      .from("users")
      .select("user_id, username, name, photo_urls, country, mogg_score")
      .eq("is_competitor", true)
      .eq("is_competing", true)
      .eq("is_blocked", false)
      .not("photo_urls", "is", null)
      .order("mogg_score", { ascending: false })
      .limit(100);

    if (globalError) throw globalError;

    const globalFiltered = ((globalData as UserProfileRow & { mogg_score: number | null }[] | null) ?? [])
      .filter((row) => Array.isArray(row.photo_urls) && row.photo_urls.some((u) => typeof u === "string" && u.length > 0))
      .map((row, index) => ({
        user_id: row.user_id,
        username: row.username,
        name: row.name,
        photo_urls: row.photo_urls,
        country: row.country,
        mogg_score: row.mogg_score,
        snapshotRank: index + 1,
      }));

    setGlobalRows(globalFiltered);
    setPreviousGlobalRanks(new Map());
    setPreviousLocalRanks(new Map());
    setSnapshotDate(null);
    setIsLiveFallback(true);

    if (country) {
      const { data: localData, error: localError } = await db
        .from("users")
        .select("user_id, username, name, photo_urls, country, mogg_score")
        .eq("is_competitor", true)
        .eq("is_competing", true)
        .eq("is_blocked", false)
        .eq("country", country)
        .not("photo_urls", "is", null)
        .order("mogg_score", { ascending: false })
        .limit(100);

      if (localError) throw localError;

      setLocalRows(
        ((localData as UserProfileRow & { mogg_score: number | null }[] | null) ?? [])
          .filter((row) => Array.isArray(row.photo_urls) && row.photo_urls.some((u) => typeof u === "string" && u.length > 0))
          .map((row, index) => ({
            user_id: row.user_id,
            username: row.username,
            name: row.name,
            photo_urls: row.photo_urls,
            country: row.country,
            mogg_score: row.mogg_score,
            snapshotRank: index + 1,
          })),
      );
    } else {
      setLocalRows([]);
    }
  };

  const loadLeaderboard = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data: me, error: meError } = await db
        .from("users")
        .select("user_id, country")
        .eq("user_id", user.id)
        .maybeSingle();

      if (meError) throw meError;

      const country =
        typeof me?.country === "string" && me.country.trim() ? me.country.trim() : null;
      setVoterCountry(country);

      // 1) Latest snapshot date
      const { data: latestDateRow, error: latestDateError } = await db
        .from("rank_history")
        .select("date")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestDateError) throw latestDateError;

      const latestDate =
        typeof latestDateRow?.date === "string" ? latestDateRow.date.slice(0, 10) : null;

      if (!latestDate) {
        await loadLiveFallback(country);
        return;
      }

      // 2) Second-most-recent date (for movement arrows)
      const { data: previousDateRow, error: previousDateError } = await db
        .from("rank_history")
        .select("date")
        .lt("date", latestDate)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousDateError) throw previousDateError;

      const previousDate =
        typeof previousDateRow?.date === "string" ? previousDateRow.date.slice(0, 10) : null;

      // 3) Snapshot rows for latest date
      const { data: snapshotData, error: snapshotError } = await db
        .from("rank_history")
        .select("user_id, global_rank, local_rank, mogg_score")
        .eq("date", latestDate);

      if (snapshotError) throw snapshotError;

      const snapshot = (snapshotData as RankSnapshotRow[] | null) ?? [];
      if (snapshot.length === 0) {
        await loadLiveFallback(country);
        return;
      }

      const userIds = Array.from(new Set(snapshot.map((row) => row.user_id).filter(Boolean)));

      // 4) Join profile fields from users
      const { data: usersData, error: usersError } = await db
        .from("users")
        .select("user_id, username, name, photo_urls, country")
        .in("user_id", userIds);

      if (usersError) throw usersError;

      const userMap = new Map<string, UserProfileRow>(
        ((usersData as UserProfileRow[] | null) ?? []).map((row) => [row.user_id, row]),
      );

      const joinSnapshot = (
        rankField: "global_rank" | "local_rank",
        countryFilter?: string | null,
      ): LeaderboardRow[] => {
        return snapshot
          .map((snap) => {
            const profile = userMap.get(snap.user_id);
            if (!profile) return null;
            if (countryFilter && (profile.country ?? "").trim() !== countryFilter) return null;

            const rank = snap[rankField];
            if (typeof rank !== "number" || rank <= 0) return null;

            return {
              user_id: snap.user_id,
              username: profile.username,
              name: profile.name,
              photo_urls: profile.photo_urls,
              country: profile.country,
              mogg_score: snap.mogg_score,
              snapshotRank: rank,
            } satisfies LeaderboardRow;
          })
          .filter((row): row is LeaderboardRow => row != null && hasPhotos(row))
          .sort((a, b) => (a.snapshotRank ?? 999999) - (b.snapshotRank ?? 999999))
          .slice(0, 100);
      };

      setGlobalRows(joinSnapshot("global_rank"));
      setLocalRows(country ? joinSnapshot("local_rank", country) : []);
      setSnapshotDate(latestDate);
      setIsLiveFallback(false);

      // 5) Previous-day ranks for movement
      if (previousDate) {
        const { data: previousSnapshot, error: previousSnapshotError } = await db
          .from("rank_history")
          .select("user_id, global_rank, local_rank")
          .eq("date", previousDate);

        if (previousSnapshotError) throw previousSnapshotError;

        const prevRows = (previousSnapshot as RankSnapshotRow[] | null) ?? [];
        setPreviousGlobalRanks(buildRankMap(prevRows, "global_rank"));
        setPreviousLocalRanks(buildRankMap(prevRows, "local_rank"));
      } else {
        setPreviousGlobalRanks(new Map());
        setPreviousLocalRanks(new Map());
      }
    } catch (error) {
      toast({
        title: "Could not load leaderboard",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    track("leaderboard_viewed", { tab });
  }, [tab]);

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

  const renderRows = (rows: LeaderboardRow[], previousRanks: Map<string, number>) => {
    if (rows.length === 0) {
      return (
        <div className="surface-card p-8 text-center">
          <p className="text-meta">No challengers ranked yet. Be the first.</p>
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {rows.map((row, index) => {
          const rank = row.snapshotRank ?? index + 1;
          const isSelf = row.user_id === user?.id;
          const displayName = row.name?.trim() || row.username || "Competitor";
          const photo = getFirstPhoto(row);
          const isTopThree = rank <= 3;
          const podiumAccent =
            rank === 1
              ? "border-gold/70 bg-gold/5 shadow-[0_0_24px_hsl(var(--gold)/0.2)]"
              : rank === 2
                ? "border-silver/70 bg-silver/5 shadow-[0_0_20px_hsl(var(--silver)/0.15)]"
                : rank === 3
                  ? "border-bronze/70 bg-bronze/5 shadow-[0_0_20px_hsl(var(--bronze)/0.15)]"
                  : "";
          const rankColor =
            rank === 1
              ? "text-gold"
              : rank === 2
                ? "text-silver"
                : rank === 3
                  ? "text-bronze"
                  : "text-foreground";

          return (
            <li key={row.user_id}>
              <button
                type="button"
                onClick={() => navigate(isSelf ? "/profile" : `/u/${row.user_id}`)}
                className={cn(
                  "flex w-full min-w-0 items-center gap-4 surface-card text-left transition hover:border-primary/50",
                  isTopThree ? "px-4 py-4 sm:px-6 sm:py-6" : "px-4 py-2 sm:py-4",
                  isSelf && !isTopThree && "border-primary bg-primary/10 shadow-primary-glow-sm",
                  isSelf && isTopThree && "ring-2 ring-primary",
                  podiumAccent,
                )}
              >
                {/* RANK */}
                <span
                  className={cn(
                    "w-16 shrink-0 text-center tabular-nums sm:w-20",
                    isTopThree ? "text-stat-sm" : "text-section",
                    rankColor,
                  )}
                >
                  {rank}
                </span>

                {/* AVATAR + muted identity */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div
                    className={cn(
                      "shrink-0 overflow-hidden rounded-full border bg-secondary",
                      isTopThree
                        ? "h-16 w-16 border-2 sm:h-20 sm:w-20"
                        : "h-12 w-12 border-border",
                      rank === 1 && "border-gold",
                      rank === 2 && "border-silver",
                      rank === 3 && "border-bronze",
                    )}
                  >
                    {photo ? (
                      <img src={photo} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-meta">?</div>
                    )}
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="truncate text-meta">
                      {displayName}
                      {isSelf ? " · You" : ""}
                    </p>
                    <p className="truncate text-meta opacity-70">@{row.username || "user"}</p>
                  </div>
                </div>

                {/* SCORE */}
                <div className="shrink-0 text-right tabular-nums">
                  <p
                    className={cn(
                      "normal-case text-foreground",
                      isTopThree ? "text-stat" : "text-stat-sm",
                    )}
                  >
                    {Math.round(Number(row.mogg_score ?? 0))}
                  </p>
                  <div className="mt-0 flex justify-end">
                    <RankMovement
                      currentRank={rank}
                      previousRank={previousRanks.get(row.user_id)}
                    />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <AppHeader energy={arenaEnergy} />

      <div className="container mx-auto max-w-full overflow-x-hidden px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-6 text-center">
          <p className="text-eyebrow mb-2">Rankings</p>
          <h1 className="text-page-title">WORLD RANKING</h1>
          <p className="mt-2 text-meta">Top competitors by MOGG score</p>
          <p className="mt-2 text-meta">
            {isLiveFallback || !snapshotDate
              ? "Live standings"
              : `Updated daily · Last updated ${formatSnapshotDate(snapshotDate)}`}
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "global" | "local")}
          className="mx-auto max-w-2xl"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="global" className="font-body">
              WORLD
            </TabsTrigger>
            <TabsTrigger value="local" className="font-body">
              COUNTRY
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
            </div>
          ) : (
            <>
              <TabsContent value="global" className="mt-0">
                {renderRows(globalRows, previousGlobalRanks)}
              </TabsContent>
              <TabsContent value="local" className="mt-0">
                {!voterCountry ? (
                  <div className="surface-card p-8 text-center">
                    <p className="text-meta">
                      No country set — claim your territory in setup.
                    </p>
                    <Button asChild className="mt-4 font-body">
                      <Link to="/setup">Go to setup</Link>
                    </Button>
                  </div>
                ) : (
                  renderRows(localRows, previousLocalRanks)
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </main>
  );
};

export default Leaderboard;
