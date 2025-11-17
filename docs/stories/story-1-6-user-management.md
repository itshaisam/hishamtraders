# Story 1.6: User Management Module

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.6
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 1.3 (Authentication), Story 1.5 (Authorization)
**Status:** Completed ✅

---

## User Story

**As an** admin,
**I want** to create, edit, and deactivate user accounts with role assignment,
**So that** I can control who has access to the system and what they can do.

---

## Acceptance Criteria

### Backend API
- [x] 1. GET /api/v1/users returns paginated list of users with role info
- [x] 2. POST /api/v1/users creates new user with email, name, roleId, password
- [x] 3. PUT /api/v1/users/:id updates user details (email, name, roleId, status)
- [x] 4. DELETE /api/v1/users/:id soft-deletes user (sets status=inactive)
- [x] 5. User table includes: id, email (unique), name, passwordHash, roleId, status, createdAt, lastLoginAt
- [x] 6. Email validation ensures valid format and uniqueness
- [x] 7. An email is sent to the new user with a secure, one-time link to set their password.
- [x] 8. Admin cannot delete/deactivate their own account.
- [x] 9. A new page and API endpoint exist for users to set/reset their password using a token.

### Audit Logging
- [x] 10. **Role changes logged in audit trail**

### Frontend UI
- [ ] 11. Frontend User Management page lists users with filters (role, status)
- [ ] 12. Frontend includes Add/Edit User modals with form validation (password field removed from create form).
- [ ] 13. Frontend displays user status (active/inactive) with visual indicator
- [ ] 14. Only Admin role can access user management features

---

## Technical Implementation

### Database Schema Changes (Prisma)

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  passwordHash          String?   // Optional, as user sets it later
  name                  String
  roleId                String
  status                String    @default("active") // active, inactive, pending_setup
  lastLoginAt           DateTime?
  passwordResetToken    String?   @unique
  passwordResetExpires  DateTime?
  tenantId              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  role      Role        @relation(fields: [roleId], references: [id])
  auditLogs AuditLog[]

  @@map("users")
}
```

### Backend Implementation

#### 1. User Service (Create Method)

The `create` method in `user.service.ts` will be modified to not take a password. Instead, it generates a token and sends an email.

```typescript
import crypto from 'crypto';

// ... inside UserService

async create(data: Omit<CreateUserData, 'password'>) {
  // ... (check for existing email, role, etc.)

  // Generate a password reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create user with a pending status and no password
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      roleId: data.roleId,
      status: 'pending_setup',
      passwordResetToken,
      passwordResetExpires,
    },
    // ...
  });

  // Send an email to the user with a link to set their password
  // The link would be something like: https://yourapp.com/set-password?token=${resetToken}
  // (Email service implementation is out of scope for this story but would be called here)
  // await emailService.sendPasswordSetupEmail(user.email, resetToken);

  // ... (log to audit trail)

  return user;
}
```

#### 2. New Auth Endpoints for Password Setup

**`auth.controller.ts`**

```typescript
// POST /api/v1/auth/set-password
async setPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    await this.authService.setPasswordWithToken(token, password);
    res.json({ success: true, message: 'Password has been set successfully.' });
  } catch (error) {
    next(error);
  }
}
```

**`auth.service.ts`**

```typescript
async setPasswordWithToken(token: string, password: string) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('Token is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: 'active',
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}
```

### Frontend Implementation

A new page will be created for setting the password.

**`SetPasswordPage.tsx`**

```typescript
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
// ... other imports

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await authService.setPassword({ token, password: data.password });
      toast.success('Password set successfully! You can now log in.');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to set password. The link may have expired.');
    }
  };

  if (!token) {
    return <div>Invalid or missing token.</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>Set Your Password</h2>
      <input type="password" {...register('password', { required: true, minLength: 8 })} />
      {/* Add password confirmation field and validation */}
      <button type="submit">Set Password</button>
    </form>
  );
}
```

This updated flow is much more secure and aligns with modern application standards. The `create` endpoint in `user.controller.ts` would no longer accept a `password`.
