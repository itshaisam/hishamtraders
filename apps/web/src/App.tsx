import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuthStore } from './stores/auth.store';
import { SuppliersPage } from './features/suppliers/pages/SuppliersPage';
import { SupplierFormPage } from './features/suppliers/pages/SupplierFormPage';
import { SupplierDetailPage } from './features/suppliers/pages/SupplierDetailPage';
import { ProductsPage } from './features/products/pages/ProductsPage';
import { ProductFormPage } from './features/products/pages/ProductFormPage';
import { ProductDetailPage } from './features/products/pages/ProductDetailPage';
import { PurchaseOrdersPage } from './features/purchase-orders/pages/PurchaseOrdersPage';
import { POFormPage } from './features/purchase-orders/pages/POFormPage';
import { PODetailPage } from './features/purchase-orders/pages/PODetailPage';
import { POViewPage } from './features/purchase-orders/pages/POViewPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
          />

          {/* Login route - redirect to dashboard if already authenticated */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
          />

          {/* Protected dashboard route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Suppliers routes */}
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Layout>
                  <SuppliersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/suppliers/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupplierFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/suppliers/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupplierDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Products routes */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/products/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Purchase Orders routes */}
          <Route
            path="/purchase-orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <PurchaseOrdersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-orders/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <POFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-orders/:id/view"
            element={
              <ProtectedRoute>
                <Layout>
                  <POViewPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-orders/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <PODetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
