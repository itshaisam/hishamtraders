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
import { WarehousesPage } from './features/warehouses/pages/WarehousesPage';
import { WarehouseFormPage } from './features/warehouses/pages/WarehouseFormPage';
import { WarehouseDetailPage } from './features/warehouses/pages/WarehouseDetailPage';
import { ReceiveGoodsPage } from './features/purchase-orders/pages/ReceiveGoodsPage';
import { InventoryPage } from './features/inventory/pages/InventoryPage';
import { StockAdjustmentPage } from './features/inventory/pages/StockAdjustmentPage';
import { AdjustmentHistoryPage } from './features/inventory/pages/AdjustmentHistoryPage';
import { AdjustmentApprovalPage } from './features/inventory/pages/AdjustmentApprovalPage';
import StockMovementsPage from './features/inventory/pages/StockMovementsPage';

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
            path="/purchase-orders/:id/receive"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReceiveGoodsPage />
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

          {/* Warehouses routes */}
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute>
                <Layout>
                  <WarehousesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/warehouses/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <WarehouseFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/warehouses/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <WarehouseDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Inventory route */}
          <Route
            path="/stock-levels"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventoryPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Stock Adjustments routes */}
          <Route
            path="/inventory/adjustments/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <StockAdjustmentPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/adjustments/history"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdjustmentHistoryPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/adjustments/approvals"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdjustmentApprovalPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Stock Movements route */}
          <Route
            path="/inventory/movements"
            element={
              <ProtectedRoute>
                <Layout>
                  <StockMovementsPage />
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
