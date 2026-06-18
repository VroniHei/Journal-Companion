import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  // Innerline: weiche, leicht frostige Glas-Karte mit geschichtetem Schatten.
  return (
    <div
      className={`glass rounded-[26px] border border-[var(--border)] p-6 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  // Innerline: Pill-Buttons, Figtree 600, sanfter Lift beim Hover.
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[transform,background-color,color,border-color] duration-150 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0";
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[#bdf06a] hover:-translate-y-0.5 disabled:hover:bg-[var(--accent)]",
    ghost:
      "border border-[var(--border)] text-[var(--foreground)] hover:-translate-y-0.5 hover:border-[var(--foreground)] hover:bg-[var(--surface-2)]",
    danger: "text-[var(--danger)] hover:underline",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  // Innerline-Signatur: kleines Label mit grünem Punkt.
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
      <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      {children}
    </span>
  );
}

export function FieldLabel({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
  return (
    <span className="mb-1.5 block text-sm font-medium">
      {label}
      {hint && (
        <span className="ml-2 font-normal text-[var(--muted)]">{hint}</span>
      )}
    </span>
  );
}
