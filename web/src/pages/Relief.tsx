import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEntry } from "../db/queries";

// „Gerade ist viel" — Soforthilfe für den überfüllten Moment: Kopf leeren,
// dann sortieren. Ruhig, nie therapeutisch. Flieder-/Beruhigungs-Ton.
export function Relief() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(sort: boolean) {
    const body = text.trim();
    if (!body || saving) return;
    setSaving(true);
    const entry = await createEntry({
      text: body,
      mood: 5,
      intensity: 7,
      emotions: [],
      bodySignals: [],
      topics: [],
      needs: [],
      impulse: "",
      intention: [],
      startIntent: "tag-sortieren",
    });
    // „Für mich sortieren" führt in die Reflexion; „nur rauslassen" zurück.
    navigate(sort ? `/eintrag/${entry.id}` : "/");
  }

  return (
    <section
      className="-mx-4 -mt-6 min-h-[80vh] px-4 pb-6 pt-4 sm:-mx-6 sm:px-6"
      style={{
        background:
          "radial-gradient(210px 210px at 100% 0%, rgba(203,190,244,.4), transparent 68%), radial-gradient(210px 210px at 0% 80%, rgba(168,232,79,.14), transparent 68%), linear-gradient(180deg,#EFEAF8 0%,#F1ECEC 44%,#F8F5EE 100%)",
      }}
    >
      <div className="mx-auto flex min-h-[76vh] max-w-[560px] flex-col">
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Schließen"
            onClick={() => navigate("/")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(35,34,26,.1)] bg-[rgba(255,255,255,.6)] text-[var(--muted)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-1.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#7a6b96]">
            Gerade ist viel
          </div>
          <h1 className="serif mt-2 text-[26px] font-semibold leading-[1.16] text-[#3a3247]">
            Leer erst mal den <em className="g">Kopf</em>.
          </h1>
          <p className="lead mt-2 max-w-[300px] text-[15.5px] leading-[1.5] text-[var(--muted)]">
            Schreib raus, was gerade alles da ist. Unsortiert. Ich helfe dir gleich
            beim Ordnen.
          </p>
        </div>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Steuer noch offen\nSchlafe schlecht\nMama anrufen\nzu viele Tabs offen …"}
          className="mt-[18px] min-h-[200px] flex-1 resize-none rounded-[18px] border border-[rgba(35,34,26,.08)] bg-[var(--surface)] p-4 text-[14px] leading-[1.7] text-[#3a352b] shadow-[0_8px_24px_rgba(90,78,120,.08)] outline-none placeholder:text-[#9a917f] focus:border-[var(--accent-text)]"
        />

        <div
          className="mt-[14px] flex items-center gap-2.5 rounded-2xl border p-[14px_16px]"
          style={{
            background: "linear-gradient(135deg,#F4F8EC,var(--surface))",
            borderColor: "rgba(110,155,44,.22)",
          }}
        >
          <span className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#F0F4E6] text-[#6E9B2C]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
            </svg>
          </span>
          <p className="text-[13.5px] leading-[1.5] text-[var(--foreground)]">
            Wenn du fertig bist, sortiere ich das in <em className="g">eine</em> Sache
            für jetzt und einen Parkplatz für den Rest.
          </p>
        </div>

        <div className="mt-[14px]">
          <button
            type="button"
            disabled={!text.trim() || saving}
            onClick={() => save(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full py-[15px] text-[16px] font-semibold text-[var(--accent-contrast)] shadow-[0_8px_22px_rgba(110,155,44,.32)] disabled:opacity-50"
            style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
          >
            Für mich sortieren
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
            </svg>
          </button>
          <div className="mt-3 text-center">
            <button
              type="button"
              disabled={!text.trim() || saving}
              onClick={() => save(false)}
              className="text-[13.5px] font-medium text-[#9a917f] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              Nur rauslassen, nicht sortieren
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
