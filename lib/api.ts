import { User, Course, Quiz, Question, QuizAttempt, QuizAssignment, CourseMaterial, ChatMessage as AppChatMessage } from '../types';
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { logActivity } from './activityLog';

// --- MOCK DATABASE (LocalStorage) ---
const DB = {
    users: 'skillforge_users',
    courses: 'skillforge_courses',
    quizzes: 'skillforge_quizzes',
    attempts: 'skillforge_attempts',
    assignments: 'skillforge_assignments',
    viewedMaterials: 'skillforge_viewed_materials',
};

const FAKE_DELAY = 500;

// Helper to simulate network delay
const delay = <T,>(data: T): Promise<T> => 
    new Promise(resolve => setTimeout(() => resolve(data), FAKE_DELAY));

// --- GEMINI API SETUP ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- DATA INITIALIZATION ---
export const initMockData = () => {
    if (localStorage.getItem(DB.users)) return;

    const now = new Date().toISOString();
    const adminId = 'user-admin-01';
    const mentorId = 'user-mentor-01'; // Keep as mentorId internally
    const studentId = 'user-student-01';
    
    const users: User[] = [
        { id: adminId, email: 'admin@skillforge.com', name: 'System Administrator', role: 'admin', createdAt: now },
        { id: mentorId, email: 'instructor@skillforge.com', name: 'Instructor Smith', role: 'mentor', createdAt: now },
        { id: studentId, email: 'student@skillforge.com', name: 'Demo Student', role: 'student', createdAt: now },
    ];

    const courseId1 = 'course-js-01';
    const courseId2 = 'course-react-02';
    const courses: Course[] = [
        { 
            id: courseId1, 
            title: 'JavaScript Fundamentals', 
            description: 'Master the basics of JavaScript.', 
            difficulty: 'Beginner', 
            mentorId, 
            instructorName: 'Instructor Smith',
            institutionName: 'SkillForge Academy',
            publishDate: now.split('T')[0],
            language: 'English',
            topics: ['Variables', 'Functions', 'Arrays', 'Objects'], 
            materials: [
                { id: 'mat-js-1', type: 'video', title: 'JavaScript Crash Course', url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c' },
                { id: 'mat-js-2', type: 'pdf', title: 'MDN JavaScript Guide (PDF)', url: 'mock-mdn-guide.pdf' },
            ], 
            createdAt: now 
        },
        { 
            id: courseId2, 
            title: 'React Advanced Patterns', 
            description: 'Learn advanced patterns for building scalable React apps.', 
            difficulty: 'Advanced', 
            mentorId, 
            instructorName: 'Instructor Smith',
            institutionName: 'SkillForge Academy',
            publishDate: now.split('T')[0],
            language: 'English',
            topics: ['Hooks', 'Context API', 'Performance', 'Render Props'], 
            materials: [], 
            createdAt: now 
        },
    ];

    const quizId1 = 'quiz-js-vars-01';
    const quizzes: Quiz[] = [
        {
            id: quizId1,
            courseId: courseId1,
            title: 'JavaScript Variables Quiz',
            difficulty: 'Beginner',
            createdBy: mentorId,
            createdAt: now,
            duration: 5,
            questions: [
                { id: 'q1', type: 'multiple-choice', question: 'Which keyword is used to declare a variable that cannot be reassigned?', options: ['let', 'var', 'const', 'static'], correctAnswer: 'const', points: 10 },
                { id: 'q2', type: 'short-answer', question: 'What is the data type of `null` in JavaScript?', correctAnswer: 'object', points: 10 },
            ],
        },
    ];
    
    const assignments: QuizAssignment[] = [
        { id: 'assign-initial-01', quizId: quizId1, studentId: studentId, assignedAt: now }
    ];

    localStorage.setItem(DB.users, JSON.stringify(users));
    localStorage.setItem(DB.courses, JSON.stringify(courses));
    localStorage.setItem(DB.quizzes, JSON.stringify(quizzes));
    localStorage.setItem(DB.attempts, JSON.stringify([]));
    localStorage.setItem(DB.assignments, JSON.stringify(assignments));
    localStorage.setItem(DB.viewedMaterials, JSON.stringify({})); // Changed to object for student-specific tracking


    // Mock passwords (in a real app, this would be hashed and stored securely)
    localStorage.setItem('user_passwords', JSON.stringify({
        'admin@skillforge.com': 'admin123',
        'instructor@skillforge.com': 'instructor123',
        'student@skillforge.com': 'student123',
    }));
};

// --- AUTHENTICATION ---
export const login = async (email: string, pass: string) => {
    const passwords = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    if (passwords[email] !== pass) {
        await delay(null);
        throw new Error('Invalid credentials');
    }
    const users: User[] = JSON.parse(localStorage.getItem(DB.users) || '[]');
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('User not found');

    logActivity('user_login', `${user.name} signed in.`, { userId: user.id, role: user.role });

    // "JWT" is the user object itself for this mock API
    const token = btoa(JSON.stringify(user));
    return delay({ token, user });
};

export const register = async (userData: Omit<User, 'id' | 'createdAt'>, pass: string) => {
    // Reusing createUser logic for public registration
    return createUser(userData, pass);
};

export const getProfile = async (): Promise<User> => {
    const token = localStorage.getItem('skillforge_token');
    if (!token) throw new Error('Not authenticated');
    try {
        const user: User = JSON.parse(atob(token));
        return delay(user);
    } catch (e) {
        throw new Error('Invalid token');
    }
};

// --- GENERIC CRUD ---
const getAll = async <T,>(key: string): Promise<T[]> => {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return delay(data as T[]);
};
const getById = async <T extends { id: string },>(key: string, id: string): Promise<T | null> => {
    const items = await getAll<T>(key);
    return delay(items.find(item => item.id === id) || null);
};
const create = async <T extends { id: string },>(key: string, item: T): Promise<T> => {
    try {
        const items = await getAll<T>(key);
        items.push(item);
        localStorage.setItem(key, JSON.stringify(items));
        return delay(item);
    } catch (e) {
        console.error(`Failed to create item in ${key}:`, e);
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            throw new Error("Could not save the data. Your browser's local storage is full. Please clear some space and try again.");
        }
        throw new Error("An unexpected local storage error occurred. Please ensure your browser supports local storage.");
    }
};
const update = async <T extends { id: string },>(key: string, updatedItem: T): Promise<T> => {
    let items = await getAll<T>(key);
    items = items.map(item => item.id === updatedItem.id ? updatedItem : item);
    localStorage.setItem(key, JSON.stringify(items));
    return delay(updatedItem);
};
const remove = async <T extends { id: string },>(key: string, id: string): Promise<null> => {
    let items = await getAll<T>(key);
    items = items.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(items));
    return delay(null);
}

// --- Progress Tracking (Student Specific) ---
export const getAllViewedMaterials = async (): Promise<{ [studentId: string]: string[] }> => {
    const data = JSON.parse(localStorage.getItem(DB.viewedMaterials) || '{}');
    return delay(data);
};

export const getViewedMaterialsForStudent = async (studentId: string): Promise<string[]> => {
    const allViewed = await getAllViewedMaterials();
    return delay(allViewed[studentId] || []);
};

export const markMaterialAsViewed = async (studentId: string, materialId: string): Promise<void> => {
    const allViewed = await getAllViewedMaterials();
    const studentViewed = allViewed[studentId] || [];
    if (!studentViewed.includes(materialId)) {
        allViewed[studentId] = [...studentViewed, materialId];
        localStorage.setItem(DB.viewedMaterials, JSON.stringify(allViewed));
    }
    return delay(undefined);
};

// --- DOMAIN-SPECIFIC API ---

// Users
export const getUsers = () => getAll<User>(DB.users);

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>, pass: string) => {
    const users = await getAll<User>(DB.users);
    if (users.some(u => u.email === userData.email)) {
        throw new Error('User with this email already exists.');
    }

    const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };

    await create<User>(DB.users, newUser);

    const passwords = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    passwords[newUser.email] = pass;
    localStorage.setItem('user_passwords', JSON.stringify(passwords));

    logActivity('user_create', `New user created: ${newUser.name} (${newUser.role})`, { userId: newUser.id, role: newUser.role });

    return delay(newUser);
};

export const updateUser = (updatedUser: User) => update<User>(DB.users, updatedUser);

export const deleteUser = async (userId: string) => {
    let users = await getAll<User>(DB.users);
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) throw new Error('User not found');

    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(DB.users, JSON.stringify(updatedUsers));

    const passwords = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    delete passwords[userToDelete.email];
    localStorage.setItem('user_passwords', JSON.stringify(passwords));
    
    logActivity('user_delete', `User account for ${userToDelete.name} was deleted.`, { userId: userToDelete.id });

    return delay(null);
};

export const resetPassword = async (userId: string, newPassword: string) => {
    const users = await getAll<User>(DB.users);
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) {
        throw new Error('User not found.');
    }

    const passwords = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    passwords[userToUpdate.email] = newPassword;
    localStorage.setItem('user_passwords', JSON.stringify(passwords));

    return delay({ success: true });
};


// Courses
export const getCourses = () => getAll<Course>(DB.courses);
export const getCourseById = (courseId: string) => getById<Course>(DB.courses, courseId);
export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'topics'>) => {
    const newCourse: Course = {
        ...courseData,
        id: `course-${Date.now()}`,
        createdAt: new Date().toISOString(),
        topics: [], // Topics are not added at creation from this form
    };

    logActivity('course_create', `Course "${newCourse.title}" published by ${newCourse.instructorName}.`, { courseId: newCourse.id, mentorId: newCourse.mentorId });
    return create(DB.courses, newCourse);
};
export const updateCourse = (updatedCourse: Course) => update<Course>(DB.courses, updatedCourse);
export const deleteCourse = async (courseId: string) => {
    const course = await getCourseById(courseId);
    if(course) {
        logActivity('course_delete', `Course "${course.title}" was deleted.`, { courseId });
    }
    return remove(DB.courses, courseId)
};

// Quizzes
export const getQuizzes = () => getAll<Quiz>(DB.quizzes);
export const getQuizzesByCourse = async (courseId: string) => {
    const allQuizzes = await getAll<Quiz>(DB.quizzes);
    return delay(allQuizzes.filter(q => q.courseId === courseId));
};
export const getQuizById = (quizId: string) => getById<Quiz>(DB.quizzes, quizId);
export const createQuiz = async (quizData: Omit<Quiz, 'id' | 'createdAt'>) => {
    const newQuiz: Quiz = {
        ...quizData,
        id: `quiz-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    const course = await getCourseById(quizData.courseId);
    if(course) {
        logActivity('quiz_create', `A new quiz "${newQuiz.title}" was created for the course "${course.title}".`, { quizId: newQuiz.id, courseId: course.id });
    }
    return create(DB.quizzes, newQuiz);
};
export const updateQuiz = (updatedQuiz: Quiz) => update<Quiz>(DB.quizzes, updatedQuiz);
export const deleteQuiz = async (quizId: string) => {
    // Log before deleting to get quiz info
    const quiz = await getQuizById(quizId);
    if (quiz) {
        logActivity('quiz_delete', `Quiz "${quiz.title}" was deleted.`, { quizId: quiz.id, courseId: quiz.courseId });
    }

    // Remove associated attempts
    let attempts = await getAll<QuizAttempt>(DB.attempts);
    attempts = attempts.filter(a => a.quizId !== quizId);
    localStorage.setItem(DB.attempts, JSON.stringify(attempts));

    // Remove associated assignments
    let assignments = await getAll<QuizAssignment>(DB.assignments);
    assignments = assignments.filter(a => a.quizId !== quizId);
    localStorage.setItem(DB.assignments, JSON.stringify(assignments));

    // Remove the quiz itself
    return remove(DB.quizzes, quizId);
};


// Quiz Attempts
export const submitQuizAttempt = async (attemptData: Omit<QuizAttempt, 'id' | 'submittedAt'>) => {
    const newAttempt: QuizAttempt = {
        ...attemptData,
        id: `attempt-${Date.now()}`,
        submittedAt: new Date().toISOString(),
    };
    
    // Fix: Corrected array destructuring from a promise that returns two elements.
    const [user, data] = await Promise.all([
        getById<User>(DB.users, newAttempt.studentId),
        getQuizById(newAttempt.quizId).then(q => q ? getById<Course>(DB.courses, q.courseId).then(c => ({ quiz: q, course: c })) : { quiz: null, course: null })
    ]);
    
    const { quiz, course } = data;
    
    if (user && quiz && course) {
         logActivity('quiz_submit', `${user.name} submitted the quiz "${quiz.title}" for the course "${course.title}".`, {
            studentId: newAttempt.studentId,
            quizId: newAttempt.quizId,
            score: newAttempt.score,
            totalPoints: newAttempt.totalPoints
        });
    }

    return create(DB.attempts, newAttempt);
};
export const getStudentProgress = async (studentId: string) => {
    const allAttempts = await getAll<QuizAttempt>(DB.attempts);
    return delay(allAttempts.filter(a => a.studentId === studentId));
};
export const getAllAttempts = () => getAll<QuizAttempt>(DB.attempts);
export const updateQuizAttempt = (updatedAttempt: QuizAttempt) => update<QuizAttempt>(DB.attempts, updatedAttempt);

// --- Quiz Assignments ---
export const createQuizAssignments = async (quizId: string, studentIds: string[], dueDate?: string): Promise<QuizAssignment[]> => {
    const allAssignments = await getAll<QuizAssignment>(DB.assignments);
    const newAssignments: QuizAssignment[] = [];

    studentIds.forEach(studentId => {
        // Prevent duplicate assignments
        const exists = allAssignments.some(a => a.quizId === quizId && a.studentId === studentId);
        if (!exists) {
            const newAssignment: QuizAssignment = {
                id: `assign-${Date.now()}-${studentId.slice(-4)}`,
                quizId,
                studentId,
                assignedAt: new Date().toISOString(),
                dueDate,
            };
            newAssignments.push(newAssignment);
        }
    });

    if (newAssignments.length > 0) {
        const updatedAssignments = [...allAssignments, ...newAssignments];
        localStorage.setItem(DB.assignments, JSON.stringify(updatedAssignments));
    }
    
    return delay(newAssignments);
};

export const getAssignedQuizzesForStudent = async (studentId: string) => {
    const allAssignments = await getAll<QuizAssignment>(DB.assignments);
    const studentAssignments = allAssignments.filter(a => a.studentId === studentId);
    const assignmentsMap = new Map(studentAssignments.map(a => [a.quizId, a]));
    const assignedQuizIds = Array.from(assignmentsMap.keys());

    const allQuizzes = await getQuizzes();
    const studentQuizzes = allQuizzes.filter(q => assignedQuizIds.includes(q.id));

    const courses = await getCourses();
    const coursesMap = courses.reduce((acc, course) => {
        acc[course.id] = course.title;
        return acc;
    }, {} as { [id: string]: string });

    return delay(studentQuizzes.map(quiz => {
        const assignment = assignmentsMap.get(quiz.id);
        return {
            ...quiz,
            courseTitle: coursesMap[quiz.courseId] || 'Unknown Course',
            dueDate: assignment?.dueDate,
        };
    }));
};

export const getAssignedCoursesForStudent = async (studentId: string): Promise<Course[]> => {
    const assignedQuizzes = await getAssignedQuizzesForStudent(studentId);
    const courseIds = [...new Set(assignedQuizzes.map(quiz => quiz.courseId))];
    const allCourses = await getCourses();
    const assignedCourses = allCourses.filter(course => courseIds.includes(course.id));
    return delay(assignedCourses);
};


// --- AI QUIZ GENERATION ---
const getGeminiError = (error: unknown, context: string): Error => {
    console.error(`Error during Gemini API call (${context}):`, error);
    let message = `An unexpected error occurred while ${context}. Please try again.`;

    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('api key')) {
            message = `API Key Invalid or Missing. Please ensure your Gemini API key is configured correctly and has the necessary permissions.`;
        } else if (errorMessage.includes('quota')) {
            message = `You have exceeded your API quota for today. Please check your usage limits and try again later.`;
        } else if (errorMessage.includes('safety')) {
            message = `Your request was blocked for safety reasons. Please adjust your input topic or learning objectives and try again.`;
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            message = `A network error occurred while contacting the AI service. Please check your internet connection.`;
        } else if (errorMessage.includes('400')) {
             message = `The AI model could not understand the request. Please check if your topics are clear and try again.`;
        } else if (errorMessage.includes('500') || errorMessage.includes('503')) {
            message = `The AI service is temporarily unavailable. Please try again in a few moments.`;
        } else {
            message = `The AI service failed to ${context}. If this persists, the service may be down.`;
        }
    }
    
    return new Error(message);
};

export const generateQuizQuestions = async (topics: string, learningObjectives: string, difficulty: string, numQuestions: number, questionType: 'mixed' | 'multiple-choice' = 'mixed'): Promise<Question[]> => {
    
    let prompt: string;
    let responseSchema: any;

    let basePrompt = `Generate ${numQuestions} quiz questions about the topic(s): "${topics}". The difficulty should be "${difficulty}".`;
    if (learningObjectives) {
        basePrompt += ` The questions should assess these learning objectives: "${learningObjectives}".`;
    }

    if (questionType === 'multiple-choice') {
        prompt = `${basePrompt} All questions must be multiple-choice. For each question, provide 4 options. Ensure the response strictly follows the provided JSON schema.`;
        
        responseSchema = {
            type: Type.OBJECT,
            properties: {
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['multiple-choice'], description: 'The type of question.' },
                            question: { type: Type.STRING, description: 'The question text.' },
                            options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'An array of 4 possible answers for the multiple-choice question.'
                            },
                            correctAnswer: { type: Type.STRING, description: 'The correct answer.' },
                            points: { type: Type.INTEGER, description: 'Points awarded for a correct answer, typically 10.' },
                        },
                        required: ['type', 'question', 'options', 'correctAnswer', 'points'],
                    }
                }
            }
        };

    } else { // 'mixed'
        prompt = `${basePrompt} Include a mix of multiple-choice and short-answer questions. For multiple-choice, provide 4 options. Ensure the response strictly follows the provided JSON schema.`;

        responseSchema = {
            type: Type.OBJECT,
            properties: {
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['multiple-choice', 'short-answer'], description: 'The type of question.' },
                            question: { type: Type.STRING, description: 'The question text.' },
                            options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'An array of 4 possible answers for multiple-choice questions. Omit for short-answer.'
                            },
                            correctAnswer: { type: Type.STRING, description: 'The correct answer.' },
                            points: { type: Type.INTEGER, description: 'Points awarded for a correct answer, typically 10.' },
                        },
                        required: ['type', 'question', 'correctAnswer', 'points'],
                    }
                }
            }
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        // Add IDs to the questions
        return result.questions.map((q: Omit<Question, 'id'>, index: number) => ({
            ...q,
            id: `gen-q-${Date.now()}-${index}`,
        }));

    } catch (error) {
        throw getGeminiError(error, 'generating quiz questions');
    }
};

export const improveQuestionWithAI = async (question: Question, quiz: Quiz): Promise<Partial<Question>> => {
    const prompt = `You are an expert curriculum developer. Your task is to improve a quiz question.
The quiz difficulty is "${quiz.difficulty}". The quiz title is "${quiz.title}".

Here is the current question:
Type: ${question.type}
Question: "${question.question}"
${question.type === 'multiple-choice' ? `Options: ${question.options?.join(', ')}` : ''}
Correct Answer: "${question.correctAnswer}"

Improve the question for clarity, accuracy, and effectiveness based on the context. If it is multiple choice, also improve the options to be more effective distractors. The new options should not change the correct answer.

Return the response as a JSON object with the following keys: "question" (string), "options" (array of strings, if multiple-choice), "correctAnswer" (string). Ensure the improved response strictly follows the provided JSON schema.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING, description: 'The improved question text.' },
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'The improved array of possible answers. Omit for short-answer.'
            },
            correctAnswer: { type: Type.STRING, description: 'The correct answer, which should remain the same.' },
        },
        required: ['question', 'correctAnswer'],
    };


    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        return {
            question: result.question,
            options: result.options || question.options,
            correctAnswer: result.correctAnswer,
        };

    } catch (error) {
        throw getGeminiError(error, 'improving the question');
    }
};

export const generateAlternativeOptionsWithAI = async (question: Question): Promise<string[]> => {
    if (question.type !== 'multiple-choice' || !question.options) {
        throw new Error("Can only generate options for multiple-choice questions.");
    }
    const prompt = `For the multiple-choice question: "${question.question}", the correct answer is "${question.correctAnswer}".
Generate three plausible but incorrect alternative options (distractors).
Return the response as a JSON object with a key "options" which is an array of three strings.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        options: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'An array of three incorrect options.'
                        }
                    },
                    required: ['options'],
                },
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        // Combine the new distractors with the correct answer
        const newOptions = [...result.options, question.correctAnswer];
        // Shuffle the options so the correct answer isn't always last
        return newOptions.sort(() => Math.random() - 0.5);

    } catch (error) {
        throw getGeminiError(error, 'generating alternative options');
    }
};


// --- AI QUESTION FEEDBACK ---
export const getAIFeedbackForQuestion = async (question: Question): Promise<string> => {
    let prompt = `For the following quiz question, provide a concise explanation for the correct answer. If it's a multiple-choice question, briefly explain why the other options are incorrect.

Question: "${question.question}"
`;

    if (question.type === 'multiple-choice' && question.options) {
        prompt += `Options:\n`;
        question.options.forEach(opt => {
            prompt += `- ${opt}\n`;
        });
    }

    prompt += `Correct Answer: "${question.correctAnswer}"

Explanation:`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        throw getGeminiError(error, 'generating feedback for a question');
    }
};


// --- AI TOPIC SUGGESTION ---
export const generateQuizTopics = async (courseTitle: string, courseDescription: string, courseMaterials: CourseMaterial[]): Promise<string[]> => {
    const materialTitles = courseMaterials.map(m => m.title).join(', ');
    const prompt = `Based on the course titled "${courseTitle}", described as "${courseDescription}", with materials like "${materialTitles}", suggest 5-7 concise and relevant topics for a quiz. The topics should be specific and suitable for quiz questions. Return the topics as a JSON array of strings under a "topics" key.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topics: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'A list of suggested quiz topics.'
                        }
                    },
                    required: ['topics'],
                },
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        return result.topics || [];

    } catch (error) {
        throw getGeminiError(error, 'suggesting quiz topics');
    }
};


// --- AI ADAPTIVE LEARNING ---
export const getLearningSuggestion = async (
    attempt: QuizAttempt, 
    quiz: Quiz, 
    course: Course, 
    allCourses: Course[]
): Promise<string> => {
    const percentage = Math.round((attempt.score / attempt.totalPoints) * 100);
    let prompt: string;

    if (percentage < 60) { // Poor score
        const incorrectQuestions = quiz.questions.filter(q => 
            attempt.answers[q.id]?.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim()
        );

        if (incorrectQuestions.length === 0 && course.materials.length === 0) {
             prompt = `A student scored ${percentage}% on the "${quiz.title}" quiz for the course "${course.title}". This is a low score. Provide a short, encouraging learning suggestion to review the course materials related to the quiz topic and retry. Keep the response to 2-3 sentences.`;
        } else {
            const incorrectTopics = incorrectQuestions.map(q => q.question).join('\n- ');
            const availableMaterials = course.materials.length > 0
                ? course.materials.map(m => `- "${m.title}" (${m.type})`).join('\n')
                : "No specific materials listed. Suggest a general review of the topic.";

            prompt = `A student scored ${percentage}% on the "${quiz.title}" quiz for the course "${course.title}". 
They answered the following questions incorrectly:
- ${incorrectTopics}

The available course materials are:
${availableMaterials}

Based on the incorrectly answered questions, provide a short, encouraging learning suggestion. If there are materials, recommend one or two *specific* course materials from the list that would be most helpful for the student to review. Be very specific. Keep the response to 2-3 sentences.`;
        }
    } else { // Good or okay score
        const otherCourses = allCourses.filter(c => c.id !== course.id && c.mentorId === course.mentorId); // Suggest other courses by the same instructor
        
        let courseSuggestionPrompt = '';
        if (otherCourses.length > 0) {
            const availableNextCourses = otherCourses.map(c => `- "${c.title}" (Difficulty: ${c.difficulty})`).join('\n');
            courseSuggestionPrompt = `
You could also consider one of these next courses:
${availableNextCourses}`;
        }

        prompt = `A student scored ${percentage}% on the "${quiz.title}" quiz for the course "${course.title}". This is a good score. 
Congratulate them and recommend they start the next topic in the course. ${courseSuggestionPrompt}
If suggesting another course, suggest one that is of similar or higher difficulty.
Keep the response short, encouraging, and to 2-3 sentences.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating learning suggestion:", error);
        if (percentage < 60) {
            return "Good effort! It looks like there are some areas to review. Take some time to go over the course materials for this topic, and you'll ace it next time!";
        }
        return "Excellent work on that quiz! You're making great progress. Keep up the momentum and move on to the next topic.";
    }
};


// --- AI CHATBOT ---
const toGeminiHistory = (messages: AppChatMessage[]) => {
  return messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
};

export const sendMessageAndGetStream = async (history: AppChatMessage[], message: string) => {
    const chat: Chat = ai.chats.create({
        model: 'gemini-flash-lite-latest',
        history: toGeminiHistory(history),
    });
    const result = await chat.sendMessageStream({ message });
    return result;
};

export const getChatbotResponse = async (history: AppChatMessage[], message: string, mode: 'balanced' | 'smart' | 'search') => {
  let modelName = 'gemini-2.5-flash';
  const config: any = {};
  
  if (mode === 'smart') {
    modelName = 'gemini-2.5-pro';
    config.thinkingConfig = { thinkingBudget: 32768 };
  } else if (mode === 'search') {
    modelName = 'gemini-2.5-flash';
    config.tools = [{ googleSearch: {} }];
  }
  
  const contents = [...toGeminiHistory(history), { role: 'user', parts: [{ text: message }] }];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config,
    });
    
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
      }));
      
    return { text, sources };
  } catch (error) {
    console.error(`Error with Gemini in ${mode} mode:`, error);
    throw new Error("Failed to get a response from the AI assistant. The service may be unavailable.");
  }
};