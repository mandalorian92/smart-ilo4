import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getILoStatus } from '../api';

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
  needsInitialSetup: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupFirstUser: (username: string, password: string) => Promise<boolean>;
  createUser: (username: string, password: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getAllUsers: () => User[];
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  updateSessionTimeout: (timeout: number) => void;
  extendSession: () => void;
  timeRemaining: number; // seconds until logout
  completeInitialSetup: () => void;
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

// Secure hash function using Web Crypto API - NO FALLBACK for security
const hashPassword = async (password: string): Promise<string> => {
  const saltedPassword = password + 'ilo4_salt';
  
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API is required for secure password hashing');
  }
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(saltedPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password securely');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Create default admin user if no users exist
  const createDefaultAdmin = async () => {
    console.log('Creating default admin user...');
    
    // Generate a more secure temporary password
    const tempPassword = 'TempAdmin!' + Math.random().toString(36).substring(2, 8);
    console.warn('🚨 SECURITY: Default admin created with temporary password:', tempPassword);
    console.warn('🚨 This password MUST be changed during initial setup!');
    
    const defaultUser: User = {
      id: 'admin',
      username: 'admin',
      createdAt: new Date().toISOString(),
      sessionTimeout: 30,
      isDefault: true
    };

    const passwordHash = await hashPassword(tempPassword);
    
    const users = { [defaultUser.id]: defaultUser };
    const passwords = { [defaultUser.id]: passwordHash };
    
    safeLocalStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    safeLocalStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
    
    // Store the temporary password for initial setup (will be cleared after use)
    safeLocalStorage.setItem('temp_admin_password', tempPassword);
    
    console.log('Default admin user created successfully');
    return defaultUser;
  };

  // Check if this is the first time setup
  useEffect(() => {
    const checkFirstTimeSetup = async () => {
      console.log('Checking for existing users...');
      const usersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      
      // Always ensure default admin exists
      if (!usersData) {
        console.log('No existing users found, creating default admin...');
        await createDefaultAdmin();
      }

      // Check if initial setup is needed (iLO configuration)
      try {
        console.log('Fetching iLO status...');
        const iloStatus = await getILoStatus();
        console.log('iLO status response:', iloStatus);
        if (!iloStatus.configured) {
          console.log('iLO not configured, requiring initial setup');
          setNeedsInitialSetup(true);
          return; // Skip session check if initial setup is needed
        }
        console.log('iLO already configured');
        setNeedsInitialSetup(false);
      } catch (error) {
        console.error('Error checking iLO status:', error);
        // If we can't check iLO status, assume initial setup is needed
        console.log('Setting needsInitialSetup to true due to error');
        setNeedsInitialSetup(true);
        return;
      }

      // Check for active session only if initial setup is not needed
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
      setTimeRemaining((prev: number) => {
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
      
      // Get existing users and passwords
      const existingUsersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      const existingPasswordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
      
      if (!existingUsersData || !existingPasswordsData) {
        console.error('No existing user data found');
        return false;
      }
      
      const users = JSON.parse(existingUsersData);
      const passwords = JSON.parse(existingPasswordsData);
      
      // Find the admin user
      const adminUserId = Object.keys(users).find(userId => users[userId].username === username);
      
      if (!adminUserId) {
        console.error('Admin user not found');
        return false;
      }
      
      // Update the admin user - remove isDefault flag and update password
      const updatedUser: User = {
        ...users[adminUserId],
        isDefault: false // Remove default flag - password has been changed
      };
      
      users[adminUserId] = updatedUser;
      passwords[adminUserId] = passwordHash;

      // Store updated data
      try {
        safeLocalStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        safeLocalStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
        
        // Clear the temporary password - it's no longer needed
        safeLocalStorage.removeItem('temp_admin_password');
        
        console.log('Admin user updated successfully - password changed, default flag removed');
      } catch (storageError) {
        console.error('Failed to store updated user data:', storageError);
        return false;
      }
      
      // Clear any existing session data to ensure clean state
      safeSessionStorage.removeItem(SESSION_STORAGE_KEY);
      
      console.log('First user setup completed successfully - user must re-login with new credentials');
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
      console.log('Login attempt:', { username, password: password.substring(0, 3) + '...' });
      
      const usersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
      const passwordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
      
      console.log('Users data exists:', !!usersData);
      console.log('Passwords data exists:', !!passwordsData);
      
      if (!usersData || !passwordsData) {
        console.log('No user data found - login failed');
        return false;
      }

      const users = JSON.parse(usersData);
      const passwords = JSON.parse(passwordsData);
      const passwordHash = await hashPassword(password);
      
      console.log('Available users:', Object.keys(users));
      console.log('Password hash generated:', passwordHash.substring(0, 8) + '...');
      
      // Find user by username
      const foundUserId = Object.keys(users).find(userId => {
        const userMatch = users[userId].username === username;
        const passwordMatch = passwords[userId] === passwordHash;
        console.log(`Checking user ${userId}: username match=${userMatch}, password match=${passwordMatch}`);
        console.log(`  - Stored password hash: ${passwords[userId]?.substring(0, 8)}...`);
        console.log(`  - Input password hash: ${passwordHash.substring(0, 8)}...`);
        console.log(`  - User isDefault: ${users[userId].isDefault}`);
        return userMatch && passwordMatch;
      });
      
      console.log('Found user ID:', foundUserId);
      
      if (foundUserId) {
        const foundUser = users[foundUserId];
        
        // Security check: For default users, verify they're using the temporary password
        if (foundUser.isDefault) {
          const tempPassword = safeLocalStorage.getItem('temp_admin_password');
          console.log('User is marked as default, checking temp password:', !!tempPassword);
          if (!tempPassword || password !== tempPassword) {
            console.log('Default user attempted login without valid temporary password - access denied');
            return false;
          }
        } else {
          console.log('User is not default, proceeding with normal authentication');
        }
        
        setUser(foundUser);
        setIsAuthenticated(true);
        
        // Check if initial setup is needed
        try {
          const iloStatus = await getILoStatus();
          
          // If iLO is not configured, always require initial setup
          if (!iloStatus.configured) {
            setNeedsInitialSetup(true);
          } else {
            // iLO is configured - only require setup if user is still default
            if (foundUser.isDefault) {
              setNeedsInitialSetup(true);
            } else {
              setNeedsInitialSetup(false);
            }
          }
        } catch (error) {
          console.error('Error checking iLO status:', error);
          // If we can't check iLO status, only require setup for default users
          if (foundUser.isDefault) {
            setNeedsInitialSetup(true);
          } else {
            setNeedsInitialSetup(false);
          }
        }
        
        // Create session
        const sessionExpiry = Date.now() + (foundUser.sessionTimeout * 60 * 1000);
        safeSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          userId: foundUserId,
          username,
          expiresAt: sessionExpiry
        }));
        
        setTimeRemaining(foundUser.sessionTimeout * 60);
        console.log('Login successful for user:', foundUser.username);
        return true;
      } else {
        console.log('Login failed: No matching user found');
        console.log('Available users:', Object.keys(users).map(id => ({
          id,
          username: users[id].username,
          isDefault: users[id].isDefault
        })));
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
    setNeedsInitialSetup(false);
    setTimeRemaining(0);
    safeSessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const completeInitialSetup = () => {
    setNeedsInitialSetup(false);
    
    // After initial setup is complete, user should go to login page
    // Do not automatically authenticate - let them login normally
    console.log('Initial setup completed. User will now be redirected to login page.');
  };

  // Development helper function to debug authentication state
  const debugAuthState = () => {
    console.log('=== Authentication Debug Info ===');
    console.log('Current user:', user);
    console.log('Is authenticated:', isAuthenticated);
    
    const usersData = safeLocalStorage.getItem(USERS_STORAGE_KEY);
    const passwordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
    
    if (usersData) {
      const users = JSON.parse(usersData);
      console.log('Stored users:', Object.keys(users).map(id => ({
        id,
        username: users[id].username,
        isDefault: users[id].isDefault
      })));
    }
    
    if (passwordsData) {
      const passwords = JSON.parse(passwordsData);
      console.log('Password hashes:', Object.keys(passwords).map(id => ({
        id,
        hash: passwords[id]?.substring(0, 8) + '...'
      })));
    }
    
    const sessionData = safeSessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionData) {
      console.log('Session data:', JSON.parse(sessionData));
    }
    
    console.log('=== End Debug Info ===');
  };

  // Development helper function to clear all cached data
  const clearStorageData = () => {
    // Clear all stored data to simulate first-time setup
    safeLocalStorage.removeItem(USERS_STORAGE_KEY);
    safeLocalStorage.removeItem(PASSWORDS_STORAGE_KEY);
    safeLocalStorage.removeItem('temp_admin_password');
    safeSessionStorage.removeItem(SESSION_STORAGE_KEY);
    
    // Also clear fallback storage
    fallbackStorage.data.clear();
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    setNeedsInitialSetup(true);
    setTimeRemaining(0);
    
    console.log('All storage data cleared - UI will behave as first-time setup');
  };

  // Development keyboard shortcuts to clear storage and debug auth state
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        if (confirm('Clear all cached data and reset to first-time setup?')) {
          clearStorageData();
          window.location.reload();
        }
      }
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        debugAuthState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      console.log('Changing password for user:', user?.username);
      
      if (!user) {
        console.error('No user logged in');
        return false;
      }
      
      const passwordsData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
      if (!passwordsData) {
        console.error('No passwords data found');
        return false;
      }
      
      const passwords = JSON.parse(passwordsData);
      const oldPasswordHash = await hashPassword(oldPassword);
      const newPasswordHash = await hashPassword(newPassword);
      
      console.log('User ID:', user.id);
      console.log('Stored password hash:', passwords[user.id]?.substring(0, 8) + '...');
      console.log('Old password hash:', oldPasswordHash.substring(0, 8) + '...');
      console.log('New password hash:', newPasswordHash.substring(0, 8) + '...');
      
      if (passwords[user.id] !== oldPasswordHash) {
        console.error('Old password does not match stored password');
        return false;
      }
      
      // Update the password hash
      passwords[user.id] = newPasswordHash;
      
      // Save the updated passwords
      try {
        safeLocalStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
        console.log('Password updated successfully in storage');
        
        // Verify the password was actually saved
        const verifyData = safeLocalStorage.getItem(PASSWORDS_STORAGE_KEY);
        if (verifyData) {
          const verifyPasswords = JSON.parse(verifyData);
          if (verifyPasswords[user.id] === newPasswordHash) {
            console.log('Password verification successful - new password saved correctly');
            return true;
          } else {
            console.error('Password verification failed - password not saved correctly');
            return false;
          }
        } else {
          console.error('Could not retrieve passwords for verification');
          return false;
        }
      } catch (storageError) {
        console.error('Failed to save updated password:', storageError);
        return false;
      }
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

  const extendSession = () => {
    if (!user || !isAuthenticated) return;

    // Extend the session by the user's configured timeout duration (default 30 minutes)
    const newExpiry = Date.now() + (user.sessionTimeout * 60 * 1000);
    safeSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      userId: user.id,
      username: user.username,
      expiresAt: newExpiry
    }));
    
    // Reset the countdown timer
    setTimeRemaining(user.sessionTimeout * 60);
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
