import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { tileRelief } from "./icons";

// FAB-Auswahl „Was möchtest du tun?" — schließt die größte Navigations-Lücke
// (kein unklares Direkt-Springen in einen Eintrag). Mobile = Bottom-Sheet,
// Desktop = zentriertes Modal über gedimmtem Dashboard. (Innerline App.dc.html)

interface Option {
  to: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
}

const OPTIONS: Option[] = [
  {
    to: "/neu",
    title: "Eintrag schreiben",
    subtitle: "Frei rauslassen, was gerade da ist",
    iconBg: "#fff",
    iconColor: "#6E9B2C",
    highlight: true,
    icon: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </>
    ),
  },
  {
    to: "/sprechen",
    title: "Sprach-Check-in",
    subtitle: "Einsprechen, ich sortiere es",
    iconBg: "#F6ECE2",
    iconColor: "#CD8A5B",
    icon: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
      </>
    ),
  },
  {
    to: "/ritual",
    title: "Tagesritual",
    subtitle: "Sechs Minuten, die den Tag sortieren",
    iconBg: "#F6ECE2",
    iconColor: "#CD8A5B",
    icon: (
      <>
        <path d="M3 18h18M5.6 18a6.4 6.4 0 0 1 12.8 0" />
        <path d="M12 4.5v2.4M5 9l1.6 1.2M19 9l-1.6 1.2" />
      </>
    ),
  },
  {
    to: "/schleife",
    title: "Gedankenschleife lösen",
    subtitle: "Einen drehenden Gedanken auseinandernehmen",
    iconBg: "#F1ECE0",
    iconColor: "#5d564a",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M14.9 9.1 11 11l-1.9 3.9 3.9-1.9 1.9-3.9z" />
      </>
    ),
  },
  {
    to: "/soforthilfe",
    title: "Gerade ist viel",
    subtitle: "Kopf leeren, wenn alles gleichzeitig ist",
    iconBg: "#EFEAF7",
    iconColor: "#7a6b96",
    icon: <path d="M12 3v3M5 8l2 2M19 8l-2 2M3 16h4l2 4 4-12 2 6h6" />,
  },
];

export function FabSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  if (!open) return null;

  function go(to: string) {
    onClose();
    navigate(to);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Was möchtest du tun?"
    >
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(35,34,26,.44)]"
      />
      <div className="relative w-full rounded-t-[28px] bg-[var(--surface)] px-4 pb-6 pt-2.5 shadow-[0_-18px_48px_rgba(35,34,26,.22)] sm:mx-4 sm:w-full sm:max-w-[440px] sm:rounded-[28px] sm:p-6 sm:shadow-[0_30px_70px_rgba(35,34,26,.3)]">
        <div className="mx-auto mb-4 mt-1.5 h-[5px] w-[42px] rounded-full bg-[#dcd5c4] sm:hidden" />
        <div className="mb-3.5 flex items-center justify-between px-0.5">
          <span className="text-[18px] font-[650] tracking-[-0.02em] text-[var(--foreground)]">
            Was möchtest du tun?
          </span>
          <button
            type="button"
            aria-label="Schließen"
            onClick={onClose}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] sm:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {OPTIONS.map((o) => (
            <button
              key={o.to}
              type="button"
              onClick={() => go(o.to)}
              className="flex items-center gap-[13px] rounded-2xl border p-[14px_15px] text-left transition hover:-translate-y-0.5"
              style={
                o.highlight
                  ? {
                      background: "linear-gradient(180deg,#F0F8DF,#E9F4D0)",
                      borderColor: "rgba(110,155,44,.22)",
                    }
                  : {
                      background: "var(--surface)",
                      borderColor: "rgba(35,34,26,.08)",
                      boxShadow: "0 4px 14px rgba(35,34,26,.04)",
                    }
              }
            >
              <span
                className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl"
                style={
                  o.highlight
                    ? {
                        background: o.iconBg,
                        color: o.iconColor,
                        boxShadow: "0 3px 10px rgba(110,155,44,.18)",
                      }
                    : { ...tileRelief(o.iconBg), color: o.iconColor }
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  {o.icon}
                </svg>
              </span>
              <span className="flex-1">
                <span className="block text-[15.5px] font-[650] text-[var(--foreground)]">
                  {o.title}
                </span>
                <span
                  className="mt-0.5 block text-[12.5px]"
                  style={{ color: o.highlight ? "#6a7152" : "#9a917f" }}
                >
                  {o.subtitle}
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke={o.highlight ? "#6E9B2C" : "#9a917f"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="18"
                height="18"
                className="flex-none"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
