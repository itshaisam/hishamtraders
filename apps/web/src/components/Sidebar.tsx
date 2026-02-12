import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { usePermission } from '../hooks/usePermission';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  BookOpen,
  X,
} from 'lucide-react';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobile = false, isOpen = false, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { hasRole, isAdmin } = usePermission();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((m) => m !== menuName)
        : [...prev, menuName]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName);

  // Mobile backdrop
  const MobileBackdrop = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
      onClick={onClose}
    />
  );

  return (
    <>
      {/* Mobile backdrop - only show when mobile drawer is open */}
      {isMobile && isOpen && <MobileBackdrop />}

      {/* Sidebar - Fixed on desktop, drawer on mobile */}
      <div
        className={`bg-white h-screen fixed left-0 top-0 border-r border-gray-200 transition-all duration-300 ${
          isMobile ? 'z-40 w-60' : 'z-40 hidden sm:block'
        } ${isMobile && !isOpen ? '-translate-x-full' : ''} ${
          isCollapsed && !isMobile ? 'w-16' : !isMobile ? 'w-60' : ''
        }`}
      >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && !isMobile && (
          <div>
            <h1 className="text-lg font-bold text-gray-900">Hisham Traders</h1>
            <p className="text-xs text-gray-500">ERP System</p>
          </div>
        )}
        <button
          onClick={() => {
            if (isMobile) {
              onClose?.();
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          className="p-1 hover:bg-gray-100 rounded transition"
          aria-label={isMobile ? 'Close menu' : 'Toggle sidebar'}
        >
          {isMobile ? (
            <X size={20} className="text-gray-600" />
          ) : isCollapsed ? (
            <ChevronRight size={20} className="text-gray-600" />
          ) : (
            <ChevronLeft size={20} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role?.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
            isActive('/dashboard')
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Dashboard</span>}
        </Link>

        {/* Inventory Menu */}
        {hasRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']) && (
          <div className="mt-2">
            <button
              onClick={() => toggleMenu('inventory')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <Package size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Inventory</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isMenuExpanded('inventory') ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
            {isMenuExpanded('inventory') && !isCollapsed && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  to="/products"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Products
                </Link>
                <Link
                  to="/stock-levels"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Stock Levels
                </Link>
                <Link
                  to="/warehouses"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Warehouses & Bins
                </Link>
                <Link
                  to="/inventory/adjustments/new"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  New Stock Adjustment
                </Link>
                <Link
                  to="/inventory/adjustments/approvals"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Adjustment Approvals
                </Link>
                <Link
                  to="/inventory/adjustments/history"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Adjustment History
                </Link>
                <Link
                  to="/inventory/movements"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Stock Movements Report
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Purchases Menu */}
        {hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
          <div className="mt-2">
            <button
              onClick={() => toggleMenu('purchases')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Purchases</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isMenuExpanded('purchases') ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
            {isMenuExpanded('purchases') && !isCollapsed && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  to="/purchase-orders"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Purchase Orders
                </Link>
                <Link
                  to="/suppliers"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Suppliers
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Sales Menu */}
        {hasRole(['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT']) && (
          <div className="mt-2">
            <button
              onClick={() => toggleMenu('sales')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Sales</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isMenuExpanded('sales') ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
            {isMenuExpanded('sales') && !isCollapsed && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  to="/clients"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Clients
                </Link>
                <Link
                  to="/invoices"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Invoices
                </Link>
                <Link
                  to="/returns"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Returns
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Payments Menu */}
        {hasRole(['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT']) && (
          <div className="mt-2">
            <button
              onClick={() => toggleMenu('payments')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <DollarSign size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Payments</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isMenuExpanded('payments') ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
            {isMenuExpanded('payments') && !isCollapsed && (
              <div className="ml-6 mt-1 space-y-1">
                {hasRole(['ADMIN', 'ACCOUNTANT']) && (
                  <>
                    <Link
                      to="/payments/client/record"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                    >
                      Record Client Payment
                    </Link>
                    <Link
                      to="/payments/client/history"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                    >
                      Client Payment History
                    </Link>
                    <Link
                      to="/payments/supplier/record"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                    >
                      Record Supplier Payment
                    </Link>
                    <Link
                      to="/payments/supplier/history"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                    >
                      Supplier Payment History
                    </Link>
                    <Link
                      to="/expenses"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                    >
                      Expenses
                    </Link>
                  </>
                )}
                <Link
                  to="/payments/history"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Payment History
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Reports Menu */}
        <div className="mt-2">
          <button
            onClick={() => toggleMenu('reports')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={20} />
              {!isCollapsed && <span className="text-sm font-medium">Reports</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isMenuExpanded('reports') ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>
          {isMenuExpanded('reports') && !isCollapsed && (
            <div className="ml-6 mt-1 space-y-1">
              <Link
                to="/reports"
                className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
              >
                All Reports
              </Link>
              <Link
                to="/reports/stock"
                className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
              >
                Stock Report
              </Link>
              <Link
                to="/reports/sales"
                className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
              >
                Sales Report
              </Link>
              <Link
                to="/reports/payments"
                className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
              >
                Payment Report
              </Link>
              <Link
                to="/reports/imports"
                className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
              >
                Import Report
              </Link>
              <Link
                to="/reports/expenses"
                className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
              >
                Expense Report
              </Link>
              <Link
                to="/reports/cash-flow"
                className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
              >
                Cash Flow
              </Link>
            </div>
          )}
        </div>

        {/* Accounting Menu (Admin & Accountant) */}
        {hasRole(['ADMIN', 'ACCOUNTANT']) && (
          <div className="mt-2">
            <button
              onClick={() => toggleMenu('accounting')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Accounting</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isMenuExpanded('accounting') ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
            {isMenuExpanded('accounting') && !isCollapsed && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  to="/accounting/chart-of-accounts"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Chart of Accounts
                </Link>
                <Link
                  to="/accounting/journal-entries"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Journal Entries
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Users (Admin only) */}
        {isAdmin() && (
          <Link
            to="/users"
            className="mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <Users size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Users</span>}
          </Link>
        )}

        {/* Audit Trail (Admin only) */}
        {isAdmin() && (
          <Link
            to="/audit-trail"
            className="mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <ClipboardList size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Audit Trail</span>}
          </Link>
        )}

        {/* Settings Menu (Admin only) */}
        {isAdmin() && (
          <div className="mt-2">
            <button
              onClick={() => toggleMenu('settings')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <Settings size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isMenuExpanded('settings') ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
            {isMenuExpanded('settings') && !isCollapsed && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  to="/settings/tax"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  System Settings
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-2">
        <Link
          to="/help"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          <HelpCircle size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Help</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
    </>
  );
}
