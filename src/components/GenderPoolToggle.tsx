import { Mars, Shuffle, Venus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ArenaGenderMode = "male" | "female";
export type PslGenderMode = "male" | "female" | "random";

type ArenaToggleProps = {
  variant: "arena";
  value: ArenaGenderMode;
  onChange: (next: ArenaGenderMode) => void;
  disabled?: boolean;
  className?: string;
};

type PslToggleProps = {
  variant: "psl";
  value: PslGenderMode;
  onChange: (next: PslGenderMode) => void;
  disabled?: boolean;
  className?: string;
};

type GenderPoolToggleProps = ArenaToggleProps | PslToggleProps;

const PSL_OPTIONS: Array<{
  value: PslGenderMode;
  label: string;
  Icon: typeof Mars;
}> = [
  { value: "male", label: "Men", Icon: Mars },
  { value: "female", label: "Women", Icon: Venus },
  { value: "random", label: "Random", Icon: Shuffle },
];

/**
 * Arena: circular button showing the opposite gender (tap to switch pools).
 * PSL: segmented Men / Women / Random control.
 */
export function GenderPoolToggle(props: GenderPoolToggleProps) {
  if (props.variant === "arena") {
    const opposite: ArenaGenderMode = props.value === "male" ? "female" : "male";
    const Icon = opposite === "male" ? Mars : Venus;
    const label = opposite === "male" ? "Switch to men" : "Switch to women";

    return (
      <button
        type="button"
        onClick={() => props.onChange(opposite)}
        disabled={props.disabled}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary/70 text-foreground shadow-sm transition-colors",
          "hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          props.className,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Gender filter"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary/50 p-0.5",
        props.className,
      )}
    >
      {PSL_OPTIONS.map(({ value, label, Icon }) => {
        const active = props.value === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => props.onChange(value)}
            disabled={props.disabled}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold font-body transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50",
              active
                ? "bg-primary text-primary-foreground shadow-primary-glow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
