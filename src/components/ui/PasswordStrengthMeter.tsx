'use client';

import { validatePassword } from '@/lib/security/validation';

const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const validation = validatePassword(password || '');
  const score = Math.min(validation.score ?? 0, strengthLabels.length - 1);
  const percentage = ((validation.score ?? 0) / (strengthLabels.length - 1)) * 100;

  if (!password) {
    return (
      <p className="mt-2 text-sm text-gray-500">
        Use at least 8 characters with uppercase, number, and symbol.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Password strength</span>
        <span className="font-semibold text-gray-700">{strengthLabels[score]}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            percentage < 40
              ? 'bg-red-500'
              : percentage < 70
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {!validation.isValid && validation.errors.length > 0 && (
        <ul className="mt-2 text-xs text-red-600 list-disc list-inside space-y-1">
          {validation.errors.slice(0, 2).map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}










