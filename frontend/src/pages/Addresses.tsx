import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Utensils, 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Home, 
  Building2, 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  Info 
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import UserNavProfile from '../components/UserNavProfile';
import { SavedAddress } from '../components/profile/SavedAddressesModal';

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-1',
    title: 'Primary Hostel Room',
    block: 'Hostel Block 1 (Boys)',
    room: 'Room 402, 4th Floor',
    instructions: 'Call at the ground floor turnstile gate',
    type: 'hostel',
    isDefault: true,
  },
  {
    id: 'addr-2',
    title: 'Study & Exam Zone',
    block: 'Central Library',
    room: '2nd Floor Reading Hall, Desk 14',
    instructions: 'Please keep voice low at library pickup entrance',
    type: 'library',
    isDefault: false,
  },
];

const Addresses: React.FC = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => {
    try {
      const saved = localStorage.getItem('campus_crave_saved_addresses');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse addresses', e);
    }
    return DEFAULT_ADDRESSES;
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'hostel' | 'academic' | 'library' | 'other'>('hostel');
  const [block, setBlock] = useState('Hostel Block 1 (Boys)');
  const [room, setRoom] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('campus_crave_saved_addresses', JSON.stringify(addresses));
    } catch (e) {
      console.error('Failed to save addresses', e);
    }
  }, [addresses]);

  const handleSetDefault = (id: string) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    setAddresses(prev => {
      const remaining = prev.filter(addr => addr.id !== id);
      if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim()) return;

    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      title: title.trim() || `${block} - ${room}`,
      block,
      room: room.trim(),
      instructions: instructions.trim(),
      type,
      isDefault: isDefault || addresses.length === 0,
    };

    setAddresses(prev => {
      if (newAddr.isDefault) {
        return [newAddr, ...prev.map(a => ({ ...a, isDefault: false }))];
      }
      return [...prev, newAddr];
    });

    // Reset Form
    setTitle('');
    setRoom('');
    setInstructions('');
    setIsDefault(false);
    setIsAddingNew(false);
  };

  const getTypeIcon = (t: SavedAddress['type']) => {
    switch (t) {
      case 'hostel':
        return <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'academic':
        return <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'library':
        return <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Campus Delivery Points</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Saved Campus Addresses
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select or add destination rooms, library desks, and lab counters for instant delivery.
            </p>
          </div>

          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all transform hover:scale-[1.02] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          )}
        </div>

        {/* Curfew & Delivery Info Notice */}
        <div className="mb-6 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
            <span className="font-bold">Campus Delivery Note:</span> Delivery runners have verified access turnstile credentials for all academic blocks and hostel lobbies. Post 9:00 PM curfew, orders are handed over at the hostel security reception.
          </div>
        </div>

        {/* New Address Form */}
        {isAddingNew && (
          <div className="bg-white dark:bg-neutral-900 border border-emerald-500/40 rounded-3xl p-6 shadow-md mb-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800 mb-5">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add New Campus Location</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Location Type
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'hostel', label: 'Hostel Room', icon: '🏠' },
                    { id: 'academic', label: 'Dept / Lab', icon: '🏢' },
                    { id: 'library', label: 'Library', icon: '📚' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        type === t.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500 shadow-xs'
                          : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Location Nickname
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. My Room / Group Study Room"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Block selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Building / Campus Block *
                  </label>
                  <select
                    value={block}
                    onChange={e => setBlock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Hostel Block 1 (Boys)">Hostel Block 1 (Boys)</option>
                    <option value="Hostel Block 2 (Boys)">Hostel Block 2 (Boys)</option>
                    <option value="Hostel Block 3 (Boys)">Hostel Block 3 (Boys)</option>
                    <option value="Girls Hostel Block A">Girls Hostel Block A</option>
                    <option value="Girls Hostel Block B">Girls Hostel Block B</option>
                    <option value="Tech Park">Tech Park (TP)</option>
                    <option value="Central Library">Central Library</option>
                    <option value="MBA Block">MBA Block</option>
                    <option value="Mechanical Dept Block">Mechanical Dept Block</option>
                    <option value="Architecture Dept">Architecture Dept</option>
                  </select>
                </div>
              </div>

              {/* Room details */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Room / Floor / Desk Number *
                </label>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="e.g. Room 402, 4th Floor or Table 14"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Delivery instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Delivery Runner Notes (Optional)
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Call at security gate, leave with warden if in class"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultAddressCheck"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="defaultAddressCheck" className="text-xs text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                  Set as default campus delivery address for checkout
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Saved Addresses List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400">
              <MapPin className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No saved campus locations</p>
              <p className="text-xs text-gray-400 mt-1">Add your hostel room or library desk above for quick ordering.</p>
            </div>
          ) : (
            addresses.map(addr => (
              <div
                key={addr.id}
                className={`p-6 rounded-3xl border transition-all ${
                  addr.isDefault
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm'
                    : 'border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-gray-100 dark:bg-neutral-800 shrink-0 mt-0.5">
                      {getTypeIcon(addr.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {addr.title}
                        </h4>
                        {addr.isDefault && (
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">
                        {addr.block} • {addr.room}
                      </p>
                      {addr.instructions && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic">
                          📌 "{addr.instructions}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 transition-colors"
                      >
                        Make Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Addresses;
