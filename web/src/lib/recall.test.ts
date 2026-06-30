import { describe, it, expect } from "vitest";
import { cosineSimilarity, findSimilar, type SimCandidate } from "./recall";

describe("cosineSimilarity", () => {
  it("ist 1 für identische Richtung, 0 für orthogonal, -1 für entgegengesetzt", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0);
    expect(cosineSimilarity([1, 0, 0], [-1, 0, 0])).toBeCloseTo(-1);
  });

  it("ignoriert die Länge (nur Richtung zählt)", () => {
    expect(cosineSimilarity([2, 0, 0], [0.5, 0, 0])).toBeCloseTo(1);
  });

  it("ist 0 bei Null-Vektor", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });
});

describe("findSimilar", () => {
  const ref = [1, 0, 0];
  const cands: SimCandidate[] = [
    { id: "a", vector: [1, 0, 0] }, // sim 1
    { id: "b", vector: [0, 1, 0] }, // sim 0
    { id: "c", vector: [0.7071, 0.7071, 0] }, // sim ~0.707
  ];

  it("rankt absteigend nach Ähnlichkeit und respektiert k", () => {
    const r = findSimilar(ref, cands, { k: 2 });
    expect(r.map((x) => x.id)).toEqual(["a", "c"]);
  });

  it("schließt excludeIds aus", () => {
    const r = findSimilar(ref, cands, { k: 3, excludeIds: ["a"] });
    expect(r.map((x) => x.id)).toEqual(["c", "b"]);
  });

  it("filtert unter minScore weg", () => {
    const r = findSimilar(ref, cands, { k: 5, minScore: 0.5 });
    expect(r.map((x) => x.id)).toEqual(["a", "c"]);
  });

  it("liefert nichts bei leerer Kandidatenliste", () => {
    expect(findSimilar(ref, [], { k: 3 })).toEqual([]);
  });
});
