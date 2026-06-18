import { FieldLabel } from "../ui";

export function ChipSelect({
  label,
  hint,
  options,
  selected,
  onChange,
  multi = true,
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
}) {
  function toggle(opt: string) {
    if (multi) {
      onChange(
        selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt],
      );
    } else {
      onChange(selected.includes(opt) ? [] : [opt]);
    }
  }

  return (
    <div>
      <FieldLabel label={label} hint={hint} />
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt)}
              className="rounded-full border px-3 py-1 text-sm transition"
              style={{
                borderColor: active ? "var(--accent)" : "var(--border)",
                background: active ? "var(--accent-soft)" : "transparent",
                color: "var(--foreground)",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
