import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

import jordanPhoto from "@/assets/demo-jordan.jpg";
import chicoPhoto from "@/assets/demo-chico.jpg";
import fighter1Photo from "@/assets/demo-fighter-1.png";
import fighter2Photo from "@/assets/demo-fighter-2.png";

type DemoCompetitor = {
  id: string;
  name: string;
  country: string;
  age: number;
  heightCm: number;
  weightKg: number;
  photo: string;
};

type DemoPair = {
  a: DemoCompetitor;
  b: DemoCompetitor;
};

/** Pair 0 is shown; pair 1 is prepared for a future multi-vote demo. */
const DEMO_PAIRS: DemoPair[] = [
  {
    a: {
      id: "demo_jordan",
      name: "Jordan Barrett",
      country: "Australia",
      age: 29,
      heightCm: 188,
      weightKg: 78,
      photo: jordanPhoto,
    },
    b: {
      id: "demo_chico",
      name: "Chico Lachowski",
      country: "Brazil",
      age: 34,
      heightCm: 191,
      weightKg: 85,
      photo: chicoPhoto,
    },
  },
  {
    a: {
      id: "demo_giga",
      name: "Giga Chad",
      country: "United States",
      age: 27,
      heightCm: 185,
      weightKg: 82,
      photo: fighter1Photo,
    },
    b: {
      id: "demo_marlon",
      name: "Marlon",
      country: "Brazil",
      age: 31,
      heightCm: 183,
      weightKg: 80,
      photo: fighter2Photo,
    },
  },
];

const POST_VOTE_MS = 1000;

function formatMeta(competitor: DemoCompetitor): string {
  return `${competitor.age} · ${competitor.heightCm} cm · ${competitor.weightKg} kg`;
}

type Phase = "battle" | "cta";

const ArenaDemoSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [pairIndex] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("battle");
  const voteLockRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstVoteTrackedRef = useRef(false);

  const pair = DEMO_PAIRS[pairIndex] ?? DEMO_PAIRS[0];

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const handleVote = (competitorId: string) => {
    if (voteLockRef.current || winnerId || phase !== "battle") return;
    voteLockRef.current = true;
    setWinnerId(competitorId);

    if (!firstVoteTrackedRef.current) {
      firstVoteTrackedRef.current = true;
      track("demo_vote_cast", { competitor_id: competitorId });
    }

    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      // First vote ends the demo with signup — pair 1 stays reserved for later.
      setPhase("cta");
    }, POST_VOTE_MS);
  };

  const renderCard = (competitor: DemoCompetitor) => {
    const isWinner = winnerId === competitor.id;
    const isLoser = winnerId != null && winnerId !== competitor.id;
    const canVote = phase === "battle" && !winnerId;

    return (
      <div
        role="button"
        tabIndex={canVote ? 0 : -1}
        aria-label={`Vote for ${competitor.name}`}
        onClick={() => {
          if (!canVote) return;
          handleVote(competitor.id);
        }}
        onKeyDown={(event) => {
          if (!canVote) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleVote(competitor.id);
          }
        }}
        className={cn(
          "group relative flex h-fit w-full max-w-md flex-col overflow-hidden surface-card text-left motion-safe:transition-transform motion-safe:duration-150",
          isWinner &&
            "z-10 border-primary ring-2 ring-primary bg-primary/10 shadow-primary-glow scale-[1.02] animate-win-pulse",
          isLoser && "opacity-40 scale-[0.98]",
          canVote && "hover:border-primary/60 cursor-pointer active:scale-[0.97]",
          !canVote && "cursor-default",
        )}
      >
        <div className="relative mx-auto w-full shrink-0 overflow-hidden bg-secondary aspect-[3/4] max-h-[min(42dvh,320px)] sm:max-h-[min(48dvh,420px)]">
          <img
            src={competitor.photo}
            alt={competitor.name}
            className="h-full w-full object-cover object-center"
            draggable={false}
          />
          {isWinner && (
            <div className="absolute inset-x-0 top-0 bg-primary px-4 py-2 text-center shadow-primary-glow">
              <span className="text-section text-primary-foreground tracking-widest">
                WIN
              </span>
            </div>
          )}
        </div>
        <div className="space-y-0 p-3 sm:space-y-1 sm:p-4 shrink-0">
          <p className="truncate text-section text-foreground tracking-tight">
            {competitor.name}
          </p>
          <p className="truncate text-meta">{competitor.country}</p>
          <p className="truncate text-meta leading-tight">
            {formatMeta(competitor)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <section
      ref={ref}
      className="overflow-x-hidden bg-background py-12 lg:py-16"
      aria-labelledby="arena-demo-heading"
    >
      <div className="container mx-auto max-w-4xl px-6">
        <div className="mb-8 text-center">
          <p
            className={cn(
              "text-eyebrow mb-2",
              isVisible ? "animate-fade-in" : "opacity-0",
            )}
          >
            TRY IT
          </p>
          <h2
            id="arena-demo-heading"
            className={cn(
              "text-page-title text-primary leading-[0.85]",
              isVisible ? "animate-fade-in" : "opacity-0",
            )}
            style={{ animationDelay: "40ms" }}
          >
            Who wins?
          </h2>
          <p
            className={cn(
              "mt-3 text-meta",
              isVisible ? "animate-fade-in" : "opacity-0",
            )}
            style={{ animationDelay: "80ms" }}
          >
            Tap a competitor to cast your vote.
          </p>
        </div>

        {phase === "cta" ? (
          <div
            className={cn(
              "mx-auto max-w-lg surface-card space-y-6 p-8 text-center",
              "motion-safe:animate-fade-in",
            )}
          >
            <h3 className="text-section text-foreground tracking-tight">
              Not bad. Now enter for real.
            </h3>
            <p className="text-body text-muted-foreground">
              Create your account to compete, climb the world ranking, and see
              where you stand.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex h-btn-primary min-h-btn-primary w-full sm:w-auto items-center justify-center rounded-md bg-primary px-8 text-base font-bold text-primary-foreground shadow-primary-glow transition-[transform,box-shadow] duration-150 hover:bg-primary/90 active:scale-[0.97] font-body motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                Create Your Account
              </Link>
              <Link
                to="/login"
                className="text-meta hover:text-foreground hover:underline"
              >
                Already competing? Log in
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative mx-auto grid max-w-3xl grid-cols-1 content-start items-start justify-items-center gap-4 sm:grid-cols-2 sm:gap-6">
            {renderCard(pair.a)}

            <div
              className="relative z-20 flex justify-center sm:pointer-events-none sm:absolute sm:left-1/2 sm:top-[42%] sm:z-20 sm:-translate-x-1/2 sm:-translate-y-1/2"
              aria-hidden
            >
              <div className="vs-badge shrink-0">VS</div>
            </div>

            {renderCard(pair.b)}
          </div>
        )}
      </div>
    </section>
  );
};

export default ArenaDemoSection;
