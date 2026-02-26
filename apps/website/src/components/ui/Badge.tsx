import { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  variant?: "primary" | "gray" | "success" | "warning";
  className?: string;
};

export function Badge({ children, variant = "primary", className = "" }: BadgeProps) {
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-50 to-indigo-50 
      text-blue-700 
      ring-1 ring-inset ring-blue-200/50
      shadow-sm shadow-blue-900/5
    `,
    gray: `
      bg-gradient-to-r from-gray-50 to-slate-50 
      text-gray-700 
      ring-1 ring-inset ring-gray-200/50
      shadow-sm shadow-gray-900/5
    `,
    success: `
      bg-gradient-to-r from-emerald-50 to-teal-50 
      text-emerald-700 
      ring-1 ring-inset ring-emerald-200/50
      shadow-sm shadow-emerald-900/5
    `,
    warning: `
      bg-gradient-to-r from-amber-50 to-orange-50 
      text-amber-700 
      ring-1 ring-inset ring-amber-200/50
      shadow-sm shadow-amber-900/5
    `,
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 
      rounded-full px-3.5 py-1.5 
      text-sm font-medium 
      transition-all duration-300
      hover:shadow-md hover:scale-[1.02]
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}
