import { NavLink, Outlet } from "react-router-dom";
import { DisclaimerGate } from "./DisclaimerGate";
import { useSettings } from "../hooks/useData";

const navItems = [
  { to: "/", label: "Übersicht", end: true },
  { to: "/neu", label: "Neuer Eintrag" },
  { to: "/sprechen", label: "Sprechen" },
  { to: "/kontaktimpuls", label: "Kontaktimpuls" },
  { to: "/muster", label: "Muster" },
  { to: "/wochenrueckblick", label: "Wochenrückblick" },
  { to: "/einstellungen", label: "Einstellungen" },
];

export function Layout() {
  const settings = useSettings();
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-6">
      <DisclaimerGate />
      <header className="glass sticky top-3 z-40 mb-8 rounded-[24px] border border-[var(--border)] px-5 py-4 shadow-[var(--shadow-card)]">
        <NavLink
          to="/"
          aria-label={settings.appName}
          className="inline-flex items-center gap-2.5"
        >
          <img src="/favicon.svg" alt="" aria-hidden="true" className="h-8 w-8" />
          <span className="serif text-xl font-semibold tracking-tight">
            {settings.appName}
          </span>
        </NavLink>
        <nav className="mt-4 flex flex-wrap gap-1.5 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? "rounded-full bg-[var(--accent-soft)] px-3 py-1.5 font-semibold text-[var(--accent-text)]"
                  : "rounded-full px-3 py-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 text-center text-xs text-[var(--muted)]">
        Kein Ersatz für Therapie · Deine Einträge bleiben lokal auf diesem Gerät.
      </footer>
    </div>
  );
}
