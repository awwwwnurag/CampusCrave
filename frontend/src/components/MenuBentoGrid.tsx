"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart, Flame, Check } from "lucide-react";
import { motion, useMotionValue, useTransform, type Variants } from "framer-motion";
import { useCart } from "../context/CartContext";
import { VegBadge, isItemVeg } from "./VegBadge";

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(" ");

interface MenuItemType {
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  isVeg?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  menu: MenuItemType[];
}

interface MenuBentoGridProps {
  restaurant: Restaurant;
  dietFilter?: 'all' | 'veg' | 'nonveg';
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const BentoCard = ({ 
  item, 
  className,
  isLarge = false,
  isSpecialInfo = false,
  outletId,
  outletName
}: { 
  item?: MenuItemType; 
  className?: string;
  isLarge?: boolean;
  isSpecialInfo?: boolean;
  outletId?: string;
  outletName?: string;
}) => {
  const { addToCart, getItemQuantity } = useCart();
  const qty = item ? getItemQuantity(item.name, outletId) : 0;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [2, -2]);
  const rotateY = useTransform(x, [-100, 100], [-2, 2]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 100);
    y.set(yPct * 100);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  if (isSpecialInfo) {
    return (
      <motion.div
        className={cn("h-full", className)}
        variants={fadeInUp}
        onMouseMove={handleMouseMove}
        onHoverEnd={handleMouseLeave}
        whileHover={{ y: -3 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <div className="group relative flex h-full flex-col justify-center items-center gap-2 rounded-xl border border-neutral-200/60 bg-gradient-to-b from-green-50/80 to-teal-50/50 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-[4px] transition-all duration-500 ease-out hover:border-green-300/50 hover:shadow-md dark:border-neutral-800/60 dark:from-neutral-900/60 dark:to-neutral-900/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-green-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 text-center flex flex-col items-center" style={{ transform: "translateZ(20px)" }}>
            <Flame className="w-7 h-7 text-orange-500 mb-1.5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 rounded-full mb-1">
              Fast Track Kitchen
            </span>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base md:text-lg tracking-tight mb-1">
              Skip The Long Canteen Queue
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs max-w-[210px] mb-2.5 leading-relaxed">
              Real-time crowd AI monitored. Grab your token and pick up hot meals!
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-white/80 dark:bg-neutral-800/80 px-2.5 py-1 rounded-md border border-teal-100 dark:border-neutral-700 shadow-2xs">
              ⚡ ~10 Mins Average Wait Time
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!item) return null;

  const itemIsVeg = isItemVeg(item.name, item.description, item.isVeg);

  return (
    <motion.div
      className={cn("h-full", className)}
      onMouseMove={handleMouseMove}
      onHoverEnd={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      variants={fadeInUp}
      whileHover={{ y: -5 }}
    >
      <div
        className={cn(
          "group relative flex h-full flex-col gap-4 rounded-xl border border-neutral-200/60 bg-gradient-to-b from-neutral-50/60 via-neutral-50/40 to-neutral-50/30 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-[4px] transition-all duration-500 ease-out overflow-hidden hover:border-neutral-300/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-neutral-800/60 dark:from-neutral-900/60 dark:via-neutral-900/40 dark:to-neutral-900/30 dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] dark:hover:border-neutral-700/50 dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]",
          isLarge ? "p-0" : "p-5"
        )}
      >
        {isLarge ? (
          <>
            <div className="absolute inset-0 z-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>
            <div
              className="relative z-10 flex h-full flex-col justify-end p-4 sm:p-5"
              style={{ transform: "translateZ(20px)" }}
            >
               <div className="flex justify-between items-end gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <VegBadge isVeg={itemIsVeg} size="xs" />
                      <span className="bg-emerald-600/95 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center">
                        ₹{item.price}
                      </span>
                      <span className="bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {item.rating}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-xl sm:text-2xl tracking-tight mb-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-gray-200 text-xs max-w-sm line-clamp-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({ id: item.name, name: item.name, price: item.price, image: item.image, outletId, outletName });
                    }}
                    className="bg-white text-black p-2.5 rounded-full hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center shrink-0 mb-1"
                    title="Add to Cart"
                  >
                    {qty > 0 ? <Check className="w-4 h-4 text-emerald-600" /> : <ShoppingCart className="w-4 h-4" />}
                  </button>
               </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="relative z-10 flex h-full flex-col gap-2 p-3.5"
              style={{ transform: "translateZ(20px)" }}
            >
              <div className="relative h-28 w-full rounded-lg overflow-hidden mb-1">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-1.5 right-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-xs">
                   <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                      <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">{item.rating}</span>
                   </div>
                </div>
                <div className="absolute top-1.5 left-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm p-0.5 rounded shadow-xs">
                  <VegBadge isVeg={itemIsVeg} size="xs" />
                </div>
              </div>

              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-neutral-900 text-sm leading-tight transition-colors duration-300 group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400 truncate">
                  {item.name}
                </h3>
                <span className="font-bold text-xs text-blue-600 dark:text-blue-400 shrink-0">
                  ₹{item.price}
                </span>
              </div>

              <p className="text-neutral-500 text-[11px] line-clamp-1 dark:text-neutral-400 flex-1">
                {item.description}
              </p>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart({ id: item.name, name: item.name, price: item.price, image: item.image, outletId, outletName });
                }}
                className={`flex items-center justify-center gap-1.5 w-full mt-1 py-1.5 rounded-lg transition-all text-xs font-bold ${
                  qty > 0 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-neutral-100 hover:bg-blue-600 hover:text-white dark:bg-neutral-800 dark:hover:bg-blue-600 text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {qty > 0 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Added ({qty})</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default function MenuBentoGrid({ restaurant, dietFilter = 'all' }: MenuBentoGridProps) {
  let menuItems = restaurant.menu || [];

  if (dietFilter === 'veg') {
    menuItems = menuItems.filter(item => isItemVeg(item.name, item.description, item.isVeg));
  } else if (dietFilter === 'nonveg') {
    menuItems = menuItems.filter(item => !isItemVeg(item.name, item.description, item.isVeg));
  }

  if (menuItems.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No {dietFilter === 'veg' ? 'vegetarian' : 'non-vegetarian'} dishes found in this section.
      </div>
    );
  }
  
  return (
    <motion.div
      className="grid gap-4 mt-4"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Top Row: Large Featured Item + Special Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[260px] md:h-[280px]">
        <div className="md:col-span-2 h-full">
          <BentoCard item={menuItems[0]} isLarge={true} outletId={restaurant.id} outletName={restaurant.name} />
        </div>
        <div className="h-full">
          <BentoCard isSpecialInfo={true} />
        </div>
      </div>

      {/* Bottom Row: Additional items */}
      {menuItems.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.slice(1, 3).map((item) => (
            <BentoCard key={item.name} item={item} outletId={restaurant.id} outletName={restaurant.name} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
