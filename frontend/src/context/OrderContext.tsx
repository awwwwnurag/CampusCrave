import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  isVeg?: boolean;
}

export interface Order {
  id: string;              // e.g. "CC-8429"
  token: string;           // e.g. "TK-42"
  outletId: string;        // e.g. "dice-n-sip"
  outletName: string;      // e.g. "Dice n Sip"
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  deliveryFee: number;
  taxes: number;
  platformFee: number;
  tip: number;
  total: number;
  orderType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  status: 'Received' | 'Preparing' | 'Ready for Pickup' | 'Completed' | 'Cancelled';
  createdAt: string;       // ISO string
  estimatedReadyTime: string; // e.g. "12-15 mins"
}

interface OrderContextType {
  orders: Order[];
  placeOrder: (orderData: {
    outletId?: string;
    outletName?: string;
    items: OrderItem[];
    subtotal: number;
    discount?: number;
    couponCode?: string | null;
    deliveryFee?: number;
    taxes?: number;
    platformFee?: number;
    tip?: number;
    total: number;
    orderType?: 'pickup' | 'delivery';
    deliveryAddress?: string;
  }) => Order;
  cancelOrder: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Initial mock orders so users see a rich history right away
const INITIAL_ORDERS: Order[] = [
  {
    id: "CC-3194",
    token: "TK-28",
    outletId: "dice-n-sip",
    outletName: "Dice n Sip",
    items: [
      {
        id: "Kadhaai Paneer",
        name: "Kadhaai Paneer",
        price: 180,
        quantity: 1,
        image: "https://cdn.zeptonow.com/production///tr:w-600,ar-100-100,pr-true,f-auto,q-80/web/recipes/kadai-paneer.png",
        isVeg: true,
      },
      {
        id: "Chilly Potato",
        name: "Chilly Potato",
        price: 120,
        quantity: 1,
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1mVAju22bnIsBceoWZ8FeoWcLq0d_mVnTCA&s",
        isVeg: true,
      }
    ],
    subtotal: 300,
    discount: 50,
    couponCode: "CAMPUS50",
    deliveryFee: 0,
    taxes: 15,
    platformFee: 5,
    tip: 20,
    total: 290,
    orderType: "pickup",
    deliveryAddress: "Canteen Counter (Token Pickup)",
    status: "Ready for Pickup",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    estimatedReadyTime: "Ready at Counter",
  },
  {
    id: "CC-2108",
    token: "TK-14",
    outletId: "georgia",
    outletName: "Georgia",
    items: [
      {
        id: "Cold Coffee",
        name: "Cold Coffee",
        price: 90,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=150",
        isVeg: true,
      }
    ],
    subtotal: 180,
    discount: 0,
    couponCode: null,
    deliveryFee: 25,
    taxes: 9,
    platformFee: 5,
    tip: 0,
    total: 219,
    orderType: "delivery",
    deliveryAddress: "Hostel Block 3, Room 402",
    status: "Completed",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    estimatedReadyTime: "Delivered",
  }
];

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('campus_crave_orders');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load orders from localStorage', e);
    }
    return INITIAL_ORDERS;
  });

  const syncWithBackend = useCallback(async () => {
    try {
      const serverOrders = await api.getOrders();
      if (serverOrders && serverOrders.length > 0) {
        setOrders(prev => {
          const serverMap = new Map<string, Order>();
          serverOrders.forEach((so: any) => {
            serverMap.set(so.id, {
              id: so.id,
              token: so.token,
              outletId: so.outletId,
              outletName: so.outletName,
              items: (so.items || []).map((i: any) => ({
                id: i.id || i.name,
                name: i.name,
                price: i.price,
                quantity: i.quantity || 1,
                image: i.image || '',
                isVeg: i.isVeg !== undefined ? i.isVeg : (i.is_veg !== undefined ? i.is_veg : true),
              })),
              subtotal: so.subtotal,
              discount: so.discount,
              couponCode: so.couponCode,
              deliveryFee: so.deliveryFee,
              taxes: so.taxes,
              platformFee: so.platformFee,
              tip: so.tip,
              total: so.total,
              orderType: so.orderType,
              deliveryAddress: so.deliveryAddress,
              status: so.status,
              createdAt: so.createdAt,
              estimatedReadyTime: so.estimatedReadyTime,
            });
          });

          // Retain any locally added orders not yet in server map
          const merged: Order[] = [...serverMap.values()];
          prev.forEach(po => {
            if (!serverMap.has(po.id)) {
              merged.push(po);
            }
          });

          return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
      }
    } catch (e) {
      console.warn('Backend orders sync offline fallback:', e);
    }
  }, []);

  // Poll backend for order status changes every 4 seconds
  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(syncWithBackend, 4000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  useEffect(() => {
    try {
      localStorage.setItem('campus_crave_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  const placeOrder = (orderData: {
    outletId?: string;
    outletName?: string;
    items: OrderItem[];
    subtotal: number;
    discount?: number;
    couponCode?: string | null;
    deliveryFee?: number;
    taxes?: number;
    platformFee?: number;
    tip?: number;
    total: number;
    orderType?: 'pickup' | 'delivery';
    deliveryAddress?: string;
  }): Order => {
    // Generate order ID (CC-XXXX)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `CC-${randomNum}`;

    // Generate Token Number (TK-XX)
    const tokenNum = Math.floor(10 + Math.random() * 90);
    const token = `TK-${tokenNum}`;

    const newOrder: Order = {
      id: orderId,
      token,
      outletId: orderData.outletId || "campus-crave",
      outletName: orderData.outletName || "Campus Dining",
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount || 0,
      couponCode: orderData.couponCode || null,
      deliveryFee: orderData.deliveryFee ?? 0,
      taxes: orderData.taxes || 0,
      platformFee: orderData.platformFee || 5,
      tip: orderData.tip || 0,
      total: orderData.total,
      orderType: orderData.orderType || "pickup",
      deliveryAddress: orderData.deliveryAddress || (orderData.orderType === 'delivery' ? 'Hostel Delivery' : 'Canteen Counter (Token Pickup)'),
      status: "Preparing",
      createdAt: new Date().toISOString(),
      estimatedReadyTime: orderData.orderType === 'pickup' ? "~10-15 mins" : "~20-25 mins",
    };

    setOrders(prev => [newOrder, ...prev]);

    // Persist to SQLite backend via FastAPI
    api.placeOrder({
      id: newOrder.id,
      token: newOrder.token,
      outletId: newOrder.outletId,
      outletName: newOrder.outletName,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      discount: newOrder.discount,
      couponCode: newOrder.couponCode,
      deliveryFee: newOrder.deliveryFee,
      taxes: newOrder.taxes,
      platformFee: newOrder.platformFee,
      tip: newOrder.tip,
      total: newOrder.total,
      orderType: newOrder.orderType,
      deliveryAddress: newOrder.deliveryAddress,
    }).catch(err => {
      console.warn('Backend order placement offline fallback:', err);
    });

    return newOrder;
  };

  const cancelOrder = (id: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: "Cancelled" } : o))
    );
    api.updateOrderStatus(id, "Cancelled").catch(console.warn);
  };

  const getOrderById = (id: string) => {
    return orders.find(o => o.id === id);
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, cancelOrder, getOrderById, refreshOrders: syncWithBackend }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
