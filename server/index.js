
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
  User, Course, Quiz, QuizAttempt, ActivityLog, 
  ForumCategory, ForumThread, ForumPost, TutoringSession, 
  MentorshipRequest, MaterialProgress, SystemSetting, Assignment 
} = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'skillforge-secret-key';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@skillforge.gdfj2so.mongodb.net/';

// --- RBAC CONFIGURATION ---
const DEFAULT_RBAC_CONFIG = {
  student: { 
    viewCourses: true, 
    takeQuizzes: true, 
    createCourses: false, 
    manageOwnQuizzes: false, 
    viewAllAnalytics: false, 
    manageUsers: false, 
    accessSystemSettings: false, 
    deleteAnyCourse: false 
  },
  mentor: { 
    viewCourses: true, 
    takeQuizzes: false, 
    createCourses: true, 
    manageOwnQuizzes: true, 
    viewAllAnalytics: false, 
    manageUsers: false, 
    accessSystemSettings: false, 
    deleteAnyCourse: false 
  },
  admin: { 
    viewCourses: true, 
    takeQuizzes: true, 
    createCourses: true, 
    manageOwnQuizzes: true, 
    viewAllAnalytics: true, 
    manageUsers: true, 
    accessSystemSettings: true, 
    deleteAnyCourse: true 
  },
};

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors({ 
  origin: process.env.CLIENT_URL || true, 
  credentials: true 
}));

const connectWithRetry = () => {
  mongoose.connect(MONGO_URI, { dbName: 'skillforge_production' })
    .then(() => console.log('MongoDB Atlas Connected'))
    .catch(err => {
      console.error('MongoDB Connection failed:', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

// --- MIDDLEWARE ---

// 1. Authentication: Validate JWT and attach user to request
const protect = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: 'Not authorized: No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
    next();
  } catch { res.status(401).json({ message: 'Session expired or invalid token' }); }
};

// 2. Authorization: Check role permissions dynamically
const authorize = (permission) => {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'User context missing' });

    try {
      // Fetch dynamic RBAC settings from DB
      const securitySettings = await SystemSetting.findOne({ category: 'security' });
      
      // Deep merge DB settings with Defaults to ensure no keys are missing
      const dbRbac = securitySettings?.data?.rbac || {};
      const rbac = {
        student: { ...DEFAULT_RBAC_CONFIG.student, ...dbRbac.student },
        mentor: { ...DEFAULT_RBAC_CONFIG.mentor, ...dbRbac.mentor },
        admin: { ...DEFAULT_RBAC_CONFIG.admin, ...dbRbac.admin },
      };
      
      const userRole = req.user.role;
      const rolePermissions = rbac[userRole];

      if (rolePermissions && rolePermissions[permission]) {
        next();
      } else {
        res.status(403).json({ 
          message: 'Access Denied', 
          error: `Role '${userRole}' lacks the '${permission}' permission required for this resource.` 
        });
      }
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({ message: 'Error verifying permissions' });
    }
  };
};

// --- API ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('jwt', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        maxAge: 604800000 
      });
      const userObj = user.toObject(); delete userObj.passwordHash;
      res.json({ ...userObj, id: user._id });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (e) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) return res.status(400).json({ message: 'Email already registered' });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('jwt', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 604800000 
    });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/auth/me', protect, (req, res) => res.json({ ...req.user.toObject(), id: req.user._id }));

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out' });
});

// User Management
app.get('/api/users', protect, authorize('manageUsers'), async (req, res) => {
  res.json(await User.find().select('-passwordHash'));
});

app.put('/api/users/:id', protect, authorize('manageUsers'), async (req, res) => {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-passwordHash');
    res.json({ ...updated.toObject(), id: updated._id });
});

app.patch('/api/users/:id/status', protect, authorize('manageUsers'), async (req, res) => {
    const { status } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, { accountStatus: status }, { new: true });
    res.json({ ...updated.toObject(), id: updated._id });
});

app.delete('/api/users/:id', protect, authorize('manageUsers'), async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
});

app.patch('/api/users/:id/password', protect, authorize('manageUsers'), async (req, res) => {
    const { password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await User.findByIdAndUpdate(req.params.id, { passwordHash });
    res.json({ message: 'Password updated' });
});

// Courses
app.get('/api/courses', protect, authorize('viewCourses'), async (req, res) => {
  const courses = await Course.find();
  res.json(courses.map(c => ({ ...c.toObject(), id: c._id })));
});

app.get('/api/courses/:id', protect, authorize('viewCourses'), async (req, res) => {
  try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      res.json({ ...course.toObject(), id: course._id });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/courses', protect, authorize('createCourses'), async (req, res) => {
  const course = await Course.create({ ...req.body, mentorId: req.user._id });
  res.status(201).json({ ...course.toObject(), id: course._id });
});

app.put('/api/courses/:id', protect, authorize('createCourses'), async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // RBAC: Admin or Owner only
    if (req.user.role !== 'admin' && course.mentorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to edit this course' });
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...updated.toObject(), id: updated._id });
});

app.delete('/api/courses/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const securitySettings = await SystemSetting.findOne({ category: 'security' });
    const rbac = securitySettings?.data?.rbac || DEFAULT_RBAC_CONFIG;
    const canDeleteAny = rbac[req.user.role]?.deleteAnyCourse;
    const isOwner = course.mentorId.toString() === req.user._id.toString();

    if (canDeleteAny || isOwner) {
      await Course.findByIdAndDelete(req.params.id);
      // Clean up quizzes associated with course?
      res.json({ message: 'Course deleted successfully' });
    } else {
      res.status(403).json({ message: 'Not authorized to delete this course' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting course' });
  }
});

// Quizzes
app.get('/api/quizzes', protect, authorize('viewCourses'), async (req, res) => {
  const filter = {};
  if (req.query.courseId) filter.courseId = req.query.courseId;
  
  const quizzes = await Quiz.find(filter);
  res.json(quizzes.map(q => ({ ...q.toObject(), id: q._id })));
});

app.get('/api/quizzes/:id', protect, authorize('viewCourses'), async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if(!quiz) return res.status(404).json({message: 'Quiz not found'});
    res.json({...quiz.toObject(), id: quiz._id});
});

app.post('/api/quizzes', protect, authorize('manageOwnQuizzes'), async (req, res) => {
  const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ ...quiz.toObject(), id: quiz._id });
});

app.put('/api/quizzes/:id', protect, authorize('manageOwnQuizzes'), async (req, res) => {
    const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...updated.toObject(), id: updated._id });
});

app.delete('/api/quizzes/:id', protect, authorize('manageOwnQuizzes'), async (req, res) => {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted' });
});

// Attempts & Assignments
app.post('/api/quiz/attempt', protect, authorize('takeQuizzes'), async (req, res) => {
  const attempt = await QuizAttempt.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ ...attempt.toObject(), id: attempt._id });
});

app.put('/api/quiz/attempt/:id', protect, async (req, res) => {
    const updated = await QuizAttempt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...updated.toObject(), id: updated._id });
});

app.get('/api/quiz/attempts', protect, async (req, res) => {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    
    // Students can only view their own unless explicit permission (unlikely for student role)
    if (req.user.role === 'student' && req.query.userId && req.query.userId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Can only view own attempts' });
    }
    
    const attempts = await QuizAttempt.find(filter);
    res.json(attempts.map(a => ({ 
        ...a.toObject(), 
        id: a._id,
        studentId: a.userId 
    })));
});

app.post('/api/quiz/assignments', protect, async (req, res) => {
    const { quizId, studentIds, dueDate } = req.body;
    const assignments = await Promise.all(studentIds.map(sid => 
        Assignment.create({ quizId, studentId: sid, dueDate })
    ));
    res.json(assignments);
});

app.get('/api/quiz/assigned', protect, async (req, res) => {
    const userId = req.query.userId || req.user._id;
    // Return all quizzes for simplicity in this demo environment, essentially "open enrollment"
    const quizzes = await Quiz.find();
    res.json(quizzes.map(q => ({...q.toObject(), id: q._id})));
});

// Progress
app.post('/api/progress/material', protect, async (req, res) => {
    const { materialId } = req.body;
    await MaterialProgress.findOneAndUpdate(
        { userId: req.user._id, materialId },
        { viewedAt: new Date() },
        { upsert: true }
    );
    res.json({ success: true });
});

app.get('/api/progress/materials', protect, async (req, res) => {
    const progress = await MaterialProgress.find({ userId: req.user._id });
    res.json(progress.map(p => p.materialId));
});

app.get('/api/progress/all', protect, async (req, res) => {
    const all = await MaterialProgress.find();
    const map = {};
    all.forEach(p => {
        if(!map[p.userId]) map[p.userId] = [];
        map[p.userId].push(p.materialId);
    });
    res.json(map);
});

// Tutoring
app.get('/api/tutoring/sessions', protect, async (req, res) => {
    const filter = {};
    if (req.query.userId) {
        const userId = req.query.userId;
        const sessions = await TutoringSession.find({
            $or: [{ mentorId: userId }, { studentIds: userId }]
        });
        return res.json(sessions.map(s => ({ ...s.toObject(), id: s._id })));
    }
    const sessions = await TutoringSession.find();
    res.json(sessions.map(s => ({ ...s.toObject(), id: s._id })));
});

app.get('/api/tutoring/sessions/:id', protect, async (req, res) => {
    const session = await TutoringSession.findById(req.params.id);
    if (!session) return res.status(404).json({});
    res.json({ ...session.toObject(), id: session._id });
});

app.post('/api/tutoring/sessions', protect, async (req, res) => {
    const session = await TutoringSession.create(req.body);
    res.status(201).json({ ...session.toObject(), id: session._id });
});

app.put('/api/tutoring/sessions/:id', protect, async (req, res) => {
    const updated = await TutoringSession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...updated.toObject(), id: updated._id });
});

app.delete('/api/tutoring/sessions/:id', protect, async (req, res) => {
    await TutoringSession.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
});

// Mentorship
app.get('/api/mentorship/requests', protect, async (req, res) => {
    const filter = {};
    if (req.user.role === 'student') filter.studentId = req.user._id;
    if (req.user.role === 'mentor') filter.mentorId = req.user._id;
    
    const requests = await MentorshipRequest.find(filter);
    res.json(requests.map(r => ({ ...r.toObject(), id: r._id })));
});

app.post('/api/mentorship/requests', protect, async (req, res) => {
    const request = await MentorshipRequest.create(req.body);
    res.status(201).json({ ...request.toObject(), id: request._id });
});

app.put('/api/mentorship/requests/:id', protect, async (req, res) => {
    const updated = await MentorshipRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...updated.toObject(), id: updated._id });
});

// Forums
app.get('/api/forum/categories', protect, async (req, res) => {
    const cats = await ForumCategory.find();
    if (cats.length === 0) {
        const defaults = [
            { name: 'General Support', description: 'Get help with the platform', icon: 'HelpCircle' },
            { name: 'Course Discussion', description: 'Discuss course topics', icon: 'Book' }
        ];
        const created = await ForumCategory.insertMany(defaults);
        return res.json(created.map(c => ({...c.toObject(), id: c._id})));
    }
    res.json(cats.map(c => ({ ...c.toObject(), id: c._id })));
});

app.get('/api/forum/threads', protect, async (req, res) => {
    const threads = await ForumThread.find().sort({ createdAt: -1 });
    // In production, populate author name. For now, sending as is, frontend often has authorName in object if saved that way or fetched.
    // The current ForumThread model saves authorId. Ideally we populate.
    // However, frontend types suggest authorName is part of the object. 
    // Let's populate authorId and map it.
    const populated = await ForumThread.find().sort({ createdAt: -1 }).populate('authorId', 'name');
    res.json(populated.map(t => ({ 
        ...t.toObject(), 
        id: t._id, 
        authorName: t.authorId?.name || 'Unknown' 
    })));
});

app.post('/api/forum/threads', protect, async (req, res) => {
    const thread = await ForumThread.create({ ...req.body, authorId: req.user._id });
    res.status(201).json({ ...thread.toObject(), id: thread._id });
});

app.get('/api/forum/threads/:id', protect, async (req, res) => {
    const thread = await ForumThread.findById(req.params.id).populate('authorId', 'name');
    res.json({ ...thread.toObject(), id: thread._id, authorName: thread.authorId?.name });
});

app.get('/api/forum/threads/:id/posts', protect, async (req, res) => {
    const posts = await ForumPost.find({ threadId: req.params.id }).populate('authorId', 'name');
    res.json(posts.map(p => ({ ...p.toObject(), id: p._id, authorName: p.authorId?.name })));
});

app.post('/api/forum/posts', protect, async (req, res) => {
    const post = await ForumPost.create({ ...req.body, authorId: req.user._id });
    // Optionally increment replyCount on thread
    res.status(201).json({ ...post.toObject(), id: post._id });
});

app.post('/api/forum/threads/:id/vote', protect, async (req, res) => {
    const thread = await ForumThread.findById(req.params.id);
    if (thread) {
        if (!thread.upvotes.includes(req.user._id)) {
            thread.upvotes.push(req.user._id);
        } else {
            thread.upvotes.pull(req.user._id);
        }
        await thread.save();
    }
    res.json({ success: true });
});

// Logs & Settings
app.get('/api/logs', protect, authorize('viewAllAnalytics'), async (req, res) => {
  const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100).populate('userId', 'name email');
  res.json(logs.map(l => ({ ...l.toObject(), id: l._id })));
});

app.post('/api/logs', protect, async (req, res) => {
    // Frontend logging endpoint
    await ActivityLog.create({ ...req.body, userId: req.user._id });
    res.json({ success: true });
});

app.get('/api/settings/:category', protect, authorize('accessSystemSettings'), async (req, res) => {
  const setting = await SystemSetting.findOne({ category: req.params.category });
  res.json(setting ? setting.data : {});
});

app.post('/api/settings/:category', protect, authorize('accessSystemSettings'), async (req, res) => {
  const setting = await SystemSetting.findOneAndUpdate(
    { category: req.params.category },
    { data: req.body },
    { upsert: true, new: true }
  );
  res.json(setting.data);
});

app.listen(PORT, () => console.log(`SkillForge RBAC Engine active on port ${PORT}`));
