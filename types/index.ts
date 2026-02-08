
export interface User {
  id: string;
  email: string;
  name:string;
  role: 'student' | 'mentor' | 'admin';
  createdAt: string;
  accountStatus: 'ENABLED' | 'DISABLED';
  dob?: string;
  education?: string;
  school?: string;
  state?: string;
  contact?: string;
  // Mentorship extensions
  bio?: string;
  expertise?: string[];
  isOpenToMentorship?: boolean;
  // Tutoring extensions
  availability?: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface CourseMaterial {
  id: string;
  type: 'video' | 'pdf' | 'link';
  title: string;
  url: string; // For links or storing mock file paths
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  mentorId: string;
  instructorName: string;
  institutionName: string;
  publishDate: string;
  language: string;
  topics: string[];
  materials: CourseMaterial[];
  createdAt: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  bloomsTaxonomy?: 'Remembering' | 'Understanding' | 'Applying' | 'Analyzing' | 'Evaluating' | 'Creating';
  difficultyTag?: string;
  aiSuggestion?: {
    improvedQuestion?: string;
    suggestedOptions?: string[];
    reasoning?: string;
  };
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: Question[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  createdBy: string; // mentorId
  createdAt: string;
  duration?: number; // Duration in minutes
  aiInvolvement: 'none' | 'assisted' | 'fully-generated';
  generatedByAi?: boolean;
  sourceType?: 'manual' | 'topic-prompt' | 'uploaded-file';
  sourceFileNames?: string[];
  extractedTextHash?: string;
}

export interface QuizAttempt {
  id:string;
  quizId: string;
  studentId: string;
  answers: { [questionId: string]: string };
  score: number;
  overriddenScore?: number;
  feedback?: { [questionId: string]: string };
  overallFeedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  totalPoints: number;
  submittedAt: string;
}

export interface QuizAssignment {
  id: string;
  quizId: string;
  studentId: string;
  assignedAt: string;
  dueDate?: string;
}

// --- TUTORING & MENTORING TYPES ---
export interface TutoringSession {
  id: string;
  mentorId: string;
  studentIds: string[]; 
  topic: string;
  description?: string;
  startTime: string; // ISO string
  duration: number; // minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'one-on-one' | 'group';
  category: 'tutoring' | 'mentoring'; // Distinguish between academic tutoring and career mentorship
  focus?: 'concept' | 'doubt-clearing' | 'exam-prep' | 'career-advice' | 'personal-growth'; // Specific focus
  maxStudents: number;
  meetingLink?: string;
  privateNotes?: string; // Private notes for the mentor
}

export interface MentorshipRequest {
    id: string;
    studentId: string;
    mentorId: string;
    status: 'pending' | 'accepted' | 'rejected';
    message: string;
    createdAt: string;
}

// --- FORUM TYPES ---
export interface ForumCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface ForumThread {
    id: string;
    categoryId: string;
    authorId: string;
    authorName: string;
    title: string;
    content: string;
    createdAt: string;
    views: number;
    upvotes: string[];
    tags: string[];
    replyCount: number;
}

export interface ForumPost {
    id: string;
    threadId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
    upvotes: string[];
}

// --- CHATBOT TYPES ---
export type ChatRole = 'user' | 'model';
export interface ChatMessage {
  role: ChatRole;
  text: string;
  sources?: {
    title: string;
    uri: string;
  }[];
}
