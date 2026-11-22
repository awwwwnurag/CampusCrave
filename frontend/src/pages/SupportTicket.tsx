import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Utensils, 
  ArrowLeft, 
  Ticket, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  Sparkles, 
  PhoneCall, 
  HelpCircle 
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import UserNavProfile from '../components/UserNavProfile';
import { useOrders } from '../context/OrderContext';

interface SupportTicket {
  id: string;
  orderId?: string;
  category: string;
  subject: string;
  description: string;
  phone: string;
  status: 'In Review' | 'Agent Assigned' | 'Resolved';
  createdAt: string;
  urgency: 'Normal' | 'Urgent';
}

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-7821',
    orderId: 'CC-92140',
    category: 'Missing Item',
    subject: 'Extra dips not included with garlic bread',
    description: 'Ordered from Basil yesterday, dips were missing from pickup bag.',
    phone: '+91 98765 43210',
    status: 'Resolved',
    createdAt: 'Yesterday, 3:15 PM',
    urgency: 'Normal',
  },
];

const SupportTicketPage: React.FC = () => {
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('campus_crave_support_tickets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse tickets', e);
    }
    return DEFAULT_TICKETS;
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string>('none');
  const [category, setCategory] = useState('Order Delay (Over 25 mins)');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [urgency, setUrgency] = useState<'Normal' | 'Urgent'>('Normal');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('campus_crave_support_tickets', JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save tickets', e);
    }
  }, [tickets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: selectedOrderId !== 'none' ? selectedOrderId : undefined,
      category,
      subject: subject.trim() || category,
      description: description.trim(),
      phone,
      status: 'In Review',
      createdAt: 'Just now',
      urgency,
    };

    setTickets(prev => [newTicket, ...prev]);
    setSubmittedTicketId(newTicket.id);

    // Reset Form
    setDescription('');
    setSubject('');
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>Student Support Helpdesk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Raise a Support Ticket
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fast canteen problem resolution, refund checks, and order delay inquiries (average response &lt; 15 mins).
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-neutral-800 pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setSubmittedTicketId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            Raise New Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <span>My Support Tickets</span>
            {tickets.length > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'history' ? 'bg-white text-amber-700' : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-200'
              }`}>
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' ? (
          submittedTicketId ? (
            /* Success confirmation */
            <div className="bg-white dark:bg-neutral-900 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                Ticket #{submittedTicketId} Created
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Ticket Submitted Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                A campus canteen supervisor has received your query. We will contact you at <span className="font-bold text-gray-800 dark:text-gray-200">{phone}</span> via WhatsApp / SMS within ~10 to 15 minutes.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => setActiveTab('history')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                >
                  View My Tickets
                </button>
                <button
                  onClick={() => setSubmittedTicketId(null)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            /* Ticket Form */
            <div className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Related Order */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Select Related Order
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={e => setSelectedOrderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="none">General Inquiry (Not related to a specific order)</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} • {o.items.map(i => i.name).join(', ').slice(0, 36)}... (₹{o.total})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    What is the issue about? *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Order Delay (Over 25 mins)">⏳ Order Delay (Over 25 mins)</option>
                    <option value="Missing or Incorrect Dish">🍱 Missing or Incorrect Dish</option>
                    <option value="Food Quality / Packaging Spill">🥗 Food Quality / Packaging Spill</option>
                    <option value="UPI Debited but Token Failed">💳 UPI Debited but Token Failed</option>
                    <option value="Cutlery / Condiments Missing">🍴 Cutlery / Condiments Missing</option>
                    <option value="Campus Delivery Issue">📍 Campus Delivery Issue</option>
                    <option value="Other Campus Canteen Query">❓ Other Campus Canteen Query</option>
                  </select>
                </div>

                {/* Urgency Pill */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Exam / Tight Break Priority?</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Fast-tracks resolution queue for students during exams</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUrgency(urgency === 'Urgent' ? 'Normal' : 'Urgent')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      urgency === 'Urgent'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
                    }`}
                  >
                    {urgency === 'Urgent' ? '⚡ Urgent Priority' : 'Standard'}
                  </button>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Describe what happened *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide details (e.g. food token #TK-14 was delayed past 30 mins at Food Court, or payment debited but order didn't update)..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Contact Phone (For WhatsApp updates)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Support Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          )
        ) : (
          /* Tickets History List */
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-3xl p-12 text-center text-gray-500">
                <Ticket className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No support tickets found</p>
                <p className="text-xs text-gray-400 mt-1">If you ever face an issue with an order, raise a ticket here!</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                        #{ticket.id}
                      </span>
                      {ticket.urgency === 'Urgent' && (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 px-2 py-0.5 rounded-full">
                          ⚡ Urgent
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      ticket.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {ticket.category}
                  </h4>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs text-gray-400 border-t border-gray-100 dark:border-neutral-800">
                    <span>{ticket.orderId ? `Order #${ticket.orderId}` : 'General Inquiry'}</span>
                    <span>Created: {ticket.createdAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SupportTicketPage;
