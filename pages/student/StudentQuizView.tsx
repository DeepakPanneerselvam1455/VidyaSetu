import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Quiz, Course, QuizAttempt, Question } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import Dialog from '../../components/ui/Dialog';

type QuizState = 'confirming' | 'active' | 'finished';

// Icons
const BookCopyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V4a2 2 0 0 1 2-2h11"/><path d="M5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-5"/><path d="M15 2h5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1"/><path d="M20 9.5V4a2 2 0 0 0-2-2h-3"/></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" x2="12" y1="9" y2="13"/>
        <line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
);
const CheckCircle2Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const BotIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;
const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;
const TimerIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="12" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>;
const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>;
const TargetIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/><path d="M5 22v-5l-1.9-4.8-4.8-1.9 4.8-1.9L5 5v5"/><path d="M19 22v-5l1.9-4.8 4.8-1.9-4.8-1.9L19 5v5"/></svg>;

const StudentQuizView: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
    const [quizState, setQuizState] = useState<QuizState>('confirming');
    const [bestScore, setBestScore] = useState<{ score: number, total: number } | null>(null);
    const [finishedAttempt, setFinishedAttempt] = useState<QuizAttempt | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [finalTimeElapsed, setFinalTimeElapsed] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
    const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set());

    // AI Feedback State
    const [aiFeedbacks, setAiFeedbacks] = useState<Record<string, string>>({});
    const [isFeedbackLoading, setIsFeedbackLoading] = useState<Record<string, boolean>>({});

    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const fetchAndSetupQuiz = async () => {
            if (!quizId || !user) return;
            setIsLoading(true);
            try {
                const quizData = await api.getQuizById(quizId);
                if (!quizData) {
                    throw new Error("The quiz you are looking for could not be found.");
                }
                setQuiz(quizData);

                const courseData = await api.getCourseById(quizData.courseId);
                if (!courseData) {
                    throw new Error("Could not load the course details for this quiz.");
                }
                setCourse(courseData);

                const attempts = await api.getStudentProgress(user.id);
                const pastAttempts = attempts.filter(a => a.quizId === quizId);
                if (pastAttempts.length > 0) {
                    const best = pastAttempts.reduce((max, current) => (current.score > max.score ? current : max));
                    setBestScore({ score: best.score, total: best.totalPoints });
                }

            } catch (err: any) {
                console.error("Failed to fetch quiz data", err);
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndSetupQuiz();
    }, [quizId, user]);

    useEffect(() => {
        if (quizState === 'active') {
            startTimeRef.current = Date.now();
            timerRef.current = window.setInterval(() => {
                setTimeElapsed(Math.floor((Date.now() - (startTimeRef.current ?? 0)) / 1000));
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizState]);

    useEffect(() => {
        const fetchLatestAttempt = async () => {
            if (quizState === 'finished' && user && quizId) {
                const allAttempts = await api.getStudentProgress(user.id);
                const latestForThisQuiz = allAttempts
                    .filter(a => a.quizId === quizId)
                    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
                
                if (latestForThisQuiz) {
                    setFinishedAttempt(latestForThisQuiz);
                }
            }
        };
        fetchLatestAttempt();
    }, [quizState, quizId, user]);

    useEffect(() => {
        if (quizState === 'active') {
            setVisitedQuestions(prev => new Set(prev).add(currentQuestionIndex));
        }
    }, [currentQuestionIndex, quizState]);
    
    const handleFetchFeedback = async (question: Question) => {
        if (aiFeedbacks[question.id]) return;

        setIsFeedbackLoading(prev => ({ ...prev, [question.id]: true }));
        try {
            const feedbackText = await api.getAIFeedbackForQuestion(question);
            setAiFeedbacks(prev => ({ ...prev, [question.id]: feedbackText }));
        } catch (err) {
            console.error("Failed to fetch AI feedback", err);
            setAiFeedbacks(prev => ({ ...prev, [question.id]: "Sorry, an error occurred while generating the explanation." }));
        } finally {
            setIsFeedbackLoading(prev => ({ ...prev, [question.id]: false }));
        }
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };
    
    const handleStartQuiz = () => {
        setQuizState('active');
        setVisitedQuestions(new Set([0]));
    };

    const handleSubmit = async () => {
        if (!quiz || !user || isSubmitting) return;
        
        setIsConfirmSubmitOpen(false);
        setIsSubmitting(true);
        if(timerRef.current) {
            clearInterval(timerRef.current);
            setFinalTimeElapsed(timeElapsed);
        }
        
        try {
            let calculatedScore = 0;
            quiz.questions.forEach(q => {
                if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
                    calculatedScore += q.points;
                }
            });
            
            const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    
            const submittedAttempt = await api.submitQuizAttempt({
                quizId: quiz.id,
                studentId: user.id,
                answers,
                score: calculatedScore,
                totalPoints,
            });
            setFinishedAttempt(submittedAttempt);
            setQuizState('finished');
        } catch(err) {
            console.error("Error submitting quiz", err);
            setError("Failed to submit quiz. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="text-center p-8 text-white">Loading quiz...</div>;
    if (error) return <div className="text-center p-8 text-red-600 font-semibold bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>;
    if (!quiz || !course) return <div className="text-center p-8 text-white">Quiz data could not be fully loaded.</div>;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (quizState === 'confirming') {
        const percentage = bestScore ? Math.round((bestScore.score / bestScore.total) * 100) : 0;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-md m-4 bg-[#1E293B] border border-slate-700 rounded-2xl text-white p-8 space-y-6 animate-in fade-in-0 zoom-in-95">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookCopyIcon className="w-8 h-8 text-violet-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Ready to begin?</h2>
                        <p className="text-slate-300 mt-1">{quiz.title}</p>
                        <p className="text-xs text-slate-400">{course.title}</p>
                    </div>
                    <div className="space-y-3 text-sm border-t border-b border-slate-700 py-4">
                        <div className="flex justify-between items-center"><span className="text-slate-300">Questions:</span> <span className="font-semibold">{quiz.questions.length}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-300">Time Limit:</span> <span className="font-semibold">{quiz.duration ? `${quiz.duration} minutes` : 'None'}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-300">Your Best Score:</span> <span className={`font-semibold ${bestScore ? 'text-green-400' : ''}`}>{bestScore ? `${percentage}%` : 'N/A'}</span></div>
                    </div>
                    <p className="text-xs text-center text-slate-400">Once you begin, the timer will start and cannot be paused.</p>
                    <div className="flex gap-4">
                        <Button variant="outline" className="w-full" onClick={() => navigate('/student/quizzes')}>Go Back</Button>
                        <Button className="w-full" onClick={handleStartQuiz}>Begin Quiz</Button>
                    </div>
                </div>
            </div>
        )
    }

    if (quizState === 'finished') {
        const finalScore = finishedAttempt?.score ?? 0;
        const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
        const percentage = totalPoints > 0 ? Math.round((finalScore / totalPoints) * 100) : 0;
        const correctCount = quiz.questions.filter(q => finishedAttempt?.answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()).length;

        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="bg-violet-600 text-white border-none shadow-indigo-500/20">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-1">
                            <AwardIcon className="w-8 h-8 mb-2 opacity-80" />
                            <p className="text-3xl font-bold">{finalScore} / {totalPoints}</p>
                            <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Final Score</p>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-800">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-1">
                            <TargetIcon className="w-8 h-8 mb-2 text-indigo-500" />
                            <p className="text-3xl font-bold">{percentage}%</p>
                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Accuracy</p>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-800">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-1">
                            <CheckCircle2Icon className="w-8 h-8 mb-2 text-green-500" />
                            <p className="text-3xl font-bold">{correctCount} / {quiz.questions.length}</p>
                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Correct</p>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-800">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-1">
                            <TimerIcon className="w-8 h-8 mb-2 text-amber-500" />
                            <p className="text-3xl font-bold">{formatTime(finalTimeElapsed)}</p>
                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Time Taken</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Feedback Card (placeholder if component not available) */}
                <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-semibold mb-2">Performance Summary</h3>
                        <p className="text-slate-600 dark:text-slate-300">
                            {percentage >= 80 ? "Excellent work! You have a strong grasp of this topic." : 
                             percentage >= 50 ? "Good effort. Review the material to improve your understanding." : 
                             "Keep practicing. Review the course material and try again."}
                        </p>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BookCopyIcon className="w-6 h-6 text-indigo-500" />
                        Detailed Review
                    </h2>
                    {quiz.questions.map((q, index) => {
                        const studentAnswer = finishedAttempt?.answers[q.id] || "Not Answered";
                        const isCorrect = studentAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                        return (
                            <Card key={q.id} className={cn("overflow-hidden border-l-4 transition-all hover:shadow-md", isCorrect ? 'border-l-green-500' : 'border-l-red-500')}>
                                <CardHeader className={cn("py-4", isCorrect ? 'bg-green-50/30 dark:bg-green-950/10' : 'bg-red-50/30 dark:bg-red-950/10')}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant={isCorrect ? 'success' : 'destructive'} className="h-5">
                                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                                </Badge>
                                                <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
                                            </div>
                                            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{q.question}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{isCorrect ? q.points : 0} / {q.points} pts</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-6 space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className={cn("p-4 rounded-xl border", isCorrect ? "bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-800/50" : "bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-800/50")}>
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Your Answer</p>
                                            <p className="font-medium text-slate-900 dark:text-white">{studentAnswer}</p>
                                        </div>
                                        {!isCorrect && (
                                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Correct Answer</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{q.correctAnswer}</p>
                                            </div>
                                        )}
                                    </div>

                                    {aiFeedbacks[q.id] ? (
                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                                    <BotIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Learning Insights</h4>
                                            </div>
                                            <div className="text-sm p-4 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-wrap">
                                                {aiFeedbacks[q.id]}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleFetchFeedback(q)}
                                                disabled={isFeedbackLoading[q.id]}
                                                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                            >
                                                {isFeedbackLoading[q.id] ? (
                                                    <><LoaderIcon className="w-4 h-4 mr-2 animate-spin" />Generating Insight...</>
                                                ) : (
                                                    <><SparklesIcon className="w-4 h-4 mr-2" />Show AI Explanation</>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                     <Button variant="outline" size="lg" onClick={() => window.location.reload()} className="w-full sm:w-auto">Retake Quiz</Button>
                     <Button size="lg" onClick={() => navigate('/student/quizzes')} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700">Explore More Quizzes</Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
                 <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
                    <p className="text-slate-400 flex items-center gap-2">
                        <BookCopyIcon className="w-4 h-4" /> {course.title}
                    </p>
                </div>
                <Card className="bg-[#1E293B] border-slate-700 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-slate-700 pb-4">
                        <div className="flex justify-between items-center">
                             <p className="font-semibold text-lg text-slate-100">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                             <Badge variant="outline" className="border-slate-600 text-slate-400 font-normal">{currentQuestion.points} points</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <p className="text-xl font-medium text-white leading-relaxed">{currentQuestion.question}</p>
                        <div className="space-y-3">
                            {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map((option, index) => (
                                <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => handleAnswerChange(currentQuestion.id, option)}>
                                    <input 
                                        type="radio" 
                                        name={`question-${currentQuestion.id}`} 
                                        id={`option-${index}`} 
                                        value={option}
                                        checked={answers[currentQuestion.id] === option}
                                        onChange={() => handleAnswerChange(currentQuestion.id, option)}
                                        className="w-4 h-4 text-violet-600 bg-slate-700 border-slate-500 focus:ring-violet-600 focus:ring-2"
                                    />
                                    <label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-slate-200">{option}</label>
                                </div>
                            ))}
                            {currentQuestion.type === 'short-answer' && (
                                <Textarea 
                                    placeholder="Type your answer here..." 
                                    className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                />
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-800/50 border-t border-slate-700 p-4 flex justify-between">
                        <Button 
                            variant="outline" 
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="text-white border-slate-600 hover:bg-slate-700 hover:text-white"
                        >
                            Previous
                        </Button>
                        {currentQuestionIndex < quiz.questions.length - 1 ? (
                            <Button 
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                Next Question
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => setIsConfirmSubmitOpen(true)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Submit Quiz
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-[#1E293B] border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-amber-400" /> Time Remaining
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-mono font-bold text-center py-4 bg-slate-800/50 rounded-lg tracking-wider">
                            {formatTime(timeElapsed)}
                        </div>
                        <p className="text-xs text-center text-slate-400 mt-2">Started at {new Date(startTimeRef.current || Date.now()).toLocaleTimeString()}</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#1E293B] border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Question Map</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-5 gap-2">
                            {quiz.questions.map((q, i) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = i === currentQuestionIndex;
                                const isVisited = visitedQuestions.has(i);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestionIndex(i)}
                                        className={cn(
                                            "h-10 w-10 rounded-md text-sm font-semibold transition-all border",
                                            isCurrent ? "bg-violet-600 border-violet-500 text-white ring-2 ring-violet-400/30" : 
                                            isAnswered ? "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600" :
                                            isVisited ? "bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700" :
                                            "bg-transparent border-slate-700 text-slate-500 hover:bg-slate-800"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-4 mt-6 text-xs text-slate-400 justify-center">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-violet-600 rounded-sm"></div> Current</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-700 rounded-sm"></div> Answered</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 border border-slate-700 rounded-sm"></div> Pending</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                isOpen={isConfirmSubmitOpen}
                onClose={() => setIsConfirmSubmitOpen(false)}
                title="Submit Quiz?"
                description="Are you sure you want to submit? You cannot change your answers after this."
            >
                <div className="space-y-4 pt-2">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
                        <AlertTriangleIcon className="w-5 h-5 text-yellow-500 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-yellow-500">Unanswered Questions</p>
                            <p className="text-sm text-slate-300">
                                You have answered <span className="font-bold text-white">{Object.keys(answers).length}</span> out of <span className="font-bold text-white">{quiz.questions.length}</span> questions.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsConfirmSubmitOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-800">Keep Reviewing</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                            {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default StudentQuizView;