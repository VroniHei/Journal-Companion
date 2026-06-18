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
                borderColor: active ? "var(--accent)" : "var(--border)",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--foreground)",
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
