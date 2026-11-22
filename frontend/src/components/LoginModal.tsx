import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogo } from './GoogleAccountChooserModal';
import { 
  getGoogleClientId, 
  launchRealGoogleOAuthPopup, 
  loadGoogleScript 
} from '../lib/googleAuth';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLogin?: (email: string, password?: string) => void;
  onSignup?: (name: string, email: string, password?: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
  const auth = useAuth();
  const modalIsOpen = isOpen !== undefined ? isOpen : auth.isLoginModalOpen;
  const handleClose = onClose || auth.closeLoginModal;
  const handleLogin = onLogin || ((email, pwd) => auth.login(email, pwd));
  const handleSignup = onSignup || ((name, email, pwd) => auth.signup(name, email, pwd));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState('');
  const tokenClientRef = useRef<any>(null);

  useEffect(() => {
    if (modalIsOpen) {
      setGoogleAuthError('');
      loadGoogleScript().then(() => {
        const cId = getGoogleClientId();
        const google = (window as any).google;
        if (cId && google?.accounts?.oauth2) {
          try {
            tokenClientRef.current = google.accounts.oauth2.initTokenClient({
              client_id: cId,
              scope: 'openid email profile',
              callback: async (tokenResponse: any) => {
                if (tokenResponse.error) {
                  setIsLoadingGoogle(false);
                  if (tokenResponse.error === 'popup_closed_by_user' || tokenResponse.error === 'user_cancel') {
                    return;
                  }
                  console.error('Google OAuth token response error:', tokenResponse);
                  setGoogleAuthError(tokenResponse.error_description || tokenResponse.error || 'Google sign in failed');
                  return;
                }

                try {
                  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                      Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                  });
                  if (!response.ok) {
                    throw new Error(`Google UserInfo fetch failed (${response.status})`);
                  }
                  const userInfo = await response.json();
                  await auth.loginWithGoogle({
                    name: userInfo.name || userInfo.email.split('@')[0],
                    email: userInfo.email,
                    avatar: userInfo.picture || '',
                    googleId: userInfo.sub || '',
                  });
                  setIsLoadingGoogle(false);
                  handleClose();
                } catch (fetchErr: any) {
                  setIsLoadingGoogle(false);
                  console.error('UserInfo fetch error:', fetchErr);
                  setGoogleAuthError(fetchErr.message || 'Failed to fetch Google user profile');
                }
              },
            });
          } catch (initErr: any) {
            console.error('Failed to initTokenClient:', initErr);
          }
        }
      });
    }
  }, [modalIsOpen]);

  const handleGoogleClick = () => {
    setGoogleAuthError('');
    setIsLoadingGoogle(true);

    if (tokenClientRef.current) {
      // Direct synchronous user gesture -> popup will never be blocked by browser
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else {
      loadGoogleScript().then(() => {
        const cId = getGoogleClientId();
        launchRealGoogleOAuthPopup({
          clientId: cId,
          onSuccess: async (googleUser) => {
            setIsLoadingGoogle(false);
            await auth.loginWithGoogle({
              name: googleUser.name,
              email: googleUser.email,
              avatar: googleUser.avatar,
              googleId: googleUser.sub,
            });
            handleClose();
          },
          onError: (err: any) => {
            setIsLoadingGoogle(false);
            const errMsg = err?.message || err?.error || String(err);
            if (errMsg.includes('popup_closed') || errMsg.includes('user_cancel') || errMsg.includes('closed')) {
              return;
            }
            console.warn('Real Google popup error:', err);
            setGoogleAuthError(errMsg);
          },
        });
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginView) {
      handleLogin(email, password);
    } else {
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      handleSignup(name, email, password);
    }
  };

  if (!modalIsOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-7 sm:p-8 max-w-md w-full mx-auto relative shadow-2xl transform transition-all duration-300">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl sm:text-3xl font-black mb-1.5 text-center text-gray-900 dark:text-white">
            {isLoginView ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
            {isLoginView
              ? 'Sign in to access student discounts & order tracking'
              : 'Join Campus Crave to skip the canteen queue'}
          </p>

          {/* Google Error Banner if OAuth rejected */}
          {googleAuthError && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-600 dark:text-red-400 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Google Sign-In Alert</span>
              </div>
              <p className="leading-relaxed">{googleAuthError}</p>
              {googleAuthError.toLowerCase().includes('origin') && (
                <p className="mt-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-neutral-800 p-2 rounded-lg border border-red-100 dark:border-red-950">
                  Add <code>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}</code> to <strong>Authorized JavaScript origins</strong> in Google Cloud Console.
                </p>
              )}
            </div>
          )}

          {/* Full-Fledged Sign in with Google Button */}
          <div className="mb-4">
            <button
              type="button"
              disabled={isLoadingGoogle}
              onClick={handleGoogleClick}
              className="w-full py-3 px-4 rounded-2xl border border-gray-300 dark:border-neutral-800 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-900 text-black dark:text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 active:scale-98 group cursor-pointer disabled:opacity-60"
            >
              {isLoadingGoogle ? (
                <>
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Opening Google Sign-In...</span>
                </>
              ) : (
                <>
                  <GoogleLogo className="w-5 h-5 group-hover:scale-105 transition-transform" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Or Divider */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-gray-200 dark:border-neutral-800 w-full" />
            <span className="bg-white dark:bg-neutral-900 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
              or continue with email
            </span>
            <div className="border-t border-gray-200 dark:border-neutral-800 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLoginView && (
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-semibold outline-none transition-all"
                    placeholder="e.g. Anurag Aryan"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-semibold outline-none transition-all"
                  placeholder="e.g. student@campus.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-semibold outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {!isLoginView && (
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-semibold outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 mt-1 text-xs sm:text-sm"
            >
              {isLoginView ? 'Sign In with Email' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isLoginView
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal;
