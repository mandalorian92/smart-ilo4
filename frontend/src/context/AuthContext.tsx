import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  createdAt: string;
  sessionTimeout: number; // in minutes
  isDefault?: boolean; // Flag for default admin user
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isFirstTimeSetup: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupFirstUser: (username: string, password: string) => Promise<boolean>;
  createUser: (username: string, password: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getAllUsers: () => User[];
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  updateSessionTimeout: (timeout: number) => void;
  timeRemaining: number; // seconds until logout
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'ilo_user_session';
const USERS_STORAGE_KEY = 'ilo_users_data';
const PASSWORDS_STORAGE_KEY = 'ilo_passwords_hash';

// Fallback storage for environments where localStorage might be restricted
const fallbackStorage = {
  data: new Map<string, string>(),
  getItem: (key: string) => fallbackStorage.data.get(key) || null,
  setItem: (key: string, value: string) => fallbackStorage.data.set(key, value),
  removeItem: (key: string) => fallbackStorage.data.delete(key)
};

// Safe storage access
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      console.warn('localStorage not available, using fallback');
      return fallbackStorage.getItem(key);
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage not available, using fallback');
      fallbackStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('localStorage not available, using fallback');
      fallbackStorage.removeItem(key);
    }
  }
};

const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      console.warn('sessionStorage not available, using fallback');
      return fallbackStorage.getItem('session_' + key);
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      console.warn('sessionStorage not available, using fallback');
      fallbackStorage.setItem('session_' + key, value);
    }
  },
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      console.warn('sessionStorage not available, using fallback');
      fallbackStorage.removeItem('session_' + key);
    }
  }
};

// Simple hash function with fallback for environments without crypto.subtle
const hashPassword = async (password: string): Promise<string> => {
  const saltedPassword = password + 'ilo4_salt';
  
  try {
    // Try using Web Crypto API if available
    if (crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(saltedPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.warn('Web Crypto API not available, using fallback hash');
  }
  
  // Fallback hash function (simple but sufficient for this use case)
  let hash = 0;
  for (let i = 0; i < saltedPassword.length; i++) {
    const char = saltedPassword.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Create default admin user if no users exist
  const createDefaultAdmin = async () => {
    console.log('Creating default admin user...');
    const defaultUser: User = {
      id: 'admin',
      username: 'admin',
      createdAt: new Date().toISOString(),
      sessionTimeout: 30,
      isDefault: true
    };

    const passwordHash = await hashPassword('Changemen0w');
    
    const users = { [defaultUser.id]: defaultUser };
    const passwords = { [defaultUser.id]: passwordHash };
    
    safeLocalStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    safeLocalStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
    
    console.log('Default admin user created successfully');
    return defaultUser;
  };

  // Check if this is the first time setup
  useEffect(() => {
    const checkFirstTimeSetup = async () => {
      console.log('Checking for existing users...');
      const usersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      
      if (!usersData) {
        console.log('No existing users found, creating default admin...');
        await createDefaultAdmin();
        setIsFirstTimeSetup(false); // No first-time setup needed since we have default admin
      } else {
        console.log('Existing users found');
        setIsFirstTimeSetup(false);
      }

      // Check for active session
      const sessionData = safeSessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData && usersData) {
        try {
          const session = JSON.parse(sessionData);
          const users = JSON.parse(usersData);
          const sessionUser = users[session.userId];
          
          if (sessionUser && session.expiresAt > Date.now()) {
            setUser(sessionUser);
            setIsAuthenticated(true);
            setTimeRemaining(Math.floor((session.expiresAt - Date.now()) / 1000));
            console.log('Valid session found, user authenticated');
          } else {
            // Session expired
            safeSessionStorage.removeItem(SESSION_STORAGE_KEY);
            console.log('Session expired, removed');
          }
        } catch (error) {
          console.error('Error parsing session data:', error);
          safeSessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    };

    checkFirstTimeSetup();
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
      console.log('Setting up first user...', { username });
      
      const passwordHash = await hashPassword(password);
      console.log('Password hashed successfully');
      
      const userId = `user_${Date.now()}`;
      const newUser: User = {
        id: userId,
        username,
        createdAt: new Date().toISOString(),
        sessionTimeout: 30 // Default 30 minutes
      };

      // Get existing users (should include default admin)
      const existingUsersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      const existingPasswordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
      
      const users = existingUsersData ? JSON.parse(existingUsersData) : {};
      const passwords = existingPasswordsData ? JSON.parse(existingPasswordsData) : {};
      
      // Add new user
      users[userId] = newUser;
      passwords[userId] = passwordHash;

      // Try to store data in localStorage
      try {
        safeLocalStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        safeLocalStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
        console.log('User data stored successfully');
      } catch (storageError) {
        console.error('Failed to store data:', storageError);
        return false;
      }
      
      setUser(newUser);
      setIsAuthenticated(true);
      setIsFirstTimeSetup(false);
      
      // Create session
      try {
        const sessionExpiry = Date.now() + (newUser.sessionTimeout * 60 * 1000);
        safeSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          userId,
          username,
          expiresAt: sessionExpiry
        }));
        console.log('Session created successfully');
      } catch (sessionError) {
        console.error('Failed to create session:', sessionError);
        // Don't return false here as the user is still created
      }
      
      setTimeRemaining(newUser.sessionTimeout * 60);
      console.log('First user setup completed successfully');
      return true;
    } catch (error) {
      console.error('Error setting up first user:', error);
      return false;
    }
  };

  const createUser = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Creating new user...', { username });
      
      const passwordHash = await hashPassword(password);
      const userId = `user_${Date.now()}`;
      
      const newUser: User = {
        id: userId,
        username,
        createdAt: new Date().toISOString(),
        sessionTimeout: 30
      };

      // Get existing users
      const existingUsersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      const existingPasswordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
      
      const users = existingUsersData ? JSON.parse(existingUsersData) : {};
      const passwords = existingPasswordsData ? JSON.parse(existingPasswordsData) : {};
      
      // Check if username already exists
      const existingUser = Object.values(users).find((u: any) => u.username === username);
      if (existingUser) {
        console.error('Username already exists');
        return false;
      }
      
      // Add new user
      users[userId] = newUser;
      passwords[userId] = passwordHash;

      safeLocalStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      safeLocalStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
      
      console.log('User created successfully');
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const usersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      const passwordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
      
      if (!usersData || !passwordsData) return false;
      
      const users = JSON.parse(usersData);
      const passwords = JSON.parse(passwordsData);
      
      // Don't allow deleting the default admin user
      if (users[userId]?.isDefault) {
        console.error('Cannot delete default admin user');
        return false;
      }
      
      // Don't allow deleting yourself
      if (user?.id === userId) {
        console.error('Cannot delete yourself');
        return false;
      }
      
      delete users[userId];
      delete passwords[userId];
      
      safeLocalStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      safeLocalStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const getAllUsers = (): User[] => {
    try {
      const usersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      if (!usersData) return [];
      
      const users = JSON.parse(usersData);
      return Object.values(users);
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const usersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      const passwordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
      
      if (!usersData || !passwordsData) {
        return false;
      }

      const users = JSON.parse(usersData);
      const passwords = JSON.parse(passwordsData);
      const passwordHash = await hashPassword(password);
      
      // Find user by username
      const foundUserId = Object.keys(users).find(userId => 
        users[userId].username === username && passwords[userId] === passwordHash
      );
      
      if (foundUserId) {
        const foundUser = users[foundUserId];
        setUser(foundUser);
        setIsAuthenticated(true);
        
        // Create session
        const sessionExpiry = Date.now() + (foundUser.sessionTimeout * 60 * 1000);
        safeSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          userId: foundUserId,
          username,
          expiresAt: sessionExpiry
        }));
        
        setTimeRemaining(foundUser.sessionTimeout * 60);
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
    safeSessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      const passwordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
      if (!passwordsData) return false;
      
      const passwords = JSON.parse(passwordsData);
      const oldPasswordHash = await hashPassword(oldPassword);
      
      if (passwords[user.id] !== oldPasswordHash) {
        return false;
      }
      
      const newPasswordHash = await hashPassword(newPassword);
      passwords[user.id] = newPasswordHash;
      
      safeLocalStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
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
    
    // Update in storage
    const usersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
    if (usersData) {
      const users = JSON.parse(usersData);
      users[user.id] = updatedUser;
      safeLocalStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    
    // Update current session if authenticated
    if (isAuthenticated) {
      const newExpiry = Date.now() + (timeout * 60 * 1000);
      safeSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        userId: user.id,
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
      createUser,
      deleteUser,
      getAllUsers,
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
