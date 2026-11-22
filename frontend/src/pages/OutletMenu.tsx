import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Utensils, 
  ArrowLeft, 
  UtensilsCrossed, 
  ShoppingCart, 
  Pizza, 
  User, 
  ChevronDown,
  Star,
  Clock,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CartButton from '../components/CartButton';
import { useCart } from '../context/CartContext';
import ThemeToggle from '../components/ThemeToggle';
import MenuItemComponent from '../components/MenuItem';
import GradientButton from '../components/GradientButton';
import CrowdMonitor from '../components/CrowdMonitor';
import UserNavProfile from '../components/UserNavProfile';
import { isItemVeg } from '../components/VegBadge';

interface MenuItem {
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  category?: string;
}

interface Outlet {
  id: string;
  name: string;
  description: string;
  image: string;
  menu: MenuItem[];
}

// This would typically come from an API or state management
const outlets: Outlet[] = [
  {
    id: "food-court",
    name: "Food Court",
    description: "Your one-stop destination for diverse culinary delights - from South Indian to Pan Asian cuisine",
    image: "/cafes/Food Court- 1.jpg",
    menu: [
      {
        name: "Rasam",
        description: "Traditional South Indian spiced tamarind soup",
        price: 60,
        rating: 4,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Idli Sambar",
        description: "Steamed rice cakes served with lentil soup and chutney",
        price: 80,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Medu Vada",
        description: "Crispy lentil doughnuts served with sambar and chutney",
        price: 80,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Plain Dosa",
        description: "Crispy rice and lentil crepe served with sambar and chutney",
        price: 80,
        rating: 4,
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Masala Dosa",
        description: "Crispy crepe filled with spiced potato mixture",
        price: 100,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Onion Masala Dosa",
        description: "Masala dosa with added layer of sautéed onions",
        price: 120,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Pongal",
        description: "South Indian rice and lentil porridge with pepper and cumin",
        price: 80,
        rating: 4,
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Dal Vada",
        description: "Crispy lentil fritters",
        price: 80,
        rating: 4,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Onion Uttapam",
        description: "Thick rice pancake topped with onions and vegetables",
        price: 100,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Upma",
        description: "Savory semolina porridge with vegetables",
        price: 80,
        rating: 4,
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Lemon Rice",
        description: "Tangy rice preparation with peanuts and curry leaves",
        price: 90,
        rating: 4,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Curd Rice",
        description: "Yogurt rice with tempering and pomegranate",
        price: 100,
        rating: 4,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Sambar Rice",
        description: "Rice mixed with lentil-based vegetable stew",
        price: 90,
        rating: 4,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Tomato Rice",
        description: "Rice cooked with tomatoes and South Indian spices",
        price: 90,
        rating: 4,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Combo Thali",
        description: "Rice or 4 Tawa Roti with Dal/Veg/Kadhi/Choley/Rajma (Any One)",
        price: 150,
        rating: 4,
        image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Standard Thali",
        description: "Yellow Dal, Vegetable, 02 Tawa Roti, Rice, Salad",
        price: 180,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Premium Thali",
        description: "Dal Makhani, Mix Vegetable, 01 Lachha Parantha, Veg Pulao, Salad, Gulab Jamun",
        price: 220,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chef Special Thali (Veg)",
        description: "Dal Makhani, Mix Vegetable, Butter Paneer, Amritsari Stuffed Kulcha, Veg Pulao, Salad, Raita, Papad, Gulab Jamun",
        price: 250,
        rating: 5,
        image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chef Special Thali (Non-Veg)",
        description: "Dal Makhani, Mix Vegetable, Butter Chicken, Amritsari Stuffed Kulcha, Veg Pulao, Salad, Raita, Papad, Gulab Jamun",
        price: 300,
        rating: 5,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Mix Vegetables",
        description: "Assorted vegetables in a rich gravy",
        price: 120,
        rating: 4,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Aloo Gobhi",
        description: "Potato and cauliflower dry curry",
        price: 120,
        rating: 4,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Kadhai Paneer",
        description: "Cottage cheese cooked with bell peppers in spicy gravy",
        price: 200,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Butter Chicken",
        description: "Tender chicken in rich tomato-based gravy (Boneless)",
        price: 320,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chilli Chicken",
        description: "Indo-Chinese style spicy chicken",
        price: 280,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=500"
      }
    ]
  },
  {
    id: "basil",
    name: "Basil",
    description: "Your healthy lifestyle destination with refreshing beverages and nutritious meals",
    image: "/cafes/Basil.jpg",
    menu: [
      // REFRESHERS section
      {
        name: "Mint Lemonade",
        description: "Refreshing lemonade with fresh mint leaves",
        price: 75,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Watermelon Mojito",
        description: "Fresh watermelon juice with mint and lime",
        price: 75,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1587223081156-6100774a382e?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Pineapple Mojito",
        description: "Tropical pineapple juice with mint and lime",
        price: 75,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Watermelon Orange",
        description: "Blend of fresh watermelon and orange juice",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Orange Paradise",
        description: "Premium orange juice blend",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Kiwi Delight",
        description: "Fresh kiwi juice blend",
        price: 125,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=500"
      },
      // SMOOTHIES section
      {
        name: "Mixed Fruit Smoothie",
        description: "Blend of seasonal mixed fruits",
        price: 175,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Mango Smoothie",
        description: "Rich and creamy mango smoothie",
        price: 175,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1570696516188-ade861b84a49?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Mixed Berry Smoothie",
        description: "Blend of assorted berries",
        price: 175,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Blueberry Fruit Punch",
        description: "Refreshing blueberry punch",
        price: 175,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=500"
      },
      // POPPI 99KCAL section
      {
        name: "Poppi Kiwi",
        description: "Low-calorie kiwi refresher",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Poppi Kiwi-Pine",
        description: "Low-calorie kiwi and pineapple blend",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Poppi Tender Coconut",
        description: "Low-calorie coconut refresher",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Poppi Chili Guava",
        description: "Low-calorie spicy guava drink",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&q=80&w=500"
      },
      // DETOX DRINKS section
      {
        name: "Mix Vegetable",
        description: "Healthy mix vegetable juice",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Red Carrot Beetroot",
        description: "Nutritious carrot and beetroot blend",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Vitamin C Detox",
        description: "Vitamin C rich detox drink",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=500"
      },
      // COLD-PRESSED JUICES section
      {
        name: "Watermelon Juice",
        description: "Fresh cold-pressed watermelon juice",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1587223081156-6100774a382e?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Pineapple Juice",
        description: "Fresh cold-pressed pineapple juice",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Orange Juice",
        description: "Fresh cold-pressed orange juice",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Orange-Pineapple Juice",
        description: "Blend of orange and pineapple juice",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Mix Fruit Juice",
        description: "Blend of seasonal fruits",
        price: 125,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=500"
      },
      // SHAKES & COLD COFFEE section
      {
        name: "Cold Coffee (with Honey)",
        description: "Chilled coffee sweetened with honey",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Banana Shake",
        description: "Creamy banana milkshake",
        price: 99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Cold Coffee (with Dates)",
        description: "Chilled coffee sweetened with dates",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Badam Thandai",
        description: "Traditional almond spiced drink",
        price: 125,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Kesar Dry Fruit Shake",
        description: "Rich shake with saffron and dry fruits",
        price: 125,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500"
      },
      // HOT BEVERAGES section
      {
        name: "Adrak Chai",
        description: "Traditional ginger tea",
        price: 49,
        rating: 4,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Masala Chai",
        description: "Spiced Indian tea",
        price: 49,
        rating: 4,
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Elaichi Chai",
        description: "Cardamom flavored tea",
        price: 49,
        rating: 4,
        image: "https://images.unsplash.com/photo-1594631252845-29fc458695d1?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Turmeric Latte",
        description: "Healthy turmeric-infused milk",
        price: 75,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500"
      },
      // FOOD & SALADS section
      {
        name: "Zesty Corn Chaat",
        description: "Spiced corn kernels with herbs",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Millet Veggie Sandwich",
        description: "Healthy sandwich with millet bread",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Custom Fruit Bowl",
        description: "Customizable fresh fruit bowl",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=500"
      },
      // COMBOS section
      {
        name: "Wrap Combo",
        description: "Wrap with beverage of choice",
        price: 199,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Sandwich Combo",
        description: "Sandwich with beverage of choice",
        price: 199,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=500"
      },
      // ICE TEA section
      {
        name: "Lemon Ice Tea",
        description: "Classic lemon iced tea",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Watermelon Ice Tea",
        description: "Refreshing watermelon iced tea",
        price: 75,
        rating: 4,
        image: "https://images.unsplash.com/photo-1587223081156-6100774a382e?auto=format&fit=crop&q=80&w=500"
      },
      // VEGAN BASE OPTIONS section
      {
        name: "Coconut Water",
        description: "Fresh natural coconut water",
        price: 99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Almond Milk",
        description: "Fresh homemade almond milk",
        price: 125,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1568651316650-6a9787ffb007?auto=format&fit=crop&q=80&w=500"
      },
      // ADD-ONS section
      {
        name: "Basil Seeds",
        description: "Healthy basil seed supplement",
        price: 20,
        rating: 4,
        image: "https://images.unsplash.com/photo-1508061252445-564b882c2c11?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Almonds",
        description: "Premium almonds",
        price: 20,
        rating: 4,
        image: "https://images.unsplash.com/photo-1508061252445-564b882c2c11?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Oats",
        description: "Healthy oats supplement",
        price: 20,
        rating: 4,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Peanut",
        description: "Roasted peanuts",
        price: 20,
        rating: 4,
        image: "https://images.unsplash.com/photo-1508061252445-564b882c2c11?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Peanut Butter",
        description: "Natural peanut butter",
        price: 20,
        rating: 4,
        image: "https://images.unsplash.com/photo-1508061252445-564b882c2c11?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Whey Protein (25g Muscle Blaze)",
        description: "Protein supplement",
        price: 99,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=500"
      }
    ]
  },
  {
    id: "happiness-store",
    name: "Happiness Store",
    description: "Your one-stop destination for delicious snacks, sandwiches, and beverages",
    image: "/cafes/Happiness Store.jpg",
    menu: [
      // SAVOURIES section
      {
        name: "Vada Pao",
        description: "Classic Mumbai street food with spiced potato patty in a bun",
        price: 40,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chaap Hot Dog",
        description: "Vegetarian hot dog with soya chaap filling",
        price: 60,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Paneer Hot Dog",
        description: "Hot dog with spiced paneer filling",
        price: 70,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chicken Hot Dog",
        description: "Classic hot dog with chicken sausage",
        price: 80,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Paneer Kulcha",
        description: "Stuffed bread with spiced cottage cheese filling",
        price: 60,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Aloo Pyaza Kulcha",
        description: "Stuffed bread with potato and onion filling",
        price: 50,
        rating: 4,
        image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chicken Kulcha",
        description: "Stuffed bread with spiced chicken filling",
        price: 70,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chicken Nuggets",
        description: "Crispy chicken nuggets served with dips",
        price: 120,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chicken Seekh Kebab",
        description: "Grilled minced chicken kebabs with Indian spices",
        price: 150,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Potato Cheese Shots",
        description: "Crispy potato balls filled with molten cheese",
        price: 80,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=500"
      },
      // SANDWICH & BURGERS section
      {
        name: "Veg Grilled Sandwich",
        description: "Grilled sandwich with mixed vegetables and cheese",
        price: 70,
        rating: 4,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Cheese Sandwich",
        description: "Classic grilled cheese sandwich",
        price: 60,
        rating: 4,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Spinach and Corn Sandwich",
        description: "Healthy sandwich with spinach and sweet corn filling",
        price: 80,
        rating: 4,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Paneer Sandwich in Tandoori Sauce",
        description: "Grilled sandwich with tandoori spiced paneer",
        price: 90,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=500"
      },
      // WRAPS & FRIES section
      {
        name: "Veg Wrap",
        description: "Fresh vegetables wrapped in a tortilla",
        price: 80,
        rating: 4,
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Paneer Wrap",
        description: "Spiced paneer and vegetables in a tortilla",
        price: 90,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Cheese Loaded Fries",
        description: "Crispy fries topped with melted cheese",
        price: 100,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=500"
      },
      // PASTAS section
      {
        name: "Arrabbiata Red Sauce Pasta",
        description: "Spicy tomato sauce pasta with Italian herbs",
        price: 120,
        rating: 4,
        image: "https://images.unsplash.com/photo-1621996346565-e3d5d628169c?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Alfredo White Sauce Pasta",
        description: "Creamy white sauce pasta with mushrooms",
        price: 130,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&q=80&w=500"
      },
      // BEVERAGES section
      {
        name: "Virgin Mojito",
        description: "Refreshing mint and lime mocktail",
        price: 60,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chocolate Fudge Shake",
        description: "Rich chocolate shake with fudge sauce",
        price: 120,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Kit Kat Chopper Shake",
        description: "Milkshake blended with Kit Kat pieces",
        price: 130,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500"
      }
    ]
  },
  {
    id: "ahaar-cafe",
    name: "Ahaar Cafe",
    description: "Authentic North Indian flavors in every bite",
    image: "/cafes/Ahaar Cafe- 1.jpg",
    menu: [
      {
        name: "Dal Makhani",
        description: "Creamy black lentils cooked overnight",
        price: 150,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Butter Naan",
        description: "Soft and buttery Indian bread",
        price: 40,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Mix Veg",
        description: "Assorted vegetables in rich gravy",
        price: 130,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=500"
      }
    ]
  },
  {
    id: "dice-n-sip",
    name: "Dice n Sip",
    description: "Indian cuisine with a modern twist, perfect for board game sessions",
    image: "/cafes/Dice n Sip - 1.jpg",
    menu: [
      {
        name: "Kadhaai Paneer",
        description: "Cottage cheese cubes in rich tomato gravy with aromatic spices",
        price: 180,
        rating: 4,
        image: "https://cdn.zeptonow.com/production///tr:w-600,ar-100-100,pr-true,f-auto,q-80/web/recipes/kadai-paneer.png"
      },
      {
        name: "Chilly Potato",
        description: "Crispy potato slices tossed in spicy sauce with onions and capsicum",
        price: 120,
        rating: 5,
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1mVAju22bnIsBceoWZ8FeoWcLq0d_mVnTCA&s"
      },
      {
        name: "Aloo Tikki Chat",
        description: "Crispy potato patties topped with yogurt, chutneys, and crunchy sev",
        price: 80,
        rating: 4,
        image: "https://www.honeywhatscooking.com/wp-content/uploads/2020/10/Aloo-Tikki-Chaat61.jpg"
      }
    ]
  },
  {
    id: "georgia",
    name: "Georgia",
    description: "Your favorite coffee house serving delicious beverages, snacks, and continental delights",
    image: "/cafes/Georgia.jpg",
    menu: [
      // HOT BEVERAGES
      {
        name: "Freshly Brewed Coffee",
        description: "Choose your size: Regular/Medium/Large",
        price: 40,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Espresso",
        description: "Strong concentrated coffee brewed by forcing hot water under pressure",
        price: 40,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Cappuccino",
        description: "Espresso topped with foamy milk and a sprinkle of cocoa powder",
        price: 40,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Americano",
        description: "Espresso diluted with hot water",
        price: 40,
        rating: 4,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Mocachino",
        description: "Chocolate flavored coffee with steamed milk",
        price: 40,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Hot Chocolate",
        description: "Rich and creamy hot chocolate with whipped cream",
        price: 40,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Badam Milk",
        description: "Hot almond-flavored milk with nuts",
        price: 40,
        rating: 4,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Regular Coffee",
        description: "Classic filter coffee",
        price: 30,
        rating: 4,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Masala Tea",
        description: "Indian spiced tea with aromatic herbs",
        price: 30,
        rating: 4,
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Cardamom Tea",
        description: "Tea flavored with cardamom",
        price: 30,
        rating: 4,
        image: "https://images.unsplash.com/photo-1594631252845-29fc458695d1?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Green Tea",
        description: "Healthy green tea with antioxidants",
        price: 30,
        rating: 4,
        image: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Kulhad Tea",
        description: "Traditional clay pot served tea",
        price: 25,
        rating: 4,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500"
      },
      // COLD BEVERAGES
      {
        name: "Ice Tea",
        description: "Refreshing cold tea with lemon",
        price: 40,
        rating: 4,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Cold Coffee",
        description: "Choose your size: Regular/Medium/Large",
        price: 70,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Cold Badam Milk",
        description: "Chilled almond milk with nuts: Regular/Medium/Large",
        price: 60,
        rating: 4,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500"
      },
      // SHAKES
      {
        name: "Vanilla Shake",
        description: "Classic vanilla milkshake: Regular/Medium/Large",
        price: 70,
        rating: 4,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Strawberry Shake",
        description: "Fresh strawberry milkshake: Regular/Medium/Large",
        price: 70,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Butterscotch Shake",
        description: "Rich butterscotch milkshake: Regular/Medium/Large",
        price: 70,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chocolate Shake",
        description: "Creamy chocolate milkshake: Regular/Medium/Large",
        price: 70,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "KitKat Shake",
        description: "KitKat chocolate bar blended shake: Regular/Medium/Large",
        price: 80,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500"
      },
      // MOCKTAILS
      {
        name: "Mojito",
        description: "Refreshing mint and lime mocktail",
        price: 50,
        rating: 4,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Fruit Punch",
        description: "Mixed fruit mocktail",
        price: 50,
        rating: 4,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=500"
      },
      // SNACKS
      {
        name: "Masala Maggi",
        description: "Classic instant noodles with Indian spices",
        price: 40,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Veg. Maggi",
        description: "Instant noodles with mixed vegetables",
        price: 50,
        rating: 4,
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=500"
      },
      // SANDWICHES
      {
        name: "Veg. Sandwich",
        description: "Grilled sandwich with mixed vegetables",
        price: 60,
        rating: 4,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Paneer Sandwich",
        description: "Grilled sandwich with spiced cottage cheese",
        price: 70,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      // PIZZA
      {
        name: "Veg. Pizza",
        description: "Fresh veggie topped pizza with cheese",
        price: 130,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Paneer Pizza",
        description: "Pizza topped with spiced cottage cheese and vegetables",
        price: 150,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500"
      },
      // PASTA
      {
        name: "Red Sauce Pasta",
        description: "Pasta in spicy tomato sauce",
        price: 120,
        rating: 4,
        image: "https://images.unsplash.com/photo-1621996346565-e3d5d628169c?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "White Sauce Pasta",
        description: "Creamy white sauce pasta",
        price: 120,
        rating: 4,
        image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&q=80&w=500"
      },
      // DESSERTS
      {
        name: "Brownie",
        description: "Rich chocolate brownie",
        price: 60,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chocolava",
        description: "Chocolate lava cake with molten center",
        price: 80,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500"
      }
    ]
  },
  {
    id: "subway",
    name: "Subway",
    description: "Fresh and customizable subs, sandwiches, and salads made to order",
    image: "/cafes/Subway.jpg",
    menu: [
      // VEG SUBS section
      {
        name: "Veggie Delite (6-inch/Footlong)",
        description: "Fresh mixed vegetables in a sub of your choice",
        price: 199,
        rating: 4.5,
        category: "VEG SUBS",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Double Egg n' Cheese Omelette (6-inch/Footlong)",
        description: "Double egg omelette with melted cheese",
        price: 219,
        rating: 4.5,
        category: "VEG SUBS",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Corn & Peas (6-inch/Footlong)",
        description: "Sweet corn and green peas with signature sauces",
        price: 209,
        rating: 4,
        category: "VEG SUBS",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Veg Shami (6-inch/Footlong)",
        description: "Vegetable patty with fresh veggies",
        price: 229,
        rating: 4.5,
        category: "VEG SUBS",
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chilli Bean Patty (6-inch/Footlong)",
        description: "Spicy bean patty with fresh vegetables",
        price: 219,
        rating: 4,
        category: "VEG SUBS",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Paneer Tikka (6-inch/Footlong)",
        description: "Grilled spiced cottage cheese with vegetables",
        price: 239,
        rating: 4.5,
        category: "VEG SUBS",
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=500"
      },
      // NON-VEG SUBS section
      {
        name: "Chicken Slice (6-inch/Footlong)",
        description: "Tender chicken slices with fresh vegetables",
        price: 249,
        rating: 4.5,
        category: "NON-VEG SUBS",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chicken Meatball (6-inch/Footlong)",
        description: "Juicy chicken meatballs in marinara sauce",
        price: 259,
        rating: 4.5,
        category: "NON-VEG SUBS",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Roast Chicken (6-inch/Footlong)",
        description: "Roasted chicken with signature sauces",
        price: 269,
        rating: 4.5,
        category: "NON-VEG SUBS",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Peri Peri Chicken (6-inch/Footlong)",
        description: "Spicy peri peri flavored chicken",
        price: 279,
        rating: 4.5,
        category: "NON-VEG SUBS",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Tandoori Chicken (6-inch/Footlong)",
        description: "Classic tandoori spiced chicken",
        price: 279,
        rating: 4.5,
        category: "NON-VEG SUBS",
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chicken Teriyaki (6-inch/Footlong)",
        description: "Sweet and savory teriyaki chicken",
        price: 289,
        rating: 4.5,
        category: "NON-VEG SUBS",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Tuna (6-inch/Footlong)",
        description: "Classic tuna mix with mayonnaise",
        price: 269,
        rating: 4,
        category: "NON-VEG SUBS",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Italian BMT (Chicken) (6-inch/Footlong)",
        description: "Italian-style sub with chicken and pepperoni",
        price: 299,
        rating: 4.5,
        category: "NON-VEG SUBS",
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=500"
      },
      // ADD-ONS section
      {
        name: "Cheese Slice",
        description: "Extra slice of cheese",
        price: 30,
        rating: 4,
        category: "ADD-ONS",
        image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Cheese Pull",
        description: "Extra melted cheese",
        price: 40,
        rating: 4.5,
        category: "ADD-ONS",
        image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Extra Veg Protein",
        description: "Additional vegetarian protein",
        price: 50,
        rating: 4,
        category: "ADD-ONS",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Extra Non-Veg Protein",
        description: "Additional non-vegetarian protein",
        price: 60,
        rating: 4.5,
        category: "ADD-ONS",
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Speciality Dips",
        description: "Choice of special dipping sauces",
        price: 35,
        rating: 4,
        category: "ADD-ONS",
        image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&q=80&w=500"
      },
      // SNACKS & SIDES section
      {
        name: "Crispers",
        description: "Crunchy potato crisps",
        price: 49,
        rating: 4,
        category: "SNACKS & SIDES",
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Veggie Kebabs with dip",
        description: "Grilled vegetable kebabs served with dip",
        price: 129,
        rating: 4.5,
        category: "SNACKS & SIDES",
        image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Chicken Meatballs with dip",
        description: "Seasoned chicken meatballs with dip",
        price: 149,
        rating: 4.5,
        category: "SNACKS & SIDES",
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Toastie",
        description: "Grilled sandwich with choice of filling",
        price: 99,
        rating: 4,
        category: "SNACKS & SIDES",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500"
      },
      {
        name: "Nachos with Dip",
        description: "Crispy nachos served with cheese dip",
        price: 119,
        rating: 4.5,
        category: "SNACKS & SIDES",
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=500"
      }
    ]
  },
  {
    id: "uncles",
    name: "Uncle's Cafe",
    description: "Your favorite spot for delicious sandwiches, burgers, and comfort food",
    image: "/cafes/Uncle Cafe- 1.jpg",
    menu: [
      // Bread 'N' More - Sandwiches
      {
        name: "Veg Sandwich",
        description: "Fresh vegetables with special sauce in toasted bread",
        price: 80,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500",
        category: "Bread 'N' More"
      },
      {
        name: "Cheese Sandwich",
        description: "Melted cheese with vegetables in toasted bread",
        price: 90,
        rating: 4.2,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500",
        category: "Bread 'N' More"
      },
      {
        name: "Chilli Cheese Sandwich",
        description: "Spicy sandwich with melted cheese and green chilies",
        price: 95,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500",
        category: "Bread 'N' More"
      },
      {
        name: "Chicken Tikka Sandwich",
        description: "Grilled chicken tikka with vegetables and special sauce",
        price: 120,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=500",
        category: "Bread 'N' More"
      },
      // Burgers
      {
        name: "Veg Burger",
        description: "Crispy vegetable patty with fresh veggies and sauce",
        price: 90,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500",
        category: "Burgers"
      },
      {
        name: "Veg Cheese Burger",
        description: "Vegetable patty with melted cheese and special sauce",
        price: 110,
        rating: 4.2,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500",
        category: "Burgers"
      },
      {
        name: "Uncle's Spl Veg Burger",
        description: "Special veg burger with extra toppings and secret sauce",
        price: 130,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500",
        category: "Burgers"
      },
      {
        name: "Chicken Burger",
        description: "Grilled chicken patty with fresh vegetables",
        price: 120,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500",
        category: "Burgers"
      },
      // Momo's
      {
        name: "Veg Steam Momo's",
        description: "Steamed dumplings filled with spiced vegetables",
        price: 80,
        rating: 4.2,
        image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=500",
        category: "Momo's"
      },
      {
        name: "Chicken Steam Momo's",
        description: "Steamed dumplings with spiced chicken filling",
        price: 100,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=500",
        category: "Momo's"
      },
      {
        name: "Veg Fried Momo's",
        description: "Crispy fried vegetable dumplings",
        price: 90,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=500",
        category: "Momo's"
      },
      // Fries 'N' Finger
      {
        name: "French Fries",
        description: "Crispy golden potato fries",
        price: 80,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=500",
        category: "Fries 'N' Finger"
      },
      {
        name: "Masala Fries",
        description: "Spiced fries with Indian masala",
        price: 90,
        rating: 4.2,
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=500",
        category: "Fries 'N' Finger"
      },
      {
        name: "Chicken Strips",
        description: "Crispy fried chicken strips",
        price: 150,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500",
        category: "Fries 'N' Finger"
      },
      // Italian Bite
      {
        name: "Pasta White Sauce Veg",
        description: "Creamy white sauce pasta with vegetables",
        price: 140,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&q=80&w=500",
        category: "Italian Bite"
      },
      {
        name: "Pasta Red Sauce Veg",
        description: "Tangy tomato sauce pasta with vegetables",
        price: 130,
        rating: 4.2,
        image: "https://images.unsplash.com/photo-1621996346565-e3d5d628169c?auto=format&fit=crop&q=80&w=500",
        category: "Italian Bite"
      },
      // Maggi 'N' Noodles
      {
        name: "Veg Maggi",
        description: "Classic Maggi noodles with vegetables",
        price: 60,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=500",
        category: "Maggi 'N' Noodles"
      },
      {
        name: "Cheese Maggi",
        description: "Maggi noodles with melted cheese",
        price: 80,
        rating: 4.2,
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=500",
        category: "Maggi 'N' Noodles"
      },
      // Baker's Basket
      {
        name: "Veg Samosa",
        description: "Crispy pastry filled with spiced potatoes",
        price: 30,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=500",
        category: "Baker's Basket"
      },
      {
        name: "Veg Puff",
        description: "Flaky pastry with vegetable filling",
        price: 35,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=500",
        category: "Baker's Basket"
      },
      // Sweet Tooth
      {
        name: "Brownie",
        description: "Rich chocolate brownie",
        price: 60,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500",
        category: "Sweet Tooth"
      },
      {
        name: "Brownie with Ice Cream",
        description: "Warm brownie served with vanilla ice cream",
        price: 90,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500",
        category: "Sweet Tooth"
      }
    ]
  },
  {
    id: "ccd",
    name: "Cafe Coffee Day",
    description: "Your favorite coffee destination offering a wide range of beverages from classic espresso to refreshing teas and cold drinks",
    image: "/cafes/CCD.jpg",
    menu: [
      {
        name: "Espresso",
        description: "Rich and intense coffee shot, perfect for coffee purists",
        price: 50,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=500",
        category: "Heart-Warming Coffees"
      },
      {
        name: "Cafe Mocha",
        description: "Perfect blend of coffee and chocolate for a luxurious experience",
        price: 55,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=500",
        category: "Heart-Warming Coffees"
      },
      {
        name: "Americano",
        description: "Espresso diluted with hot water for a smooth coffee experience",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=500",
        category: "Heart-Warming Coffees"
      },
      {
        name: "Cappuccino",
        description: "Classic Italian coffee topped with creamy milk foam",
        price: 50,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=500",
        category: "Heart-Warming Coffees"
      },
      {
        name: "Cafe Latte",
        description: "Smooth espresso with steamed milk and light foam",
        price: 50,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=500",
        category: "Heart-Warming Coffees"
      },
      {
        name: "Filter Coffee",
        description: "Traditional South Indian style filter coffee",
        price: 35,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=500",
        category: "Heart-Warming Coffees"
      },
      {
        name: "Garam Chai",
        description: "Traditional Indian hot tea with aromatic spices",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500",
        category: "Refreshing Teas"
      },
      {
        name: "Lemon Chai",
        description: "Hot tea with a refreshing citrus twist",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=500",
        category: "Refreshing Teas"
      },
      {
        name: "Green Tea",
        description: "Light and healthy green tea with antioxidants",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=500",
        category: "Refreshing Teas"
      },
      {
        name: "Cardamom Chai",
        description: "Aromatic tea infused with cardamom",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1594631252845-29fc458695d1?auto=format&fit=crop&q=80&w=500",
        category: "Refreshing Teas"
      },
      {
        name: "Ginger Chai",
        description: "Spicy tea with fresh ginger for extra warmth",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500",
        category: "Refreshing Teas"
      },
      {
        name: "Masala Chai",
        description: "Classic Indian tea with a blend of aromatic spices",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=500",
        category: "Refreshing Teas"
      },
      {
        name: "Boost",
        description: "Energy-packed malted drink for active lifestyles",
        price: 60,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500",
        category: "Healthy Classics"
      },
      {
        name: "Horlicks",
        description: "Nutritious malted milk drink with essential nutrients",
        price: 60,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=500",
        category: "Healthy Classics"
      },
      {
        name: "Eskimo Coffee",
        description: "Chilled coffee topped with ice cream",
        price: 65,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=500",
        category: "Cold Coffee Delights"
      },
      {
        name: "Tropical Moksha",
        description: "Refreshing tropical coffee blend with exotic flavors",
        price: 65,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=500",
        category: "Cold Coffee Delights"
      },
      {
        name: "Cold Choco",
        description: "Chilled chocolate drink for chocolate lovers",
        price: 65,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500",
        category: "Chocoholicas"
      },
      {
        name: "Chocolate Moksha",
        description: "Premium chocolate beverage with rich cocoa",
        price: 55,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500",
        category: "Chocoholicas"
      },
      {
        name: "Orangillo",
        description: "Refreshing orange-based frozen drink",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=500",
        category: "Frosteezers"
      },
      {
        name: "Lemon Iced Tea",
        description: "Chilled tea with fresh lemon",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=500",
        category: "Frosteezers"
      },
      {
        name: "Storm Energy Drink",
        description: "Energizing beverage for an instant boost",
        price: 60,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500",
        category: "Ready to Drink"
      },
      {
        name: "Cold Coffee (Vanilla/Hazelnut)",
        description: "Ready-to-drink flavored cold coffee",
        price: 65,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=500",
        category: "Ready to Drink"
      },
      {
        name: "Rush Fruit Juice",
        description: "Refreshing fruit juice (Mango/Pomegranate)",
        price: 50,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=500",
        category: "Ready to Drink"
      }
    ]
  },
  // Add other outlets here...
];

const OutletMenu: React.FC = () => {
  const { outletId } = useParams<{ outletId: string }>();
  const { totalItems, totalPrice } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const outlet = outlets.find(o => o.id === outletId);

  // Mock orders data - you can replace this with actual data from your backend
  const recentOrders = [
    { id: 1, outlet: "Food Court", date: "2024-03-20", amount: 450 },
    { id: 2, outlet: "Basil", date: "2024-03-19", amount: 280 },
    { id: 3, outlet: "Uncle's Cafe", date: "2024-03-18", amount: 350 }
  ];

  if (!outlet) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-blue-50 rounded-3xl mb-6">
          <UtensilsCrossed className="w-16 h-16 text-blue-600" />
        </div>
        <h1 className="text-3xl font-black text-blue-950 mb-2">Outlet Not Found</h1>
        <p className="text-gray-500 mb-8 font-light">The outlet you're looking for doesn't exist.</p>
        <Link
          to="/"
        >
          <GradientButton label="Back to Home" variant="blue" className="px-10" />
        </Link>
      </div>
    );
  }

  const getMenuItemsByCategory = (menu: MenuItem[], outletId: string) => {
    const categorizedItems: { [key: string]: MenuItem[] } = {};
    
    menu.forEach(item => {
      const category = item.category || 'Other';
      if (!categorizedItems[category]) {
        categorizedItems[category] = [];
      }
      categorizedItems[category].push(item);
    });
    
    return categorizedItems;
  };

  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const categorizedMenu = getMenuItemsByCategory(outlet.menu, outlet.id);

  const filteredCategorizedMenu = useMemo(() => {
    const result: Record<string, MenuItem[]> = {};
    Object.entries(categorizedMenu).forEach(([cat, items]) => {
      let filtered = items;
      if (dietFilter === 'veg') {
        filtered = items.filter(i => isItemVeg(i.name, i.description, (i as any).isVeg));
      } else if (dietFilter === 'nonveg') {
        filtered = items.filter(i => !isItemVeg(i.name, i.description, (i as any).isVeg));
      }
      if (filtered.length > 0) {
        result[cat] = filtered;
      }
    });
    return result;
  }, [categorizedMenu, dietFilter]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-neutral-950 transition-colors duration-500">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-[#FDFCFB]/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-orange-100/50 dark:border-neutral-800/50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group shrink-0">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-blue-950 dark:text-white whitespace-nowrap">
                  Campus Crave
              </h1>
            </Link>
            
            <div className="flex items-center space-x-4 lg:space-x-6">
              <ThemeToggle />
              <Link
                to="/cart"
                className="group flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20 px-6 py-2.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all relative border border-blue-100 dark:border-blue-800/50 shadow-sm"
              >
                <motion.div
                  animate={totalItems > 0 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </motion.div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase tracking-tighter">My Cart</span>
                  <span className="text-sm font-black text-blue-950 dark:text-white">₹{totalPrice}</span>
                </div>
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      key={totalItems}
                      className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FDFCFB] dark:border-neutral-950 shadow-lg shadow-orange-200/50 dark:shadow-none"
                    >
                      <motion.span
                        initial={{ y: 10 }}
                        animate={{ y: 0 }}
                        key={totalItems}
                      >
                        {totalItems}
                      </motion.span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              <UserNavProfile />
              
              <Link
                to="/"
                className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Outlet Hero */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={outlet.image}
          alt={outlet.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/40 to-transparent flex items-end pb-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-4">
                <div className="inline-block px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-widest">
                  Campus Favorite
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight">{outlet.name}</h1>
                <p className="text-lg text-blue-100/80 font-light leading-relaxed max-w-xl">{outlet.description}</p>
                
                <div className="flex flex-wrap gap-5 pt-2">
                  <div className="flex items-center gap-2 text-white">
                    <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                    <span className="font-bold text-base">4.8</span>
                    <span className="text-blue-200 text-xs">(500+ Ratings)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-base">15-20 min</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-base">Campus Outlet</span>
                  </div>
                </div>
              </div>

              {/* Live Crowd Monitoring Card */}
              <div className="w-full sm:w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-4 rounded-3xl border border-white/20 dark:border-neutral-800 shadow-2xl shrink-0">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Crowd Status</span>
                </div>
                <CrowdMonitor restaurantId={outlet.id} restaurantName={outlet.name} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="container mx-auto px-4 py-16">
        {/* Category & Diet Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-16 bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Outlet Menu</h3>
            <p className="text-xs text-gray-400">Order freshly prepared dishes directly to your table or pickup counter</p>
          </div>

          {/* Veg / Non-Veg Toggle Pills */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl border border-gray-200/60 dark:border-neutral-700">
            <button
              onClick={() => setDietFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                dietFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietFilter('veg')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                dietFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Pure Veg
            </button>
            <button
              onClick={() => setDietFilter('nonveg')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                dietFilter === 'nonveg'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
              Non-Veg
            </button>
          </div>
        </div>

        {Object.keys(filteredCategorizedMenu).length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-bold text-gray-500 dark:text-gray-400">
              No {dietFilter === 'veg' ? 'vegetarian' : 'non-vegetarian'} dishes found in this outlet.
            </p>
            <button
              onClick={() => setDietFilter('all')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              Show Full Menu
            </button>
          </div>
        ) : (
          Object.entries(filteredCategorizedMenu).map(([category, items], catIndex) => (
            <motion.div 
              key={category} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
              className="mb-20"
            >
              <div className="flex items-center gap-4 mb-12">
                <h2 className="text-3xl font-black text-blue-950 dark:text-white tracking-tight">{category}</h2>
                <div className="h-px flex-1 bg-blue-100 dark:bg-neutral-800" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{items.length} Items</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-24 pt-12">
                {items.map((item, index) => (
                  <MenuItemComponent 
                    key={index} 
                    {...item} 
                    outletId={outlet.id} 
                    outletName={outlet.name} 
                  />
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default OutletMenu; 