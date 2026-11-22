import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  ShoppingBag, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Smartphone, 
  ArrowLeft,
  Utensils,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import UserNavProfile from '../components/UserNavProfile';
import { VegBadge } from '../components/VegBadge';
import { motion } from 'framer-motion';

const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [analyticsData, logsData] = await Promise.all([
        api.getAdminAnalytics(),
        api.getNotificationLogs(10),
      ]);
      if (analyticsData && analyticsData.success) {
        setAnalytics(analyticsData);
      }
      setNotificationLogs(logsData);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleManualNotification = async (orderId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/notifications/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`SMS & WhatsApp re-dispatched for ${orderId}!`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
        fetchDashboardData();
      }
    } catch {
      setActionSuccessMsg(`Notification sent (mock mode)`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const metrics = analytics?.metrics || {
    total_revenue: 1069.0,
    total_orders: 4,
    active_orders: 3,
    completed_orders: 1,
    cancelled_orders: 0,
    avg_prep_time_minutes: 11.5,
    veg_percentage: 100.0,
  };

  const topItems = analytics?.top_items || [
    { name: 'Butter Naan', quantity: 4, revenue: 160.0, is_veg: true },
    { name: 'Paneer Butter Masala', quantity: 2, revenue: 440.0, is_veg: true },
    { name: 'Georgia Cold Coffee', quantity: 2, revenue: 180.0, is_veg: true },
    { name: 'Kadhaai Paneer', quantity: 1, revenue: 180.0, is_veg: true },
  ];

  const outlets = analytics?.outlet_breakdown || [
    { id: 'dice-n-sip', name: 'Dice n Sip', orders: 3, revenue: 850.0 },
    { id: 'georgia', name: 'Georgia', orders: 1, revenue: 219.0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 transition-colors duration-500 font-sans">
      
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-neutral-800 shadow-xs transition-all">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg shadow-sm text-white">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Vendor & Campus Admin Analytics</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Live Sync
                  </span>
                </h1>
                <p className="text-[11px] text-gray-400">Real-time revenue, prep speeds & automated token alerts</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg border border-gray-200 dark:border-neutral-700 transition-all"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <a
              href="http://localhost:8000/api/admin/orders/export"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            <a
              href="http://localhost:8000/kitchen"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs"
            >
              <span>Kitchen Display</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <ThemeToggle />
            <UserNavProfile />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Gross Revenue</span>
            <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              ₹{metrics.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Live settlement</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Total Orders</span>
            <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {metrics.total_orders}
            </div>
            <span className="text-[10px] text-blue-600 font-bold mt-0.5 block">{metrics.completed_orders} Completed</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Active Queue</span>
            <div className="text-xl font-black text-amber-500 tracking-tight">
              {metrics.active_orders}
            </div>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">In Kitchen / Ready</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Avg Kitchen Speed</span>
            <div className="text-xl font-black text-indigo-500 tracking-tight">
              {metrics.avg_prep_time_minutes}m
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Order to Ready</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Pure Veg Share</span>
            <div className="text-xl font-black text-emerald-500 tracking-tight">
              {metrics.veg_percentage}%
            </div>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">Campus demand</span>
          </div>
        </div>

        {/* 2 Middle Columns: Outlets & Top Dishes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Outlets Performance */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Dining Outlets Performance
              </h2>
              <span className="text-xs text-gray-400 font-semibold">{outlets.length} Outlets</span>
            </div>

            <div className="space-y-3">
              {outlets.map((o: any) => (
                <div key={o.id} className="p-4 rounded-2xl bg-gray-50/60 dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="font-black text-sm text-gray-900 dark:text-white block">{o.name}</span>
                    <span className="text-xs text-gray-400 font-medium">{o.orders} orders processed</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 block">₹{o.revenue.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Dishes */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                🔥 Top Best-Selling Dishes
              </h2>
              <span className="text-xs text-gray-400 font-semibold">Volume ranking</span>
            </div>

            <div className="space-y-2.5">
              {topItems.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/60 dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <VegBadge isVeg={item.is_veg} size="sm" />
                    <div>
                      <span className="font-bold text-sm text-gray-900 dark:text-white block">{item.name}</span>
                      <span className="text-[10px] text-gray-400">Campus Favorite</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 block">{item.quantity} sold</span>
                    <span className="text-[11px] text-gray-400 font-mono">₹{item.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Lower Row: Live SMS/WhatsApp Notification Log Stream */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span>Live SMS & WhatsApp Token Alert Feed</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Automatically triggered when canteen kitchen staff marks order "Ready for Pickup"
              </p>
            </div>
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-3 py-1 rounded-full self-start">
              Auto-Dispatched on Ready
            </span>
          </div>

          <div className="space-y-3">
            {notificationLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs font-bold">
                No notification alerts triggered yet. Mark an order "Ready for Pickup" on the kitchen display to see live dispatch!
              </div>
            ) : (
              notificationLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-gray-50/70 dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-xs">
                        {log.token}
                      </span>
                      <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                        {log.outlet_name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ({log.order_id})
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-mono bg-white dark:bg-neutral-900/60 p-2 rounded-xl border border-gray-200/50 dark:border-neutral-800">
                      📲 <strong>{log.recipient_phone}</strong>: {log.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                      ✓ {log.status}
                    </span>
                    <button
                      onClick={() => handleManualNotification(log.order_id)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                    >
                      Resend
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

    </div>
  );
};

export default AdminDashboard;
