import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { startSync } from "./lib/sync";
import { cleanupVoiceDrafts } from "./db/queries";
import "./styles/globals.css";

// Geräte-Sync starten (no-op, solange der Server keinen Sync anbietet).
startSync();

// Verworfene/zu alte Sprach-Entwürfe lokal aufräumen (fire-and-forget).
void cleanupVoiceDrafts();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
