# VidyaSetu Database Schema Documentation

## Table of Contents
1. [Database Overview](#database-overview)
2. [Architecture](#architecture)
3. [Tables](#tables)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Functions](#functions)
7. [Triggers](#triggers)
8. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
9. [Storage Buckets](#storage-buckets)
10. [JSONB Column Structures](#jsonb-column-structures)
11. [Enums and Constraints](#enums-and-constraints)
12. [Entity Relationship Diagram](#entity-relationship-diagram)
13. [Example Queries](#example-queries)

---

## Database Overview

VidyaSetu uses PostgreSQL hosted on Supabase with comprehensive Row-Level Security (RLS) policies. The database supports three user roles (student, mentor, admin) with role-based access control enforced at the database level.

**Key Features:**
- PostgreSQL with UUID extension for primary keys
- Row-Level Security (RLS) enabled on all tables
- JSONB columns for flexible nested data structures
- Comprehensive indexing for performance optimization
- Automated triggers for timestamp management
- Cascade delete policies for referential integrity
- Supabase Auth integration for user management

**Database Version:** PostgreSQL (Supabase-hosted)  
**Schema:** `public`  
**Extensions:** `uuid-ossp`

---

## Architecture

### Design Principles

1. **Security-First**: RLS policies enforce role-based access at the database level
2. **Referential Integrity**: Foreign key constraints with appropriate cascade rules
3. **Performance**: Strategic indexes on frequently queried columns
4. **Flexibility**: JSONB columns for complex nested data structures
5. **Audit Trail**: Automated timestamp tracking on all tables
6. **Scalability**: Efficient query patterns with compound indexes

### Data Flow

```
User Authentication (Supabase Auth)
         ↓
    profiles table (auto-created via trigger)
         ↓
Role-Based Access Control (RLS Policies)
         ↓
Application Data (courses, quizzes, forums, etc.)
```

---

## Tables

### 1. profiles

**Purpose:** Stores public user data linked to Supabase Auth. This is the central user table that connects to all other user-related data.

**Use Case:** User profiles, role management, account settings, and user discovery for mentorship.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User ID from Supabase Auth |
| `email` | TEXT | - | User email address |
| `name` | TEXT | - | User's full name |
| `role` | TEXT | CHECK (role IN ('student', 'mentor', 'admin')), DEFAULT 'student' | User role for access control |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Account creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |
| `accountStatus` | TEXT | DEFAULT 'ENABLED' | Account status (ENABLED/DISABLED) |
| `dob` | DATE | - | Date of birth |
| `education` | TEXT | - | Educational background |
| `school` | TEXT | - | School/institution name |
| `state` | TEXT | - | Geographic state/region |
| `contact` | TEXT | - | Contact information |
| `bio` | TEXT | - | User biography |
| `expertise` | TEXT[] | - | Array of expertise areas (for mentors) |
| `isOpenToMentorship` | BOOLEAN | - | Whether user is open to mentorship |
| `availability` | JSONB | - | Availability schedule (flexible structure) |

#### Relationships
- **Referenced by:** courses (mentorId), quizzes (createdBy), quiz_assignments (studentId, assignedBy), quiz_attempts (studentId, gradedBy), forum_threads (authorId), forum_posts (authorId), mentorship_requests (studentId, mentorId), tutoring_sessions (mentorId), direct_messages (sender_id, receiver_id), activity_logs, user_progress (userId)

#### RLS Policies
- `Anyone can read profiles` - All authenticated users can view profiles
- `Users update own profile` - Users can only update their own profile (or admin)
- `Admin full access profiles` - Admins have full CRUD access

#### Indexes
- `idx_profiles_role` - On `role` column for role-based queries
- `idx_profiles_email` - On `email` column for user lookup

#### Example Queries
```sql
-- Get all mentors open to mentorship
SELECT * FROM profiles 
WHERE role = 'mentor' AND "isOpenToMentorship" = true;

-- Get user profile with expertise
SELECT id, name, email, role, expertise, bio 
FROM profiles 
WHERE id = 'user-uuid';
```

---

### 2. courses

**Purpose:** Stores course metadata created by mentors, including learning materials and objectives.

**Use Case:** Course management, student enrollment, and learning material organization.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique course identifier |
| `title` | TEXT | NOT NULL | Course title |
| `description` | TEXT | - | Course description |
| `difficulty` | TEXT | - | Course difficulty level |
| `mentorId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Course creator (mentor) |
| `instructorName` | TEXT | - | Instructor name (display) |
| `institutionName` | TEXT | - | Institution name |
| `publishDate` | DATE | - | Course publish date |
| `language` | TEXT | - | Course language |
| `topics` | TEXT[] | - | Array of course topics |
| `materials` | JSONB | - | Course materials (see JSONB structure) |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |

#### Relationships
- **References:** profiles (mentorId)
- **Referenced by:** quizzes (courseId)

#### RLS Policies
- `Anyone can read courses` - All authenticated users can view courses
- `Mentors manage own courses` - Mentors can INSERT/UPDATE/DELETE their own courses
- `Admin full access courses` - Admins have full CRUD access

#### Indexes
- `idx_courses_mentor` - On `mentorId` for mentor's course queries
- `idx_courses_difficulty` - On `difficulty` for filtering by difficulty

#### Example Queries
```sql
-- Get all courses by a mentor
SELECT * FROM courses WHERE "mentorId" = 'mentor-uuid';

-- Get courses with materials
SELECT id, title, description, materials 
FROM courses 
WHERE difficulty = 'beginner';
```

---

### 3. quizzes

**Purpose:** Stores quiz metadata and questions, supporting both AI-generated and manually created quizzes.

**Use Case:** Assessment creation, quiz management, and student evaluation.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique quiz identifier |
| `courseId` | UUID | REFERENCES courses(id) ON DELETE CASCADE | Associated course |
| `title` | TEXT | NOT NULL | Quiz title |
| `difficulty` | TEXT | - | Quiz difficulty level |
| `createdBy` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Quiz creator (mentor) |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |
| `duration` | INTEGER | - | Quiz duration in minutes |
| `aiInvolvement` | TEXT | - | Level of AI involvement in creation |
| `questions` | JSONB | - | Quiz questions array (see JSONB structure) |
| `generatedByAi` | BOOLEAN | - | Whether quiz was AI-generated |
| `sourceType` | TEXT | - | Source type (topic, file, manual) |
| `sourceFileNames` | TEXT[] | - | Source file names if uploaded |
| `extractedTextHash` | TEXT | - | Hash of extracted text for deduplication |

#### Relationships
- **References:** courses (courseId), profiles (createdBy)
- **Referenced by:** quiz_assignments (quizId), quiz_attempts (quizId)

#### RLS Policies
- `Students read assigned quizzes` - Students see quizzes assigned to them or created by them
- `Mentors create quizzes` - Mentors can create quizzes
- `Mentors update own quizzes` - Mentors can update/delete their own quizzes
- `Admin full access quizzes` - Admins have full CRUD access

#### Indexes
- `idx_quizzes_course` - On `courseId` for course-specific quiz queries
- `idx_quizzes_createdby` - On `createdBy` for mentor's quiz queries
- `idx_quizzes_difficulty` - On `difficulty` for filtering by difficulty

#### Example Queries
```sql
-- Get all quizzes for a course
SELECT * FROM quizzes WHERE "courseId" = 'course-uuid';

-- Get AI-generated quizzes
SELECT id, title, "generatedByAi", "aiInvolvement" 
FROM quizzes 
WHERE "generatedByAi" = true;
```

---

### 4. quiz_assignments

**Purpose:** Links students to quizzes, managing quiz assignments and due dates.

**Use Case:** Quiz distribution, assignment tracking, and deadline management.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique assignment identifier |
| `quizId` | UUID | REFERENCES quizzes(id) ON DELETE CASCADE | Assigned quiz |
| `studentId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Student receiving assignment |
| `assignedBy` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Mentor who assigned the quiz |
| `dueDate` | TIMESTAMP WITH TIME ZONE | - | Assignment due date |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Assignment creation timestamp |

#### Relationships
- **References:** quizzes (quizId), profiles (studentId, assignedBy)

#### RLS Policies
- `Students read own assignments` - Students see their own assignments
- `Mentors create assignments` - Mentors can assign quizzes
- `Mentors update own assignments` - Mentors can update/delete assignments they created
- `Admin full access assignments` - Admins have full CRUD access

#### Indexes
- `idx_quiz_assignments_student` - On `studentId` for student's assignment queries
- `idx_quiz_assignments_quiz` - On `quizId` for quiz-specific assignment queries
- `idx_quiz_assignments_student_quiz` - Compound index on (`studentId`, `quizId`) for common query pattern

#### Example Queries
```sql
-- Get all assignments for a student
SELECT qa.*, q.title, q.difficulty 
FROM quiz_assignments qa
JOIN quizzes q ON qa."quizId" = q.id
WHERE qa."studentId" = 'student-uuid';

-- Check if student has assignment for specific quiz
SELECT * FROM quiz_assignments 
WHERE "studentId" = 'student-uuid' AND "quizId" = 'quiz-uuid';
```

---

### 5. quiz_attempts

**Purpose:** Records student quiz submissions with answers, scores, and grading information.

**Use Case:** Quiz submission tracking, grading, feedback, and performance analytics.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique attempt identifier |
| `quizId` | UUID | REFERENCES quizzes(id) ON DELETE CASCADE | Quiz being attempted |
| `studentId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Student taking the quiz |
| `submittedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Submission timestamp |
| `score` | INTEGER | - | Calculated score |
| `totalPoints` | INTEGER | - | Total possible points |
| `answers` | JSONB | - | Student answers (see JSONB structure) |
| `feedback` | TEXT | - | Per-question feedback |
| `overallFeedback` | TEXT | - | Overall feedback from grader |
| `gradedBy` | UUID | REFERENCES profiles(id) ON DELETE SET NULL | Mentor who graded (if manual) |
| `gradedAt` | TIMESTAMP WITH TIME ZONE | - | Grading timestamp |
| `overriddenScore` | INTEGER | - | Manually overridden score |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |

#### Relationships
- **References:** quizzes (quizId), profiles (studentId, gradedBy)

#### RLS Policies
- `Students read own attempts` - Students can view their own attempts
- `Students submit attempts` - Students can submit new attempts
- `Instructors read course attempts` - Mentors can view attempts for their quizzes
- `Instructors grade attempts` - Mentors can update attempts for grading
- `Admin full access attempts` - Admins have full CRUD access

#### Indexes
- `idx_quiz_attempts_student` - On `studentId` for student's attempt queries
- `idx_quiz_attempts_quiz` - On `quizId` for quiz-specific attempt queries
- `idx_quiz_attempts_student_quiz` - Compound index on (`studentId`, `quizId`) for common query pattern

#### Example Queries
```sql
-- Get all attempts for a student
SELECT qa.*, q.title 
FROM quiz_attempts qa
JOIN quizzes q ON qa."quizId" = q.id
WHERE qa."studentId" = 'student-uuid'
ORDER BY qa."submittedAt" DESC;

-- Get average score for a quiz
SELECT AVG(score::float / "totalPoints" * 100) as avg_percentage
FROM quiz_attempts
WHERE "quizId" = 'quiz-uuid';
```

---

### 6. forum_categories

**Purpose:** Organizes forum discussions into categories for better navigation and content organization.

**Use Case:** Forum organization, topic grouping, and content discovery.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique category identifier |
| `name` | TEXT | NOT NULL | Category name |
| `description` | TEXT | - | Category description |
| `icon` | TEXT | - | Icon identifier for UI |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |

#### Relationships
- **Referenced by:** forum_threads (categoryId)

#### RLS Policies
- `Anyone can read forum categories` - All authenticated users can view categories
- `Admin manage categories` - Only admins can create/update/delete categories

#### Example Queries
```sql
-- Get all forum categories
SELECT * FROM forum_categories ORDER BY name;

-- Get category with thread count
SELECT fc.*, COUNT(ft.id) as thread_count
FROM forum_categories fc
LEFT JOIN forum_threads ft ON fc.id = ft."categoryId"
GROUP BY fc.id;
```

---

### 7. forum_threads

**Purpose:** Stores forum discussion threads created by users.

**Use Case:** Community discussions, Q&A, knowledge sharing, and peer support.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique thread identifier |
| `categoryId` | UUID | REFERENCES forum_categories(id) ON DELETE CASCADE | Thread category |
| `authorId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Thread creator |
| `authorName` | TEXT | - | Author name (denormalized for performance) |
| `title` | TEXT | NOT NULL | Thread title |
| `content` | TEXT | - | Thread content/description |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |
| `views` | INTEGER | DEFAULT 0 | View count |
| `upvotes` | TEXT[] | - | Array of user IDs who upvoted |
| `replyCount` | INTEGER | DEFAULT 0 | Number of replies |
| `tags` | TEXT[] | - | Thread tags for categorization |

#### Relationships
- **References:** forum_categories (categoryId), profiles (authorId)
- **Referenced by:** forum_posts (threadId)

#### RLS Policies
- `Anyone can read threads` - All authenticated users can view threads
- `Auth create threads` - Authenticated users can create threads
- `Authors update own threads` - Authors can update their own threads (or admin)
- `Authors delete own threads` - Authors can delete their own threads (or admin)

#### Indexes
- `idx_forum_threads_category` - On `categoryId` for category-specific queries
- `idx_forum_threads_author` - On `authorId` for author's thread queries

#### Example Queries
```sql
-- Get threads in a category with reply count
SELECT * FROM forum_threads 
WHERE "categoryId" = 'category-uuid'
ORDER BY "updatedAt" DESC;

-- Get popular threads (most upvotes)
SELECT *, array_length(upvotes, 1) as upvote_count
FROM forum_threads
ORDER BY array_length(upvotes, 1) DESC NULLS LAST
LIMIT 10;
```

---

### 8. forum_posts

**Purpose:** Stores replies to forum threads.

**Use Case:** Thread discussions, replies, and community engagement.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique post identifier |
| `threadId` | UUID | REFERENCES forum_threads(id) ON DELETE CASCADE | Parent thread |
| `authorId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Post author |
| `authorName` | TEXT | - | Author name (denormalized) |
| `content` | TEXT | - | Post content |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |
| `upvotes` | TEXT[] | - | Array of user IDs who upvoted |

#### Relationships
- **References:** forum_threads (threadId), profiles (authorId)

#### RLS Policies
- `Anyone can read posts` - All authenticated users can view posts
- `Auth create posts` - Authenticated users can create posts
- `Authors update own posts` - Authors can update their own posts (or admin)
- `Authors delete own posts` - Authors can delete their own posts (or admin)

#### Indexes
- `idx_forum_posts_thread` - On `threadId` for thread-specific post queries
- `idx_forum_posts_author` - On `authorId` for author's post queries

#### Example Queries
```sql
-- Get all posts in a thread
SELECT * FROM forum_posts 
WHERE "threadId" = 'thread-uuid'
ORDER BY "createdAt" ASC;

-- Get recent posts by user
SELECT fp.*, ft.title as thread_title
FROM forum_posts fp
JOIN forum_threads ft ON fp."threadId" = ft.id
WHERE fp."authorId" = 'user-uuid'
ORDER BY fp."createdAt" DESC;
```

---

### 9. mentorship_requests

**Purpose:** Manages mentorship relationship requests between students and mentors.

**Use Case:** Mentorship connection workflow, request tracking, and relationship establishment.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique request identifier |
| `studentId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Student requesting mentorship |
| `mentorId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Mentor being requested |
| `message` | TEXT | - | Request message from student |
| `status` | TEXT | DEFAULT 'pending', CHECK (status IN ('pending', 'accepted', 'rejected')) | Request status |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Request creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |

#### Relationships
- **References:** profiles (studentId, mentorId)

#### RLS Policies
- `Users read own requests` - Users can view requests they sent or received
- `Students create requests` - Students can create mentorship requests
- `Mentors update received requests` - Mentors can update requests they received
- `Admin full access requests` - Admins have full CRUD access

#### Indexes
- `idx_mentorship_requests_student` - On `studentId` for student's request queries
- `idx_mentorship_requests_mentor` - On `mentorId` for mentor's request queries

#### Example Queries
```sql
-- Get pending requests for a mentor
SELECT mr.*, p.name as student_name, p.email as student_email
FROM mentorship_requests mr
JOIN profiles p ON mr."studentId" = p.id
WHERE mr."mentorId" = 'mentor-uuid' AND mr.status = 'pending';

-- Check if mentorship request exists
SELECT * FROM mentorship_requests
WHERE "studentId" = 'student-uuid' AND "mentorId" = 'mentor-uuid';
```

---

### 10. tutoring_sessions

**Purpose:** Manages scheduled tutoring sessions with video conferencing details.

**Use Case:** Session scheduling, participant management, and Jitsi room coordination.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique session identifier |
| `mentorId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Session host (mentor) |
| `studentIds` | TEXT[] | - | Array of student IDs participating |
| `startTime` | TIMESTAMP WITH TIME ZONE | - | Session start time |
| `endTime` | TIMESTAMP WITH TIME ZONE | - | Session end time |
| `duration` | INTEGER | - | Session duration in minutes |
| `status` | TEXT | CHECK (status IN ('scheduled', 'active', 'completed', 'canceled')) | Session status |
| `topic` | TEXT | - | Session topic |
| `description` | TEXT | - | Session description |
| `type` | TEXT | - | Session type (1-on-1, group, etc.) |
| `category` | TEXT | - | Session category |
| `focus` | TEXT | - | Session focus area |
| `maxStudents` | INTEGER | - | Maximum number of students |
| `meetingLink` | TEXT | - | Jitsi meeting link |
| `privateNotes` | TEXT | - | Private notes for mentor |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |

#### Relationships
- **References:** profiles (mentorId)

#### RLS Policies
- `Anyone can read sessions` - All authenticated users can view sessions (for discovery)
- `Mentors create sessions` - Mentors can create sessions
- `Mentors update own sessions` - Mentors can update/delete their own sessions
- `Admin full access sessions` - Admins have full CRUD access

#### Indexes
- `idx_tutoring_sessions_mentor` - On `mentorId` for mentor's session queries
- `idx_tutoring_sessions_status` - On `status` for filtering by status

#### Example Queries
```sql
-- Get upcoming sessions for a mentor
SELECT * FROM tutoring_sessions
WHERE "mentorId" = 'mentor-uuid' 
  AND status = 'scheduled'
  AND "startTime" > NOW()
ORDER BY "startTime" ASC;

-- Get sessions a student is enrolled in
SELECT * FROM tutoring_sessions
WHERE 'student-uuid' = ANY("studentIds")
  AND status IN ('scheduled', 'active');
```

---

### 11. direct_messages

**Purpose:** Stores direct messages between users for private communication.

**Use Case:** Private messaging, mentor-student communication, and user-to-user chat.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique message identifier |
| `sender_id` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Message sender |
| `receiver_id` | UUID | REFERENCES profiles(id) ON DELETE CASCADE | Message receiver |
| `message` | TEXT | NOT NULL | Message content |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Message timestamp |
| `read` | BOOLEAN | DEFAULT false | Whether message has been read |

#### Relationships
- **References:** profiles (sender_id, receiver_id)

#### RLS Policies
- `Users read own messages` - Users can view messages they sent or received
- `Users send messages` - Users can send messages as themselves
- `Users delete own messages` - Users can delete messages they sent (or admin)

#### Indexes
- `idx_direct_messages_sender` - On `sender_id` for sender's message queries
- `idx_direct_messages_receiver` - On `receiver_id` for receiver's message queries
- `idx_direct_messages_conversation` - Compound index on (`sender_id`, `receiver_id`) for conversation queries

#### Example Queries
```sql
-- Get conversation between two users
SELECT * FROM direct_messages
WHERE (sender_id = 'user1-uuid' AND receiver_id = 'user2-uuid')
   OR (sender_id = 'user2-uuid' AND receiver_id = 'user1-uuid')
ORDER BY created_at ASC;

-- Get unread messages for a user
SELECT dm.*, p.name as sender_name
FROM direct_messages dm
JOIN profiles p ON dm.sender_id = p.id
WHERE dm.receiver_id = 'user-uuid' AND dm.read = false;
```

---

### 12. activity_logs

**Purpose:** Records user actions for audit trails and analytics.

**Use Case:** Activity tracking, audit logging, and user behavior analytics.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique log identifier |
| `type` | TEXT | - | Activity type (login, quiz_submit, etc.) |
| `title` | TEXT | - | Activity title/description |
| `details` | JSONB | - | Additional activity details |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Activity timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc', now()) | Last update timestamp |

#### Relationships
- None (uses JSONB details for flexible user references)

#### RLS Policies
- `Users read own logs` - Users can view logs related to them (via details JSONB)
- `Auth insert logs` - Authenticated users can insert logs
- `Admin full access logs` - Admins can view all logs

#### Example Queries
```sql
-- Get recent activity for a user
SELECT * FROM activity_logs
WHERE details->>'userId' = 'user-uuid'
ORDER BY timestamp DESC
LIMIT 50;

-- Get quiz submission activities
SELECT * FROM activity_logs
WHERE type = 'quiz_submit'
ORDER BY timestamp DESC;
```

---

### 13. user_progress

**Purpose:** Tracks user progress through course materials.

**Use Case:** Progress tracking, completion status, and learning analytics.

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `userId` | UUID | REFERENCES profiles(id) ON DELETE CASCADE, PRIMARY KEY (userId, materialId) | User tracking progress |
| `materialId` | TEXT | PRIMARY KEY (userId, materialId) | Material identifier |

#### Relationships
- **References:** profiles (userId)

#### RLS Policies
- `Users manage own progress` - Users can view/update their own progress

#### Example Queries
```sql
-- Get all completed materials for a user
SELECT * FROM user_progress
WHERE "userId" = 'user-uuid';

-- Check if user completed specific material
SELECT EXISTS(
  SELECT 1 FROM user_progress
  WHERE "userId" = 'user-uuid' AND "materialId" = 'material-id'
);
```

---

## Relationships

### Entity Relationship Summary

```
profiles (central user table)
  ├─→ courses (mentorId)
  │    └─→ quizzes (courseId)
  │         ├─→ quiz_assignments (quizId)
  │         └─→ quiz_attempts (quizId)
  ├─→ quizzes (createdBy)
  ├─→ quiz_assignments (studentId, assignedBy)
  ├─→ quiz_attempts (studentId, gradedBy)
  ├─→ forum_threads (authorId)
  ├─→ forum_posts (authorId)
  ├─→ mentorship_requests (studentId, mentorId)
  ├─→ tutoring_sessions (mentorId)
  ├─→ direct_messages (sender_id, receiver_id)
  └─→ user_progress (userId)

forum_categories
  └─→ forum_threads (categoryId)
       └─→ forum_posts (threadId)
```

### Foreign Key Cascade Rules

| Parent Table | Child Table | Column | On Delete |
|--------------|-------------|--------|-----------|
| auth.users | profiles | id | CASCADE |
| profiles | courses | mentorId | CASCADE |
| profiles | quizzes | createdBy | CASCADE |
| profiles | quiz_assignments | studentId, assignedBy | CASCADE |
| profiles | quiz_attempts | studentId | CASCADE |
| profiles | quiz_attempts | gradedBy | SET NULL |
| profiles | forum_threads | authorId | CASCADE |
| profiles | forum_posts | authorId | CASCADE |
| profiles | mentorship_requests | studentId, mentorId | CASCADE |
| profiles | tutoring_sessions | mentorId | CASCADE |
| profiles | direct_messages | sender_id, receiver_id | CASCADE |
| profiles | user_progress | userId | CASCADE |
| courses | quizzes | courseId | CASCADE |
| quizzes | quiz_assignments | quizId | CASCADE |
| quizzes | quiz_attempts | quizId | CASCADE |
| forum_categories | forum_threads | categoryId | CASCADE |
| forum_threads | forum_posts | threadId | CASCADE |

---

## Indexes

### Performance Optimization Strategy

Indexes are strategically placed on:
1. **Foreign keys** - For efficient JOIN operations
2. **Filter columns** - For WHERE clause optimization
3. **Compound indexes** - For common multi-column query patterns
4. **Role columns** - For role-based access queries

### Index Catalog

| Index Name | Table | Columns | Purpose |
|------------|-------|---------|---------|
| `idx_profiles_role` | profiles | role | Role-based user queries |
| `idx_profiles_email` | profiles | email | User lookup by email |
| `idx_courses_mentor` | courses | mentorId | Mentor's course queries |
| `idx_courses_difficulty` | courses | difficulty | Filter by difficulty |
| `idx_quizzes_course` | quizzes | courseId | Course-specific quizzes |
| `idx_quizzes_createdby` | quizzes | createdBy | Mentor's quiz queries |
| `idx_quizzes_difficulty` | quizzes | difficulty | Filter by difficulty |
| `idx_quiz_assignments_student` | quiz_assignments | studentId | Student's assignments |
| `idx_quiz_assignments_quiz` | quiz_assignments | quizId | Quiz-specific assignments |
| `idx_quiz_assignments_student_quiz` | quiz_assignments | studentId, quizId | Common query pattern |
| `idx_quiz_attempts_student` | quiz_attempts | studentId | Student's attempts |
| `idx_quiz_attempts_quiz` | quiz_attempts | quizId | Quiz-specific attempts |
| `idx_quiz_attempts_student_quiz` | quiz_attempts | studentId, quizId | Common query pattern |
| `idx_forum_threads_category` | forum_threads | categoryId | Category threads |
| `idx_forum_threads_author` | forum_threads | authorId | Author's threads |
| `idx_forum_posts_thread` | forum_posts | threadId | Thread posts |
| `idx_forum_posts_author` | forum_posts | authorId | Author's posts |
| `idx_mentorship_requests_student` | mentorship_requests | studentId | Student's requests |
| `idx_mentorship_requests_mentor` | mentorship_requests | mentorId | Mentor's requests |
| `idx_tutoring_sessions_mentor` | tutoring_sessions | mentorId | Mentor's sessions |
| `idx_tutoring_sessions_status` | tutoring_sessions | status | Filter by status |
| `idx_direct_messages_sender` | direct_messages | sender_id | Sender's messages |
| `idx_direct_messages_receiver` | direct_messages | receiver_id | Receiver's messages |
| `idx_direct_messages_conversation` | direct_messages | sender_id, receiver_id | Conversation queries |

### Index Usage Examples

```sql
-- Uses idx_courses_mentor
SELECT * FROM courses WHERE "mentorId" = 'mentor-uuid';

-- Uses idx_quiz_attempts_student_quiz (compound index)
SELECT * FROM quiz_attempts 
WHERE "studentId" = 'student-uuid' AND "quizId" = 'quiz-uuid';

-- Uses idx_forum_threads_category
SELECT * FROM forum_threads WHERE "categoryId" = 'category-uuid';
```

---

## Functions

### 1. get_user_role()

**Purpose:** Helper function to retrieve the current user's role for RLS policies.

**Returns:** TEXT (role: 'student', 'mentor', or 'admin')

**Security:** SECURITY DEFINER (runs with elevated privileges)

```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $
  SELECT role FROM public.profiles WHERE id = auth.uid();
$;
```

**Usage in RLS:**
```sql
-- Example RLS policy using get_user_role()
CREATE POLICY "Role-based access"
  ON some_table FOR SELECT
  USING (public.get_user_role() = 'admin');
```

---

### 2. is_admin()

**Purpose:** Check if the current user has admin role.

**Returns:** BOOLEAN (true if admin, false otherwise)

**Security:** SECURITY DEFINER (runs with elevated privileges)

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

**Usage:**
```sql
-- Check admin status in queries
SELECT * FROM sensitive_data WHERE public.is_admin();

-- Use in RLS policies
CREATE POLICY "Admin full access"
  ON some_table FOR ALL
  USING (public.is_admin());
```

---

### 3. handle_new_user()

**Purpose:** Automatically create a profile when a new user signs up via Supabase Auth.

**Trigger:** AFTER INSERT on auth.users

**Security:** SECURITY DEFINER (runs with elevated privileges)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
DECLARE
  assigned_role TEXT;
BEGIN
  -- Check if an admin assigned a specific role via metadata
  assigned_role := COALESCE(new.raw_user_meta_data->>'admin_assigned_role', 'student');

  -- Validate the role is one of the allowed values
  IF assigned_role NOT IN ('student', 'mentor', 'admin') THEN
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', assigned_role);
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Behavior:**
- Automatically creates profile on user signup
- Defaults to 'student' role unless admin assigns different role
- Validates role is one of: student, mentor, admin
- Extracts name from user metadata

---

### 4. update_updated_at()

**Purpose:** Automatically update the `updatedAt` timestamp on row updates.

**Trigger:** BEFORE UPDATE on multiple tables

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW."updatedAt" = timezone('utc'::text, now());
  RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

**Applied to tables:**
- profiles
- courses
- quizzes
- quiz_attempts
- forum_categories
- forum_threads
- forum_posts
- mentorship_requests
- tutoring_sessions
- activity_logs

---

### 5. join_tutoring_session()

**Purpose:** Allow students to join a tutoring session (bypasses RLS for this specific operation).

**Parameters:**
- `p_session_id` UUID - Session to join
- `p_student_id` UUID - Student joining

**Returns:** BOOLEAN (true if successful)

**Security:** SECURITY DEFINER (bypasses RLS)

```sql
CREATE OR REPLACE FUNCTION public.join_tutoring_session(p_session_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $
DECLARE
  current_ids TEXT[];
  max_students INTEGER;
  current_count INTEGER;
BEGIN
  -- Verify the student exists and is authenticated
  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get current state
  SELECT "studentIds", "maxStudents" INTO current_ids, max_students
  FROM public.tutoring_sessions
  WHERE id = p_session_id AND status = 'scheduled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or not joinable';
  END IF;

  -- Check if already joined
  IF p_student_id::TEXT = ANY(COALESCE(current_ids, ARRAY[]::TEXT[])) THEN
    RETURN TRUE; -- Already joined
  END IF;

  -- Check capacity
  current_count := COALESCE(array_length(current_ids, 1), 0);
  IF max_students IS NOT NULL AND current_count >= max_students THEN
    RAISE EXCEPTION 'Session is full';
  END IF;

  -- Add student
  UPDATE public.tutoring_sessions
  SET "studentIds" = COALESCE(current_ids, ARRAY[]::TEXT[]) || ARRAY[p_student_id::TEXT]
  WHERE id = p_session_id;

  RETURN TRUE;
END;
$;
```

**Usage:**
```sql
-- Student joins a session
SELECT public.join_tutoring_session('session-uuid', 'student-uuid');
```

---

### 6. mark_messages_read()

**Purpose:** Mark all messages from a specific sender as read (bypasses RLS).

**Parameters:**
- `p_sender_id` UUID - Sender whose messages to mark as read

**Returns:** INTEGER (number of messages marked as read)

**Security:** SECURITY DEFINER (bypasses RLS)

```sql
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_sender_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.direct_messages
  SET read = true
  WHERE sender_id = p_sender_id
    AND receiver_id = auth.uid()
    AND read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$;
```

**Usage:**
```sql
-- Mark all messages from a sender as read
SELECT public.mark_messages_read('sender-uuid');
```

---

## Triggers

### 1. on_auth_user_created

**Table:** auth.users  
**Event:** AFTER INSERT  
**Function:** handle_new_user()

**Purpose:** Automatically create a profile in the profiles table when a new user signs up.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

**Behavior:**
- Fires after new user is created in Supabase Auth
- Creates corresponding profile with default 'student' role
- Extracts user metadata (name, email) from auth record

---

### 2. set_updated_at

**Tables:** profiles, courses, quizzes, quiz_attempts, forum_categories, forum_threads, forum_posts, mentorship_requests, tutoring_sessions, activity_logs  
**Event:** BEFORE UPDATE  
**Function:** update_updated_at()

**Purpose:** Automatically update the `updatedAt` timestamp whenever a row is modified.

```sql
-- Applied to each table via dynamic SQL
CREATE TRIGGER set_updated_at 
  BEFORE UPDATE ON public.{table_name} 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
```

**Behavior:**
- Fires before any UPDATE operation
- Sets `updatedAt` to current UTC timestamp
- Ensures accurate modification tracking

---

## Row-Level Security (RLS) Policies

### Overview

All tables have RLS enabled to enforce role-based access control at the database level. Policies use the `auth.uid()` function to identify the current user and the `is_admin()` helper function for admin checks.

### Policy Patterns

**Pattern 1: Public Read, Owner Write**
- Anyone authenticated can read
- Only owner (or admin) can modify

**Pattern 2: Role-Based Access**
- Different permissions based on user role
- Uses `get_user_role()` or `is_admin()` functions

**Pattern 3: Relationship-Based Access**
- Access based on relationships (e.g., mentor-student)
- Uses JOINs in policy conditions

---

### profiles Table Policies

```sql
-- Anyone can read profiles (needed for mentorship, forums, etc.)
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can only update their own profile (or admin)
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Admin has full access
CREATE POLICY "Admin full access profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());
```

---

### courses Table Policies

```sql
-- Anyone authenticated can read all courses
CREATE POLICY "Anyone can read courses"
  ON public.courses FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Mentors can create courses (must be their own)
CREATE POLICY "Mentors manage own courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = "mentorId");

-- Mentors can update their own courses
CREATE POLICY "Mentors update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = "mentorId")
  WITH CHECK (auth.uid() = "mentorId");

-- Mentors can delete their own courses
CREATE POLICY "Mentors delete own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = "mentorId");

-- Admin has full access
CREATE POLICY "Admin full access courses"
  ON public.courses FOR ALL
  USING (public.is_admin());
```

---

### quizzes Table Policies

```sql
-- Students see only assigned quizzes + quizzes they created
CREATE POLICY "Students read assigned quizzes"
  ON public.quizzes FOR SELECT
  USING (
    id IN (SELECT "quizId" FROM public.quiz_assignments WHERE "studentId" = auth.uid())
    OR "createdBy" = auth.uid()
    OR public.is_admin()
  );

-- Mentors can create quizzes
CREATE POLICY "Mentors create quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = "createdBy");

-- Mentors can update their own quizzes
CREATE POLICY "Mentors update own quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() = "createdBy")
  WITH CHECK (auth.uid() = "createdBy");

-- Mentors can delete their own quizzes
CREATE POLICY "Mentors delete own quizzes"
  ON public.quizzes FOR DELETE
  USING (auth.uid() = "createdBy");

-- Admin has full access
CREATE POLICY "Admin full access quizzes"
  ON public.quizzes FOR ALL
  USING (public.is_admin());
```


### quiz_assignments Table Policies

```sql
-- Students see only their own assignments
CREATE POLICY "Students read own assignments"
  ON public.quiz_assignments FOR SELECT
  USING ("studentId" = auth.uid() OR "assignedBy" = auth.uid() OR public.is_admin());

-- Mentors can create assignments
CREATE POLICY "Mentors create assignments"
  ON public.quiz_assignments FOR INSERT
  WITH CHECK (auth.uid() = "assignedBy");

-- Mentors can update their own assignments
CREATE POLICY "Mentors update own assignments"
  ON public.quiz_assignments FOR UPDATE
  USING (auth.uid() = "assignedBy")
  WITH CHECK (auth.uid() = "assignedBy");

-- Mentors can delete their own assignments
CREATE POLICY "Mentors delete own assignments"
  ON public.quiz_assignments FOR DELETE
  USING (auth.uid() = "assignedBy");

-- Admin has full access
CREATE POLICY "Admin full access assignments"
  ON public.quiz_assignments FOR ALL
  USING (public.is_admin());
```

---

### quiz_attempts Table Policies

```sql
-- Students can read their own attempts
CREATE POLICY "Students read own attempts"
  ON public.quiz_attempts FOR SELECT
  USING ("studentId" = auth.uid());

-- Students can submit attempts
CREATE POLICY "Students submit attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK ("studentId" = auth.uid());

-- Instructors can read attempts for quizzes they created
CREATE POLICY "Instructors read course attempts"
  ON public.quiz_attempts FOR SELECT
  USING ("quizId" IN (SELECT id FROM public.quizzes WHERE "createdBy" = auth.uid()));

-- Instructors can grade attempts for their quizzes
CREATE POLICY "Instructors grade attempts"
  ON public.quiz_attempts FOR UPDATE
  USING ("quizId" IN (SELECT id FROM public.quizzes WHERE "createdBy" = auth.uid()))
  WITH CHECK ("quizId" IN (SELECT id FROM public.quizzes WHERE "createdBy" = auth.uid()));

-- Admin has full access
CREATE POLICY "Admin full access attempts"
  ON public.quiz_attempts FOR ALL
  USING (public.is_admin());
```

---

### Forum Policies

```sql
-- Forum Categories
CREATE POLICY "Anyone can read forum categories"
  ON public.forum_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage categories"
  ON public.forum_categories FOR ALL
  USING (public.is_admin());

-- Forum Threads
CREATE POLICY "Anyone can read threads"
  ON public.forum_threads FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth create threads"
  ON public.forum_threads FOR INSERT
  WITH CHECK (auth.uid() = "authorId");

CREATE POLICY "Authors update own threads"
  ON public.forum_threads FOR UPDATE
  USING (auth.uid() = "authorId" OR public.is_admin());

CREATE POLICY "Authors delete own threads"
  ON public.forum_threads FOR DELETE
  USING (auth.uid() = "authorId" OR public.is_admin());

-- Forum Posts
CREATE POLICY "Anyone can read posts"
  ON public.forum_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth create posts"
  ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() = "authorId");

CREATE POLICY "Authors update own posts"
  ON public.forum_posts FOR UPDATE
  USING (auth.uid() = "authorId" OR public.is_admin());

CREATE POLICY "Authors delete own posts"
  ON public.forum_posts FOR DELETE
  USING (auth.uid() = "authorId" OR public.is_admin());
```


### Other Table Policies

```sql
-- Direct Messages
CREATE POLICY "Users read own messages"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

CREATE POLICY "Users send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users delete own messages"
  ON public.direct_messages FOR DELETE
  USING (auth.uid() = sender_id OR public.is_admin());

-- Tutoring Sessions
CREATE POLICY "Anyone can read sessions"
  ON public.tutoring_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Mentors create sessions"
  ON public.tutoring_sessions FOR INSERT
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Mentors update own sessions"
  ON public.tutoring_sessions FOR UPDATE
  USING (auth.uid() = "mentorId")
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Mentors delete own sessions"
  ON public.tutoring_sessions FOR DELETE
  USING (auth.uid() = "mentorId");

CREATE POLICY "Admin full access sessions"
  ON public.tutoring_sessions FOR ALL
  USING (public.is_admin());

-- Mentorship Requests
CREATE POLICY "Users read own requests"
  ON public.mentorship_requests FOR SELECT
  USING (auth.uid() = "studentId" OR auth.uid() = "mentorId" OR public.is_admin());

CREATE POLICY "Students create requests"
  ON public.mentorship_requests FOR INSERT
  WITH CHECK (auth.uid() = "studentId");

CREATE POLICY "Mentors update received requests"
  ON public.mentorship_requests FOR UPDATE
  USING (auth.uid() = "mentorId")
  WITH CHECK (auth.uid() = "mentorId");

CREATE POLICY "Admin full access requests"
  ON public.mentorship_requests FOR ALL
  USING (public.is_admin());

-- User Progress
CREATE POLICY "Users manage own progress"
  ON public.user_progress FOR ALL
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Activity Logs
CREATE POLICY "Users read own logs"
  ON public.activity_logs FOR SELECT
  USING (
    details->>'studentId' = auth.uid()::text
    OR details->>'userId' = auth.uid()::text
    OR public.is_admin()
  );

CREATE POLICY "Auth insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin full access logs"
  ON public.activity_logs FOR ALL
  USING (public.is_admin());
```

---

## Storage Buckets

### 1. materials Bucket

**Purpose:** Store course materials (PDFs, videos, documents)

**Configuration:**
- **ID:** `materials`
- **Public:** Yes (read access)
- **File Size Limit:** 2GB (2,147,483,648 bytes)
- **Allowed MIME Types:** All (null)

**Policies:**
```sql
-- Public read access
CREATE POLICY "Public Access Materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'materials');

-- Authenticated users can upload
CREATE POLICY "Authenticated Upload Materials" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');

-- Users can delete their own files
CREATE POLICY "Authenticated Delete Own Materials" ON storage.objects
  FOR DELETE USING (bucket_id = 'materials' AND auth.uid() = owner);
```

---

### 2. avatars Bucket

**Purpose:** Store user profile avatars

**Configuration:**
- **ID:** `avatars`
- **Public:** Yes (read access)
- **File Size Limit:** 50MB (52,428,800 bytes)
- **Allowed MIME Types:** All (null)

**Policies:**
```sql
-- Public read access
CREATE POLICY "Public Access Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can upload
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Users can delete their own avatars
CREATE POLICY "Authenticated Delete Own Avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);
```

---

## JSONB Column Structures

### courses.materials

**Purpose:** Store flexible course material metadata

**Structure:**
```json
[
  {
    "id": "material-uuid",
    "title": "Introduction to React",
    "type": "video|pdf|document|link",
    "url": "https://storage.supabase.co/...",
    "description": "Course introduction video",
    "duration": 1800,
    "order": 1,
    "isRequired": true
  }
]
```

**Fields:**
- `id` - Unique material identifier
- `title` - Material title
- `type` - Material type (video, pdf, document, link)
- `url` - Storage URL or external link
- `description` - Material description
- `duration` - Duration in seconds (for videos)
- `order` - Display order
- `isRequired` - Whether material is required

---

### quizzes.questions

**Purpose:** Store quiz questions with multiple choice options

**Structure:**
```json
[
  {
    "id": "question-uuid",
    "text": "What is React?",
    "type": "multiple-choice|true-false|short-answer",
    "options": [
      {
        "id": "option-1",
        "text": "A JavaScript library",
        "isCorrect": true
      },
      {
        "id": "option-2",
        "text": "A programming language",
        "isCorrect": false
      }
    ],
    "explanation": "React is a JavaScript library for building user interfaces",
    "points": 10,
    "order": 1
  }
]
```

**Fields:**
- `id` - Unique question identifier
- `text` - Question text
- `type` - Question type (multiple-choice, true-false, short-answer)
- `options` - Array of answer options
  - `id` - Option identifier
  - `text` - Option text
  - `isCorrect` - Whether option is correct
- `explanation` - Explanation for correct answer
- `points` - Points awarded for correct answer
- `order` - Question order in quiz

---

### quiz_attempts.answers

**Purpose:** Store student answers to quiz questions

**Structure:**
```json
[
  {
    "questionId": "question-uuid",
    "selectedOptionId": "option-1",
    "textAnswer": "React is a library",
    "isCorrect": true,
    "pointsEarned": 10,
    "feedback": "Correct! React is indeed a JavaScript library."
  }
]
```

**Fields:**
- `questionId` - Reference to question ID
- `selectedOptionId` - Selected option ID (for multiple choice)
- `textAnswer` - Text answer (for short answer questions)
- `isCorrect` - Whether answer was correct
- `pointsEarned` - Points earned for this question
- `feedback` - Per-question feedback

---

### profiles.availability

**Purpose:** Store mentor availability schedule

**Structure:**
```json
{
  "monday": {
    "available": true,
    "slots": [
      {
        "start": "09:00",
        "end": "12:00"
      },
      {
        "start": "14:00",
        "end": "17:00"
      }
    ]
  },
  "tuesday": {
    "available": false,
    "slots": []
  }
}
```

**Fields:**
- Day keys (monday, tuesday, etc.)
  - `available` - Whether available on this day
  - `slots` - Array of time slots
    - `start` - Start time (HH:MM format)
    - `end` - End time (HH:MM format)

---

### activity_logs.details

**Purpose:** Store flexible activity metadata

**Structure:**
```json
{
  "userId": "user-uuid",
  "studentId": "student-uuid",
  "action": "quiz_submit",
  "resourceType": "quiz",
  "resourceId": "quiz-uuid",
  "score": 85,
  "metadata": {
    "quizTitle": "React Basics",
    "attemptNumber": 2
  }
}
```

**Fields:** (flexible, varies by activity type)
- `userId` - User performing action
- `studentId` - Student involved (if applicable)
- `action` - Action type
- `resourceType` - Type of resource affected
- `resourceId` - ID of resource affected
- Additional metadata specific to action type

---

## Enums and Constraints

### Role Constraint

**Table:** profiles  
**Column:** role  
**Values:** 'student', 'mentor', 'admin'

```sql
CHECK (role IN ('student', 'mentor', 'admin'))
```

---

### Mentorship Request Status

**Table:** mentorship_requests  
**Column:** status  
**Values:** 'pending', 'accepted', 'rejected'

```sql
CHECK (status IN ('pending', 'accepted', 'rejected'))
```

---

### Tutoring Session Status

**Table:** tutoring_sessions  
**Column:** status  
**Values:** 'scheduled', 'active', 'completed', 'canceled'

```sql
CHECK (status IN ('scheduled', 'active', 'completed', 'canceled'))
```

---

## Entity Relationship Diagram

### Text-Based ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                         auth.users (Supabase Auth)                   │
│  - id (UUID, PK)                                                     │
│  - email                                                             │
│  - encrypted_password                                                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ ON DELETE CASCADE
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            profiles                                  │
│  - id (UUID, PK, FK → auth.users)                                   │
│  - email, name, role, bio, expertise[]                              │
│  - accountStatus, dob, education, school, state, contact            │
│  - isOpenToMentorship, availability (JSONB)                         │
│  - createdAt, updatedAt                                             │
└──┬────────────┬────────────┬────────────┬────────────┬─────────────┘
   │            │            │            │            │
   │ mentorId   │ createdBy  │ studentId  │ authorId   │ sender_id/
   │            │            │            │            │ receiver_id
   ▼            ▼            ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ courses  │ │ quizzes  │ │quiz_     │ │forum_    │ │direct_       │
│          │ │          │ │assign-   │ │threads   │ │messages      │
│ - id     │ │ - id     │ │ments     │ │          │ │              │
│ - title  │ │ - title  │ │          │ │ - title  │ │ - message    │
│ - desc   │ │ - ques-  │ │ - quizId │ │ - content│ │ - read       │
│ - mentor │ │   tions  │ │ - student│ │ - views  │ │ - created_at │
│   Id     │ │   (JSONB)│ │   Id     │ │ - upvotes│ │              │
│ - topics │ │ - diff   │ │ - assign-│ │ - reply  │ │              │
│ - mater- │ │ - course │ │   edBy   │ │   Count  │ │              │
│   ials   │ │   Id     │ │ - dueDate│ │ - tags[] │ │              │
│  (JSONB) │ │ - created│ │          │ │ - categ- │ │              │
│          │ │   By     │ │          │ │   oryId  │ │              │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────────┘
     │            │            │            │
     │ courseId   │ quizId     │ threadId   │ categoryId
     ▼            ▼            ▼            ▼
     │      ┌──────────┐ ┌──────────┐ ┌──────────────┐
     │      │quiz_     │ │quiz_     │ │forum_        │
     │      │assign-   │ │attempts  │ │categories    │
     │      │ments     │ │          │ │              │
     └──────│          │ │ - answers│ │ - name       │
            │          │ │  (JSONB) │ │ - desc       │
            └──────────┘ │ - score  │ │ - icon       │
                         │ - student│ │              │
                         │   Id     │ └──────────────┘
                         │ - gradedBy│         │
                         │ - feedback│         │
                         └──────────┘         ▼
                                        ┌──────────┐
┌──────────────────┐                    │forum_    │
│tutoring_         │                    │posts     │
│sessions          │                    │          │
│                  │                    │ - content│
│ - mentorId       │                    │ - author │
│ - studentIds[]   │                    │   Id     │
│ - startTime      │                    │ - upvotes│
│ - status         │                    │ - thread │
│ - meetingLink    │                    │   Id     │
│ - maxStudents    │                    └──────────┘
└──────────────────┘

┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│mentorship_       │  │activity_     │  │user_         │
│requests          │  │logs          │  │progress      │
│                  │  │              │  │              │
│ - studentId      │  │ - type       │  │ - userId     │
│ - mentorId       │  │ - title      │  │ - materialId │
│ - message        │  │ - details    │  │              │
│ - status         │  │  (JSONB)     │  │              │
│  (pending/       │  │ - timestamp  │  │              │
│   accepted/      │  │              │  │              │
│   rejected)      │  │              │  │              │
└──────────────────┘  └──────────────┘  └──────────────┘
```

---

### Mermaid ERD

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "creates"
    PROFILES ||--o{ COURSES : "creates (mentorId)"
    PROFILES ||--o{ QUIZZES : "creates (createdBy)"
    PROFILES ||--o{ QUIZ_ASSIGNMENTS : "receives (studentId)"
    PROFILES ||--o{ QUIZ_ASSIGNMENTS : "assigns (assignedBy)"
    PROFILES ||--o{ QUIZ_ATTEMPTS : "submits (studentId)"
    PROFILES ||--o{ QUIZ_ATTEMPTS : "grades (gradedBy)"
    PROFILES ||--o{ FORUM_THREADS : "authors (authorId)"
    PROFILES ||--o{ FORUM_POSTS : "authors (authorId)"
    PROFILES ||--o{ MENTORSHIP_REQUESTS : "requests (studentId)"
    PROFILES ||--o{ MENTORSHIP_REQUESTS : "receives (mentorId)"
    PROFILES ||--o{ TUTORING_SESSIONS : "hosts (mentorId)"
    PROFILES ||--o{ DIRECT_MESSAGES : "sends (sender_id)"
    PROFILES ||--o{ DIRECT_MESSAGES : "receives (receiver_id)"
    PROFILES ||--o{ USER_PROGRESS : "tracks (userId)"
    
    COURSES ||--o{ QUIZZES : "contains (courseId)"
    QUIZZES ||--o{ QUIZ_ASSIGNMENTS : "assigned (quizId)"
    QUIZZES ||--o{ QUIZ_ATTEMPTS : "attempted (quizId)"
    
    FORUM_CATEGORIES ||--o{ FORUM_THREADS : "organizes (categoryId)"
    FORUM_THREADS ||--o{ FORUM_POSTS : "contains (threadId)"
    
    AUTH_USERS {
        uuid id PK
        text email
        text encrypted_password
    }
    
    PROFILES {
        uuid id PK
        text email
        text name
        text role
        text_array expertise
        jsonb availability
        timestamp createdAt
        timestamp updatedAt
    }
    
    COURSES {
        uuid id PK
        uuid mentorId FK
        text title
        text description
        text_array topics
        jsonb materials
        timestamp createdAt
        timestamp updatedAt
    }
    
    QUIZZES {
        uuid id PK
        uuid courseId FK
        uuid createdBy FK
        text title
        jsonb questions
        boolean generatedByAi
        timestamp createdAt
    }
    
    QUIZ_ASSIGNMENTS {
        uuid id PK
        uuid quizId FK
        uuid studentId FK
        uuid assignedBy FK
        timestamp dueDate
        timestamp createdAt
    }
    
    QUIZ_ATTEMPTS {
        uuid id PK
        uuid quizId FK
        uuid studentId FK
        jsonb answers
        integer score
        integer totalPoints
        uuid gradedBy FK
        timestamp submittedAt
    }
    
    FORUM_CATEGORIES {
        uuid id PK
        text name
        text description
        text icon
    }
    
    FORUM_THREADS {
        uuid id PK
        uuid categoryId FK
        uuid authorId FK
        text title
        text content
        integer views
        text_array upvotes
        integer replyCount
    }
    
    FORUM_POSTS {
        uuid id PK
        uuid threadId FK
        uuid authorId FK
        text content
        text_array upvotes
        timestamp createdAt
    }
    
    MENTORSHIP_REQUESTS {
        uuid id PK
        uuid studentId FK
        uuid mentorId FK
        text message
        text status
        timestamp createdAt
    }
    
    TUTORING_SESSIONS {
        uuid id PK
        uuid mentorId FK
        text_array studentIds
        timestamp startTime
        text status
        text meetingLink
        integer maxStudents
    }
    
    DIRECT_MESSAGES {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        text message
        boolean read
        timestamp created_at
    }
    
    ACTIVITY_LOGS {
        uuid id PK
        text type
        text title
        jsonb details
        timestamp timestamp
    }
    
    USER_PROGRESS {
        uuid userId PK_FK
        text materialId PK
    }
```

---

## Example Queries

### User and Profile Queries

```sql
-- Get user profile with role
SELECT id, name, email, role, expertise, bio
FROM profiles
WHERE id = 'user-uuid';

-- Get all mentors available for mentorship
SELECT id, name, email, expertise, bio, availability
FROM profiles
WHERE role = 'mentor' 
  AND "isOpenToMentorship" = true;

-- Get user count by role
SELECT role, COUNT(*) as user_count
FROM profiles
GROUP BY role;

-- Search users by name or email
SELECT id, name, email, role
FROM profiles
WHERE name ILIKE '%search-term%' 
   OR email ILIKE '%search-term%';
```

---

### Course Queries

```sql
-- Get all courses by a mentor
SELECT c.*, p.name as mentor_name
FROM courses c
JOIN profiles p ON c."mentorId" = p.id
WHERE c."mentorId" = 'mentor-uuid'
ORDER BY c."createdAt" DESC;

-- Get courses with enrollment count (requires enrollment table)
SELECT c.id, c.title, c.description, c.difficulty,
       COUNT(DISTINCT qa."studentId") as enrollment_count
FROM courses c
LEFT JOIN quizzes q ON c.id = q."courseId"
LEFT JOIN quiz_assignments qa ON q.id = qa."quizId"
GROUP BY c.id;

-- Get course with all materials
SELECT id, title, description, materials
FROM courses
WHERE id = 'course-uuid';

-- Search courses by topic
SELECT *
FROM courses
WHERE 'react' = ANY(topics);
```

---

### Quiz Queries

```sql
-- Get all quizzes for a course
SELECT q.*, p.name as creator_name
FROM quizzes q
JOIN profiles p ON q."createdBy" = p.id
WHERE q."courseId" = 'course-uuid'
ORDER BY q."createdAt" DESC;

-- Get AI-generated quizzes
SELECT id, title, difficulty, "generatedByAi", "aiInvolvement"
FROM quizzes
WHERE "generatedByAi" = true;

-- Get quiz with questions
SELECT id, title, description, questions, difficulty
FROM quizzes
WHERE id = 'quiz-uuid';

-- Get quizzes assigned to a student
SELECT q.*, qa."dueDate", qa."assignedBy"
FROM quizzes q
JOIN quiz_assignments qa ON q.id = qa."quizId"
WHERE qa."studentId" = 'student-uuid'
ORDER BY qa."dueDate" ASC;
```

---

### Quiz Attempt and Grading Queries

```sql
-- Get all attempts for a quiz
SELECT qa.*, p.name as student_name
FROM quiz_attempts qa
JOIN profiles p ON qa."studentId" = p.id
WHERE qa."quizId" = 'quiz-uuid'
ORDER BY qa."submittedAt" DESC;

-- Get student's quiz history
SELECT qa.*, q.title as quiz_title, q.difficulty
FROM quiz_attempts qa
JOIN quizzes q ON qa."quizId" = q.id
WHERE qa."studentId" = 'student-uuid'
ORDER BY qa."submittedAt" DESC;

-- Calculate average score for a quiz
SELECT 
  AVG(score::float / "totalPoints" * 100) as avg_percentage,
  COUNT(*) as attempt_count,
  MAX(score::float / "totalPoints" * 100) as highest_score,
  MIN(score::float / "totalPoints" * 100) as lowest_score
FROM quiz_attempts
WHERE "quizId" = 'quiz-uuid';

-- Get ungraded attempts for a mentor
SELECT qa.*, q.title as quiz_title, p.name as student_name
FROM quiz_attempts qa
JOIN quizzes q ON qa."quizId" = q.id
JOIN profiles p ON qa."studentId" = p.id
WHERE q."createdBy" = 'mentor-uuid'
  AND qa."gradedBy" IS NULL
ORDER BY qa."submittedAt" ASC;

-- Get student performance across all quizzes
SELECT 
  p.name as student_name,
  COUNT(qa.id) as total_attempts,
  AVG(qa.score::float / qa."totalPoints" * 100) as avg_score,
  MAX(qa.score::float / qa."totalPoints" * 100) as best_score
FROM quiz_attempts qa
JOIN profiles p ON qa."studentId" = p.id
WHERE qa."studentId" = 'student-uuid'
GROUP BY p.name;
```

---

### Forum Queries

```sql
-- Get all forum categories with thread counts
SELECT fc.*, COUNT(ft.id) as thread_count
FROM forum_categories fc
LEFT JOIN forum_threads ft ON fc.id = ft."categoryId"
GROUP BY fc.id
ORDER BY fc.name;

-- Get threads in a category with author info
SELECT ft.*, p.name as author_name, p.role as author_role
FROM forum_threads ft
JOIN profiles p ON ft."authorId" = p.id
WHERE ft."categoryId" = 'category-uuid'
ORDER BY ft."updatedAt" DESC;

-- Get thread with all posts
SELECT fp.*, p.name as author_name, p.role as author_role
FROM forum_posts fp
JOIN profiles p ON fp."authorId" = p.id
WHERE fp."threadId" = 'thread-uuid'
ORDER BY fp."createdAt" ASC;

-- Get popular threads (most upvotes)
SELECT 
  ft.*,
  array_length(ft.upvotes, 1) as upvote_count,
  p.name as author_name
FROM forum_threads ft
JOIN profiles p ON ft."authorId" = p.id
ORDER BY array_length(ft.upvotes, 1) DESC NULLS LAST
LIMIT 10;

-- Search forum threads by keyword
SELECT ft.*, p.name as author_name
FROM forum_threads ft
JOIN profiles p ON ft."authorId" = p.id
WHERE ft.title ILIKE '%keyword%' 
   OR ft.content ILIKE '%keyword%'
ORDER BY ft."createdAt" DESC;

-- Get user's forum activity
SELECT 
  (SELECT COUNT(*) FROM forum_threads WHERE "authorId" = 'user-uuid') as threads_created,
  (SELECT COUNT(*) FROM forum_posts WHERE "authorId" = 'user-uuid') as posts_created;
```

---

### Mentorship Queries

```sql
-- Get pending mentorship requests for a mentor
SELECT mr.*, p.name as student_name, p.email as student_email
FROM mentorship_requests mr
JOIN profiles p ON mr."studentId" = p.id
WHERE mr."mentorId" = 'mentor-uuid' 
  AND mr.status = 'pending'
ORDER BY mr."createdAt" DESC;

-- Get accepted mentorships for a student
SELECT mr.*, p.name as mentor_name, p.expertise
FROM mentorship_requests mr
JOIN profiles p ON mr."mentorId" = p.id
WHERE mr."studentId" = 'student-uuid' 
  AND mr.status = 'accepted';

-- Check if mentorship request exists
SELECT EXISTS(
  SELECT 1 FROM mentorship_requests
  WHERE "studentId" = 'student-uuid' 
    AND "mentorId" = 'mentor-uuid'
) as request_exists;

-- Get mentor's student count
SELECT COUNT(DISTINCT "studentId") as student_count
FROM mentorship_requests
WHERE "mentorId" = 'mentor-uuid' 
  AND status = 'accepted';
```

---

### Tutoring Session Queries

```sql
-- Get upcoming sessions for a mentor
SELECT *
FROM tutoring_sessions
WHERE "mentorId" = 'mentor-uuid'
  AND status = 'scheduled'
  AND "startTime" > NOW()
ORDER BY "startTime" ASC;

-- Get sessions a student is enrolled in
SELECT ts.*, p.name as mentor_name
FROM tutoring_sessions ts
JOIN profiles p ON ts."mentorId" = p.id
WHERE 'student-uuid' = ANY(ts."studentIds")
  AND ts.status IN ('scheduled', 'active')
ORDER BY ts."startTime" ASC;

-- Get available sessions (not full)
SELECT ts.*, p.name as mentor_name,
       COALESCE(array_length(ts."studentIds", 1), 0) as current_students
FROM tutoring_sessions ts
JOIN profiles p ON ts."mentorId" = p.id
WHERE ts.status = 'scheduled'
  AND ts."startTime" > NOW()
  AND (ts."maxStudents" IS NULL 
       OR COALESCE(array_length(ts."studentIds", 1), 0) < ts."maxStudents")
ORDER BY ts."startTime" ASC;

-- Get session history for analytics
SELECT 
  DATE_TRUNC('month', "startTime") as month,
  COUNT(*) as session_count,
  AVG(duration) as avg_duration
FROM tutoring_sessions
WHERE "mentorId" = 'mentor-uuid'
  AND status = 'completed'
GROUP BY DATE_TRUNC('month', "startTime")
ORDER BY month DESC;
```

---

### Direct Message Queries

```sql
-- Get conversation between two users
SELECT dm.*, 
       ps.name as sender_name,
       pr.name as receiver_name
FROM direct_messages dm
JOIN profiles ps ON dm.sender_id = ps.id
JOIN profiles pr ON dm.receiver_id = pr.id
WHERE (dm.sender_id = 'user1-uuid' AND dm.receiver_id = 'user2-uuid')
   OR (dm.sender_id = 'user2-uuid' AND dm.receiver_id = 'user1-uuid')
ORDER BY dm.created_at ASC;

-- Get unread message count for a user
SELECT COUNT(*) as unread_count
FROM direct_messages
WHERE receiver_id = 'user-uuid' 
  AND read = false;

-- Get recent conversations for a user
SELECT DISTINCT ON (
  CASE 
    WHEN sender_id = 'user-uuid' THEN receiver_id 
    ELSE sender_id 
  END
)
  CASE 
    WHEN sender_id = 'user-uuid' THEN receiver_id 
    ELSE sender_id 
  END as other_user_id,
  p.name as other_user_name,
  dm.message as last_message,
  dm.created_at as last_message_time,
  dm.read
FROM direct_messages dm
JOIN profiles p ON (
  CASE 
    WHEN dm.sender_id = 'user-uuid' THEN dm.receiver_id 
    ELSE dm.sender_id 
  END = p.id
)
WHERE sender_id = 'user-uuid' OR receiver_id = 'user-uuid'
ORDER BY 
  CASE 
    WHEN sender_id = 'user-uuid' THEN receiver_id 
    ELSE sender_id 
  END,
  dm.created_at DESC;
```

---

### Analytics Queries

```sql
-- System-wide statistics
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') as total_students,
  (SELECT COUNT(*) FROM profiles WHERE role = 'mentor') as total_mentors,
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM quizzes) as total_quizzes,
  (SELECT COUNT(*) FROM quiz_attempts) as total_attempts,
  (SELECT COUNT(*) FROM forum_threads) as total_threads;

-- Course performance analytics
SELECT 
  c.id,
  c.title,
  COUNT(DISTINCT qa."studentId") as unique_students,
  COUNT(qat.id) as total_attempts,
  AVG(qat.score::float / qat."totalPoints" * 100) as avg_score
FROM courses c
LEFT JOIN quizzes q ON c.id = q."courseId"
LEFT JOIN quiz_assignments qa ON q.id = qa."quizId"
LEFT JOIN quiz_attempts qat ON q.id = qat."quizId"
WHERE c."mentorId" = 'mentor-uuid'
GROUP BY c.id, c.title;

-- Student engagement metrics
SELECT 
  p.id,
  p.name,
  COUNT(DISTINCT qa."quizId") as quizzes_assigned,
  COUNT(qat.id) as quizzes_completed,
  AVG(qat.score::float / qat."totalPoints" * 100) as avg_score,
  COUNT(ft.id) as forum_threads_created,
  COUNT(fp.id) as forum_posts_created
FROM profiles p
LEFT JOIN quiz_assignments qa ON p.id = qa."studentId"
LEFT JOIN quiz_attempts qat ON p.id = qat."studentId"
LEFT JOIN forum_threads ft ON p.id = ft."authorId"
LEFT JOIN forum_posts fp ON p.id = fp."authorId"
WHERE p.role = 'student'
GROUP BY p.id, p.name;

-- Activity over time
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  type,
  COUNT(*) as activity_count
FROM activity_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), type
ORDER BY date DESC, activity_count DESC;
```

---

### User Progress Queries

```sql
-- Get completed materials for a user
SELECT *
FROM user_progress
WHERE "userId" = 'user-uuid';

-- Calculate course completion percentage
SELECT 
  'course-uuid' as course_id,
  COUNT(DISTINCT up."materialId") as completed_materials,
  jsonb_array_length(c.materials) as total_materials,
  (COUNT(DISTINCT up."materialId")::float / 
   NULLIF(jsonb_array_length(c.materials), 0) * 100) as completion_percentage
FROM courses c
LEFT JOIN user_progress up ON up."userId" = 'user-uuid'
WHERE c.id = 'course-uuid'
GROUP BY c.id, c.materials;

-- Get user's learning progress across all courses
SELECT 
  c.id as course_id,
  c.title,
  COUNT(DISTINCT up."materialId") as completed_materials,
  jsonb_array_length(c.materials) as total_materials
FROM courses c
LEFT JOIN user_progress up ON up."userId" = 'user-uuid'
GROUP BY c.id, c.title, c.materials;
```

---

## Database Maintenance

### Backup Recommendations

```sql
-- Full database backup (run via pg_dump)
pg_dump -h your-supabase-host -U postgres -d postgres > vidyasetu_backup.sql

-- Backup specific tables
pg_dump -h your-supabase-host -U postgres -d postgres -t public.profiles -t public.courses > partial_backup.sql
```

### Performance Monitoring

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find slow queries (requires pg_stat_statements extension)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Data Cleanup

```sql
-- Remove old activity logs (older than 90 days)
DELETE FROM activity_logs
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Archive completed tutoring sessions (older than 30 days)
UPDATE tutoring_sessions
SET status = 'completed'
WHERE status = 'active'
  AND "endTime" < NOW() - INTERVAL '30 days';

-- Clean up orphaned records (if any)
DELETE FROM quiz_attempts
WHERE "quizId" NOT IN (SELECT id FROM quizzes);
```

---

## Migration Guide

### Adding New Columns

```sql
-- Add column with default value
ALTER TABLE profiles 
ADD COLUMN phone_number TEXT;

-- Add column with constraint
ALTER TABLE courses 
ADD COLUMN is_published BOOLEAN DEFAULT false NOT NULL;

-- Add JSONB column
ALTER TABLE profiles 
ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
```

### Modifying Existing Columns

```sql
-- Change column type
ALTER TABLE courses 
ALTER COLUMN difficulty TYPE TEXT;

-- Add constraint to existing column
ALTER TABLE profiles 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Make column nullable
ALTER TABLE courses 
ALTER COLUMN description DROP NOT NULL;
```

### Creating New Tables

```sql
-- Example: Add course enrollments table
CREATE TABLE public.course_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "courseId" UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  "studentId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  "enrolledAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "progressPercentage" FLOAT DEFAULT 0,
  UNIQUE("courseId", "studentId")
);

-- Add indexes
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments("courseId");
CREATE INDEX idx_course_enrollments_student ON public.course_enrollments("studentId");

-- Enable RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Students read own enrollments"
  ON public.course_enrollments FOR SELECT
  USING ("studentId" = auth.uid() OR public.is_admin());
```

---

## Troubleshooting

### Common Issues

**Issue: RLS Policy Blocking Queries**
```sql
-- Temporarily disable RLS for debugging (use with caution)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Check which policies are applied
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Test policy conditions
SELECT * FROM table_name WHERE <policy_condition>;
```

**Issue: Slow Queries**
```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM quiz_attempts WHERE "studentId" = 'uuid';

-- Check if indexes are being used
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM courses WHERE "mentorId" = 'uuid';
```

**Issue: Foreign Key Violations**
```sql
-- Find orphaned records
SELECT * FROM quiz_attempts qa
WHERE NOT EXISTS (
  SELECT 1 FROM quizzes q WHERE q.id = qa."quizId"
);

-- Check foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
```

---

## Security Best Practices

1. **Always use RLS policies** - Never disable RLS in production
2. **Validate user input** - Use CHECK constraints and application-level validation
3. **Use SECURITY DEFINER carefully** - Only for trusted functions that need elevated privileges
4. **Audit sensitive operations** - Log all admin actions and data modifications
5. **Rotate credentials regularly** - Update API keys and database passwords periodically
6. **Limit data exposure** - Only return necessary columns in queries
7. **Use prepared statements** - Prevent SQL injection attacks
8. **Monitor access patterns** - Review activity logs for suspicious behavior

---

## Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **JSONB Operations**: https://www.postgresql.org/docs/current/functions-json.html
- **Performance Tuning**: https://wiki.postgresql.org/wiki/Performance_Optimization

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Database Schema Version:** Production (server/schema.sql)
