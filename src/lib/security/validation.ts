import validator from 'validator';
import { isCommonPassword } from './common-passwords';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  score?: number;
}

const PASSWORD_REQUIREMENTS = [
  { test: (value: string) => value.length >= 8, error: 'Password must be at least 8 characters' },
  { test: (value: string) => /[A-Z]/.test(value), error: 'Password must contain an uppercase letter' },
  { test: (value: string) => /[a-z]/.test(value), error: 'Password must contain a lowercase letter' },
  { test: (value: string) => /[0-9]/.test(value), error: 'Password must contain a number' },
  {
    test: (value: string) => /[!@#$%^&*()[\]{};:'",.<>/?\\|`~+=_-]/.test(value),
    error: 'Password must contain a special character',
  },
];

export function ensureString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  return validator.escape(value);
}

export function isValidEmail(email: string): boolean {
  return validator.isEmail(email || '');
}

export function isValidUUID(id: string): boolean {
  return validator.isUUID(id || '', 4);
}

// Prisma uses CUID format by default (e.g., "cmill3mzj000295sscdq5dkiy")
// CUIDs are 25 characters long and start with 'c'
export function isValidCUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // CUID format: starts with 'c', followed by 24 alphanumeric characters
  return /^c[a-z0-9]{24}$/i.test(id);
}

// Validate either UUID or CUID
export function isValidID(id: string): boolean {
  return isValidUUID(id) || isValidCUID(id);
}

export function isValidPhone(phone: string): boolean {
  return validator.isMobilePhone(phone || '', 'any', { strictMode: false });
}

export function validateName(name: string): boolean {
  return Boolean(name && validator.isLength(name, { min: 2, max: 120 }));
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  let score = 0;

  PASSWORD_REQUIREMENTS.forEach((requirement) => {
    if (!requirement.test(password)) {
      errors.push(requirement.error);
    } else {
      score += 1;
    }
  });

  if (isCommonPassword(password)) {
    errors.push('Password is too common');
  } else {
    score += 1;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, PASSWORD_REQUIREMENTS.length + 1),
  };
}

export function validateBudgetRange(min?: number, max?: number): ValidationResult {
  const errors: string[] = [];
  if (typeof min === 'number' && min < 0) {
    errors.push('Budget minimum must be positive');
  }
  if (typeof max === 'number' && max < 0) {
    errors.push('Budget maximum must be positive');
  }
  if (typeof min === 'number' && typeof max === 'number' && max <= min) {
    errors.push('Budget maximum must be greater than minimum');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEnumValue<T extends object>(
  enumObject: T,
  value: unknown,
  _field: string
): value is T[keyof T] {
  if (!value) return false;
  return Object.values(enumObject).includes(value as T[keyof T]);
}

export function validateArrayMaxLength(value: unknown[], max = 20): boolean {
  if (!Array.isArray(value)) return false;
  if (value.length > max) return false;
  return value.every((item) => typeof item === 'string' && validator.isLength(item, { min: 1, max: 120 }));
}

export function validateNumeric(value: unknown, options?: validator.IsNumericOptions): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return validator.isNumeric(value, options);
  return false;
}

export function sanitizeAndValidateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }
  const trimmed = validator.trim(email);
  const normalized = validator.normalizeEmail(trimmed, { gmail_remove_dots: false });
  if (!normalized || !isValidEmail(normalized)) {
    throw new Error('Invalid email format');
  }
  return normalized.toLowerCase();
}


