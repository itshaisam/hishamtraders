# HishamTraders Design System Guide

A comprehensive guide for building consistent, accessible, and user-friendly interfaces across all modules.

---

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [UI Component Library](#ui-component-library)
4. [Page Layout Patterns](#page-layout-patterns)
5. [Form Patterns](#form-patterns)
6. [Navigation Patterns](#navigation-patterns)
7. [Color Palette](#color-palette)
8. [Typography](#typography)
9. [Spacing & Layout](#spacing--layout)
10. [Forms: Best Practices](#forms-best-practices)
11. [Common Pitfalls](#common-pitfalls)
12. [Future Module Checklist](#future-module-checklist)

---

## Overview

This design system provides a unified, clean, and modern UI pattern for all HishamTraders modules. It eliminates modal pop-ups in favor of dedicated pages, uses searchable dropdowns for better UX, and ensures consistency across all features.

**Key Changes:**
- ✅ **No modals** - Use full pages for create/edit actions
- ✅ **Searchable dropdowns** - Replace native selects with Combobox
- ✅ **Reusable form components** - FormField wrapper reduces boilerplate
- ✅ **Component consistency** - Use shared UI library consistently
- ✅ **Clean, modern design** - Minimal, professional aesthetic

---

## Design Principles

### 1. User-First Design
Every interface should prioritize user needs and clarity. Test with real workflows.

### 2. Consistency Above All
Use the same components, patterns, and styles across all modules. This builds familiarity.

### 3. Simplicity Through Reduction
Remove unnecessary elements. Clean, white-space-driven design is easier to scan.

### 4. Accessibility Matters
- Proper ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Focus states for all interactive elements

### 5. Mobile-First Responsive Design
Start with mobile layout, then enhance for desktop. Use Tailwind's responsive utilities.

---

## UI Component Library

All UI components are located in `apps/web/src/components/ui/`.

### Available Components

#### **Button**
Primary action component with variants, sizes, and loading states.

```typescript
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={isLoading}>
  Save Changes
</Button>

// Variants: primary | secondary | danger | ghost
// Sizes: sm | md | lg
```

**Usage:**
- Primary actions: Creating, saving, submitting
- Secondary actions: Alternative options
- Danger: Delete, cancel, destructive actions
- Ghost: Light, de-emphasized actions

---

#### **Input**
Text input with built-in label and error styling.

```typescript
import { Input } from '@/components/ui';

<Input
  label="Email Address"
  type="email"
  placeholder="name@example.com"
  error={errors.email?.message}
  {...register('email')}
/>
```

**Features:**
- Forward ref support (React Hook Form compatible)
- Integrated error display
- Disabled state styling
- Helper text support

---

#### **FormField**
Wrapper component that combines label, input, and error styling. **Use this for all forms.**

```typescript
import { FormField, Input } from '@/components/ui';

<FormField
  label="Product Name"
  error={errors.name?.message}
  required
>
  <Input {...register('name')} />
</FormField>
```

**Benefits:**
- Reduces boilerplate (no need to write label + error HTML)
- Consistent label/error styling
- Required indicator
- Helper text support

---

#### **Combobox**
Searchable dropdown with keyboard navigation. **Use instead of native `<select>`** for any dropdown with >5 options.

```typescript
import { Combobox, type ComboboxOption } from '@/components/ui';

const options: ComboboxOption[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
];

<Combobox
  label="Select Item"
  options={options}
  value={selected}
  onChange={setSelected}
  searchable={true}
  clearable={true}
  isLoading={isLoading}
/>
```

**Features:**
- Searchable/filterable
- Keyboard navigation
- Clear button
- Loading state
- Accessible (ARIA compliant)

---

#### **Modal**
Enhanced modal component with accessibility features. **Only use for critical confirmations, not for forms.**

```typescript
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Delete"
  size="md"
>
  <p>Are you sure you want to delete this item?</p>
  <div className="mt-4 flex gap-2">
    <Button onClick={onClose} variant="secondary">Cancel</Button>
    <Button onClick={handleDelete} variant="danger">Delete</Button>
  </div>
</Modal>
```

**Features:**
- ESC key closes modal
- Focus management
- Backdrop click to close
- ARIA labels and roles
- Size variants: sm | md | lg | xl

---

#### **Badge**
Status indicator for tags, labels, and badges.

```typescript
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Cancelled</Badge>
```

**Variants:** success | warning | danger | info | neutral

---

#### **Spinner**
Loading indicator for async operations.

```typescript
import { Spinner } from '@/components/ui';

{isLoading && <Spinner />}
```

---

#### **Card**
Container for grouped content.

```typescript
import { Card } from '@/components/ui';

<Card>
  <Card.Header title="Section Title" />
  <Card.Body>Content goes here</Card.Body>
  <Card.Footer>Footer content</Card.Footer>
</Card>
```

---

#### **Table**
Structured data display.

```typescript
import { Table } from '@/components/ui';

<Table columns={columns} data={data} />
```

---

#### **Alert**
Informational, warning, or error messages.

```typescript
import { Alert } from '@/components/ui';

<Alert type="error" title="Error" message="Something went wrong" />
<Alert type="success" title="Success" message="Changes saved" />
```

---

#### **Checkbox**
Checkbox input with label.

```typescript
import { Checkbox } from '@/components/ui';

<Checkbox
  label="I agree to the terms"
  checked={agreed}
  onChange={setAgreed}
/>
```

---

## Page Layout Patterns

### Standard List Page Pattern

Used for displaying collections (Suppliers, Products, Purchase Orders, etc.)

```typescript
export const SuppliersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSuppliers({ search: searchTerm, page });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with title and action button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="mt-1 text-gray-600">Description of what this page does</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => navigate('/suppliers/new')}
              variant="primary"
              icon={<Plus size={20} />}
            >
              New Supplier
            </Button>
          )}
        </div>

        {/* Search/Filter Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Content (table/list) */}
        <div className="bg-white rounded-lg shadow">
          <DataList
            items={data?.data || []}
            isLoading={isLoading}
          />
        </div>

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <PaginationControls
            page={page}
            totalPages={data.pagination.pages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};
```

### Create/Edit Page Pattern

Used for forms that create or edit items. **No modals!**

```typescript
export const SupplierFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item } = useSupplier(id);
  const { mutate: submit, isPending } = useUpdateSupplier();

  const handleSubmit = async (data: FormData) => {
    submit(data, { onSuccess: () => navigate('/suppliers') });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Supplier' : 'Create Supplier'}
          </h1>
          <p className="mt-2 text-gray-600">
            Form description and instructions
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <SupplierForm
            item={item}
            onSubmit={handleSubmit}
            isLoading={isPending}
          />
        </div>
      </div>
    </div>
  );
};
```

**Key points:**
- Full page width (max-width-2xl for forms)
- Clear title indicating create vs. edit
- Form in a white card
- Cancel button goes back with `window.history.back()`
- Submit button navigates to list page on success
- Clean, spacious layout

---

## Form Patterns

### Complete Form Example

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, Input, Combobox, ComboboxOption } from '@/components/ui';

// 1. Define validation schema
const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  country: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

// 2. Create form component
export const SupplierForm: React.FC<{
  item?: Supplier;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  isLoading?: boolean;
}> = ({ item, onSubmit, isLoading = false }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: item || { status: 'ACTIVE' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Text Input */}
      <FormField label="Name" error={errors.name?.message} required>
        <Input {...register('name')} placeholder="Supplier name" />
      </FormField>

      {/* Email Input */}
      <FormField label="Email" error={errors.email?.message}>
        <Input {...register('email')} type="email" />
      </FormField>

      {/* Searchable Dropdown */}
      <FormField label="Country" error={errors.country?.message}>
        <Combobox
          options={countryOptions}
          value={watch('country')}
          onChange={(value) => setValue('country', value)}
          placeholder="Search countries..."
        />
      </FormField>

      {/* Native Select (for small lists only) */}
      <FormField label="Status" error={errors.status?.message}>
        <select {...register('status')} className="w-full px-3 py-2 border rounded-md">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </FormField>

      {/* Textarea */}
      <FormField label="Notes">
        <textarea {...register('notes')} rows={4} />
      </FormField>

      {/* Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
        >
          {item ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
```

### Form Best Practices

1. **Always use FormField** - Wraps label, input, and error consistently
2. **Use Zod for validation** - Type-safe, composable schemas
3. **Use React Hook Form** - Efficient form state management
4. **Searchable dropdowns** - Use Combobox for >5 options
5. **Clear labels** - Every input should have a label
6. **Show required fields** - Use `required` prop on FormField
7. **Error messages** - Show inline, use FormField's error prop
8. **Loading states** - Disable inputs, show loading spinner on button
9. **Consistent spacing** - Use `space-y-6` for vertical rhythm
10. **Action buttons** - Cancel and submit at bottom, consistent styling

---

## Navigation Patterns

### Links vs. Buttons

- **Links** (`<a>` tag) - Navigate between pages
- **Buttons** - Trigger actions, form submissions, modals

```typescript
// Link to another page
<Link to="/suppliers/new" className="...">
  New Supplier
</Link>

// Button with navigation
<Button onClick={() => navigate('/suppliers/new')}>
  New Supplier
</Button>

// Back navigation
<button onClick={() => window.history.back()}>
  <ArrowLeft size={24} />
</button>
```

### Breadcrumb Pattern

For deeply nested pages, show breadcrumbs:

```typescript
<nav className="text-sm text-gray-600 mb-4">
  <Link to="/suppliers">Suppliers</Link>
  <span className="mx-2">/</span>
  <span>Edit Supplier</span>
</nav>
```

---

## Color Palette

All colors are defined in `tailwind.config.js` and available as Tailwind utilities.

### Primary Colors

- **Primary Blue**: `bg-blue-600` / `text-blue-600`
  - Used for primary actions, links, focus states
  - Hover: `bg-blue-700` / `hover:bg-blue-700`
  - Light: `bg-blue-50` / `text-blue-700`

### Semantic Colors

- **Success (Green)**: `bg-green-600` / `text-green-600`
  - Success messages, active states, checkmarks

- **Warning (Amber)**: `bg-amber-600` / `text-amber-600`
  - Warnings, pending states, caution messages

- **Danger (Red)**: `bg-red-600` / `text-red-600`
  - Errors, delete actions, critical states

- **Info (Gray)**: `bg-gray-600` / `text-gray-600`
  - Neutral info, secondary text

### Backgrounds

- **Light Background**: `bg-gray-50`
  - Page backgrounds, subtle sections

- **Card Background**: `bg-white`
  - Cards, forms, content containers

- **Overlay**: `bg-black bg-opacity-50`
  - Modal backdrops

---

## Typography

All typography uses Tailwind's utility classes.

### Heading Hierarchy

```typescript
// Page title
<h1 className="text-3xl font-bold text-gray-900">Page Title</h1>

// Section title
<h2 className="text-2xl font-bold text-gray-900">Section Title</h2>

// Subsection
<h3 className="text-lg font-semibold text-gray-900">Subsection</h3>

// Card title
<h4 className="font-semibold text-gray-900">Card Title</h4>

// Body text
<p className="text-base text-gray-700">Regular text</p>

// Small text / metadata
<p className="text-sm text-gray-600">Helper or secondary text</p>
```

### Font Weights

- **Font Weight 300** - Light (rarely used)
- **Font Weight 400** - Normal (body text)
- **Font Weight 500** - Medium (labels, emphasis)
- **Font Weight 600** - Semibold (subheadings)
- **Font Weight 700** - Bold (headings)

---

## Spacing & Layout

Consistent spacing builds visual harmony.

### Vertical Spacing

```typescript
// Between major sections
className="mb-8"

// Between form groups
className="mb-6"

// Between form fields
className="space-y-4"

// Between list items
className="space-y-2"

// Padding inside containers
className="p-6"  // or p-4, p-8
```

### Grid Layouts

```typescript
// Responsive two-column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <input ... />
  <input ... />
</div>

// Three-column grid
<div className="grid grid-cols-3 gap-4">
  ...
</div>
```

### Max Widths

- **List pages**: `max-w-6xl`
- **Form pages**: `max-w-2xl`
- **Detail pages**: `max-w-4xl`

```typescript
<div className="max-w-2xl mx-auto px-4">
  {/* Content */}
</div>
```

---

## Forms: Best Practices

### Structure

1. **Logical grouping** - Group related fields together
2. **Clear labels** - Every input needs a label
3. **Error prevention** - Validate before submission
4. **Clear feedback** - Show success/error messages
5. **Mobile-first** - Stack on mobile, grid on desktop

### Input Types

```typescript
// Text
<Input type="text" {...register('name')} />

// Email
<Input type="email" {...register('email')} />

// Number
<Input type="number" {...register('quantity')} />

// Date
<Input type="date" {...register('date')} />

// Phone
<Input type="tel" {...register('phone')} />

// Textarea (larger text)
<textarea {...register('notes')} rows={4} />

// Select (small lists)
<select {...register('status')}>
  <option>Active</option>
</select>

// Combobox (large lists)
<Combobox options={options} value={...} onChange={...} />

// Checkbox
<Checkbox label="I agree" {...register('agreed')} />
```

### Validation Messages

```typescript
// Show inline errors with FormField
<FormField
  label="Email"
  error={errors.email?.message}
>
  <Input {...register('email')} />
</FormField>

// Zod error messages
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});
```

### Loading States

```typescript
// Disable inputs while submitting
<Input disabled={isSubmitting} />

// Loading button
<Button loading={isSubmitting} disabled={isSubmitting}>
  Save Changes
</Button>

// Show spinner
{isLoading && <Spinner />}
```

---

## Common Pitfalls

### ❌ Don't

1. **Use modals for forms** - Use dedicated pages instead
2. **Use native `<select>` for >5 options** - Use Combobox
3. **Repeat label/error HTML** - Use FormField wrapper
4. **Forget disabled states** - Disable inputs while loading
5. **Missing required indicators** - Mark required fields
6. **Inconsistent button styling** - Use Button component
7. **Hard-coded colors** - Use Tailwind utilities
8. **No error messages** - Always show validation feedback
9. **Confusing submit buttons** - Use clear labels ("Save", "Update", "Create")
10. **Mobile-unfriendly layouts** - Test on mobile

### ✅ Do

1. **Use full pages** for create/edit
2. **Use Combobox** for searchable dropdowns
3. **Use FormField** for every form input
4. **Always show loading states** while submitting
5. **Mark required fields** with `required` prop
6. **Use Button component** with variants
7. **Use Tailwind utilities** for styling
8. **Show clear error messages** inline
9. **Use action verbs** in buttons (Save, Update, Create, Delete)
10. **Test on mobile** devices

---

## Future Module Checklist

When building a new module (e.g., Inventory, Users, Reports), follow this checklist:

### Pages to Create

- [ ] **List Page** (e.g., `/inventory`)
  - Table with all items
  - Search / filter bar
  - Create button
  - Edit/delete actions
  - Pagination

- [ ] **Create Page** (e.g., `/inventory/new`)
  - Form with all fields
  - Cancel and Submit buttons
  - Success toast on submission
  - Redirect to list page

- [ ] **Edit/Detail Page** (e.g., `/inventory/:id`)
  - Form pre-filled with item data
  - Cancel and Update buttons
  - Success toast on update
  - Error handling

### Components to Create

- [ ] **`ItemForm.tsx`** - Reusable form component
  - Zod schema
  - React Hook Form integration
  - FormField wrapper for inputs
  - Combobox for dropdowns
  - Loading/disabled states

- [ ] **`ItemList.tsx`** - List table component
  - Column headers
  - Row data
  - Edit/delete buttons
  - Loading skeleton

### Routing

- [ ] Add routes to `App.tsx`:
  ```typescript
  <Route path="/items" element={<ItemsPage />} />
  <Route path="/items/new" element={<ItemFormPage />} />
  <Route path="/items/:id" element={<ItemDetailPage />} />
  ```

### Form Implementation

- [ ] Create Zod validation schema
- [ ] Use React Hook Form with zodResolver
- [ ] Wrap inputs with FormField
- [ ] Use Combobox for dropdowns
- [ ] Show loading/error states
- [ ] Use toast notifications
- [ ] Navigate on success

### Styling

- [ ] Use FormField wrapper for inputs
- [ ] Use Button component (not inline buttons)
- [ ] Follow color palette (primary blue)
- [ ] Use consistent spacing (mb-6, space-y-4)
- [ ] Mobile-responsive layout (grid-cols-1 md:grid-cols-2)
- [ ] Tailwind utilities only (no inline CSS)

### Testing

- [ ] Test create flow (form submission, redirect)
- [ ] Test edit flow (pre-fill, update, redirect)
- [ ] Test delete with confirmation
- [ ] Test validation messages
- [ ] Test mobile responsive
- [ ] Test loading states
- [ ] Test error handling

### Documentation

- [ ] Add types/interfaces
- [ ] Add JSDoc comments
- [ ] Document API endpoints
- [ ] Add inline comments for complex logic

---

## Summary

This design system provides:

✅ **Consistency** - All modules look and feel the same
✅ **Clean UX** - No modals, dedicated pages, searchable dropdowns
✅ **Efficiency** - Reusable components reduce boilerplate
✅ **Accessibility** - Proper keyboard nav, ARIA labels
✅ **Maintainability** - Centralized styling, single source of truth

Follow these patterns, and future modules will be faster and more polished!

---

## Questions?

- Check component docs in `/apps/web/src/components/ui/`
- Review existing modules (Suppliers, Products, Purchase Orders)
- Test patterns in the browser before implementing
- Iterate based on user feedback

Happy building! 🎨
