import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useData";
import {
  orderedPacks,
  type ImpulseIcon,
  type ImpulsePack,
} from "../lib/impulsePacks";
import { DesktopModal } from "../components/DesktopModal";

function Icon({ name }: { name: ImpulseIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: 19,
    height: 19,
  };
  switch (name) {
    case "moon":
      return (
        <svg {...common}>
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M14.9 9.1 11 11l-1.9 3.9 3.9-1.9 1.9-3.9z" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M4 15 C7.5 15 8.5 7 12 7 C15.5 7 16.5 16 20 11" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...common}>
          <path d="M12 19l7-7-3-3-7 7-1 4 4-1z" />
          <path d="M15 6l3 3" />
        </svg>
      );
    case "sort":
    default:
      return (
        <svg {...common}>
          <path d="M5 7h14M5 12h9M5 17h5" />
        </svg>
      );
  }
}

// Impuls-Pakete: kuratierte Schreib-Impulse nach Thema, an die Fokus-Wahl aus
// dem Onboarding gekoppelt. Impuls antippen startet einen Eintrag damit.
export function Impulses() {
  const settings = useSettings();
  const navigate = useNavigate();
  const { primary, rest } = orderedPacks(settings.focusArea);
  const [open, setOpen] = useState<string | null>(null);

  function start(prompt: string) {
    navigate(`/neu?prompt=${encodeURIComponent(prompt)}`);
  }

  function PromptList({ prompts }: { prompts: string[] }) {
    return (
      <div className="flex flex-col gap-[9px]">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => start(p)}
            className="rounded-xl border border-[var(--border)] bg-[#FAF9F5] px-3.5 py-3 text-left text-[15px] leading-[1.45] text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            {p}
          </button>
        ))}
      </div>
    );
  }

  function RestRow({ pack }: { pack: ImpulsePack }) {
    const isOpen = open === pack.id;
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={() => setOpen(isOpen ? null : pack.id)}
          aria-expanded={isOpen}
          className="flex w-full items-center gap-[13px] px-4 py-[15px] text-left"
        >
          <span className="inline-flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-[#F1ECE0] text-[#9a917f]">
            <Icon name={pack.icon} />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-[650] text-[var(--foreground)]">
              {pack.name}
            </span>
            <span className="mt-px block text-[13px] text-[#9a917f]">
              {pack.subtitle} · {pack.prompts.length} Impulse
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9a917f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="18"
            height="18"
            className="flex-none transition-transform"
            style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        {isOpen && (
          <div className="px-4 pb-4">
            <PromptList prompts={pack.prompts} />
          </div>
        )}
      </div>
    );
  }

  return (
    <DesktopModal onClose={() => navigate("/")} maxWidth={620}>
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="serif text-3xl font-semibold">Impulse</h1>
          <p className="lead mt-2 text-[16px] text-[var(--foreground)]">
            Ein Satz als <em className="g">Auftakt</em>, wenn das leere Blatt zu
            groß wirkt.
          </p>
        </div>
        {/* Desktop-Modal: Schließen-X (Mobile: Tab/Zurück) */}
        <button
          type="button"
          aria-label="Schließen"
          onClick={() => navigate("/")}
          className="hidden h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--foreground)] lg:inline-flex"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {primary && (
        <>
          <div className="inline-flex items-center gap-[7px] rounded-full bg-[#F1ECE0] px-[13px] py-1.5 pl-[11px] text-[13px] font-medium text-[#5d4f3f]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#CD8A5B]" />
            Passend zu deinem Fokus: {settings.focusArea}
          </div>

          <div
            className="rounded-[20px] border-[1.5px] p-[18px] shadow-[0_10px_28px_rgba(110,155,44,.12)]"
            style={{
              borderColor: "#A8E84F",
              background:
                "radial-gradient(260px 150px at 100% 0%, rgba(168,232,79,.1), transparent 62%), var(--surface)",
            }}
          >
            <div className="mb-3.5 flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-[#6E9B2C]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#447510]">
                {primary.name} · {primary.prompts.length} Impulse
              </span>
            </div>
            <PromptList prompts={primary.prompts} />
          </div>
        </>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
        {primary ? "Weitere Pakete" : "Pakete"}
      </div>
      <div className="flex flex-col gap-2.5">
        {rest.map((p) => (
          <RestRow key={p.id} pack={p} />
        ))}
      </div>
    </section>
    </DesktopModal>
  );
}
