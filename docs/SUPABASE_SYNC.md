# Geräte-Sync einrichten (Supabase)

Damit **Handy und Desktop dieselben Einträge** zeigen, gleicht die App ihre
Daten über eine kleine Supabase-Datenbank ab. Der Zugriff läuft ausschließlich
über das Backend (`/api/sync`), geschützt durch dasselbe Passwort-Gate
(`ACCESS_PASSWORD`) wie der Rest der App. Die App ist Single-User — es gibt
deshalb keine zusätzlichen Konten.

Solange Supabase **nicht** konfiguriert ist, bleibt alles wie bisher lokal.

## 1. Supabase-Projekt anlegen

1. Auf <https://supabase.com> kostenlos anmelden, **New project**.
2. Region **Frankfurt (eu-central)** wählen (Daten bleiben in der EU).
3. Datenbank-Passwort vergeben (wird hier nicht weiter gebraucht).

## 2. Tabelle anlegen

Im Supabase-Dashboard → **SQL Editor** → **New query** → einfügen und **Run**:

```sql
create table if not exists sync_records (
  kind       text        not null,
  id         text        not null,
  updated_at timestamptz not null,
  deleted    boolean     not null default false,
  data       jsonb       not null,
  primary key (kind, id)
);

-- Schnellerer Pull "nur Neues seit ..."
create index if not exists sync_records_updated_at_idx
  on sync_records (updated_at);
```

Row-Level-Security wird nicht benötigt: Es greift nur das Backend mit dem
Service-Role-Key zu, nie der Browser direkt.

## 3. Schlüssel kopieren

Supabase-Dashboard → **Project Settings → API**:

- **Project URL** → `SUPABASE_URL`
- **service_role** (unter „Project API keys", der geheime Key) →
  `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Der **service_role**-Key umgeht alle Sicherheitsregeln. Er gehört **nur**
> ins Backend (Vercel-Env / lokale `server/.env`), **nie** ins Frontend und
> **nie** in den Chat.

## 4. Schlüssel hinterlegen

**Lokal:** in `server/.env`:

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

**Vercel (Produktion):** Project → **Settings → Environment Variables** → beide
Werte für **Production** anlegen → danach **Redeploy**.

## 5. Fertig

Nach dem Redeploy erscheint in den **Einstellungen** die Karte „Geräte-Sync"
mit „Jetzt synchronisieren". Die App gleicht ab:

- beim Start,
- alle 30 Sekunden,
- beim Zurückkehren in den Tab,
- kurz nach jeder Änderung.

Erstmaliger Abgleich: Öffne die App nacheinander auf beiden Geräten. Beim ersten
Sync werden die Einträge beider Geräte **zusammengeführt** (Union), sodass
danach überall derselbe Stand steht.

## Was wird synchronisiert?

Einträge, Gespräche (Chat), gespeicherte Wochenrückblicke, qualitative Muster
und stabile Momente. **Nicht** synchronisiert werden die App-Einstellungen
(z.B. Stimme) — die sind bewusst geräte-spezifisch.

## Bekannte Grenze (v1)

Löschungen werden noch **nicht** über Geräte hinweg propagiert: Ein auf Gerät A
gelöschter Eintrag kann beim nächsten Abgleich von Gerät B zurückkommen. Geplant
ist dafür ein Tombstone-Mechanismus (siehe `docs/OPTIMIZATIONS.md`).
