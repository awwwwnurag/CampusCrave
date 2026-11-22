import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, CheckCircle2, Home, Building2, BookOpen, AlertCircle } from 'lucide-react';

export interface SavedAddress {
  id: string;
  title: string;
  block: string;
  room: string;
  instructions?: string;
  type: 'hostel' | 'academic' | 'library' | 'other';
  isDefault: boolean;
}

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

interface SavedAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedAddressesModal: React.FC<SavedAddressesModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

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

  const getTypeIcon = (type: SavedAddress['type']) => {
    switch (type) {
      case 'hostel':
        return <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'academic':
        return <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'library':
        return <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-transparent dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                <MapPin className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Campus Delivery Addresses
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Hostel rooms, labs, and study zones for fast delivery
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* Add Address CTA / Toggle */}
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Campus Location</span>
            </button>
          )}

          {/* New Address Form */}
          {isAddingNew && (
            <form onSubmit={handleAddAddress} className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/60 border border-gray-200/80 dark:border-neutral-700 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  Add Location Details
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>

              {/* Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'hostel', label: 'Hostel Room', icon: '🏠' },
                  { id: 'academic', label: 'Dept / Lab', icon: '🏢' },
                  { id: 'library', label: 'Library', icon: '📚' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                      type === t.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500'
                        : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Title / Nickname */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Location Nickname (e.g. My Room / Group Study Desk)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. My Main Room"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Campus Building Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Building / Block
                </label>
                <select
                  value={block}
                  onChange={e => setBlock(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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

              {/* Room / Desk / Floor */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Room / Floor / Seat Number *
                </label>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="e.g. Room 402, 4th Floor"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Delivery Note */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Runner Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Call at hostel turnstiles upon arrival"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                  Set as default campus delivery address
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
              >
                Save Address
              </button>
            </form>
          )}

          {/* Saved List */}
          <div className="space-y-3">
            {addresses.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-xs">
                No addresses saved yet. Click "Add New Campus Location" above!
              </div>
            ) : (
              addresses.map(addr => (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    addr.isDefault
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-gray-100 dark:bg-neutral-800 shrink-0 mt-0.5">
                        {getTypeIcon(addr.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {addr.title}
                          </h4>
                          {addr.isDefault && (
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                          {addr.block} • {addr.room}
                        </p>
                        {addr.instructions && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 italic">
                            📌 "{addr.instructions}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/60 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedAddressesModal;
