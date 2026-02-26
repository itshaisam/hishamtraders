"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ArrowRight, Play } from "lucide-react";
import {
  SparklesIcon,
  AdminIcon,
  PackageIcon,
  BriefcaseIcon,
  DollarIcon,
  PhoneIcon,
} from "../ui/Icons";

const roles = [
  { label: "Admin", icon: AdminIcon },
  { label: "Warehouse", icon: PackageIcon },
  { label: "Sales", icon: BriefcaseIcon },
  { label: "Accountant", icon: DollarIcon },
  { label: "Recovery", icon: PhoneIcon },
] as const;

/* ------------------------------------------------------------------ */
/*  Mini dashboard views                                               */
/* ------------------------------------------------------------------ */

function AdminDashboard() {
  const kpis = [
    { label: "Revenue", value: "PKR 8.2M", color: "text-blue-600", bg: "bg-blue-50", trend: "+12%" },
    { label: "Stock Value", value: "PKR 24.5M", color: "text-emerald-600", bg: "bg-emerald-50", trend: "+5%" },
    { label: "Outstanding", value: "PKR 6.8M", color: "text-violet-600", bg: "bg-violet-50", trend: "-8%" },
    { label: "Clients", value: "147", color: "text-orange-600", bg: "bg-orange-50", trend: "+3" },
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
    { id: "INV-1041", client: "Al-Noor Trading", amount: "PKR 245,000", status: "Paid", sc: "text-emerald-600 bg-emerald-50" },
    { id: "INV-1042", client: "Star Imports", amount: "PKR 180,500", status: "Pending", sc: "text-amber-600 bg-amber-50" },
    { id: "INV-1043", client: "Qamar & Sons", amount: "PKR 92,000", status: "Overdue", sc: "text-red-600 bg-red-50" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k, i) => (
          <div 
            key={k.label} 
            className="bg-white rounded-lg p-2 border border-gray-100 hover-lift transition-all duration-300"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <div className="flex items-center gap-1">
              <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
              <span className="text-[8px] text-emerald-500 font-medium">{k.trend}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-3 mb-3 hover-lift transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-gray-700">Monthly Revenue</p>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">+24% vs last month</span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {bars.map((b, i) => (
            <div key={b.month} className="flex-1 flex flex-col items-center gap-0.5 group cursor-pointer">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-500"
                style={{ height: `${b.h}%` }}
              />
              <span className="text-[8px] text-gray-400 group-hover:text-gray-600 transition-colors">{b.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2 hover-lift transition-all duration-300">
        <p className="text-[10px] font-medium text-gray-700 mb-1.5">Recent Invoices</p>
        <div className="space-y-1">
          {invoices.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center text-[10px] gap-2 py-0.5 even:bg-gray-50/50 px-1 rounded hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-gray-500 w-14 font-medium">{r.id}</span>
              <span className="text-gray-700 flex-1 truncate">{r.client}</span>
              <span className="text-gray-900 font-semibold w-20 text-right">{r.amount}</span>
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
    { label: "Low Stock", value: "12", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Out of Stock", value: "3", color: "text-red-600", bg: "bg-red-50" },
    { label: "Pending Receipts", value: "7", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Gate Passes", value: "5", color: "text-violet-600", bg: "bg-violet-50" },
  ];
  const warehouses = [
    { name: "Main Karachi", items: "1,245 items", value: "PKR 15.2M", status: "Healthy", sc: "text-emerald-600 bg-emerald-50" },
    { name: "Lahore", items: "892 items", value: "PKR 6.8M", status: "Healthy", sc: "text-emerald-600 bg-emerald-50" },
    { name: "Islamabad", items: "467 items", value: "PKR 2.5M", status: "Low Stock", sc: "text-amber-600 bg-amber-50" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k, i) => (
          <div 
            key={k.label} 
            className="bg-white rounded-lg p-2 border border-gray-100 hover-lift transition-all duration-300"
          >
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2 hover-lift transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-medium text-gray-700">Warehouse Overview</p>
          <span className="text-[8px] text-gray-400">Real-time</span>
        </div>
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
              <tr key={w.name} className="even:bg-gray-50/50 hover:bg-gray-50 transition-colors">
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
    { label: "Today", value: "PKR 485K", color: "text-emerald-600" },
    { label: "Monthly", value: "PKR 12.4M", color: "text-blue-600" },
    { label: "Target", value: "82%", color: "text-violet-600" },
    { label: "Clients", value: "147", color: "text-orange-600" },
  ];
  const clients = [
    { name: "Al-Noor Trading", amount: "PKR 2.4M", pct: 85, color: "bg-blue-500" },
    { name: "Star Imports", amount: "PKR 1.8M", pct: 65, color: "bg-emerald-500" },
    { name: "Qamar & Sons", amount: "PKR 1.2M", pct: 45, color: "bg-violet-500" },
    { name: "Karachi Distributors", amount: "PKR 980K", pct: 35, color: "bg-orange-500" },
    { name: "United Traders", amount: "PKR 720K", pct: 25, color: "bg-teal-500" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k, i) => (
          <div 
            key={k.label} 
            className="bg-white rounded-lg p-2 border border-gray-100 hover-lift transition-all duration-300"
          >
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2 hover-lift transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-gray-700">Top Clients</p>
          <span className="text-[8px] text-emerald-600 font-medium">YTD Revenue</span>
        </div>
        <div className="space-y-2">
          {clients.map((c, i) => (
            <div key={c.name} className="flex items-center gap-2 group cursor-pointer">
              <span className="text-[10px] text-gray-700 w-28 truncate group-hover:text-blue-600 transition-colors">{c.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${c.color} transition-all duration-500`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 w-16 text-right group-hover:text-gray-700 transition-colors">{c.amount}</span>
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
    { label: "Revenue", value: "PKR 8.2M", color: "text-emerald-600" },
    { label: "Expenses", value: "PKR 5.1M", color: "text-violet-600" },
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
        {kpis.map((k, i) => (
          <div 
            key={k.label} 
            className="bg-white rounded-lg p-2 border border-gray-100 hover-lift transition-all duration-300"
          >
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2 hover-lift transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-medium text-gray-700">Trial Balance</p>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">Balanced</span>
        </div>
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
              <tr key={r.account} className="even:bg-gray-50/50 hover:bg-gray-50 transition-colors">
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
    { label: "Collected", value: "PKR 245K", color: "text-emerald-600" },
    { label: "Visits", value: "18", color: "text-violet-600" },
    { label: "Overdue", value: "23", color: "text-red-600" },
  ];
  const agents = [
    { name: "Ahmed Khan", collected: "PKR 85K", pct: 78, color: "bg-emerald-500" },
    { name: "Bilal Saeed", collected: "PKR 62K", pct: 55, color: "bg-blue-500" },
    { name: "Farhan Ali", collected: "PKR 48K", pct: 42, color: "bg-violet-500" },
    { name: "Usman Raza", collected: "PKR 50K", pct: 35, color: "bg-orange-500" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {kpis.map((k, i) => (
          <div 
            key={k.label} 
            className="bg-white rounded-lg p-2 border border-gray-100 hover-lift transition-all duration-300"
          >
            <p className="text-[10px] text-gray-500 truncate">{k.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-2 hover-lift transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-gray-700">Collection by Agent</p>
          <span className="text-[8px] text-emerald-600 font-medium">Today</span>
        </div>
        <div className="space-y-2">
          {agents.map((a) => (
            <div key={a.name}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-700 font-medium">{a.name}</span>
                <span className="text-[10px] text-gray-500">
                  {a.collected} ({a.pct}%)
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${a.color} transition-all duration-500`}
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
  const [isLoaded, setIsLoaded] = useState(false);
  const hoverRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start animation on mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Start / restart the auto-cycle timer
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!hoverRef.current) {
        setActiveTab((prev) => (prev + 1) % roles.length);
      }
    }, 5000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTimer]);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    startTimer(); // reset timer on manual click
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 pt-12 pb-16 lg:pt-20 lg:pb-24">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-blue-100/40 to-violet-100/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-100/30 to-blue-100/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
      </div>

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ---- Text Content ---- */}
          <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Badge className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Trusted by 50+ import businesses
            </Badge>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
              The Complete ERP for{" "}
              <span className="text-gradient">Import & Distribution</span>
            </h1>

            <p className="mt-6 text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
              Manage inventory, procurement, sales, accounting, and collections
              — all in one platform built for importers and distributors.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button 
                href="/signup" 
                size="lg" 
                className="group animate-pulse-glow hover:scale-105 transition-transform duration-300"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button 
                href="/contact" 
                variant="outline" 
                size="lg"
                className="group hover:bg-gray-50 transition-all duration-300"
              >
                <Play className="mr-2 h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-110" />
                Watch Demo
              </Button>
            </div>

            <p className="mt-4 text-sm text-gray-500 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                14-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </span>
            </p>
          </div>

          {/* ---- Dashboard Mockup ---- */}
          <div className={`relative transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Role Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {roles.map((role, i) => {
                const Icon = role.icon;
                const isActive = i === activeTab;
                return (
                  <button
                    key={role.label}
                    onClick={() => handleTabClick(i)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-primary-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                        : "bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-md border border-gray-200/50"
                    }`}
                  >
                    <Icon className={`h-3 w-3 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                    {role.label}
                  </button>
                );
              })}
            </div>

            {/* Browser Chrome */}
            <div
              className="relative rounded-2xl border border-gray-200/50 shadow-2xl shadow-blue-900/10 overflow-hidden bg-gray-100/80 backdrop-blur-sm"
              onMouseEnter={() => {
                hoverRef.current = true;
              }}
              onMouseLeave={() => {
                hoverRef.current = false;
              }}
            >
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors cursor-pointer" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-500 flex items-center justify-center gap-2">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    app.tradeflowerp.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="relative bg-gradient-to-br from-gray-50 to-white p-3" style={{ minHeight: 320 }}>
                {dashboards.map((Dashboard, i) => (
                  <div
                    key={i}
                    className={`transition-all duration-500 ${
                      i === activeTab
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-4 absolute inset-0 p-3 pointer-events-none"
                    }`}
                  >
                    <Dashboard />
                  </div>
                ))}
              </div>

              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-6 -right-6 w-72 h-72 bg-gradient-to-br from-blue-100 to-violet-100 rounded-full blur-3xl opacity-60 animate-float" />
            <div className="absolute -z-10 -bottom-8 -left-8 w-56 h-56 bg-gradient-to-tr from-emerald-100 to-blue-100 rounded-full blur-3xl opacity-50 animate-float" style={{ animationDelay: '-2s' }} />
            
            {/* Floating stats cards */}
            <div className="absolute -right-4 top-1/4 bg-white rounded-xl shadow-xl shadow-blue-900/10 p-3 border border-gray-100 animate-float hidden lg:block" style={{ animationDelay: '-1s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Efficiency</p>
                  <p className="text-sm font-bold text-emerald-600">+40%</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 bottom-1/4 bg-white rounded-xl shadow-xl shadow-blue-900/10 p-3 border border-gray-100 animate-float hidden lg:block" style={{ animationDelay: '-3s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Uptime</p>
                  <p className="text-sm font-bold text-blue-600">99.9%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
