import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { NewEntry } from "./pages/NewEntry";
import { EntryDetail } from "./pages/EntryDetail";
import { ContactImpulse } from "./pages/ContactImpulse";
import { Patterns } from "./pages/Patterns";
import { WeeklyReview } from "./pages/WeeklyReview";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "neu", element: <NewEntry /> },
      { path: "eintrag/:id", element: <EntryDetail /> },
      { path: "kontaktimpuls", element: <ContactImpulse /> },
      { path: "muster", element: <Patterns /> },
      { path: "wochenrueckblick", element: <WeeklyReview /> },
      { path: "einstellungen", element: <Settings /> },
    ],
  },
]);
