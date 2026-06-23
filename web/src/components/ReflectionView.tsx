import { FormattedText } from "./FormattedText";
import { SpeakButton } from "./SpeakButton";
import { HelpLine } from "./HelpLine";

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
      <div className="mb-2 flex items-center justify-between gap-3">
        <p
          className="text-[13px] font-medium uppercase tracking-wide"
          style={{ color }}
        >
          {crisis ? "Schutzhinweis" : "Reflexion des Begleiters"}
        </p>
        {text && <SpeakButton text={text} />}
      </div>
      {text ? (
        <FormattedText text={text} className="text-[15px]" />
      ) : (
        <div className="text-[15px] text-[var(--muted)]">…</div>
      )}
      {text && (
        <HelpLine className="mt-4 border-t border-[var(--border)] pt-3" />
      )}
    </div>
  );
}
