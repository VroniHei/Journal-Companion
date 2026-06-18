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
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}
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
  const base =
    "rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-[var(--accent)] text-white hover:opacity-90",
    ghost:
      "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-2)]",
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
