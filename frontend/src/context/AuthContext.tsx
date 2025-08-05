import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getILoStatus, authAPI, getAuthToken, setAuthToken } from '../api';

interface User {
  id: string;
  username: string;
  sessionTimeout: number;
  isDefault?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  needsInitialSetup: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupFirstUser: (username: string, password: string) => Promise<boolean>;
  createUser: (username: string, password: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getAllUsers: () => Promise<User[]>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  updateSessionTimeout: (timeout: number) => void;
  extendSession: () => void;
  timeRemaining: number;
  completeInitialSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Check authentication status on startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('Checking authentication status...');
      
      // Check if we have a valid token
      const token = getAuthToken();
      if (token) {
        try {
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
          console.log('Valid session found, user authenticated:', currentUser.username);
        } catch (error) {
          console.log('Token invalid or expired, clearing auth');
          setAuthToken(null);
        }
      }
      
      // Check if initial setup is needed
      try {
        const authStatus = await authAPI.getStatus();
        
        console.log('Auth status:', authStatus);
        
        // Need setup if:
        // 1. API explicitly says setup is required OR
        // 2. Default admin exists (legacy check) OR  
        // 3. No users exist at all (empty system)
        const needsSetup = authStatus.requiresSetup || 
                          authStatus.defaultAdminExists || 
                          authStatus.userCount === 0 ||
                          !authStatus.hasUsers;
        setNeedsInitialSetup(needsSetup);
        console.log('Needs initial setup:', needsSetup);
      } catch (error) {
        console.error('Error checking setup status:', error);
        // On fresh install or API error, assume setup is needed
        setNeedsInitialSetup(true);
      }
    };

    checkAuthStatus();
  }, []);

  // Session timeout countdown
  useEffect(() => {
    if (!isAuthenticated || !user || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev: number) => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, user, timeRemaining]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt:', { username });
      
      const response = await authAPI.login(username, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Calculate time remaining from expires timestamp
        const expiresAt = response.expiresAt || (Date.now() + (response.user.sessionTimeout * 60 * 1000));
        setTimeRemaining(Math.floor((expiresAt - Date.now()) / 1000));
        
        // Check if initial setup is still needed
        try {
          const authStatus = await authAPI.getStatus();
          const iloStatus = await getILoStatus();
          const needsSetup = !iloStatus.configured || response.user.isDefault;
          setNeedsInitialSetup(needsSetup);
        } catch (error) {
          console.error('Error checking setup status after login:', error);
          setNeedsInitialSetup(response.user.isDefault || false);
        }
        
        console.log('Login successful for user:', response.user.username);
        return true;
      }
      
      console.log('Login failed: Invalid response');
      return false;
    } catch (error: any) {
      console.error('Login error:', error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setNeedsInitialSetup(false);
      setTimeRemaining(0);
      console.log('User logged out');
    }
  };

  const setupFirstUser = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Setting up first user:', { username });
      
      const response = await authAPI.setup(username, password);
      
      if (response.success) {
        console.log('First user setup completed successfully');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Setup error:', error.message);
      return false;
    }
  };

  const createUser = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Creating new user:', { username });
      
      const response = await authAPI.createUser(username, password);
      
      if (response.success) {
        console.log('User created successfully');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Create user error:', error.message);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await authAPI.deleteUser(userId);
      
      if (response.success) {
        console.log('User deleted successfully');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Delete user error:', error.message);
      return false;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      return await authAPI.getAllUsers();
    } catch (error: any) {
      console.error('Get users error:', error.message);
      return [];
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      console.log('Changing password for user:', user?.username);
      
      const response = await authAPI.changePassword(oldPassword, newPassword);
      
      if (response.success) {
        console.log('Password changed successfully');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Change password error:', error.message);
      return false;
    }
  };

  const updateSessionTimeout = (timeout: number) => {
    if (!user) return;

    const updatedUser = { ...user, sessionTimeout: timeout };
    setUser(updatedUser);
    
    // Update time remaining
    if (isAuthenticated) {
      setTimeRemaining(timeout * 60);
    }
  };

  const extendSession = () => {
    if (!user || !isAuthenticated) return;

    // Reset the countdown timer to full session timeout
    setTimeRemaining(user.sessionTimeout * 60);
    console.log('Session extended');
  };

  const completeInitialSetup = () => {
    setNeedsInitialSetup(false);
    console.log('Initial setup completed. User will now be redirected to login page.');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      needsInitialSetup,
      login,
      logout,
      setupFirstUser,
      createUser,
      deleteUser,
      getAllUsers,
      changePassword,
      updateSessionTimeout,
      extendSession,
      timeRemaining,
      completeInitialSetup
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
