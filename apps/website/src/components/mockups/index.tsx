/* ─── Shared Module Mockups ───
   Pure CSS/Tailwind dashboard previews for feature pages and homepage showcase.
   Each renders inside a browser-chrome wrapper provided by the parent. */

/* ─── Inventory Mockup ─── */
export function InventoryMockup() {
  return (
    <div className="p-3 bg-gray-50 space-y-3">
      {/* Warehouse Cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { name: "Main - Karachi", items: "1,245", value: "PKR 15.2M", status: "Healthy", statusColor: "bg-green-100 text-green-700" },
          { name: "Warehouse 2", items: "892", value: "PKR 6.8M", status: "Healthy", statusColor: "bg-green-100 text-green-700" },
          { name: "Warehouse 3", items: "467", value: "PKR 2.5M", status: "Low Stock", statusColor: "bg-orange-100 text-orange-700" },
        ].map((w) => (
          <div key={w.name} className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] font-medium text-gray-700 truncate">{w.name}</p>
            <p className="text-xs font-bold text-gray-900 mt-1">{w.items} items</p>
            <p className="text-[10px] text-gray-500">{w.value}</p>
            <span className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${w.statusColor}`}>
              {w.status}
            </span>
          </div>
        ))}
      </div>
      {/* Stock Table */}
      <div className="bg-white rounded-lg border border-gray-100 p-2.5">
        <p className="text-[10px] font-semibold text-gray-700 mb-2">Stock Levels</p>
        <div className="space-y-1.5">
          <div className="flex items-center text-[10px] text-gray-500 border-b border-gray-50 pb-1">
            <span className="w-20">SKU</span>
            <span className="flex-1">Product</span>
            <span className="w-12 text-right">Qty</span>
            <span className="w-16 text-right">Status</span>
          </div>
          {[
            { sku: "SKU-001", name: "Rice Basmati 25kg", qty: "450", status: "In Stock", color: "text-green-600" },
            { sku: "SKU-002", name: "Cooking Oil 5L", qty: "28", status: "Low", color: "text-orange-600" },
            { sku: "SKU-003", name: "Sugar 50kg", qty: "320", status: "In Stock", color: "text-green-600" },
            { sku: "SKU-004", name: "Wheat Flour 20kg", qty: "0", status: "Out", color: "text-red-600" },
            { sku: "SKU-005", name: "Lentils 10kg", qty: "185", status: "In Stock", color: "text-green-600" },
          ].map((row) => (
            <div key={row.sku} className="flex items-center text-[10px]">
              <span className="w-20 text-gray-400 font-mono">{row.sku}</span>
              <span className="flex-1 text-gray-700 truncate">{row.name}</span>
              <span className="w-12 text-right text-gray-900 font-medium">{row.qty}</span>
              <span className={`w-16 text-right font-semibold ${row.color}`}>{row.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sales Mockup ─── */
export function SalesMockup() {
  return (
    <div className="p-3 bg-gray-50 space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Today's Sales", value: "PKR 485K", color: "text-green-600", border: "border-l-green-500" },
          { label: "Monthly", value: "PKR 12.4M", color: "text-blue-600", border: "border-l-blue-500" },
          { label: "Target", value: "82%", color: "text-purple-600", border: "border-l-purple-500" },
          { label: "Invoices", value: "36", color: "text-orange-600", border: "border-l-orange-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-lg p-2 border border-gray-100 border-l-2 ${kpi.border}`}>
            <p className="text-[9px] text-gray-500">{kpi.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
      {/* Invoice Preview */}
      <div className="bg-white rounded-lg border border-gray-100 p-2.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-gray-700">Invoice #INV-2025-1032</p>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Credit OK</span>
        </div>
        <div className="space-y-1">
          {[
            { item: "Rice Basmati 25kg", qty: "50", rate: "2,800", amount: "140,000" },
            { item: "Cooking Oil 5L", qty: "100", rate: "1,850", amount: "185,000" },
            { item: "Sugar 50kg", qty: "30", rate: "6,200", amount: "186,000" },
          ].map((line) => (
            <div key={line.item} className="flex items-center text-[10px] py-0.5 border-b border-gray-50">
              <span className="flex-1 text-gray-700">{line.item}</span>
              <span className="w-8 text-right text-gray-500">{line.qty}</span>
              <span className="w-14 text-right text-gray-500">{line.rate}</span>
              <span className="w-16 text-right text-gray-900 font-medium">{line.amount}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-2 pt-1.5 border-t border-gray-100">
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Subtotal: PKR 511,000</p>
            <p className="text-[10px] text-gray-500">Tax (17%): PKR 86,870</p>
            <p className="text-xs font-bold text-gray-900">Total: PKR 597,870</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Accounting Mockup ─── */
export function AccountingMockup() {
  return (
    <div className="p-3 bg-gray-50 space-y-3">
      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Assets", value: "PKR 42.8M", color: "text-blue-600" },
          { label: "Revenue (MTD)", value: "PKR 8.2M", color: "text-green-600" },
          { label: "Expenses (MTD)", value: "PKR 5.1M", color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-2 border border-gray-100 text-center">
            <p className="text-[9px] text-gray-500">{s.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      {/* Trial Balance */}
      <div className="bg-white rounded-lg border border-gray-100 p-2.5">
        <p className="text-[10px] font-semibold text-gray-700 mb-2">Trial Balance Summary</p>
        <div className="space-y-1">
          <div className="flex items-center text-[10px] text-gray-500 border-b border-gray-50 pb-1">
            <span className="flex-1">Account</span>
            <span className="w-20 text-right">Debit</span>
            <span className="w-20 text-right">Credit</span>
          </div>
          {[
            { account: "Cash & Bank", debit: "4,250,000", credit: "-" },
            { account: "Accounts Receivable", debit: "6,800,000", credit: "-" },
            { account: "Inventory", debit: "24,500,000", credit: "-" },
            { account: "Accounts Payable", debit: "-", credit: "3,200,000" },
            { account: "Revenue", debit: "-", credit: "8,200,000" },
            { account: "Cost of Goods Sold", debit: "5,100,000", credit: "-" },
          ].map((row) => (
            <div key={row.account} className="flex items-center text-[10px] py-0.5">
              <span className="flex-1 text-gray-700">{row.account}</span>
              <span className="w-20 text-right text-gray-900 font-mono">{row.debit}</span>
              <span className="w-20 text-right text-gray-900 font-mono">{row.credit}</span>
            </div>
          ))}
          <div className="flex items-center text-[10px] pt-1.5 border-t border-gray-200 font-bold">
            <span className="flex-1 text-gray-900">Total</span>
            <span className="w-20 text-right text-gray-900 font-mono">40,650,000</span>
            <span className="w-20 text-right text-gray-900 font-mono">40,650,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Procurement Mockup ─── */
export function ProcurementMockup() {
  return (
    <div className="p-3 bg-gray-50 space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Active POs", value: "18", color: "text-blue-600", border: "border-l-blue-500" },
          { label: "In Transit", value: "5", color: "text-orange-600", border: "border-l-orange-500" },
          { label: "Pending Receipt", value: "3", color: "text-purple-600", border: "border-l-purple-500" },
          { label: "Suppliers", value: "42", color: "text-green-600", border: "border-l-green-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-lg p-2 border border-gray-100 border-l-2 ${kpi.border}`}>
            <p className="text-[9px] text-gray-500">{kpi.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg border border-gray-100 p-2.5">
        <p className="text-[10px] font-semibold text-gray-700 mb-2">Recent Purchase Orders</p>
        <div className="space-y-1.5">
          <div className="flex items-center text-[10px] text-gray-500 border-b border-gray-50 pb-1">
            <span className="w-20">PO #</span>
            <span className="flex-1">Supplier</span>
            <span className="w-20">Container</span>
            <span className="w-16 text-right">Amount</span>
            <span className="w-18 text-right">Status</span>
          </div>
          {[
            { po: "PO-2025-041", supplier: "Shanghai Trading Co.", container: "MSKU-7284", amount: "3.2M", status: "In Transit", statusColor: "bg-orange-100 text-orange-700" },
            { po: "PO-2025-040", supplier: "Dubai Imports LLC", container: "HLCU-9102", amount: "1.8M", status: "Received", statusColor: "bg-green-100 text-green-700" },
            { po: "PO-2025-039", supplier: "Karachi Wholesale", container: "-", amount: "420K", status: "Pending", statusColor: "bg-blue-100 text-blue-700" },
            { po: "PO-2025-038", supplier: "Global Agri Exports", container: "CMAU-5531", amount: "2.1M", status: "In Transit", statusColor: "bg-orange-100 text-orange-700" },
          ].map((row) => (
            <div key={row.po} className="flex items-center text-[10px]">
              <span className="w-20 text-gray-400 font-mono">{row.po}</span>
              <span className="flex-1 text-gray-700 truncate">{row.supplier}</span>
              <span className="w-20 text-gray-500 font-mono text-[9px]">{row.container}</span>
              <span className="w-16 text-right text-gray-900 font-medium">{row.amount}</span>
              <span className={`w-18 text-right text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${row.statusColor}`}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Recovery Mockup ─── */
export function RecoveryMockup() {
  return (
    <div className="p-3 bg-gray-50 space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Outstanding", value: "PKR 6.8M", color: "text-red-600", border: "border-l-red-500" },
          { label: "Collected Today", value: "PKR 245K", color: "text-green-600", border: "border-l-green-500" },
          { label: "Visits Today", value: "12", color: "text-blue-600", border: "border-l-blue-500" },
          { label: "Overdue", value: "28", color: "text-orange-600", border: "border-l-orange-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-lg p-2 border border-gray-100 border-l-2 ${kpi.border}`}>
            <p className="text-[9px] text-gray-500">{kpi.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
      {/* Agent Collection Progress */}
      <div className="bg-white rounded-lg border border-gray-100 p-2.5">
        <p className="text-[10px] font-semibold text-gray-700 mb-2">Agent Collection Progress</p>
        <div className="space-y-2">
          {[
            { name: "Ahmed Khan", collected: "PKR 125K", target: 78, color: "bg-green-500" },
            { name: "Bilal Hussain", collected: "PKR 85K", target: 62, color: "bg-blue-500" },
            { name: "Usman Ali", collected: "PKR 35K", target: 28, color: "bg-orange-500" },
            { name: "Farhan Sheikh", collected: "PKR 0", target: 0, color: "bg-red-500" },
          ].map((agent) => (
            <div key={agent.name} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-700 font-medium">{agent.name}</span>
                <span className="text-gray-500">{agent.collected} · {agent.target}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${agent.color} rounded-full`} style={{ width: `${agent.target}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Reports Mockup ─── */
export function ReportsMockup() {
  return (
    <div className="p-3 bg-gray-50 space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Reports Generated", value: "1,284", color: "text-blue-600" },
          { label: "Data Points", value: "48K+", color: "text-purple-600" },
          { label: "Export Formats", value: "Excel · CSV", color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-2 border border-gray-100 text-center">
            <p className="text-[9px] text-gray-500">{s.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      {/* Mini Charts */}
      <div className="grid grid-cols-2 gap-2">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-100 p-2.5">
          <p className="text-[10px] font-semibold text-gray-700 mb-2">Monthly Sales</p>
          <div className="flex items-end gap-1 h-16">
            {[45, 62, 55, 70, 48, 80, 65, 72, 58, 85, 90, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-400 rounded-t hover:bg-blue-500 transition-colors"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-gray-400">Jan</span>
            <span className="text-[8px] text-gray-400">Dec</span>
          </div>
        </div>
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg border border-gray-100 p-2.5">
          <p className="text-[10px] font-semibold text-gray-700 mb-2">Revenue by Category</p>
          <div className="space-y-1.5">
            {[
              { name: "Rice & Grains", pct: 35, color: "bg-blue-400" },
              { name: "Cooking Oil", pct: 28, color: "bg-green-400" },
              { name: "Sugar", pct: 20, color: "bg-purple-400" },
              { name: "Other", pct: 17, color: "bg-orange-400" },
            ].map((cat) => (
              <div key={cat.name} className="space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-gray-600">{cat.name}</span>
                  <span className="text-gray-500">{cat.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Admin Mockup ─── */
export function AdminMockup() {
  return (
    <div className="p-3 bg-gray-50 space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Active Users", value: "24", color: "text-blue-600", border: "border-l-blue-500" },
          { label: "Roles", value: "5", color: "text-purple-600", border: "border-l-purple-500" },
          { label: "Audit Events", value: "1,847", color: "text-orange-600", border: "border-l-orange-500" },
          { label: "System Uptime", value: "99.9%", color: "text-green-600", border: "border-l-green-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-lg p-2 border border-gray-100 border-l-2 ${kpi.border}`}>
            <p className="text-[9px] text-gray-500">{kpi.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
      {/* Users & Activity Table */}
      <div className="bg-white rounded-lg border border-gray-100 p-2.5">
        <p className="text-[10px] font-semibold text-gray-700 mb-2">User Activity</p>
        <div className="space-y-1.5">
          <div className="flex items-center text-[10px] text-gray-500 border-b border-gray-50 pb-1">
            <span className="flex-1">User</span>
            <span className="w-24">Role</span>
            <span className="w-20">Last Login</span>
            <span className="w-14 text-right">Status</span>
          </div>
          {[
            { user: "Hisham Ahmed", role: "Admin", roleColor: "bg-purple-100 text-purple-700", login: "2 min ago", status: "Active", statusColor: "text-green-600" },
            { user: "Ali Raza", role: "Sales", roleColor: "bg-blue-100 text-blue-700", login: "15 min ago", status: "Active", statusColor: "text-green-600" },
            { user: "Sara Khan", role: "Accountant", roleColor: "bg-orange-100 text-orange-700", login: "1 hr ago", status: "Active", statusColor: "text-green-600" },
            { user: "Ahmed Bilal", role: "Warehouse", roleColor: "bg-green-100 text-green-700", login: "3 hrs ago", status: "Active", statusColor: "text-green-600" },
            { user: "Farhan Ali", role: "Recovery", roleColor: "bg-red-100 text-red-700", login: "Yesterday", status: "Inactive", statusColor: "text-gray-400" },
          ].map((row) => (
            <div key={row.user} className="flex items-center text-[10px]">
              <span className="flex-1 text-gray-700 font-medium">{row.user}</span>
              <span className="w-24">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${row.roleColor}`}>{row.role}</span>
              </span>
              <span className="w-20 text-gray-500">{row.login}</span>
              <span className={`w-14 text-right font-semibold ${row.statusColor}`}>{row.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
