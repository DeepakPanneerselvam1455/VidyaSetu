import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth';
import * as api from '../../lib/api';
import { Course, Question, Quiz, User } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useNavigate, Link } from 'react-router-dom';
import { buttonVariants } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import Dialog from '../../components/ui/Dialog';

// Icons
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/>
        <path d="M5 22v-5l-1.9-4.8-4.8-1.9 4.8-1.9L5 5v5"/>
        <path d="M19 22v-5l-1.9-4.8-4.8-1.9-4.8-1.9L19 5v5"/>
    </svg>
);
const Trash2Icon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
);
const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);
const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" x2="12" y1="9" y2="13"/>
        <line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
);

const ErrorAlert = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div className="p-3 mb-4 flex items-center gap-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 dark:text-red-300 border border-red-300 dark:border-red-800" role="alert">
            <AlertTriangleIcon className="w-5 h-5 shrink-0" />
            <div>
                <span className="font-medium">Request Failed:</span> {message}
            </div>
        </div>
    );
};


const MentorGenerateQuiz: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [topic, setTopic] = useState('');
    const [learningObjectives, setLearningObjectives] = useState('');
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [questionType, setQuestionType] = useState<'mixed' | 'multiple-choice'>('multiple-choice');
    const [numQuestions, setNumQuestions] = useState(5);
    const [quizTitle, setQuizTitle] = useState('');
    const [duration, setDuration] = useState<number>(5);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    // AI Feedback State
    const [feedback, setFeedback] = useState<Record<string, string>>({});
    const [feedbackLoading, setFeedbackLoading] = useState<Record<string, boolean>>({});
    const [feedbackError, setFeedbackError] = useState<Record<string, string | null>>({});

    // Assignment state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [quizToAssign, setQuizToAssign] = useState<Quiz | null>(null);

    // Auto-save State
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const autoSaveTimeoutRef = useRef<number | null>(null);

    // Draft Restoration State
    const [draftToRestore, setDraftToRestore] = useState<any | null>(null);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const DRAFT_KEY_PREFIX = 'skillforge_quiz_draft_';


    useEffect(() => {
        const fetchCourses = async () => {
            if (!user) return;
            try {
                const allCourses = await api.getCourses();
                const mentorCourses = allCourses.filter(c => c.mentorId === user.id);
                setCourses(mentorCourses);
                if (mentorCourses.length > 0) {
                    const firstCourse = mentorCourses[0];
                    setSelectedCourse(firstCourse);
                }
            } catch (err) {
                setGenerationError("Failed to load your courses.");
            }
        };
        fetchCourses();
    }, [user]);

    // Check for draft when course changes
    useEffect(() => {
        if (selectedCourse) {
            setTopic('');
            setLearningObjectives('');
            setGeneratedQuestions([]);
            setQuizTitle('');
            setSuggestedTopics([]);
            setFeedback({});
            setFeedbackLoading({});
            setFeedbackError({});
            try {
                const draftJson = localStorage.getItem(`${DRAFT_KEY_PREFIX}${selectedCourse.id}`);
                if (draftJson) {
                    const draft = JSON.parse(draftJson);
                    setDraftToRestore(draft);
                    setIsRestoreModalOpen(true);
                }
            } catch (e) {
                console.error("Failed to read quiz draft from localStorage", e);
            }
        }
    }, [selectedCourse]);

    // Trigger auto-save on changes
    useEffect(() => {
        if (generatedQuestions.length === 0 || isLoading || !selectedCourse) {
            return;
        }

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        setAutoSaveStatus('idle');

        autoSaveTimeoutRef.current = window.setTimeout(() => {
            setAutoSaveStatus('saving');
            const draft = {
                title: quizTitle,
                questions: generatedQuestions,
                duration: duration,
                timestamp: new Date().toISOString()
            };
            try {
                localStorage.setItem(`${DRAFT_KEY_PREFIX}${selectedCourse.id}`, JSON.stringify(draft));
                setAutoSaveStatus('saved');
                setTimeout(() => setAutoSaveStatus('idle'), 2000);
            } catch (e) {
                console.error("Failed to save quiz draft to localStorage", e);
                setAutoSaveStatus('idle');
            }
        }, 2500); // 2.5-second debounce

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [generatedQuestions, quizTitle, duration, selectedCourse, isLoading]);
    
    const clearDraft = () => {
        if (selectedCourse) {
            localStorage.removeItem(`${DRAFT_KEY_PREFIX}${selectedCourse.id}`);
        }
    };

    const handleRestoreDraft = () => {
        if (draftToRestore) {
            setQuizTitle(draftToRestore.title || '');
            setGeneratedQuestions(draftToRestore.questions || []);
            setDuration(draftToRestore.duration || 5);
        }
        setIsRestoreModalOpen(false);
        setDraftToRestore(null);
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setIsRestoreModalOpen(false);
        setDraftToRestore(null);
    };
    
    const handleSuggestTopics = async () => {
        if (!selectedCourse) return;
        setIsSuggestingTopics(true);
        setGenerationError(null);
        try {
            const topics = await api.generateQuizTopics(selectedCourse.title, selectedCourse.description, selectedCourse.materials);
            setSuggestedTopics(topics);
        } catch (err: any) {
            setGenerationError(err.message || "Failed to suggest topics.");
        } finally {
            setIsSuggestingTopics(false);
        }
    };


    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) {
            setGenerationError("Please enter a topic.");
            return;
        }
        setIsLoading(true);
        setGeneratedQuestions([]);
        setFeedback({});
        setFeedbackLoading({});
        setFeedbackError({});
        setGenerationError(null);
        setSaveError(null);
        try {
            const questions = await api.generateQuizQuestions(topic, learningObjectives, difficulty, numQuestions, questionType);
            setGeneratedQuestions(questions);
            setQuizTitle(`${topic.split(',')[0].trim()} Quiz`); // Auto-populate title
        } catch (err: any) {
            setGenerationError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveQuiz = async () => {
        if (!selectedCourse || !user || generatedQuestions.length === 0 || !quizTitle) {
            setSaveError("Missing information to save the quiz. Ensure you have a title and at least one question.");
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            const newQuiz: Omit<Quiz, 'id' | 'createdAt'> = {
                courseId: selectedCourse.id,
                title: quizTitle,
                questions: generatedQuestions,
                difficulty,
                createdBy: user.id,
                duration: duration,
            };
            await api.createQuiz(newQuiz);
            clearDraft();
            navigate(`/mentor/course/${selectedCourse.id}`);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save the quiz.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndAssign = async () => {
        if (!selectedCourse || !user || generatedQuestions.length === 0 || !quizTitle) {
            setSaveError("Missing information to save the quiz. Ensure you have a title and at least one question.");
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            const newQuizData: Omit<Quiz, 'id' | 'createdAt'> = {
                courseId: selectedCourse.id,
                title: quizTitle,
                questions: generatedQuestions,
                difficulty,
                createdBy: user.id,
                duration: duration,
            };
            const savedQuiz = await api.createQuiz(newQuizData);
            clearDraft();
            setQuizToAssign(savedQuiz);
            setIsAssignModalOpen(true);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save the quiz.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGetFeedback = async (question: Question) => {
        const questionId = question.id;
        setFeedbackLoading(prev => ({ ...prev, [questionId]: true }));
        setFeedbackError(prev => ({ ...prev, [questionId]: null }));
        try {
            const result = await api.getAIFeedbackForQuestion(question);
            setFeedback(prev => ({ ...prev, [questionId]: result }));
        } catch (err: any) {
            setFeedbackError(prev => ({ ...prev, [questionId]: err.message || "Failed to get feedback." }));
        } finally {
            setFeedbackLoading(prev => ({ ...prev, [questionId]: false }));
        }
    };

    const handleQuestionChange = (index: number, field: string, value: string | string[] | number) => {
        const newQuestions = [...generatedQuestions];
        const questionToUpdate: Question = JSON.parse(JSON.stringify(newQuestions[index])); // Deep copy for safety
    
        if (field === 'question' && typeof value === 'string') {
            questionToUpdate.question = value;
        } else if (field === 'correctAnswer' && typeof value === 'string') {
            questionToUpdate.correctAnswer = value;
        } else if (field === 'points' && typeof value === 'string') {
            questionToUpdate.points = parseInt(value, 10) || 0;
        } else if (field.startsWith('option-') && typeof value === 'string') {
            const optionIndex = parseInt(field.split('-')[1], 10);
            if (questionToUpdate.options) {
                questionToUpdate.options[optionIndex] = value;
            }
        }
        
        newQuestions[index] = questionToUpdate;
        setGeneratedQuestions(newQuestions);
    };

    const handleRemoveQuestion = (index: number) => {
        setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
    };

    if (courses.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">No Courses Found</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">You need to create a course before you can generate a quiz for it.</p>
                <Link to="/mentor/add-course" className={cn(buttonVariants({ variant: 'default' }))}>
                    Create Your First Course
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-500" />
                        <span>AI Quiz Generator</span>
                    </CardTitle>
                    <CardDescription>
                        Generate engaging quizzes for your courses. Select a course, provide a topic, and let the AI do the rest.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleGenerate}>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="course" className="block text-sm font-medium mb-1">Course</label>
                            <Select id="course" value={selectedCourse?.id || ''} onChange={e => setSelectedCourse(courses.find(c => c.id === e.target.value) || null)}>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </Select>
                        </div>

                        <div>
                            <label htmlFor="topic" className="block text-sm font-medium mb-1">Topics</label>
                            <div className="flex gap-2 items-start">
                                <Textarea id="topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., JavaScript Variables, Scope, Hoisting. You can also paste a block of text to generate questions from." rows={3} />
                                 <Button type="button" variant="outline" onClick={handleSuggestTopics} disabled={isSuggestingTopics || !selectedCourse}>
                                     <BotIcon className="w-4 h-4 mr-2" />
                                    {isSuggestingTopics ? 'Thinking...' : 'Suggest'}
                                 </Button>
                            </div>
                        </div>
                        
                        {suggestedTopics.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-500">Suggested Topics:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedTopics.map((sTopic, i) => (
                                        <Button key={i} type="button" variant="secondary" size="sm" onClick={() => setTopic(sTopic)}>
                                            {sTopic}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="learningObjectives" className="block text-sm font-medium mb-1">Learning Objectives (Optional)</label>
                            <Textarea id="learningObjectives" value={learningObjectives} onChange={e => setLearningObjectives(e.target.value)} placeholder="e.g., Student can explain the difference between var, let, and const. Student should understand function scope vs block scope." rows={3}/>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                             <div>
                                <label htmlFor="difficulty" className="block text-sm font-medium mb-1">Difficulty</label>
                                <Select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="questionType" className="block text-sm font-medium mb-1">Question Type</label>
                                <Select id="questionType" value={questionType} onChange={e => setQuestionType(e.target.value as 'mixed' | 'multiple-choice')}>
                                    <option value="multiple-choice">Multiple Choice Only</option>
                                    <option value="mixed">Mixed Types</option>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="numQuestions" className="block text-sm font-medium mb-1">Number of Questions</label>
                                <Input id="numQuestions" type="number" min="1" max="10" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch">
                        <ErrorAlert message={generationError} />
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Generating...' : 'Generate Questions'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {generatedQuestions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Review & Save Quiz</CardTitle>
                        <CardDescription>Review the generated questions. You can edit any details before saving.</CardDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div>
                                <label htmlFor="quizTitle" className="block text-sm font-medium mb-1">Quiz Title</label>
                                <Input id="quizTitle" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} required />
                            </div>
                             <div>
                                <label htmlFor="quiz-duration" className="block text-sm font-medium mb-1">Duration (minutes)</label>
                                <Select id="quiz-duration" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
                                    <option value={5}>5 Minutes</option>
                                    <option value={10}>10 Minutes</option>
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {generatedQuestions.map((q, index) => (
                            <div key={q.id} className="p-4 border rounded-lg space-y-3 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex justify-between items-start gap-4">
                                    <h3 className="font-semibold text-lg flex-1 pt-1">Question {index + 1}</h3>
                                    <div className="flex gap-2 items-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGetFeedback(q)}
                                            disabled={feedbackLoading[q.id]}
                                            className="w-[170px]"
                                        >
                                            {feedbackLoading[q.id] ? (
                                                <span className="flex items-center justify-center">
                                                    <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                                                    <span>Getting...</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center">
                                                    <BotIcon className="w-4 h-4 mr-2" />
                                                    <span>Get AI Feedback</span>
                                                </span>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
                                            onClick={() => handleRemoveQuestion(index)}
                                            aria-label={`Remove question ${index + 1}`}
                                        >
                                            <Trash2Icon className="w-4 h-4"/>
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Question Text</label>
                                    <Input value={q.question} onChange={e => handleQuestionChange(index, 'question', e.target.value)} />
                                </div>
                                {q.type === 'multiple-choice' && q.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {q.options.map((opt, i) => (
                                            <div key={i}>
                                                <label className="text-sm font-medium">Option {i + 1}</label>
                                                <Input value={opt} onChange={e => handleQuestionChange(index, `option-${i}`, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-sm font-medium">Correct Answer</label>
                                        <Input value={q.correctAnswer} onChange={e => handleQuestionChange(index, 'correctAnswer', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Points</label>
                                        <Input type="number" value={q.points} onChange={e => handleQuestionChange(index, 'points', e.target.value)} />
                                    </div>
                                </div>

                                {(feedbackLoading[q.id] || feedbackError[q.id] || feedback[q.id]) && (
                                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <BotIcon className="w-4 h-4" />
                                            AI Feedback
                                        </h4>
                                        {feedbackLoading[q.id] && <p className="text-sm text-slate-500">Generating explanation...</p>}
                                        {feedbackError[q.id] && <p className="text-sm text-red-500">{feedbackError[q.id]}</p>}
                                        {feedback[q.id] && (
                                            <div className="text-sm p-3 bg-slate-100 dark:bg-slate-800 rounded-md whitespace-pre-wrap">
                                                {feedback[q.id]}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="flex-col items-stretch">
                        <div className="flex justify-between items-center mb-2 min-h-[20px]">
                            {saveError ? (
                                <ErrorAlert message={saveError} />
                            ) : (
                                <div></div> // Placeholder to keep alignment
                            )}
                            <div className="flex-shrink-0">
                                {autoSaveStatus === 'saving' && <span className="text-xs flex items-center justify-end gap-1 text-slate-500 dark:text-slate-400"><LoaderIcon className="w-3 h-3 animate-spin" /> Saving draft...</span>}
                                {autoSaveStatus === 'saved' && <span className="text-xs flex items-center justify-end gap-1 text-green-600 dark:text-green-400"><CheckIcon className="w-3 h-3" /> Draft saved</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={handleSaveQuiz} disabled={isSaving} variant="outline">
                                {isSaving ? 'Saving...' : 'Save as Draft'}
                            </Button>
                            <Button onClick={handleSaveAndAssign} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save & Assign'}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            {quizToAssign && (
                <AssignQuizDialog
                    isOpen={isAssignModalOpen}
                    onClose={() => {
                        setIsAssignModalOpen(false);
                        if (selectedCourse) {
                            navigate(`/mentor/course/${selectedCourse.id}`);
                        }
                    }}
                    quiz={quizToAssign}
                />
            )}
            
            {draftToRestore && (
                <Dialog
                    isOpen={isRestoreModalOpen}
                    onClose={handleDiscardDraft}
                    title="Unsaved Draft Found"
                    description={`You have an unsaved quiz draft for this course from ${new Date(draftToRestore.timestamp).toLocaleString()}. Do you want to restore it?`}
                >
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={handleDiscardDraft}>Discard</Button>
                        <Button onClick={handleRestoreDraft}>Restore Draft</Button>
                    </div>
                </Dialog>
            )}
        </div>
    );
};

// --- DIALOGS ---

interface AssignQuizDialogProps { isOpen: boolean; onClose: () => void; quiz: Quiz; }
const AssignQuizDialog: React.FC<AssignQuizDialogProps> = ({ isOpen, onClose, quiz }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if(isOpen) {
            api.getUsers().then(allUsers => {
                setStudents(allUsers.filter(u => u.role === 'student'));
            });
            // Reset state on open
            setSelectedStudentIds([]);
            setDueDate('');
            setError('');
            setSuccessMessage('');
        }
    }, [isOpen]);

    const handleStudentSelect = (studentId: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudentIds.length === students.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(students.map(s => s.id));
        }
    };

    const handleAssign = async () => {
        if (selectedStudentIds.length === 0) {
            setError("Please select at least one student.");
            return;
        }
        setIsAssigning(true);
        setError('');
        try {
            await api.createQuizAssignments(quiz.id, selectedStudentIds, dueDate || undefined);
            setSuccessMessage(`Quiz successfully assigned to ${selectedStudentIds.length} student(s).`);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch(err) {
            setError("Failed to assign quiz.");
            setIsAssigning(false);
        }
    };
    
    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Assign Quiz: ${quiz.title}`}>
             <div className="space-y-4">
                {successMessage ? (
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <p className="font-semibold text-green-700 dark:text-green-300">{successMessage}</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Students</label>
                            <div className="border rounded-md max-h-60 overflow-y-auto p-2 dark:border-slate-700">
                                <div className="flex items-center p-2 border-b dark:border-slate-700">
                                    <input 
                                        type="checkbox" 
                                        id="select-all" 
                                        className="w-4 h-4 mr-3"
                                        checked={selectedStudentIds.length === students.length && students.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                    <label htmlFor="select-all" className="font-medium">Select All</label>
                                </div>
                                {students.map(student => (
                                    <div key={student.id} className="flex items-center p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <input 
                                            type="checkbox" 
                                            id={`student-${student.id}`} 
                                            className="w-4 h-4 mr-3"
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={() => handleStudentSelect(student.id)}
                                        />
                                        <label htmlFor={`student-${student.id}`}>{student.name} ({student.email})</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="due-date" className="block text-sm font-medium mb-1">Due Date (Optional)</label>
                            <Input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleAssign} disabled={isAssigning}>{isAssigning ? 'Assigning...' : 'Assign Quiz'}</Button>
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    )
}

export default MentorGenerateQuiz;