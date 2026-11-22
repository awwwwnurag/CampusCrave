import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Info, 
  Ticket, 
  Lock, 
  ShieldCheck, 
  MapPin, 
  ChevronDown, 
  ChevronRight,
  ShoppingCart, 
  Utensils, 
  ShoppingBag,
  CheckCircle, 
  Tag, 
  Clock, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  X, 
  Banknote, 
  QrCode, 
  Check, 
  Loader2,
  FileText,
  MessageSquare,
  HelpCircle,
  Store,
  UserCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import UserNavProfile from '../components/UserNavProfile';
import { VegBadge, isItemVeg } from '../components/VegBadge';
import { api } from '../lib/api';
import { initiateRazorpayPayment } from '../lib/razorpay';
import { getOutletMeta } from '../lib/outletMapping';
import { motion, AnimatePresence } from 'framer-motion';

interface Coupon {
  code: string;
  discount: number;
  type: 'flat' | 'percentage' | 'delivery';
  minOrder: number;
  description: string;
}

const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'CAMPUS50',
    discount: 50,
    type: 'flat',
    minOrder: 100,
    description: 'Flat ₹50 off on campus orders above ₹100',
  },
  {
    code: 'FIRSTBITE',
    discount: 30,
    type: 'flat',
    minOrder: 80,
    description: 'Flat ₹30 off on your order above ₹80',
  },
  {
    code: 'FREESHIP',
    discount: 25,
    type: 'delivery',
    minOrder: 50,
    description: 'Free delivery to your hostel or desk',
  },
];

// Swiggy-Style Add-ons for "Complete Your Meal"
const MEAL_ADDONS = {
  Popular: [
    { id: 'addon-roti', name: 'Rumali Roti', price: 45, isVeg: true, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-gulab', name: 'Gulab Jamun [2 Pcs]', price: 60, isVeg: true, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-onion', name: 'Extra Onion Salad', price: 15, isVeg: true, image: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-gravy', name: 'Special Masala Gravy', price: 75, isVeg: true, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-phirni', name: 'Matka Phirni', price: 99, isVeg: true, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=240' },
  ],
  Beverages: [
    { id: 'addon-chaas', name: 'Masala Chaas [200 ml]', price: 35, isVeg: true, image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-coffee', name: 'Cold Coffee Frappe', price: 65, isVeg: true, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-coke', name: 'Coke Can [330 ml]', price: 40, isVeg: true, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-lassi', name: 'Sweet Mango Lassi', price: 50, isVeg: true, image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?auto=format&fit=crop&q=80&w=240' },
  ],
  Sides: [
    { id: 'addon-raita', name: 'Mint Boondi Raita [200 ml]', price: 45, isVeg: true, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-fries', name: 'Crispy French Fries', price: 70, isVeg: true, image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-cheese', name: 'Extra Melted Cheese', price: 30, isVeg: true, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=240' },
    { id: 'addon-peri', name: 'Peri Peri Dip', price: 25, isVeg: true, image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&q=80&w=240' },
  ]
};

const Cart: React.FC = () => {
  const { 
    cart, 
    outletCarts, 
    selectedOutletId, 
    setSelectedOutletId, 
    activeOutletCart, 
    removeFromCart, 
    addToCart, 
    clearCart, 
    clearOutletCart,
    totalItems, 
    totalPrice 
  } = useCart();
  const { placeOrder } = useOrders();
  const { user, openLoginModal } = useAuth();
  const navigate = useNavigate();

  const [tip, setTip] = useState(0);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'eco'>('standard');
  const [hostelBlock, setHostelBlock] = useState('Hostel Block 1 (Boys)');
  const [roomNumber, setRoomNumber] = useState('Room 204');
  
  // Cooking requests & Cutlery state (Swiggy Style)
  const [cookingRequest, setCookingRequest] = useState('');
  const [isCookingModalOpen, setIsCookingModalOpen] = useState(false);
  const [needCutlery, setNeedCutlery] = useState(false);
  const [showCutleryTooltip, setShowCutleryTooltip] = useState(true);

  // Complete Your Meal tabs
  const [activeMealCategory, setActiveMealCategory] = useState<'Popular' | 'Beverages' | 'Sides'>('Popular');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(AVAILABLE_COUPONS[0]); // default CAMPUS50 applied for instant delight
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Success Modal State
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  // Payment Gateway State (Razorpay, UPI, Pay at Counter)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'UPI' | 'CASH_ON_PICKUP'>('RAZORPAY');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [activeUpiApp, setActiveUpiApp] = useState('Google Pay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Price calculations based on the currently selected outlet cart
  const activeSubtotal = activeOutletCart.totalPrice;
  const activeItemsCount = activeOutletCart.totalItems;
  const deliveryFee = orderType === 'delivery' ? (appliedCoupon?.type === 'delivery' ? 0 : 25) : 0;
  const taxes = Number((activeSubtotal * 0.05).toFixed(2));
  const platformFee = 5;

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (activeSubtotal < appliedCoupon.minOrder) return 0;

    if (appliedCoupon.type === 'flat') {
      return Math.min(appliedCoupon.discount, activeSubtotal);
    }
    if (appliedCoupon.type === 'delivery') {
      return orderType === 'delivery' ? 25 : 0;
    }
    return 0;
  }, [appliedCoupon, activeSubtotal, orderType]);

  const finalTotal = Math.max(0, activeSubtotal + deliveryFee + taxes + platformFee + tip - couponDiscount);

  // Other outlet carts with items
  const otherOutletCarts = useMemo(() => {
    return outletCarts.filter(oc => oc.outletId !== activeOutletCart.outletId);
  }, [outletCarts, activeOutletCart.outletId]);

  const handleApplyCoupon = (coupon: Coupon) => {
    if (activeSubtotal < coupon.minOrder) {
      setCouponError(`Minimum order amount of ₹${coupon.minOrder} required for ${coupon.code}`);
      return;
    }
    setAppliedCoupon(coupon);
    setCouponError(null);
    setIsCouponModalOpen(false);
    setCouponInput('');
  };

  const handleManualCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();
    try {
      const res = await api.validateCoupon(cleanCode, activeSubtotal, orderType);
      if (res.valid) {
        const matched = AVAILABLE_COUPONS.find(c => c.code === cleanCode);
        setAppliedCoupon({
          code: cleanCode,
          discount: res.discount,
          type: matched ? matched.type : (cleanCode === 'FREESHIP' ? 'delivery' : 'flat'),
          minOrder: matched ? matched.minOrder : 50,
          description: res.message,
        });
        setCouponError(null);
        setIsCouponModalOpen(false);
        setCouponInput('');
        return;
      } else {
        setCouponError(res.message);
        return;
      }
    } catch {
      const matched = AVAILABLE_COUPONS.find(c => c.code === cleanCode);
      if (!matched) {
        setCouponError('Invalid coupon code. Try CAMPUS50 or FIRSTBITE');
        return;
      }
      handleApplyCoupon(matched);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleProceedToPayment = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (activeOutletCart.items.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleConfirmAndPay = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (activeOutletCart.items.length === 0) return;
    setIsProcessingPayment(true);

    try {
      // 1. Razorpay Official Gateway Checkout
      if (paymentMethod === 'RAZORPAY') {
        await initiateRazorpayPayment({
          amount: finalTotal,
          studentName: user?.name || 'Campus Student',
          studentEmail: user?.email || 'student@campus.edu',
          studentPhone: customerPhone,
          outletName: activeOutletCart.outletName,
          onSuccess: (rzpRes) => {
            const deliveryAddress = orderType === 'delivery'
              ? `${hostelBlock}, ${roomNumber}`
              : `${activeOutletCart.outletName} Counter (Token Pickup)`;

            const orderResult = placeOrder({
              outletId: activeOutletCart.outletId,
              outletName: activeOutletCart.outletName,
              items: activeOutletCart.items.map(i => ({
                id: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                image: i.image,
                isVeg: isItemVeg(i.name, '', (i as any).isVeg),
              })),
              subtotal: activeSubtotal,
              discount: couponDiscount,
              couponCode: appliedCoupon ? appliedCoupon.code : null,
              deliveryFee,
              taxes,
              platformFee,
              tip,
              total: finalTotal,
              orderType,
              deliveryAddress,
            });

            setIsPaymentModalOpen(false);
            setCreatedOrder({
              ...orderResult,
              outletId: activeOutletCart.outletId,
              outletName: activeOutletCart.outletName,
              customerPhone,
              paymentMethod: 'RAZORPAY',
              paymentId: rzpRes.razorpay_payment_id,
              cookingRequest,
              needCutlery,
            });
            clearOutletCart(activeOutletCart.outletId);
            setIsProcessingPayment(false);
          },
          onDismiss: () => {
            setIsProcessingPayment(false);
          },
          onError: (err) => {
            console.error('Razorpay Error:', err);
            setIsProcessingPayment(false);
          }
        });
        return;
      }

      // 2. Alternative payment channels (UPI QR, Student Wallet, Card, Counter)
      const paySession = await api.createPaymentOrder(finalTotal, undefined, paymentMethod);

      await api.verifyPayment(
        paySession.transaction_id || `TXN_${Date.now()}`,
        `pay_live_${Math.floor(100000 + Math.random() * 900000)}`,
        undefined,
        paymentMethod
      );

      const deliveryAddress = orderType === 'delivery'
        ? `${hostelBlock}, ${roomNumber}`
        : `${activeOutletCart.outletName} Counter (Token Pickup)`;

      const orderResult = placeOrder({
        outletId: activeOutletCart.outletId,
        outletName: activeOutletCart.outletName,
        items: activeOutletCart.items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          isVeg: isItemVeg(i.name, '', (i as any).isVeg),
        })),
        subtotal: activeSubtotal,
        discount: couponDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        deliveryFee,
        taxes,
        platformFee,
        tip,
        total: finalTotal,
        orderType,
        deliveryAddress,
      });

      setIsPaymentModalOpen(false);
      setCreatedOrder({
        ...orderResult,
        outletId: activeOutletCart.outletId,
        outletName: activeOutletCart.outletName,
        customerPhone,
        paymentMethod,
        cookingRequest,
        needCutlery,
      });
      clearOutletCart(activeOutletCart.outletId);
    } catch (err) {
      console.error('Payment checkout error:', err);
    } finally {
      if (paymentMethod !== 'RAZORPAY') {
        setIsProcessingPayment(false);
      }
    }
  };

  const handlePlaceOrder = () => {
    handleProceedToPayment();
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#121212] transition-colors duration-500 pb-28 font-sans">
      
      {/* Top Header matching Swiggy Delivery Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1A1A1C]/90 backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Prominent Back to Home Button on Top Left Corner */}
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-100 text-xs font-bold transition-all border border-gray-200/80 dark:border-neutral-700 shadow-2xs group shrink-0"
              title="Back to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Home</span>
            </Link>

            {/* Canteen Location Lockup */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200 dark:border-neutral-800">
              <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-sm shrink-0 hidden sm:flex">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {activeOutletCart.outletName}
                  </span>
                  {outletCarts.length > 1 && (
                    <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                      Cart {outletCarts.findIndex(o => o.outletId === activeOutletCart.outletId) + 1} of {outletCarts.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                  📍 {orderType === 'pickup' ? `${activeOutletCart.outletName} Pickup Counter` : `${hostelBlock}, ${roomNumber}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <UserNavProfile />
          </div>
        </div>

        {/* Swiggy-Style Green Savings Banner */}
        {user && cart.length > 0 && (
          <div className="bg-[#E5F7ED] dark:bg-[#0D2818] border-t border-b border-[#C2EED4] dark:border-[#1B4D2E] px-4 py-2">
            <div className="max-w-[1440px] mx-auto px-2 sm:px-6 flex items-center gap-2 text-xs font-bold text-[#0A7E3E] dark:text-[#4ADE80]">
              <span>🎉</span>
              <span>₹{couponDiscount > 0 ? couponDiscount.toFixed(0) : '50'} saved! With Campus Crave Student Benefits</span>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 pb-12 space-y-4">
        
        {!user ? (
          <div className="text-center py-16 px-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm max-w-lg mx-auto my-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              Authentication Required
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              Sign In to View Your Cart
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
              For campus security and order tracking, your cart and pickup tokens are linked to your student account. Please sign in or create an account to view items and pay.
            </p>
            <div className="space-y-3 max-w-xs mx-auto">
              <button
                type="button"
                onClick={openLoginModal}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCircle className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
              <Link
                to="/"
                className="block text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors pt-1"
              >
                &larr; Back to Campus Cafes
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm p-8">
            <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your meal bag is empty</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-6 text-xs">
              Explore your campus outlets, pick delicious dishes, and grab a quick token!
            </p>
            <Link to="/">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md text-xs">
                Browse Campus Outlets
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Multi-Outlet Cart Switcher */}
            {outletCarts.length > 1 && (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                      🏬
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Separate Outlet Carts</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                          {outletCarts.length} Outlets
                        </span>
                      </h2>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Select which outlet you want to order and generate a pickup token for now:
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid of Outlets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {outletCarts.map((oc) => {
                    const meta = getOutletMeta(oc.outletId);
                    const isSelected = oc.outletId === activeOutletCart.outletId;
                    return (
                      <button
                        key={oc.outletId}
                        type="button"
                        onClick={() => setSelectedOutletId(oc.outletId)}
                        className={`p-3.5 rounded-2xl text-left transition-all border relative flex items-start gap-3 group ${
                          isSelected
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-gray-50/70 dark:bg-neutral-800/60 border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="text-2xl shrink-0 p-1.5 bg-white dark:bg-neutral-800 rounded-xl shadow-2xs border border-gray-100 dark:border-neutral-700">
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-xs font-black truncate ${
                              isSelected ? 'text-emerald-950 dark:text-emerald-300' : 'text-gray-900 dark:text-white'
                            }`}>
                              {oc.outletName}
                            </span>
                            {isSelected ? (
                              <span className="text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                                Active ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                                Switch →
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                            <span>{oc.totalItems} {oc.totalItems === 1 ? 'item' : 'items'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">₹{oc.totalPrice}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. Cart Items Container (Swiggy Style) */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 border border-gray-200 dark:border-neutral-800 shadow-xs space-y-4">
              
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Order Items ({activeItemsCount})
                  </span>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                    {activeOutletCart.outletName}
                  </span>
                </div>
                <button
                  onClick={() => clearOutletCart(activeOutletCart.outletId)}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
                  title={`Clear items from ${activeOutletCart.outletName}`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear {outletCarts.length > 1 ? activeOutletCart.outletName : 'Cart'}
                </button>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-neutral-800/80">
                {activeOutletCart.items.map((item) => {
                  const itemIsVeg = isItemVeg(item.name, '', (item as any).isVeg);
                  return (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1">
                        <div className="pt-0.5">
                          <VegBadge isVeg={itemIsVeg} size="sm" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                            {item.name}
                          </h3>
                          <span className="text-xs text-gray-500 font-semibold block mt-0.5">
                            ₹{item.price}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Swiggy Style Stepper */}
                        <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900 shadow-2xs">
                          <button
                            onClick={() => removeFromCart(item.id, activeOutletCart.outletId)}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addToCart({ ...item, outletId: activeOutletCart.outletId, outletName: activeOutletCart.outletName })}
                            className="w-7 h-7 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-sm font-black text-gray-900 dark:text-white w-14 text-right">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Chips Row (Swiggy Style: + Add Items, Cooking Requests, Cutlery) */}
              <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex flex-wrap items-center gap-2 relative">
                
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/60 hover:bg-gray-100 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add Items</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsCookingModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors text-xs font-bold ${
                    cookingRequest
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>{cookingRequest ? `Note: ${cookingRequest.slice(0, 16)}...` : 'Cooking requests'}</span>
                </button>

                {/* Cutlery Checkbox with Swiggy Tooltip */}
                <div className="relative inline-flex items-center">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/60 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={needCutlery}
                      onChange={(e) => {
                        setNeedCutlery(e.target.checked);
                        setShowCutleryTooltip(false);
                      }}
                      className="w-3.5 h-3.5 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                    />
                    <span>Cutlery Needed</span>
                  </label>

                  {/* Swiggy Cutlery Tooltip */}
                  {showCutleryTooltip && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 bg-black/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1.5 animate-bounce">
                      <span>Tap here if you need cutlery</span>
                      <button onClick={() => setShowCutleryTooltip(false)} className="opacity-70 hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {cookingRequest && (
                <div className="text-[11px] bg-blue-50/80 dark:bg-blue-950/30 p-2 rounded-xl text-blue-800 dark:text-blue-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    📝 <strong>Kitchen Note:</strong> {cookingRequest}
                  </span>
                  <button onClick={() => setCookingRequest('')} className="text-rose-500 font-bold hover:underline">Clear</button>
                </div>
              )}

            </div>

            {/* 2. COMPLETE YOUR MEAL (Swiggy Cross-Sell Carousel) */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                Complete Your Meal
              </span>

              {/* Category Pills */}
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
                {(['Popular', 'Beverages', 'Sides'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveMealCategory(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeMealCategory === tab
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Horizontal Scroll of Add-ons */}
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide">
                {MEAL_ADDONS[activeMealCategory].map((addon) => (
                  <div
                    key={addon.id}
                    className="flex-shrink-0 w-24 sm:w-28 flex flex-col group cursor-pointer"
                    onClick={() => addToCart({ 
                      id: addon.id, 
                      name: addon.name, 
                      price: addon.price, 
                      image: addon.image,
                      outletId: activeOutletCart.outletId,
                      outletName: activeOutletCart.outletName
                    })}
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden relative mb-2 bg-gray-100 dark:bg-neutral-800 shadow-2xs">
                      <img 
                        src={addon.image} 
                        alt={addon.name} 
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=240';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      
                      {/* Plus button positioned top-right of image (Swiggy Style) */}
                      <button
                        type="button"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 dark:bg-neutral-900/95 text-emerald-600 shadow-md flex items-center justify-center font-bold text-sm hover:scale-110 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1 mb-0.5">
                      <VegBadge isVeg={addon.isVeg} size="xs" />
                      <span className="text-[11px] font-bold text-gray-900 dark:text-white truncate">
                        {addon.name}
                      </span>
                    </div>
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      ₹{addon.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SAVINGS CORNER (Swiggy Style Coupon Card) */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 border border-gray-200 dark:border-neutral-800 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                Savings Corner
              </span>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#E5F7ED] dark:bg-[#0D2818] border border-[#C2EED4] dark:border-[#1B4D2E]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      %
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                        {appliedCoupon.code} Applied!
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        ₹{couponDiscount.toFixed(2)} discount applied on order
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline px-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-dashed border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Apply Coupon</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Other Outlets Reminder Banner */}
            {otherOutletCarts.length > 0 && (
              <div className="p-4 rounded-3xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 shadow-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">🛍️</span>
                  <div>
                    <h4 className="text-xs font-black text-blue-950 dark:text-blue-200">
                      You also have items in {otherOutletCarts.length} other outlet {otherOutletCarts.length === 1 ? 'cart' : 'carts'}
                    </h4>
                    <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                      Each campus outlet has an independent counter and token queue. Your other outlet carts remain safe when you order from {activeOutletCart.outletName}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {otherOutletCarts.map(other => (
                    <button
                      key={other.outletId}
                      type="button"
                      onClick={() => setSelectedOutletId(other.outletId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800/60 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 transition-colors shadow-2xs"
                    >
                      <span>{getOutletMeta(other.outletId).icon}</span>
                      <span>Switch to {other.outletName} ({other.totalItems} items • ₹{other.totalPrice})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Delivery Type & Tip (Swiggy Tabs) */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 border border-gray-200 dark:border-neutral-800 shadow-xs space-y-4">
              
              <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl">
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    orderType === 'pickup'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                      : 'text-gray-500'
                  }`}
                >
                  Delivery Type
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    orderType === 'delivery'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                      : 'text-gray-500'
                  }`}
                >
                  Tip & Hostels
                </button>
              </div>

              {orderType === 'pickup' ? (
                <div className="space-y-2.5">
                  {/* Standard Delivery Mode */}
                  <div 
                    onClick={() => setDeliverySpeed('standard')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      deliverySpeed === 'standard'
                        ? 'border-orange-500/40 bg-orange-50/40 dark:bg-orange-950/20 ring-1 ring-orange-500/20'
                        : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        deliverySpeed === 'standard' ? 'border-orange-600' : 'border-gray-300 dark:border-neutral-600'
                      }`}>
                        {deliverySpeed === 'standard' && (
                          <div className="w-2 h-2 rounded-full bg-orange-600" />
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-black block ${
                          deliverySpeed === 'standard' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          Standard
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Minimal order grouping
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                      50–60 mins
                    </span>
                  </div>

                  {/* Eco Saver Delivery Mode */}
                  <div 
                    onClick={() => setDeliverySpeed('eco')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      deliverySpeed === 'eco'
                        ? 'border-orange-500/40 bg-orange-50/40 dark:bg-orange-950/20 ring-1 ring-orange-500/20'
                        : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        deliverySpeed === 'eco' ? 'border-orange-600' : 'border-gray-300 dark:border-neutral-600'
                      }`}>
                        {deliverySpeed === 'eco' && (
                          <div className="w-2 h-2 rounded-full bg-orange-600" />
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${
                          deliverySpeed === 'eco' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          Eco Saver
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Lesser CO2 by order grouping
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      55–65 mins
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Hostel Block</label>
                      <select
                        value={hostelBlock}
                        onChange={(e) => setHostelBlock(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none"
                      >
                        <option>Hostel Block 1 (Boys)</option>
                        <option>Hostel Block 2 (Girls)</option>
                        <option>Hostel Block 3 (PG)</option>
                        <option>Central Library Desk</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Room / Floor</label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="e.g. Room 204"
                        className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Student Delivery Partner Tip</span>
                    <div className="flex items-center gap-2">
                      {[10, 20, 30, 50].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTip(tip === t ? 0 : t)}
                          className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            tip === t
                              ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40'
                              : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          ₹{t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* 5. Detailed Bill Breakdown (Swiggy Style) */}
            <div id="bill-summary" className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3 text-xs">
              
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    ₹
                  </div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    To Pay <span className="line-through text-gray-400">₹{(finalTotal + couponDiscount).toFixed(0)}</span> ₹{finalTotal.toFixed(0)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                    ₹{couponDiscount.toFixed(0)} saved on the total!
                  </span>
                )}
              </div>

              <div className="space-y-2.5 pt-1 text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Item Total ({activeOutletCart.outletName})</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{activeSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="font-black text-[10px] bg-gray-200 dark:bg-neutral-800 px-1 rounded">one</span>
                    <span>Delivery Fee | Canteen Campus</span>
                  </span>
                  <span className="font-bold text-emerald-600">
                    {orderType === 'pickup' ? (
                      <>
                        <span className="line-through text-gray-400 mr-1.5">₹25</span>
                        FREE
                      </>
                    ) : deliveryFee === 0 ? (
                      <>
                        <span className="line-through text-gray-400 mr-1.5">₹25</span>
                        FREE
                      </>
                    ) : (
                      `₹${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                {tip > 0 && (
                  <div className="flex items-center justify-between text-blue-600">
                    <span>Delivery Tip</span>
                    <span className="font-bold">₹{tip.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>GST & Canteen Mess Charges</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{taxes.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Platform Fee</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{platformFee.toFixed(2)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-xl">
                    <span>Coupon Savings ({appliedCoupon?.code})</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between text-sm font-black text-gray-900 dark:text-white">
                <span>To Pay</span>
                <span className="text-base">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* 6. Swiggy Cancellation Policy Note */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-neutral-900/60 border border-gray-200/60 dark:border-neutral-800 text-[11px] text-gray-500 leading-relaxed space-y-1">
              <span className="font-bold text-gray-700 dark:text-gray-300 block">Cancellation policy:</span>
              <p>Please double-check your order and token pickup counter ({activeOutletCart.outletName}). The kitchen starts preparation upon payment. Orders are non-refundable once placed.</p>
            </div>

          </>
        )}

      </main>

      {/* 7. Swiggy Sticky Bottom Checkout Bar (Fixed on Mobile & Desktop) */}
      {user && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1A1A1C]/95 backdrop-blur-xl border-t border-gray-200 dark:border-neutral-800 p-3.5 sm:p-4 shadow-2xl">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">₹{finalTotal.toFixed(0)}</span>
                {couponDiscount > 0 && (
                  <span className="text-xs text-gray-400 line-through">₹{(finalTotal + couponDiscount).toFixed(0)}</span>
                )}
                <span className="text-[11px] font-bold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md hidden sm:inline">
                  {activeOutletCart.outletName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById('bill-summary')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View Detailed Bill <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              className="bg-[#0A7E3E] hover:bg-[#086a34] active:scale-98 text-white font-bold py-3.5 px-6 sm:px-10 rounded-2xl shadow-lg shadow-emerald-700/20 transition-all text-sm sm:text-base flex items-center gap-2"
            >
              <span>Pay & Order from {activeOutletCart.outletName}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cooking Requests Modal */}
      {isCookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsCookingModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span>Cooking Requests</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">Chef will follow instructions during food prep</p>

            {/* Quick Chips matching Swiggy Style tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['Less spicy', 'Extra sauce', 'No onion', 'Extra crispy', 'Pack dips separately'].map((chip) => {
                const isSelected = cookingRequest.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        const cleaned = cookingRequest
                          .split(', ')
                          .filter((c) => c !== chip)
                          .join(', ');
                        setCookingRequest(cleaned);
                      } else {
                        setCookingRequest(cookingRequest ? `${cookingRequest}, ${chip}` : chip);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{chip}</span>
                  </button>
                );
              })}
            </div>

            <textarea
              value={cookingRequest}
              onChange={(e) => setCookingRequest(e.target.value)}
              placeholder="e.g. Please make it mildly spiced and keep gravy separate..."
              rows={3}
              className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-3 text-xs font-semibold text-gray-900 dark:text-white outline-none mb-4"
            />

            <button
              onClick={() => setIsCookingModalOpen(false)}
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Done & Save Note
            </button>
          </div>
        </div>
      )}

      {/* Coupon Modal Drawer */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsCouponModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Apply Campus Coupon</h3>
            <p className="text-xs text-gray-400 mb-5">Save more with verified student discount codes</p>

            <form onSubmit={handleManualCouponSubmit} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="ENTER COUPON CODE"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all"
              >
                Apply
              </button>
            </form>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {AVAILABLE_COUPONS.map((coupon) => (
                <div
                  key={coupon.code}
                  className="p-3.5 rounded-2xl border border-gray-200 dark:border-neutral-800 hover:border-blue-400 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                        {coupon.code}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {coupon.discount}% Off / Flat
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">{coupon.description}</p>
                  </div>
                  <button
                    onClick={() => handleApplyCoupon(coupon)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    APPLY
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal (Supports Razorpay Official, UPI, Wallet, Card, Counter) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[115] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Campus Crave Payment</h3>
                <p className="text-xs text-gray-400">Select payment channel & confirm order</p>
              </div>
            </div>

            {/* Total Banner */}
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-lg shadow-emerald-600/20">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">
                  Payable Total • {activeOutletCart.outletName}
                </span>
                <span className="text-3xl font-black">₹{finalTotal.toFixed(2)}</span>
              </div>
              <span className="text-3xl">{getOutletMeta(activeOutletCart.outletId).icon}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Choose Payment Option</span>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Razorpay Gateway Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`col-span-2 p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    paymentMethod === 'RAZORPAY'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/30'
                      : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0c2340] flex items-center justify-center p-2 shadow-sm flex-shrink-0">
                      <svg className="w-full h-full text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900 dark:text-white">Razorpay Gateway</span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                        All UPI Apps (GPay/PhonePe), Cards, Net Banking & Wallets
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    <span>Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'UPI'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">Fast ⚡</span>
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white block">UPI Instant QR</span>
                  <span className="text-[10px] text-gray-400">GPay, PhonePe, QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH_ON_PICKUP')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'CASH_ON_PICKUP'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">Counter</span>
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white block">Pay at Counter</span>
                  <span className="text-[10px] text-gray-400">Cash/Card on pickup</span>
                </button>
              </div>
            </div>

            {/* Dynamic Method Details View */}
            {paymentMethod === 'RAZORPAY' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/40 mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Razorpay Standard Checkout</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                  Clicking <strong>Pay ₹{finalTotal.toFixed(2)}</strong> opens the Razorpay popup modal. Supports all UPI apps, bank cards, net banking, and wallets.
                </p>
                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-blue-200/50 dark:border-blue-900/40 text-[9px] text-gray-500">
                  <span className="font-bold">Accepts:</span>
                  <span className="bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border">GPay</span>
                  <span className="bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border">PhonePe</span>
                  <span className="bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border">Paytm</span>
                  <span className="bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border">Visa/RuPay</span>
                </div>
              </div>
            )}

            {paymentMethod === 'UPI' && (
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800 mb-4 text-center">
                <span className="text-[11px] font-bold text-gray-500 block mb-1.5">Scan UPI QR to pay:</span>
                <div className="w-24 h-24 bg-white p-1.5 rounded-xl shadow-xs mx-auto mb-2 flex items-center justify-center border border-gray-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=campuscrave@okhdfcbank&pn=CampusCrave&am=${finalTotal.toFixed(2)}&cu=INR`)}`}
                    alt="UPI QR"
                    className="w-full h-full rounded"
                  />
                </div>
                <div className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  UPI VPA: campuscrave@okhdfcbank
                </div>
              </div>
            )}

            {paymentMethod === 'CASH_ON_PICKUP' && (
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 mb-4 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">💵 Pay at Pickup Counter:</span>
                Food starts cooking immediately. Hand over ₹{finalTotal.toFixed(2)} in cash or swipe at counter.
              </div>
            )}

            {/* Authorize CTA */}
            <button
              onClick={handleConfirmAndPay}
              disabled={isProcessingPayment}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/25 text-sm flex items-center justify-center gap-2 active:scale-98"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Razorpay Gateway...</span>
                </>
              ) : paymentMethod === 'RAZORPAY' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{finalTotal.toFixed(2)} via Razorpay</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay ₹{finalTotal.toFixed(2)}</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}

      {/* Order Placed Success Modal with Generated Token */}
      {createdOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative"
          >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle className="w-10 h-10" />
            </div>

            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
              Payment Confirmed • Token Generated
            </span>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-3 mb-1">
              Order Dispatched to {createdOrder.outletName || activeOutletCart.outletName} Kitchen!
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Show your token at the {createdOrder.outletName || activeOutletCart.outletName} counter when notified.
            </p>

            {/* Canteen Token Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-800 dark:to-neutral-850 border border-blue-200 dark:border-neutral-700 mb-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block mb-1">
                Your Pickup Token • {createdOrder.outletName || activeOutletCart.outletName}
              </span>
              <div className="text-4xl font-black tracking-tight text-blue-900 dark:text-white font-mono">
                {createdOrder.token || '#TK-842'}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mt-2 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Estimated Ready: {createdOrder.estimatedReadyTime || '10-15 mins'}</span>
              </div>
            </div>

            {/* Notification alert info */}
            <div className="text-left text-xs bg-gray-50 dark:bg-neutral-800 p-3.5 rounded-2xl mb-5 space-y-1.5 border border-gray-100 dark:border-neutral-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Pickup Counter:</span>
                <span className="font-bold text-gray-900 dark:text-white">{createdOrder.outletName || activeOutletCart.outletName} Counter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{createdOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment:</span>
                <span className="font-bold text-emerald-600">{createdOrder.paymentMethod} • PAID</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">SMS / WhatsApp Alert:</span>
                <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold">{createdOrder.customerPhone || customerPhone}</span>
              </div>
              {createdOrder.cookingRequest && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Chef Note:</span>
                  <span className="font-semibold text-blue-600">{createdOrder.cookingRequest}</span>
                </div>
              )}
            </div>

            {/* Multi-Outlet Next Cart Prompt */}
            {otherOutletCarts.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 mb-5 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">🛍️</span>
                  <span className="text-xs font-black text-orange-950 dark:text-orange-200">
                    Next: You have items in {otherOutletCarts.length} other outlet {otherOutletCarts.length === 1 ? 'cart' : 'carts'}!
                  </span>
                </div>
                <p className="text-[11px] text-orange-800 dark:text-orange-300 mb-2.5">
                  Would you like to place your order for {otherOutletCarts[0].outletName} now?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const nextId = otherOutletCarts[0].outletId;
                    setSelectedOutletId(nextId);
                    setCreatedOrder(null);
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>Order from {otherOutletCarts[0].outletName} ({otherOutletCarts[0].totalItems} items • ₹{otherOutletCarts[0].totalPrice})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setCreatedOrder(null);
                  navigate('/my-orders');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Track in My Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setCreatedOrder(null);
                  navigate('/');
                }}
                className="w-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl text-xs transition-all"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default Cart;
