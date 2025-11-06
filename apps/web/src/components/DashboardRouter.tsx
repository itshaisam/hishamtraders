import { useAuthStore } from '../stores/auth.store';
import AdminDashboard from './dashboards/AdminDashboard';
import WarehouseDashboard from './dashboards/WarehouseDashboard';
import SalesDashboard from './dashboards/SalesDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';
import RecoveryDashboard from './dashboards/RecoveryDashboard';

export default function DashboardRouter() {
  const user = useAuthStore((state) => state.user);

  if (!user || !user.role) {
    return <div className="p-6">Loading...</div>;
  }

  switch (user.role.name) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'WAREHOUSE_MANAGER':
      return <WarehouseDashboard />;
    case 'SALES_OFFICER':
      return <SalesDashboard />;
    case 'ACCOUNTANT':
      return <AccountantDashboard />;
    case 'RECOVERY_AGENT':
      return <RecoveryDashboard />;
    default:
      return <div className="p-6">Access Denied</div>;
  }
}
