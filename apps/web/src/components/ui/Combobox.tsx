import { forwardRef, useState, useMemo, useRef } from 'react';
import { Combobox as HeadlessCombobox } from '@headlessui/react';
import { ChevronDown, X, Check } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string | null) => void;
  isMulti?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
}

const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      label,
      placeholder = 'Select an option...',
      error,
      helperText,
      options,
      value = '',
      onChange,
      isMulti = false,
      isLoading = false,
      disabled = false,
      required = false,
      searchable = true,
      clearable = true,
      className = '',
    },
    ref
  ) => {
    const [query, setQuery] = useState('');
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
      if (!query) return options;
      return options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase())
      );
    }, [query, options]);

    const selectedLabel = useMemo(() => {
      const selected = options.find((opt) => opt.value === value);
      return selected?.label || '';
    }, [value, options]);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}

        <HeadlessCombobox value={value} onChange={onChange} disabled={disabled || isLoading}>
          {({ open }) => (
            <div className="relative">
              {/* Input wrapper — clicking opens the dropdown */}
              <div
                className={`
                  relative w-full border rounded-md shadow-sm
                  flex items-center px-3 py-2 gap-2
                  transition-colors cursor-pointer
                  ${
                    error
                      ? 'border-red-600 bg-red-50 focus-within:ring-2 focus-within:ring-red-600'
                      : 'border-gray-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600'
                  }
                  ${(disabled || isLoading) ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}
                  ${className}
                `}
                onClick={() => {
                  if (!disabled && !isLoading) {
                    buttonRef.current?.click();
                  }
                }}
              >
                {/* Input field */}
                <HeadlessCombobox.Input
                  ref={ref}
                  className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-400 disabled:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                  placeholder={placeholder}
                  displayValue={(val: string) => selectedLabel}
                  onChange={(event) => {
                    if (searchable) setQuery(event.target.value);
                  }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (!open) buttonRef.current?.click();
                  }}
                  disabled={disabled || isLoading}
                />

                {/* Clear button */}
                {clearable && value && !disabled && !isLoading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange?.('');
                      setQuery('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Loading or chevron icon */}
                {isLoading ? (
                  <div className="animate-spin">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                ) : (
                  <HeadlessCombobox.Button ref={buttonRef} className="flex items-center">
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </HeadlessCombobox.Button>
                )}
              </div>

              {/* Options dropdown */}
              <HeadlessCombobox.Options
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto py-1"
              >
                {filteredOptions.length === 0 && query !== '' ? (
                  <div className="px-3 py-2 text-center text-gray-500 text-sm">
                    No results found for &quot;{query}&quot;
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <HeadlessCombobox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) => `
                        px-3 py-2 cursor-pointer select-none flex items-center justify-between
                        ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                        ${value === option.value ? 'font-semibold bg-blue-50' : ''}
                      `}
                    >
                      <span>{option.label}</span>
                      {value === option.value && (
                        <Check size={16} className="text-blue-600 flex-shrink-0" />
                      )}
                    </HeadlessCombobox.Option>
                  ))
                )}
              </HeadlessCombobox.Options>
            </div>
          )}
        </HeadlessCombobox>

        {/* Error message */}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {/* Helper text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Combobox.displayName = 'Combobox';

export default Combobox;
