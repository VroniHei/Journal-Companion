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

  const count = selected.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {label}
          {hint && (
            <span className="ml-2 font-normal text-[var(--muted)]">{hint}</span>
          )}
        </span>
        {multi && count > 0 && (
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[13px] font-medium text-[var(--accent-text)]">
            {count} gewählt
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium text-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]"
              }`}
            >
              {active && (
                <span aria-hidden="true" className="text-[var(--green-deep)]">
                  ✓
                </span>
              )}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
