import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCircle, 
  ChevronDown, 
  Package, 
  LogOut, 
  UserCog, 
  MapPin, 
  Ticket, 
  HelpCircle,
  TrendingUp,
  ChefHat,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { GoogleLogo } from './GoogleAccountChooserModal';

interface UserNavProfileProps {
  className?: string;
}

export const UserNavProfile: React.FC<UserNavProfileProps> = ({ className = '' }) => {
  const { user, logout, openLoginModal } = useAuth();
  const { orders } = useOrders();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeOrdersCount = orders.filter(
    o => o.status === 'Received' || o.status === 'Preparing' || o.status === 'Ready for Pickup'
  ).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={openLoginModal}
        className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-full shadow-md shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95 ${className}`}
      >
        <UserCircle className="w-4 h-4" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 px-3 py-1.5 rounded-full transition-colors border border-gray-200/60 dark:border-neutral-700"
      >
        <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 max-w-[110px] truncate">
          {user.name || user.email.split('@')[0]}
        </span>
        {activeOrdersCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active order in progress" />
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-2xl py-2 z-[999] animate-in fade-in zoom-in-95 duration-150">
          {/* User Bio Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  🎓 Verified Student
                </span>
                {user.authProvider === 'google' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-bold">
                    <GoogleLogo className="w-2.5 h-2.5" />
                    <span>Google</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 1. My Orders */}
          <Link
            to="/my-orders"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>My Orders</span>
            </div>
            {activeOrdersCount > 0 && (
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeOrdersCount} active
              </span>
            )}
          </Link>

          {/* 2. Edit Profile -> Redirects to /profile */}
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <UserCog className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Edit Profile</span>
          </Link>

          {/* 3. Add Addresses -> Redirects to /addresses */}
          <Link
            to="/addresses"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Add Addresses</span>
          </Link>

          {/* 4. Raise a Ticket -> Redirects to /support */}
          <Link
            to="/support"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Ticket className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Raise a Ticket</span>
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded-full">
              Help
            </span>
          </Link>

          {/* 5. FAQs & Support -> Redirects to /faqs */}
          <Link
            to="/faqs"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>FAQs & Support</span>
          </Link>

          {/* Admin console only if role is admin */}
          {user.role === 'admin' && (
            <>
              <div className="my-1 border-t border-gray-100 dark:border-neutral-800" />
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
              <a
                href="http://localhost:8000/kitchen"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Kitchen Display</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </>
          )}

          <div className="my-1 border-t border-gray-100 dark:border-neutral-800" />

          {/* Sign Out */}
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserNavProfile;
