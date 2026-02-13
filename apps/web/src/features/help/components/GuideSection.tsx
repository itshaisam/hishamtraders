import { LucideIcon } from 'lucide-react';

interface GuideSectionProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export default function GuideSection({ id, title, icon: Icon, children }: GuideSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 mb-10">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        {Icon && <Icon size={22} className="text-blue-600" />}
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}
