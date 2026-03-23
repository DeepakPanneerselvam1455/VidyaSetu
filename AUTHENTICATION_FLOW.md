# VidyaSetu Authentication Flow Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Registration Flow](#registration-flow)
4. [Login Flow](#login-flow)
5. [Session Management](#session-management)
6. [Role-Based Access Control](#role-based-access-control)
7. [Route Protection](#route-protection)
8. [AuthContext and useAuth Hook](#authcontext-and-useauth-hook)
9. [Security Features](#security-features)
10. [Error Handling](#error-handling)
11. [Logout Flow](#logout-flow)
12. [Code Examples](#code-examples)
13. [Security Best Practices](#security-best-practices)
14. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

VidyaSetu uses **Supabase Auth** as its authentication provider, integrated with a PostgreSQL database that enforces Row-Level Security (RLS) policies. The system supports three distinct user roles (student, mentor, admin) with role-based access control enforced at multiple layers:

- **Frontend**: Route guards and conditional UI rendering
- **Backend**: RLS policies and database triggers
- **API Layer**: Role verification in API calls

**Key Features:**
- Email/password authentication
- Automatic profile creation on signup
- Persistent sessions with automatic refresh
- Role-based dashboard routing
- Password strength validation
- Secure session management
- Network error handling with retry logic

---

## Authentication Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components                                    │   │
│  │  ├─ Login.tsx (Login form)                          │   │
│  │  ├─ Register.tsx (Registration form)                │   │
│  │  ├─ ProtectedRoute.tsx (Route guard)                │   │
│  │  └─ App.tsx (Route definitions)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Context (lib/auth.tsx)                         │   │
│  │  ├─ AuthProvider (State management)                  │   │
│  │  ├─ useAuth() hook (Access auth state)              │   │
│  │  └─ User state (Current user + role)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (lib/api.ts)                  │
│  ├─ login() - Authenticate user                             │
│  ├─ register() - Create new account                         │
│  ├─ logout() - End session                                  │
│  ├─ getProfile() - Fetch user profile                       │
│  └─ Network error handling wrapper                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Backend (lib/supabase.ts)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase Auth                                       │   │
│  │  ├─ signInWithPassword() - Authenticate             │   │
│  │  ├─ signUp() - Create auth user                     │   │
│  │  ├─ signOut() - Terminate session                   │   │
│  │  ├─ getUser() - Get current session                 │   │
│  │  └─ Session management (JWT tokens)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                 │   │
│  │  ├─ auth.users (Supabase managed)                   │   │
│  │  ├─ public.profiles (User profiles + roles)         │   │
│  │  ├─ Database trigger (Auto-create profile)          │   │
│  │  └─ RLS policies (Role-based data access)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User submits credentials** → Frontend form validation
2. **API call** → `lib/api.ts` with network error handling
3. **Supabase Auth** → Validates credentials, creates JWT
4. **Database query** → Fetches profile from `profiles` table
5. **RLS enforcement** → Verifies user can access their profile
6. **Session established** → JWT stored in browser, user state updated
7. **Route redirect** → User redirected to role-specific dashboard

---

## Registration Flow

### Step-by-Step Process

#### 1. User Fills Registration Form

**File:** `pages/Register.tsx`

The registration form collects:
- Full name (required)
- Email address (required, validated format)
- Password (required, strength validation)
- Confirm password (required, must match)
- Terms acceptance (required checkbox)

**Role Assignment:** All new accounts are automatically assigned the `student` role by the database trigger. Admins can later change roles through the admin panel.

#### 2. Client-Side Validation

```typescript
// Form validation (lib/formValidation.ts)
const validation = validateRegistrationForm(name, email, password, confirmPassword);
if (!validation.isValid) {
    setFieldErrors(validation.errors);
    return;
}

// Password strength check (lib/utils.ts)
const strength = checkPasswordStrength(password);
if (strength.score < 3) {
    setFieldErrors({ password: "Password is too weak" });
    return;
}
```

**Validation Rules:**
- Name: Minimum 2 characters
- Email: Valid email format (RFC 5322)
- Password: Minimum 8 characters, strength score ≥ 3
- Confirm password: Must match password exactly

#### 3. Confirmation Dialog

Before submitting, users review their information in a confirmation modal:
- Full name
- Email address
- Account type (Student)

#### 4. API Registration Call

**File:** `lib/api.ts`

```typescript
export const register = async (userData: any, pass: string, requestedRole?: string) => {
    return withNetworkErrorHandling(async () => {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: pass,
            options: {
                data: {
                    name: userData.name,
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Registration failed");

        return newUser;
    }, { maxRetries: 2, timeout: 15000 });
};
```

**Network Error Handling:**
- Automatic retry on network failures (max 2 retries)
- 15-second timeout
- User-friendly error messages

#### 5. Database Trigger Execution

**File:** `server/schema.sql`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
DECLARE
  assigned_role TEXT;
BEGIN
  -- Default to student role
  assigned_role := COALESCE(new.raw_user_meta_data->>'admin_assigned_role', 'student');

  -- Validate role
  IF assigned_role NOT IN ('student', 'mentor', 'admin') THEN
    assigned_role := 'student';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', assigned_role);
  
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger Behavior:**
- Automatically fires on `auth.users` INSERT
- Creates corresponding `profiles` record
- Assigns default `student` role
- Copies name from signup metadata

#### 6. Automatic Login

After successful registration, the user is automatically logged in:

```typescript
const loggedInUser = await login(email, password);

// Redirect based on role
if (loggedInUser.role === 'admin') navigate('/admin');
else if (loggedInUser.role === 'mentor') navigate('/mentor');
else navigate('/student');
```

### Registration Sequence Diagram

```
User                 Frontend              API Layer           Supabase Auth       Database
 |                      |                      |                     |                |
 |--Fill Form---------->|                      |                     |                |
 |                      |--Validate----------->|                     |                |
 |                      |<-Valid---------------|                     |                |
 |--Confirm------------>|                      |                     |                |
 |                      |--register()--------->|                     |                |
 |                      |                      |--signUp()---------->|                |
 |                      |                      |                     |--INSERT------->|
 |                      |                      |                     |   auth.users   |
 |                      |                      |                     |<-Trigger-------|
 |                      |                      |                     |   (handle_new  |
 |                      |                      |                     |    _user)      |
 |                      |                      |                     |--INSERT------->|
 |                      |                      |                     |   profiles     |
 |                      |                      |<-User Created-------|                |
 |                      |<-Success-------------|                     |                |
 |                      |--login()------------>|                     |                |
 |                      |                      |--signInWithPassword>|                |
 |                      |                      |<-JWT Token----------|                |
 |<-Redirect to /student|                      |                     |                |
```

---

## Login Flow

### Step-by-Step Process

#### 1. User Submits Credentials

**File:** `pages/Login.tsx`

The login form includes:
- Email address input
- Password input (with show/hide toggle)
- Remember me checkbox
- Demo account quick-login buttons

#### 2. Form Validation

```typescript
const validation = validateLoginForm(email, password);
if (!validation.isValid) {
    setFieldErrors(validation.errors);
    return;
}
```

**Validation Rules:**
- Email: Required, valid format
- Password: Required, minimum 6 characters

#### 3. Authentication API Call

**File:** `lib/api.ts`

```typescript
export const login = async (email: string, pass: string) => {
    return withNetworkErrorHandling(async () => {
        // Step 1: Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) throw error;

        // Step 2: Fetch user profile with role
        if (data.user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*, role')
                .eq('id', data.user.id)
                .single();

            if (profileError) throw profileError;
            if (!profile) throw new Error("User profile not found.");
            if (!profile.role) throw new Error("User has no role assigned.");

            return { user: profile as User };
        }

        throw new Error("Login failed");
    }, { maxRetries: 2, timeout: 15000 });
};
```

**Process:**
1. Authenticate credentials with Supabase Auth
2. Receive JWT access token and refresh token
3. Fetch user profile from `profiles` table
4. Verify role assignment
5. Return complete user object

#### 4. Session Establishment

**File:** `lib/auth.tsx`

```typescript
const login = async (email: string, pass: string) => {
    try {
        const result = await api.login(email, pass);
        setUser(result.user);  // Update AuthContext state
        return result.user;
    } catch (error) {
        const userMessage = getNetworkErrorMessage(error);
        throw new Error(userMessage);
    }
};
```

The `AuthProvider` updates the global user state, making it available throughout the app via the `useAuth()` hook.

#### 5. Role-Based Redirect

```typescript
switch (loggedInUser.role) {
    case 'admin':
        navigate('/admin');
        break;
    case 'mentor':
        navigate('/mentor');
        break;
    case 'student':
        navigate('/student');
        break;
    default:
        setError('Account has no valid role assigned.');
        break;
}
```

### Login Sequence Diagram

```
User              Frontend           API Layer        Supabase Auth      Database
 |                   |                   |                   |               |
 |--Enter Creds----->|                   |                   |               |
 |                   |--Validate-------->|                   |               |
 |                   |<-Valid------------|                   |               |
 |--Click Login----->|                   |                   |               |
 |                   |--login()--------->|                   |               |
 |                   |                   |--signInWithPassword>|              |
 |                   |                   |                   |--Verify------>|
 |                   |                   |                   |   auth.users  |
 |                   |                   |<-JWT Token--------|               |
 |                   |                   |--SELECT---------->|               |
 |                   |                   |   profiles        |               |
 |                   |                   |<-Profile + Role---|               |
 |                   |<-User Object------|                   |               |
 |                   |--setUser()------->|                   |               |
 |                   |  (AuthContext)    |                   |               |
 |<-Redirect---------|                   |                   |               |
 |  (role-based)     |                   |                   |               |
```

---

## Session Management

### Session Persistence

VidyaSetu uses Supabase's built-in session management with JWT tokens stored in browser storage.

#### Session Initialization

**File:** `lib/auth.tsx`

```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const profile = await api.getProfile();
                setUser(profile);
            } catch (e) {
                console.error("Session check failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    // ... rest of provider
};
```

**On App Load:**
1. `AuthProvider` mounts
2. `checkSession()` runs automatically
3. Calls `getProfile()` to restore session
4. If valid JWT exists, user is authenticated
5. If JWT expired/invalid, user remains logged out

#### Session Restoration

**File:** `lib/api.ts`

```typescript
export const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile) {
        console.log(`[Auth] Session restored for user ${profile.id}. Role: ${profile.role}`);
    }

    return profile as User | null;
};
```

**Process:**
1. Check for existing Supabase session
2. If session exists, fetch user from `auth.users`
3. Query `profiles` table for complete user data
4. Return user object with role information

### Token Management

**JWT Token Structure:**
- **Access Token**: Short-lived (1 hour default), used for API requests
- **Refresh Token**: Long-lived (30 days default), used to obtain new access tokens

**Automatic Refresh:**
Supabase client automatically refreshes access tokens when they expire, using the refresh token. This happens transparently without user intervention.

**Token Storage:**
- Tokens stored in browser's `localStorage` by default
- Key: `supabase.auth.token`
- Includes both access and refresh tokens

### Session Expiration

**Scenarios:**

1. **Access Token Expires (< 1 hour)**
   - Supabase automatically refreshes using refresh token
   - User remains logged in seamlessly

2. **Refresh Token Expires (> 30 days)**
   - User must log in again
   - Redirect to login page with "Session expired" message

3. **Manual Logout**
   - Both tokens invalidated immediately
   - User redirected to login page

### Session Security

**Protection Mechanisms:**
- JWT tokens signed with secret key
- HTTPS-only transmission (production)
- HttpOnly cookies option available
- Automatic token rotation on refresh
- Session invalidation on password change

---

## Role-Based Access Control

### Role Hierarchy

VidyaSetu implements three distinct roles with specific permissions:

| Role | Dashboard | Permissions |
|------|-----------|-------------|
| **Student** | `/student` | - Enroll in courses<br>- Take quizzes<br>- Request mentorship<br>- Join tutoring sessions<br>- Participate in forums<br>- View own progress |
| **Mentor** | `/mentor` | - Create/manage courses<br>- Generate AI quizzes<br>- Create manual quizzes<br>- Grade student submissions<br>- Accept mentorship requests<br>- Host tutoring sessions<br>- View student analytics<br>- All student permissions |
| **Admin** | `/admin` | - Manage all users<br>- Create users with any role<br>- View system analytics<br>- Moderate forum content<br>- Access security logs<br>- Configure system settings<br>- All mentor permissions |

### Role Assignment

#### Default Role (Registration)

```sql
-- Database trigger assigns 'student' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
DECLARE
  assigned_role TEXT;
BEGIN
  assigned_role := COALESCE(new.raw_user_meta_data->>'admin_assigned_role', 'student');
  
  IF assigned_role NOT IN ('student', 'mentor', 'admin') THEN
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', assigned_role);
  
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Admin-Assigned Roles

Admins can create users with specific roles through the admin panel:

**File:** `pages/admin/AdminCreateUser.tsx`

```typescript
// Admin specifies role during user creation
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createUser({
        name: formData.name,
        email: formData.email,
        role: formData.role  // 'student', 'mentor', or 'admin'
    }, formData.password);
};
```

#### Role Modification

Admins can change user roles through the user management interface:

```typescript
// Update user role
await api.updateUser({
    id: userId,
    role: newRole  // Change to different role
});
```

### Role Verification

#### Frontend Route Guards

**File:** `components/ProtectedRoute.tsx`

```typescript
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while checking session
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role authorization
    if (roles && !roles.includes(user.role)) {
        console.warn(`Access denied for user ${user.id} (${user.role})`);
        
        // Redirect to role-specific dashboard
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'mentor') return <Navigate to="/mentor" replace />;
        if (user.role === 'student') return <Navigate to="/student" replace />;
        
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
```

**Usage in Routes:**

```typescript
// Student-only route
<Route path="/student/quizzes" element={
    <ProtectedRoute roles={['student']}>
        <Layout><StudentQuizList /></Layout>
    </ProtectedRoute>
} />

// Mentor-only route
<Route path="/mentor/courses" element={
    <ProtectedRoute roles={['mentor']}>
        <Layout><MentorCourseManagement /></Layout>
    </ProtectedRoute>
} />

// Admin-only route
<Route path="/admin/users" element={
    <ProtectedRoute roles={['admin']}>
        <Layout><AdminUserManagement /></Layout>
    </ProtectedRoute>
} />

// Any authenticated user
<Route path="/profile" element={
    <ProtectedRoute>
        <Layout><Profile /></Layout>
    </ProtectedRoute>
} />
```

#### Database RLS Policies

**File:** `server/schema.sql`

Row-Level Security policies enforce role-based data access at the database level:

```sql
-- Profiles: Users can read all, update own, admins have full access
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Courses: Mentors manage own courses
CREATE POLICY "Mentors manage own courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Mentors update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = "mentorId")
  WITH CHECK (auth.uid() = "mentorId");

-- Quiz Attempts: Students see own, mentors see their quiz attempts
CREATE POLICY "Students read own attempts"
  ON public.quiz_attempts FOR SELECT
  USING ("studentId" = auth.uid());

CREATE POLICY "Instructors read course attempts"
  ON public.quiz_attempts FOR SELECT
  USING ("quizId" IN (SELECT id FROM public.quizzes WHERE "createdBy" = auth.uid()));

-- Admin override for all tables
CREATE POLICY "Admin full access [table]"
  ON public.[table] FOR ALL
  USING (public.is_admin());
```

**Helper Function:**

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Role-Based UI Rendering

Components can conditionally render based on user role:

```typescript
const { user } = useAuth();

return (
    <div>
        {user?.role === 'student' && <StudentDashboard />}
        {user?.role === 'mentor' && <MentorDashboard />}
        {user?.role === 'admin' && <AdminDashboard />}
    </div>
);
```

---

## Route Protection

### Protected Route Implementation

The `ProtectedRoute` component wraps routes that require authentication and/or specific roles.

**File:** `components/ProtectedRoute.tsx`

```typescript
interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];  // Optional: restrict to specific roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    // 2. Authentication Check
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Role Authorization Check
    if (roles && !roles.includes(user.role)) {
        console.warn(`[RouteGuard] Access denied for user ${user.id} (${user.role})`);
        
        // Redirect to appropriate dashboard
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'mentor') return <Navigate to="/mentor" replace />;
        if (user.role === 'student') return <Navigate to="/student" replace />;
        
        return <Navigate to="/" replace />;
    }

    // 4. Authorized - Render Children
    return <>{children}</>;
};
```

### Route Configuration

**File:** `App.tsx`

```typescript
const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Common Protected Routes (any authenticated user) */}
            <Route path="/profile" element={
                <ProtectedRoute>
                    <Layout><Profile /></Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/forums" element={
                <ProtectedRoute>
                    <Layout><CommunityForums /></Layout>
                </ProtectedRoute>
            } />
            
            {/* Student Routes */}
            <Route path="/student" element={
                <ProtectedRoute roles={['student']}>
                    <Layout><StudentDashboard /></Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/student/quizzes" element={
                <ProtectedRoute roles={['student']}>
                    <Layout><StudentQuizList /></Layout>
                </ProtectedRoute>
            } />
            
            {/* Mentor Routes */}
            <Route path="/mentor" element={
                <ProtectedRoute roles={['mentor']}>
                    <Layout><MentorDashboard /></Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/mentor/courses" element={
                <ProtectedRoute roles={['mentor']}>
                    <Layout><MentorCourseManagement /></Layout>
                </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout><AdminDashboard /></Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout><AdminUserManagement /></Layout>
                </ProtectedRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={
                user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
            } />
        </Routes>
    );
};
```

### Route Protection Flow

```
User Navigates to Protected Route
         |
         v
   ProtectedRoute Component
         |
         v
   Is Loading? ──Yes──> Show Loading Spinner
         |
        No
         v
   Is Authenticated? ──No──> Redirect to /login
         |
        Yes
         v
   Role Required? ──No──> Render Children
         |
        Yes
         v
   Has Required Role? ──No──> Redirect to Role Dashboard
         |
        Yes
         v
   Render Children (Authorized)
```

### Redirect After Login

The `ProtectedRoute` preserves the attempted URL and redirects back after login:

```typescript
// ProtectedRoute saves location
<Navigate to="/login" state={{ from: location }} replace />

// Login page can redirect back
const location = useLocation();
const from = location.state?.from?.pathname || getRoleDefaultPath(user.role);
navigate(from, { replace: true });
```

---

## AuthContext and useAuth Hook

### AuthContext Provider

**File:** `lib/auth.tsx`

The `AuthProvider` manages global authentication state and provides auth methods to the entire application.

```typescript
interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<User>;
    logout: () => void;
    isLoading: boolean;
    updateUserProfile: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Session restoration on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const profile = await api.getProfile();
                setUser(profile);
            } catch (e) {
                console.error("Session check failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    // Login method
    const login = async (email: string, pass: string) => {
        try {
            const result = await api.login(email, pass);
            setUser(result.user);
            return result.user;
        } catch (error) {
            const networkError = createNetworkError(error);
            const userMessage = getNetworkErrorMessage(error);
            throw new Error(userMessage);
        }
    };

    // Logout method
    const logout = async () => {
        await api.logout();
        setUser(null);
    };

    // Update profile method
    const updateUserProfile = async (updatedData: Partial<User>) => {
        if (!user) throw new Error("No user to update");
        const updatedUser = { ...user, ...updatedData };
        await api.updateUser(updatedUser);
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, updateUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
```

### useAuth Hook

The `useAuth` hook provides access to authentication state and methods:

```typescript
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
```

**Usage Example:**

```typescript
import { useAuth } from '../lib/auth';

const MyComponent: React.FC = () => {
    const { user, login, logout, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>Please log in</div>;
    }

    return (
        <div>
            <h1>Welcome, {user.name}!</h1>
            <p>Role: {user.role}</p>
            <button onClick={logout}>Logout</button>
        </div>
    );
};
```

### App Integration

**File:** `App.tsx`

```typescript
const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ToastProvider>
                    <HashRouter>
                        <NetworkStatusIndicator />
                        <AppRoutes />
                    </HashRouter>
                </ToastProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};
```

The `AuthProvider` wraps the entire application, making authentication state available to all components.

### User Object Structure

```typescript
interface User {
    id: string;                    // UUID from auth.users
    email: string;                 // User's email address
    name: string;                  // Full name
    role: 'student' | 'mentor' | 'admin';  // User role
    createdAt: string;             // ISO timestamp
    accountStatus: string;         // 'ENABLED' or 'DISABLED'
    
    // Optional fields
    dob?: string;                  // Date of birth
    education?: string;            // Education level
    school?: string;               // School/institution
    state?: string;                // Location
    contact?: string;              // Phone number
    bio?: string;                  // Biography
    expertise?: string[];          // Areas of expertise (mentors)
    isOpenToMentorship?: boolean;  // Mentorship availability
    availability?: any;            // Schedule availability
}
```

---

## Security Features

### Password Validation

#### Strength Checking

**File:** `lib/utils.ts`

```typescript
export const checkPasswordStrength = (password: string) => {
    let score = 0;
    let level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong' = 'none';
    let text = '';

    if (!password) {
        return { score: 0, level: 'none', text: '' };
    }

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) score++;  // Lowercase
    if (/[A-Z]/.test(password)) score++;  // Uppercase
    if (/[0-9]/.test(password)) score++;  // Numbers
    if (/[^a-zA-Z0-9]/.test(password)) score++;  // Special characters

    // Determine level
    if (score <= 1) {
        level = 'very weak';
        text = 'Very weak password';
    } else if (score === 2) {
        level = 'weak';
        text = 'Weak password';
    } else if (score === 3) {
        level = 'medium';
        text = 'Medium strength';
    } else if (score === 4) {
        level = 'strong';
        text = 'Strong password';
    } else {
        level = 'very strong';
        text = 'Very strong password';
    }

    return { score, level, text };
};
```

#### Visual Feedback

**File:** `components/ui/PasswordStrengthMeter.tsx`

```typescript
interface PasswordStrengthMeterProps {
    level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
    text: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ level, text }) => {
    const getColor = () => {
        switch (level) {
            case 'very weak': return 'hsl(0 65% 50%)';
            case 'weak': return 'hsl(25 85% 55%)';
            case 'medium': return 'hsl(45 90% 55%)';
            case 'strong': return 'hsl(145 60% 45%)';
            case 'very strong': return 'hsl(145 70% 35%)';
            default: return 'hsl(220 10% 70%)';
        }
    };

    const getWidth = () => {
        switch (level) {
            case 'very weak': return '20%';
            case 'weak': return '40%';
            case 'medium': return '60%';
            case 'strong': return '80%';
            case 'very strong': return '100%';
            default: return '0%';
        }
    };

    return (
        <div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-300"
                    style={{ width: getWidth(), backgroundColor: getColor() }}
                />
            </div>
            {text && <p className="text-xs mt-1" style={{ color: getColor() }}>{text}</p>}
        </div>
    );
};
```

**Minimum Requirements:**
- Minimum 8 characters
- Strength score ≥ 3 (medium or higher)
- Enforced before registration submission

### Input Validation

**File:** `lib/formValidation.ts`

```typescript
export const validateRegistrationForm = (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
) => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!name || name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password || password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const validateLoginForm = (email: string, password: string) => {
    const errors: Record<string, string> = {};

    if (!email || !email.includes('@')) {
        errors.email = 'Please enter a valid email address';
    }

    if (!password || password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
```

### Row-Level Security (RLS)

Database-level security ensures users can only access data they're authorized to see.

**Key Policies:**

1. **Profile Access**
   - Users can read all profiles (needed for forums, mentorship)
   - Users can only update their own profile
   - Admins have full access

2. **Course Access**
   - All authenticated users can view courses
   - Mentors can only manage courses they created
   - Admins have full access

3. **Quiz Attempts**
   - Students can only view their own attempts
   - Mentors can view attempts for their quizzes
   - Admins have full access

4. **Forum Content**
   - All authenticated users can read
   - Users can only edit/delete their own posts
   - Admins can moderate all content

**Example Policy:**

```sql
-- Students can only read their own quiz attempts
CREATE POLICY "Students read own attempts"
  ON public.quiz_attempts FOR SELECT
  USING ("studentId" = auth.uid());

-- Mentors can read attempts for quizzes they created
CREATE POLICY "Instructors read course attempts"
  ON public.quiz_attempts FOR SELECT
  USING ("quizId" IN (
    SELECT id FROM public.quizzes WHERE "createdBy" = auth.uid()
  ));
```

### Network Error Handling

**File:** `lib/networkErrorHandler.ts`

```typescript
export const withNetworkErrorHandling = async <T>(
    operation: () => Promise<T>,
    options: { maxRetries?: number; timeout?: number } = {}
): Promise<T> => {
    const { maxRetries = 2, timeout = 10000 } = options;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            );

            const result = await Promise.race([
                operation(),
                timeoutPromise
            ]);

            return result as T;
        } catch (error) {
            lastError = error;
            
            // Don't retry on authentication errors
            if (isAuthError(error)) {
                throw error;
            }

            // Exponential backoff
            if (attempt < maxRetries) {
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, attempt) * 1000)
                );
            }
        }
    }

    throw lastError;
};

export const getNetworkErrorMessage = (error: any): string => {
    if (error?.message?.includes('timeout')) {
        return 'Connection timeout. Please check your internet connection.';
    }
    if (error?.message?.includes('network')) {
        return 'Network error. Please try again.';
    }
    if (error?.message?.includes('Invalid login credentials')) {
        return 'Invalid email or password.';
    }
    return error?.message || 'An unexpected error occurred.';
};
```

**Features:**
- Automatic retry with exponential backoff
- Configurable timeout
- User-friendly error messages
- No retry on authentication errors

### HTTPS Enforcement

**Production Configuration:**
- All API requests use HTTPS
- Supabase enforces HTTPS for all connections
- JWT tokens transmitted securely
- No sensitive data in URLs

---

## Error Handling

### Authentication Errors

#### Invalid Credentials

```typescript
// Login error handling
try {
    const loggedInUser = await login(email, password);
    navigate(`/${loggedInUser.role}`);
} catch (err: any) {
    setError(err.message || 'Invalid credentials. Please try again.');
}
```

**User sees:** "Invalid email or password"

#### Email Already Registered

```typescript
// Registration error handling
try {
    await api.register({ name, email }, password);
} catch (err: any) {
    if (err.message.includes('already registered')) {
        setError('Email already in use. Please use a different email.');
    } else {
        setError(err.message || 'Failed to create account.');
    }
}
```

**User sees:** "Email already in use. Please use a different email."

#### Session Expired

```typescript
// Session check in AuthProvider
useEffect(() => {
    const checkSession = async () => {
        try {
            const profile = await api.getProfile();
            setUser(profile);
        } catch (e) {
            console.error("Session check failed", e);
            // User remains logged out, will be redirected to login
        } finally {
            setIsLoading(false);
        }
    };

    checkSession();
}, []);
```

**User sees:** Redirect to login page with message "Session expired, please log in again"

### Network Errors

#### Connection Timeout

```typescript
// Automatic timeout handling in API layer
return withNetworkErrorHandling(async () => {
    // API operation
}, { maxRetries: 2, timeout: 15000 });
```

**User sees:** "Connection timeout. Please check your internet connection."

#### Server Error

```typescript
// Generic server error handling
catch (error) {
    if (error.status >= 500) {
        setError('Server error. Please try again later.');
    }
}
```

**User sees:** "Server error. Please try again later."

### Validation Errors

#### Form Validation

```typescript
// Client-side validation before submission
const validation = validateRegistrationForm(name, email, password, confirmPassword);
if (!validation.isValid) {
    setFieldErrors(validation.errors);
    return;
}
```

**User sees:** Field-specific error messages:
- "Name must be at least 2 characters"
- "Please enter a valid email address"
- "Password must be at least 8 characters"
- "Passwords do not match"

#### Password Strength

```typescript
// Password strength enforcement
if (passwordStrength.score < 3) {
    setFieldErrors({ 
        password: "Password is too weak. Please choose a stronger password." 
    });
    return;
}
```

**User sees:** "Password is too weak. Please choose a stronger password."

### Error Display Component

**File:** `components/ui/FormError.tsx`

```typescript
interface FormErrorProps {
    error: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error }) => {
    return (
        <div className="flex items-center gap-2 mt-1.5 text-sm text-red-600">
            <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );
};
```

### Error Logging

```typescript
// Console logging for debugging
console.error("[Auth] Profile fetch failed:", profileError);
console.error("Session check failed", e);
console.warn(`[RouteGuard] Access denied for user ${user.id} (${user.role})`);
```

**Production:** Errors should be sent to monitoring service (e.g., Sentry)

---

## Logout Flow

### Logout Process

**File:** `lib/auth.tsx`

```typescript
const logout = async () => {
    await api.logout();
    setUser(null);
};
```

**File:** `lib/api.ts`

```typescript
export const logout = async () => {
    await supabase.auth.signOut();
};
```

### Step-by-Step Flow

1. **User Clicks Logout**
   - Typically from Layout sidebar or user menu
   - Calls `logout()` from `useAuth()` hook

2. **API Logout Call**
   - Calls `supabase.auth.signOut()`
   - Invalidates JWT tokens on server
   - Clears tokens from browser storage

3. **State Cleanup**
   - `setUser(null)` clears AuthContext state
   - All components re-render with no user

4. **Automatic Redirect**
   - `ProtectedRoute` detects no user
   - Redirects to `/login` page

### Logout Sequence Diagram

```
User              Layout           AuthContext        API Layer        Supabase
 |                  |                  |                 |                |
 |--Click Logout--->|                  |                 |                |
 |                  |--logout()------->|                 |                |
 |                  |                  |--api.logout()-->|                |
 |                  |                  |                 |--signOut()---->|
 |                  |                  |                 |                |--Invalidate-->|
 |                  |                  |                 |                |   JWT tokens  |
 |                  |                  |                 |<-Success-------|                |
 |                  |                  |<-Success--------|                |                |
 |                  |                  |--setUser(null)->|                |                |
 |                  |                  |  (Clear state)  |                |                |
 |<-Redirect to /login----------------|                 |                |                |
```

### Session Cleanup

**What Gets Cleared:**
- JWT access token
- JWT refresh token
- User state in AuthContext
- Browser storage (`localStorage` key: `supabase.auth.token`)

**What Persists:**
- User preferences (theme, etc.) in separate storage
- Browser history
- Cached static assets

### Logout Button Implementation

**File:** `components/Layout.tsx`

```typescript
import { useAuth } from '../lib/auth';

const Layout: React.FC = () => {
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            // Redirect handled automatically by ProtectedRoute
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div>
            {/* Sidebar navigation */}
            <button onClick={handleLogout}>
                <LogOutIcon />
                Logout
            </button>
        </div>
    );
};
```

---

## Code Examples

### Complete Login Implementation

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { validateLoginForm } from '../lib/formValidation';
import { FormError } from '../components/ui/FormError';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        
        // Validate form
        const validation = validateLoginForm(email, password);
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            return;
        }
        
        setIsLoading(true);
        try {
            const loggedInUser = await login(email, password);

            // Role-based redirect
            switch (loggedInUser.role) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'mentor':
                    navigate('/mentor');
                    break;
                case 'student':
                    navigate('/student');
                    break;
                default:
                    setError('Account has no valid role assigned.');
                    break;
            }
        } catch (err: any) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form onSubmit={handleLogin}>
                {error && (
                    <div className="auth-error-banner">
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label htmlFor="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {fieldErrors.email && <FormError error={fieldErrors.email} />}
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {fieldErrors.password && <FormError error={fieldErrors.password} />}
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
```

### Complete Registration Implementation

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';
import { checkPasswordStrength } from '../lib/utils';
import { validateRegistrationForm } from '../lib/formValidation';
import { FormError } from '../components/ui/FormError';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: 'none', text: '' });
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Update password strength on change
    useEffect(() => {
        setPasswordStrength(checkPasswordStrength(password));
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        
        // Validate form
        const validation = validateRegistrationForm(name, email, password, confirmPassword);
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            return;
        }
        
        // Check password strength
        if (passwordStrength.score < 3) {
            setFieldErrors({ password: "Password is too weak" });
            return;
        }
        
        setIsLoading(true);
        try {
            // Register user
            await api.register({ name, email }, password);
            
            // Auto-login
            const loggedInUser = await login(email, password);

            // Redirect based on role
            if (loggedInUser.role === 'admin') navigate('/admin');
            else if (loggedInUser.role === 'mentor') navigate('/mentor');
            else navigate('/student');
        } catch (err: any) {
            setError(err.message || 'Failed to create account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form onSubmit={handleSubmit}>
                {error && <div className="auth-error-banner">{error}</div>}

                <div>
                    <label htmlFor="name">Full name</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    {fieldErrors.name && <FormError error={fieldErrors.name} />}
                </div>

                <div>
                    <label htmlFor="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {fieldErrors.email && <FormError error={fieldErrors.email} />}
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <PasswordStrengthMeter 
                        level={passwordStrength.level} 
                        text={passwordStrength.text} 
                    />
                    {fieldErrors.password && <FormError error={fieldErrors.password} />}
                </div>

                <div>
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {fieldErrors.confirmPassword && <FormError error={fieldErrors.confirmPassword} />}
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Account'}
                </button>
            </form>
        </div>
    );
};

export default RegisterPage;
```

### Using useAuth Hook

```typescript
import { useAuth } from '../lib/auth';

// Access current user
const MyComponent: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;
    if (!user) return <div>Not logged in</div>;

    return (
        <div>
            <h1>Welcome, {user.name}!</h1>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
        </div>
    );
};

// Conditional rendering by role
const RoleBasedComponent: React.FC = () => {
    const { user } = useAuth();

    return (
        <div>
            {user?.role === 'student' && <StudentFeatures />}
            {user?.role === 'mentor' && <MentorFeatures />}
            {user?.role === 'admin' && <AdminFeatures />}
        </div>
    );
};

// Update user profile
const ProfileEditor: React.FC = () => {
    const { user, updateUserProfile } = useAuth();
    const [bio, setBio] = useState(user?.bio || '');

    const handleSave = async () => {
        try {
            await updateUserProfile({ bio });
            alert('Profile updated!');
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    return (
        <div>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            <button onClick={handleSave}>Save</button>
        </div>
    );
};
```

### Protected Route Usage

```typescript
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Any authenticated user */}
            <Route path="/profile" element={
                <ProtectedRoute>
                    <Layout><Profile /></Layout>
                </ProtectedRoute>
            } />

            {/* Student only */}
            <Route path="/student/quizzes" element={
                <ProtectedRoute roles={['student']}>
                    <Layout><StudentQuizList /></Layout>
                </ProtectedRoute>
            } />

            {/* Mentor only */}
            <Route path="/mentor/courses" element={
                <ProtectedRoute roles={['mentor']}>
                    <Layout><MentorCourseManagement /></Layout>
                </ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout><AdminUserManagement /></Layout>
                </ProtectedRoute>
            } />

            {/* Multiple roles */}
            <Route path="/forums" element={
                <ProtectedRoute roles={['student', 'mentor', 'admin']}>
                    <Layout><CommunityForums /></Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
};
```

---

## Security Best Practices

### 1. Password Security

**✅ DO:**
- Enforce minimum 8 characters
- Require password strength score ≥ 3
- Use password strength meter for visual feedback
- Hash passwords server-side (handled by Supabase)
- Never log or display passwords

**❌ DON'T:**
- Store passwords in plain text
- Send passwords in URL parameters
- Display password requirements after failed attempt
- Allow common passwords (e.g., "password123")

### 2. Session Management

**✅ DO:**
- Use short-lived access tokens (1 hour)
- Implement automatic token refresh
- Clear all tokens on logout
- Validate session on protected routes
- Log security-relevant events

**❌ DON'T:**
- Store tokens in URL or cookies without HttpOnly flag
- Share tokens between users
- Extend session indefinitely
- Trust client-side session validation alone

### 3. Role-Based Access

**✅ DO:**
- Verify roles on both frontend and backend
- Use RLS policies for database-level enforcement
- Log unauthorized access attempts
- Redirect unauthorized users gracefully
- Implement principle of least privilege

**❌ DON'T:**
- Rely solely on frontend role checks
- Expose admin functionality in client code
- Allow role escalation without admin approval
- Trust user-provided role information

### 4. Input Validation

**✅ DO:**
- Validate all inputs on client and server
- Sanitize user-provided data
- Use parameterized queries (handled by Supabase)
- Implement rate limiting on auth endpoints
- Provide clear validation error messages

**❌ DON'T:**
- Trust client-side validation alone
- Allow SQL injection vectors
- Accept arbitrary file uploads without validation
- Expose detailed error messages in production

### 5. Network Security

**✅ DO:**
- Use HTTPS for all requests (production)
- Implement request timeouts
- Use exponential backoff for retries
- Handle network errors gracefully
- Monitor for suspicious activity

**❌ DON'T:**
- Send credentials over HTTP
- Retry authentication failures automatically
- Expose API keys in client code
- Ignore CORS policies

### 6. Error Handling

**✅ DO:**
- Log errors server-side for debugging
- Show user-friendly error messages
- Distinguish between auth and network errors
- Implement error boundaries
- Monitor error rates

**❌ DON'T:**
- Expose stack traces to users
- Log sensitive information (passwords, tokens)
- Ignore authentication errors
- Show technical error details in production

### 7. Database Security

**✅ DO:**
- Enable Row-Level Security (RLS)
- Use database triggers for automatic actions
- Implement foreign key constraints
- Audit sensitive operations
- Backup data regularly

**❌ DON'T:**
- Disable RLS in production
- Grant excessive database permissions
- Store sensitive data unencrypted
- Allow direct database access from client

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "User profile not found" after registration

**Symptoms:**
- Registration succeeds but login fails
- Error message: "User profile not found"

**Causes:**
- Database trigger `handle_new_user()` not firing
- RLS policy blocking profile creation
- Profile table missing or misconfigured

**Solutions:**

1. **Check if trigger exists:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. **Verify trigger function:**
```sql
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```

3. **Test trigger manually:**
```sql
-- Check if profile was created
SELECT * FROM public.profiles WHERE email = 'test@example.com';
```

4. **Recreate trigger if missing:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

#### Issue: "Session expired" immediately after login

**Symptoms:**
- User logs in successfully
- Immediately redirected back to login
- Session doesn't persist

**Causes:**
- JWT token not being stored
- Browser blocking localStorage
- Supabase client misconfigured
- CORS issues

**Solutions:**

1. **Check browser storage:**
```javascript
// In browser console
console.log(localStorage.getItem('supabase.auth.token'));
```

2. **Verify Supabase client initialization:**
```typescript
// lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

3. **Check environment variables:**
```bash
# .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Clear browser storage and retry:**
```javascript
localStorage.clear();
sessionStorage.clear();
```

---

#### Issue: "Access denied" when accessing role-specific routes

**Symptoms:**
- User logged in but can't access their dashboard
- Redirected to different role's dashboard
- Console warning: "Access denied for user"

**Causes:**
- User role not set correctly in database
- Role mismatch between `auth.users` metadata and `profiles` table
- RLS policy blocking role query

**Solutions:**

1. **Verify user role in database:**
```sql
SELECT id, email, name, role FROM public.profiles WHERE email = 'user@example.com';
```

2. **Check if role is null:**
```sql
-- Find users with null roles
SELECT * FROM public.profiles WHERE role IS NULL;

-- Fix null roles
UPDATE public.profiles SET role = 'student' WHERE role IS NULL;
```

3. **Verify RLS policy allows role query:**
```sql
-- Test as specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid-here';
SELECT role FROM public.profiles WHERE id = 'user-uuid-here';
```

4. **Check AuthContext is receiving role:**
```typescript
// Add debug logging in lib/auth.tsx
const login = async (email: string, pass: string) => {
    const result = await api.login(email, pass);
    console.log('User logged in:', result.user);
    console.log('User role:', result.user.role);
    setUser(result.user);
    return result.user;
};
```

---

#### Issue: "Invalid login credentials" with correct password

**Symptoms:**
- User enters correct email and password
- Error: "Invalid login credentials"
- Registration works but login fails

**Causes:**
- Email not confirmed (if email confirmation enabled)
- User account disabled
- Password changed but not synced
- Supabase Auth misconfigured

**Solutions:**

1. **Check if email confirmation is required:**
```sql
-- In Supabase Dashboard: Authentication > Settings
-- Disable "Enable email confirmations" for development
```

2. **Verify user exists in auth.users:**
```sql
SELECT id, email, confirmed_at FROM auth.users WHERE email = 'user@example.com';
```

3. **Check account status:**
```sql
SELECT id, email, accountStatus FROM public.profiles WHERE email = 'user@example.com';
```

4. **Reset password via Supabase Dashboard:**
- Go to Authentication > Users
- Find user and click "Send password reset email"

---

#### Issue: Network timeout errors during login

**Symptoms:**
- Login takes very long
- Error: "Connection timeout"
- Intermittent failures

**Causes:**
- Slow network connection
- Supabase service issues
- Database query performance
- Timeout set too low

**Solutions:**

1. **Increase timeout in API calls:**
```typescript
// lib/api.ts
export const login = async (email: string, pass: string) => {
    return withNetworkErrorHandling(async () => {
        // ... login logic
    }, { maxRetries: 3, timeout: 30000 }); // Increase to 30 seconds
};
```

2. **Check Supabase status:**
- Visit https://status.supabase.com/

3. **Optimize profile query:**
```typescript
// Only select needed fields
const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, name, role, createdAt, accountStatus')
    .eq('id', data.user.id)
    .single();
```

4. **Add database indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
```

---

#### Issue: Password strength meter not updating

**Symptoms:**
- User types password but meter stays at 0
- Strength text doesn't change
- No visual feedback

**Causes:**
- `useEffect` dependency missing
- `checkPasswordStrength` function not called
- Component not re-rendering

**Solutions:**

1. **Verify useEffect dependency:**
```typescript
useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
}, [password]); // Make sure password is in dependency array
```

2. **Check if function is imported:**
```typescript
import { checkPasswordStrength } from '../lib/utils';
```

3. **Add debug logging:**
```typescript
useEffect(() => {
    const strength = checkPasswordStrength(password);
    console.log('Password strength:', strength);
    setPasswordStrength(strength);
}, [password]);
```

---

#### Issue: RLS policy blocking legitimate access

**Symptoms:**
- Database queries return empty results
- Error: "new row violates row-level security policy"
- User can't access their own data

**Causes:**
- RLS policy too restrictive
- `auth.uid()` not matching user ID
- Policy using wrong column name

**Solutions:**

1. **Test RLS policy:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

2. **Check auth.uid() value:**
```sql
-- Run as authenticated user
SELECT auth.uid();
```

3. **Verify policy logic:**
```sql
-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Test policy condition
SELECT * FROM public.profiles WHERE id = auth.uid();
```

4. **Add permissive policy for debugging:**
```sql
-- Temporary: Allow all authenticated users to read profiles
CREATE POLICY "temp_read_all" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

---

#### Issue: Logout doesn't clear session

**Symptoms:**
- User clicks logout but remains logged in
- Page refresh shows user still authenticated
- Tokens not cleared from storage

**Causes:**
- `signOut()` not called
- Browser storage not cleared
- Multiple tabs keeping session alive

**Solutions:**

1. **Verify logout implementation:**
```typescript
// lib/api.ts
export const logout = async () => {
    await supabase.auth.signOut();
};

// lib/auth.tsx
const logout = async () => {
    await api.logout();
    setUser(null);
};
```

2. **Force clear storage:**
```typescript
const logout = async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
};
```

3. **Check for multiple Supabase clients:**
```typescript
// Ensure only one client instance
// lib/supabase.ts should export a single client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

#### Issue: "Failed to fetch" error on login

**Symptoms:**
- Error: "Failed to fetch"
- Network tab shows request blocked
- CORS error in console

**Causes:**
- Incorrect Supabase URL
- CORS misconfiguration
- Ad blocker or browser extension
- Network firewall

**Solutions:**

1. **Verify Supabase URL:**
```typescript
// Should be: https://your-project.supabase.co
// NOT: https://your-project.supabase.co/
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

2. **Check CORS settings in Supabase:**
- Dashboard > Settings > API
- Ensure your domain is allowed

3. **Test with browser extensions disabled:**
```bash
# Open browser in incognito/private mode
# Disable ad blockers and privacy extensions
```

4. **Check network connectivity:**
```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/
```

---

### Debugging Tools

#### Enable Verbose Logging

```typescript
// lib/api.ts - Add detailed logging
export const login = async (email: string, pass: string) => {
    console.log('[Auth] Login attempt for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
    });
    
    console.log('[Auth] Supabase response:', { data, error });
    
    if (error) {
        console.error('[Auth] Login error:', error);
        throw error;
    }
    
    console.log('[Auth] Fetching profile for user:', data.user.id);
    
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
    
    console.log('[Auth] Profile response:', { profile, profileError });
    
    return { user: profile as User };
};
```

#### Check Supabase Session

```typescript
// Add to any component
const { user } = useAuth();

useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session);
        console.log('Current user from context:', user);
    };
    
    checkSession();
}, [user]);
```

#### Monitor Network Requests

```typescript
// Add interceptor for debugging
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    console.log('Fetch request:', args[0]);
    const response = await originalFetch(...args);
    console.log('Fetch response:', response.status, response.statusText);
    return response;
};
```

---

### Getting Help

**Resources:**
- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Check for similar issues in Supabase repo

**Information to Include When Reporting Issues:**
1. Error message (full text)
2. Browser console logs
3. Network tab screenshot
4. Supabase project ID (if relevant)
5. Steps to reproduce
6. Expected vs actual behavior

---

## Summary

VidyaSetu's authentication system provides:

✅ **Secure Authentication**
- Supabase Auth with JWT tokens
- Password strength validation
- Automatic session management

✅ **Role-Based Access Control**
- Three distinct roles (student, mentor, admin)
- Frontend route guards
- Database RLS policies

✅ **User Experience**
- Automatic login after registration
- Persistent sessions across page reloads
- Role-specific dashboard routing
- Clear error messages

✅ **Security Features**
- Password hashing (Supabase)
- Row-Level Security
- Network error handling with retry
- Input validation and sanitization

✅ **Developer Experience**
- Simple `useAuth()` hook
- Reusable `ProtectedRoute` component
- Comprehensive error handling
- TypeScript type safety

For additional questions or issues not covered in this guide, refer to the troubleshooting section or consult the Supabase documentation.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** VidyaSetu Development Team
