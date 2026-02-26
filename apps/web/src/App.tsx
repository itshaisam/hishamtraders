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
import BinLocationManagementPage from './features/warehouses/pages/BinLocationManagementPage';
import { ReceiveGoodsPage } from './features/purchase-orders/pages/ReceiveGoodsPage';
import { GoodsReceiptsPage } from './features/goods-receipts/pages/GoodsReceiptsPage';
import { CreateGoodsReceiptPage } from './features/goods-receipts/pages/CreateGoodsReceiptPage';
import { GoodsReceiptDetailPage } from './features/goods-receipts/pages/GoodsReceiptDetailPage';
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
import GatePassReportPage from './features/reports/pages/GatePassReportPage';
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
import { BankAccountsPage } from './features/accounting/pages/BankAccountsPage';
import { PettyCashPage } from './features/accounting/pages/PettyCashPage';
import { BankReconciliationPage } from './features/accounting/pages/BankReconciliationPage';
import { ReconciliationDetailPage } from './features/accounting/pages/ReconciliationDetailPage';
import { MonthEndClosingPage } from './features/accounting/pages/MonthEndClosingPage';
import GatePassListPage from './features/gate-passes/pages/GatePassListPage';
import CreateGatePassPage from './features/gate-passes/pages/CreateGatePassPage';
import GatePassDetailPage from './features/gate-passes/pages/GatePassDetailPage';
import StockTransferListPage from './features/stock-transfers/pages/StockTransferListPage';
import CreateStockTransferPage from './features/stock-transfers/pages/CreateStockTransferPage';
import StockTransferDetailPage from './features/stock-transfers/pages/StockTransferDetailPage';
import BinTransferPage from './features/warehouses/pages/BinTransferPage';
import ExpiryAlertsPage from './features/inventory/pages/ExpiryAlertsPage';
import StockCountListPage from './features/stock-counts/pages/StockCountListPage';
import CreateStockCountPage from './features/stock-counts/pages/CreateStockCountPage';
import StockCountDetailPage from './features/stock-counts/pages/StockCountDetailPage';
import RecoveryDashboardPage from './features/recovery/pages/RecoveryDashboardPage';
import RecoveryRoutePage from './features/recovery/pages/RecoveryRoutePage';
import RecoveryVisitLogPage from './features/recovery/pages/RecoveryVisitLogPage';
import DuePromisesPage from './features/recovery/pages/DuePromisesPage';
import AgingAnalysisPage from './features/recovery/pages/AgingAnalysisPage';
import AlertsPage from './features/recovery/pages/AlertsPage';
import AgentPerformancePage from './features/recovery/pages/AgentPerformancePage';
import CollectionEfficiencyPage from './features/recovery/pages/CollectionEfficiencyPage';
import VisitActivityReportPage from './features/reports/pages/VisitActivityReportPage';
import CollectionSummaryPage from './features/reports/pages/CollectionSummaryPage';
import OverdueClientsReportPage from './features/reports/pages/OverdueClientsReportPage';
import AgentProductivityPage from './features/reports/pages/AgentProductivityPage';
import { SalesOrderReportPage } from './features/reports/pages/SalesOrderReportPage';
import { DeliveryNoteReportPage } from './features/reports/pages/DeliveryNoteReportPage';
import { PurchaseInvoiceAgingPage } from './features/reports/pages/PurchaseInvoiceAgingPage';
// WorkflowSettingsPage merged into unified TaxSettingsPage (System Settings)
import { SalesOrdersPage } from './features/sales-orders/pages/SalesOrdersPage';
import { CreateSalesOrderPage } from './features/sales-orders/pages/CreateSalesOrderPage';
import { SalesOrderDetailPage } from './features/sales-orders/pages/SalesOrderDetailPage';
import { DeliveryNotesPage } from './features/delivery-notes/pages/DeliveryNotesPage';
import { CreateDeliveryNotePage } from './features/delivery-notes/pages/CreateDeliveryNotePage';
import { DeliveryNoteDetailPage } from './features/delivery-notes/pages/DeliveryNoteDetailPage';
import { PurchaseInvoicesPage } from './features/purchase-invoices/pages/PurchaseInvoicesPage';
import { CreatePurchaseInvoicePage } from './features/purchase-invoices/pages/CreatePurchaseInvoicePage';
import { PurchaseInvoiceDetailPage } from './features/purchase-invoices/pages/PurchaseInvoiceDetailPage';
import HelpIndexPage from './features/help/pages/HelpIndexPage';
import GettingStartedPage from './features/help/pages/GettingStartedPage';
import DashboardGuidePage from './features/help/pages/DashboardGuidePage';
import InventoryGuidePage from './features/help/pages/InventoryGuidePage';
import PurchasesGuidePage from './features/help/pages/PurchasesGuidePage';
import SalesGuidePage from './features/help/pages/SalesGuidePage';
import PaymentsGuidePage from './features/help/pages/PaymentsGuidePage';
import ReportsGuidePage from './features/help/pages/ReportsGuidePage';
import AccountingGuidePage from './features/help/pages/AccountingGuidePage';
import AdministrationGuidePage from './features/help/pages/AdministrationGuidePage';
import DatabaseSetupGuidePage from './features/help/pages/DatabaseSetupGuidePage';

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

          {/* Goods Receipts (GRN) routes */}
          <Route
            path="/goods-receipts"
            element={
              <ProtectedRoute>
                <Layout>
                  <GoodsReceiptsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/goods-receipts/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateGoodsReceiptPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/goods-receipts/new/:poId"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateGoodsReceiptPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/goods-receipts/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <GoodsReceiptDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Purchase Invoices routes */}
          <Route
            path="/purchase-invoices"
            element={
              <ProtectedRoute>
                <Layout>
                  <PurchaseInvoicesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-invoices/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreatePurchaseInvoicePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-invoices/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <PurchaseInvoiceDetailPage />
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
            path="/warehouses/bin-locations"
            element={
              <ProtectedRoute>
                <Layout>
                  <BinLocationManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/warehouses/bin-transfers"
            element={
              <ProtectedRoute>
                <Layout>
                  <BinTransferPage />
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

          {/* Expiry Alerts (Story 6.7) */}
          <Route
            path="/inventory/expiry-alerts"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExpiryAlertsPage />
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

          {/* Sales Orders routes */}
          <Route
            path="/sales-orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <SalesOrdersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sales-orders/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateSalesOrderPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sales-orders/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <SalesOrderDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Delivery Notes routes */}
          <Route
            path="/delivery-notes"
            element={
              <ProtectedRoute>
                <Layout>
                  <DeliveryNotesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery-notes/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateDeliveryNotePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery-notes/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <DeliveryNoteDetailPage />
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

          {/* Gate Pass Report (Story 6.10) */}
          <Route
            path="/reports/gate-passes"
            element={
              <ProtectedRoute>
                <Layout>
                  <GatePassReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Report pages (Story 10.10) */}
          <Route
            path="/reports/sales-orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <SalesOrderReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/delivery-notes"
            element={
              <ProtectedRoute>
                <Layout>
                  <DeliveryNoteReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/purchase-invoice-aging"
            element={
              <ProtectedRoute>
                <Layout>
                  <PurchaseInvoiceAgingPage />
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

          {/* Unified System Settings (Story 8.7) */}
          <Route
            path="/settings"
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

          {/* Bank Accounts (Story 5.7) */}
          <Route
            path="/accounting/bank-accounts"
            element={
              <ProtectedRoute>
                <Layout>
                  <BankAccountsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Petty Cash (Story 5.9) */}
          <Route
            path="/accounting/petty-cash"
            element={
              <ProtectedRoute>
                <Layout>
                  <PettyCashPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Bank Reconciliation (Story 5.8) */}
          <Route
            path="/accounting/bank-reconciliation"
            element={
              <ProtectedRoute>
                <Layout>
                  <BankReconciliationPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounting/bank-reconciliation/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReconciliationDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Month-End Closing (Story 5.10) */}
          <Route
            path="/accounting/month-end"
            element={
              <ProtectedRoute>
                <Layout>
                  <MonthEndClosingPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Gate Passes (Epic 6) */}
          <Route
            path="/gate-passes"
            element={
              <ProtectedRoute>
                <Layout>
                  <GatePassListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gate-passes/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateGatePassPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gate-passes/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <GatePassDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Stock Transfers (Story 6.4) */}
          <Route
            path="/stock-transfers"
            element={
              <ProtectedRoute>
                <Layout>
                  <StockTransferListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-transfers/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateStockTransferPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-transfers/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <StockTransferDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Stock Counts (Story 6.9) */}
          <Route
            path="/stock-counts"
            element={
              <ProtectedRoute>
                <Layout>
                  <StockCountListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-counts/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateStockCountPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-counts/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <StockCountDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Recovery (Epic 7) */}
          <Route
            path="/recovery"
            element={
              <ProtectedRoute>
                <Layout>
                  <RecoveryDashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery/route"
            element={
              <ProtectedRoute>
                <Layout>
                  <RecoveryRoutePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery/visits/log"
            element={
              <ProtectedRoute>
                <Layout>
                  <RecoveryVisitLogPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery/promises"
            element={
              <ProtectedRoute>
                <Layout>
                  <DuePromisesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery/aging"
            element={
              <ProtectedRoute>
                <Layout>
                  <AgingAnalysisPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery/alerts"
            element={
              <ProtectedRoute>
                <Layout>
                  <AlertsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery/agents/performance"
            element={
              <ProtectedRoute>
                <Layout>
                  <AgentPerformancePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery/collection-efficiency"
            element={
              <ProtectedRoute>
                <Layout>
                  <CollectionEfficiencyPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Recovery Reports (Story 7.9) */}
          <Route
            path="/reports/recovery/visits"
            element={
              <ProtectedRoute>
                <Layout>
                  <VisitActivityReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/recovery/collections"
            element={
              <ProtectedRoute>
                <Layout>
                  <CollectionSummaryPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/recovery/overdue"
            element={
              <ProtectedRoute>
                <Layout>
                  <OverdueClientsReportPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/recovery/productivity"
            element={
              <ProtectedRoute>
                <Layout>
                  <AgentProductivityPage />
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

          {/* Help / User Guide */}
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Layout>
                  <HelpIndexPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/getting-started"
            element={
              <ProtectedRoute>
                <Layout>
                  <GettingStartedPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardGuidePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/inventory"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventoryGuidePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/purchases"
            element={
              <ProtectedRoute>
                <Layout>
                  <PurchasesGuidePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/sales"
            element={
              <ProtectedRoute>
                <Layout>
                  <SalesGuidePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/payments"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentsGuidePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReportsGuidePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/accounting"
            element={
              <ProtectedRoute>
                <Layout>
                  <AccountingGuidePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/administration"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdministrationGuidePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/setup"
            element={
              <ProtectedRoute>
                <Layout>
                  <DatabaseSetupGuidePage />
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
