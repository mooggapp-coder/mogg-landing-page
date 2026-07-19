import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const TICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type PslRatingSliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Phone-friendly 1–10 PSL slider with a thick track, glowing fill,
 * large thumb, and labeled tick marks under every whole number.
 */
export function PslRatingSlider({
  value,
  onValueChange,
  disabled = false,
  className,
}: PslRatingSliderProps) {
  const [dragging, setDragging] = React.useState(false);

  return (
    <div className={cn("w-full select-none", className)}>
      <SliderPrimitive.Root
        value={[value]}
        min={1}
        max={10}
        step={0.25}
        disabled={disabled}
        onValueChange={(values) => {
          const next = values[0];
          if (typeof next === "number") onValueChange(next);
        }}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onBlur={() => setDragging(false)}
        className="relative flex w-full touch-none items-center py-4"
        aria-label="PSL rating from 1 to 10"
      >
        <SliderPrimitive.Track className="relative h-4 w-full grow overflow-visible rounded-full bg-muted">
          <SliderPrimitive.Range
            className="absolute h-full rounded-full bg-primary shadow-primary-glow"
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-8 w-8 rounded-full border-2 border-primary bg-primary shadow-primary-glow",
            "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
            "transition-transform duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
            dragging && "scale-110",
          )}
        />
      </SliderPrimitive.Root>

      <div className="relative -mt-0 h-8 px-0">
        {TICKS.map((tick) => {
          const pct = ((tick - 1) / 9) * 100;
          return (
            <div
              key={tick}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${pct}%` }}
            >
              <span className="mb-2 h-2 w-px bg-muted-foreground/50" aria-hidden />
              <span className="text-meta tabular-nums">{tick}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
