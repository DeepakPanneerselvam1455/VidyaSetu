
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Course, Quiz, QuizAttempt } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://skillforge.gdfj2so.mongodb.net/';
const DB_NAME = 'skillforge_production';

async function migrate() {
  console.log('--- Starting Migration to MongoDB Atlas ---');
  
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log('Connected to MongoDB Atlas cluster.');

    // 1. Data Source (Simulated legacy data from MySQL/LocalStorage)
    // In a real scenario, these would be results from 'SELECT * FROM users'
    const legacyData = {
      users: [
        { id: 'legacy_s1', name: 'Alex Student', email: 'student@skillforge.com', role: 'student', password: 'student123' },
        { id: 'legacy_m1', name: 'Dr. Sarah Mentor', email: 'instructor@skillforge.com', role: 'mentor', expertise: ['React', 'Node.js'], password: 'instructor123' },
        { id: 'legacy_a1', name: 'System Admin', email: 'admin@skillforge.com', role: 'admin', password: 'admin123' }
      ],
      courses: [
        { id: 'legacy_c1', title: 'Introduction to React', mentorId: 'legacy_m1', difficulty: 'Beginner', topics: ['React', 'JSX'] }
      ],
      quizzes: [
        { id: 'legacy_q1', courseId: 'legacy_c1', title: 'React Basics', difficulty: 'Beginner', createdBy: 'legacy_m1', questions: [
          { id: 'q_1', type: 'multiple-choice', question: 'What is JSX?', options: ['Syntax', 'Database', 'Server'], correctAnswer: 'Syntax', points: 10 }
        ]}
      ]
    };

    // Mapping to track old IDs -> new ObjectIds for referential integrity
    const idMap = {
      users: {},
      courses: {},
      quizzes: {}
    };

    // --- Migrate Users ---
    console.log('Migrating Users...');
    const salt = await bcrypt.genSalt(10);
    for (const u of legacyData.users) {
      const passwordHash = await bcrypt.hash(u.password, salt);
      const newUser = await User.findOneAndUpdate(
        { email: u.email },
        { ...u, passwordHash, id: undefined, _id: new mongoose.Types.ObjectId() },
        { upsert: true, new: true }
      );
      idMap.users[u.id] = newUser._id;
    }
    console.log(`Successfully migrated/synced ${Object.keys(idMap.users).length} users.`);

    // --- Migrate Courses ---
    console.log('Migrating Courses...');
    for (const c of legacyData.courses) {
      const mentorId = idMap.users[c.mentorId];
      if (!mentorId) continue;
      
      const newCourse = await Course.findOneAndUpdate(
        { title: c.title, mentorId },
        { ...c, mentorId, id: undefined, _id: new mongoose.Types.ObjectId() },
        { upsert: true, new: true }
      );
      idMap.courses[c.id] = newCourse._id;
    }
    console.log(`Successfully migrated ${Object.keys(idMap.courses).length} courses.`);

    // --- Migrate Quizzes ---
    console.log('Migrating Quizzes...');
    for (const q of legacyData.quizzes) {
      const courseId = idMap.courses[q.courseId];
      const creatorId = idMap.users[q.createdBy];
      if (!courseId) continue;

      const newQuiz = await Quiz.findOneAndUpdate(
        { title: q.title, courseId },
        { ...q, courseId, createdBy: creatorId, id: undefined, _id: new mongoose.Types.ObjectId() },
        { upsert: true, new: true }
      );
      idMap.quizzes[q.id] = newQuiz._id;
    }
    console.log(`Successfully migrated ${Object.keys(idMap.quizzes).length} quizzes.`);

    console.log('--- Migration Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
