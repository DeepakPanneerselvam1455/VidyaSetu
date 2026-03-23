# VidyaSetu API Documentation

> **Comprehensive API Reference for VidyaSetu Learning Management System**
> 
> This document covers all API endpoints, Supabase operations, Google Gemini AI integration, and network error handling patterns.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Course Management](#course-management)
5. [Quiz Management](#quiz-management)
6. [Forum Operations](#forum-operations)
7. [Mentorship & Tutoring](#mentorship--tutoring)
8. [AI Integration (Google Gemini)](#ai-integration-google-gemini)
9. [Notification Preferences](#notification-preferences)
10. [Direct Messaging](#direct-messaging)
11. [Activity Logging](#activity-logging)
12. [Error Handling](#error-handling)

---

## Overview

### Technology Stack
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Authentication**: Supabase Auth (email/password)
- **AI**: Google Gemini API via Supabase Edge Functions
- **Video**: Jitsi JaaS with JWT token generation
- **Error Handling**: Network error handler with retry logic

### Base Configuration
```typescript
import { supabase } from './supabase';
import { withNetworkErrorHandling } from './networkErrorHandler';
```

### Network Error Handling
All API functions use `withNetworkErrorHandling` wrapper that provides:
- **Automatic retries** with exponential backoff
- **Timeout management** (configurable per operation)
- **Network error detection** and user-friendly messages
- **Offline detection** and graceful degradation

**Default Configuration**:
- Read operations: 2 retries, 10s timeout
- Write operations: 2 retries, 10s timeout
- Delete operations: 1 retry, 10s timeout
- AI operations: 3 retries with exponential backoff

---

## Authentication

### `login(email, password)`
Authenticates user and fetches profile with role information.

**Parameters**:
- `email` (string): User email address
- `password` (string): User password

**Returns**: `Promise<{ user: User }>`

**Error Handling**: 2 retries, 15s timeout

**Example**:
```typescript
const { user } = await login('student@example.com', 'password123');
console.log(user.role); // 'student', 'mentor', or 'admin'
```

**Validates**: Requirements 1.1, 1.2, 2.1, 2.2

---

### `getProfile()`
Retrieves current authenticated user's profile.

**Parameters**: None

**Returns**: `Promise<User | null>`

**Example**:
```typescript
const profile = await getProfile();
if (profile) {
  console.log(`Welcome ${profile.name}`);
}
```

---

### `logout()`
Signs out the current user and clears session.

**Parameters**: None

**Returns**: `Promise<void>`

**Example**:
```typescript
await logout();
// User is now logged out
```

**Validates**: Requirements 1.4

---

### `register(userData, password, requestedRole?)`
Creates a new user account with profile.

**Parameters**:
- `userData` (object): User information
  - `email` (string): User email
  - `name` (string): Full name
- `password` (string): Account password
- `requestedRole` (string, optional): Role for admin-created users

**Returns**: `Promise<User>`

**Error Handling**: 2 retries, 15s timeout

**Example**:
```typescript
const newUser = await register(
  { email: 'new@example.com', name: 'John Doe' },
  'securePassword123'
);
```

**Validates**: Requirements 1.1, 2.1

---

## User Management

### `getUsers(page?, limit?)`
Fetches paginated list of all users (admin only).

**Parameters**:
- `page` (number, default: 0): Page number
- `limit` (number, default: 50): Results per page

**Returns**: `Promise<User[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const users = await getUsers(0, 20);
console.log(`Found ${users.length} users`);
```

**Validates**: Requirements 14.1

---

### `updateUser(userData)`
Updates user profile information.

**Parameters**:
- `userData` (User): Complete user object with updates

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 10s timeout

**RLS Policy**: Users can update their own profile; admins can update any profile

**Example**:
```typescript
await updateUser({
  id: 'user-uuid',
  name: 'Updated Name',
  bio: 'New bio text',
  expertise: 'JavaScript, React',
  // ... other fields
});
```

**Validates**: Requirements 1.5, 2.4

---

### `toggleUserStatus(userId, adminId, status)`
Enables or disables a user account (admin only).

**Parameters**:
- `userId` (string): Target user ID
- `adminId` (string): Admin performing action
- `status` (string): 'ENABLED' or 'DISABLED'

**Returns**: `Promise<any>`

**Error Handling**: 2 retries, 15s timeout

**Note**: Uses Supabase Edge Function 'disable-user'

**Example**:
```typescript
await toggleUserStatus('user-uuid', 'admin-uuid', 'DISABLED');
```

---

### `deleteUser(userId)`
Permanently deletes a user account (admin only).

**Parameters**:
- `userId` (string): User ID to delete

**Returns**: `Promise<any>`

**Error Handling**: 1 retry, 15s timeout

**Note**: Uses Supabase Edge Function 'delete-user'

**Example**:
```typescript
await deleteUser('user-uuid');
```

---

### `createUser(userData, password)`
Admin function to create a new user with specific role.

**Parameters**:
- `userData` (object): User data including role
- `password` (string): Initial password

**Returns**: `Promise<User>`

**Example**:
```typescript
const mentor = await createUser(
  { email: 'mentor@example.com', name: 'Jane Smith', role: 'mentor' },
  'initialPassword'
);
```

---

## Course Management

### `getCourses(page?, limit?)`
Fetches paginated list of all courses.

**Parameters**:
- `page` (number, default: 0): Page number
- `limit` (number, default: 50): Results per page

**Returns**: `Promise<Course[]>`

**Error Handling**: No retry wrapper (returns empty array on error)

**Example**:
```typescript
const courses = await getCourses(0, 10);
courses.forEach(course => console.log(course.title));
```

**Validates**: Requirements 4.2

---

### `getCourseById(courseId)`
Fetches a single course by ID.

**Parameters**:
- `courseId` (string): Course UUID

**Returns**: `Promise<Course | null>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const course = await getCourseById('course-uuid');
if (course) {
  console.log(course.title, course.description);
}
```

**Validates**: Requirements 4.4

---

### `createCourse(courseData)`
Creates a new course (mentor only).

**Parameters**:
- `courseData` (object):
  - `title` (string, required): Course title
  - `mentorId` (string, required): Creator's user ID
  - `description` (string): Course description
  - `learningObjectives` (string[]): Learning goals
  - `materials` (array): Course materials (JSONB)

**Returns**: `Promise<Course>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const newCourse = await createCourse({
  title: 'Introduction to React',
  mentorId: 'mentor-uuid',
  description: 'Learn React fundamentals',
  learningObjectives: ['Understand components', 'Master hooks'],
  materials: []
});
```

**Validates**: Requirements 5.2, 5.3

---

### `updateCourse(courseData)`
Updates an existing course.

**Parameters**:
- `courseData` (object): Course object with `id` and fields to update

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
await updateCourse({
  id: 'course-uuid',
  title: 'Updated Title',
  description: 'Updated description'
});
```

**Validates**: Requirements 5.6

---

### `deleteCourse(courseId)`
Deletes a course (mentor only).

**Parameters**:
- `courseId` (string): Course UUID

**Returns**: `Promise<void>`

**Error Handling**: 1 retry, 10s timeout

**Example**:
```typescript
await deleteCourse('course-uuid');
```

**Validates**: Requirements 5.7

---

### `getAssignedCoursesForStudent(userId)`
Gets courses assigned to a student.

**Parameters**:
- `userId` (string): Student user ID

**Returns**: `Promise<Course[]>`

**Note**: Currently returns all courses (RLS controls visibility)

**Example**:
```typescript
const myCourses = await getAssignedCoursesForStudent('student-uuid');
```

---

## Quiz Management

### `getQuizzes(page?, limit?)`
Fetches paginated list of all quizzes.

**Parameters**:
- `page` (number, default: 0): Page number
- `limit` (number, default: 50): Results per page

**Returns**: `Promise<Quiz[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const quizzes = await getQuizzes();
```

---

### `getQuizzesByCourse(courseId, page?, limit?)`
Fetches quizzes for a specific course.

**Parameters**:
- `courseId` (string, required): Course UUID
- `page` (number, default: 0): Page number
- `limit` (number, default: 50): Results per page

**Returns**: `Promise<Quiz[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const courseQuizzes = await getQuizzesByCourse('course-uuid');
```

---

### `getQuizById(quizId)`
Fetches a single quiz by ID.

**Parameters**:
- `quizId` (string): Quiz UUID

**Returns**: `Promise<Quiz | null>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const quiz = await getQuizById('quiz-uuid');
console.log(quiz.questions); // JSONB array of questions
```

**Validates**: Requirements 8.1

---

### `createQuiz(quizData)`
Creates a new quiz (mentor only).

**Parameters**:
- `quizData` (object):
  - `title` (string, required): Quiz title
  - `courseId` (string, required): Parent course ID
  - `mentorId` (string, required): Creator's user ID
  - `description` (string): Quiz description
  - `questions` (Question[]): Array of questions (JSONB)
  - `difficulty` (string): 'easy', 'medium', or 'hard'
  - `isAIGenerated` (boolean): Whether AI generated

**Returns**: `Promise<Quiz>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const quiz = await createQuiz({
  title: 'React Basics Quiz',
  courseId: 'course-uuid',
  mentorId: 'mentor-uuid',
  difficulty: 'medium',
  questions: [/* question objects */],
  isAIGenerated: true
});
```

**Validates**: Requirements 6.6, 7.3

---

### `updateQuiz(quizData)`
Updates an existing quiz.

**Parameters**:
- `quizData` (object): Quiz object with `id` and fields to update

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
await updateQuiz({
  id: 'quiz-uuid',
  title: 'Updated Quiz Title',
  questions: updatedQuestions
});
```

**Validates**: Requirements 7.4

---

### `deleteQuiz(quizId)`
Deletes a quiz (mentor only).

**Parameters**:
- `quizId` (string): Quiz UUID

**Returns**: `Promise<void>`

**Error Handling**: 1 retry, 10s timeout

**Example**:
```typescript
await deleteQuiz('quiz-uuid');
```

**Validates**: Requirements 7.5

---

### `submitQuizAttempt(attemptData)`
Submits a student's quiz attempt.

**Parameters**:
- `attemptData` (object):
  - `quizId` (string, required): Quiz UUID
  - `studentId` (string, required): Student user ID
  - `answers` (object, required): Student's answers (JSONB)
  - `score` (number): Calculated score
  - `totalPoints` (number): Maximum possible score

**Returns**: `Promise<QuizAttempt>`

**Error Handling**: 2 retries, 15s timeout

**Example**:
```typescript
const attempt = await submitQuizAttempt({
  quizId: 'quiz-uuid',
  studentId: 'student-uuid',
  answers: { q1: 'A', q2: 'B' },
  score: 80,
  totalPoints: 100
});
```

**Validates**: Requirements 8.2, 8.3

---

### `updateQuizAttempt(attemptData)`
Updates a quiz attempt (for grading).

**Parameters**:
- `attemptData` (object): Attempt object with `id` and fields to update

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
await updateQuizAttempt({
  id: 'attempt-uuid',
  score: 85,
  feedback: 'Good work!'
});
```

---

### `getStudentProgress(userId)`
Fetches all quiz attempts for a student.

**Parameters**:
- `userId` (string): Student user ID

**Returns**: `Promise<QuizAttempt[]>`

**Error Handling**: No retry wrapper (returns empty array on error)

**Example**:
```typescript
const attempts = await getStudentProgress('student-uuid');
console.log(`Student has ${attempts.length} quiz attempts`);
```

**Validates**: Requirements 15.1, 15.3

---

### `getAllAttempts()`
Fetches all quiz attempts (admin/mentor).

**Parameters**: None

**Returns**: `Promise<QuizAttempt[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const allAttempts = await getAllAttempts();
```

---

### `createQuizAssignments(quizId, studentIds, dueDate?)`
Assigns a quiz to specific students.

**Parameters**:
- `quizId` (string, required): Quiz UUID
- `studentIds` (string[], required): Array of student user IDs
- `dueDate` (string, optional): ISO date string

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
await createQuizAssignments(
  'quiz-uuid',
  ['student1-uuid', 'student2-uuid'],
  '2024-12-31T23:59:59Z'
);
```

---

### `getAssignedQuizzesForStudent(userId)`
Fetches quizzes assigned to a student.

**Parameters**:
- `userId` (string): Student user ID

**Returns**: `Promise<Quiz[]>`

**Error Handling**: No retry wrapper (returns empty array on error)

**Example**:
```typescript
const assignedQuizzes = await getAssignedQuizzesForStudent('student-uuid');
```

---

## Forum Operations

### `getForumCategories()`
Fetches all forum categories.

**Parameters**: None

**Returns**: `Promise<ForumCategory[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const categories = await getForumCategories();
categories.forEach(cat => console.log(cat.name));
```

**Validates**: Requirements 12.1

---

### `getForumThreads(page?, limit?)`
Fetches paginated forum threads (newest first).

**Parameters**:
- `page` (number, default: 0): Page number
- `limit` (number, default: 50): Results per page

**Returns**: `Promise<ForumThread[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const threads = await getForumThreads(0, 20);
```

**Validates**: Requirements 12.1

---

### `getForumThreadById(threadId)`
Fetches a single forum thread.

**Parameters**:
- `threadId` (string): Thread UUID

**Returns**: `Promise<ForumThread | null>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const thread = await getForumThreadById('thread-uuid');
console.log(thread.title, thread.content);
```

**Validates**: Requirements 12.4

---

### `createForumThread(threadData)`
Creates a new forum thread.

**Parameters**:
- `threadData` (object):
  - `title` (string, required): Thread title
  - `content` (string, required): Thread content
  - `creatorId` (string, required): User ID
  - `categoryId` (string): Category UUID

**Returns**: `Promise<ForumThread>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const thread = await createForumThread({
  title: 'How to use React hooks?',
  content: 'I need help understanding useState...',
  creatorId: 'user-uuid',
  categoryId: 'category-uuid'
});
```

**Validates**: Requirements 12.2

---

### `getForumPosts(threadId)`
Fetches all posts in a thread (chronological order).

**Parameters**:
- `threadId` (string): Thread UUID

**Returns**: `Promise<ForumPost[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const posts = await getForumPosts('thread-uuid');
posts.forEach(post => console.log(post.content));
```

**Validates**: Requirements 12.4

---

### `createForumPost(postData)`
Creates a reply to a forum thread.

**Parameters**:
- `postData` (object):
  - `content` (string, required): Post content
  - `threadId` (string, required): Parent thread UUID
  - `creatorId` (string, required): User ID

**Returns**: `Promise<ForumPost>`

**Error Handling**: 2 retries, 10s timeout

**Side Effect**: Increments thread's reply count

**Example**:
```typescript
const post = await createForumPost({
  content: 'Here is my answer...',
  threadId: 'thread-uuid',
  creatorId: 'user-uuid'
});
```

**Validates**: Requirements 12.3

---

### `toggleThreadVote(threadId, userId)`
Upvotes or removes upvote from a thread.

**Parameters**:
- `threadId` (string): Thread UUID
- `userId` (string): User ID

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 5s timeout

**Example**:
```typescript
await toggleThreadVote('thread-uuid', 'user-uuid');
```

---

## Mentorship & Tutoring

### `getMentors()`
Fetches all users with mentor role.

**Parameters**: None

**Returns**: `Promise<User[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const mentors = await getMentors();
mentors.forEach(m => console.log(m.name, m.expertise));
```

---

### `getMentorshipRequests(userId, role)`
Fetches mentorship requests for a user.

**Parameters**:
- `userId` (string): User ID
- `role` (string): 'student' or 'mentor'

**Returns**: `Promise<MentorshipRequest[]>`

**Error Handling**: 2 retries, 10s timeout

**Note**: Filters by `studentId` for students, `mentorId` for mentors

**Example**:
```typescript
const requests = await getMentorshipRequests('user-uuid', 'student');
```

**Validates**: Requirements 9.3

---

### `createMentorshipRequest(requestData)`
Creates a mentorship request from student to mentor.

**Parameters**:
- `requestData` (object):
  - `studentId` (string, required): Student user ID
  - `mentorId` (string, required): Mentor user ID
  - `message` (string): Request message

**Returns**: `Promise<MentorshipRequest>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const request = await createMentorshipRequest({
  studentId: 'student-uuid',
  mentorId: 'mentor-uuid',
  message: 'I would like guidance on React development'
});
```

**Validates**: Requirements 9.2

---

### `updateMentorshipRequest(requestData)`
Updates mentorship request status (approve/reject).

**Parameters**:
- `requestData` (object):
  - `id` (string, required): Request UUID
  - `status` (string, required): 'pending', 'approved', or 'rejected'

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
await updateMentorshipRequest({
  id: 'request-uuid',
  status: 'approved'
});
```

**Validates**: Requirements 9.4, 9.5

---

### `getTutoringSessions()`
Fetches all tutoring sessions.

**Parameters**: None

**Returns**: `Promise<TutoringSession[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const sessions = await getTutoringSessions();
```

---

### `getTutoringSessionById(sessionId)`
Fetches a single tutoring session.

**Parameters**:
- `sessionId` (string): Session UUID

**Returns**: `Promise<TutoringSession | null>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const session = await getTutoringSessionById('session-uuid');
console.log(session.title, session.startTime);
```

---

### `createTutoringSession(sessionData)`
Creates a new tutoring session (mentor only).

**Parameters**:
- `sessionData` (object):
  - `title` (string, required): Session title
  - `mentorId` (string, required): Mentor user ID
  - `description` (string): Session description
  - `startTime` (string): ISO date string
  - `duration` (number): Duration in minutes
  - `studentIds` (string[]): Array of invited student IDs

**Returns**: `Promise<TutoringSession>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const session = await createTutoringSession({
  title: 'React Hooks Deep Dive',
  mentorId: 'mentor-uuid',
  description: 'Advanced hooks patterns',
  startTime: '2024-12-20T15:00:00Z',
  duration: 60,
  studentIds: ['student1-uuid', 'student2-uuid']
});
```

**Validates**: Requirements 10.2

---

### `updateTutoringSession(sessionData)`
Updates a tutoring session.

**Parameters**:
- `sessionData` (object): Session object with `id` and fields to update

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
await updateTutoringSession({
  id: 'session-uuid',
  title: 'Updated Title',
  startTime: '2024-12-21T15:00:00Z'
});
```

---

### `startTutoringSession(sessionId)`
Marks a session as active (mentor only).

**Parameters**:
- `sessionId` (string): Session UUID

**Returns**: `Promise<void>`

**Error Handling**: 1 retry, 10s timeout

**Note**: Only updates if status is 'scheduled'

**Example**:
```typescript
await startTutoringSession('session-uuid');
```

**Validates**: Requirements 10.6

---

### `deleteTutoringSession(sessionId)`
Deletes a tutoring session.

**Parameters**:
- `sessionId` (string): Session UUID

**Returns**: `Promise<void>`

**Error Handling**: 1 retry, 10s timeout

**Example**:
```typescript
await deleteTutoringSession('session-uuid');
```

---

### `getSessionsForUser(userId, role)`
Fetches tutoring sessions for a user.

**Parameters**:
- `userId` (string): User ID
- `role` (string): 'student' or 'mentor'

**Returns**: `Promise<TutoringSession[]>`

**Error Handling**: 2 retries, 10s timeout

**Note**: Mentors get sessions they created; students get sessions they're invited to

**Example**:
```typescript
const mySessions = await getSessionsForUser('user-uuid', 'student');
```

---

### `getAvailableSessions()`
Fetches all scheduled/active sessions.

**Parameters**: None

**Returns**: `Promise<TutoringSession[]>`

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const available = await getAvailableSessions();
```

---

### `joinTutoringSession(sessionId, studentId)`
Adds a student to a tutoring session.

**Parameters**:
- `sessionId` (string): Session UUID
- `studentId` (string): Student user ID

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 10s timeout

**Note**: Uses database RPC function `join_tutoring_session`

**Example**:
```typescript
await joinTutoringSession('session-uuid', 'student-uuid');
```

**Validates**: Requirements 10.4

---

### `generateMeetingToken(user, sessionId)`
Generates Jitsi JWT token for video conferencing.

**Parameters**:
- `user` (User): User object with id, name, email, role
- `sessionId` (string): Session UUID

**Returns**: `Promise<string>` (JWT token)

**Error Handling**: 2 retries, 10s timeout

**Note**: Calls local token server at `http://localhost:3002/api/jitsi-token`

**Example**:
```typescript
const token = await generateMeetingToken(currentUser, 'session-uuid');
// Use token to initialize Jitsi iframe
```

**Validates**: Requirements 11.1, 11.2, 20.1

---

## AI Integration (Google Gemini)

All AI functions use Supabase Edge Functions to securely call Google Gemini API.

### `generateQuizQuestions(topic, objectives, difficulty, count, type, courseInfo, contextText?)`
Generates quiz questions using Google Gemini AI.

**Parameters**:
- `topic` (string, required): Quiz topic
- `objectives` (string): Learning objectives
- `difficulty` (string, required): 'easy', 'medium', 'hard', 'Beginner', 'Intermediate', or 'Advanced'
- `count` (number, required): Number of questions (1-50)
- `type` (string): Question type
- `courseInfo` (object): { title, description }
- `contextText` (string, optional): Additional context (max 8000 chars)

**Returns**: `Promise<Question[]>`

**Error Handling**: 3 retries with exponential backoff

**Validation**:
- Topic must not be empty
- Count must be 1-50
- Difficulty must be valid
- Each question validated for required fields

**Example**:
```typescript
const questions = await generateQuizQuestions(
  'React Hooks',
  'Understand useState and useEffect',
  'medium',
  5,
  'multiple-choice',
  { title: 'React Course', description: 'Learn React' },
  'Focus on practical examples'
);
```

**Validates**: Requirements 6.2, 6.3, 19.1, 19.2

---

### `generateQuizTopics(title, description, materials?)`
Generates suggested quiz topics based on course information.

**Parameters**:
- `title` (string): Course title
- `description` (string): Course description
- `materials` (array, optional): Course materials

**Returns**: `Promise<string[]>` (5 topic suggestions)

**Error Handling**: Returns default topics on failure

**Example**:
```typescript
const topics = await generateQuizTopics(
  'JavaScript Fundamentals',
  'Learn core JavaScript concepts',
  [{ name: 'Variables' }, { name: 'Functions' }]
);
// Returns: ['JavaScript Fundamentals', 'Advanced Concepts', ...]
```

**Validates**: Requirements 6.2

---

### `regenerateQuestionWithAI(topic, difficulty, type, contextText?)`
Regenerates a single question with AI.

**Parameters**:
- `topic` (string): Question topic
- `difficulty` (string): Difficulty level
- `type` (string): Question type
- `contextText` (string, optional): Additional context

**Returns**: `Promise<Question | null>`

**Example**:
```typescript
const newQuestion = await regenerateQuestionWithAI(
  'React State Management',
  'hard',
  'multiple-choice'
);
```

**Validates**: Requirements 6.5

---

### `getAIFeedbackForQuestion(question)`
Gets AI feedback on a quiz question.

**Parameters**:
- `question` (Question): Question object

**Returns**: `Promise<string>` (feedback text)

**Example**:
```typescript
const feedback = await getAIFeedbackForQuestion(question);
console.log(feedback);
```

---

### `getQuestionAISuggestion(question, courseTitle)`
Gets AI suggestion for improving a question.

**Parameters**:
- `question` (Question): Question object
- `courseTitle` (string): Course title

**Returns**: `Promise<string | null>`

**Example**:
```typescript
const suggestion = await getQuestionAISuggestion(question, 'React Course');
```

---

### `improveQuestionWithAI(question, quizContext)`
Improves a question using AI assistance.

**Parameters**:
- `question` (any): Question object
- `quizContext` (Quiz): Parent quiz context

**Returns**: `Promise<any>` (improved question)

**Note**: Currently returns question as-is (placeholder)

---

### `generateAlternativeOptionsWithAI(question)`
Generates alternative answer options for a question.

**Parameters**:
- `question` (any): Question object

**Returns**: `Promise<string[]>` (4 options including correct answer)

**Note**: Currently returns default options (placeholder)

---

### `getLearningSuggestion(attempt, quiz, course, allCourses)`
Generates personalized learning suggestions based on quiz performance.

**Parameters**:
- `attempt` (QuizAttempt): Student's quiz attempt
- `quiz` (Quiz): Quiz object
- `course` (Course): Course object
- `allCourses` (Course[]): All available courses

**Returns**: `Promise<string>` (suggestion text)

**Logic**:
- Score ≥ 80%: Suggest advanced topics
- Score ≥ 60%: Suggest review and retry
- Score < 60%: Suggest focused study

**Example**:
```typescript
const suggestion = await getLearningSuggestion(attempt, quiz, course, courses);
console.log(suggestion);
```

---

### `getChatbotResponse(history, message, mode)`
Gets chatbot response (currently disabled for security).

**Parameters**:
- `history` (any): Chat history
- `message` (string): User message
- `mode` (string): Chat mode

**Returns**: `Promise<{ text: string; sources: any[] }>`

**Note**: Returns security message - feature disabled

---

## Notification Preferences

### `getNotificationPreferences(userId)`
Retrieves notification preferences for a user.

**Parameters**:
- `userId` (string): User ID

**Returns**: `Promise<NotificationPreferences>`

**Error Handling**: 2 retries, 5s timeout

**Default Preferences** (if none exist):
```typescript
{
  mentorshipRequests: true,
  mentorshipApprovals: true,
  tutoringSessionScheduled: true,
  tutoringSessionReminders: true,
  forumReplies: true,
  forumMentions: true,
  quizGrades: true,
  quizAssignments: true,
  courseUpdates: true,
  directMessages: true
}
```

**Example**:
```typescript
const prefs = await getNotificationPreferences('user-uuid');
console.log(prefs.mentorshipRequests); // true or false
```

**Validates**: Requirements 29.5

---

### `updateNotificationPreferences(userId, preferences)`
Updates notification preferences for a user.

**Parameters**:
- `userId` (string): User ID
- `preferences` (object): Notification preferences object

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 5s timeout

**Storage**: Stored in `profiles.notificationPreferences` JSONB column

**Example**:
```typescript
await updateNotificationPreferences('user-uuid', {
  mentorshipRequests: true,
  mentorshipApprovals: false,
  tutoringSessionScheduled: true,
  // ... other preferences
});
```

**Validates**: Requirements 29.5

---

## Direct Messaging

### `getMessages(userId1, userId2)`
Fetches direct messages between two users.

**Parameters**:
- `userId1` (string): First user ID
- `userId2` (string): Second user ID

**Returns**: `Promise<DirectMessage[]>`

**Note**: Returns messages in both directions, ordered by timestamp

**Example**:
```typescript
const messages = await getMessages('user1-uuid', 'user2-uuid');
messages.forEach(msg => console.log(msg.content));
```

---

### `sendMessage(senderId, receiverId, message)`
Sends a direct message to another user.

**Parameters**:
- `senderId` (string): Sender user ID
- `receiverId` (string): Receiver user ID
- `message` (string): Message content

**Returns**: `Promise<DirectMessage>`

**Example**:
```typescript
const sentMessage = await sendMessage(
  'sender-uuid',
  'receiver-uuid',
  'Hello, can we schedule a tutoring session?'
);
```

---

### `subscribeToDirectMessages(currentUserId, partnerId, callback)`
Subscribes to real-time direct message updates.

**Parameters**:
- `currentUserId` (string): Current user ID
- `partnerId` (string): Chat partner user ID
- `callback` (function): Callback function for new messages

**Returns**: Supabase subscription object

**Example**:
```typescript
const subscription = subscribeToDirectMessages(
  'user-uuid',
  'partner-uuid',
  (newMessage) => {
    console.log('New message:', newMessage.content);
  }
);

// Later: subscription.unsubscribe()
```

---

## Activity Logging

### `logActivity(type, title, details?)`
Logs user activity for audit trail.

**Parameters**:
- `type` (string, required): Activity type
- `title` (string, required): Activity title
- `details` (any, optional): Additional details (JSONB)

**Returns**: `Promise<void>`

**Error Handling**: 1 retry, 5s timeout (low priority)

**Example**:
```typescript
await logActivity(
  'quiz_completed',
  'Student completed React Quiz',
  { quizId: 'quiz-uuid', score: 85 }
);
```

**Validates**: Requirements 24.1

---

## Progress Tracking

### `markMaterialAsViewed(userId, materialId)`
Marks a course material as viewed by a student.

**Parameters**:
- `userId` (string): Student user ID
- `materialId` (string): Material identifier

**Returns**: `Promise<void>`

**Error Handling**: 2 retries, 5s timeout

**Note**: Uses `user_progress` table with unique constraint

**Example**:
```typescript
await markMaterialAsViewed('student-uuid', 'material-123');
```

---

### `getViewedMaterialsForStudent(userId)`
Fetches all materials viewed by a student.

**Parameters**:
- `userId` (string): Student user ID

**Returns**: `Promise<string[]>` (array of material IDs)

**Error Handling**: 2 retries, 5s timeout

**Example**:
```typescript
const viewedMaterials = await getViewedMaterialsForStudent('student-uuid');
console.log(`Student has viewed ${viewedMaterials.length} materials`);
```

---

### `getAllViewedMaterials()`
Fetches all viewed materials for all users (admin).

**Parameters**: None

**Returns**: `Promise<Record<string, string[]>>` (userId → materialIds mapping)

**Error Handling**: 2 retries, 10s timeout

**Example**:
```typescript
const allProgress = await getAllViewedMaterials();
console.log(allProgress['student-uuid']); // ['material-1', 'material-2']
```

---

## Error Handling

### Network Error Handler

All API functions are wrapped with `withNetworkErrorHandling` which provides:

**Features**:
- Automatic retry with exponential backoff
- Timeout management
- Network status detection
- User-friendly error messages

**Configuration Options**:
```typescript
{
  maxRetries: number,    // Number of retry attempts (default: 2)
  timeout: number        // Timeout in milliseconds (default: 10000)
}
```

**Error Types**:

1. **Network Errors**
   - Offline detection
   - Connection timeout
   - DNS resolution failure
   - Message: "Network error. Please check your connection."

2. **Timeout Errors**
   - Request exceeds timeout limit
   - Message: "Request timed out. Please try again."

3. **Server Errors (5xx)**
   - Supabase server errors
   - Message: "Server error. Please try again later."

4. **Authentication Errors**
   - Invalid credentials
   - Session expired
   - Message: Specific auth error message

5. **Validation Errors**
   - Missing required fields
   - Invalid data format
   - Message: Specific validation error

**Example Usage**:
```typescript
import { withNetworkErrorHandling } from './networkErrorHandler';

const myApiFunction = async (id: string) => {
  return withNetworkErrorHandling(async () => {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return data;
  }, { maxRetries: 3, timeout: 15000 });
};
```

---

### Common Error Patterns

**1. Not Found Errors (PGRST116)**
```typescript
if (error.code === 'PGRST116') {
  return null; // Resource not found
}
```

**2. Duplicate Entry Errors (23505)**
```typescript
if (error.code === '23505') {
  // Ignore duplicate, already exists
  return;
}
```

**3. Edge Function Errors**
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: params
});

if (error) {
  const errorMsg = extractEdgeFunctionError(error);
  throw new Error(errorMsg);
}
```

**4. RLS Policy Violations**
```typescript
// Error: "You don't have permission to access this resource"
// Check user role and RLS policies
```

---

## Best Practices

### 1. Always Handle Errors
```typescript
try {
  const courses = await getCourses();
  // Use courses
} catch (error) {
  console.error('Failed to fetch courses:', error);
  // Show user-friendly error message
}
```

### 2. Use TypeScript Types
```typescript
import { User, Course, Quiz } from '../types';

const user: User = await getProfile();
const courses: Course[] = await getCourses();
```

### 3. Validate Input Before API Calls
```typescript
if (!quizData.title || !quizData.title.trim()) {
  throw new Error('Quiz title is required');
}
await createQuiz(quizData);
```

### 4. Check Authentication
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  throw new Error('Authentication required');
}
```

### 5. Use Pagination for Large Datasets
```typescript
// Fetch first page
const page1 = await getCourses(0, 20);

// Fetch second page
const page2 = await getCourses(1, 20);
```

### 6. Handle Real-time Subscriptions
```typescript
const subscription = subscribeToDirectMessages(userId, partnerId, callback);

// Clean up on component unmount
useEffect(() => {
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI
VITE_GEMINI_API_KEY=your-gemini-api-key

# Jitsi Configuration (for token server)
JITSI_APP_ID=your-jitsi-app-id
JITSI_PRIVATE_KEY=your-jitsi-private-key
```

### Supabase Setup

1. **Create Supabase Project**: https://supabase.com
2. **Run Database Schema**: Execute `server/schema.sql`
3. **Configure RLS Policies**: Set up Row-Level Security
4. **Deploy Edge Functions**: Deploy `generate-quiz`, `disable-user`, `delete-user`

### Jitsi Token Server

Start the token server for video conferencing:

```bash
npm run api
# Server runs on http://localhost:3002
```

---

## API Response Formats

### Success Response
```typescript
{
  data: T,           // Requested data
  error: null
}
```

### Error Response
```typescript
{
  data: null,
  error: {
    message: string,  // Error message
    code: string,     // Error code (optional)
    details: any      // Additional details (optional)
  }
}
```

### Paginated Response
```typescript
{
  data: T[],         // Array of items
  count: number,     // Total count (if available)
  page: number,      // Current page
  limit: number      // Items per page
}
```

---

## Database Tables Reference

### Core Tables

**profiles**
- `id` (UUID, PK): User ID (linked to auth.users)
- `name` (TEXT): Full name
- `email` (TEXT): Email address
- `role` (TEXT): 'student', 'mentor', or 'admin'
- `bio` (TEXT): User biography
- `expertise` (TEXT): Areas of expertise
- `notificationPreferences` (JSONB): Notification settings
- `createdAt` (TIMESTAMP): Account creation date

**courses**
- `id` (UUID, PK): Course ID
- `mentorId` (UUID, FK): Creator mentor ID
- `title` (TEXT): Course title
- `description` (TEXT): Course description
- `materials` (JSONB): Course materials array
- `learningObjectives` (JSONB): Learning objectives array
- `createdAt` (TIMESTAMP): Creation date

**quizzes**
- `id` (UUID, PK): Quiz ID
- `courseId` (UUID, FK): Parent course ID
- `mentorId` (UUID, FK): Creator mentor ID
- `title` (TEXT): Quiz title
- `questions` (JSONB): Questions array
- `difficulty` (TEXT): 'easy', 'medium', or 'hard'
- `isAIGenerated` (BOOLEAN): AI generation flag
- `createdAt` (TIMESTAMP): Creation date

**quiz_attempts**
- `id` (UUID, PK): Attempt ID
- `quizId` (UUID, FK): Quiz ID
- `studentId` (UUID, FK): Student ID
- `answers` (JSONB): Student answers
- `score` (FLOAT): Score achieved
- `totalPoints` (FLOAT): Maximum possible score
- `submittedAt` (TIMESTAMP): Submission date

**tutoring_sessions**
- `id` (UUID, PK): Session ID
- `mentorId` (UUID, FK): Mentor ID
- `title` (TEXT): Session title
- `startTime` (TIMESTAMP): Scheduled start time
- `duration` (INTEGER): Duration in minutes
- `studentIds` (JSONB): Array of invited student IDs
- `status` (TEXT): 'scheduled', 'active', or 'completed'
- `jitsiRoomName` (TEXT): Jitsi room identifier

**mentorship_requests**
- `id` (UUID, PK): Request ID
- `studentId` (UUID, FK): Student ID
- `mentorId` (UUID, FK): Mentor ID
- `message` (TEXT): Request message
- `status` (TEXT): 'pending', 'approved', or 'rejected'
- `createdAt` (TIMESTAMP): Request date

**forum_threads**
- `id` (UUID, PK): Thread ID
- `categoryId` (UUID, FK): Category ID
- `creatorId` (UUID, FK): Creator user ID
- `title` (TEXT): Thread title
- `content` (TEXT): Thread content
- `replyCount` (INTEGER): Number of replies
- `upvotes` (JSONB): Array of user IDs who upvoted
- `createdAt` (TIMESTAMP): Creation date

**forum_posts**
- `id` (UUID, PK): Post ID
- `threadId` (UUID, FK): Parent thread ID
- `creatorId` (UUID, FK): Creator user ID
- `content` (TEXT): Post content
- `upvotes` (JSONB): Array of user IDs who upvoted
- `createdAt` (TIMESTAMP): Creation date

---

## Quick Reference

### Authentication
- `login(email, password)` - Sign in
- `register(userData, password)` - Sign up
- `logout()` - Sign out
- `getProfile()` - Get current user

### Users
- `getUsers(page, limit)` - List users
- `updateUser(userData)` - Update profile
- `toggleUserStatus(userId, adminId, status)` - Enable/disable
- `deleteUser(userId)` - Delete account

### Courses
- `getCourses(page, limit)` - List courses
- `getCourseById(id)` - Get course
- `createCourse(data)` - Create course
- `updateCourse(data)` - Update course
- `deleteCourse(id)` - Delete course

### Quizzes
- `getQuizzes(page, limit)` - List quizzes
- `getQuizById(id)` - Get quiz
- `createQuiz(data)` - Create quiz
- `submitQuizAttempt(data)` - Submit attempt
- `getStudentProgress(userId)` - Get attempts

### AI
- `generateQuizQuestions(...)` - Generate quiz with AI
- `generateQuizTopics(...)` - Suggest topics
- `regenerateQuestionWithAI(...)` - Regenerate question

### Forums
- `getForumThreads(page, limit)` - List threads
- `createForumThread(data)` - Create thread
- `getForumPosts(threadId)` - Get posts
- `createForumPost(data)` - Create post

### Tutoring
- `getTutoringSessions()` - List sessions
- `createTutoringSession(data)` - Create session
- `joinTutoringSession(sessionId, studentId)` - Join session
- `generateMeetingToken(user, sessionId)` - Get Jitsi token

---

## Support

For issues or questions:
- Check Supabase logs for database errors
- Check browser console for client-side errors
- Check Edge Function logs for AI generation errors
- Verify environment variables are set correctly

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Spec**: vidyasetu-complete-platform
