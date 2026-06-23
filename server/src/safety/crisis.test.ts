import { describe, it, expect } from "vitest";
import { detectCrisis } from "./crisis";

describe("detectCrisis", () => {
  it("flaggt klare Suizid-Formulierungen", () => {
    expect(detectCrisis("ich will nicht mehr leben").flagged).toBe(true);
    expect(detectCrisis("ich will mich umbringen").flagged).toBe(true);
    expect(detectCrisis("ich denke an selbstmord").flagged).toBe(true);
  });

  it("flaggt Selbstverletzung", () => {
    expect(detectCrisis("ich will mich ritzen").flagged).toBe(true);
    expect(detectCrisis("ich will mich verletzen").flagged).toBe(true);
  });

  it("liefert eine Kategorie", () => {
    expect(detectCrisis("ich will nicht mehr leben").category).toBe("suizid");
    expect(detectCrisis("ritzen").category).toBe("selbstverletzung");
  });

  it("flaggt NICHT bei mehrdeutigem Grübel-Satz", () => {
    // bewusst Grübel-Signal, keine Krise
    expect(detectCrisis("ich halte das nicht aus").flagged).toBe(false);
  });

  it("flaggt NICHT bei harmlosem Text", () => {
    expect(detectCrisis("Heute war ein ruhiger, schöner Tag.").flagged).toBe(
      false,
    );
    expect(detectCrisis("Ich bin traurig wegen der Trennung.").flagged).toBe(
      false,
    );
  });

  it("flaggt passive Suizidalität / indirekte Hilferufe als akut", () => {
    expect(detectCrisis("vielleicht wäre es besser ohne mich").level).toBe(
      "acute",
    );
    expect(detectCrisis("keiner würde mich vermissen").level).toBe("acute");
    expect(detectCrisis("ich bin für alle nur eine Last").level).toBe("acute");
    expect(detectCrisis("ich wäre lieber tot").level).toBe("acute");
  });

  it("erkennt Überlastung als weiche Stufe (concern, nicht blockierend)", () => {
    const r = detectCrisis("ich kann einfach nicht mehr");
    expect(r.level).toBe("concern");
    expect(r.flagged).toBe(false); // weiche Stufe blockt NICHT
    expect(detectCrisis("ich gebe auf").level).toBe("concern");
    expect(detectCrisis("das alles ist so sinnlos").level).toBe("concern");
  });

  it("verwechselt Überlastung-Sätze nicht mit Krise", () => {
    expect(detectCrisis("ich kann nicht mehr schlafen").level).toBe("none");
    expect(detectCrisis("ich halte das nicht aus").level).toBe("none");
  });
});
