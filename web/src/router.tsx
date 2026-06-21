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
import { Archive } from "./pages/Archive";
import { RedThread } from "./pages/RedThread";
import { Progress } from "./pages/Progress";

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
      { path: "archiv", element: <Archive /> },
      { path: "roter-faden", element: <RedThread /> },
      { path: "verlauf", element: <Progress /> },
      { path: "wochenrueckblick", element: <WeeklyReview /> },
      { path: "einstellungen", element: <Settings /> },
      { path: "suche", element: <Search /> },
    ],
  },
]);
