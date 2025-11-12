export interface User {
  id: string;
  email: string;
  name:string;
  role: 'student' | 'mentor' | 'admin';
  createdAt: string;
  dob?: string;
  education?: string;
  school?: string;
  state?: string;
  contact?: string;
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