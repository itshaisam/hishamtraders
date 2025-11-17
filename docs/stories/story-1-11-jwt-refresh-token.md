# Story 1.11: JWT Refresh Token Mechanism

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.11
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 1.3 (Authentication System with JWT)
**Status:** New

---

## User Story

**As a** user,
**I want** the application to automatically refresh my session before it expires,
**So that** I can stay logged in for an extended period without being abruptly logged out.

---

## Acceptance Criteria

1.  **Token Issuance:**
    *   [ ] Upon successful login, the API returns both a short-lived JWT (access token) and a long-lived refresh token.
    *   [ ] Access token expiry: 15 minutes (configurable).
    *   [ ] Refresh token expiry: 7 days (configurable).

2.  **Secure Token Storage:**
    *   [ ] The access token is stored in memory (e.g., Zustand store).
    *   [ ] The refresh token is stored in a secure, `httpOnly` cookie to prevent XSS attacks.

3.  **Token Refresh Endpoint:**
    *   [ ] A new endpoint `POST /api/v1/auth/refresh-token` is created.
    *   [ ] This endpoint accepts the refresh token from the cookie.
    *   [ ] It validates the refresh token and, if valid, issues a new access token.

4.  **Frontend Logic:**
    *   [ ] The frontend API client (e.g., Axios interceptor) automatically detects a 401 Unauthorized error due to an expired access token.
    *   [ ] Upon detecting an expired token, it silently calls the `/api/v1/auth/refresh-token` endpoint.
    *   [ ] If the refresh is successful, it retries the original failed request with the new access token.
    *   [ ] If the refresh token is also expired or invalid, the user is logged out and redirected to the login page.

5.  **Logout:**
    *   [ ] When a user logs out, the server invalidates the refresh token (e.g., by clearing it from the cookie).

6.  **Audit Logging:**
    *   [ ] Successful and failed token refresh attempts are logged in the audit trail.

---

## Dev Notes

### Token Strategy

*   **Access Token (JWT):** Short-lived (e.g., 15 mins). Contains user permissions. Stored in frontend memory.
*   **Refresh Token:** Long-lived (e.g., 7 days). Opaque string stored in a database and linked to the user. Used only to get a new access token. Stored in an `httpOnly` cookie.

### Database Schema Changes (Prisma)

```prisma
model User {
  // ... existing fields
  refreshToken String?
  refreshTokenExpiresAt DateTime?
}
```

### Backend Implementation

**`auth.service.ts` (Login method update)**

```typescript
// Inside login method
// ... after password validation

// Generate Refresh Token
const refreshToken = crypto.randomBytes(40).toString('hex');
const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

await prisma.user.update({
  where: { id: user.id },
  data: {
    lastLoginAt: new Date(),
    refreshToken,
    refreshTokenExpiresAt,
  },
});

// ... generate access token (JWT)

// Set refresh token in httpOnly cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  expires: refreshTokenExpiresAt,
});

// Return access token in response body
return { user, token: accessToken };
```

**`auth.controller.ts` (New method)**

```typescript
// POST /api/v1/auth/refresh-token
async refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token not found.' });
  }

  try {
    const newAccessToken = await authService.refreshAccessToken(refreshToken);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
}
```

### Frontend Implementation

**`api-client.ts` (Axios Interceptor)**

```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axios(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post('/auth/refresh-token');
        const newAccessToken = data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken); // Update store
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        processQueue(null, newAccessToken);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```
