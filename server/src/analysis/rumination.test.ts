import { describe, it, expect } from "vitest";
import { detectRuminationSignals } from "./rumination";

describe("detectRuminationSignals", () => {
  it("erkennt mehrere Grübel-Phrasen", () => {
    expect(
      detectRuminationSignals("Warum macht er das? Was bedeutet das?", 5),
    ).toBe(true);
  });

  it("erkennt eine Phrase bei hoher Intensität", () => {
    expect(detectRuminationSignals("ich halte das nicht aus", 9)).toBe(true);
  });

  it("eine Phrase bei niedriger Intensität reicht nicht", () => {
    expect(detectRuminationSignals("ich halte das nicht aus", 4)).toBe(false);
  });

  it("erkennt viele Fragezeichen bei erhöhter Intensität", () => {
    expect(detectRuminationSignals("wieso? warum? und dann? was jetzt?", 7)).toBe(
      true,
    );
  });

  it("erkennt KEINE Schleife bei ruhigem Text", () => {
    expect(detectRuminationSignals("Heute war ein guter Tag.", 3)).toBe(false);
  });
});
