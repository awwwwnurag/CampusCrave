import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const SwiggyFloatingCart: React.FC = () => {
  const { totalItems, totalPrice, outletCarts, activeOutletCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  // Only show when authenticated, there are items, and not already on the Cart or Admin pages
  const isCartPage = location.pathname === '/cart';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isVisible = Boolean(user) && totalItems > 0 && !isCartPage && !isAdminPage;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl"
        >
          <div className="bg-[#60b246] hover:bg-[#539e3d] text-white px-5 py-3 rounded-2xl shadow-2xl shadow-[#60b246]/40 border border-emerald-400/40 backdrop-blur-md transition-all flex items-center justify-between gap-4">
            
            {/* Left: Items Added & Outlets */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide truncate">
                  {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'} • ₹{totalPrice}
                </span>
                {outletCarts.length > 1 && (
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                    {outletCarts.length} OUTLETS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-bold mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 shrink-0" />
                <span className="truncate">
                  {outletCarts.length > 1 
                    ? `Current active: ${activeOutletCart.outletName}` 
                    : '🎉 ₹50 Off Applied (Campus Benefits)'}
                </span>
              </div>
            </div>

            {/* Right: Direct View Cart Action Button */}
            <Link
              to="/cart"
              className="flex items-center gap-2 bg-white text-[#60b246] hover:bg-emerald-50 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 shrink-0 group"
            >
              <span>VIEW CARTS</span>
              <span className="text-sm">🛒</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SwiggyFloatingCart;
