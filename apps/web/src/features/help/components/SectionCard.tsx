import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

const CATEGORY_BORDERS: Record<string, string> = {
  'getting-started': 'border-l-green-500 hover:border-green-400 hover:bg-green-50',
  modules: 'border-l-blue-500 hover:border-blue-400 hover:bg-blue-50',
  technical: 'border-l-purple-500 hover:border-purple-400 hover:bg-purple-50',
};

interface SectionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  category: string;
}

export default function SectionCard({ title, description, icon: Icon, path, category }: SectionCardProps) {
  return (
    <Link
      to={path}
      className={`block p-4 bg-white border border-gray-200 border-l-4 rounded-lg transition-all ${
        CATEGORY_BORDERS[category] || CATEGORY_BORDERS.modules
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
