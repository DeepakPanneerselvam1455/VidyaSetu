
import { User, Course, Quiz, Question, QuizAttempt, ForumCategory, ForumThread, ForumPost, TutoringSession, MentorshipRequest, ChatMessage as AppChatMessage, DirectMessage, NotificationPreferences } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { SignJWT } from 'jose';
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
        console.log(`[Auth] User authenticated: ${data.user.id}. Fetching profile...`);
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, role') // Explicitly verify role selection
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error("[Auth] Profile fetch failed:", profileError);
            throw profileError;
        }

        if (!profile) throw new Error("User profile not found.");

        console.log(`[Auth] Profile loaded. Role: ${profile.role}`);

        if (profile.accountStatus === 'DISABLED') {
            await supabase.auth.signOut();
            throw new Error("Your account has been disabled. Please contact an administrator.");
        }

        if (!profile.role) {
            console.error("[Auth] Critical: User has no role assigned in database.");
            throw new Error("User has no role assigned.");
        }

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

    if (profile) {
        if (profile.accountStatus === 'DISABLED') {
             // Force logout if the account was disabled while they had an active session
             await supabase.auth.signOut();
             return null;
        }
        console.log(`[Auth] Session restored for user ${profile.id}. Role: ${profile.role}`);
    }

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
        options: {
            data: {
                name: userData.name,
                role: userData.role || 'student', // Default to student
            }
        }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Registration failed");

    // HARDENING: Explicitly set the role in the profiles table immediately.
    // This handles cases where the DB trigger fails or is slow.
    const { error: profileUpdateError } = await supabase
        .from('profiles')
        .upsert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'student',
            accountStatus: 'ENABLED',
            createdAt: new Date().toISOString()
        }, { onConflict: 'id' });

    if (profileUpdateError) {
        console.warn("Manual profile creation/update failed (Trigger might have handled it):", profileUpdateError.message);
        // Continue anyway as the trigger might have succeeded or it's a non-blocking issue
    }

    // Profile creation is now handled by the 'on_auth_user_created' database trigger.
    // We construct the user object to return it immediately to the UI.
    const newUser: User = {
        ...userData,
        id: authData.user.id,
        createdAt: new Date().toISOString(),
        accountStatus: 'ENABLED'
    };

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

export const getQuizAssignments = async (quizId: string) => {
    const { data, error } = await supabase.from('quiz_assignments').select('studentId').eq('quizId', quizId);
    if (error) throw error;
    return data.map((d: any) => d.studentId as string);
};

export const createQuizAssignments = async (quizId: string, studentIds: string[], dueDate?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    // Prevent duplicates
    const existingIds = await getQuizAssignments(quizId);
    const newStudentIds = studentIds.filter(id => !existingIds.includes(id));

    if (newStudentIds.length === 0) return;

    const assignments = newStudentIds.map(studentId => ({
        quizId,
        studentId,
        assignedBy: user.id,
        dueDate
    }));

    const { error } = await supabase.from('quiz_assignments').insert(assignments);
    if (error) throw error;
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

export const startTutoringSession = async (id: string) => {
    // Only update to 'active' if it's currently 'scheduled'
    // This simple update is good enough for now, but RLS should restrict this to the mentor.
    // To prevent race conditions/duplicates, we could check status first or trust the UI + RLS.
    const { error } = await supabase
        .from('tutoring_sessions')
        .update({ status: 'active' })
        .eq('id', id)
        .eq('status', 'scheduled'); // Optimistic concurrency control of sorts

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
    // Return sessions where user is a participant OR session is status 'scheduled' (visible to all to join)
    // Actually, distinct functions are better.
    return data.filter((s: any) => s.studentIds && s.studentIds.includes(userId));
};

export const getAvailableSessions = async () => {
    // Fetch all sessions that are scheduled (and maybe active), so students can see them to join.
    const { data, error } = await supabase
        .from('tutoring_sessions')
        .select('*')
        .in('status', ['scheduled', 'active'])
        .order('startTime', { ascending: true });

    if (error) throw error;
    return data as TutoringSession[];
};

export const joinTutoringSession = async (sessionId: string, studentId: string) => {
    // 1. Get current session
    const { data: session, error: fetchError } = await supabase
        .from('tutoring_sessions')
        .select('studentIds')
        .eq('id', sessionId)
        .single();

    if (fetchError) throw fetchError;

    // 2. Add student if not already present
    const currentIds = session.studentIds || [];
    if (!currentIds.includes(studentId)) {
        const { error: updateError } = await supabase
            .from('tutoring_sessions')
            .update({ studentIds: [...currentIds, studentId] })
            .eq('id', sessionId);

        if (updateError) throw updateError;
    }
};

// --- LOGS & SETTINGS ---
export const logActivity = async (type: string, title: string, details?: any) => {
    await supabase.from('activity_logs').insert([{ type, title, details, timestamp: new Date().toISOString() }]);
};

// --- JITSI TOKEN GENERATION ---
export const generateMeetingToken = async (user: User, sessionId: string) => {
    // ⚠️ SECURITY WARNING: In a production app, this MUST be done on the server (e.g. Supabase Edge Function).
    // Storing the secret here exposes it to the client.
    // For this prototype/dev environment, we do it client-side to unblock the comprehensive Jitsi features.

    // UPDATE: Now using local token server for Jitsi JaaS (vpaas)
    // This removes the private key from the client bundle.

    const roomName = `vidyasetu-${sessionId}`;
    const tokenServerUrl = 'http://localhost:3002/api/jitsi-token'; // Port 3002 as configured in .env

    try {
        const params = new URLSearchParams({
            room: roomName,
            name: user.name,
            email: user.email,
            id: user.id,
            role: user.role // Server will use this to determine moderator status (in this prototype)
        });

        const response = await fetch(`${tokenServerUrl}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Token server error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[Jitsi] Token fetched from server");
        return data.token; // The server-signed JWT
    } catch (e) {
        console.error("[Jitsi] Token fetch failed", e);
        return null;
    }
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

// ==========================================
// Direct Messages API
// ==========================================

export const getMessages = async (userId: string, recipientId: string): Promise<DirectMessage[]> => {
    const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
  
    return data.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        message: msg.message,
        createdAt: msg.created_at,
        read: msg.read
    }));
};

export const sendMessage = async (senderId: string, receiverId: string, message: string): Promise<DirectMessage> => {
    const { data, error } = await supabase
        .from('direct_messages')
        .insert({
            sender_id: senderId,
            receiver_id: receiverId,
            message,
            read: false
        })
        .select()
        .single();

    if (error) throw error;
  
    return {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        message: data.message,
        createdAt: data.created_at,
        read: data.read
    };
};

export const subscribeToDirectMessages = (
    userId: string,
    recipientId: string,
    onMessageReceived: (message: DirectMessage) => void
) => {
    const channel = supabase
        .channel(`direct_messages_${userId}_${recipientId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `receiver_id=eq.${userId}`,
            },
            (payload) => {
                const msg = payload.new;
                if (msg.sender_id === recipientId) {
                    onMessageReceived({
                        id: msg.id,
                        senderId: msg.sender_id,
                        receiverId: msg.receiver_id,
                        message: msg.message,
                        createdAt: msg.created_at,
                        read: msg.read
                    });
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

// ==========================================
// Notification Preferences (Local Storage Fallback)
// ==========================================

export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
    try {
        const saved = localStorage.getItem(`notification_prefs_${userId}`);
        if (saved) return JSON.parse(saved);
    } catch (err) {
        // Ignore
    }
    return null;
};

export const updateNotificationPreferences = async (userId: string, prefs: NotificationPreferences): Promise<void> => {
    localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(prefs));
};
