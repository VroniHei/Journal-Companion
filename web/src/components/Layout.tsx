import { NavLink, Outlet } from "react-router-dom";
import { APP_NAME } from "../lib/appName";

const navItems = [
  { to: "/", label: "Übersicht", end: true },
  { to: "/neu", label: "Neuer Eintrag" },
  { to: "/kontaktimpuls", label: "Kontaktimpuls" },
  { to: "/muster", label: "Muster" },
  { to: "/wochenrueckblick", label: "Wochenrückblick" },
  { to: "/einstellungen", label: "Einstellungen" },
];

export function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
      <header className="mb-8">
        <NavLink to="/" className="serif text-2xl font-semibold tracking-tight">
          {APP_NAME}
        </NavLink>
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] transition hover:text-[var(--foreground)]"
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
