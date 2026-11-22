import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown, Search, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';

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

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRaiseTicket?: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose, onOpenRaiseTicket }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-transparent dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-600 text-white">
                <HelpCircle className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Help & FAQs
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Common questions about canteen pickup, hostel delivery, and payments
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. token, refund, curfew, cutlery)..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="px-6 py-3 max-h-[55vh] overflow-y-auto space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              No questions found matching your search.
            </div>
          ) : (
            filteredFaqs.map(faq => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-gray-200/80 dark:border-neutral-800 bg-gray-50/40 dark:bg-neutral-900/40 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3.5 pt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-neutral-800/80">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer / CTA to Raise Ticket */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-950/60 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Still need help?</span>
            {onOpenRaiseTicket && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRaiseTicket();
                }}
                className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>Raise a Support Ticket</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaqModal;
