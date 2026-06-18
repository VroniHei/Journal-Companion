import { useParams } from "react-router-dom";

export function EntryDetail() {
  const { id } = useParams();
  return (
    <section>
      <h1 className="serif text-3xl font-semibold">Eintrag</h1>
      <p className="mt-2 text-[var(--muted)]">Wird in Phase 2 gebaut. ({id})</p>
    </section>
  );
}
