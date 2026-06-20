import { useState, type FormEvent, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { DisclaimerGate } from "./DisclaimerGate";
import { useSettings } from "../hooks/useData";
import { useSyncStatus } from "../hooks/useSync";

function Icon({ d, size = 22 }: { d: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}

const ICONS = {
  home: (
    <>
      <path d="M3 10.8 12 4l9 6.8" />
      <path d="M5.5 9.6V20h13V9.6" />
    </>
  ),
  wave: <path d="M4 16 C8 16 9 7 12 7 C15 7 16 17 20 11" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M9 3.5v4M15 3.5v4" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
    </>
  ),
  heart: <path d="M12 20s-7-4.3-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.7 12 20 12 20z" />,
  mic: (
    <path d="M12 4v8m0 0a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v3a3 3 0 0 0 3 3zM7 11a5 5 0 0 0 10 0M12 16v3" />
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 4-4 2 2-4z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
};

const NAV = [
  { to: "/", label: "Heute", end: true, icon: ICONS.home },
  { to: "/muster", label: "Muster", end: false, icon: ICONS.wave },
  { to: "/klaerung", label: "Klärung", end: false, icon: ICONS.compass },
  { to: "/wochenrueckblick", label: "Rückblick", end: false, icon: ICONS.calendar },
];

const PROFILE_LINKS = [
  { to: "/ritual", label: "Tagesritual", icon: ICONS.sun },
  { to: "/klaerung", label: "Klärung", icon: ICONS.compass },
  { to: "/einstellungen", label: "Einstellungen", icon: ICONS.gear },
  { to: "/kontaktimpuls", label: "Kontaktimpuls", icon: ICONS.heart },
  { to: "/sprechen", label: "Sprach-Check-in", icon: ICONS.mic },
];

export function Layout() {
  const settings = useSettings();
  const sync = useSyncStatus();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const wide = pathname === "/" || pathname.startsWith("/muster");
  // Shell (Kopfzeile + Seitenrahmen) ist überall gleich breit. Nur der
  // INHALT von Lese-/Formularseiten sitzt in einer schmaleren, zentrierten
  // Spalte — so springt die Breite nicht zwischen den Seiten.
  const contentClass = wide ? "" : "mx-auto w-full max-w-3xl";
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
            `rounded-full px-4 py-2 text-sm transition ${
              isActive
                ? "bg-[var(--surface-2)] font-semibold text-[var(--foreground)]"
                : "font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            }`
          }
        >
          {item.label}
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
          <div className="text-xs text-[var(--muted)]">
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
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
          >
            <span className="text-[var(--muted)]">
              <Icon d={l.icon} size={18} />
            </span>
            {l.label}
          </NavLink>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      {/* ===== Desktop-Topbar ===== */}
      <header className="sticky top-0 z-40 hidden border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md sm:block">
        <div
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3"
        >
          <div className="flex items-center gap-8">
            <NavLink to="/" aria-label={settings.appName}>
              <img
                src="/innerline-wordmark.svg"
                alt={settings.appName}
                className="h-6 w-auto"
              />
            </NavLink>
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
              onClick={() => navigate("/neu")}
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--sage,#9BA383)] text-sm font-semibold text-white"
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
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lift)]">
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
        <NavLink to="/" aria-label={settings.appName}>
          <img
            src="/innerline-wordmark.svg"
            alt={settings.appName}
            className="h-5 w-auto"
          />
        </NavLink>
        <button
          type="button"
          onClick={() => navigate("/suche")}
          aria-label="Einträge durchsuchen"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
        >
          <Icon d={ICONS.search} size={17} />
        </button>
      </header>

      {/* ===== Inhalt ===== */}
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-6 sm:pb-12">
        <DisclaimerGate />
        <div className={contentClass}>
          <Outlet />
        </div>
        <footer className="mt-12 text-center text-xs text-[var(--muted)]">
          Kein Ersatz für Therapie ·{" "}
          {sync.state === "off"
            ? "Deine Einträge bleiben lokal auf diesem Gerät."
            : "Deine Einträge gleichen sich sicher zwischen deinen Geräten ab."}
        </footer>
      </main>

      {/* ===== Mobile Tab-Leiste ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-start justify-around border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-md sm:hidden">
        {[NAV[0], NAV[1]].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex w-14 flex-col items-center gap-1 pt-1 ${
                isActive ? "text-[var(--foreground)]" : "text-[var(--muted)]"
              }`
            }
          >
            <Icon d={item.icon} size={22} />
            <span className="text-[10.5px] font-medium">{item.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => navigate("/neu")}
          aria-label="Neuer Eintrag"
          className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_8px_20px_rgba(110,155,44,0.35)]"
        >
          <Icon d={ICONS.plus} size={24} />
        </button>

        <NavLink
          to="/wochenrueckblick"
          className={({ isActive }) =>
            `flex w-14 flex-col items-center gap-1 pt-1 ${
              isActive ? "text-[var(--foreground)]" : "text-[var(--muted)]"
            }`
          }
        >
          <Icon d={ICONS.calendar} size={22} />
          <span className="text-[10.5px] font-medium">Rückblick</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex w-14 flex-col items-center gap-1 pt-1 text-[var(--muted)]"
        >
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--sage,#9BA383)] text-[11px] font-semibold text-white">
            {initial}
          </span>
          <span className="text-[10.5px] font-medium">Du</span>
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
