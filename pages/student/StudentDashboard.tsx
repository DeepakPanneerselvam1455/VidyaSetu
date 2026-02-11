
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Quiz, QuizAttempt, Course } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { buttonVariants } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { ActivityLogEntry, subscribe, unsubscribe, getActivityLog, formatTimeAgo } from '../../lib/activityLog';


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


    useEffect(() => {
        const fetchAllData = async () => {
            if (!user) return;
            setIsLoading(true);
            setIsSuggestionLoading(true);

            try {
                const [userAttempts, studentQuizzes, allCourses] = await Promise.all([
                    api.getStudentProgress(user.id),
                    api.getAssignedQuizzesForStudent(user.id),
                    api.getCourses()
                ]);

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

                const sortedQuizzes = enrichedQuizzes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setAssignedQuizzes(sortedQuizzes.slice(0, 3));

                if (userAttempts.length > 0) {
                    const latestAttempt = [...userAttempts].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
                    const quiz = await api.getQuizById(latestAttempt.quizId);
                    if (quiz) {
                        const course = await api.getCourseById(quiz.courseId);
                        if (course) {
                            try {
                                const suggestion = await api.getLearningSuggestion(latestAttempt, quiz, course, allCourses);
                                setLearningSuggestion(suggestion);
                            } catch {
                                setLearningSuggestion("Continue exploring advanced topics in your current courses.");
                            }
                        }
                    }
                } else {
                    setLearningSuggestion("Welcome! Complete your first assessment to unlock personalized AI learning pathways.");
                }

            } catch (error) {
                console.error("Failed to fetch student dashboard data", error);
                setLearningSuggestion("Unable to load insights at this moment.");
            } finally {
                setIsLoading(false);
                setIsSuggestionLoading(false);
            }
        };


        const fetchActivityLog = async () => {
            if (!user) return;
            const allLogs = await getActivityLog();
            setRecentActivity(allLogs.filter(log => log.details?.studentId === user.id || (log.type === 'user_login' && log.details?.userId === user.id)).slice(0, 8));
        }

        const handleNewLog = (newLog: ActivityLogEntry) => {
            if (!user) return;
            if (newLog.details?.studentId === user.id || (newLog.type === 'user_login' && newLog.details?.userId === user.id)) {
                setRecentActivity(prev => [newLog, ...prev].slice(0, 8));
            }
        };

        fetchAllData();
        fetchActivityLog();
        subscribe(handleNewLog);

        return () => unsubscribe(handleNewLog);
    }, [user]);

    const getActivityIcon = (type: ActivityLogEntry['type']) => {
        switch (type) {
            case 'quiz_submit': return <CheckIcon className="w-[18px] h-[18px] text-green-500" />;
            case 'user_login': return <LogInIcon className="w-[18px] h-[18px] text-blue-500" />;
            default: return <InfoIcon className="w-[18px] h-[18px] text-slate-500" />;
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">Welcome back, {user?.name}. Here's your progress overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={<BookOpenIcon className="w-6 h-6 text-violet-500" />}
                    title="Enrolled Courses"
                    value={stats.assigned}
                />
                <StatCard
                    icon={<CheckCircleIcon className="w-6 h-6 text-emerald-500" />}
                    title="Completed Quizzes"
                    value={stats.completed}
                />
                <StatCard
                    icon={<TrendingUpIcon className="w-6 h-6 text-sky-500" />}
                    title="Average Score"
                    value={`${stats.progress}%`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-indigo-500" />
                                AI Learning Suggestion
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isSuggestionLoading ? (
                                <p className="text-slate-500">Analyzing performance...</p>
                            ) : (
                                <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
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
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{formatTimeAgo(activity.timestamp)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 text-sm text-center py-4">No recent activity.</p>
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
                                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">{quiz.difficulty}</span>
                                    </div>
                                    <CardDescription>{quiz.courseTitle}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <ClipboardListIcon className="w-4 h-4" />
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
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                            <p className="text-slate-500">No quizzes assigned yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
    <Card className="flex items-center p-6 gap-4">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </Card>
);

const ScoreTrendChart: React.FC<{ data: { score: number, date: string }[] }> = ({ data }) => {
    if (data.length < 2) {
        return (
            <div className="h-40 flex items-center justify-center text-slate-400 border border-dashed rounded-lg border-slate-300 dark:border-slate-700">
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

    return (
        <div className="w-full h-40">
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full overflow-visible">
                <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="3" />
                {data.map((d, i) => {
                    const x = PADDING + (i / (data.length - 1)) * (SVG_WIDTH - 2 * PADDING);
                    const y = (SVG_HEIGHT - PADDING) - (d.score / 100) * (SVG_HEIGHT - 2 * PADDING);
                    return <circle key={i} cx={x} cy={y} r="4" className="fill-white stroke-indigo-500 stroke-2" />;
                })}
            </svg>
        </div>
    );
};

const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const LogInIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
);
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);
const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z" /><path d="M5 22v-5l-1.9-4.8-4.8-1.9 4.8-1.9L5 5v5" /><path d="M19 22v-5l1.9-4.8 4.8-1.9-4.8-1.9L19 5v5" /></svg>;
const ClipboardListIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>;

export default StudentDashboard;
