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
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                active
                  ? "font-semibold text-[#23221A]"
                  : "border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]"
              }`}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg,#EEF6E0,#E6F0D4)",
                      border: "1.5px solid #A8E84F",
                      boxShadow: "0 2px 5px rgba(110,155,44,.12)",
                    }
                  : undefined
              }
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
