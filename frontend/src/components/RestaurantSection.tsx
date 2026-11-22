import React from 'react';
import { Link } from 'react-router-dom';
import MenuBentoGrid from './MenuBentoGrid';
import CrowdMonitor from './CrowdMonitor';
import { motion } from 'framer-motion';

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

interface RestaurantSectionProps {
  restaurant: Restaurant;
  dietFilter?: 'all' | 'veg' | 'nonveg';
}

const RestaurantSection: React.FC<RestaurantSectionProps> = ({ restaurant, dietFilter = 'all' }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl shadow-blue-100/20 dark:shadow-none overflow-hidden border border-gray-100 dark:border-neutral-800"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Restaurant Info Side */}
        <div className="lg:w-1/3 relative h-64 lg:h-auto overflow-hidden group">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/40 to-transparent flex flex-col justify-end p-6 lg:p-7">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-3"
            >
              <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight">{restaurant.name}</h3>
              <p className="text-xs text-blue-100/80 font-light leading-relaxed line-clamp-2">{restaurant.description}</p>
              <Link
                to={`/outlet/${restaurant.id}`}
                className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-white text-blue-900 font-bold hover:bg-blue-50 transform hover:-translate-y-0.5 transition-all text-xs shadow-md"
              >
                View Full Menu
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Menu Bento Grid Side */}
        <div className="lg:w-2/3 p-5 lg:p-6 bg-[#FDFCFB] dark:bg-neutral-900/50">
          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-lg font-black text-blue-950 dark:text-white tracking-tight">Featured Items</h4>
              <div className="h-0.5 w-14 bg-blue-500/30 rounded-full" />
            </div>
            
            {/* Live Crowd Monitoring Section */}
            <div className="md:w-56 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Live Crowd Status</span>
              </div>
              <CrowdMonitor restaurantId={restaurant.id} restaurantName={restaurant.name} />
            </div>
          </div>
          <MenuBentoGrid restaurant={restaurant} dietFilter={dietFilter} />
        </div>
      </div>
    </motion.div>
  );
};

export default RestaurantSection;
