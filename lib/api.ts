
import { User, Course, Quiz, Question, QuizAttempt, ForumCategory, ForumThread, ForumPost, TutoringSession, MentorshipRequest, ChatMessage as AppChatMessage } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// --- STORAGE KEYS ---
const KEYS = {
    PROFILES: 'sf_profiles',
    COURSES: 'sf_courses',
    QUIZZES: 'sf_quizzes',
    ATTEMPTS: 'sf_attempts',
    FORUM_CATS: 'sf_forum_categories',
    FORUM_THREADS: 'sf_forum_threads',
    FORUM_POSTS: 'sf_forum_posts',
    TUTORING: 'sf_tutoring_sessions',
    MENTORSHIP: 'sf_mentorship_requests',
    PROGRESS: 'sf_material_progress',
    LOGS: 'sf_activity_logs',
    SESSION: 'sf_auth_session'
};

// --- GENERIC HELPERS ---
const get = <T>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

const set = <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
};

// --- INITIAL DATA SEEDING ---
export const initMockData = async () => {
    if (localStorage.getItem(KEYS.PROFILES) && localStorage.getItem(KEYS.COURSES)?.length! > 2) return;

    const demoProfiles: User[] = [
        { id: 'u1', email: 'student@skillforge.com', name: 'Demo Student', role: 'student', createdAt: new Date().toISOString(), accountStatus: 'ENABLED' },
        { id: 'u2', email: 'instructor@skillforge.com', name: 'Expert Mentor', role: 'mentor', createdAt: new Date().toISOString(), accountStatus: 'ENABLED', expertise: ['React', 'TypeScript', 'AI'], bio: 'Learning enthusiast with 10 years experience.' },
        { id: 'u3', email: 'admin@skillforge.com', name: 'System Admin', role: 'admin', createdAt: new Date().toISOString(), accountStatus: 'ENABLED' }
    ];

    const demoForumCats: ForumCategory[] = [
        { id: 'cat1', name: 'General Support', description: 'Get help with the platform', icon: 'HelpCircle' },
        { id: 'cat2', name: 'React Development', description: 'Course specific discussions', icon: 'Code' },
        { id: 'cat3', name: 'Career Advice', description: 'Mentorship and job hunting', icon: 'Briefcase' }
    ];

    const demoCourses: Course[] = [
        {
            id: 'c1',
            title: 'Mastering React Hooks',
            description: 'Dive deep into functional components with useEffect, useMemo, and custom hooks.',
            difficulty: 'Intermediate',
            mentorId: 'u2',
            instructorName: 'Expert Mentor',
            institutionName: 'SkillForge Academy',
            publishDate: '2024-01-15',
            language: 'English',
            topics: ['Hooks', 'React', 'Frontend'],
            materials: [
                { id: 'm1', title: 'Introduction to useEffect', type: 'video', url: 'https://www.youtube.com/watch?v=0ZJgIjIuY7U' },
                { id: 'm2', title: 'Custom Hooks Patterns', type: 'pdf', url: 'patterns.pdf' },
                { id: 'm3', title: 'Optimization with useMemo', type: 'link', url: 'https://react.dev/reference/react/useMemo' }
            ],
            createdAt: new Date().toISOString()
        },
        {
            id: 'c2',
            title: 'AI Fundamentals with Gemini',
            description: 'Learn how to integrate Generative AI into your web applications using the Google Gemini API.',
            difficulty: 'Beginner',
            mentorId: 'u2',
            instructorName: 'Expert Mentor',
            institutionName: 'SkillForge Academy',
            publishDate: '2024-02-10',
            language: 'English',
            topics: ['AI', 'LLM', 'Gemini'],
            materials: [
                { id: 'm4', title: 'Gemini API Overview', type: 'video', url: 'https://www.youtube.com/watch?v=GeminiIntro' },
                { id: 'm5', title: 'Prompt Engineering Guide', type: 'pdf', url: 'prompts.pdf' }
            ],
            createdAt: new Date().toISOString()
        },
        {
            id: 'c3',
            title: 'Node.js Backend Architecture',
            description: 'Scalable backend design with Express, MongoDB, and modern patterns.',
            difficulty: 'Advanced',
            mentorId: 'u2',
            instructorName: 'Expert Mentor',
            institutionName: 'SkillForge Academy',
            publishDate: '2024-03-01',
            language: 'English',
            topics: ['Backend', 'Node.js', 'Scaling'],
            materials: [
                { id: 'm6', title: 'Stream API in Depth', type: 'link', url: 'https://nodejs.org/api/stream.html' }
            ],
            createdAt: new Date().toISOString()
        }
    ];

    const demoQuizzes: Quiz[] = [
        {
            id: 'q1',
            courseId: 'c1',
            title: 'Hooks Proficiency Test',
            difficulty: 'Intermediate',
            createdBy: 'u2',
            createdAt: new Date().toISOString(),
            duration: 15,
            aiInvolvement: 'assisted',
            questions: [
                {
                    id: 'qu1',
                    type: 'multiple-choice',
                    question: 'Which hook is used to handle side effects in React?',
                    options: ['useState', 'useMemo', 'useEffect', 'useCallback'],
                    correctAnswer: 'useEffect',
                    points: 10,
                    bloomsTaxonomy: 'Remembering'
                },
                {
                    id: 'qu2',
                    type: 'multiple-choice',
                    question: 'What does useMemo return?',
                    options: ['A function', 'A memoized value', 'A state tuple', 'A ref object'],
                    correctAnswer: 'A memoized value',
                    points: 10,
                    bloomsTaxonomy: 'Understanding'
                }
            ]
        }
    ];

    set(KEYS.PROFILES, demoProfiles);
    set(KEYS.FORUM_CATS, demoForumCats);
    set(KEYS.COURSES, demoCourses);
    set(KEYS.QUIZZES, demoQuizzes);
    set(KEYS.ATTEMPTS, []);
    set(KEYS.LOGS, []);
    set(KEYS.TUTORING, []);
    set(KEYS.MENTORSHIP, []);
};

initMockData();

// --- AUTH ---
export const login = async (email: string, pass: string) => {
    const users = get<User[]>(KEYS.PROFILES, []);
    const user = users.find(u => u.email === email);
    if (!user) throw new Error("User not found");
    set(KEYS.SESSION, user.id);
    return { user };
};

export const getProfile = async () => {
    const userId = localStorage.getItem(KEYS.SESSION);
    if (!userId) return null;
    const users = get<User[]>(KEYS.PROFILES, []);
    return users.find(u => u.id === userId) || null;
};

export const logout = async () => {
    localStorage.removeItem(KEYS.SESSION);
};

// --- USERS ---
export const getUsers = async () => get<User[]>(KEYS.PROFILES, []);

export const register = async (userData: any, pass: string) => {
    const users = get<User[]>(KEYS.PROFILES, []);
    if (users.find(u => u.email === userData.email)) throw new Error("Email already registered");
    const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        accountStatus: 'ENABLED'
    };
    set(KEYS.PROFILES, [...users, newUser]);
    return newUser;
};

export const createUser = async (data: any, pass: string) => register(data, pass);

export const updateUser = async (data: User) => {
    const users = get<User[]>(KEYS.PROFILES, []);
    set(KEYS.PROFILES, users.map(u => u.id === data.id ? data : u));
};

export const toggleUserStatus = async (userId: string, adminId: string, status: string) => {
    const users = get<User[]>(KEYS.PROFILES, []);
    set(KEYS.PROFILES, users.map(u => u.id === userId ? { ...u, accountStatus: status as any } : u));
};

export const deleteUser = async (id: string) => {
    const users = get<User[]>(KEYS.PROFILES, []);
    set(KEYS.PROFILES, users.filter(u => u.id !== id));
};

export const resetPassword = async (id: string, pass: string) => {
    console.log(`Password reset for ${id} to ${pass}`);
};

// --- COURSES ---
export const getCourses = async () => get<Course[]>(KEYS.COURSES, []);

export const getCourseById = async (id: string) => {
    const courses = get<Course[]>(KEYS.COURSES, []);
    return courses.find(c => c.id === id) || null;
};

export const createCourse = async (data: any) => {
    const courses = get<Course[]>(KEYS.COURSES, []);
    const newCourse: Course = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
    };
    set(KEYS.COURSES, [...courses, newCourse]);
    return newCourse;
};

export const updateCourse = async (data: any) => {
    const courses = get<Course[]>(KEYS.COURSES, []);
    set(KEYS.COURSES, courses.map(c => c.id === data.id ? { ...c, ...data } : c));
};

export const deleteCourse = async (id: string) => {
    const courses = get<Course[]>(KEYS.COURSES, []);
    set(KEYS.COURSES, courses.filter(c => c.id !== id));
};

// --- PROGRESS ---
export const markMaterialAsViewed = async (userId: string, materialId: string) => {
    const progress = get<Record<string, string[]>>(KEYS.PROGRESS, {});
    if (!progress[userId]) progress[userId] = [];
    if (!progress[userId].includes(materialId)) {
        progress[userId].push(materialId);
        set(KEYS.PROGRESS, progress);
    }
};

export const getViewedMaterialsForStudent = async (userId: string) => {
    const progress = get<Record<string, string[]>>(KEYS.PROGRESS, {});
    return progress[userId] || [];
};

export const getAllViewedMaterials = async () => get<Record<string, string[]>>(KEYS.PROGRESS, {});

// --- QUIZZES ---
export const getQuizzes = async () => get<Quiz[]>(KEYS.QUIZZES, []);

export const getQuizzesByCourse = async (courseId: string) => {
    const quizzes = get<Quiz[]>(KEYS.QUIZZES, []);
    return quizzes.filter(q => q.courseId === courseId);
};

export const getQuizById = async (id: string) => {
    const quizzes = get<Quiz[]>(KEYS.QUIZZES, []);
    return quizzes.find(q => q.id === id) || null;
};

export const createQuiz = async (data: any) => {
    const quizzes = get<Quiz[]>(KEYS.QUIZZES, []);
    const newQuiz: Quiz = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
    };
    set(KEYS.QUIZZES, [...quizzes, newQuiz]);
    return newQuiz;
};

export const updateQuiz = async (data: any) => {
    const quizzes = get<Quiz[]>(KEYS.QUIZZES, []);
    set(KEYS.QUIZZES, quizzes.map(q => q.id === data.id ? { ...q, ...data } : q));
};

export const deleteQuiz = async (id: string) => {
    const quizzes = get<Quiz[]>(KEYS.QUIZZES, []);
    set(KEYS.QUIZZES, quizzes.filter(q => q.id !== id));
};

export const submitQuizAttempt = async (data: any) => {
    const attempts = get<QuizAttempt[]>(KEYS.ATTEMPTS, []);
    const newAttempt: QuizAttempt = {
        ...data,
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString()
    };
    set(KEYS.ATTEMPTS, [...attempts, newAttempt]);
    return newAttempt;
};

export const updateQuizAttempt = async (data: any) => {
    const attempts = get<QuizAttempt[]>(KEYS.ATTEMPTS, []);
    set(KEYS.ATTEMPTS, attempts.map(a => a.id === data.id ? { ...a, ...data } : a));
};

export const getStudentProgress = async (userId: string) => {
    const attempts = get<QuizAttempt[]>(KEYS.ATTEMPTS, []);
    return attempts.filter(a => a.studentId === userId);
};

export const getAllAttempts = async () => get<QuizAttempt[]>(KEYS.ATTEMPTS, []);

export const createQuizAssignments = async (quizId: string, studentIds: string[], dueDate?: string) => {
    console.log(`Quiz ${quizId} assigned to students: ${studentIds.join(', ')}`);
};

export const getAssignedQuizzesForStudent = async (userId: string) => get<Quiz[]>(KEYS.QUIZZES, []);
export const getAssignedCoursesForStudent = (userId: string) => getCourses();

// --- FORUMS ---
export const getForumCategories = async () => get<ForumCategory[]>(KEYS.FORUM_CATS, []);

export const getForumThreads = async () => {
    const threads = get<ForumThread[]>(KEYS.FORUM_THREADS, []);
    return [...threads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getForumThreadById = async (id: string) => {
    const threads = get<ForumThread[]>(KEYS.FORUM_THREADS, []);
    return threads.find(t => t.id === id) || null;
};

export const createForumThread = async (data: any) => {
    const threads = get<ForumThread[]>(KEYS.FORUM_THREADS, []);
    const newThread: ForumThread = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        views: 0,
        upvotes: [],
        replyCount: 0
    };
    set(KEYS.FORUM_THREADS, [...threads, newThread]);
    return newThread;
};

export const getForumPosts = async (threadId: string) => {
    const posts = get<ForumPost[]>(KEYS.FORUM_POSTS, []);
    return posts.filter(p => p.threadId === threadId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const createForumPost = async (data: any) => {
    const posts = get<ForumPost[]>(KEYS.FORUM_POSTS, []);
    const newPost: ForumPost = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        upvotes: []
    };
    set(KEYS.FORUM_POSTS, [...posts, newPost]);
    const threads = get<ForumThread[]>(KEYS.FORUM_THREADS, []);
    set(KEYS.FORUM_THREADS, threads.map(t => t.id === data.threadId ? { ...t, replyCount: t.replyCount + 1 } : t));
    return newPost;
};

export const toggleThreadVote = async (id: string, userId: string) => {
    const threads = get<ForumThread[]>(KEYS.FORUM_THREADS, []);
    set(KEYS.FORUM_THREADS, threads.map(t => {
        if (t.id !== id) return t;
        const upvotes = t.upvotes.includes(userId) ? t.upvotes.filter(uid => uid !== userId) : [...t.upvotes, userId];
        return { ...t, upvotes };
    }));
};

// --- MENTORSHIP & TUTORING ---
export const getMentors = async () => {
    const users = get<User[]>(KEYS.PROFILES, []);
    return users.filter(u => u.role === 'mentor');
};

export const getMentorshipRequests = async (userId: string, role: string) => {
    const requests = get<MentorshipRequest[]>(KEYS.MENTORSHIP, []);
    const field = role === 'student' ? 'studentId' : 'mentorId';
    return requests.filter(r => r[field as keyof MentorshipRequest] === userId);
};

export const createMentorshipRequest = async (data: any) => {
    const requests = get<MentorshipRequest[]>(KEYS.MENTORSHIP, []);
    const newReq: MentorshipRequest = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    set(KEYS.MENTORSHIP, [...requests, newReq]);
    return newReq;
};

export const updateMentorshipRequest = async (data: any) => {
    const requests = get<MentorshipRequest[]>(KEYS.MENTORSHIP, []);
    set(KEYS.MENTORSHIP, requests.map(r => r.id === data.id ? { ...r, status: data.status } : r));
};

export const getTutoringSessions = async () => get<TutoringSession[]>(KEYS.TUTORING, []);

export const getTutoringSessionById = async (id: string) => {
    const sessions = get<TutoringSession[]>(KEYS.TUTORING, []);
    return sessions.find(s => s.id === id) || null;
};

export const createTutoringSession = async (data: any) => {
    const sessions = get<TutoringSession[]>(KEYS.TUTORING, []);
    const newSession: TutoringSession = {
        ...data,
        id: crypto.randomUUID(),
    };
    set(KEYS.TUTORING, [...sessions, newSession]);
    return newSession;
};

export const updateTutoringSession = async (data: any) => {
    const sessions = get<TutoringSession[]>(KEYS.TUTORING, []);
    set(KEYS.TUTORING, sessions.map(s => s.id === data.id ? { ...s, ...data } : s));
};

export const deleteTutoringSession = async (id: string) => {
    const sessions = get<TutoringSession[]>(KEYS.TUTORING, []);
    set(KEYS.TUTORING, sessions.filter(s => s.id !== id));
};

export const getSessionsForUser = async (userId: string, role: string) => {
    const sessions = get<TutoringSession[]>(KEYS.TUTORING, []);
    if (role === 'mentor') return sessions.filter(s => s.mentorId === userId);
    else return sessions.filter(s => s.studentIds.includes(userId));
};

// --- LOGS & SETTINGS ---
export const logActivity = async (type: string, title: string, details?: any) => {
    const logs = get<any[]>(KEYS.LOGS, []);
    const newLog = { id: crypto.randomUUID(), type, title, details, timestamp: new Date().toISOString() };
    set(KEYS.LOGS, [newLog, ...logs].slice(0, 100));
};

export const getSystemSettings = async (category: string) => get(`sf_settings_${category}`, {});
export const updateSystemSettings = async (category: string, data: any) => set(`sf_settings_${category}`, data);

// --- AI (GEMINI) ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getAIFeedbackForQuestion = async (question: Question) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Explain simply why the answer to "${question.question}" is "${question.correctAnswer}".`,
    });
    return res.text;
};

export const getQuestionAISuggestion = async (question: Question, courseTitle: string) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    improvedQuestion: { type: Type.STRING },
                    suggestedOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    bloomsTaxonomy: { type: Type.STRING },
                    difficultyAssessment: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                }
            }
        },
        contents: `Analyze this quiz question for a course on "${courseTitle}": 
        Question: "${question.question}"
        Correct Answer: "${question.correctAnswer}"
        Return a JSON object with improvements.`,
    });
    try { return JSON.parse(res.text || '{}'); } catch { return null; }
};

export const improveQuestionWithAI = async (q: any, quizContext: Quiz) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given a quiz about "${quizContext.title}", improve this question: "${q.question}". Return only the improved question text.`,
    });
    return { ...q, question: res.text?.trim() || q.question };
};

export const generateAlternativeOptionsWithAI = async (q: any) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        contents: `Generate 3 incorrect multiple choice options for: "${q.question}" where the correct answer is "${q.correctAnswer}".`,
    });
    try { return JSON.parse(res.text || '[]'); } catch { return [q.correctAnswer, "Option B", "Option C", "Option D"]; }
};

export const generateQuizTopics = async (title: string, description: string, materials: any[]) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        contents: `Based on a course titled "${title}", suggest 3 topics for a quiz.`,
    });
    try { return JSON.parse(res.text || '[]'); } catch { return ["Topic 1", "Topic 2", "Topic 3"]; }
};

export const getLearningSuggestion = async (attempt: QuizAttempt, quiz: Quiz, course: Course, allCourses: Course[]) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Student scored ${attempt.score}/${attempt.totalPoints} on "${quiz.title}". Suggest next study step in one sentence.`,
    });
    return res.text?.trim() || "Keep studying the current module.";
};

export const regenerateQuestionWithAI = async (topic: string, difficulty: string, type: string, contextText?: string) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    points: { type: Type.NUMBER },
                    bloomsTaxonomy: { type: Type.STRING }
                },
                required: ["id", "type", "question", "correctAnswer", "points"]
            }
        },
        contents: `Generate a ${difficulty} level ${type} question about "${topic}" based on: ${contextText || 'general knowledge'}.`,
    });
    try { return { ...JSON.parse(res.text || '{}'), id: crypto.randomUUID() }; } catch { return null; }
};

export const generateQuizQuestions = async (
    topic: string, 
    objectives: string, 
    difficulty: string, 
    count: number, 
    type: string, 
    courseInfo: { title: string, description: string },
    contextText?: string
) => {
    const systemPrompt = `You are an expert pedagogical assessment generator. 
Your task is to generate a quiz with EXACTLY ${count} questions.
Target Difficulty: ${difficulty}
Question Format: ${type === 'multiple-choice' ? 'Multiple Choice (MCQ)' : 'Mixed (MCQ and Short Answer)'}
Course Context: "${courseInfo.title}" - ${courseInfo.description}
Topic Refinement: "${topic}"

STRICT GROUNDING RULES:
1. IF "KNOWLEDGE SOURCE MATERIALS" (FILES) ARE PROVIDED:
   - THEY ARE YOUR EXCLUSIVE KNOWLEDGE BASE. DO NOT USE ANY EXTERNAL FACTS.
   - EXTRACT CONCEPTS ONLY FROM THE PROVIDED FILE TEXT.
   - FILTER CONTENT: ONLY INCLUDE MATERIAL THAT MATCHES THE TOPIC REFINEMENT: "${topic}".
   - EVERY QUESTION MUST BE SUPPORTED BY AND TRACEABLE TO A SPECIFIC PART OF THE PROVIDED MATERIAL.
   - IF THE TOPIC REFINEMENT IS NOT DISCUSSED IN THE MATERIAL, DO NOT GENERATE QUESTIONS FOR IT.
2. IF NO SOURCE MATERIALS ARE PROVIDED:
   - GENERATE QUESTIONS BASED STRICTLY ON THE TOPIC REFINEMENT: "${topic}" WITHIN THE CONTEXT OF THE COURSE: "${courseInfo.title}".
3. FORMATTING:
   - Ensure questions match the requested ${difficulty} level.
   - All IDs must be unique strings.
   - bloomsTaxonomy must be one of: Remembering, Understanding, Applying, Analyzing, Evaluating, Creating.`;

    const userMessage = contextText 
        ? `KNOWLEDGE SOURCE MATERIALS:\n${contextText}\n\nUSER TOPIC REFINEMENT: ${topic}\n\nPlease generate a quiz of ${count} items. Ensure all items are grounded strictly in the source materials and relevant to the user refinement.` 
        : `USER TOPIC REFINEMENT: ${topic}\n\nPlease generate a quiz of ${count} items for a course on ${courseInfo.title}.`;

    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ["multiple-choice", "short-answer"] },
                                question: { type: Type.STRING },
                                options: { 
                                    type: Type.ARRAY, 
                                    items: { type: Type.STRING },
                                    description: "Provide 4 options for multiple-choice questions."
                                },
                                correctAnswer: { type: Type.STRING },
                                points: { type: Type.NUMBER },
                                bloomsTaxonomy: { type: Type.STRING }
                            },
                            required: ["id", "type", "question", "correctAnswer", "points"]
                        }
                    }
                }
            }
        },
        contents: userMessage,
    });
    try {
        const data = JSON.parse(res.text || '{"questions":[]}');
        const questions = data.questions || [];
        return questions.map((q: any) => ({ ...q, id: q.id || crypto.randomUUID() }));
    } catch { return []; }
};

export const sendMessageAndGetStream = async (history: any, msg: string) => {
    const chat = ai.chats.create({ model: 'gemini-3-flash-preview', history: history.map((m: any) => ({ role: m.role, parts: [{ text: m.text }] })) });
    return chat.sendMessageStream({ message: msg });
};

export const getChatbotResponse = async (history: any, msg: string, mode: string) => {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: msg });
    return { text: res.text, sources: [] };
};
