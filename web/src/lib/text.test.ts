import { describe, it, expect } from "vitest";
import { looksUnpunctuated, stripMarkdown } from "./text";

const runOn =
  "heute war wirklich viel los ich bin morgens aufgestanden und hatte direkt das gefühl dass alles zu viel ist dann kam noch die sache mit der arbeit dazu";

describe("looksUnpunctuated", () => {
  it("erkennt einen langen Worthaufen ohne Satzzeichen", () => {
    expect(looksUnpunctuated(runOn)).toBe(true);
  });

  it("lässt kurze Eingaben in Ruhe (zu wenig Wörter)", () => {
    expect(looksUnpunctuated("mir geht es gerade nicht gut")).toBe(false);
  });

  it("erkennt bereits punktierten Text als ok", () => {
    expect(
      looksUnpunctuated(
        "Heute war viel los. Ich bin früh aufgestanden und hatte sofort das Gefühl, dass es zu viel wird. Dann kam die Arbeit dazu.",
      ),
    ).toBe(false);
  });

  it("toleriert eine vereinzelte Marke in einem langen Worthaufen", () => {
    expect(looksUnpunctuated(`${runOn} usw. und so weiter`)).toBe(true);
  });

  it("ist leer-tolerant", () => {
    expect(looksUnpunctuated("   ")).toBe(false);
  });
});

describe("stripMarkdown", () => {
  it("entfernt Überschriften und Betonung", () => {
    expect(stripMarkdown("# Titel\n\n**fett** und *kursiv*")).toBe(
      "Titel. fett und kursiv",
    );
  });
});
