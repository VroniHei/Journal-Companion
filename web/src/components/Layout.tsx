import { useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { DisclaimerGate } from "./DisclaimerGate";
import { Onboarding } from "./Onboarding";
import { FabSheet } from "./FabSheet";
import { Icon } from "./icons";
import { ICONS } from "./iconset";
import { tileRelief } from "./tile";
import { useSettings } from "../hooks/useData";
import { useSyncStatus } from "../hooks/useSync";

// Top-Level-Screens (über die Tab-Leiste erreichbar) brauchen keinen
// Zurück-Button; alle anderen (Drill-ins/Tools) bekommen einen.
const TOP_PATHS = new Set(["/", "/muster", "/klaerung", "/wochenrueckblick"]);

const NAV = [
  { to: "/", label: "Heute", end: true, icon: ICONS.home },
  { to: "/muster", label: "Muster", end: false, icon: ICONS.wave },
  { to: "/klaerung", label: "Klärung", end: false, icon: ICONS.compass },
  { to: "/wochenrueckblick", label: "Rückblick", end: false, icon: ICONS.calendar },
];

// Farbcodierte Icon-Kacheln (README): Tagesritual grün, Kontaktimpuls clay,
// Energie gold, Klärung/Sprache/Routine/Einstellungen sand.
const TILE = {
  green: { bg: "#EEF1E6", fg: "#6E9B2C" },
  clay: { bg: "#F6ECE3", fg: "#CD8A5B" },
  gold: { bg: "#F6EFDC", fg: "#b08a2f" },
  sand: { bg: "#F1ECE0", fg: "#7a6f5b" },
} as const;

const PROFILE_LINKS = [
  { to: "/ritual", label: "Tagesritual", icon: ICONS.sun, tile: TILE.green },
  { to: "/ritual-verlauf", label: "Ritual-Verlauf", icon: ICONS.calendar, tile: TILE.sand },
  { to: "/klaerung", label: "Klärung", icon: ICONS.compass, tile: TILE.sand },
  { to: "/sprechen", label: "Sprach-Check-in", icon: ICONS.mic, tile: TILE.sand },
  { to: "/kontaktimpuls", label: "Kontaktimpuls", icon: ICONS.chat, tile: TILE.clay },
  { to: "/energie", label: "Energie heute", icon: ICONS.bolt, tile: TILE.gold },
  { to: "/impulse", label: "Impulse", icon: ICONS.pen, tile: TILE.sand },
  { to: "/routine", label: "Routine-Wechsel", icon: ICONS.swap, tile: TILE.sand },
  { to: "/einstellungen", label: "Einstellungen", icon: ICONS.gear, tile: TILE.sand },
];

export function Layout() {
  const settings = useSettings();
  const sync = useSyncStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Zurück-Button auf allen Nicht-Top-Level-Screens. Smartes Zurück: innerhalb
  // der App eine Stufe zurück, bei Direkteinstieg (keine In-App-History) zur
  // Startseite — so kann man nie „in einer Sackgasse" landen.
  const showBack = !TOP_PATHS.has(location.pathname);
  function goBack() {
    if (location.key !== "default") navigate(-1);
    else navigate("/");
  }
  const backButton = (
    <button
      type="button"
      onClick={goBack}
      aria-label="Zurück"
      className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:-translate-y-0.5 hover:text-[var(--foreground)]"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );

  // Einheitliche Content-Breite auf JEDER Seite (wie die Desktop-Frames im
  // Prototyp): kein Springen/„tablet-schmal" mehr zwischen Seiten. Der Inhalt
  // füllt überall den gleichen Container (max-w-7xl der <main>).
  const contentClass = "";
  const initial = (settings.userName?.trim()?.[0] ?? "I").toUpperCase();
  const name = settings.userName?.trim() || "Dein Raum";

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    navigate(q.trim() ? `/suche?q=${encodeURIComponent(q.trim())}` : "/suche");
  }

  const pillNav = (
    <nav className="flex gap-1">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              isActive
                ? "font-semibold text-[var(--foreground)]"
                : "font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            }`
          }
          style={({ isActive }) =>
            isActive
              ? {
                  background: "linear-gradient(180deg,#F0F4E6,#E8EFD7)",
                  boxShadow: "inset 0 0 0 1px rgba(110,155,44,0.18)",
                }
              : undefined
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green-deep,#6E9B2C)]" />
              )}
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const profileItems = (
    <>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--sage,#9BA383)] text-sm font-semibold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="text-[13px] text-[var(--muted)]">
            {sync.state === "off" ? "Alles bleibt lokal" : "Geräte abgeglichen"}
          </div>
        </div>
      </div>
      <div className="mx-3 h-px bg-[var(--border)]" />
      <div className="p-2">
        {PROFILE_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={() => setProfileOpen(false)}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[#F2F6E8]"
          >
            <span
              className="inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px]"
              style={{ ...tileRelief(l.tile.bg), color: l.tile.fg }}
            >
              <Icon d={l.icon} size={17} />
            </span>
            {l.label}
          </NavLink>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      <Onboarding />
      <FabSheet open={fabOpen} onClose={() => setFabOpen(false)} />
      {/* ===== Desktop-Topbar ===== */}
      <header className="sticky top-0 z-40 hidden border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md sm:block">
        <div
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3"
        >
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              {showBack && backButton}
              <NavLink to="/" aria-label={settings.appName}>
                <img
                  src="/innerline-wordmark.svg"
                  alt={settings.appName}
                  className="h-6 w-auto"
                />
              </NavLink>
            </div>
            {pillNav}
          </div>
          <div className="flex items-center gap-3">
            <form
              onSubmit={submitSearch}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,white_70%,transparent)] px-4 py-2"
            >
              <span className="text-[var(--muted)]">
                <Icon d={ICONS.search} size={16} />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                name="q"
                autoComplete="off"
                aria-label="Einträge durchsuchen"
                placeholder="Einträge durchsuchen"
                className="w-44 bg-transparent text-sm outline-none"
              />
            </form>
            <button
              type="button"
              onClick={() => setFabOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[#bdf06a]"
            >
              Neuer Eintrag
              <Icon d={ICONS.plus} size={15} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Profil"
                className="flex h-[39px] w-[39px] items-center justify-center rounded-full text-sm font-semibold text-white transition"
                style={{
                  background: "linear-gradient(145deg,#A7B187,#8C966F)",
                  boxShadow: profileOpen ? "0 0 0 2.5px #A8E84F" : undefined,
                }}
              >
                {initial}
              </button>
              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setProfileOpen(false)}
                    className="fixed inset-0 z-40 cursor-default bg-[rgba(35,34,26,0.07)]"
                  />
                  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[280px] overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_52px_rgba(35,34,26,0.24)]">
                    {profileItems}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== Mobile-Topbar (solide) ===== */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 shadow-[0_4px_16px_rgba(35,34,26,0.05)] sm:hidden">
        {showBack ? (
          backButton
        ) : (
          <NavLink to="/" aria-label={settings.appName}>
            <img
              src="/innerline-wordmark.svg"
              alt={settings.appName}
              className="h-5 w-auto"
            />
          </NavLink>
        )}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/suche")}
            aria-label="Einträge durchsuchen"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
          >
            <Icon d={ICONS.search} size={17} />
          </button>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Profil"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--sage,#9BA383)] text-sm font-semibold text-white"
          >
            {initial}
          </button>
        </div>
      </header>

      {/* ===== Inhalt ===== */}
      <main className="mx-auto max-w-7xl px-5 pb-32 pt-6 sm:pb-12">
        <DisclaimerGate />
        <div className={contentClass}>
          <Outlet />
        </div>
        <footer className="mt-12 text-center text-[13px] text-[var(--muted)]">
          Kein Ersatz für Therapie ·{" "}
          {sync.state === "off"
            ? "Deine Einträge bleiben lokal auf diesem Gerät."
            : "Deine Einträge gleichen sich sicher zwischen deinen Geräten ab."}
        </footer>
      </main>

      {/* ===== Mobile Tab-Leiste ===== */}
      {/* APP-STYLE §1: feste Höhe 82px, Items vertikal zentriert, Bodenabstand
          max(safe-area, 10px) damit die Labels nicht am Rand kleben. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex min-h-[82px] items-center justify-around border-t border-[var(--border)] bg-[rgba(248,245,238,0.86)] px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 backdrop-blur-[14px] sm:hidden">
        {NAV.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex w-16 flex-col items-center gap-1 pt-0.5"
            style={{ order: i < 2 ? i : i + 1 }}
          >
            {({ isActive }) => (
              <>
                <span
                  className="flex h-9 w-12 items-center justify-center rounded-full transition"
                  style={
                    isActive
                      ? {
                          background: "linear-gradient(180deg,#F0F4E6,#E6EED3)",
                          boxShadow: "inset 0 0 0 1.5px rgba(110,155,44,0.45)",
                          color: "var(--foreground)",
                        }
                      : { color: "var(--muted)" }
                  }
                >
                  <Icon d={item.icon} size={21} />
                </span>
                <span
                  className={`text-[11.5px] ${
                    isActive
                      ? "font-semibold text-[var(--foreground)]"
                      : "font-medium text-[var(--muted)]"
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setFabOpen(true)}
          aria-label="Was möchtest du tun?"
          style={{
            order: 2,
            background: "linear-gradient(180deg,#bdf06a,#8ed03a)",
          }}
          className="fab-glow -mt-7 flex h-[58px] w-[58px] items-center justify-center rounded-full text-[var(--accent-contrast)]"
        >
          <Icon d={ICONS.plus} size={24} />
        </button>
      </nav>

      {/* ===== Mobile Profil-Sheet ===== */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            aria-label="Schließen"
            onClick={() => setProfileOpen(false)}
            className="absolute inset-0 bg-[rgba(35,34,26,0.42)]"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[var(--surface)] pb-6 pt-2 shadow-[0_-18px_48px_rgba(35,34,26,0.2)]">
            <div className="mx-auto mb-3 mt-1.5 h-1.5 w-10 rounded-full bg-[var(--border)]" />
            {profileItems}
          </div>
        </div>
      )}
    </div>
  );
}
