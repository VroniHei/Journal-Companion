// Leiser, immer sichtbarer Hilfe-Anker. Bewusst zurückhaltend (klein, muted),
// aber jederzeit auffindbar — an belastungsnahen Stellen (Soforthilfe,
// Reflexion, Disclaimer). Nummern sind antippbar (tel:-Links).
export function HelpLine({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[12px] leading-[1.5] text-[var(--muted)] ${className}`}>
      In einer akuten Krise:{" "}
      <a
        href="tel:112"
        className="font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
      >
        112
      </a>
      {" · "}
      TelefonSeelsorge{" "}
      <a
        href="tel:08001110111"
        className="font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
      >
        0800 111 0 111
      </a>{" "}
      (rund um die Uhr, kostenlos)
    </p>
  );
}
