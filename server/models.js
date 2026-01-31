
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
  accountStatus: { type: String, enum: ['ENABLED', 'DISABLED'], default: 'ENABLED' },
  bio: String,
  expertise: [String],
  dob: String,
  education: String,
  school: String,
  state: String,
  contact: String,
  createdAt: { type: Date, default: Date.now }
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  instructorName: String,
  institutionName: String,
  publishDate: String,
  language: { type: String, default: 'English' },
  topics: [String],
  materials: [{
    id: String,
    title: String,
    type: { type: String, enum: ['video', 'pdf', 'link'] },
    url: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const QuizSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  duration: { type: Number, default: 15 },
  questions: [{
    id: String,
    type: { type: String, enum: ['multiple-choice', 'short-answer'] },
    question: { type: String, required: true },
    options: [String],
    correctAnswer: { type: String, required: true },
    points: { type: Number, default: 10 }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  answers: { type: Map, of: String },
  score: { type: Number, required: true },
  totalPoints: { type: Number, required: true },
  timeSpentSeconds: Number,
  submittedAt: { type: Date, default: Date.now },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  feedback: { type: Map, of: String },
  overallFeedback: String,
  overriddenScore: Number
});

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: String,
  title: String,
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed
});

const ForumCategorySchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String
});

const ForumThreadSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumCategory', required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  content: String,
  tags: [String],
  views: { type: Number, default: 0 },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const ForumPostSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const TutoringSessionSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  topic: String,
  description: String,
  startTime: Date,
  duration: Number,
  status: { type: String, enum: ['scheduled', 'active', 'completed', 'cancelled'], default: 'scheduled' },
  category: { type: String, enum: ['tutoring', 'mentoring'], default: 'tutoring' },
  privateNotes: String,
  createdAt: { type: Date, default: Date.now }
});

const MentorshipRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const MaterialProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  materialId: { type: String, required: true, index: true },
  viewedAt: { type: Date, default: Date.now }
});

const SystemSettingSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true }, // e.g., 'general', 'security'
  data: mongoose.Schema.Types.Mixed
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Course: mongoose.model('Course', CourseSchema),
  Quiz: mongoose.model('Quiz', QuizSchema),
  QuizAttempt: mongoose.model('QuizAttempt', QuizAttemptSchema),
  ActivityLog: mongoose.model('ActivityLog', ActivityLogSchema),
  ForumCategory: mongoose.model('ForumCategory', ForumCategorySchema),
  ForumThread: mongoose.model('ForumThread', ForumThreadSchema),
  ForumPost: mongoose.model('ForumPost', ForumPostSchema),
  TutoringSession: mongoose.model('TutoringSession', TutoringSessionSchema),
  MentorshipRequest: mongoose.model('MentorshipRequest', MentorshipRequestSchema),
  MaterialProgress: mongoose.model('MaterialProgress', MaterialProgressSchema),
  SystemSetting: mongoose.model('SystemSetting', SystemSettingSchema),
  Assignment: mongoose.model('Assignment', new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: Date
  }))
};
