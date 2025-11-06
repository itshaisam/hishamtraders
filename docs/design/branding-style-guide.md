# Branding & Style Guide

**Part of:** [Design System](./design-system.md)
**Version:** 1.0
**Last Updated:** January 15, 2025

---

## Color Palette

| Type | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | #3B82F6 | blue-600 | Actions, links |
| Success | #10B981 | green-500 | In Stock, Paid |
| Warning | #F59E0B | yellow-500 | Low Stock, Alerts |
| Danger | #EF4444 | red-500 | Out of Stock, Errors |
| Gray-900 | #111827 | gray-900 | Primary text |
| Gray-700 | #374151 | gray-700 | Secondary text |
| White | #FFFFFF | white | Backgrounds |

---

## Typography

| Element | Size | Weight | Tailwind |
|---------|------|--------|----------|
| H1 | 30px | 700 | text-3xl font-bold |
| H2 | 24px | 600 | text-2xl font-semibold |
| H3 | 20px | 600 | text-xl font-semibold |
| Body | 16px | 400 | text-base |
| Small | 14px | 400 | text-sm |
| Tiny | 12px | 400 | text-xs |

**Font Family:** Inter, system-ui, sans-serif
**Monospace:** JetBrains Mono (for SKUs, codes)

---

## Iconography

**Library:** Lucide React (1000+ icons)
**Sizes:** 16px (small), 20px (medium), 24px (large), 32px (XL)

**Common Icons:**
- Dashboard: LayoutDashboard
- Products: Package
- Inventory: Warehouse
- Sales: FileText
- Clients: Users
- Success: CheckCircle
- Warning: AlertTriangle
- Error: XCircle

---

## Spacing & Layout

**Base Unit:** 4px
**Common Spacing:**
- 1 = 4px (tiny gaps)
- 2 = 8px (small gaps)
- 4 = 16px (default spacing)
- 6 = 24px (section spacing)
- 8 = 32px (large spacing)

**Border Radius:**
- Small: 4px (rounded)
- Medium: 6px (rounded-md) - default
- Large: 8px (rounded-lg)
- Full: 9999px (rounded-full)

---

## Responsive Breakpoints

| Breakpoint | Min Width | Prefix | Target |
|------------|-----------|--------|--------|
| Mobile | 0px | (none) | Phones |
| Tablet | 768px | md: | Tablets |
| Desktop | 1024px | lg: | Laptops |
| Wide | 1280px | xl: | Large monitors |

**Approach:** Mobile-first (base styles for mobile, use md: and lg: for larger screens)

---

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { 500: '#3b82f6', 600: '#2563eb' },
        success: { 500: '#10b981', 100: '#d1fae5' },
        warning: { 500: '#f59e0b', 100: '#fef3c7' },
        danger: { 500: '#ef4444', 100: '#fee2e2' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

---

## Related Documents

- [← Back to Design System Index](./design-system.md)
- [← Previous: Component Library](./component-library.md)
- [Next: Accessibility →](./accessibility.md)
