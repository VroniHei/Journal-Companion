import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_8px_30px_rgba(47,43,35,0.04)] ${className}`}
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
  // Innerline: Pill-Buttons, Figtree 600. Primär = Lime-Fill mit Ink-Text.
  const base =
    "rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90",
    ghost:
      "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:border-[var(--foreground)]",
    danger: "text-[var(--danger)] hover:underline",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
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
