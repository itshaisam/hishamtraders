import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      // Even if API call fails, clear local auth state
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Hisham Traders ERP</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-md shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard</h2>

          {/* Welcome Message */}
          <div className="mb-6">
            <p className="text-gray-600">
              Welcome, <span className="font-medium text-gray-900">{user?.name}</span>!
            </p>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Authentication Successful
            </h3>
            <p className="text-sm text-blue-700">
              You are now logged in to the Hisham Traders ERP system. Role-specific dashboards
              will be implemented in Story 1.7.
            </p>
          </div>

          {/* User Info */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Your Information:</h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{user?.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Role ID</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{user?.roleId}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {user?.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
