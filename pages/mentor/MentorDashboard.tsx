
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import * as api from '../../lib/api';
import { Course, Quiz, QuizAttempt, User } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button, buttonVariants } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ActivityLogEntry, subscribe, unsubscribe, getActivityLog, formatTimeAgo } from '../../lib/activityLog';
import { cn } from '../../lib/utils';

const MentorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ courses: 0, quizzes: 0, students: 0 });
    const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [firstCourse, setFirstCourse] = useState<Course | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const allCourses = await api.getCourses();
                const mentorCourses = allCourses.filter(c => c.mentorId === user.id);
                if (mentorCourses.length > 0) {
                    setFirstCourse(mentorCourses[0]);
                }

                const mentorQuizzes: Quiz[] = (await Promise.all(mentorCourses.map(c => api.getQuizzesByCourse(c.id)))).flat();
                const mentorQuizIds = new Set(mentorQuizzes.map(q => q.id));

                const allAttempts = await api.getAllAttempts();
                const mentorAttempts = allAttempts.filter(a => mentorQuizIds.has(a.quizId));
                const studentIds = new Set(mentorAttempts.map(a => a.studentId));

                setStats({
                    courses: mentorCourses.length,
                    quizzes: mentorQuizzes.length,
                    students: studentIds.size,
                });
                
            } catch (error) {
                console.error("Failed to fetch instructor dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchActivityLog = async () => {
            if (!user) return;
            const allLogs = getActivityLog();
            const allCourses = await api.getCourses();
            const mentorCourseIds = new Set(allCourses.filter(c => c.mentorId === user.id).map(c => c.id));
            
            setRecentActivity(allLogs.filter(log => 
                (log.details?.mentorId === user.id) || 
                (log.details?.courseId && mentorCourseIds.has(log.details.courseId)) ||
                (log.type === 'user_login' && log.details?.userId === user.id)
            ));
        };

        const handleNewLog = (newLog: ActivityLogEntry) => {
             if (!user) return;
             // A bit more complex logic to check relevance for mentor
             const isRelevant = (newLog.details?.mentorId === user.id) || 
                                (newLog.details?.courseId && stats.courses > 0) || // simplified check
                                (newLog.type === 'user_login' && newLog.details?.userId === user.id);

             if (isRelevant) {
                 setRecentActivity(prev => [newLog, ...prev].slice(0, 5));
             }
        };

        fetchData();
        fetchActivityLog();
        subscribe(handleNewLog);

        return () => unsubscribe(handleNewLog);
    }, [user, stats.courses]);
    
    const getActivityIcon = (type: ActivityLogEntry['type']) => {
        switch(type) {
            case 'course_create': return <PlusCircleIcon className="w-[18px] h-[18px] text-blue-500"/>;
            case 'quiz_create': return <HelpCircleIcon className="w-[18px] h-[18px] text-orange-500"/>;
            case 'quiz_submit': return <CheckCircleIcon className="w-[18px] h-[18px] text-green-500"/>;
            case 'user_login': return <LogInIcon className="w-[18px] h-[18px] text-slate-500"/>;
            default: return <InfoIcon className="w-[18px] h-[18px] text-slate-500"/>;
        }
    };


    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
             <Card className="bg-white dark:bg-slate-950/50">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <SparklesIcon className="w-[26px] h-[26px] text-indigo-500" />
                        <span>Inspire Your Students!</span>
                    </CardTitle>
                    <CardDescription>Manage your courses, create quizzes, and track student progress.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <StatCard icon={<LibraryIcon className="w-[30px] h-[30px] text-blue-500" />} title="Total Courses" value={stats.courses} />
                <StatCard icon={<FileTextIcon className="w-[30px] h-[30px] text-orange-500" />} title="Total Quizzes" value={stats.quizzes} />
                <StatCard icon={<UsersIcon className="w-[30px] h-[30px] text-green-500" />} title="Engaged Students" value={stats.students} />
            </div>
            
            <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/mentor/add-course" className={cn(buttonVariants({ variant: 'outline' }), "flex items-center justify-center gap-2")}><PlusCircleIcon className="w-[14px] h-[14px]"/>Create Course</Link>
                    <Link to="/mentor/generate-quiz" className={cn(buttonVariants({ variant: 'outline' }), "flex items-center justify-center gap-2")}><HelpCircleIcon className="w-[14px] h-[14px]"/>Create Quiz</Link>
                    <Link to="/mentor/progress" className={cn(buttonVariants({ variant: 'outline' }), "flex items-center justify-center gap-2")}><AreaChartIcon className="w-[14px] h-[14px]"/>View Analytics</Link>
                    {firstCourse ? (
                        <Link to={`/mentor/course/${firstCourse.id}?tab=grading`} className={cn(buttonVariants({ variant: 'outline' }), "flex items-center justify-center gap-2")}>
                            <ClipboardEditIcon className="w-[14px] h-[14px]" /> Grade Submissions
                        </Link>
                    ) : (
                        <Button variant="outline" disabled className="flex items-center justify-center gap-2" title="Create a course to enable grading">
                            <ClipboardEditIcon className="w-[14px] h-[14px]" /> Grade Submissions
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentActivity.length > 0 ? (
                        <ul className="space-y-4">
                            {recentActivity.map((activity) => (
                               <li key={activity.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full">
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
const LibraryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
);
const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const PlusCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
);
const HelpCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const LogInIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
);
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/><path d="M5 22v-5l-1.9-4.8-4.8-1.9 4.8-1.9L5 5v5"/><path d="M19 22v-5l1.9-4.8 4.8-1.9-4.8-1.9L19 5v5"/></svg>;
const AreaChartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 12v5h12V8l-5 5-4-4Z"/></svg>;
const ClipboardEditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M10.4 12.6a2 2 0 0 1 3 3L8 21l-4 1 1-4Z"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5.5"/><path d="M4 13.5V6a2 2 0 0 1 2-2h2"/></svg>;

export default MentorDashboard;
