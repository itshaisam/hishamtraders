type SectionHeaderProps = {
  overline?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  dark?: boolean;
};

export function SectionHeader({ overline, title, subtitle, align = "center", dark = false }: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-3xl ${alignClass} mb-12 lg:mb-16`}>
      {overline && (
        <p className={`text-sm font-semibold tracking-wider uppercase mb-3 ${dark ? "text-primary-400" : "text-primary-600"}`}>
          {overline}
        </p>
      )}
      <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg ${dark ? "text-gray-400" : "text-gray-600"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
