import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const getDbPath = () => {
  const defaultPath = path.join(__dirname, '../data/users.json');
  if (existsSync(defaultPath)) {
    return defaultPath;
  }
  const cwdSrcPath = path.join(process.cwd(), 'src/data/users.json');
  if (existsSync(cwdSrcPath)) {
    return cwdSrcPath;
  }
  const cwdBackendSrcPath = path.join(process.cwd(), 'backend/src/data/users.json');
  if (existsSync(cwdBackendSrcPath)) {
    return cwdBackendSrcPath;
  }
  const fallbackPath = path.join(__dirname, '../../src/data/users.json');
  if (existsSync(fallbackPath)) {
    return fallbackPath;
  }
  return defaultPath;
};
const USER_DB_PATH = getDbPath();

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
  balance: number;
}

/**
 * Read the users database from JSON file
 * Returns an empty array if the file doesn't exist
 */
export async function readUsersDb(): Promise<User[]> {
  try {
    const data = await fs.readFile(USER_DB_PATH, 'utf-8');
    return JSON.parse(data) as User[];
  } catch (error: any) {
    // If file doesn't exist, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    // For other errors, log and rethrow
    console.error('Error reading users database:', error);
    throw error;
  }
}

/**
 * Write the users database to JSON file
 */
export async function writeUsersDb(users: User[]): Promise<void> {
  try {
    await fs.writeFile(USER_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing users database:', error);
    throw error;
  }
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await readUsersDb();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<User | undefined> {
  const users = await readUsersDb();
  return users.find(user => user.id === id);
}

/**
 * Create a new user
 */
export async function createUser(user: User): Promise<User> {
  const users = await readUsersDb();
  users.push(user);
  await writeUsersDb(users);
  return user;
}

/**
 * Get all users without passwords
 */
export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
  const users = await readUsersDb();
  return users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

/**
 * Update user balance
 */
export async function updateUserBalance(userId: string, amount: number): Promise<Omit<User, 'password'>> {
  const users = await readUsersDb();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  // Add amount to current balance
  users[userIndex].balance += amount;
  
  // Save updated users array
  await writeUsersDb(users);
  
  // Return updated user without password
  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword as Omit<User, 'password'>;
}
