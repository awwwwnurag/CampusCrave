import React, { useState, useEffect } from 'react';
import { X, Ticket, AlertCircle, Clock, CheckCircle2, MessageSquare, Send, ShieldAlert, Sparkles } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

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

interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-transparent dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                <Ticket className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Campus Crave Helpdesk
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Swift support & resolution for all campus dining issues
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-neutral-800 px-6 pt-3 bg-gray-50/50 dark:bg-neutral-950/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setSubmittedTicketId(null);
            }}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'create'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Raise New Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span>My Tickets</span>
            {tickets.length > 0 && (
              <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full">
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {activeTab === 'create' ? (
            submittedTicketId ? (
              /* Success State */
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                    Ticket #{submittedTicketId}
                  </span>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                    Ticket Submitted Successfully!
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2 leading-relaxed">
                    A campus canteen coordinator is reviewing your query. Resolution or follow-up SMS/WhatsApp will be sent to <span className="font-bold text-gray-700 dark:text-gray-300">{phone}</span> within ~10 minutes.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors"
                  >
                    View in My Tickets
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Related Order Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Related Order
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={e => setSelectedOrderId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="none">General Campus Crave Inquiry (No Order)</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} • {o.items.map(i => i.name).join(', ').slice(0, 32)}... (₹{o.total})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Order Delay (Over 25 mins)">⏳ Order Delay (Over 25 mins)</option>
                    <option value="Missing or Incorrect Dish">🍱 Missing or Incorrect Dish</option>
                    <option value="Food Quality / Packaging Spill">🥗 Food Quality / Packaging Spill</option>
                    <option value="UPI Debited but Token Failed">💳 UPI Debited but Token Failed</option>
                    <option value="Cutlery / Condiments Missing">🍴 Cutlery / Condiments Missing</option>
                    <option value="Campus Delivery Issue">📍 Campus Delivery Issue</option>
                    <option value="Other Assistance">❓ Other Assistance</option>
                  </select>
                </div>

                {/* Urgency Pill */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Exam / High-Priority Order?</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Fast-tracks queue for students in tight breaks</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUrgency(urgency === 'Urgent' ? 'Normal' : 'Urgent')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      urgency === 'Urgent'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
                    }`}
                  >
                    {urgency === 'Urgent' ? '⚡ Urgent' : 'Standard'}
                  </button>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Description of the Issue *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what happened (e.g. food token #TK-14 was delayed past 30 mins at Food Court)..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Phone / WhatsApp */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Contact Phone (For WhatsApp updates)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Support Ticket</span>
                </button>
              </form>
            )
          ) : (
            /* Ticket History */
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  No support tickets raised yet.
                </div>
              ) : (
                tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-2xl border border-gray-200/80 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                          #{ticket.id}
                        </span>
                        {ticket.urgency === 'Urgent' && (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.2 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ticket.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                      {ticket.category}
                    </h5>

                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400 border-t border-gray-200/60 dark:border-neutral-800">
                      <span>{ticket.orderId ? `Order #${ticket.orderId}` : 'General Inquiry'}</span>
                      <span>{ticket.createdAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50/60 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaiseTicketModal;
