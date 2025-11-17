import { ReactNode } from 'react';

interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * FormField component - wraps form inputs with consistent label, error, and helper text styling
 * Reduces boilerplate when building forms
 *
 * Usage:
 * <FormField label="Email" error={errors.email?.message}>
 *   <input {...register('email')} />
 * </FormField>
 */
export default function FormField({
  label,
  error,
  helperText,
  required = false,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div>{children}</div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
