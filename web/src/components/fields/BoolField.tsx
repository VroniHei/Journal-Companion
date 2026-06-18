import { FieldLabel } from "../ui";

export function BoolField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null | undefined;
  onChange: (v: boolean | null) => void;
}) {
  const options: { label: string; val: boolean }[] = [
    { label: "Ja", val: true },
    { label: "Nein", val: false },
  ];
  return (
    <div>
      <FieldLabel label={label} />
      <div className="flex gap-2">
        {options.map((o) => {
          const active = value === o.val;
          return (
            <button
              key={o.label}
              type="button"
              aria-pressed={active}
              // Erneutes Tippen hebt die Auswahl wieder auf (null = keine Angabe).
              onClick={() => onChange(active ? null : o.val)}
              className="rounded-full border px-4 py-1 text-sm transition"
              style={{
                borderColor: active ? "var(--accent)" : "var(--border)",
                background: active ? "var(--accent-soft)" : "transparent",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
