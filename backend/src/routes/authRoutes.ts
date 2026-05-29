import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  findUserByEmail,
  getAllUsers,
  findUserById,
  updateUserBalance
} from '../utils/userDb';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

const getDbPath = () => {
  const defaultPath = path.join(__dirname, '../data/users.json');
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  const cwdSrcPath = path.join(process.cwd(), 'src/data/users.json');
  if (fs.existsSync(cwdSrcPath)) {
    return cwdSrcPath;
  }
  const cwdBackendSrcPath = path.join(process.cwd(), 'backend/src/data/users.json');
  if (fs.existsSync(cwdBackendSrcPath)) {
    return cwdBackendSrcPath;
  }
  const fallbackPath = path.join(__dirname, '../../src/data/users.json');
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }
  return defaultPath;
};
const USER_DB_PATH = getDbPath();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Read current users from JSON file
    let users = [];
    try {
      const fileContent = fs.readFileSync(USER_DB_PATH, 'utf-8');
      users = JSON.parse(fileContent);
    } catch (err) {
      // File doesn't exist or is empty, start with empty array
      users = [];
    }

    // Check if user already exists
    const existingUser = users.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user object with raw password for local testing
    // In production, you should hash the password with bcrypt
    const newUser = {
      id: uuidv4(),
      email,
      password: password, // Storing raw password for local testing visibility
      role: 'user',
      balance: 0,
      createdAt: new Date().toISOString()
    };

    // Add new user to array
    users.push(newUser);

    // Write updated users array to JSON file synchronously
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
    console.log(`✅ User registered successfully: ${email}`);
    console.log(`📁 File updated at: ${USER_DB_PATH}`);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'supersecretjwt',
      { expiresIn: '24h' }
    );

    // Return token and user info (without password)
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Read users from JSON file
    let users = [];
    try {
      const fileContent = fs.readFileSync(USER_DB_PATH, 'utf-8');
      users = JSON.parse(fileContent);
    } catch (err) {
      return res.status(500).json({ error: 'Could not read user database' });
    }

    // Find user by email
    const user = users.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare passwords: use bcrypt.compare if stored password is a hash (starts with "$2"), otherwise direct strict equality check
    let isMatch = false;
    if (user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwt',
      { expiresIn: '24h' }
    );

    // Return token and user info (without password)
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset user's password
 * Receives: { email, newPassword }
 */
router.post('/reset-password', (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Read users from JSON file
    let users = [];
    try {
      const fileContent = fs.readFileSync(USER_DB_PATH, 'utf-8');
      users = JSON.parse(fileContent);
    } catch (err) {
      return res.status(500).json({ error: 'Could not read user database' });
    }

    // Find user by email
    const userIndex = users.findIndex(
      (u: any) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Email không tồn tại' });
    }

    // Update password
    users[userIndex].password = newPassword;

    // Write updated users array to JSON file
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
    console.log(`✅ Password reset successfully for: ${email}`);

    res.json({
      message: 'Đặt lại mật khẩu thành công',
      email
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/deposit
 * Deposit money to user's balance
 * REQUIRES: Authentication
 */
router.post('/deposit', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { amount } = req.body;

    // Validate input
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. User ID not found.' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Update user balance
    const updatedUser = await updateUserBalance(userId, amount);

    res.json({
      message: 'Deposit successful',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Deposit error:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/users
 * Get all users without passwords
 * REQUIRES: Admin role
 */
router.get('/users', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
