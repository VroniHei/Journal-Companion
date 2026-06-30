import { lazy, type ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";

// Code-Splitting: nur Shell + Startseite (Dashboard) werden eager geladen, alle
// übrigen Seiten lazy pro Route. Spart Bytes beim Erststart; die Suspense-Grenze
// für den Ladezustand sitzt im Layout um den <Outlet/>. Named Exports → .then(...).
const lazyPage = <K extends string>(
  load: () => Promise<Record<K, ComponentType>>,
  key: K,
) => lazy(() => load().then((m) => ({ default: m[key] })));

const NewEntry = lazyPage(() => import("./pages/NewEntry"), "NewEntry");
const VoiceCheckin = lazyPage(() => import("./pages/VoiceCheckin"), "VoiceCheckin");
const EntryDetail = lazyPage(() => import("./pages/EntryDetail"), "EntryDetail");
const ContactImpulse = lazyPage(() => import("./pages/ContactImpulse"), "ContactImpulse");
const Patterns = lazyPage(() => import("./pages/Patterns"), "Patterns");
const WeeklyReview = lazyPage(() => import("./pages/WeeklyReview"), "WeeklyReview");
const Settings = lazyPage(() => import("./pages/Settings"), "Settings");
const Search = lazyPage(() => import("./pages/Search"), "Search");
const Clarity = lazyPage(() => import("./pages/Clarity"), "Clarity");
const Ritual = lazyPage(() => import("./pages/Ritual"), "Ritual");
const RitualHistory = lazyPage(() => import("./pages/RitualHistory"), "RitualHistory");
const Archive = lazyPage(() => import("./pages/Archive"), "Archive");
const RedThread = lazyPage(() => import("./pages/RedThread"), "RedThread");
const Progress = lazyPage(() => import("./pages/Progress"), "Progress");
const Loosen = lazyPage(() => import("./pages/Loosen"), "Loosen");
const Impulses = lazyPage(() => import("./pages/Impulses"), "Impulses");
const ShareCard = lazyPage(() => import("./pages/ShareCard"), "ShareCard");
const WeeklyLetter = lazyPage(() => import("./pages/WeeklyLetter"), "WeeklyLetter");
const Energy = lazyPage(() => import("./pages/Energy"), "Energy");
const Relief = lazyPage(() => import("./pages/Relief"), "Relief");
const Routine = lazyPage(() => import("./pages/Routine"), "Routine");
const SummaryExport = lazyPage(() => import("./pages/SummaryExport"), "SummaryExport");

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "neu", element: <NewEntry /> },
      { path: "sprechen", element: <VoiceCheckin /> },
      { path: "eintrag/:id", element: <EntryDetail /> },
      { path: "kontaktimpuls", element: <ContactImpulse /> },
      { path: "muster", element: <Patterns /> },
      { path: "klaerung", element: <Clarity /> },
      { path: "ritual", element: <Ritual /> },
      { path: "ritual-verlauf", element: <RitualHistory /> },
      { path: "archiv", element: <Archive /> },
      { path: "roter-faden", element: <RedThread /> },
      { path: "verlauf", element: <Progress /> },
      { path: "schleife", element: <Loosen /> },
      { path: "impulse", element: <Impulses /> },
      { path: "teilen", element: <ShareCard /> },
      { path: "wochen-brief", element: <WeeklyLetter /> },
      { path: "energie", element: <Energy /> },
      { path: "soforthilfe", element: <Relief /> },
      { path: "routine", element: <Routine /> },
      { path: "wochenrueckblick", element: <WeeklyReview /> },
      { path: "zusammenfassung", element: <SummaryExport /> },
      { path: "einstellungen", element: <Settings /> },
      { path: "suche", element: <Search /> },
    ],
  },
]);
