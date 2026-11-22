import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Utensils, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Sparkles, 
  Check, 
  MapPin, 
  Ticket, 
  CheckCircle2, 
  ShieldCheck,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import UserNavProfile from '../components/UserNavProfile';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { GoogleLogo } from '../components/GoogleAccountChooserModal';

const Profile: React.FC = () => {
  const { user, updateUser, openLoginModal } = useAuth();
  const { orders } = useOrders();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [department, setDepartment] = useState(user?.department || 'B.Tech CSE - 3rd Year');
  const [dietPreference, setDietPreference] = useState(user?.dietPreference || 'all');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '+91 98765 43210');
      setDepartment(user.department || 'B.Tech CSE - 3rd Year');
      setDietPreference(user.dietPreference || 'all');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress & scale smoothly on client canvas
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
    }, 2500);
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
        {!user ? (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-3xl p-8 text-center shadow-sm max-w-md mx-auto my-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Sign in to edit your profile</h2>
            <p className="text-xs text-gray-500 mb-6">Manage your student details, diet preferences, and photo.</p>
            <button
              onClick={openLoginModal}
              className="w-full py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Sign In / Create Account
            </button>
          </div>
        ) : (
          <>
            {/* Page Badge & Title */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Student Account</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Edit Student Profile
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose a profile picture from your device and manage your student dining details.
              </p>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          {/* Hidden File Input for Device Photo Selection */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageFile}
            className="hidden"
          />

          {/* Device Profile Picture Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-neutral-800">
            {/* Clickable Image Box with Camera Badge */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer shrink-0"
              title="Click to choose a photo from device"
            >
              <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-blue-500/20 shadow-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity backdrop-blur-[2px]">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Change</span>
              </div>
            </div>

            {/* Photo Action Buttons */}
            <div className="text-center sm:text-left flex-1 space-y-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Profile Photo
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                Upload your real photo directly from your device (phone gallery, webcam, or PC).
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose from Device</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-gray-600 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {uploadError && (
                <p className="text-xs font-bold text-rose-500 pt-1">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Campus Email
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {user?.authProvider === 'google' && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <GoogleLogo className="w-2.5 h-2.5" /> Google Account
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified Student
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  WhatsApp / Phone (Token SMS Alert)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Academic Department & Year
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science - 3rd Year"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Food Dietary Preference */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                Default Food Diet Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'all', label: 'All Dishes', icon: '🍽️' },
                  { id: 'veg', label: 'Pure Veg', icon: '🟢' },
                  { id: 'nonveg', label: 'Non-Veg', icon: '🔴' },
                ].map(diet => (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => setDietPreference(diet.id)}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                      dietPreference === diet.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500 shadow-xs'
                        : 'border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>{diet.icon}</span>
                    <span>{diet.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-neutral-800">
              {savedSuccess ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">All changes sync automatically across devices.</span>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link
            to="/addresses"
            className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Saved Addresses
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Manage hostel rooms & study zones
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/support"
            className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Raise a Ticket
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get quick help for dining issues
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
        </>
        )}
      </main>
    </div>
  );
};

export default Profile;
