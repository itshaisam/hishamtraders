import { Link } from 'react-router-dom';
import { BarChart3, Package, FileText, DollarSign, ShoppingCart, Receipt } from 'lucide-react';
import { useAuthStore } from '../../../stores/auth.store';
import { REPORTS, REPORT_CATEGORIES, ReportDefinition } from '../data/reportDefinitions';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  inventory: <Package className="h-5 w-5 text-blue-600" />,
  sales: <FileText className="h-5 w-5 text-green-600" />,
  payments: <DollarSign className="h-5 w-5 text-purple-600" />,
  imports: <ShoppingCart className="h-5 w-5 text-orange-600" />,
  expenses: <Receipt className="h-5 w-5 text-red-600" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  inventory: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
  sales: 'border-green-200 hover:border-green-400 hover:bg-green-50',
  payments: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
  imports: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50',
  expenses: 'border-red-200 hover:border-red-400 hover:bg-red-50',
};

export default function ReportsCenterPage() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role?.name || '';

  const visibleReports = REPORTS.filter(
    (r) => r.roles.length === 0 || r.roles.includes(userRole)
  );

  const grouped = visibleReports.reduce<Record<string, ReportDefinition[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Reports', href: '/reports' }, { label: 'Reports Center' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Reports Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Access all available reports across the system
        </p>
      </div>

      {Object.entries(grouped).map(([category, reports]) => (
        <div key={category} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {CATEGORY_ICONS[category]}
            <h2 className="text-lg font-semibold text-gray-800">
              {REPORT_CATEGORIES[category] || category}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                to={report.path}
                className={`block p-4 bg-white border rounded-lg transition-all ${CATEGORY_COLORS[category]}`}
              >
                <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{report.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {visibleReports.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No reports available for your role.</p>
        </div>
      )}
    </div>
  );
}
