import React, { useState, useEffect, useRef } from 'react';
// FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Quiz, Course, QuizAttempt, Question } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { Textarea } from '../../components/ui/Textarea';

type QuizState = 'confirming' | 'active' | 'finished';

// Icons
const BookCopyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V4a2 2 0 0 1 2-2h11"/><path d="M5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-5"/><path d="M15 2h5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1"/><path d="M20 9.5V4a2 2 0 0 0-2-2h-3"/></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" x2="12" y1="9" y2="13"/>
        <line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
);
const CheckCircle2Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const BotIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;
const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;


const StudentQuizView: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const { user } = useAuth();
    // FIX: Replaced useHistory with useNavigate for react-router-dom v6.
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


    // Timer logic
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
        if (aiFeedbacks[question.id]) return; // Don't re-fetch if already loaded

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
        if(timerRef.current) clearInterval(timerRef.current);
        
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
    const minutes = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
    const seconds = (timeElapsed % 60).toString().padStart(2, '0');

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
                    <p className="text-xs text-center text-slate-400">Once you begin, the timer (if applicable) will start and cannot be paused.</p>
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

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                 <Card className="text-center">
                    <CardHeader className="items-center">
                        <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
                        <CardDescription>You've finished the "{quiz.title}" quiz.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-lg font-medium">Your Score:</p>
                        <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">{finalScore} / {totalPoints}</p>
                        <p className="text-2xl text-slate-600 dark:text-white">That's {percentage}%!</p>
                    </CardContent>
                </Card>

                <PerformanceFeedbackCard percentage={percentage} />

                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Review</CardTitle>
                        <CardDescription>Review your answers and see explanations for each question.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {quiz.questions.map((q, index) => {
                            const studentAnswer = finishedAttempt?.answers[q.id] || "Not Answered";
                            const isCorrect = studentAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                            return (
                                <Card key={q.id} className={cn("overflow-hidden", isCorrect ? 'border-green-300 dark:border-green-800' : 'border-red-300 dark:border-red-800')}>
                                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                                        <div>
                                            <CardTitle className="text-lg leading-tight">Question {index + 1}</CardTitle>
                                            <p className="mt-2 font-medium">{q.question}</p>
                                        </div>
                                        {isCorrect ? (
                                            <CheckCircle2Icon className="w-6 h-6 text-green-500 shrink-0" />
                                        ) : (
                                            <XCircleIcon className="w-6 h-6 text-red-500 shrink-0" />
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className={cn("p-2 rounded-md text-sm", isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                                            <strong>Your Answer:</strong> {studentAnswer}
                                        </div>
                                        {!isCorrect && (
                                            <div className="p-2 rounded-md text-sm bg-slate-100 dark:bg-slate-800/50">
                                                <strong>Correct Answer:</strong> {q.correctAnswer}
                                            </div>
                                        )}

                                        {aiFeedbacks[q.id] ? (
                                             <div className="pt-3">
                                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-300">
                                                    <BotIcon className="w-4 h-4" />
                                                    Explanation
                                                </h4>
                                                <div className="text-sm p-3 bg-slate-100 dark:bg-slate-800 rounded-md whitespace-pre-wrap">
                                                    {aiFeedbacks[q.id]}
                                                </div>
                                            </div>
                                        ) : (
                                             <div className="pt-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleFetchFeedback(q)}
                                                    disabled={isFeedbackLoading[q.id]}
                                                    className="text-indigo-600 dark:text-indigo-400"
                                                >
                                                    {isFeedbackLoading[q.id] ? (
                                                        <>
                                                            <LoaderIcon className="w-4 h-4 mr-2" />
                                                            Generating Explanation...
                                                        </>
                                                    ) : (
                                                        'Show Explanation'
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </CardContent>
                </Card>

                <div className="flex justify-center">
                     <Button onClick={() => navigate('/student/quizzes')} className="w-full max-w-xs">Back to Quizzes</Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left side: Main quiz content */}
            <div className="lg:col-span-2 space-y-6">
                 <div>
                    <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
                    <p className="text-slate-300">{course.title}</p>
                </div>
                <div className="space-y-4">
                    <p className="font-semibold text-lg text-slate-200">{currentQuestionIndex + 1}. {currentQuestion.question}</p>
                    <div className="space-y-3">
                        {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map((option, index) => {
                            const isSelected = answers[currentQuestion.id] === option;
                            const letter = String.fromCharCode(65 + index);
                            return (
                                <button 
                                    key={option} 
                                    className={cn(
                                        "flex w-full text-left items-center p-4 rounded-lg border-2 transition-colors",
                                        isSelected 
                                            ? "bg-violet-900/50 border-violet-500" 
                                            : "bg-slate-800/50 border-slate-700 hover:border-violet-600"
                                    )}
                                    onClick={() => handleAnswerChange(currentQuestion.id, option)}
                                >
                                    <span className={cn("flex items-center justify-center w-6 h-6 rounded-md border text-xs font-bold mr-4", isSelected ? "border-violet-500 text-violet-300" : "border-slate-600 text-slate-400")}>{letter}</span>
                                    <span className="text-slate-200">{option}</span>
                                </button>
                            );
                        })}
                        {currentQuestion.type === 'short-answer' && (
                            <div>
                                <label htmlFor="short-answer-input" className="sr-only">Your Answer</label>
                                <Textarea
                                    id="short-answer-input"
                                    className="bg-slate-800/50 border-slate-700 text-slate-200"
                                    placeholder="Type your answer here..."
                                    rows={5}
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <Button 
                            variant="outline" 
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}>
                                Previous
                        </Button>
                        <p className="text-slate-300">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                        {currentQuestionIndex === quiz.questions.length - 1 ? (
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setIsConfirmSubmitOpen(true)}
                                disabled={isSubmitting}
                            >
                                Submit
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                            >
                                Next
                            </Button>
                        )}
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-violet-600 h-2 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Right side: Timer and Question Map */}
            <div className="lg:sticky lg:top-8 space-y-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-300 mb-2">
                        <ClockIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">Time Elapsed</span>
                    </div>
                    <p className="text-4xl font-bold tabular-nums text-white">{minutes}:{seconds}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <h3 className="font-semibold text-white mb-4">Question Map</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {quiz.questions.map((q, index) => {
                            const isAnswered = answers[q.id] !== undefined && answers[q.id].trim() !== '';
                            const hasBeenVisited = visitedQuestions.has(index);
                            const isSkipped = hasBeenVisited && !isAnswered && currentQuestionIndex !== index;
                            
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={cn(
                                        "flex items-center justify-center h-10 rounded-md border font-bold text-sm transition-colors",
                                        currentQuestionIndex === index 
                                            ? "bg-violet-600 border-violet-500 text-white ring-2 ring-offset-2 ring-offset-slate-800 ring-violet-500"
                                            : isAnswered 
                                                ? "bg-green-800 border-green-700 text-green-200"
                                                : isSkipped
                                                    ? "bg-yellow-800 border-yellow-700 text-yellow-200"
                                                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                                    )}
                                    title={
                                        currentQuestionIndex === index ? 'Current' :
                                        isAnswered ? 'Answered' :
                                        isSkipped ? 'Skipped' : 'Not Visited'
                                    }
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                     <div className="mt-4 space-y-2 text-xs text-slate-400">
                        <h4 className="font-semibold text-sm text-white mb-2">Legend</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-800 border border-green-700"></div>Answered</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-800 border border-yellow-700"></div>Skipped</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></div>Not Visited</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-600 border border-violet-500"></div>Current</div>
                        </div>
                    </div>
                </div>
                <Button onClick={() => setIsConfirmSubmitOpen(true)} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-3 h-auto">
                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
            </div>

            {isConfirmSubmitOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md m-4 bg-[#1E293B] border border-slate-700 rounded-2xl text-white p-8 space-y-6 animate-in fade-in-0 zoom-in-95">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangleIcon className="w-8 h-8 text-yellow-400" />
                            </div>
                            <h2 className="text-2xl font-bold">Confirm Submission</h2>
                            <p className="text-slate-300 mt-1">Are you sure you want to submit your answers? This action cannot be undone.</p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="outline" className="w-full" onClick={() => setIsConfirmSubmitOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Yes, Submit Quiz'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);


const PerformanceFeedbackCard: React.FC<{ percentage: number }> = ({ percentage }) => {
    let feedback: { message: string; description: string; icon: React.ReactNode; bgClass: string; };

    if (percentage >= 90) {
        feedback = {
            message: "Excellent Work!",
            description: "You have a strong grasp of the material. Keep up the great momentum!",
            icon: <TrophyIcon className="w-8 h-8 text-yellow-500" />,
            bgClass: "from-green-50 via-yellow-50 to-green-50 dark:from-green-950/50 dark:via-yellow-950/50 dark:to-green-950/50 border-green-200 dark:border-green-800"
        };
    } else if (percentage >= 75) {
        feedback = {
            message: "Great Job!",
            description: "You're doing very well. A quick review of any missed questions will solidify your knowledge.",
            icon: <TrophyIcon className="w-8 h-8 text-green-500" />,
            bgClass: "from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 border-green-200 dark:border-green-800"
        };
    } else if (percentage >= 60) {
        feedback = {
            message: "Good Work!",
            description: "A solid performance. Focus on the areas where you lost points to improve further.",
            icon: <CheckCircle2Icon className="w-8 h-8 text-blue-500" />,
            bgClass: "from-blue-50 to-slate-50 dark:from-blue-950/50 dark:to-slate-900/50 border-blue-200 dark:border-blue-800"
        };
    } else if (percentage >= 40) {
        feedback = {
            message: "Keep Trying, You're Getting There.",
            description: "Some concepts seem tricky. It's a good idea to review the course materials for this topic.",
            icon: <BookOpenIcon className="w-8 h-8 text-orange-500" />,
            bgClass: "from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 border-yellow-200 dark:border-yellow-800"
        };
    } else {
        feedback = {
            message: "Don't Give Up, Review and Retry.",
            description: "This quiz was tough. Re-watching the videos and reading the materials will make a big difference for your next attempt.",
            icon: <XCircleIcon className="w-8 h-8 text-red-500" />,
            bgClass: "from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 border-red-200 dark:border-red-800"
        };
    }

    return (
        <Card className={cn("bg-gradient-to-r", feedback.bgClass)}>
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="shrink-0">{feedback.icon}</div>
                <div>
                    <CardTitle>{feedback.message}</CardTitle>
                    <CardDescription className="mt-1">{feedback.description}</CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
}

export default StudentQuizView;