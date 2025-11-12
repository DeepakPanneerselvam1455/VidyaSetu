import React, { useState, useEffect } from 'react';
// Fix: Update import for react-router-dom v6 to resolve module export error.
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Quiz } from '../../types';
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
    const [isLoading, setIsLoading] = useState(true);
    const [learningSuggestion, setLearningSuggestion] = useState('');
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(true);


    useEffect(() => {
        const fetchAllData = async () => {
            if (!user) return;
            setIsLoading(true);
            setIsSuggestionLoading(true);

            try {
                // Dashboard data
                const [attempts, studentQuizzes, allCourses] = await Promise.all([
                    api.getStudentProgress(user.id),
                    api.getAssignedQuizzesForStudent(user.id),
                    api.getCourses()
                ]);

                // Stats calculation
                const totalScore = attempts.reduce((acc, a) => acc + (a.score / a.totalPoints) * 100, 0);
                setStats({
                    assigned: studentQuizzes.length,
                    completed: attempts.length,
                    progress: attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0,
                });

                // Recent quizzes for dashboard
                const sortedQuizzes = studentQuizzes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setAssignedQuizzes(sortedQuizzes.slice(0, 2));

                // AI Suggestion generation
                if (attempts.length > 0) {
                    const latestAttempt = [...attempts].sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
                    const quiz = await api.getQuizById(latestAttempt.quizId);
                    if (quiz) {
                        const course = await api.getCourseById(quiz.courseId);
                        if (course) {
                            const suggestion = await api.getLearningSuggestion(latestAttempt, quiz, course, allCourses);
                            setLearningSuggestion(suggestion);
                        }
                    }
                } else {
                    setLearningSuggestion("Welcome! Complete your first quiz to get personalized learning suggestions.");
                }

            } catch (error) {
                console.error("Failed to fetch student dashboard data", error);
                setLearningSuggestion("Could not load suggestions.");
            } finally {
                setIsLoading(false);
                setIsSuggestionLoading(false);
            }
        };


        const fetchActivityLog = () => {
             if (!user) return;
             const allLogs = getActivityLog();
             // Filter for this student's activities
             setRecentActivity(allLogs.filter(log => log.details?.studentId === user.id || (log.type === 'user_login' && log.details?.userId === user.id)));
        }
        
        const handleNewLog = (newLog: ActivityLogEntry) => {
            if (!user) return;
            // Add new log if it's relevant to this student
            if (newLog.details?.studentId === user.id || (newLog.type === 'user_login' && newLog.details?.userId === user.id)) {
                 setRecentActivity(prev => [newLog, ...prev].slice(0, 5));
            }
        };

        fetchAllData();
        fetchActivityLog();
        subscribe(handleNewLog);

        return () => unsubscribe(handleNewLog);
    }, [user]);
    
    const getActivityIcon = (type: ActivityLogEntry['type']) => {
        switch(type) {
            case 'quiz_submit': return <CheckIcon className="w-[18px] h-[18px] text-green-500"/>;
            case 'user_login': return <LogInIcon className="w-[18px] h-[18px] text-blue-500"/>;
            default: return <InfoIcon className="w-[18px] h-[18px] text-slate-500"/>;
        }
    };
    
    const getSuggestionIcon = () => {
      if (isSuggestionLoading) return <BotIcon className="w-[30px] h-[30px] text-indigo-500" />;
      const suggestionLower = learningSuggestion.toLowerCase();
      if (suggestionLower.includes('congratulate') || suggestionLower.includes('great job') || suggestionLower.includes('excellent work')) {
          return <RocketIcon className="w-[30px] h-[30px] text-green-500" />;
      }
      if (suggestionLower.includes('review')) {
          return <BookMarkedIcon className="w-[30px] h-[30px] text-amber-500" />;
      }
      return <BotIcon className="w-[30px] h-[30px] text-indigo-500" />;
    };


    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }
    
    const completionPercentage = stats.assigned > 0 ? Math.round((stats.completed / stats.assigned) * 100) : 0;

    return (
        <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-950/50">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <WavingHandIcon className="w-[30px] h-[30px] text-yellow-500" />
                        <span>Welcome, {user?.name}!</span>
                    </CardTitle>
                    <CardDescription>Ready to learn something new today?</CardDescription>
                </CardHeader>
            </Card>
            
            <div className="grid gap-6 md:grid-cols-3">
                <StatCard icon={<BookOpenIcon className="w-[30px] h-[30px] text-purple-500" />} title="Assigned Quizzes" value={stats.assigned} />
                <StatCard icon={<CheckCircleIcon className="w-[30px] h-[30px] text-green-500" />} title="Completed Quizzes" value={stats.completed} />
                <StatCard icon={<TrendingUpIcon className="w-[30px] h-[30px] text-blue-500" />} title="Learning Progress" value={`${stats.progress}%`} />
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TargetIcon className="w-6 h-6 text-violet-500" />
                        <span>Overall Completion Status</span>
                    </CardTitle>
                    <CardDescription>
                        {stats.assigned > 0 
                            ? `You've completed ${stats.completed} of ${stats.assigned} assigned quizzes. Keep it up!`
                            : "No quizzes assigned yet. Get ready for your first challenge!"
                        }
                    </CardDescription>
                </CardHeader>
                {stats.assigned > 0 && (
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                                <div 
                                    className="bg-violet-600 h-4 rounded-full transition-all duration-500 ease-out" 
                                    style={{ width: `${completionPercentage}%` }}>
                                </div>
                            </div>
                            <span className="font-bold text-lg">{completionPercentage}%</span>
                        </div>
                    </CardContent>
                )}
            </Card>

            <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-pink-950/50 border-indigo-200 dark:border-indigo-800">
                <CardHeader className="flex flex-row items-center gap-4">
                    {getSuggestionIcon()}
                    <div>
                        <CardTitle>Your Next Step</CardTitle>
                        <CardDescription>Personalized suggestion from your AI learning assistant.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {isSuggestionLoading ? (
                        <p className="text-slate-600 dark:text-slate-400">Analyzing your progress...</p>
                    ) : (
                        <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{learningSuggestion}</p>
                    )}
                </CardContent>
            </Card>

             <div className="grid gap-6 lg:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>My Assigned Quizzes</CardTitle>
                         <CardDescription>Here are your most recent assignments.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                        {assignedQuizzes.length > 0 ? (
                            assignedQuizzes.map(quiz => (
                                <div key={quiz.id} className="p-4 border rounded-lg flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                    <div>
                                        <h3 className="font-semibold">{quiz.title}</h3>
                                        <p className="text-sm text-slate-500">{quiz.courseTitle} - {quiz.difficulty}</p>
                                    </div>
                                    <Link to={`/student/quiz/${quiz.id}`} className={cn(buttonVariants({ size: 'sm' }))}>Start Quiz</Link>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-4">
                               <CheckCheckIcon className="w-[46px] h-[46px] text-green-500 mb-2" />
                               <p className="font-semibold">All Clear!</p>
                               <p className="text-slate-500 dark:text-slate-400 text-sm">You have no pending quizzes. Great job!</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Link to="/student/quizzes" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>View All Assigned Quizzes</Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <ul className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <li key={activity.id} className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-200">{activity.title}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{formatTimeAgo(activity.timestamp)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No recent activity.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const StatCard: React.FC<{icon: React.ReactNode; title: string; value: string | number}> = ({ icon, title, value }) => (
    <Card className="flex items-center p-6 gap-6">
        <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">{icon}</div>
        <div>
            <dd className="text-3xl font-bold">{value}</dd>
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</dt>
        </div>
    </Card>
);

// Icons
const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const LogInIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
);
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);
const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);
// FIX: Replace truncated WavingHandIcon and add missing icon definitions.
const WavingHandIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.33 13.93a3.48 3.48 0 0 0 0-4.93l-4.24-4.24a3.48 3.48 0 0 0-4.93 0L3 12l7.16 7.16a3.48 3.48 0 0 0 4.93 0l4.24-4.23Z" /><path d="M12.33 11.25 14.5 9.08" /><path d="m15.16 8.42 2.12-2.12" /><path d="m18 5.58 2.12-2.12" /></svg>;
const RocketIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2 2 0 0 0-2.83-2.83c-.8.61-2.26.62-3.1.09z"/><path d="m12 15-3-3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2l-3 3"/><path d="M19 6c-1 1-2 2-2 4"/><path d="M22 4s-1 1-2 2"/></svg>;
const BookMarkedIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><polyline points="10 2 10 10 14 7 18 10 18 2"/></svg>;
const TargetIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const CheckCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>;

// FIX: Add default export to resolve import error in App.tsx.
export default StudentDashboard;