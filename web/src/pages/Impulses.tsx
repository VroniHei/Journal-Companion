import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useData";
import {
  orderedPacks,
  type ImpulseCluster,
  type ImpulseIcon,
  type ImpulsePack,
} from "../lib/impulsePacks";
import { DesktopModal } from "../components/DesktopModal";

// Kachel-Token pro Cluster (APP-STYLE §14, 1:1).
const CLUSTER: Record<ImpulseCluster, { tile: string; fg: string; shadow: string }> = {
  green: { tile: "linear-gradient(155deg,#F2F5EC,#E4EAD6)", fg: "#6E9B2C", shadow: "rgba(110,155,44,.16)" },
  lila: { tile: "linear-gradient(155deg,#EFE8FA,#DDD0EF)", fg: "#7a6b96", shadow: "rgba(122,107,150,.18)" },
  clay: { tile: "linear-gradient(155deg,#FBF3EB,#EFE0D1)", fg: "#CD8A5B", shadow: "rgba(205,138,91,.18)" },
  sand: { tile: "linear-gradient(155deg,#F6F1E8,#E8E0CF)", fg: "#7a6f5b", shadow: "rgba(120,90,52,.15)" },
};

// Icon-Pfade 1:1 aus Lucide (§14: nie selbst zeichnen).
const ICON_PATHS: Record<ImpulseIcon, ReactNode> = {
  listChecks: (
    <>
      <path d="M13 5h8" />
      <path d="M13 12h8" />
      <path d="M13 19h8" />
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
    </>
  ),
  shell: (
    <path d="M14 11a2 2 0 1 1-4 0 4 4 0 0 1 8 0 6 6 0 0 1-12 0 8 8 0 0 1 16 0 10 10 0 1 1-20 0 11.93 11.93 0 0 1 2.42-7.22 2 2 0 1 1 3.16 2.44" />
  ),
  moon: (
    <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
  ),
  signpost: (
    <>
      <path d="M12 13v8" />
      <path d="M12 3v3" />
      <path d="M2.354 10.354a1.207 1.207 0 0 1 0-1.708l2.06-2.06A2 2 0 0 1 5.828 6h12.344a2 2 0 0 1 1.414.586l2.06 2.06a1.207 1.207 0 0 1 0 1.708l-2.06 2.06a2 2 0 0 1-1.414.586H5.828a2 2 0 0 1-1.414-.586z" />
    </>
  ),
  heart: (
    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
  ),
  pen: (
    <>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </>
  ),
  lifeBuoy: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 4.24 4.24" />
      <path d="m14.83 9.17 4.24-4.24" />
      <path d="m14.83 14.83 4.24 4.24" />
      <path d="m9.17 14.83-4.24 4.24" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
};

function Icon({ name }: { name: ImpulseIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="21"
      height="21"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// Impuls-Pakete: kuratierte Schreib-Impulse nach Thema, an die Fokus-Wahl aus
// dem Onboarding gekoppelt. Impuls antippen startet einen Eintrag damit.
export function Impulses() {
  const settings = useSettings();
  const navigate = useNavigate();
  const { primary, isFocusMatch, rest } = orderedPacks(settings.focusArea);
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
    const c = CLUSTER[pack.cluster];
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={() => setOpen(isOpen ? null : pack.id)}
          aria-expanded={isOpen}
          className="flex w-full items-center gap-[13px] px-4 py-[15px] text-left"
        >
          <span
            className="inline-flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px]"
            style={{
              background: c.tile,
              color: c.fg,
              boxShadow: `0 2px 7px ${c.shadow}, inset 0 1px 0 rgba(255,255,255,.6)`,
            }}
          >
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

      {isFocusMatch && (
        <div className="inline-flex items-center gap-[7px] rounded-full bg-[#F1ECE0] px-[13px] py-1.5 pl-[11px] text-[13px] font-medium text-[#5d4f3f]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#CD8A5B]" />
          Passend zu deinem Fokus: {settings.focusArea}
        </div>
      )}

      {primary && (
        <>
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
