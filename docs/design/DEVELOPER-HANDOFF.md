# Developer Handoff Checklist

**Project:** Hisham Traders ERP - Frontend Implementation
**Design System Version:** 1.0
**Date:** January 15, 2025
**Status:** Ready for Development

---

## Quick Start (15 Minutes)

### Step 1: Read Context (5 minutes)
1. [ ] Read [User Personas](./user-personas.md) - Understand who you're building for
2. [ ] Skim [Information Architecture](./information-architecture.md) - See overall structure

### Step 2: Setup Environment (10 minutes)
3. [ ] Clone repository
4. [ ] Install dependencies:
```bash
cd hishamtraders
npm install

# Key dependencies
npm install lucide-react react-hook-form @tanstack/react-query axios date-fns react-hot-toast zod @hookform/resolvers zustand
npm install -D tailwindcss @tailwindcss/forms postcss autoprefixer
npx tailwindcss init -p
```

5. [ ] Copy Tailwind config from [Branding Style Guide](./branding-style-guide.md)
6. [ ] Start dev server: `npm run dev`

---

## Phase 1: Foundation (Week 1)

### Design System Setup
- [ ] **Read:** [Branding & Style Guide](./branding-style-guide.md)
- [ ] Configure Tailwind with custom colors, fonts, spacing
- [ ] Add Inter font (Google Fonts or self-hosted)
- [ ] Install Lucide React for icons
- [ ] Setup global styles (CSS reset, base typography)

**Deliverable:** Tailwind configured, fonts loaded, design tokens working

---

### Component Library (Priority Order)
- [ ] **Read:** [Component Library](./component-library.md)

**Build in this order:**

1. **Day 1-2: Foundation Components**
   - [ ] Button (primary, secondary, danger, ghost, loading state)
   - [ ] Input (text, number, email, password, with validation styling)
   - [ ] Card (basic, elevated, clickable)

2. **Day 3-4: Form Components**
   - [ ] Select dropdown (single, searchable)
   - [ ] Form (two-column layout, validation integration)
   - [ ] Badge (status indicators with semantic colors)
   - [ ] Alert / Toast (success, error, warning, info)

3. **Day 5: Data Display**
   - [ ] Table (sortable headers, pagination, responsive card view)
   - [ ] Loading states (spinner, skeleton, progress bar)
   - [ ] Modal (small, medium, large sizes)

**Deliverable:** 10 core components built, tested on mobile/tablet/desktop

**Testing Checklist per Component:**
- [ ] Renders correctly on mobile (375px)
- [ ] Renders correctly on tablet (768px)
- [ ] Renders correctly on desktop (1024px+)
- [ ] All variants working (primary, secondary, etc.)
- [ ] All states working (default, hover, disabled, etc.)
- [ ] Keyboard accessible (Tab, Enter)
- [ ] Focus indicator visible

---

## Phase 2: Layout & Navigation (Week 2)

### Global Layout
- [ ] **Read:** [Information Architecture](./information-architecture.md)

**Desktop:**
- [ ] Header (logo, search bar, notifications, user profile)
- [ ] Sidebar navigation (collapsible, role-based filtering)
- [ ] Breadcrumbs component
- [ ] Main content area with padding

**Mobile:**
- [ ] Bottom navigation (5 items, role-specific)
- [ ] Hamburger menu drawer (full navigation)
- [ ] Mobile header (compact)

**Global Search:**
- [ ] Search bar with Ctrl+K shortcut
- [ ] Autocomplete dropdown
- [ ] Results grouped by type (Products, Clients, Invoices)
- [ ] Keyboard navigation (arrow keys, Enter)

**Deliverable:** Layout renders on all breakpoints, navigation functional

---

## Phase 3: Key Screens (Week 3-4)

### Screen 1: Login Page
- [ ] **Reference:** [Wireframes](./wireframes.md)
- [ ] Email/password form with React Hook Form + Zod validation
- [ ] Show/hide password toggle
- [ ] Loading state on submit
- [ ] Error handling (401, network errors)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Remember me checkbox (optional)

**Test Cases:**
- [ ] Valid login redirects to dashboard
- [ ] Invalid credentials show error
- [ ] Empty fields show validation errors
- [ ] Enter key submits form
- [ ] Mobile: renders correctly, keyboard doesn't obscure inputs

---

### Screen 2: Dashboard (Role-Specific)
- [ ] **Reference:** [User Personas](./user-personas.md) for role requirements
- [ ] Dashboard router (routes to correct dashboard based on user role)
- [ ] Admin Dashboard:
  - [ ] 4 metric cards (users, health, inventory value, receivables)
  - [ ] Recent activity timeline (last 10 actions)
  - [ ] Tab navigation (Overview, Users, Audit, All Dashboards)
- [ ] Warehouse Dashboard:
  - [ ] Low stock alerts count
  - [ ] Pending gate passes count
  - [ ] Quick actions (Check Stock, Receive Goods, Issue Gate Pass)
- [ ] Sales Dashboard:
  - [ ] Today's sales summary
  - [ ] Clients approaching credit limit
  - [ ] Recent invoices list
- [ ] Accountant Dashboard:
  - [ ] Cash flow summary (inflows, outflows, net)
  - [ ] Receivables vs Payables
- [ ] Recovery Dashboard:
  - [ ] Today's recovery schedule
  - [ ] Total outstanding receivables
  - [ ] Overdue clients list

**Test Cases:**
- [ ] Each role sees only their dashboard
- [ ] Admin can view all dashboards via tabs
- [ ] Metrics auto-refresh (TanStack Query)
- [ ] Quick action buttons navigate correctly
- [ ] Mobile: metrics stack vertically, swipeable carousel

---

### Screen 3: Create Invoice
- [ ] **Reference:** [User Flows](./user-flows.md) → Flow 1
- [ ] Client search/select dropdown (autocomplete)
- [ ] Client info card (displays after selection)
- [ ] Credit limit indicator (progress bar with color coding)
- [ ] Invoice date/due date pickers
- [ ] Payment type radio (Cash/Credit)
- [ ] Dynamic line items table:
  - [ ] Add/remove rows
  - [ ] Product search modal
  - [ ] Quantity, price, discount, tax inputs
  - [ ] Auto-calculate line totals
- [ ] Invoice summary sidebar (sticky on desktop, fixed bottom on mobile)
  - [ ] Subtotal, Tax, Total (auto-updates)
  - [ ] Save Draft, Save & Print, Cancel buttons
- [ ] Validation:
  - [ ] Credit limit warning/error
  - [ ] Stock availability check
  - [ ] Required fields (client, at least 1 line item)
- [ ] Auto-save draft every 30 seconds (localStorage)

**Test Cases:**
- [ ] Create invoice with 5+ line items
- [ ] Credit limit warning shows at 80%, blocks at 100% (non-admin)
- [ ] Admin can override credit limit with reason
- [ ] Stock validation prevents ordering more than available
- [ ] Calculations correct (subtotal, tax, total)
- [ ] Auto-save recovers draft after crash
- [ ] Mobile: form stacks vertically, summary fixed at bottom

---

## Phase 4: User Flows Implementation (Week 5-6)

### Flow 1: Create Invoice (Continued)
- [ ] **Reference:** [User Flows](./user-flows.md) → Flow 1
- [ ] Backend integration (API calls)
- [ ] Success toast notification
- [ ] Navigate to invoice detail after save
- [ ] Print dialog integration
- [ ] Gate pass auto-generation (if warehouse configured AUTO)

---

### Flow 2: Record Payment (Mobile Priority)
- [ ] **Reference:** [User Flows](./user-flows.md) → Flow 2
- [ ] Mobile-optimized layout
- [ ] Client search
- [ ] Display current balance
- [ ] Amount input (number pad on mobile)
- [ ] Payment method selector (Cash, Bank Transfer, Cheque)
- [ ] Reference number (required for Cheque/Bank Transfer)
- [ ] Invoice allocation (optional):
  - [ ] Show outstanding invoices
  - [ ] Allocate amounts across multiple invoices
- [ ] **Offline capability:**
  - [ ] Save to IndexedDB when offline
  - [ ] Display "Pending Sync" indicator
  - [ ] Auto-sync when online
  - [ ] Retry failed syncs
- [ ] Success confirmation
- [ ] PDF receipt generation (optional)

**Test Cases:**
- [ ] Record payment while online
- [ ] Record payment while offline, verify sync when online
- [ ] Overpayment shows warning
- [ ] Cheque requires reference number
- [ ] Allocation sums correctly
- [ ] Mobile: large touch targets (44px+), minimal typing

---

### Flow 3-5: Additional Flows
- [ ] Goods Receipt (Warehouse Manager)
- [ ] Gate Pass Approval (Warehouse Manager)
- [ ] Stock Check (Mobile quick view)

**Reference:** [User Flows](./user-flows.md) for diagrams and requirements

---

## Phase 5: Polish & Optimization (Week 7)

### Accessibility Audit
- [ ] **Reference:** [Accessibility](./accessibility.md)
- [ ] Run Lighthouse accessibility audit
- [ ] Keyboard navigation test (Tab through all screens)
- [ ] Focus indicators visible
- [ ] ARIA labels on icon buttons
- [ ] Form labels associated with inputs
- [ ] Color contrast check (Chrome DevTools)
- [ ] Touch target size check (44px minimum on mobile)

---

### Animations
- [ ] **Reference:** [Animations](./animations.md)
- [ ] Button hover transitions
- [ ] Toast notifications (slide + fade)
- [ ] Modal open/close (scale + fade)
- [ ] Loading states (spinners, skeletons)
- [ ] Form error shake
- [ ] Reduced motion support (`prefers-reduced-motion`)

---

### Performance Optimization
- [ ] **Reference:** [Performance](./performance.md)
- [ ] Code splitting (lazy load routes)
- [ ] Image optimization (WebP, lazy load)
- [ ] Bundle size check (< 200KB initial)
- [ ] Table virtualization (if > 100 rows)
- [ ] Debounce search inputs (300ms)
- [ ] TanStack Query caching configured
- [ ] Lighthouse performance audit (> 90 score)

---

## Testing Checklist

### Manual Testing
- [ ] Test on Chrome (desktop, mobile)
- [ ] Test on Firefox
- [ ] Test on Safari (Mac/iOS)
- [ ] Test on Edge
- [ ] Test on physical mobile device (not just emulator)
- [ ] Test offline functionality (payment recording)
- [ ] Test slow 3G connection (throttle in DevTools)

### Automated Testing (Optional for MVP)
- [ ] Unit tests for components (Jest + React Testing Library)
- [ ] Integration tests for forms (user flows)
- [ ] E2E tests for critical paths (Playwright/Cypress)

---

## Pre-Launch Checklist

### Code Quality
- [ ] ESLint passes (no errors)
- [ ] Prettier formatting consistent
- [ ] No console.log statements in production
- [ ] Environment variables configured (.env.example provided)
- [ ] Build succeeds without errors/warnings

### Documentation
- [ ] README updated with setup instructions
- [ ] Component usage documented (Storybook or comments)
- [ ] API client documented
- [ ] Deployment instructions

### Security
- [ ] JWT stored securely (httpOnly cookies or secure localStorage)
- [ ] API calls use HTTPS in production
- [ ] CORS configured correctly
- [ ] Input sanitization (XSS prevention)

---

## Design Resources

### Design System Documentation
1. [Design System Index](./design-system.md) - Start here
2. [User Personas](./user-personas.md) - Understand users
3. [Information Architecture](./information-architecture.md) - Navigation structure
4. [User Flows](./user-flows.md) - Workflow diagrams
5. [Wireframes](./wireframes.md) - Screen layouts
6. [Component Library](./component-library.md) - UI components
7. [Branding & Style Guide](./branding-style-guide.md) - Colors, typography, icons
8. [Accessibility](./accessibility.md) - Accessibility requirements
9. [Animations](./animations.md) - Motion design
10. [Performance](./performance.md) - Performance targets

### External Resources
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Lucide React Icons:** https://lucide.dev
- **React Hook Form:** https://react-hook-form.com
- **TanStack Query:** https://tanstack.com/query
- **Figma Designs:** [To be created]

---

## Support & Questions

### For Design Questions
- Review design system documentation (links above)
- Check Figma files (when created)
- Ask: What would best serve the user persona? (Data clarity over visual flair)

### For Technical Questions
- Review component library code examples
- Check Tailwind docs for utility classes
- Consult frontend architect

### For Business Logic Questions
- Review [PRD](../prd.md)
- Review [User Flows](./user-flows.md)
- Consult product owner

---

## Definition of Done

**Component Level:**
- [ ] Component built according to spec
- [ ] All variants implemented
- [ ] All states implemented (hover, disabled, loading, etc.)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard accessible
- [ ] Focus indicator visible
- [ ] Code reviewed

**Screen Level:**
- [ ] Screen matches wireframe layout
- [ ] All user interactions functional
- [ ] Form validation working
- [ ] Error handling implemented
- [ ] Loading states displayed
- [ ] Success/error feedback (toasts)
- [ ] Mobile responsive
- [ ] Tested on multiple browsers
- [ ] Code reviewed

**Flow Level:**
- [ ] Complete user flow functional
- [ ] Edge cases handled
- [ ] Offline capability (if required)
- [ ] Performance acceptable (< 2s page load, < 100ms interactions)
- [ ] E2E test passing (if applicable)
- [ ] UAT approved by product owner

---

**End of Developer Handoff Checklist**

**Next Step:** Start with Phase 1 (Foundation). Build one component at a time, test thoroughly, then move to next. Quality over speed - a well-built component library saves time later.

**Estimated Timeline:** 7 weeks for complete frontend implementation (Phase 1-5)

**Good luck! 🚀**
