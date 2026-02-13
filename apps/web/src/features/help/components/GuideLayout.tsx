import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import TableOfContents from './TableOfContents';
import { HELP_SECTIONS } from '../data/helpSections';
import { NAVIGATION_ORDER } from '../data/navigationOrder';
import { GuideContent } from '../types';

interface GuideLayoutProps {
  section: string;
  content: GuideContent;
  children: React.ReactNode;
}

export default function GuideLayout({ section, content, children }: GuideLayoutProps) {
  const sectionDef = HELP_SECTIONS.find((s) => s.id === section);
  const navIndex = NAVIGATION_ORDER.indexOf(section);
  const prevId = navIndex > 0 ? NAVIGATION_ORDER[navIndex - 1] : null;
  const nextId = navIndex < NAVIGATION_ORDER.length - 1 ? NAVIGATION_ORDER[navIndex + 1] : null;
  const prevSection = prevId ? HELP_SECTIONS.find((s) => s.id === prevId) : null;
  const nextSection = nextId ? HELP_SECTIONS.find((s) => s.id === nextId) : null;

  const Icon = sectionDef?.icon;

  return (
    <div className="p-6">
      <Breadcrumbs
        items={[
          { label: 'Help', href: '/help' },
          { label: sectionDef?.title || section },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-blue-600" />}
          {content.title}
        </h1>
      </div>

      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}

          {/* Prev/Next navigation */}
          <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between">
            {prevSection ? (
              <Link
                to={prevSection.path}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition"
              >
                <ChevronLeft size={16} />
                <div>
                  <div className="text-xs text-gray-400">Previous</div>
                  <div className="font-medium">{prevSection.title}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextSection ? (
              <Link
                to={nextSection.path}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition text-right"
              >
                <div>
                  <div className="text-xs text-gray-400">Next</div>
                  <div className="font-medium">{nextSection.title}</div>
                </div>
                <ChevronRight size={16} />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* TOC sidebar (desktop only) */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <TableOfContents items={content.tableOfContents} />
        </div>
      </div>
    </div>
  );
}
