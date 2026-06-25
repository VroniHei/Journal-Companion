#!/usr/bin/env node
// Post-Deploy-Smoke-Test: prüft, ob die Serverless-API lebt. Ein 500 auf
// /api/health hätte den früheren Totalausfall (ERR_MODULE_NOT_FOUND beim Start
// der Funktion) sofort sichtbar gemacht.
//
// Aufruf:  node scripts/smoke.mjs https://<deploy-url>
//          SMOKE_URL=https://<deploy-url> npm run smoke
// Exit 0 = gesund, 1 = ungesund, 2 = falscher Aufruf.

const base = (process.argv[2] || process.env.SMOKE_URL || "").replace(/\/+$/, "");
if (!base) {
  console.error("Usage: node scripts/smoke.mjs <base-url>  (oder SMOKE_URL setzen)");
  process.exit(2);
}

const checks = [
  { path: "/api/health", ok: (b) => b && b.ok === true },
  { path: "/api/config", ok: (b) => b && typeof b.hasApiKey === "boolean" },
];

let failed = 0;
for (const c of checks) {
  const url = base + c.path;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const body = await res.json().catch(() => null);
    if (res.ok && c.ok(body)) {
      console.log(`OK    ${url} -> ${res.status}`);
    } else {
      console.error(`FAIL  ${url} -> ${res.status} ${JSON.stringify(body)}`);
      failed++;
    }
  } catch (e) {
    console.error(`FAIL  ${url} -> ${e.message}`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} Check(s) fehlgeschlagen.`);
  process.exit(1);
}
console.log("\nAlle Checks grün.");
