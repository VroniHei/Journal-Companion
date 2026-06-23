import { FieldLabel } from "../ui";

export function ScaleField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} hint={hint} />
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              aria-label={`${label}: ${n}`}
              onClick={() => onChange(n)}
              className="h-9 w-9 rounded-full border text-sm transition"
              style={{
                borderColor: active ? "transparent" : "var(--border)",
                background: active
                  ? "linear-gradient(135deg,#B4ED63,#A8E84F)"
                  : "transparent",
                color: active ? "#23221A" : "var(--foreground)",
                fontWeight: active ? 700 : 500,
                boxShadow: active ? "0 3px 8px rgba(110,155,44,.32)" : "none",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
