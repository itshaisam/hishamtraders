# Story 1.8: Shared UI Component Library

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.8
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 1.1 (Project Setup)
**Status:** ✅ Completed

---

## User Story

**As a** developer,
**I want** reusable UI components built with Tailwind CSS and Lucide icons,
**So that** the interface is consistent and development is faster.

---

## Acceptance Criteria

### Component Library
- [ ] 1. Component library created in apps/web/src/components/ui
- [ ] 2. Components implemented: Button, Input, Select, Checkbox, Modal, Table, Card, Badge, Alert, Spinner
- [ ] 3. All components use Tailwind CSS for styling
- [ ] 4. **Lucide React icons integrated and used consistently**
- [ ] 5. Components support responsive design (mobile, tablet, desktop)

### Form Components
- [ ] 6. Form components integrate with React Hook Form
- [ ] 7. Input component supports validation states (error, success)

### Data Components
- [ ] 8. Table component supports sorting, pagination, and filtering
- [ ] 9. Modal component supports customizable header, body, footer

### Visual Feedback
- [ ] 10. Badge component displays status with color coding (success=green, warning=yellow, danger=red)
- [ ] 11. Alert component displays success/error/info messages

### Type Safety
- [ ] 12. TypeScript types defined for all component props

---

## Technical Implementation

### 1. Button Component

**File:** `apps/web/src/components/ui/Button.tsx`

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-600 focus:ring-primary',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-danger',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
```

---

### 2. Input Component

**File:** `apps/web/src/components/ui/Input.tsx`

```typescript
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error
              ? 'border-danger focus:border-danger focus:ring-danger'
              : 'border-gray-300 focus:border-primary focus:ring-primary'
            }
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-1 text-sm text-danger">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

---

### 3. Select Component

**File:** `apps/web/src/components/ui/Select.tsx`

```typescript
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error
              ? 'border-danger focus:border-danger focus:ring-danger'
              : 'border-gray-300 focus:border-primary focus:ring-primary'
            }
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-1 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
```

---

### 4. Modal Component

**File:** `apps/web/src/components/ui/Modal.tsx`

```typescript
import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-6 border-t bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 5. Card Component

**File:** `apps/web/src/components/ui/Card.tsx`

```typescript
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`bg-white rounded-lg shadow ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
```

---

### 6. Badge Component

**File:** `apps/web/src/components/ui/Badge.tsx`

```typescript
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
}: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}
```

---

### 7. Alert Component

**File:** `apps/web/src/components/ui/Alert.tsx`

```typescript
import { ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
}: AlertProps) {
  const variants = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-400',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-400',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle,
      iconColor: 'text-yellow-400',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-400',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-md border p-4 ${config.bg} ${config.border}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={config.iconColor} size={20} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.text}`}>{title}</h3>
          )}
          <div className={`text-sm ${config.text} ${title ? 'mt-2' : ''}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${config.text} hover:bg-opacity-20 focus:outline-none`}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 8. Spinner Component

**File:** `apps/web/src/components/ui/Spinner.tsx`

```typescript
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="animate-spin text-primary" size={size} />
    </div>
  );
}
```

---

### 9. Table Component

**File:** `apps/web/src/components/ui/Table.tsx`

```typescript
import { ReactNode } from 'react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function Table({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
}: TableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-12 text-center text-gray-500">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### 10. Checkbox Component

**File:** `apps/web/src/components/ui/Checkbox.tsx`

```typescript
import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className={`
            h-4 w-4 text-primary border-gray-300 rounded
            focus:ring-primary focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {label && (
          <label className="ml-2 text-sm text-gray-900">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
```

---

### 11. Component Index (Barrel Export)

**File:** `apps/web/src/components/ui/index.ts`

```typescript
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Checkbox } from './Checkbox';
export { default as Modal } from './Modal';
export { default as Table } from './Table';
export { default as Card } from './Card';
export { default as Badge } from './Badge';
export { default as Alert } from './Alert';
export { default as Spinner } from './Spinner';
```

---

## Usage Examples

### Button Usage

```typescript
import { Button } from '../components/ui';
import { Plus } from 'lucide-react';

<Button variant="primary" size="md">
  Save
</Button>

<Button variant="danger" loading={isSubmitting}>
  Delete
</Button>

<Button variant="secondary" icon={<Plus size={20} />}>
  Add User
</Button>
```

### Input Usage

```typescript
import { Input } from '../components/ui';

<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
  error={errors.email?.message}
  {...register('email')}
/>
```

### Modal Usage

```typescript
import { Modal, Button } from '../components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add User"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Save
      </Button>
    </>
  }
>
  <form>
    {/* Form content */}
  </form>
</Modal>
```

---

## Testing Checklist

- [ ] Button renders with all variants (primary, secondary, danger, ghost)
- [ ] Button shows loading spinner when loading prop is true
- [ ] Input displays error message correctly
- [ ] Select renders options correctly
- [ ] Modal opens and closes correctly
- [ ] Modal backdrop closes modal when clicked
- [ ] Card renders with different padding options
- [ ] Badge displays with correct colors for each variant
- [ ] Alert shows correct icon for each variant
- [ ] Table displays data correctly
- [ ] Table shows empty state when no data
- [ ] Checkbox works with React Hook Form
- [ ] All components are responsive
- [ ] TypeScript types work correctly

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All 10 components implemented
- [ ] Components use Tailwind CSS
- [ ] Lucide icons integrated
- [ ] TypeScript types defined
- [ ] Components work with React Hook Form
- [ ] Responsive design implemented
- [ ] Barrel export (index.ts) created
- [ ] Usage examples documented
- [ ] Components tested
- [ ] Code reviewed and approved

---

**Related Documents:**
- [Frontend Architecture](../architecture/front-end-architecture.md)
- [Tech Stack](../architecture/tech-stack.md)
