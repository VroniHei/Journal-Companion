import type { CSSProperties } from "react";

/**
 * Tile-Relief (APP-STYLE §13): einheitliche, dezente Tiefe für Icon-Kacheln.
 * `hue` = die Bereichsfarbe der Kachel; das Icon (fg) wird separat gesetzt.
 */
export function tileRelief(hue: string): CSSProperties {
  return {
    background: `linear-gradient(155deg, color-mix(in srgb, ${hue}, #fff 22%), color-mix(in srgb, ${hue}, #000 9%))`,
    boxShadow:
      "0 2px 6px rgba(35,34,26,.07), inset 0 1px 0 rgba(255,255,255,.55)",
  };
}
