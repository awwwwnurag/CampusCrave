import React, { useState } from 'react';
import { Star, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PairItWith from './PairItWith';
import { recommendationMapping } from '../lib/recommendations';
import { useCart } from '../context/CartContext';
import { VegBadge, isItemVeg } from './VegBadge';

interface MenuItemProps {
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  isVeg?: boolean;
  outletId?: string;
  outletName?: string;
  [key: string]: any;
}

const DEFAULT_VEG_FALLBACK = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400";
const DEFAULT_NONVEG_FALLBACK = "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400";

const MenuItem: React.FC<MenuItemProps> = ({ name, description, price, rating, image, isVeg, outletId, outletName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(image);
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const recommendations = recommendationMapping[name] || [];
  const quantity = getItemQuantity(name, outletId);
  const itemIsVeg = isItemVeg(name, description, isVeg);

  React.useEffect(() => {
    setImgSrc(image);
  }, [image]);

  const handleAdd = () => {
    addToCart({ id: name, name, price, image: imgSrc, outletId, outletName });
    
    // Only show recommendation modal if the item was just added (quantity goes from 0 to 1)
    if (quantity === 0 && recommendations.length > 0) {
      setIsModalOpen(true);
    }
  };

  const handleRemove = () => {
    removeFromCart(name, outletId);
  };

  const handleAddPairing = (pairing: any) => {
    addToCart({ 
      id: pairing.name, 
      name: pairing.name, 
      price: pairing.price, 
      image: pairing.image,
      outletId,
      outletName 
    });
    setIsModalOpen(false);
  };

  return (
    <>
      <motion.div 
        whileHover={{ y: -5 }}
        className="group bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-orange-50/50 dark:border-neutral-700 shadow-xl shadow-orange-100/10 dark:shadow-none transition-all duration-300"
      >
        <div className="relative flex flex-col items-center">
          {/* Circular Image Container */}
          <div className="relative w-32 h-32 lg:w-40 lg:h-40 mb-6 -mt-12 lg:-mt-16">
            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative w-full h-full rounded-full border-4 border-white dark:border-neutral-800 shadow-2xl overflow-hidden">
              <img
                src={imgSrc}
                alt={name}
                onError={() => {
                  setImgSrc(itemIsVeg ? DEFAULT_VEG_FALLBACK : DEFAULT_NONVEG_FALLBACK);
                }}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            {/* Rating Badge */}
            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-neutral-900 px-3 py-1 rounded-full shadow-lg border border-orange-50 dark:border-neutral-700 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-blue-950 dark:text-white">{rating}</span>
            </div>
          </div>

          <div className="text-center w-full space-y-2">
            <div className="flex items-center justify-center gap-1.5">
              <VegBadge isVeg={itemIsVeg} size="sm" />
              <h3 className="text-lg font-black text-blue-950 dark:text-white leading-tight tracking-tight line-clamp-1">{name}</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-light line-clamp-2 h-8">{description}</p>
            
            <div className="flex items-center justify-between pt-4">
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Price</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">₹{price}</span>
              </div>
              
              <div className="relative flex items-center">
                <AnimatePresence mode="wait">
                  {quantity > 0 ? (
                    <motion.div 
                      key="quantity-controls"
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 10 }}
                      className="flex items-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-1 border border-blue-100 dark:border-blue-800"
                    >
                      <button 
                        onClick={handleRemove}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-black text-blue-950 dark:text-white text-sm">
                        {quantity}
                      </span>
                      <button 
                        onClick={handleAdd}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="add-button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={handleAdd}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <PairItWith
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pairings={recommendations}
        onAddPairing={handleAddPairing}
        originalItem={name}
      />
    </>
  );
};

export default MenuItem;
