import React, { useState, useRef } from 'react';
import { X, Check, User, Mail, Phone, GraduationCap, Sparkles, Camera, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || 'Alex Sharma');
  const [email] = useState(user?.email || 'alex.sharma@campus.edu');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [department, setDepartment] = useState(user?.department || 'B.Tech CSE - 3rd Year');
  const [dietPreference, setDietPreference] = useState(user?.dietPreference || 'all');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setAvatar(compressedDataUrl);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      phone,
      department,
      dietPreference,
      avatar,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Hidden device file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageFile}
          className="hidden"
        />

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                <User className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Edit Student Profile
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Upload your profile picture from device and update dining details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Device Profile Photo Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-blue-500/20 shadow-md shrink-0 bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black"
                title="Click to choose a photo from device"
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity backdrop-blur-[2px]">
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">Change</span>
                </div>
              </div>

              <div className="flex-1 space-y-1.5">
                <p className="text-xs text-gray-700 dark:text-gray-300 font-bold">
                  Upload picture from device
                </p>
                <p className="text-[11px] text-gray-400">
                  Select any photo from your phone or PC (PNG, JPG, WEBP).
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-rose-50 text-gray-600 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {uploadError && (
                  <p className="text-[11px] font-bold text-rose-500">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Email (Campus Verified) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Campus Email
              </label>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified Student
              </span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Phone / WhatsApp (For Order Alerts)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Department & Batch */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Department & Year
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. B.Tech Computer Science - 3rd Year"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Dietary Preference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Default Food Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All Dishes', icon: '🍽️' },
                { id: 'veg', label: 'Pure Veg', icon: '🟢' },
                { id: 'nonveg', label: 'Non-Veg', icon: '🔴' },
              ].map(diet => (
                <button
                  key={diet.id}
                  type="button"
                  onClick={() => setDietPreference(diet.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    dietPreference === diet.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500 shadow-sm'
                      : 'border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{diet.icon}</span>
                  <span>{diet.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
