import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  ArrowRight, 
  Shield, 
  Check, 
  Loader2, 
  Mail, 
  Settings, 
  ExternalLink,
  AlertCircle,
  Key,
  Sparkles
} from 'lucide-react';
import { 
  PRESET_GOOGLE_ACCOUNTS, 
  PresetGoogleAccount, 
  getGoogleClientId, 
  setGoogleClientId,
  launchRealGoogleOAuthPopup,
  loadGoogleScript
} from '../lib/googleAuth';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'real_oauth' | 'campus_accounts' | 'custom'>('real_oauth');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  
  // Real Google Client ID management
  const [clientId, setClientId] = useState(() => getGoogleClientId());
  const [isConfiguringClientId, setIsConfiguringClientId] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGoogleScript();
      const current = getGoogleClientId();
      setClientId(current);
      setClientIdInput(current);
      setOauthError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real Google OAuth 2.0 Popup Trigger
  const handleLiveGoogleOAuth = () => {
    setOauthError(null);
    const activeClientId = clientId || getGoogleClientId();

    if (!activeClientId) {
      setOauthError('Please configure your Google Cloud Client ID below to connect to live accounts.google.com.');
      setIsConfiguringClientId(true);
      return;
    }

    setIsSubmitting(true);
    launchRealGoogleOAuthPopup({
      clientId: activeClientId,
      onSuccess: async (googleUser) => {
        setIsSubmitting(false);
        try {
          await loginWithGoogle({
            name: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.avatar,
            googleId: googleUser.sub,
          });
          onClose();
        } catch (err) {
          console.error('Login error:', err);
        }
      },
      onError: (err: any) => {
        setIsSubmitting(false);
        console.warn('Real Google OAuth error:', err);
        const errMsg = err?.message || err?.error || JSON.stringify(err);
        if (errMsg.includes('popup_closed') || errMsg.includes('user_cancel')) {
          setOauthError('Google sign-in popup was closed before completion.');
        } else if (errMsg.includes('invalid_client') || errMsg.includes('origin')) {
          setOauthError(
            `Google OAuth Client verification notice. Ensure "${window.location.origin}" is added to Authorized JavaScript Origins in your Google Cloud Console.`
          );
          setIsConfiguringClientId(true);
        } else {
          setOauthError(`Google Sign-In notice: ${errMsg}`);
        }
      },
    });
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clientIdInput.trim();
    setGoogleClientId(trimmed);
    setClientId(trimmed);
    setIsConfiguringClientId(false);
    setOauthError(null);
  };

  const handleSelectPresetAccount = async (account: PresetGoogleAccount) => {
    setSelectedEmail(account.email);
    setIsSubmitting(true);

    try {
      await loginWithGoogle({
        name: account.name,
        email: account.email,
        avatar: account.avatar,
        googleId: `google_${account.email.replace(/[@.]/g, '_')}`,
      });
      onClose();
    } catch (err) {
      console.error('Google account selection error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;

    setIsSubmitting(true);
    try {
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customEmail)}`;
      await loginWithGoogle({
        name: customName,
        email: customEmail.trim().toLowerCase(),
        avatar: avatarUrl,
        googleId: `google_custom_${Date.now()}`,
      });
      onClose();
    } catch (err) {
      console.error('Custom Google login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        className="bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-neutral-800/80 border border-gray-100 dark:border-neutral-700 flex items-center justify-center shadow-xs mb-3">
            <GoogleLogo className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            Sign in with Google
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            to continue to <strong className="text-gray-800 dark:text-gray-200">Campus Crave</strong>
          </p>
        </div>

        {/* Tabs: Live OAuth vs Campus Accounts */}
        <div className="flex bg-gray-100 dark:bg-neutral-850 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('real_oauth');
              setOauthError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'real_oauth'
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <span>Live Google OAuth</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('campus_accounts')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'campus_accounts'
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Campus Accounts
          </button>
        </div>

        {/* TAB 1: Real Live Google OAuth 2.0 Popup */}
        {activeTab === 'real_oauth' && (
          <div className="space-y-4 mb-4">
            
            {/* Direct Official OAuth Button */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 dark:from-neutral-850 dark:via-neutral-900 dark:to-neutral-850 border border-blue-100 dark:border-neutral-800 text-center shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                Official Google Identity Services
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                Opens Google's native login popup on <span className="font-mono text-gray-800 dark:text-gray-200">accounts.google.com</span> to authenticate your real account.
              </p>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleLiveGoogleOAuth}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1558b0] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <div className="p-1 rounded bg-white shrink-0">
                      <GoogleLogo className="w-4 h-4" />
                    </div>
                    <span>Open Live Google Sign-In Popup</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </>
                )}
              </button>
            </div>

            {/* Error / Notice Display */}
            {oauthError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 leading-relaxed space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p>{oauthError}</p>
                </div>
              </div>
            )}

            {/* Client ID Setting & Config Accordion */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-neutral-850/60 border border-gray-200/80 dark:border-neutral-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Key className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-gray-700 dark:text-gray-300 block">Google Client ID</span>
                    <span className="text-[10px] text-gray-400 font-mono truncate block">
                      {clientId ? `${clientId.slice(0, 24)}...` : 'Not configured yet'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfiguringClientId(!isConfiguringClientId)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold hover:bg-gray-100 transition-colors shrink-0"
                >
                  {isConfiguringClientId ? 'Cancel' : clientId ? 'Change' : '+ Set ID'}
                </button>
              </div>

              {isConfiguringClientId && (
                <form onSubmit={handleSaveClientId} className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-800 space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Paste Google OAuth Client ID (from Google Cloud Console):
                  </label>
                  <input
                    type="text"
                    required
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxx-xxxx.apps.googleusercontent.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[10px] text-gray-400">
                      Add <code className="text-blue-600 dark:text-blue-400">{window.location.origin}</code> to Authorized JavaScript Origins.
                    </p>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 transition-colors"
                    >
                      Save ID
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: Campus Pre-Configured Accounts */}
        {activeTab === 'campus_accounts' && (
          <div className="space-y-2 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block px-1">
              Select student Google account
            </span>

            <div className="divide-y divide-gray-100 dark:divide-neutral-800 border border-gray-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-neutral-900/40">
              {PRESET_GOOGLE_ACCOUNTS.map((acc) => {
                const isCurrent = selectedEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectPresetAccount(acc)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-blue-50/60 dark:hover:bg-neutral-800/80 transition-colors group cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-neutral-700 shadow-2xs shrink-0 bg-blue-100">
                        <img src={acc.avatar} alt={acc.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {acc.name}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                            Student
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate block">
                          {acc.email}
                        </span>
                      </div>
                    </div>

                    {isCurrent && isSubmitting ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-700 flex items-center justify-center text-gray-400 group-hover:border-blue-500 group-hover:text-blue-600 transition-colors shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/60 flex items-center justify-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 transition-all mt-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enter custom Google email & name</span>
            </button>
          </div>
        )}

        {/* TAB 3: Custom Google Account Entry */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Enter your Google Account details:
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('campus_accounts')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Back
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Anurag Aryan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Google Email Address
              </label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="your.email@gmail.com or @campus.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1a73e8] hover:bg-[#1558b0] text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleLogo className="w-4 h-4" />
                  <span>Sign In with this Google Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security / Privacy Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-neutral-800/80 text-[11px] text-gray-500 dark:text-gray-400 space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              To continue, Google will share your name, email address, and profile picture with Campus Crave.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400">
            <span className="font-mono">Google Identity 2.0</span>
            <div className="flex items-center gap-3">
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="hover:underline">Privacy Policy</a>
              <span>•</span>
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="hover:underline">Terms of Service</a>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default GoogleAccountChooserModal;
