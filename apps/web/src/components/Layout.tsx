import { ReactNode, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile, visible on sm and above */}
      <Sidebar isMobile={false} />

      {/* Mobile Drawer Sidebar - Shown as overlay on mobile */}
      <Sidebar isMobile={true} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Layout - Responsive margin for desktop sidebar */}
      <div className="flex-1 w-full flex flex-col sm:ml-60">
        {/* Mobile Header - Visible only on mobile */}
        <div className="sm:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between p-3">
            <h1 className="text-lg font-bold text-gray-900">Hisham Traders</h1>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Open navigation menu"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          <main className="p-3 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
