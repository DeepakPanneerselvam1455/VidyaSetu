# VidyaSetu AI-Powered Learning Management System - Design Document

## Overview

VidyaSetu is a comprehensive AI-powered Learning Management System built with React 19, TypeScript, Vite, and Supabase. The system connects students with mentors through an integrated platform featuring AI-generated quizzes via Google Gemini, real-time tutoring sessions via Jitsi, course management, community forums, and mentorship automation. The architecture supports three distinct user roles (student, mentor, admin) with role-based access control and comprehensive activity logging.

### Key Design Principles

- **Role-Based Architecture**: Separate dashboards and feature sets for students, mentors, and administrators
- **AI-First Assessment**: Google Gemini integration for intelligent quiz generation with human review workflows
- **Real-Time Collaboration**: Jitsi JaaS integration for synchronous tutoring sessions
- **Data-Driven Insights**: Comprehensive analytics and progress tracking for all user roles
- **Security-First**: Row-Level Security (RLS) policies, input validation, and audit logging
- **Responsive Design**: Mobile-first approach with Tailwind CSS theming

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 19 + TypeScript + Vite                            │   │
│  │  ├─ Student Dashboard (courses, quizzes, mentorship)     │   │
│  │  ├─ Mentor Dashboard (course mgmt, quiz creation)        │   │
│  │  ├─ Admin Dashboard (user mgmt, analytics, moderation)   │   │
│  │  ├─ Common Pages (forums, tutoring, profile, settings)   │   │
│  │  └─ UI Component Library (Button, Card, Dialog, etc.)    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Supabase Client (lib/api.ts)                            │   │
│  │  ├─ Authentication (Supabase Auth)                       │   │
│  │  ├─ Database Operations (PostgreSQL via Supabase)        │   │
│  │  ├─ Real-time Subscriptions (Supabase Realtime)          │   │
│  │  ├─ File Storage (Supabase Storage)                      │   │
│  │  ├─ Google Gemini Integration (AI quiz generation)       │   │
│  │  └─ Jitsi Token Generation (Node.js token server)        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Supabase (PostgreSQL + Auth + Storage + Realtime)       │   │
│  │  ├─ Database: PostgreSQL with RLS policies               │   │
│  │  ├─ Auth: Supabase Auth with email/password              │   │
│  │  ├─ Storage: File uploads for course materials           │   │
│  │  └─ Realtime: WebSocket subscriptions for live updates   │   │
│  │                                                           │   │
│  │  External Services                                        │   │
│  │  ├─ Google Gemini API (quiz generation)                  │   │
│  │  ├─ Jitsi JaaS (video conferencing)                      │   │
│  │  └─ Node.js Token Server (Jitsi JWT generation)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

**Technology Stack**:
- React 19 with TypeScript for type-safe component development
- Vite for fast development and optimized production builds
- Tailwind CSS for utility-first styling with theme support
- React Router (HashRouter) for client-side routing
- Context API for state management (Auth, Theme)

**Directory Structure**:
```
src/
├── App.tsx                 # Root component with route definitions
├── index.tsx              # Entry point
├── index.css              # Global styles
├── pages/                 # Route components organized by role
│   ├── student/           # Student-specific pages
│   ├── mentor/            # Mentor-specific pages
│   ├── admin/             # Admin-specific pages
│   └── common/            # Shared pages (forums, tutoring, etc.)
├── components/            # Reusable React components
│   ├── ui/                # UI primitives (Button, Card, Input, etc.)
│   ├── Layout.tsx         # Main layout with sidebar navigation
│   ├── ProtectedRoute.tsx # Route guard with role-based access
│   ├── ChatBot.tsx        # AI chatbot component
│   └── SessionCalendar.tsx # Calendar for session scheduling
├── lib/                   # Core utilities and services
│   ├── api.ts             # All Supabase API calls and Gemini integration
│   ├── auth.tsx           # AuthContext provider and useAuth hook
│   ├── supabase.ts        # Supabase client initialization
│   ├── theme.tsx          # ThemeContext for light/dark mode
│   ├── activityLog.ts     # Activity logging utilities
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript interfaces
    └── index.ts           # All type definitions
```

### Backend Architecture

**Supabase Stack**:
- PostgreSQL database with Row-Level Security (RLS) policies
- Supabase Auth for user authentication and session management
- Supabase Storage for course materials and file uploads
- Supabase Realtime for WebSocket-based live updates

**External Integrations**:
- Google Gemini API for AI-powered quiz generation
- Jitsi JaaS for video conferencing infrastructure
- Node.js token server for Jitsi JWT token generation

## Components and Interfaces

### Core Data Models

```typescript
// User Profile
interface Profile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: 'student' | 'mentor' | 'admin';
  expertise?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Course
interface Course {
  id: string;
  mentorId: string;
  title: string;
  description: string;
  learningObjectives: string[];
  materials: CourseMaterial[];
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

// Quiz
interface Quiz {
  id: string;
  courseId: string;
  mentorId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  isAIGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

// Quiz Attempt
interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  submittedAt: string;
}

// Tutoring Session
interface TutoringSession {
  id: string;
  mentorId: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  participants: string[];
  jitsiRoomName: string;
  status: 'scheduled' | 'active' | 'completed';
  createdAt: string;
}

// Mentorship Request
interface MentorshipRequest {
  id: string;
  studentId: string;
  mentorId: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Forum Thread
interface ForumThread {
  id: string;
  categoryId: string;
  creatorId: string;
  title: string;
  content: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

// Activity Log
interface ActivityLog {
  id: string;
  userId: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  timestamp: string;
}
```

### UI Component Library

**Core Components** (in `components/ui/`):
- `Button.tsx` - Reusable button with variants (primary, secondary, danger)
- `Card.tsx` - Container component for content grouping
- `Input.tsx` - Text input with validation support
- `Textarea.tsx` - Multi-line text input
- `Dialog.tsx` - Modal dialog component
- `Select.tsx` - Dropdown select component
- `Badge.tsx` - Label/tag component
- `DropdownMenu.tsx` - Context menu component
- `PasswordStrengthMeter.tsx` - Password strength indicator
- `Icons.tsx` - SVG icon components

**Layout Components**:
- `Layout.tsx` - Main layout with role-based sidebar navigation
- `ProtectedRoute.tsx` - Route guard enforcing role-based access control

**Feature Components**:
- `ChatBot.tsx` - AI chatbot for student support
- `SessionCalendar.tsx` - Calendar interface for session scheduling

### Page Components

**Student Pages** (`pages/student/`):
- `StudentDashboard.tsx` - Overview of enrolled courses and progress
- `StudentMyCourses.tsx` - List of enrolled courses with details
- `StudentQuizList.tsx` - Available quizzes for enrolled courses
- `StudentQuizView.tsx` - Quiz taking interface
- `StudentProgress.tsx` - Progress tracking across courses
- `StudentMentorship.tsx` - Mentorship request management
- `StudentTutoring.tsx` - Tutoring session scheduling and joining

**Mentor Pages** (`pages/mentor/`):
- `MentorDashboard.tsx` - Overview of created courses and students
- `MentorCourseManagement.tsx` - Course creation and management
- `MentorAddCourse.tsx` - Course creation form
- `MentorCourseDetail.tsx` - Course details and student management
- `MentorQuizManagement.tsx` - Quiz management interface
- `MentorGenerateQuiz.tsx` - AI quiz generation interface
- `MentorManualQuiz.tsx` - Manual quiz creation
- `MentorEditQuiz.tsx` - Quiz editing interface
- `MentorGradingView.tsx` - Quiz grading and feedback
- `MentorStudentAnalytics.tsx` - Student performance analytics
- `MentorStudentProgress.tsx` - Individual student progress tracking
- `MentorMentorship.tsx` - Mentorship request management
- `MentorTutoring.tsx` - Tutoring session management

**Admin Pages** (`pages/admin/`):
- `AdminDashboard.tsx` - System overview and key metrics
- `AdminUserManagement.tsx` - User account management
- `AdminCreateUser.tsx` - User creation form
- `AdminStudentProgress.tsx` - System-wide student progress
- `AdminCourseAnalytics.tsx` - Course performance analytics
- `AdminContentModeration.tsx` - Forum content moderation
- `AdminReports.tsx` - System reports and exports
- `AdminSecurity.tsx` - Security settings and audit logs
- `AdminSettings.tsx` - System configuration

**Common Pages** (`pages/common/`):
- `CommunityForums.tsx` - Forum listing and navigation
- `ForumThreadView.tsx` - Thread view with posts
- `TutoringRoom.tsx` - Jitsi video conferencing interface

**Auth Pages**:
- `Login.tsx` - User login form
- `Register.tsx` - User registration form
- `Profile.tsx` - User profile view and editing
- `Settings.tsx` - User settings and preferences

## Data Models

### Database Schema

**Core Tables**:

```sql
-- Profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
  expertise TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  learning_objectives JSONB DEFAULT '[]',
  materials JSONB DEFAULT '[]',
  enrollment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course Enrollments
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress_percentage FLOAT DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score FLOAT NOT NULL,
  max_score FLOAT NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Tutoring Sessions
CREATE TABLE tutoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER,
  participants JSONB DEFAULT '[]',
  jitsi_room_name TEXT UNIQUE,
  status TEXT CHECK (status IN ('scheduled', 'active', 'completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mentorship Requests
CREATE TABLE mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Forum Categories
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Forum Threads
CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reply_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Row-Level Security (RLS) Policies

**Profiles Table**:
- Students can view their own profile and mentor profiles
- Mentors can view their own profile and student profiles
- Admins can view all profiles

**Courses Table**:
- Mentors can view/edit/delete their own courses
- Students can view courses they're enrolled in
- Admins can view all courses

**Quiz Attempts Table**:
- Students can view their own attempts
- Mentors can view attempts for their quizzes
- Admins can view all attempts

**Forum Tables**:
- All authenticated users can view threads and posts
- Users can edit/delete their own posts
- Admins can moderate all content

**Activity Logs Table**:
- Users can view their own logs
- Admins can view all logs

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: User Registration Creates Profile

*For any* new user registration with valid email, password, and full name, the system should create a corresponding profile record in the profiles table with the correct role assigned.

**Validates: Requirements 1.1, 2.1**

### Property 2: Authentication Establishes Session

*For any* user with valid credentials, successful authentication should establish a session that persists across page reloads until explicitly logged out.

**Validates: Requirements 1.2, 2.2**

### Property 3: Role-Based Access Control

*For any* authenticated user attempting to access a protected route, the system should verify their role and either grant access or redirect to their role-specific dashboard.

**Validates: Requirements 1.3, 2.2, 3.1, 17.1**

### Property 4: Session Termination

*For any* authenticated user, logging out should clear all session tokens and require re-authentication to access protected routes.

**Validates: Requirements 1.4, 17.5**

### Property 5: Profile Data Persistence

*For any* user profile update, the changes should be persisted to the database and reflected on subsequent profile views.

**Validates: Requirements 1.5, 2.3, 2.4**

### Property 6: Course Enrollment Increment

*For any* student enrolling in a course, the course's enrollment count should increase by exactly one and the student should appear in the course's enrollment list.

**Validates: Requirements 4.3**

### Property 7: Course Material Storage

*For any* course materials added by a mentor, the materials should be stored in the JSONB materials array and be retrievable by enrolled students.

**Validates: Requirements 5.5**

### Property 8: AI Quiz Generation

*For any* quiz generation request with a valid topic, the system should call the Google Gemini API and store the generated questions in the quizzes table.

**Validates: Requirements 6.2, 6.3, 19.1, 19.2**

### Property 9: Quiz Question Validation

*For any* manually created quiz question, the system should validate that the question text and at least two options are provided before storage.

**Validates: Requirements 7.2**

### Property 10: Quiz Submission Recording

*For any* quiz submission, the system should record the attempt with timestamp, answers, and calculated score in the quiz_attempts table.

**Validates: Requirements 8.2, 8.3**

### Property 11: Mentorship Request Creation

*For any* mentorship request from a student to a mentor, the system should create a mentorship_requests record with pending status and notify the mentor.

**Validates: Requirements 9.2**

### Property 12: Mentorship Request Approval

*For any* approved mentorship request, the system should establish the relationship and notify the student of approval.

**Validates: Requirements 9.4**

### Property 13: Tutoring Session Creation

*For any* tutoring session created by a mentor, the system should store session details including date, time, and participants in the tutoring_sessions table.

**Validates: Requirements 10.2**

### Property 14: Jitsi Token Generation

*For any* user accessing a tutoring room, the system should generate a unique JWT token using the Jitsi token server and embed it in the Jitsi iframe.

**Validates: Requirements 11.1, 11.2, 20.1, 20.2**

### Property 15: Forum Thread Creation

*For any* forum thread created by a user, the system should store the thread with creator information and make it visible to all users.

**Validates: Requirements 12.2**

### Property 16: Forum Post Reply Count

*For any* forum post added to a thread, the system should increment the thread's reply count by exactly one.

**Validates: Requirements 12.3**

### Property 17: Forum Post Ordering

*For any* forum thread, all posts should be displayed in chronological order with timestamps and creator information.

**Validates: Requirements 12.4**

### Property 18: Content Moderation Logging

*For any* moderation action taken by an administrator, the system should log the action in the Activity_Log with timestamp and user information.

**Validates: Requirements 13.5, 17.3, 24.1**

### Property 19: User Activity Logging

*For any* user action, the system should log the action with timestamp, user ID, action type, and affected resource in the activity_logs table.

**Validates: Requirements 24.1**

### Property 20: Theme Persistence

*For any* user theme selection, the system should persist the preference and apply it to all pages without requiring a page reload.

**Validates: Requirements 23.2, 23.4**

### Property 21: Input Validation

*For any* form submission, the system should validate all input fields according to their data types and constraints before processing.

**Validates: Requirements 27.1**

### Property 22: Input Sanitization

*For any* user-submitted text, the system should sanitize the input to remove potentially malicious content before storage.

**Validates: Requirements 27.2**

### Property 23: Responsive Layout

*For any* page accessed on a mobile device, the system should display a responsive layout optimized for small screens with touch-friendly elements.

**Validates: Requirements 28.1, 28.2**

### Property 24: API Retry Logic

*For any* failed Google Gemini API call, the system should implement exponential backoff retry logic with a maximum of 3 attempts before displaying an error.

**Validates: Requirements 19.3**

### Property 25: Database Referential Integrity

*For any* database operation, the system should maintain referential integrity through foreign key constraints and cascade delete related records appropriately.

**Validates: Requirements 18.5**

### Property 26: RLS Policy Enforcement

*For any* database query, the system should apply Row-Level Security policies to restrict data access based on the user's role and ownership.

**Validates: Requirements 17.4, 18.4**

### Property 27: Quiz Score Calculation

*For any* quiz submission, the system should calculate the score as the number of correct answers divided by total questions, resulting in a value between 0 and 100.

**Validates: Requirements 8.3**

### Property 28: Course Progress Tracking

*For any* enrolled student, the system should track their progress as the percentage of completed quizzes in the course.

**Validates: Requirements 4.6, 15.1**

### Property 29: Mentor Student Count

*For any* mentor, the student count should equal the number of unique students enrolled in their courses.

**Validates: Requirements 2.3**

### Property 30: Mentor Course Count

*For any* mentor, the course count should equal the number of courses they have created.

**Validates: Requirements 2.3**

## Error Handling

### Error Categories

**Authentication Errors**:
- Invalid credentials → Display "Invalid email or password"
- Email already registered → Display "Email already in use"
- Session expired → Redirect to login with "Session expired, please log in again"
- Unauthorized access → Redirect to role-specific dashboard

**Validation Errors**:
- Missing required fields → Display field-specific error messages
- Invalid email format → Display "Please enter a valid email address"
- Weak password → Display password strength requirements
- Duplicate entries → Display "This item already exists"

**API Errors**:
- Network timeout → Display "Connection timeout, please try again"
- Server error (5xx) → Display "Server error, please try again later"
- Rate limit exceeded → Display "Too many requests, please wait before trying again"
- Invalid API response → Log error and display generic message

**Database Errors**:
- Constraint violation → Display user-friendly message based on constraint type
- Transaction failure → Retry operation or display "Operation failed, please try again"
- RLS policy violation → Display "You don't have permission to access this resource"

### Error Handling Strategy

1. **Client-Side Validation**: Validate all inputs before submission
2. **API Error Handling**: Catch and handle errors from Supabase and external APIs
3. **User Feedback**: Display clear, actionable error messages
4. **Logging**: Log all errors with context for debugging
5. **Graceful Degradation**: Provide fallback UI when features fail

## Testing Strategy

### Unit Testing Approach

**Test Framework**: Vitest with React Testing Library

**Test Coverage Areas**:
- Component rendering and props validation
- User interactions (clicks, form submissions)
- State management and context updates
- Utility function logic
- Input validation and sanitization
- Error message display

**Example Unit Tests**:
- Button component renders with correct text and handles click
- Input component validates email format and displays error
- Quiz scoring calculates correct percentage
- Course enrollment updates enrollment count
- Theme toggle persists preference

### Property-Based Testing Approach

**PBT Framework**: fast-check (JavaScript/TypeScript)

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: vidyasetu-complete-platform, Property {number}: {property_text}`

**Property Test Examples**:
- For any valid user data, registration creates a profile with correct role
- For any quiz submission, score is between 0 and 100
- For any course enrollment, enrollment count increases by exactly one
- For any theme selection, preference persists across page reloads
- For any API failure, retry logic executes up to 3 times

### Integration Testing

**Test Scenarios**:
- Complete user registration and login flow
- Course creation, enrollment, and quiz completion
- Mentorship request workflow (request → approval → connection)
- Tutoring session scheduling and Jitsi room access
- Forum thread creation and post replies
- Content moderation workflow

### E2E Testing

**Test Scenarios**:
- Student dashboard → enroll in course → take quiz → view results
- Mentor dashboard → create course → generate quiz → view student analytics
- Admin dashboard → manage users → view analytics → moderate content
- Forum navigation → create thread → post reply → mark helpful
- Tutoring session → schedule → join Jitsi room → end session

### Performance Testing

**Metrics**:
- Page load time < 2 seconds
- Search results < 500ms
- Quiz submission processing < 1 second
- Concurrent user load testing

**Tools**: Lighthouse, WebPageTest, k6 for load testing

### Accessibility Testing

**Standards**: WCAG 2.1 Level AA

**Test Areas**:
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Form labels and error messages
- Focus management

