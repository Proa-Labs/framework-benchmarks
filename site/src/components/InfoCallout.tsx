import type { ComponentPropsWithoutRef } from "react";

export function InfoCallout({
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      role="note"
      className={`mb-5 flex items-start gap-3 rounded-lg border border-line bg-surface p-4 text-sm leading-relaxed text-muted ${className}`}
      {...props}
    >
      <svg
        className="mt-0.5 size-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </svg>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
