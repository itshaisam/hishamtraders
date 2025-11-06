import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { usePermission } from '../hooks/usePermission';
import { LogOut, LayoutDashboard, Users, Package, FileText, DollarSign } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const { hasRole, isAdmin } = usePermission();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">Hisham Traders ERP</h1>

            <div className="flex gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-gray-700 hover:text-primary"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>

              {isAdmin() && (
                <Link
                  to="/users"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary"
                >
                  <Users size={18} />
                  Users
                </Link>
              )}

              {hasRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']) && (
                <Link
                  to="/products"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary"
                >
                  <Package size={18} />
                  Products
                </Link>
              )}

              {hasRole(['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT', 'RECOVERY_AGENT']) && (
                <Link
                  to="/invoices"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary"
                >
                  <FileText size={18} />
                  Invoices
                </Link>
              )}

              {hasRole(['ADMIN', 'ACCOUNTANT']) && (
                <Link
                  to="/payments"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary"
                >
                  <DollarSign size={18} />
                  Payments
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-700 hover:text-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
