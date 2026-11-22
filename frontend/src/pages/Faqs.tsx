import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Utensils, 
  ArrowLeft, 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Ticket, 
  Sparkles, 
  MessageSquare, 
  ExternalLink 
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import UserNavProfile from '../components/UserNavProfile';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Tokens & Pickup',
    question: 'How do digital canteen tokens work?',
    answer: 'Once your order is confirmed, you receive a dynamic counter token (e.g. #TK-18). When your food preparation finishes, your screen and SMS will notify "Ready at Counter". Walk up to the fast-track pickup desk, show your token code, and collect your hot meal without standing in the regular billing line!',
  },
  {
    id: 'faq-2',
    category: 'Tokens & Pickup',
    question: 'Can my roommate or friend collect my order with my token?',
    answer: 'Yes! Anyone with your Token Number (#TK-XX) or order QR code can present it at the counter for pickup.',
  },
  {
    id: 'faq-3',
    category: 'Campus Delivery',
    question: 'What is the difference between Standard and Eco-Saver delivery?',
    answer: 'Standard Delivery assigns an immediate delivery runner directly to your hostel block or lab within 35-45 minutes. Eco-Saver groups multiple orders heading to the same block or academic floor within 45-55 minutes, cutting runner trips and eliminating delivery fees!',
  },
  {
    id: 'faq-4',
    category: 'Campus Delivery',
    question: 'Where do late night deliveries drop off after hostel curfew?',
    answer: 'Post 9:00 PM, all student deliveries are received at the primary turnstile / security reception of your designated hostel block. You will receive an SMS alert when the runner arrives.',
  },
  {
    id: 'faq-5',
    category: 'Payments & Refunds',
    question: 'What if money was deducted from my UPI app but no token was generated?',
    answer: 'All campus payments are protected by 100% escrow. If your bank or UPI app debits money without reaching our server, our gateway automatically initiates an instant reversal within 2 hours. You can also click "Raise a Ticket" with your UPI reference for manual assistance.',
  },
  {
    id: 'faq-6',
    category: 'Payments & Refunds',
    question: 'Can I pay in cash or counter QR code?',
    answer: 'Yes! Choose "Pay at Counter" during checkout. Your token will be marked pending until you scan the UPI QR or hand cash at the counter billing terminal before food collection.',
  },
  {
    id: 'faq-7',
    category: 'Diet & Hygiene',
    question: 'Are vegetarian and non-vegetarian dishes cooked in separate kitchen sections?',
    answer: 'Yes. All licensed campus eateries (including Food Court, Basil, and Subway) follow strict FSSAI campus separation guidelines with dedicated cookware, prep tables, and distinct green/red tamper-evident seals.',
  },
  {
    id: 'faq-8',
    category: 'Diet & Hygiene',
    question: 'How can I request extra cutlery or no onions/less spicy?',
    answer: 'In your Cart, click "Cooking requests" on any food item to add notes like "Less spicy" or "No onion", and toggle the "Cutlery Needed" switch before proceeding to pay.',
  },
];

const FaqsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1', 'faq-3']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Tokens & Pickup', 'Campus Delivery', 'Payments & Refunds', 'Diet & Hygiene'];

  const filteredFaqs = FAQS_DATA.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id: string) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500 font-sans pb-20">
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

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Badge & Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Campus Dining Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Answers regarding tokens, curfew delivery, UPI payment refunds, and kitchen hygiene.
          </p>
        </div>

        {/* Search Input */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-xs mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. token, refund, curfew, cutlery)..."
              className="w-full pl-10 pr-4 py-2 bg-transparent text-xs sm:text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-3xl p-12 text-center text-gray-500">
              <HelpCircle className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No matching questions found</p>
              <p className="text-xs text-gray-400 mt-1">Try another search keyword or raise a ticket directly.</p>
            </div>
          ) : (
            filteredFaqs.map(faq => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-neutral-800">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Helpdesk Callout Card */}
        <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
              Didn't find your answer?
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Our campus dining coordinators respond to tickets in &lt; 15 minutes.
            </p>
          </div>

          <Link
            to="/support"
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] shrink-0"
          >
            <Ticket className="w-4 h-4" />
            <span>Raise a Ticket</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FaqsPage;
