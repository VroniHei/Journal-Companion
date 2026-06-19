import { FormattedText } from "./FormattedText";

export function ReflectionView({
  text,
  crisis = false,
}: {
  text: string;
  crisis?: boolean;
}) {
  const color = crisis ? "var(--danger)" : "var(--accent-text)";
  return (
    <div
      className="rounded-lg border-l-2 p-4"
      style={{
        borderColor: color,
        background: `color-mix(in srgb, ${color} 7%, transparent)`,
      }}
    >
      <p
        className="mb-2 text-xs font-medium uppercase tracking-wide"
        style={{ color }}
      >
        {crisis ? "Schutzhinweis" : "Reflexion des Begleiters"}
      </p>
      {text ? (
        <FormattedText text={text} className="text-[15px]" />
      ) : (
        <div className="text-[15px] text-[var(--muted)]">…</div>
      )}
    </div>
  );
}
