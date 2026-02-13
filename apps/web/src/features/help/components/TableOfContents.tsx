import { useState, useEffect } from 'react';
import { ChevronDown, List } from 'lucide-react';
import { TocItem } from '../types';

interface TableOfContentsProps {
  items: TocItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const renderItems = () => (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => handleClick(item.id)}
            className={`block w-full text-left text-sm py-1 border-l-2 transition-colors ${
              item.level === 2 ? 'pl-3' : 'pl-6'
            } ${
              activeId === item.id
                ? 'text-blue-600 font-medium border-blue-600'
                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
            }`}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <div className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          On this page
        </h4>
        {renderItems()}
      </div>

      {/* Mobile: collapsible dropdown */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-4 py-2 w-full"
        >
          <List size={16} />
          On this page
          <ChevronDown
            size={16}
            className={`ml-auto transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {mobileOpen && (
          <div className="mt-2 bg-gray-50 rounded-lg p-3">
            {renderItems()}
          </div>
        )}
      </div>
    </>
  );
}
