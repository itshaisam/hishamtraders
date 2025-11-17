# Quick Reference Guide

Fast lookup for common patterns and components.

## Components Quick Reference

### Imports
```typescript
import {
  Button,
  Input,
  FormField,
  Combobox,
  Modal,
  Badge,
  Spinner,
  Card,
  Alert,
  Checkbox,
  Table,
  Select,
  type ComboboxOption
} from '@/components/ui';
```

### Button
```typescript
<Button variant="primary" size="md" loading={false}>
  Action
</Button>
// Variants: primary | secondary | danger | ghost
// Sizes: sm | md | lg
```

### Input
```typescript
<Input
  label="Field"
  type="text"
  placeholder="..."
  error={errors.field?.message}
  {...register('field')}
/>
```

### FormField (Recommended!)
```typescript
<FormField label="Name" error={errors.name?.message} required>
  <Input {...register('name')} />
</FormField>
```

### Combobox (Searchable Select)
```typescript
<Combobox
  options={[{ value: '1', label: 'Option 1' }]}
  value={selected}
  onChange={setSelected}
  placeholder="Search..."
/>
```

### Modal
```typescript
<Modal isOpen={open} onClose={close} title="Dialog">
  Content here
</Modal>
```

### Badge
```typescript
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Failed</Badge>
```

## Form Pattern Template

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Schema
const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid'),
});

// 2. Component
export const MyForm = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField label="Name" error={errors.name?.message} required>
        <Input {...register('name')} />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <Input {...register('email')} type="email" />
      </FormField>

      <div className="flex gap-3 pt-6 border-t">
        <Button variant="secondary" onClick={back} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="primary" loading={isLoading} disabled={isLoading}>
          Save
        </Button>
      </div>
    </form>
  );
};
```

## Page Pattern Template

### List Page
```typescript
export const ItemsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useItems({ search, page });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Items</h1>
            <p className="text-gray-600">Description</p>
          </div>
          <Button onClick={() => navigate('/items/new')}>
            New Item
          </Button>
        </div>

        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 border rounded-lg"
        />

        <div className="bg-white rounded-lg shadow">
          {/* Table/List */}
        </div>
      </div>
    </div>
  );
};
```

### Create/Edit Page
```typescript
export const ItemFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item } = useItem(id);
  const { mutate, isPending } = useUpdateItem();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {id ? 'Edit' : 'Create'} Item
          </h1>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <ItemForm
            item={item}
            onSubmit={(data) => mutate(data, {
              onSuccess: () => navigate('/items')
            })}
            isLoading={isPending}
          />
        </div>
      </div>
    </div>
  );
};
```

## Routing Template

In `App.tsx`:
```typescript
{/* Items routes */}
<Route path="/items" element={<ItemsPage />} />
<Route path="/items/new" element={<ItemFormPage />} />
<Route path="/items/:id" element={<ItemFormPage />} />
```

## Styling Classes

### Spacing
- `mb-4` - Margin bottom 4
- `mb-6` - Margin bottom 6 (between sections)
- `mb-8` - Margin bottom 8 (between major sections)
- `p-4` - Padding 4
- `p-6` - Padding 6
- `space-y-4` - Vertical spacing between children

### Layout
- `max-w-2xl` - Max width for forms
- `max-w-6xl` - Max width for lists
- `mx-auto` - Center horizontally
- `px-4` - Horizontal padding
- `py-8` - Vertical padding (full page)

### Colors
- `text-gray-900` - Primary text
- `text-gray-700` - Secondary text
- `text-gray-600` - Tertiary text
- `bg-gray-50` - Light background
- `bg-white` - Card background
- `border-gray-300` - Border color

### Typography
- `text-3xl font-bold` - Page heading
- `text-xl font-semibold` - Section heading
- `text-sm text-gray-600` - Helper text

## Hooks

### Form Mutations
```typescript
const { mutate, isPending } = useCreateItem();
const { mutate, isPending } = useUpdateItem();
const { mutate, isPending } = useDeleteItem();

// Usage
mutate(data, {
  onSuccess: () => navigate('/items'),
});
```

### Data Fetching
```typescript
const { data, isLoading } = useItems({ page, search });
const { data, isLoading } = useItem(id);
```

## Common Patterns

### Navigate to new page
```typescript
const navigate = useNavigate();
navigate('/path/to/page');
navigate(`/items/${id}`); // With ID
```

### Go back
```typescript
<Button onClick={() => window.history.back()}>Back</Button>
```

### Show toast
```typescript
import toast from 'react-hot-toast';
toast.success('Success!');
toast.error('Error message');
```

### Conditional rendering
```typescript
{canEdit && <Button>Edit</Button>}
{isLoading && <Spinner />}
```

### Form submission
```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

<form onSubmit={handleSubmit(onSubmit)}>
  ...
</form>
```

### Disabled state
```typescript
<Input disabled={isLoading} />
<Button disabled={isLoading}>Save</Button>
```

## DO's and DON'Ts

### ✅ DO
- Use `FormField` for inputs
- Use `Combobox` for dropdowns
- Use `Button` component
- Disable inputs while loading
- Show error messages
- Use full pages (not modals)
- Test on mobile
- Use Tailwind utilities

### ❌ DON'T
- Don't use modals for forms
- Don't use native `<select>` for many options
- Don't repeat label/error HTML
- Don't forget loading states
- Don't use inline styling
- Don't create new button styles
- Don't hardcode colors
- Don't forget accessibility

## File Structure

```
apps/web/src/
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Combobox.tsx
│       ├── FormField.tsx
│       ├── Modal.tsx
│       └── index.ts
├── features/
│   └── items/
│       ├── pages/
│       │   ├── ItemsPage.tsx
│       │   └── ItemFormPage.tsx
│       ├── components/
│       │   ├── ItemList.tsx
│       │   └── ItemForm.tsx
│       ├── hooks/
│       │   └── useItems.ts
│       ├── services/
│       │   └── itemsService.ts
│       └── types/
│           └── item.types.ts
```

## Validation Examples

```typescript
// Required string
name: z.string().min(1, 'Name is required')

// Minimum length
name: z.string().min(2, 'Must be at least 2 characters')

// Email
email: z.string().email('Invalid email')

// Enum
status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')

// Optional
country: z.string().optional()

// Number
quantity: z.number().min(1, 'Must be at least 1')

// URL
website: z.string().url('Invalid URL').optional()

// Date
date: z.string().min(1, 'Date required')

// Custom
phone: z.string().regex(/^\d{10}$/, 'Must be 10 digits')
```

---

For detailed info, see `DESIGN_SYSTEM_GUIDE.md`
