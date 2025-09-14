import { cn } from "../lib/utils";

export function ConfidenceMeter({ value }: { value?: number | null }) {
  if (value == null) return null;
  
  // Convert to percentage (0-100) and clamp to valid range
  const v = Math.max(0, Math.min(100, Math.round(value * 100)));
  const filled = Math.round(v / 20); // 0..5 segments
  const tier = v >= 75 ? "High" : v >= 45 ? "Medium" : "Low";
  
  return (
    <div className="flex items-center gap-2" title={`${v}% confidence`}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "block h-2.5 w-6 rounded-sm",
              i < filled
                ? tier === "High"
                  ? "bg-emerald-500"
                  : tier === "Medium"
                  ? "bg-amber-500"
                  : "bg-rose-500"
                : "bg-neutral-200"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span
        className={cn(
          "text-[12px] font-medium",
          tier === "High" ? "text-emerald-700" : tier === "Medium" ? "text-amber-700" : "text-rose-700"
        )}
        aria-label={`Confidence ${tier}`}
      >
        {tier}
      </span>
    </div>
  );
}
