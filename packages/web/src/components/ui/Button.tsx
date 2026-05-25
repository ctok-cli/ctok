import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const sizeClass = size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm";
  const variantClass =
    variant === "primary"
      ? "bg-accent text-black font-medium hover:bg-accent/90"
      : variant === "danger"
        ? "bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30"
        : variant === "ghost"
          ? "bg-transparent text-text-muted hover:text-text hover:bg-bg-subtle"
          : "bg-bg-subtle text-text border border-border hover:bg-bg-subtle/80";
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClass,
        variantClass,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
