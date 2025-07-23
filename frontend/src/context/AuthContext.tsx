import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  createdAt: string;
  sessionTimeout: number; // in minutes
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isFirstTimeSetup: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupFirstUser: (username: string, password: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  updateSessionTimeout: (timeout: number) => void;
  timeRemaining: number; // seconds until logout
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'ilo_user_session';
const USER_STORAGE_KEY = 'ilo_user_data';
const PASSWORD_STORAGE_KEY = 'ilo_password_hash';

// Simple hash function (in production, use proper encryption)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'ilo4_salt'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Check if this is the first time setup
  useEffect(() => {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    const passwordHash = localStorage.getItem(PASSWORD_STORAGE_KEY);
    
    if (!userData || !passwordHash) {
      setIsFirstTimeSetup(true);
    } else {
      // Check for existing valid session
      const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          const now = Date.now();
          
          if (session.expiresAt > now) {
            const savedUser = JSON.parse(userData);
            setUser(savedUser);
            setIsAuthenticated(true);
            setTimeRemaining(Math.floor((session.expiresAt - now) / 1000));
          } else {
            // Session expired
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch (error) {
          console.error('Error parsing session data:', error);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    }
  }, []);

  // Session timeout countdown
  useEffect(() => {
    if (!isAuthenticated || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, timeRemaining]);

  const setupFirstUser = async (username: string, password: string): Promise<boolean> => {
    try {
      const passwordHash = await hashPassword(password);
      const newUser: User = {
        username,
        createdAt: new Date().toISOString(),
        sessionTimeout: 30 // Default 30 minutes
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(PASSWORD_STORAGE_KEY, passwordHash);
      
      setUser(newUser);
      setIsAuthenticated(true);
      setIsFirstTimeSetup(false);
      
      // Create session
      const sessionExpiry = Date.now() + (newUser.sessionTimeout * 60 * 1000);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        username,
        expiresAt: sessionExpiry
      }));
      
      setTimeRemaining(newUser.sessionTimeout * 60);
      return true;
    } catch (error) {
      console.error('Error setting up first user:', error);
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const userData = localStorage.getItem(USER_STORAGE_KEY);
      const storedPasswordHash = localStorage.getItem(PASSWORD_STORAGE_KEY);
      
      if (!userData || !storedPasswordHash) {
        return false;
      }

      const user = JSON.parse(userData);
      const passwordHash = await hashPassword(password);
      
      if (user.username === username && storedPasswordHash === passwordHash) {
        setUser(user);
        setIsAuthenticated(true);
        
        // Create session
        const sessionExpiry = Date.now() + (user.sessionTimeout * 60 * 1000);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          username,
          expiresAt: sessionExpiry
        }));
        
        setTimeRemaining(user.sessionTimeout * 60);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setTimeRemaining(0);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const storedPasswordHash = localStorage.getItem(PASSWORD_STORAGE_KEY);
      if (!storedPasswordHash) return false;

      const oldPasswordHash = await hashPassword(oldPassword);
      if (storedPasswordHash !== oldPasswordHash) {
        return false; // Old password doesn't match
      }

      const newPasswordHash = await hashPassword(newPassword);
      localStorage.setItem(PASSWORD_STORAGE_KEY, newPasswordHash);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  };

  const updateSessionTimeout = (timeout: number) => {
    if (!user) return;

    const updatedUser = { ...user, sessionTimeout: timeout };
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    
    // Update current session if authenticated
    if (isAuthenticated) {
      const newExpiry = Date.now() + (timeout * 60 * 1000);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        username: user.username,
        expiresAt: newExpiry
      }));
      setTimeRemaining(timeout * 60);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isFirstTimeSetup,
      login,
      logout,
      setupFirstUser,
      changePassword,
      updateSessionTimeout,
      timeRemaining
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
