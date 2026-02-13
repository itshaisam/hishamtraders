import { useState, useMemo } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { HELP_SECTIONS, HELP_CATEGORIES } from '../data/helpSections';
import SectionCard from '../components/SectionCard';

export default function HelpIndexPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return HELP_SECTIONS;
    const q = search.toLowerCase();
    return HELP_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof HELP_SECTIONS> = {};
    for (const s of filtered) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="p-6">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          User Guide
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Learn how to use every feature of the Hisham Traders ERP system
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Section groups */}
      {Object.entries(grouped).map(([category, sections]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {HELP_CATEGORIES[category] || category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                title={section.title}
                description={section.description}
                icon={section.icon}
                path={section.path}
                category={section.category}
              />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No guides found matching "{search}"</p>
        </div>
      )}
    </div>
  );
}
