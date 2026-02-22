import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Quiz, QuizAttempt, Course } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { buttonVariants } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { ActivityLogEntry, subscribe, unsubscribe, getActivityLog, formatTimeAgo } from '../../lib/activityLog';
import { BookOpen, CheckCircle, TrendingUp, Check, LogIn, Info, Sparkles, ClipboardList } from '../../components/ui/Icons';


interface QuizWithCourse extends Quiz {
    courseTitle: string;
}

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ assigned: 0, completed: 0, progress: 0 });
    const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
    const [assignedQuizzes, setAssignedQuizzes] = useState<QuizWithCourse[]>([]);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [learningSuggestion, setLearningSuggestion] = useState('');
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(true);


    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchCoreData = async () => {
            if (!user) return;
            setIsLoading(true);
            setError(null);

            try {
                // Critical Data Fetch with Timeout
                const fetchPromise = Promise.all([
                    api.getStudentProgress(user.id),
                    api.getAssignedQuizzesForStudent(user.id),
                    api.getCourses()
                ]);

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Gateway Timeout')), 8000)
                );

                const [userAttempts, studentQuizzes, allCourses] = await Promise.race([
                    fetchPromise,
                    timeoutPromise
                ]) as [QuizAttempt[], Quiz[], Course[]];

                if (!isMounted) return;

                setAttempts(userAttempts);

                const totalScore = userAttempts.reduce((acc, a) => acc + (a.score / a.totalPoints) * 100, 0);
                setStats({
                    assigned: studentQuizzes.length,
                    completed: userAttempts.length,
                    progress: userAttempts.length > 0 ? Math.round(totalScore / userAttempts.length) : 0,
                });

                const courseMap = new Map(allCourses.map((c: Course) => [c.id, c.title]));
                const enrichedQuizzes = studentQuizzes.map((q: Quiz) => ({
                    ...q,
                    courseTitle: courseMap.get(q.courseId) || 'Unknown Course'
                }));

                const sortedQuizzes = enrichedQuizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setAssignedQuizzes(sortedQuizzes.slice(0, 3));

                // Trigger AI Insights separately after core data
                if (userAttempts.length > 0) {
                    fetchInsights(userAttempts, allCourses);
                } else {
                    setLearningSuggestion("Welcome! Complete your first assessment to unlock personalized AI learning pathways.");
                    setIsSuggestionLoading(false);
                }

            } catch (error) {
                console.error("Failed to fetch student dashboard data", error);
                if (isMounted) setError("Failed to load dashboard data. Please try again.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        const fetchInsights = async (userAttempts: QuizAttempt[], allCourses: Course[]) => {
            if (!isMounted) return;
            setIsSuggestionLoading(true);
            try {
                const latestAttempt = [...userAttempts].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
                const quiz = await api.getQuizById(latestAttempt.quizId);

                if (quiz) {
                    const course = await api.getCourseById(quiz.courseId);
                    if (course) {
                        // AI Call - Independent, does not block dashboard
                        const suggestion = await api.getLearningSuggestion(latestAttempt, quiz, course, allCourses);
                        if (isMounted) setLearningSuggestion(suggestion);
                    }
                }
            } catch (err) {
                console.warn("AI Suggestion failed silently:", err);
                if (isMounted) setLearningSuggestion("Continue exploring advanced topics in your current courses.");
            } finally {
                if (isMounted) setIsSuggestionLoading(false);
            }
        };

        const fetchActivityLog = async () => {
            if (!user) return;
            try {
                const allLogs = await getActivityLog();
                if (isMounted) {
                    setRecentActivity(allLogs.filter(log => log.details?.studentId === user.id || (log.type === 'user_login' && log.details?.userId === user.id)).slice(0, 8));
                }
            } catch (e) {
                console.error("Failed to fetch activity log", e);
            }
        }

        const handleNewLog = (newLog: ActivityLogEntry) => {
            if (!user) return;
            if (newLog.details?.studentId === user.id || (newLog.type === 'user_login' && newLog.details?.userId === user.id)) {
                setRecentActivity(prev => [newLog, ...prev].slice(0, 8));
            }
        };

        fetchCoreData();
        fetchActivityLog();
        subscribe(handleNewLog);

        return () => {
            isMounted = false;
            unsubscribe(handleNewLog);
        };
    }, [user]);

    const getActivityIcon = (type: ActivityLogEntry['type']) => {
        switch (type) {
            case 'quiz_submit': return <Check className="w-[18px] h-[18px]" style={{ color: 'var(--color-success)' }} />;
            case 'user_login': return <LogIn className="w-[18px] h-[18px]" style={{ color: 'var(--primary)' }} />;
            default: return <Info className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />;
        }
    };

    const chartData = useMemo(() => {
        return attempts
            .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
            .slice(-10)
            .map(attempt => ({
                score: Math.round((attempt.score / attempt.totalPoints) * 100),
                date: new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }));
    }, [attempts]);


    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-8 space-y-4">
                <p className="text-red-500 font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>Student Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}. Here's your progress overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={<BookOpen className="w-6 h-6" style={{ color: 'var(--primary)' }} />}
                    title="Enrolled Courses"
                    value={stats.assigned}
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6" style={{ color: 'var(--accent-progress, var(--primary))' }} />}
                    title="Completed Quizzes"
                    value={stats.completed}
                />
                <StatCard
                    icon={<TrendingUp className="w-6 h-6" style={{ color: 'var(--accent-badge, var(--accent-secondary))' }} />}
                    title="Average Score"
                    value={`${stats.progress}%`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="ai-card-glow" hover={false}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                                AI Learning Suggestion
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isSuggestionLoading ? (
                                <p style={{ color: 'var(--text-secondary)' }}>Analyzing performance...</p>
                            ) : (
                                <p className="text-lg font-medium" style={{ color: 'var(--text-main)' }}>
                                    "{learningSuggestion}"
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Performance History</CardTitle>
                            <CardDescription>Your score trend over the last 10 quizzes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScoreTrendChart data={chartData} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentActivity.length > 0 ? (
                                <ul className="space-y-4">
                                    {recentActivity.map((activity) => (
                                        <li key={activity.id} className="flex gap-3">
                                            <div className="mt-1">
                                                <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>{activity.title}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatTimeAgo(activity.timestamp)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>No recent activity.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Assigned Quizzes</h2>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {assignedQuizzes.length > 0 ? (
                        assignedQuizzes.map(quiz => (
                            <Card key={quiz.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                                        <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: 'var(--kpi-icon-chip)', color: 'var(--text-secondary)' }}>{quiz.difficulty}</span>
                                    </div>
                                    <CardDescription>{quiz.courseTitle}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        <ClipboardList className="w-4 h-4" />
                                        <span>{quiz.questions.length} Questions</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Link
                                        to={`/student/quiz/${quiz.id}`}
                                        className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'w-full')}
                                    >
                                        Take Quiz
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg empty-state">
                            <p style={{ color: 'var(--text-secondary)' }}>No quizzes assigned yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
    <Card className="flex items-center p-6 gap-4 card-themed">
        <div className="p-3 rounded-lg kpi-icon-chip">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{value}</p>
        </div>
    </Card>
);

const ScoreTrendChart: React.FC<{ data: { score: number, date: string }[] }> = ({ data }) => {
    if (data.length < 2) {
        return (
            <div className="h-40 flex items-center justify-center border border-dashed rounded-lg" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)' }}>
                <p className="text-sm">Not enough data to show trend.</p>
            </div>
        );
    }

    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 200;
    const PADDING = 20;

    const points = data.map((d, i) => {
        const x = PADDING + (i / (data.length - 1)) * (SVG_WIDTH - 2 * PADDING);
        const y = (SVG_HEIGHT - PADDING) - (d.score / 100) * (SVG_HEIGHT - 2 * PADDING);
        return `${x},${y}`;
    }).join(' ');

    // Use CSS variables for chart colors - teal line with purple markers for student
    return (
        <div className="w-full h-40">
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full overflow-visible">
                <polyline points={points} fill="none" stroke="var(--chart-line, var(--primary))" strokeWidth="3" />
                {data.map((d, i) => {
                    const x = PADDING + (i / (data.length - 1)) * (SVG_WIDTH - 2 * PADDING);
                    const y = (SVG_HEIGHT - PADDING) - (d.score / 100) * (SVG_HEIGHT - 2 * PADDING);
                    return <circle key={i} cx={x} cy={y} r="4" fill="var(--card-bg)" stroke="var(--chart-marker, var(--accent-badge, #7B1FA2))" strokeWidth="2" />;
                })}
            </svg>
        </div>
    );
};

export default StudentDashboard;
