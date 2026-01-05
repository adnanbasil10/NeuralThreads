'use client';

import { forwardRef, useState, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Base input props
interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

// Text Input
interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>, BaseInputProps {}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, success, icon, className = '', type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full min-h-[48px] px-4 py-3 rounded-xl border bg-white
              transition-all duration-200 text-base
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${isPassword || success || error ? 'pr-10' : ''}
              ${error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : success 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
              }
            `}
            {...props}
          />
          
          {/* Right icon area */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            {!isPassword && success && (
              <Check className="w-4 h-4 text-green-500" />
            )}
            {error && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        
        {/* Error or hint message */}
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);
TextInput.displayName = 'TextInput';

// Textarea
interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>, BaseInputProps {
  maxLength?: number;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, success, maxLength, showCount, className = '', ...props }, ref) => {
    const [charCount, setCharCount] = useState(0);

    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <textarea
            ref={ref}
            maxLength={maxLength}
            onChange={(e) => {
              setCharCount(e.target.value.length);
              props.onChange?.(e);
            }}
            className={`
              w-full min-h-[120px] px-4 py-3 rounded-xl border bg-white
              transition-all duration-200 text-base resize-y
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : success 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
              }
            `}
            {...props}
          />
          
          {success && (
            <Check className="absolute right-3 top-3 w-4 h-4 text-green-500" />
          )}
        </div>
        
        <div className="flex justify-between mt-1.5">
          {error ? (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          ) : hint ? (
            <p className="text-sm text-gray-500">{hint}</p>
          ) : <span />}
          
          {showCount && maxLength && (
            <span className={`text-sm ${charCount > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-400'}`}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// Select
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'className'>, BaseInputProps {
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, success, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full min-h-[48px] px-4 py-3 rounded-xl border bg-white
              transition-all duration-200 text-base appearance-none
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : success 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
              }
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Chevron */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

// Checkbox
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  label: string;
  description?: string;
  error?: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', ...props }, ref) => {
    return (
      <div className={className}>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              className="peer sr-only"
              {...props}
            />
            <div className={`
              w-6 h-6 rounded-lg border-2 transition-all
              peer-focus:ring-2 peer-focus:ring-indigo-200 peer-focus:ring-offset-0
              peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-500 peer-checked:border-transparent
              peer-disabled:bg-gray-100 peer-disabled:border-gray-200
              ${error ? 'border-red-300' : 'border-gray-300 group-hover:border-gray-400'}
            `}>
              <Check className="w-4 h-4 text-white absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </label>
        
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1 ml-9">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// Radio Group
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

export function RadioGroup({ name, label, options, value, onChange, error, className = '' }: RadioGroupProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
              ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300'}
              ${value === option.value 
                ? 'border-indigo-500 bg-indigo-50' 
                : error 
                ? 'border-red-200' 
                : 'border-gray-200'
              }
            `}
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={option.disabled}
                className="peer sr-only"
              />
              <div className={`
                w-5 h-5 rounded-full border-2 transition-all
                peer-checked:border-indigo-500
                ${error ? 'border-red-300' : 'border-gray-300'}
              `}>
                <div className={`
                  w-2.5 h-2.5 rounded-full bg-indigo-500 absolute top-1 left-1
                  scale-0 peer-checked:scale-100 transition-transform
                `} />
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
              {option.description && (
                <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

export default TextInput;









