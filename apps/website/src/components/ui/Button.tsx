import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

const variants = {
  primary: `
    bg-gradient-to-r from-primary-600 to-primary-500 
    text-white 
    hover:from-primary-700 hover:to-primary-600 
    shadow-lg shadow-blue-500/25 
    hover:shadow-xl hover:shadow-blue-500/30
    active:scale-[0.98]
    border border-transparent
  `,
  secondary: `
    bg-gradient-to-r from-gray-900 to-gray-800 
    text-white 
    hover:from-gray-800 hover:to-gray-700 
    shadow-lg shadow-gray-900/20 
    hover:shadow-xl hover:shadow-gray-900/25
    active:scale-[0.98]
    border border-transparent
  `,
  outline: `
    bg-white/80 backdrop-blur-sm
    border border-gray-300 
    text-gray-700 
    hover:bg-white hover:border-gray-400 
    hover:shadow-lg hover:shadow-gray-900/5
    active:scale-[0.98]
  `,
  ghost: `
    bg-transparent 
    text-gray-600 
    hover:text-gray-900 
    hover:bg-gray-100/80 
    active:scale-[0.98]
    border border-transparent
  `,
};

const sizes = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-4 text-base rounded-xl",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `
    inline-flex items-center justify-center 
    font-semibold 
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variants[variant]} 
    ${sizes[size]} 
    ${className}
  `;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
