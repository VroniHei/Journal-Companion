import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { NewEntry } from "./pages/NewEntry";
import { VoiceCheckin } from "./pages/VoiceCheckin";
import { EntryDetail } from "./pages/EntryDetail";
import { ContactImpulse } from "./pages/ContactImpulse";
import { Patterns } from "./pages/Patterns";
import { WeeklyReview } from "./pages/WeeklyReview";
import { Settings } from "./pages/Settings";
import { Search } from "./pages/Search";
import { Clarity } from "./pages/Clarity";
import { Ritual } from "./pages/Ritual";
import { RitualHistory } from "./pages/RitualHistory";
import { Archive } from "./pages/Archive";
import { RedThread } from "./pages/RedThread";
import { Progress } from "./pages/Progress";
import { Loosen } from "./pages/Loosen";
import { Impulses } from "./pages/Impulses";
import { ShareCard } from "./pages/ShareCard";
import { WeeklyLetter } from "./pages/WeeklyLetter";
import { Energy } from "./pages/Energy";
import { Relief } from "./pages/Relief";
import { Routine } from "./pages/Routine";
import { SummaryExport } from "./pages/SummaryExport";

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
