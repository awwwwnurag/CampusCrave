import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Utensils, 
  Package, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft,
  RotateCcw,
  ShoppingBag,
  MapPin,
  Tag
} from 'lucide-react';
import { useOrders, Order } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import ThemeToggle from '../components/ThemeToggle';
import UserNavProfile from '../components/UserNavProfile';
import { VegBadge } from '../components/VegBadge';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STEPS = [
  { key: 'Received', label: 'Order Placed', icon: '📋' },
  { key: 'Preparing', label: 'In Kitchen', icon: '🍳' },
  { key: 'Ready for Pickup', label: 'Ready at Counter', icon: '🔔' },
  { key: 'Completed', label: 'Collected', icon: '✅' },
];

const MyOrders: React.FC = () => {
  const { orders } = useOrders();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');

  const filteredOrders = orders.filter(o => {
    if (filterTab === 'active') {
      return o.status === 'Received' || o.status === 'Preparing' || o.status === 'Ready for Pickup';
    }
    if (filterTab === 'completed') {
      return o.status === 'Completed' || o.status === 'Cancelled';
    }
    return true;
  });

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'Received': return 0;
      case 'Preparing': return 1;
      case 'Ready for Pickup': return 2;
      case 'Completed': return 3;
      default: return 0;
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Received':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Preparing':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse';
      case 'Ready for Pickup':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 ring-2 ring-emerald-500/20';
      case 'Completed':
        return 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300 border-gray-200 dark:border-neutral-700';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      addToCart({
        id: item.id || item.name,
        name: item.name,
        price: item.price,
        image: item.image,
      });
    });
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 transition-colors duration-500 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-neutral-800 shadow-xs transition-all">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm text-white group-hover:scale-105 transition-transform">
              <Utensils className="w-4 h-4" />
            </div>
            <h1 className="text-lg lg:text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Campus Crave
            </h1>
          </Link>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Link
              to="/"
              className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 flex items-center gap-1.5 transition-colors hidden sm:flex"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Menu</span>
            </Link>
            <UserNavProfile />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Live Order Tracker</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              My Orders & Tokens
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Show your Pickup Token at the counter to collect fresh meals without waiting in line.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-800/80 p-1 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-xs shrink-0">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'active'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'completed'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Past Orders
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-neutral-800 shadow-xl max-w-md mx-auto">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Orders Found</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              {filterTab === 'active'
                ? 'You have no active orders in progress right now.'
                : "You haven't placed any orders yet. Check out the cafes and grab your favorite food!"}
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Menu</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const stepIdx = getStepIndex(order.status);
                const isActive = order.status !== 'Completed' && order.status !== 'Cancelled';

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white dark:bg-neutral-900 rounded-2xl p-5 border transition-all shadow-sm ${
                      isActive
                        ? 'border-blue-400 dark:border-blue-800 ring-2 ring-blue-500/10'
                        : 'border-gray-200 dark:border-neutral-800'
                    }`}
                  >
                    {/* Top Row: Digital Canteen Token Card (#TK-XX) + Outlet Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
                      
                      <div className="flex items-center gap-4">
                        {/* Digital Canteen Token Card (#TK-XX) */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-3 rounded-2xl flex flex-col items-center justify-center min-w-[84px] shadow-lg shadow-blue-500/25 border border-blue-400/30">
                          <span className="text-[8px] font-black uppercase tracking-widest text-blue-200">TOKEN</span>
                          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight">#{order.token.replace(/^#/, '')}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">{order.outletName}</h3>
                            <span className="text-xs font-mono text-gray-400">({order.id})</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              {order.deliveryAddress || 'Canteen Counter Pickup'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* 4-Phase Visual Order Stepper: Order Placed ➔ In Kitchen ➔ Ready at Counter ➔ Collected */}
                    <div className="my-4 p-4 bg-gray-50/80 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-3 px-1">
                        <span className="uppercase tracking-wider">Live Order Stepper</span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono">
                          {order.status === 'Completed' ? '4/4 Completed' : `Phase ${stepIdx + 1} of 4`}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1 sm:gap-2 relative">
                        {STATUS_STEPS.map((step, idx) => {
                          const isCompleted = idx <= stepIdx;
                          const isCurrent = idx === stepIdx && order.status !== 'Completed';

                          return (
                            <div key={step.key} className="flex flex-col items-center text-center relative group">
                              {/* Visual Arrow Indicator between phases */}
                              {idx < STATUS_STEPS.length - 1 && (
                                <div className="hidden sm:flex absolute top-3.5 left-[62%] w-[76%] items-center justify-center text-gray-300 dark:text-neutral-700 z-0">
                                  <span className={`text-xs font-black transition-colors ${idx < stepIdx ? 'text-emerald-500' : 'text-gray-300 dark:text-neutral-700'}`}>➔</span>
                                </div>
                              )}

                              <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all relative z-10 shadow-sm ${
                                  isCurrent
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50 scale-110 shadow-blue-500/30'
                                    : isCompleted
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'bg-gray-200 dark:bg-neutral-700 text-gray-400'
                                }`}
                              >
                                {isCompleted && !isCurrent ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <span>{step.icon}</span>
                                )}
                              </div>

                              <span
                                className={`text-[10px] sm:text-[11px] font-black mt-2 leading-tight ${
                                  isCurrent
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isCompleted
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-400'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pickup Token Card Callout */}
                      <div className="mt-4 p-2.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                          ⚡ Present Digital Token <strong className="font-black text-blue-900 dark:text-white font-mono">#{order.token.replace(/^#/, '')}</strong> at the counter for pickup.
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[11px] shrink-0 ml-2">
                          {order.estimatedReadyTime || 'Ready in ~12 mins'}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="py-4 space-y-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <VegBadge isVeg={item.isVeg ?? true} size="xs" />
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-600 dark:text-gray-400">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Summary & Re-order */}
                    <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 uppercase text-[10px] font-bold block">Paid Total</span>
                          <span className="text-base font-black text-gray-900 dark:text-white">₹{order.total.toFixed(2)}</span>
                        </div>
                        {order.couponCode && (
                          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                            <Tag className="w-3 h-3" />
                            {order.couponCode} (-₹{order.discount})
                          </div>
                        )}
                      </div>

                      {/* 1-Tap Reorder Button */}
                      <button
                        onClick={() => handleReorder(order)}
                        className="flex items-center gap-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 px-4 py-2 rounded-xl shadow-md shadow-blue-500/25 transition-all group"
                      >
                        <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform" />
                        <span>Reorder</span>
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-6 mt-16 text-center text-xs text-gray-400">
        <p>&copy; 2026 Campus Crave. Real-Time Crowd AI & Express Canteen Pickup.</p>
      </footer>

    </div>
  );
};

export default MyOrders;
