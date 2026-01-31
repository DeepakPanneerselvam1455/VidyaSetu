
import { User, Course, Quiz, Question, QuizAttempt, ForumCategory, ForumThread, ForumPost, TutoringSession, MentorshipRequest, ChatMessage as AppChatMessage } from '../types';
import { GoogleGenAI, Chat, Type } from "@google/genai";

const API_BASE = 'http://localhost:5000/api';

// --- DEMO MODE STATE ---
let useDemoMode = false;
export const isDemoMode = () => useDemoMode;

// --- MOCK PERSISTENCE LAYER (For Preview Environment) ---
class DemoBackend {
    private get(key: string) {
        const data = localStorage.getItem(`skillforge_demo_${key}`);
        return data ? JSON.parse(data) : null;
    }
    private set(key: string, data: any) {
        localStorage.setItem(`skillforge_demo_${key}`, JSON.stringify(data));
    }

    private init() {
        if (!this.get('users')) {
            this.set('users', [
                { id: 's1', name: 'Alex Student', email: 'student@skillforge.com', role: 'student', password: 'student123', createdAt: new Date().toISOString(), accountStatus: 'ENABLED' },
                { id: 'm1', name: 'Dr. Sarah Mentor', email: 'instructor@skillforge.com', role: 'mentor', password: 'instructor123', createdAt: new Date().toISOString(), accountStatus: 'ENABLED', expertise: ['React', 'Node.js'] },
                { id: 'a1', name: 'Admin User', email: 'admin@skillforge.com', role: 'admin', password: 'admin123', createdAt: new Date().toISOString(), accountStatus: 'ENABLED' }
            ]);
            this.set('courses', [
                { id: 'c1', title: 'Modern React Development', description: 'Master React from scratch with hooks and performance optimization.', difficulty: 'Beginner', mentorId: 'm1', instructorName: 'Dr. Sarah Mentor', topics: ['React', 'JSX', 'Hooks'], materials: [], createdAt: new Date().toISOString() }
            ]);
            this.set('quizzes', []);
            this.set('attempts', []);
            this.set('forum_cats', [
                { id: 'cat1', name: 'General Support', description: 'Get help with the platform', icon: 'HelpCircle' },
                { id: 'cat2', name: 'React Development', description: 'Course specific discussions', icon: 'Code' }
            ]);
            this.set('forum_threads', []);
            this.set('sessions', []);
            this.set('material_progress', {});
        }
    }

    constructor() { this.init(); }

    async login(email: string, pass: string) {
        const users = this.get('users');
        const user = users.find((u: any) => u.email === email && u.password === pass);
        if (!user) throw new Error("Invalid credentials in demo mode.");
        return user;
    }

    async getData(key: string) { return this.get(key) || []; }
    async addData(key: string, item: any) {
        const items = this.get(key) || [];
        const newItem = { ...item, id: item.id || `demo-${Date.now()}`, createdAt: new Date().toISOString() };
        this.set(key, [...items, newItem]);
        return newItem;
    }
    async updateData(key: string, id: string, updates: any) {
        const items = this.get(key) || [];
        const updated = items.map((i: any) => i.id === id ? { ...i, ...updates } : i);
        this.set(key, updated);
        return updates;
    }
}

const demo = new DemoBackend();

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
    if (useDemoMode) return null; // Logic handled in the wrapper

    const config = {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
        credentials: 'include' as RequestCredentials,
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'API Request Failed');
        }
        return response.json();
    } catch (error: any) {
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            console.warn("Backend server not reached. Switching to Local Demo Mode.");
            useDemoMode = true;
            window.dispatchEvent(new CustomEvent('skillforge_demo_mode_active'));
            return null; // Signals the caller to try demo logic
        }
        throw error;
    }
};

// --- HYBRID API WRAPPER ---
export const executeHybrid = async (apiCall: () => Promise<any>, demoCall: () => Promise<any>) => {
    if (useDemoMode) return demoCall();
    try {
        const result = await apiCall();
        if (result === null && useDemoMode) return demoCall();
        return result;
    } catch (err) {
        if (useDemoMode) return demoCall();
        throw err;
    }
};

// --- AUTH ---
export const login = async (email: string, pass: string) => {
    return executeHybrid(
        () => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pass }) }).then(data => data ? { user: data } : null),
        async () => { 
            const user = await demo.login(email, pass);
            return { user };
        }
    );
};
export const getProfile = () => executeHybrid(() => fetchAPI('/auth/me'), async () => null); // Force login in demo if session empty
export const logout = () => fetchAPI('/auth/logout', { method: 'POST' });
export const initMockData = async () => {}; 

// --- USERS ---
export const getUsers = () => executeHybrid(() => fetchAPI('/users'), () => demo.getData('users'));
export const register = (userData: any, pass: string) => executeHybrid(
    () => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify({ ...userData, password: pass }) }),
    () => demo.addData('users', { ...userData, password: pass })
);
export const createUser = (data: any, pass: string) => register(data, pass);
export const updateUser = (data: User) => executeHybrid(
    () => fetchAPI(`/users/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    () => demo.updateData('users', data.id, data)
);
export const toggleUserStatus = (userId: string, adminId: string, status: string, reason?: string) => executeHybrid(
    () => fetchAPI(`/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason, adminId }) }),
    () => demo.updateData('users', userId, { accountStatus: status })
);
export const deleteUser = (id: string) => executeHybrid(
    () => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
    async () => {
        const users = await demo.getData('users');
        localStorage.setItem('skillforge_demo_users', JSON.stringify(users.filter((u: any) => u.id !== id)));
    }
);
export const resetPassword = (id: string, pass: string) => executeHybrid(
    () => fetchAPI(`/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password: pass }) }),
    () => demo.updateData('users', id, { password: pass })
);

// --- COURSES ---
export const getCourses = () => executeHybrid(() => fetchAPI('/courses'), () => demo.getData('courses'));
export const getCourseById = (id: string) => executeHybrid(
    () => fetchAPI(`/courses/${id}`),
    async () => (await demo.getData('courses')).find((c: any) => c.id === id)
);
export const createCourse = (data: any) => executeHybrid(() => fetchAPI('/courses', { method: 'POST', body: JSON.stringify(data) }), () => demo.addData('courses', data));
export const updateCourse = (data: any) => executeHybrid(() => fetchAPI(`/courses/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), () => demo.updateData('courses', data.id, data));
export const deleteCourse = (id: string) => executeHybrid(() => fetchAPI(`/courses/${id}`, { method: 'DELETE' }), async () => {
    const items = await demo.getData('courses');
    localStorage.setItem('skillforge_demo_courses', JSON.stringify(items.filter((i: any) => i.id !== id)));
});

// --- PROGRESS ---
export const markMaterialAsViewed = (userId: string, materialId: string) => executeHybrid(
    () => fetchAPI('/progress/material', { method: 'POST', body: JSON.stringify({ materialId }) }),
    async () => {
        const prog = demo.getData('material_progress') as any;
        prog[userId] = [...(prog[userId] || []), materialId];
        localStorage.setItem('skillforge_demo_material_progress', JSON.stringify(prog));
    }
);
export const getViewedMaterialsForStudent = (userId: string) => executeHybrid(
    () => fetchAPI('/progress/materials'),
    async () => (await demo.getData('material_progress'))[userId] || []
);
export const getAllViewedMaterials = () => executeHybrid(() => fetchAPI('/progress/all'), () => demo.getData('material_progress'));

// --- QUIZZES ---
export const getQuizzes = () => executeHybrid(() => fetchAPI('/quizzes'), () => demo.getData('quizzes'));
export const getQuizzesByCourse = (courseId: string) => executeHybrid(
    () => fetchAPI(`/quizzes?courseId=${courseId}`),
    async () => (await demo.getData('quizzes')).filter((q: any) => q.courseId === courseId)
);
export const getQuizById = (id: string) => executeHybrid(
    () => fetchAPI(`/quizzes/${id}`),
    async () => (await demo.getData('quizzes')).find((q: any) => q.id === id)
);
export const createQuiz = (data: any) => executeHybrid(() => fetchAPI('/quizzes', { method: 'POST', body: JSON.stringify(data) }), () => demo.addData('quizzes', data));
export const updateQuiz = (data: any) => executeHybrid(() => fetchAPI(`/quizzes/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), () => demo.updateData('quizzes', data.id, data));
export const deleteQuiz = (id: string) => executeHybrid(() => fetchAPI(`/quizzes/${id}`, { method: 'DELETE' }), async () => {
    const items = await demo.getData('quizzes');
    localStorage.setItem('skillforge_demo_quizzes', JSON.stringify(items.filter((i: any) => i.id !== id)));
});

export const submitQuizAttempt = (data: any) => executeHybrid(() => fetchAPI('/quiz/attempt', { method: 'POST', body: JSON.stringify(data) }), () => demo.addData('attempts', data));
export const updateQuizAttempt = (data: any) => executeHybrid(() => fetchAPI(`/quiz/attempt/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), () => demo.updateData('attempts', data.id, data));
export const getStudentProgress = (userId: string) => executeHybrid(
    () => fetchAPI(`/quiz/attempts?userId=${userId}`),
    async () => (await demo.getData('attempts')).filter((a: any) => a.studentId === userId)
);
export const getAllAttempts = () => executeHybrid(() => fetchAPI('/quiz/attempts'), () => demo.getData('attempts'));
export const createQuizAssignments = (quizId: string, studentIds: string[], dueDate?: string) => executeHybrid(
    () => fetchAPI('/quiz/assignments', { method: 'POST', body: JSON.stringify({ quizId, studentIds, dueDate }) }),
    () => demo.addData('assignments', { quizId, studentIds, dueDate })
);
export const getAssignedQuizzesForStudent = (userId: string) => executeHybrid(
    () => fetchAPI(`/quiz/assigned?userId=${userId}`),
    () => demo.getData('quizzes') // Simple demo logic: all quizzes are assigned
);
export const getAssignedCoursesForStudent = (userId: string) => getCourses();

// --- FORUMS ---
export const getForumCategories = () => executeHybrid(() => fetchAPI('/forum/categories'), () => demo.getData('forum_cats'));
export const getForumThreads = () => executeHybrid(() => fetchAPI('/forum/threads'), () => demo.getData('forum_threads'));
export const getForumThreadById = (id: string) => executeHybrid(
    () => fetchAPI(`/forum/threads/${id}`),
    async () => (await demo.getData('forum_threads')).find((t: any) => t.id === id)
);
export const createForumThread = (data: any) => executeHybrid(() => fetchAPI('/forum/threads', { method: 'POST', body: JSON.stringify(data) }), () => demo.addData('forum_threads', data));
export const getForumPosts = (threadId: string) => executeHybrid(
    () => fetchAPI(`/forum/threads/${threadId}/posts`),
    async () => (await demo.getData('forum_posts')).filter((p: any) => p.threadId === threadId)
);
export const createForumPost = (data: any) => executeHybrid(() => fetchAPI('/forum/posts', { method: 'POST', body: JSON.stringify(data) }), () => demo.addData('forum_posts', data));
export const toggleThreadVote = (id: string, userId: string) => executeHybrid(() => fetchAPI(`/forum/threads/${id}/vote`, { method: 'POST' }), async () => {});

// --- MENTORSHIP & TUTORING ---
export const getMentors = async () => (await getUsers()).filter((u: User) => u.role === 'mentor');
export const getMentorshipRequests = (userId: string, role: string) => executeHybrid(() => fetchAPI('/mentorship/requests'), () => demo.getData('mentorship_reqs'));
export const createMentorshipRequest = (data: any) => executeHybrid(() => fetchAPI('/mentorship/requests', { method: 'POST', body: JSON.stringify(data) }), () => demo.addData('mentorship_reqs', data));
export const updateMentorshipRequest = (data: any) => executeHybrid(() => fetchAPI(`/mentorship/requests/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), () => demo.updateData('mentorship_reqs', data.id, data));
export const getTutoringSessions = () => executeHybrid(() => fetchAPI('/tutoring/sessions'), () => demo.getData('sessions'));
export const getTutoringSessionById = (id: string) => executeHybrid(
    () => fetchAPI(`/tutoring/sessions/${id}`),
    async () => (await demo.getData('sessions')).find((s: any) => s.id === id)
);
export const createTutoringSession = (data: any) => executeHybrid(() => fetchAPI('/tutoring/sessions', { method: 'POST', body: JSON.stringify(data) }), () => demo.addData('sessions', data));
export const updateTutoringSession = (data: any) => executeHybrid(() => fetchAPI(`/tutoring/sessions/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), () => demo.updateData('sessions', data.id, data));
export const deleteTutoringSession = (id: string) => executeHybrid(() => fetchAPI(`/tutoring/sessions/${id}`, { method: 'DELETE' }), async () => {
    const items = await demo.getData('sessions');
    localStorage.setItem('skillforge_demo_sessions', JSON.stringify(items.filter((i: any) => i.id !== id)));
});
export const getSessionsForUser = (userId: string, role: string) => executeHybrid(
    () => fetchAPI(`/tutoring/sessions?userId=${userId}&role=${role}`),
    async () => (await demo.getData('sessions'))
);

// --- LOGS & SETTINGS ---
export const logActivity = (type: string, title: string, details?: any) => executeHybrid(
    () => fetchAPI('/logs', { method: 'POST', body: JSON.stringify({ type, title, details }) }),
    () => demo.addData('logs', { type, title, details })
);
export const getSystemSettings = (category: string) => executeHybrid(() => fetchAPI(`/settings/${category}`), async () => ({}));
export const updateSystemSettings = (category: string, data: any) => executeHybrid(() => fetchAPI(`/settings/${category}`, { method: 'POST', body: JSON.stringify(data) }), async () => data);

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
            responseMimeType: 'application/json',
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
        
        Suggest:
        1. Improved wording for clarity and higher-education standards.
        2. 3 plausible but incorrect multiple choice distractors.
        3. Identify the Bloom's Taxonomy level (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating).
        4. Assess the difficulty balancing.
        
        Return the result as a JSON object.`,
    });
    try {
        return JSON.parse(res.text || '{}');
    } catch {
        return null;
    }
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
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
        contents: `Generate 3 plausible but incorrect multiple choice options for: "${q.question}" where the correct answer is "${q.correctAnswer}". Return a JSON array of 4 strings total (including the correct one randomly placed).`,
    });
    try {
        return JSON.parse(res.text || '[]');
    } catch {
        return [q.correctAnswer, "Option B", "Option C", "Option D"];
    }
};

export const generateQuizTopics = async (title: string, description: string, materials: any[]) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
        contents: `Based on a course titled "${title}" (${description}), suggest 3 specific topics for a short student quiz.`,
    });
    try {
        return JSON.parse(res.text || '[]');
    } catch {
        return ["React basics", "State management", "Hooks"];
    }
};

export const getLearningSuggestion = async (attempt: QuizAttempt, quiz: Quiz, course: Course, allCourses: Course[]) => {
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Student scored ${attempt.score}/${attempt.totalPoints} on "${quiz.title}". Suggest what they should study next in 1 short sentence based on this performance.`,
    });
    return res.text?.trim() || "Excellent progress! Focus on Advanced Patterns next.";
};

export const generateQuizQuestions = async (topic: string, objectives: string, difficulty: string, count: number, type: string, contextText?: string) => {
    let prompt = `Generate ${count} ${difficulty} level ${type} questions about "${topic}". Objectives: ${objectives}. Each question should be worth 10 points. Ensure questions follow academic standards and map them to Bloom's Taxonomy.`;
    
    if (contextText) {
        prompt = `You are an academic expert. STRATEGICALLY AND STRICTLY use the provided TEXT EXCERPTS as the SINGLE SOURCE OF TRUTH to generate a quiz.
        
        SOURCE CONTENT:
        """
        ${contextText}
        """
        
        PARAMETERS:
        - Target Difficulty: ${difficulty}
        - Number of Questions: ${count}
        - Question Type: ${type}
        - Focus Topic: ${topic}
        
        STRICT RULES:
        1. Derive ALL information strictly from the provided source content. Do not invent facts or use external knowledge.
        2. Questions must align with the provided difficulty.
        3. No repetitive questions.
        4. For Multiple Choice: Provide exactly 4 options. Distractors must be plausible based on the source content.
        5. Map each question to Bloom's Taxonomy.
        
        JSON FORMAT REQUIRED.`;
    }

    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        points: { type: Type.NUMBER },
                        bloomsTaxonomy: { type: Type.STRING },
                        difficultyTag: { type: Type.STRING }
                    },
                    required: ["id", "type", "question", "correctAnswer", "points"]
                }
            }
        },
        contents: prompt,
    });
    try {
        const questions = JSON.parse(res.text || '[]');
        return questions.map((q: any, i: number) => ({ ...q, id: q.id || `gen-${Date.now()}-${i}` }));
    } catch {
        return [];
    }
};

export const sendMessageAndGetStream = async (history: any, msg: string) => {
    const chat = ai.chats.create({ model: 'gemini-3-flash-preview', history: history.map((m: any) => ({ role: m.role, parts: [{ text: m.text }] })) });
    return chat.sendMessageStream({ message: msg });
};

export const getChatbotResponse = async (history: any, msg: string, mode: string) => {
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: msg });
    return { text: res.text, sources: [] };
};
