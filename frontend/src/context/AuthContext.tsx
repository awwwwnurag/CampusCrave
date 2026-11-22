import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id?: number;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  phone?: string;
  department?: string;
  dietPreference?: string;
  authProvider?: 'email' | 'google';
  googleId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string, name?: string) => Promise<void> | void;
  signup: (name: string, email: string, password?: string) => Promise<void> | void;
  loginWithGoogle: (googleData: {
    email: string;
    name: string;
    avatar?: string;
    googleId?: string;
    credential?: string;
  }) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('campus_crave_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to load user from localStorage', e);
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('campus_crave_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('campus_crave_user');
      }
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  }, [user]);

  const login = async (email: string, password?: string, name?: string) => {
    try {
      const apiUser = await api.login(email, password);
      const newUser: User = {
        name: apiUser.name || name || email.split('@')[0],
        email: apiUser.email,
        avatar: apiUser.avatar || '',
        role: apiUser.role,
      };
      setUser(newUser);
    } catch {
      const derivedName = name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const newUser: User = {
        name: derivedName,
        email,
        avatar: '',
        role: 'student',
      };
      setUser(newUser);
    }
    setIsLoginModalOpen(false);
  };

  const signup = async (name: string, email: string, password?: string) => {
    try {
      const apiUser = await api.register(name, email, password);
      const newUser: User = {
        name: apiUser.name,
        email: apiUser.email,
        avatar: apiUser.avatar || '',
        role: apiUser.role,
      };
      setUser(newUser);
    } catch {
      const newUser: User = {
        name,
        email,
        avatar: '',
        role: 'student',
      };
      setUser(newUser);
    }
    setIsLoginModalOpen(false);
  };

  const loginWithGoogle = async (googleData: {
    email: string;
    name: string;
    avatar?: string;
    googleId?: string;
    credential?: string;
  }) => {
    try {
      const apiUser = await api.loginWithGoogle({
        email: googleData.email,
        name: googleData.name,
        avatar: googleData.avatar,
        google_id: googleData.googleId,
        credential: googleData.credential,
      });

      const newUser: User = {
        id: apiUser.id,
        name: apiUser.name || googleData.name,
        email: apiUser.email || googleData.email,
        avatar: apiUser.avatar || googleData.avatar || '',
        role: apiUser.role || 'student',
        authProvider: 'google',
        googleId: googleData.googleId,
      };
      setUser(newUser);
    } catch (e) {
      console.warn('Google auth fallback:', e);
      const newUser: User = {
        name: googleData.name,
        email: googleData.email,
        avatar: googleData.avatar || '',
        role: 'student',
        authProvider: 'google',
        googleId: googleData.googleId,
      };
      setUser(newUser);
    }
    setIsLoginModalOpen(false);
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      try {
        localStorage.setItem('campus_crave_user', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save updated user', e);
      }
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        loginWithGoogle,
        updateUser,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
