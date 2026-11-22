/**
 * Campus Crave — Real Google Identity Services (GSI) & Live OAuth 2.0 Client
 */

export interface GoogleUserPayload {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
  email_verified?: boolean;
}

export interface PresetGoogleAccount {
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
}

export const PRESET_GOOGLE_ACCOUNTS: PresetGoogleAccount[] = [
  {
    name: "Anurag Aryan",
    email: "anurag.aryan@campus.edu",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=240",
    role: "Verified Student",
    department: "Computer Science & Engineering"
  },
  {
    name: "Alex Sharma",
    email: "alex.sharma@campus.edu",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=240",
    role: "Verified Student",
    department: "Information Technology"
  },
  {
    name: "Priya Patel",
    email: "priya.patel@campus.edu",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=240",
    role: "Verified Student",
    department: "Electronics & Comm. Eng."
  },
  {
    name: "Rohan Verma",
    email: "rohan.verma@campus.edu",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=240",
    role: "Verified Student",
    department: "Mechanical Engineering"
  }
];

/**
 * Gets the active Google Client ID
 */
export function getGoogleClientId(): string {
  try {
    const local = localStorage.getItem('campus_crave_google_client_id');
    if (local && local.trim()) return local.trim();
  } catch {}
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID || 
    '110868741475-1qqm4qtgbunggg7he7na34av3ijs5lmk.apps.googleusercontent.com'
  ).trim();
}

/**
 * Updates the stored Google Client ID
 */
export function setGoogleClientId(clientId: string): void {
  try {
    localStorage.setItem('campus_crave_google_client_id', clientId.trim());
  } catch (e) {
    console.error('Failed to save Google Client ID:', e);
  }
}

/**
 * Safely parse a Google JWT ID token
 */
export function decodeGoogleJwt(token: string): GoogleUserPayload {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return { email: '', name: '' };
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode Google JWT token:', e);
    return { email: '', name: '' };
  }
}

/**
 * Dynamically loads the official Google Identity Services (GSI) script
 */
export function loadGoogleScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Google Identity Services script failed to load. Fallback active.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Launch Real Google OAuth 2.0 Popup Window
 * Opens Google's live account chooser and retrieves real user details via UserInfo API
 */
export function launchRealGoogleOAuthPopup({
  clientId,
  onSuccess,
  onError,
}: {
  clientId: string;
  onSuccess: (user: { name: string; email: string; avatar: string; sub: string }) => void;
  onError: (error: any) => void;
}) {
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    onError(new Error('Google Identity Services SDK is not loaded. Please check your internet connection.'));
    return;
  }

  try {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          onError(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        try {
          // Fetch real user info from Google's official userinfo API
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Google UserInfo fetch failed: ${response.statusText}`);
          }

          const userInfo = await response.json();
          onSuccess({
            name: userInfo.name || userInfo.email.split('@')[0],
            email: userInfo.email,
            avatar: userInfo.picture || '',
            sub: userInfo.sub || '',
          });
        } catch (fetchErr) {
          onError(fetchErr);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err) {
    onError(err);
  }
}

/**
 * Renders the official Google GSI Sign-In Button inside a DOM container
 */
export function renderRealGoogleGsiButton({
  container,
  clientId,
  onSuccess,
  onError,
}: {
  container: HTMLElement;
  clientId: string;
  onSuccess: (user: { name: string; email: string; avatar: string; sub: string; credential: string }) => void;
  onError?: (err: any) => void;
}) {
  const google = (window as any).google;
  if (!google?.accounts?.id) return;

  try {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        if (response.credential) {
          const payload = decodeGoogleJwt(response.credential);
          onSuccess({
            name: payload.name || payload.email.split('@')[0],
            email: payload.email,
            avatar: payload.picture || '',
            sub: payload.sub || '',
            credential: response.credential,
          });
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    google.accounts.id.renderButton(container, {
      type: 'standard',
      shape: 'pill',
      theme: 'outline',
      text: 'continue_with',
      size: 'large',
      logo_alignment: 'left',
      width: container.clientWidth || 340,
    });
  } catch (e) {
    console.warn('renderRealGoogleGsiButton error:', e);
    onError?.(e);
  }
}
