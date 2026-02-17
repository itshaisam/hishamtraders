"use client";

import { useState, useEffect, useRef } from "react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  ArrowRight,
  Play,
  UserCog,
  Package,
  Briefcase,
  DollarSign,
  Phone,
} from "lucide-react";

const roles = [
  { label: "Admin", icon: UserCog },
  { label: "Warehouse", icon: Package },
  { label: "Sales", icon: Briefcase },
  { label: "Accountant", icon: DollarSign },
  { label: "Recovery", icon: Phone },
] as const;

/* ------------------------------------------------------------------ */
/*  Mini dashboard views                                               */
/* ------------------------------------------------------------------ */

function AdminDashboard() {
  const kpis = [
    { label: "Revenue", value: "PKR 8.2M", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Stock Value", value: "PKR 24.5M", color: "text-green-600", bg: "bg-green-50" },
    { label: "Outstanding", value: "PKR 6.8M", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Clients", value: "147", color: "text-orange-600", bg: "bg-orange-50" },
  ];
  const bars = [
    { month: "May", h: 70 },
    { month: "Jun", h: 85 },
    { month: "Jul", h: 75 },
    { month: "Aug", h: 90 },
    { month: "Sep", h: 80 },
    { month: "Oct", h: 100 },
  ];
  const invoices = [
    { id: "INV-1041", client: "Al-Noor Trading", amount: "PKR 245,000", status: "Paid", sc: "text-green-600 bg-green-50" },
    { id: "INV-1042", client: "Star Imports", amount: "PKR 180,500", status: "Pending", sc: "text-yellow-700 bg-yellow-50" },
    { id: "INV-1043", client: "Qamar & Sons", amount: "PKR 92,000", status: "Overdue", sc: "text-red-600 bg-red-50" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-lg p-2 border border-gray-100">
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-3 mb-3">
        <p className="text-[10px] font-medium text-gray-700 mb-2">Monthly Revenue</p>
        <div className="flex items-end gap-1 h-16">
          {bars.map((b) => (
            <div key={b.month} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${b.h}%` }}
              />
              <span className="text-[8px] text-gray-400">{b.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2">
        <p className="text-[10px] font-medium text-gray-700 mb-1.5">Recent Invoices</p>
        <div className="space-y-1">
          {invoices.map((r) => (
            <div
              key={r.id}
              className="flex items-center text-[10px] gap-2 py-0.5 even:bg-gray-50 px-1 rounded"
            >
              <span className="text-gray-500 w-14">{r.id}</span>
              <span className="text-gray-700 flex-1 truncate">{r.client}</span>
              <span className="text-gray-900 font-medium w-20 text-right">{r.amount}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${r.sc}`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WarehouseDashboard() {
  const kpis = [
    { label: "Low Stock", value: "12", color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Out of Stock", value: "3", color: "text-red-600", bg: "bg-red-50" },
    { label: "Pending Receipts", value: "7", color: "text-green-600", bg: "bg-green-50" },
    { label: "Gate Passes", value: "5", color: "text-purple-600", bg: "bg-purple-50" },
  ];
  const warehouses = [
    { name: "Main Karachi", items: "1,245 items", value: "PKR 15.2M", status: "Healthy", sc: "text-green-600 bg-green-50" },
    { name: "Lahore", items: "892 items", value: "PKR 6.8M", status: "Healthy", sc: "text-green-600 bg-green-50" },
    { name: "Islamabad", items: "467 items", value: "PKR 2.5M", status: "Low Stock", sc: "text-orange-600 bg-orange-50" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-lg p-2 border border-gray-100">
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2">
        <p className="text-[10px] font-medium text-gray-700 mb-1.5">Warehouse Overview</p>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left font-medium py-1 pr-2">Warehouse</th>
              <th className="text-left font-medium py-1 pr-2">Items</th>
              <th className="text-right font-medium py-1 pr-2">Value</th>
              <th className="text-right font-medium py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w.name} className="even:bg-gray-50">
                <td className="py-1 pr-2 text-gray-700 font-medium">{w.name}</td>
                <td className="py-1 pr-2 text-gray-500">{w.items}</td>
                <td className="py-1 pr-2 text-right text-gray-900 font-medium">{w.value}</td>
                <td className="py-1 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${w.sc}`}>
                    {w.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SalesDashboard() {
  const kpis = [
    { label: "Today", value: "PKR 485K", color: "text-green-600" },
    { label: "Monthly", value: "PKR 12.4M", color: "text-blue-600" },
    { label: "Target", value: "82%", color: "text-purple-600" },
    { label: "Clients", value: "147", color: "text-orange-600" },
  ];
  const clients = [
    { name: "Al-Noor Trading", amount: "PKR 2.4M", pct: 85, color: "bg-blue-500" },
    { name: "Star Imports", amount: "PKR 1.8M", pct: 65, color: "bg-green-500" },
    { name: "Qamar & Sons", amount: "PKR 1.2M", pct: 45, color: "bg-purple-500" },
    { name: "Karachi Distributors", amount: "PKR 980K", pct: 35, color: "bg-orange-500" },
    { name: "United Traders", amount: "PKR 720K", pct: 25, color: "bg-teal-500" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-lg p-2 border border-gray-100">
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2">
        <p className="text-[10px] font-medium text-gray-700 mb-2">Top Clients</p>
        <div className="space-y-2">
          {clients.map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-700 w-28 truncate">{c.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${c.color}`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 w-16 text-right">{c.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AccountantDashboard() {
  const kpis = [
    { label: "A/R", value: "PKR 6.8M", color: "text-blue-600" },
    { label: "A/P", value: "PKR 3.2M", color: "text-red-600" },
    { label: "Revenue", value: "PKR 8.2M", color: "text-green-600" },
    { label: "Expenses", value: "PKR 5.1M", color: "text-purple-600" },
  ];
  const rows = [
    { account: "Cash & Bank", debit: "4,250,000", credit: "—" },
    { account: "Accounts Receivable", debit: "6,800,000", credit: "—" },
    { account: "Inventory", debit: "24,500,000", credit: "—" },
    { account: "Accounts Payable", debit: "—", credit: "3,200,000" },
    { account: "Sales Revenue", debit: "—", credit: "8,200,000" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-lg p-2 border border-gray-100">
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2">
        <p className="text-[10px] font-medium text-gray-700 mb-1.5">Trial Balance</p>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left font-medium py-1 pr-2">Account</th>
              <th className="text-right font-medium py-1 pr-2">Debit (PKR)</th>
              <th className="text-right font-medium py-1">Credit (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account} className="even:bg-gray-50">
                <td className="py-1 pr-2 text-gray-700">{r.account}</td>
                <td className="py-1 pr-2 text-right text-gray-900 font-medium">{r.debit}</td>
                <td className="py-1 text-right text-gray-900 font-medium">{r.credit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RecoveryDashboard() {
  const kpis = [
    { label: "Outstanding", value: "PKR 6.8M", color: "text-blue-600" },
    { label: "Collected", value: "PKR 245K", color: "text-green-600" },
    { label: "Visits", value: "18", color: "text-purple-600" },
    { label: "Overdue", value: "23", color: "text-red-600" },
  ];
  const agents = [
    { name: "Ahmed Khan", collected: "PKR 85K", pct: 78, color: "bg-green-500" },
    { name: "Bilal Saeed", collected: "PKR 62K", pct: 55, color: "bg-blue-500" },
    { name: "Farhan Ali", collected: "PKR 48K", pct: 42, color: "bg-purple-500" },
    { name: "Usman Raza", collected: "PKR 50K", pct: 35, color: "bg-orange-500" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-lg p-2 border border-gray-100">
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2">
        <p className="text-[10px] font-medium text-gray-700 mb-2">Collection by Agent</p>
        <div className="space-y-2">
          {agents.map((a) => (
            <div key={a.name}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-700">{a.name}</span>
                <span className="text-[10px] text-gray-500">
                  {a.collected} ({a.pct}%)
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${a.color}`}
                  style={{ width: `${a.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const dashboards = [
  AdminDashboard,
  WarehouseDashboard,
  SalesDashboard,
  AccountantDashboard,
  RecoveryDashboard,
];

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

export function Hero() {
  const [activeTab, setActiveTab] = useState(0);
  const hoverRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start / restart the auto-cycle timer
  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!hoverRef.current) {
        setActiveTab((prev) => (prev + 1) % roles.length);
      }
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    startTimer(); // reset timer on manual click
  };

  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-16 lg:pt-20 lg:pb-24">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ---- Text Content ---- */}
          <div>
            <Badge>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Trusted by 50+ import businesses
            </Badge>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
              The Complete ERP for{" "}
              <span className="text-primary-600">Import &amp; Distribution</span>
            </h1>

            <p className="mt-6 text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
              Manage inventory, procurement, sales, accounting, and collections
              — all in one platform built for importers and distributors.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button href="/signup" size="lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button href="/contact" variant="outline" size="lg">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Watch Demo
              </Button>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              No credit card required &middot; 14-day free trial &middot; Cancel
              anytime
            </p>
          </div>

          {/* ---- Dashboard Mockup ---- */}
          <div className="relative">
            {/* Role Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {roles.map((role, i) => {
                const Icon = role.icon;
                const isActive = i === activeTab;
                return (
                  <button
                    key={role.label}
                    onClick={() => handleTabClick(i)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {role.label}
                  </button>
                );
              })}
            </div>

            {/* Browser Chrome */}
            <div
              className="relative rounded-xl border border-gray-200 shadow-2xl overflow-hidden bg-gray-100"
              onMouseEnter={() => {
                hoverRef.current = true;
              }}
              onMouseLeave={() => {
                hoverRef.current = false;
              }}
            >
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400">
                    app.tradeflowerp.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="relative bg-gray-50 p-3" style={{ minHeight: 280 }}>
                {dashboards.map((Dashboard, i) => (
                  <div
                    key={i}
                    className={`transition-opacity duration-300 ${
                      i === activeTab
                        ? "opacity-100"
                        : "opacity-0 absolute inset-0 p-3 pointer-events-none"
                    }`}
                  >
                    <Dashboard />
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative blurs */}
            <div className="absolute -z-10 -top-6 -right-6 w-72 h-72 bg-primary-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute -z-10 -bottom-8 -left-8 w-56 h-56 bg-purple/10 rounded-full blur-3xl" />
          </div>
        </div>
      </Container>
    </section>
  );
}
