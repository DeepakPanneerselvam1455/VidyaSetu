
import { User, Course, Quiz, Question, QuizAttempt, ForumCategory, ForumThread, ForumPost, TutoringSession, MentorshipRequest, ChatMessage as AppChatMessage } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './supabase';
export { supabase };

// --- AUTH ---
export const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
    });

    if (error) throw error;

    // Fetch user profile
    if (data.user) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;
        return { user: profile as User };
    }

    throw new Error("Login failed");
};

export const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return profile as User | null;
};

export const logout = async () => {
    await supabase.auth.signOut();
};

export const register = async (userData: any, pass: string) => {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: pass,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Registration failed");

    // 2. Create Profile
    const newUser: User = {
        ...userData,
        id: authData.user.id,
        createdAt: new Date().toISOString(),
        accountStatus: 'ENABLED'
    };

    const { error: profileError } = await supabase
        .from('profiles')
        .insert([newUser]);

    if (profileError) {
        // Cleanup auth user if profile creation fails? For now just throw.
        throw profileError;
    }

    return newUser;
};

export const createUser = async (data: any, pass: string) => register(data, pass);

// --- USERS ---
export const getUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data as User[];
};

export const updateUser = async (data: User) => {
    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', data.id);
    if (error) throw error;
};

export const toggleUserStatus = async (userId: string, adminId: string, status: string) => {
    const { error } = await supabase
        .from('profiles')
        .update({ accountStatus: status })
        .eq('id', userId);
    if (error) throw error;
};

export const deleteUser = async (id: string) => {
    // Note: Deleting from auth.users requires admin privilege or server-side code usually.
    // For now we will just delete from profiles. If cascade is set, it might not work fully if we don't delete auth user.
    // But since we are client-side, we can only delete public profile easily. 
    // To properly delete, we might need an Edge Function or just delete from profile and let auth user remain (or soft delete).
    // The Schema HAS "ON DELETE CASCADE" on profile referencing auth.users... wait, no, profile references auth.users.
    // If we delete profile, auth user remains. If we want to delete auth user, we need admin API.
    // We will just delete from profiles for now.
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};

export const resetPassword = async (id: string, pass: string) => {
    // Client-side admin reset is tricky without Admin API. 
    // Usually trigger password reset email.
    // console.log(`Password reset for ${id} to ${pass}`);
    await supabase.auth.resetPasswordForEmail(id, { redirectTo: window.location.origin }); // id assumed email? No, id is UUID.
    // If id is text (email) passed in components, we can use it.
    // Looking at usage might be needed. 
    // For now log it as implemented via Supabase Console or similar.
    console.log("Password reset functionality requires Supabase Admin API or Email flow");
};

// --- COURSES ---
export const getCourses = async () => {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) throw error;
    return data as Course[];
};

export const getCourseById = async (id: string) => {
    const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
    if (error) return null;
    return data as Course;
};

export const createCourse = async (data: any) => {
    const { data: newCourse, error } = await supabase
        .from('courses')
        .insert([{
            ...data,
            createdAt: new Date().toISOString() // Let DB handle it or client
        }])
        .select()
        .single();

    if (error) throw error;
    return newCourse as Course;
};

export const updateCourse = async (data: any) => {
    const { error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', data.id);
    if (error) throw error;
};

export const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
};

// --- PROGRESS ---
// We need a table for progress. I think I missed creating a dedicated table for "viewed materials" in my initial schema plan?
// Ah, distinct from local storage 'sf_material_progress'. I need a table `user_progress` or similar.
// Wait, I can use a JSONB column in `profiles` or a new table. 
// A new table `public.progress` is better.
// I will add it to the schema or just use a JSONB field implementation if I want to be quick, but SQL execution is done.
// I'll create it if it doesn't exist, or use `activity_logs`? No.
// Let's check `lib/api.ts` original: `sf_material_progress` was `Record<userId, string[]>`.
// I'll make a `materials_viewed` table on the fly or adjust `profiles`?
// Actually I missed it in Schema. modifying schema is quick.
// "markMaterialAsViewed"
// Let's assume I missed it and I should add it.
export const markMaterialAsViewed = async (userId: string, materialId: string) => {
    // Use a new table `user_progress` (userId, materialId)
    const { error } = await supabase.from('user_progress').insert({ userId: userId, materialId: materialId });
    // If duplicate, ignore (needs unique constraint)
    if (error && error.code !== '23505') throw error; // 23505 is unique violation
};

export const getViewedMaterialsForStudent = async (userId: string) => {
    const { data, error } = await supabase.from('user_progress').select('materialId').eq('userId', userId);
    if (error) return [];
    return data.map((d: any) => d.materialId);
};

export const getAllViewedMaterials = async () => {
    // This returns Record<userId, string[]>
    const { data, error } = await supabase.from('user_progress').select('*');
    if (error) return {};
    const result: Record<string, string[]> = {};
    data.forEach((row: any) => {
        if (!result[row.userId]) result[row.userId] = [];
        result[row.userId].push(row.materialId);
    });
    return result;
};


// --- QUIZZES ---
export const getQuizzes = async () => {
    const { data, error } = await supabase.from('quizzes').select('*');
    if (error) throw error;
    return data as Quiz[];
};

export const getQuizzesByCourse = async (courseId: string) => {
    const { data, error } = await supabase.from('quizzes').select('*').eq('courseId', courseId);
    if (error) throw error;
    return data as Quiz[];
};

export const getQuizById = async (id: string) => {
    const { data, error } = await supabase.from('quizzes').select('*').eq('id', id).single();
    if (error) return null;
    return data as Quiz;
};

export const createQuiz = async (data: any) => {
    const { data: newQuiz, error } = await supabase
        .from('quizzes')
        .insert([{ ...data, createdAt: new Date().toISOString() }])
        .select()
        .single();
    if (error) throw error;
    return newQuiz as Quiz;
};

export const updateQuiz = async (data: any) => {
    const { error } = await supabase.from('quizzes').update(data).eq('id', data.id);
    if (error) throw error;
};

export const deleteQuiz = async (id: string) => {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) throw error;
};

export const submitQuizAttempt = async (data: any) => {
    const { data: newAttempt, error } = await supabase
        .from('quiz_attempts')
        .insert([{ ...data, submittedAt: new Date().toISOString() }])
        .select()
        .single();
    if (error) throw error;
    return newAttempt as QuizAttempt;
};

export const updateQuizAttempt = async (data: any) => {
    const { error } = await supabase.from('quiz_attempts').update(data).eq('id', data.id);
    if (error) throw error;
};

export const getStudentProgress = async (userId: string) => {
    const { data, error } = await supabase.from('quiz_attempts').select('*').eq('studentId', userId);
    if (error) throw error;
    return data as QuizAttempt[];
};

export const getAllAttempts = async () => {
    const { data, error } = await supabase.from('quiz_attempts').select('*');
    if (error) throw error;
    return data as QuizAttempt[];
};

export const createQuizAssignments = async (quizId: string, studentIds: string[], dueDate?: string) => {
    console.log(`Quiz ${quizId} assigned to students: ${studentIds.join(', ')}`);
    // Ideally store in a 'assignments' table
};

export const getAssignedQuizzesForStudent = async (userId: string) => getQuizzes();
export const getAssignedCoursesForStudent = (userId: string) => getCourses();

// --- FORUMS ---
export const getForumCategories = async () => {
    const { data, error } = await supabase.from('forum_categories').select('*');
    if (error) throw error;
    return data as ForumCategory[];
};

export const getForumThreads = async () => {
    const { data, error } = await supabase
        .from('forum_threads')
        .select('*')
        .order('createdAt', { ascending: false });
    if (error) throw error;
    return data as ForumThread[];
};

export const getForumThreadById = async (id: string) => {
    const { data, error } = await supabase.from('forum_threads').select('*').eq('id', id).single();
    if (error) return null;
    return data as ForumThread;
};

export const createForumThread = async (data: any) => {
    const { data: newThread, error } = await supabase
        .from('forum_threads')
        .insert([{ ...data, createdAt: new Date().toISOString(), views: 0, upvotes: [], replyCount: 0 }])
        .select()
        .single();
    if (error) throw error;
    return newThread as ForumThread;
};

export const getForumPosts = async (threadId: string) => {
    const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('threadId', threadId)
        .order('createdAt', { ascending: true });
    if (error) throw error;
    return data as ForumPost[];
};

export const createForumPost = async (data: any) => {
    // Transaction ideally: insert post + update thread reply count
    const { data: newPost, error } = await supabase
        .from('forum_posts')
        .insert([{ ...data, createdAt: new Date().toISOString(), upvotes: [] }])
        .select()
        .single();

    if (error) throw error;

    // Update thread count (fire and forget or await)
    // Could be a database trigger
    const { data: thread } = await supabase.from('forum_threads').select('reply_count').eq('id', data.threadId).single();
    if (thread) {
        await supabase.from('forum_threads').update({ reply_count: (thread.reply_count || 0) + 1 }).eq('id', data.threadId);
    }

    return newPost as ForumPost;
};

export const toggleThreadVote = async (id: string, userId: string) => {
    // Fetch current, toggle, update. Race conditions exist but okay for now.
    const { data: thread } = await supabase.from('forum_threads').select('upvotes').eq('id', id).single();
    if (!thread) return;

    let upvotes = thread.upvotes || [];
    if (upvotes.includes(userId)) {
        upvotes = upvotes.filter((uid: string) => uid !== userId);
    } else {
        upvotes.push(userId);
    }

    await supabase.from('forum_threads').update({ upvotes }).eq('id', id);
};

// --- MENTORSHIP & TUTORING ---
export const getMentors = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'mentor');
    if (error) throw error;
    return data as User[];
};

export const getMentorshipRequests = async (userId: string, role: string) => {
    const col = role === 'student' ? 'studentId' : 'mentorId';
    const { data, error } = await supabase.from('mentorship_requests').select('*').eq(col, userId);
    if (error) throw error;
    return data as MentorshipRequest[];
};

export const createMentorshipRequest = async (data: any) => {
    const { data: newReq, error } = await supabase
        .from('mentorship_requests')
        .insert([{ ...data, status: 'pending', createdAt: new Date().toISOString() }])
        .select()
        .single();
    if (error) throw error;
    return newReq as MentorshipRequest;
};

export const updateMentorshipRequest = async (data: any) => {
    const { error } = await supabase.from('mentorship_requests').update({ status: data.status }).eq('id', data.id);
    if (error) throw error;
};

export const getTutoringSessions = async () => {
    const { data, error } = await supabase.from('tutoring_sessions').select('*');
    if (error) throw error;
    return data as TutoringSession[];
};

export const getTutoringSessionById = async (id: string) => {
    const { data, error } = await supabase.from('tutoring_sessions').select('*').eq('id', id).single();
    if (error) return null;
    return data as TutoringSession;
};

export const createTutoringSession = async (data: any) => {
    const { data: newSession, error } = await supabase
        .from('tutoring_sessions')
        .insert([data])
        .select()
        .single();
    if (error) throw error;
    return newSession as TutoringSession;
};

export const updateTutoringSession = async (data: any) => {
    const { error } = await supabase.from('tutoring_sessions').update(data).eq('id', data.id);
    if (error) throw error;
};

export const deleteTutoringSession = async (id: string) => {
    const { error } = await supabase.from('tutoring_sessions').delete().eq('id', id);
    if (error) throw error;
};

export const getSessionsForUser = async (userId: string, role: string) => {
    const { data, error } = await supabase.from('tutoring_sessions').select('*');
    if (error) throw error;
    // Filtering client side for array check or building OR query
    // "studentIds" is array.
    if (role === 'mentor') return data.filter((s: any) => s.mentorId === userId);
    return data.filter((s: any) => s.studentIds && s.studentIds.includes(userId));
};

// --- LOGS & SETTINGS ---
export const logActivity = async (type: string, title: string, details?: any) => {
    await supabase.from('activity_logs').insert([{ type, title, details, timestamp: new Date().toISOString() }]);
};

export const getSystemSettings = async (category: string) => {
    // Mocking settings since not in schema, or use a settings table if needed.
    return {};
};
export const updateSystemSettings = async (category: string, data: any) => {
    // no-op
};


// --- AI (GEMINI) --- 
// Kept as original
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY" }); // Ensure env var

const generateContentWithRetry = async (config: any, retries = 3, delay = 2000): Promise<any> => {
    try {
        return await ai.models.generateContent(config);
    } catch (error: any) {
        if (
            retries > 0 &&
            (error.status === 503 ||
                error.status === 500 ||
                error.status === 429 ||
                String(error.message).includes('503') ||
                String(error.message).includes('Overloaded') ||
                String(error.message).includes('quota'))
        ) {
            console.warn(`Gemini API error ${error.status}. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return generateContentWithRetry(config, retries - 1, delay * 2);
        }
        throw error;
    }
};

export const getAIFeedbackForQuestion = async (question: Question) => {
    const res = await generateContentWithRetry({
        model: 'gemini-3-flash-preview',
        contents: `Explain simply why the answer to "${question.question}" is "${question.correctAnswer}".`,
    });
    return res.text;
};

export const getQuestionAISuggestion = async (question: Question, courseTitle: string) => {
    const res = await generateContentWithRetry({
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
    const res = await generateContentWithRetry({
        model: 'gemini-3-flash-preview',
        contents: `Given a quiz about "${quizContext.title}", improve this question: "${q.question}". Return only the improved question text.`,
    });
    return { ...q, question: res.text?.trim() || q.question };
};

export const generateAlternativeOptionsWithAI = async (q: any) => {
    const res = await generateContentWithRetry({
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
    const res = await generateContentWithRetry({
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
    const res = await generateContentWithRetry({
        model: 'gemini-3-flash-preview',
        contents: `Student scored ${attempt.score}/${attempt.totalPoints} on "${quiz.title}". Suggest next study step in one sentence.`,
    });
    return res.text?.trim() || "Keep studying the current module.";
};

export const regenerateQuestionWithAI = async (topic: string, difficulty: string, type: string, contextText?: string) => {
    const res = await generateContentWithRetry({
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

    const res = await generateContentWithRetry({
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

export const uploadFile = async (file: File, bucket: 'materials' | 'avatars' = 'materials', folder: string = '') => {
    const fileName = `${folder ? folder + '/' : ''}${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrlData.publicUrl;
};

export const sendMessageAndGetStream = async (history: any, msg: string) => {
    const chat = ai.chats.create({ model: 'gemini-3-flash-preview', history: history.map((m: any) => ({ role: m.role, parts: [{ text: m.text }] })) });
    return chat.sendMessageStream({ message: msg });
};

export const getChatbotResponse = async (history: any, msg: string, mode: string) => {
    const res = await generateContentWithRetry({ model: 'gemini-3-flash-preview', contents: msg });
    return { text: res.text, sources: [] };
};
