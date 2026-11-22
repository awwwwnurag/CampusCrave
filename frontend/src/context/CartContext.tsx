import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getOutletForItem } from '../lib/outletMapping';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  outletId: string;
  outletName: string;
}

export interface OutletCart {
  outletId: string;
  outletName: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

interface CartContextType {
  cart: CartItem[];
  outletCarts: OutletCart[];
  selectedOutletId: string;
  setSelectedOutletId: (outletId: string) => void;
  activeOutletCart: OutletCart;
  addToCart: (item: Omit<CartItem, 'quantity' | 'outletId' | 'outletName'> & { outletId?: string; outletName?: string }) => void;
  removeFromCart: (id: string, outletId?: string) => void;
  updateQuantity: (id: string, quantity: number, outletId?: string) => void;
  getItemQuantity: (id: string, outletId?: string) => number;
  clearCart: () => void;
  clearOutletCart: (outletId: string) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getUserCartStorageKey = (email?: string | null): string | null => {
  if (!email || !email.trim()) return null;
  return `campus_crave_cart_${email.toLowerCase().trim()}`;
};

const loadCartForUser = (email?: string | null): CartItem[] => {
  const key = getUserCartStorageKey(email);
  if (!key) return [];
  try {
    const savedCart = localStorage.getItem(key) || (email === 'alex.sharma@campus.edu' ? localStorage.getItem('cart') : null);
    if (savedCart) {
      const parsed: any[] = JSON.parse(savedCart);
      return parsed.map(item => {
        const { outletId, outletName } = getOutletForItem(item.name, item.outletId, item.outletName);
        return {
          ...item,
          outletId,
          outletName,
        };
      });
    }
  } catch (e) {
    console.error('Failed to parse cart for user', email, e);
  }
  return [];
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, openLoginModal } = useAuth();

  const [cart, setCart] = useState<CartItem[]>(() => {
    return loadCartForUser(user?.email);
  });

  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('selected_outlet_cart_id');
      if (saved) return saved;
    } catch {}
    return 'food-court';
  });

  // Automatically switch cart when user changes (logs in, logs out, or switches accounts)
  useEffect(() => {
    setCart(loadCartForUser(user?.email));
  }, [user?.email]);

  // Persist cart items strictly to the logged-in user's account storage
  useEffect(() => {
    const key = getUserCartStorageKey(user?.email);
    if (key) {
      localStorage.setItem(key, JSON.stringify(cart));
    }
  }, [cart, user?.email]);

  // Group items by outlet (only for authenticated user)
  const outletCarts: OutletCart[] = useMemo(() => {
    if (!user) return [];
    const groups: Record<string, OutletCart> = {};
    cart.forEach(item => {
      const oid = item.outletId || 'food-court';
      const oname = item.outletName || 'Food Court';
      if (!groups[oid]) {
        groups[oid] = {
          outletId: oid,
          outletName: oname,
          items: [],
          totalItems: 0,
          totalPrice: 0,
        };
      }
      groups[oid].items.push(item);
      groups[oid].totalItems += item.quantity;
      groups[oid].totalPrice += item.price * item.quantity;
    });
    return Object.values(groups);
  }, [cart, user]);

  // Auto-switch selected outlet if current selected has 0 items and other outlets exist
  useEffect(() => {
    if (outletCarts.length > 0) {
      const exists = outletCarts.some(oc => oc.outletId === selectedOutletId);
      if (!exists) {
        setSelectedOutletId(outletCarts[0].outletId);
      }
    }
  }, [outletCarts, selectedOutletId]);

  useEffect(() => {
    if (selectedOutletId) {
      try {
        localStorage.setItem('selected_outlet_cart_id', selectedOutletId);
      } catch {}
    }
  }, [selectedOutletId]);

  // Current active outlet cart
  const activeOutletCart: OutletCart = useMemo(() => {
    const found = outletCarts.find(oc => oc.outletId === selectedOutletId);
    if (found) return found;
    if (outletCarts.length > 0) return outletCarts[0];
    return {
      outletId: selectedOutletId || 'food-court',
      outletName: 'Food Court',
      items: [],
      totalItems: 0,
      totalPrice: 0,
    };
  }, [outletCarts, selectedOutletId]);

  const addToCart = (item: Omit<CartItem, 'quantity' | 'outletId' | 'outletName'> & { outletId?: string; outletName?: string }) => {
    // Require authentication before adding to cart
    if (!user) {
      openLoginModal();
      return;
    }

    const { outletId, outletName } = getOutletForItem(item.name, item.outletId, item.outletName);

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(i => i.id === item.id && i.outletId === outletId);
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1,
        };
        return newCart;
      }
      return [...prevCart, { ...item, outletId, outletName, quantity: 1 }];
    });

    // Auto-focus the newly added outlet cart
    setSelectedOutletId(outletId);
  };

  const removeFromCart = (id: string, outletId?: string) => {
    if (!user) return;
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(i => i.id === id && (!outletId || i.outletId === outletId));
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        if (item.quantity > 1) {
          const newCart = [...prevCart];
          newCart[existingIndex] = { ...item, quantity: item.quantity - 1 };
          return newCart;
        } else {
          return prevCart.filter((_, idx) => idx !== existingIndex);
        }
      }
      return prevCart;
    });
  };

  const updateQuantity = (id: string, quantity: number, outletId?: string) => {
    if (!user) return;
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => !(item.id === id && (!outletId || item.outletId === outletId))));
    } else {
      setCart(prevCart => prevCart.map(item => 
        (item.id === id && (!outletId || item.outletId === outletId))
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getItemQuantity = (id: string, outletId?: string) => {
    if (!user) return 0;
    const item = cart.find(i => i.id === id && (!outletId || i.outletId === outletId));
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    if (!user) return;
    setCart([]);
  };

  const clearOutletCart = (outletIdToClear: string) => {
    if (!user) return;
    setCart(prevCart => prevCart.filter(item => item.outletId !== outletIdToClear));
  };

  const totalItems = user ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const totalPrice = user ? cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;

  return (
    <CartContext.Provider value={{ 
      cart: user ? cart : [],
      outletCarts,
      selectedOutletId,
      setSelectedOutletId,
      activeOutletCart,
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      getItemQuantity, 
      clearCart,
      clearOutletCart,
      totalItems, 
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
