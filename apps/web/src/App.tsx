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
import RecordSupplierPaymentPage from './features/payments/pages/RecordSupplierPaymentPage';
import RecordClientPaymentPage from './features/payments/pages/RecordClientPaymentPage';
import SupplierPaymentsPage from './features/payments/pages/SupplierPaymentsPage';
import ClientPaymentsPage from './features/payments/pages/ClientPaymentsPage';
import { ClientsPage } from './features/clients/pages/ClientsPage';
import { ClientFormPage } from './features/clients/pages/ClientFormPage';
import { ClientDetailPage } from './features/clients/pages/ClientDetailPage';
import { ClientViewPage } from './features/clients/pages/ClientViewPage';
import { InvoicesPage } from './features/invoices/pages/InvoicesPage';
import { CreateInvoicePage } from './features/invoices/pages/CreateInvoicePage';
import { InvoiceDetailPage } from './features/invoices/pages/InvoiceDetailPage';
import { ExpensesPage } from './features/expenses/pages/ExpensesPage';
import PaymentHistoryPage from './features/payments/pages/PaymentHistoryPage';
import CashFlowReportPage from './features/reports/pages/CashFlowReportPage';
import ReportsCenterPage from './features/reports/pages/ReportsCenterPage';
import StockReportPage from './features/reports/pages/StockReportPage';
import SalesReportPage from './features/reports/pages/SalesReportPage';
import PaymentReportPage from './features/reports/pages/PaymentReportPage';
import ImportReportPage from './features/reports/pages/ImportReportPage';
import ExpenseReportPage from './features/reports/pages/ExpenseReportPage';
import { TaxSettingsPage } from './features/settings/pages/TaxSettingsPage';
import { ReturnsPage } from './features/returns/pages/ReturnsPage';
import { CreateReturnPage } from './features/returns/pages/CreateReturnPage';
import { CreditNoteDetailPage } from './features/returns/pages/CreditNoteDetailPage';
import { AuditTrailPage } from './features/audit/pages/AuditTrailPage';
import { ChartOfAccountsPage } from './features/accounting/pages/ChartOfAccountsPage';
import { JournalEntriesPage } from './features/accounting/pages/JournalEntriesPage';
import { CreateJournalEntryPage } from './features/accounting/pages/CreateJournalEntryPage';
import { JournalEntryDetailPage } from './features/accounting/pages/JournalEntryDetailPage';
import { TrialBalancePage } from './features/accounting/pages/TrialBalancePage';
import { BalanceSheetPage } from './features/accounting/pages/BalanceSheetPage';
import { GeneralLedgerPage } from './features/accounting/pages/GeneralLedgerPage';

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

          {/* Supplier Payments routes */}
          <Route
            path="/payments/supplier/record"
            element={
              <ProtectedRoute>
                <Layout>
                  <RecordSupplierPaymentPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments/supplier/history"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupplierPaymentsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Client Payments routes (Story 3.6) */}
          <Route
            path="/payments/client/record"
            element={
              <ProtectedRoute>
                <Layout>
                  <RecordClientPaymentPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments/client/record/:clientId"
            element={
              <ProtectedRoute>
                <Layout>
                  <RecordClientPaymentPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments/client/history"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientPaymentsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Clients routes */}
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/:id/view"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientViewPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Invoices routes */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <Layout>
                  <InvoicesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateInvoicePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <InvoiceDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Expenses route */}
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExpensesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Payment History (Story 3.8) */}
          <Route
            path="/payments/history"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentHistoryPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Reports Center (Story 4.10) */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReportsCenterPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Cash Flow Report (Story 3.8) */}
          <Route
            path="/reports/cash-flow"
            element={
              <ProtectedRoute>
                <Layout>
                  <CashFlowReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Stock Report (Story 4.4) */}
          <Route
            path="/reports/stock"
            element={
              <ProtectedRoute>
                <Layout>
                  <StockReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Sales Report (Story 4.5) */}
          <Route
            path="/reports/sales"
            element={
              <ProtectedRoute>
                <Layout>
                  <SalesReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Payment Report (Story 4.6) */}
          <Route
            path="/reports/payments"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Import Report (Story 4.7) */}
          <Route
            path="/reports/imports"
            element={
              <ProtectedRoute>
                <Layout>
                  <ImportReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Expense Report (Story 4.8) */}
          <Route
            path="/reports/expenses"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExpenseReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Returns / Credit Notes routes (Story 3.9) */}
          <Route
            path="/returns"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReturnsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/returns/create/:invoiceId"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateReturnPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/returns/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreditNoteDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Settings routes (Story 3.10) */}
          <Route
            path="/settings/tax"
            element={
              <ProtectedRoute>
                <Layout>
                  <TaxSettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Accounting routes (Epic 5) */}
          <Route
            path="/accounting/chart-of-accounts"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChartOfAccountsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/journal-entries"
            element={
              <ProtectedRoute>
                <Layout>
                  <JournalEntriesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/journal-entries/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateJournalEntryPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/journal-entries/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateJournalEntryPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/journal-entries/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <JournalEntryDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/trial-balance"
            element={
              <ProtectedRoute>
                <Layout>
                  <TrialBalancePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/balance-sheet"
            element={
              <ProtectedRoute>
                <Layout>
                  <BalanceSheetPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/general-ledger"
            element={
              <ProtectedRoute>
                <Layout>
                  <GeneralLedgerPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Audit Trail */}
          <Route
            path="/audit-trail"
            element={
              <ProtectedRoute>
                <Layout>
                  <AuditTrailPage />
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
