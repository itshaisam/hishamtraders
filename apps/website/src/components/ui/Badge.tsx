import { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  variant?: "primary" | "gray";
};

export function Badge({ children, variant = "primary" }: BadgeProps) {
  const variants = {
    primary: "bg-primary-50 text-primary-700 ring-primary-200",
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset ${variants[variant]}`}>
      {children}
    </span>
  );
}
