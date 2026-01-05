import bcrypt from 'bcryptjs';
import { validatePassword as evaluatePassword } from '@/lib/security/validation';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with 12 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const result = evaluatePassword(password);
  return {
    isValid: result.isValid,
    errors: result.errors,
  };
}
