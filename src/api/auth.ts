import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

interface User {
  id: string;
  username: string;
  createdAt: string;
  sessionTimeout: number;
  isDefault?: boolean;
}

interface Session {
  userId: string;
  username: string;
  expiresAt: number;
  token: string;
}

// In-memory storage for demo (in production, use a database)
let users: Record<string, User> = {};
let passwords: Record<string, string> = {};
let sessions: Record<string, Session> = {};

// File paths for persistent storage
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const PASSWORDS_FILE = path.join(process.cwd(), 'data', 'passwords.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Load data from files
async function loadData() {
  try {
    await ensureDataDirectory();
    
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      console.log('No existing users file, starting fresh');
      users = {};
    }
    
    try {
      const passwordsData = await fs.readFile(PASSWORDS_FILE, 'utf8');
      passwords = JSON.parse(passwordsData);
    } catch (error) {
      console.log('No existing passwords file, starting fresh');
      passwords = {};
    }
    
    // Create default admin if no users exist
    if (Object.keys(users).length === 0) {
      await createDefaultAdmin();
    }
  } catch (error) {
    console.error('Error loading authentication data:', error);
  }
}

// Save data to files
async function saveData() {
  try {
    await ensureDataDirectory();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    await fs.writeFile(PASSWORDS_FILE, JSON.stringify(passwords, null, 2));
  } catch (error) {
    console.error('Error saving authentication data:', error);
  }
}

// Create default admin user
async function createDefaultAdmin() {
  const tempPassword = 'TempAdmin!' + Math.random().toString(36).substring(2, 8);
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  
  const defaultUser: User = {
    id: 'admin',
    username: 'admin',
    createdAt: new Date().toISOString(),
    sessionTimeout: 30,
    isDefault: true
  };
  
  users['admin'] = defaultUser;
  passwords['admin'] = passwordHash;
  
  await saveData();
  
  console.warn('🚨 SECURITY: Default admin created with temporary password:', tempPassword);
  console.warn('🚨 This password MUST be changed during initial setup!');
  
  // Store temp password in a file for initial setup
  try {
    await fs.writeFile(path.join(process.cwd(), 'data', 'temp_password.txt'), tempPassword);
  } catch (error) {
    console.error('Could not save temporary password file');
  }
}

// Generate secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to validate session
function validateSession(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No valid session token provided' });
  }
  
  const token = authHeader.substring(7);
  const session = sessions[token];
  
  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      delete sessions[token];
    }
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  
  // Add user info to request
  (req as any).user = users[session.userId];
  (req as any).session = session;
  next();
}

// Clean up expired sessions
function cleanupExpiredSessions() {
  const now = Date.now();
  Object.keys(sessions).forEach(token => {
    if (sessions[token].expiresAt < now) {
      delete sessions[token];
    }
  });
}

// Clean up expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

// Routes

// Get authentication status
router.get('/status', (req: Request, res: Response) => {
  res.json({ 
    hasUsers: Object.keys(users).length > 0,
    defaultAdminExists: users['admin']?.isDefault === true
  });
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    const userId = Object.keys(users).find(id => users[id].username === username);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[userId];
    const storedHash = passwords[userId];
    
    // For default users, check temp password first
    if (user.isDefault) {
      try {
        const tempPassword = await fs.readFile(path.join(process.cwd(), 'data', 'temp_password.txt'), 'utf8');
        if (password !== tempPassword.trim()) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Default admin setup required' });
      }
    } else {
      // Verify password with bcrypt
      const isValid = await bcrypt.compare(password, storedHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
    
    // Create session
    const token = generateSessionToken();
    const expiresAt = Date.now() + (user.sessionTimeout * 60 * 1000);
    
    sessions[token] = {
      userId,
      username: user.username,
      expiresAt,
      token
    };
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        sessionTimeout: user.sessionTimeout,
        isDefault: user.isDefault
      },
      expiresAt
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup first user (change default admin password)
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if this is for the default admin
    if (username !== 'admin' || !users['admin']?.isDefault) {
      return res.status(400).json({ error: 'Setup can only be done for default admin user' });
    }
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Update user
    users['admin'] = {
      ...users['admin'],
      isDefault: false
    };
    passwords['admin'] = passwordHash;
    
    await saveData();
    
    // Remove temp password file
    try {
      await fs.unlink(path.join(process.cwd(), 'data', 'temp_password.txt'));
    } catch (error) {
      // File might not exist
    }
    
    res.json({ success: true, message: 'Admin password updated successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', validateSession, (req: Request, res: Response) => {
  const session = (req as any).session;
  delete sessions[session.token];
  res.json({ success: true });
});

// Get current user
router.get('/me', validateSession, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    username: user.username,
    sessionTimeout: user.sessionTimeout,
    isDefault: user.isDefault
  });
});

// Create new user
router.post('/users', validateSession, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const currentUser = (req as any).user;
    
    // Only non-default users can create other users
    if (currentUser.isDefault) {
      return res.status(403).json({ error: 'Complete initial setup first' });
    }
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if username already exists
    const existingUser = Object.values(users).find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Create new user
    const userId = `user_${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 12);
    
    const newUser: User = {
      id: userId,
      username,
      createdAt: new Date().toISOString(),
      sessionTimeout: 30
    };
    
    users[userId] = newUser;
    passwords[userId] = passwordHash;
    
    await saveData();
    
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', validateSession, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  
  if (currentUser.isDefault) {
    return res.status(403).json({ error: 'Complete initial setup first' });
  }
  
  const userList = Object.values(users).map(user => ({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    sessionTimeout: user.sessionTimeout,
    isDefault: user.isDefault
  }));
  
  res.json(userList);
});

// Change password
router.post('/change-password', validateSession, async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = (req as any).user;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new passwords are required' });
    }
    
    // Verify old password
    const storedHash = passwords[user.id];
    const isValid = await bcrypt.compare(oldPassword, storedHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    passwords[user.id] = newPasswordHash;
    
    await saveData();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:userId', validateSession, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = (req as any).user;
    
    if (currentUser.isDefault) {
      return res.status(403).json({ error: 'Complete initial setup first' });
    }
    
    if (userId === currentUser.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    if (users[userId]?.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default admin user' });
    }
    
    if (!users[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    delete users[userId];
    delete passwords[userId];
    
    // Remove any active sessions for this user
    Object.keys(sessions).forEach(token => {
      if (sessions[token].userId === userId) {
        delete sessions[token];
      }
    });
    
    await saveData();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize data on startup
loadData();

export default router;
