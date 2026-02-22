
import React, { useState, useEffect, useMemo } from 'react';
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
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

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
                setAttempts(mentorAttempts);
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
            const allLogs = await getActivityLog();
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
            const isRelevant = (newLog.details?.mentorId === user.id) ||
                (newLog.details?.courseId && stats.courses > 0) ||
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
        switch (type) {
            case 'course_create': return <PlusCircleIcon className="w-5 h-5 text-primary" />;
            case 'quiz_create': return <HelpCircleIcon className="w-5 h-5 text-warning" />;
            case 'quiz_submit': return <CheckCircleIcon className="w-5 h-5 text-success" />;
            case 'user_login': return <LogInIcon className="w-5 h-5 text-muted" />;
            default: return <InfoIcon className="w-5 h-5 text-muted" />;
        }
    };

    const dailyActivityData = useMemo(() => {
        const days = 7;
        const data = new Array(days).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            return { date: d.toISOString().split('T')[0], count: 0, displayDate: d.toLocaleDateString('en-US', { weekday: 'short' }) };
        });

        attempts.forEach(a => {
            const dateStr = a.submittedAt.split('T')[0];
            const entry = data.find(d => d.date === dateStr);
            if (entry) entry.count++;
        });

        return data;
    }, [attempts]);


    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="bg-surface overflow-hidden relative border-default">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl flex items-center gap-2 text-main">
                        <SparklesIcon className="w-[26px] h-[26px] text-primary" />
                        <span>Inspire Your Students!</span>
                    </CardTitle>
                    <CardDescription className="text-muted">Manage your courses, create quizzes, and track student progress.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <StatCard icon={<LibraryIcon className="w-[26px] h-[26px] text-primary" />} title="Total Courses" value={stats.courses} />
                <StatCard icon={<FileTextIcon className="w-[26px] h-[26px] text-primary" />} title="Total Quizzes" value={stats.quizzes} />
                <StatCard icon={<UsersIcon className="w-[26px] h-[26px] text-primary" />} title="Engaged Students" value={stats.students} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-surface border-default">
                        <CardHeader>
                            <CardTitle className="text-main">Weekly Student Engagement</CardTitle>
                            <CardDescription className="text-muted">Quiz submissions over the last 7 days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityBarChart data={dailyActivityData} />
                        </CardContent>
                    </Card>

                    <Card className="bg-surface border-default">
                        <CardHeader>
                            <CardTitle className="text-main">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <QuickActionButton to="/mentor/add-course" icon={<PlusCircleIcon className="w-5 h-5 text-primary" />} label="Create Course" />
                            <QuickActionButton to="/mentor/generate-quiz" icon={<HelpCircleIcon className="w-5 h-5 text-secondary" />} label="Create Quiz" />
                            <QuickActionButton to="/mentor/progress" icon={<AreaChartIcon className="w-5 h-5 text-accent" />} label="Analytics" />
                            <QuickActionButton
                                to={firstCourse ? `/mentor/course/${firstCourse.id}?tab=grading` : '#'}
                                icon={<ClipboardEditIcon className="w-5 h-5 text-success" />}
                                label="Grading"
                                disabled={!firstCourse}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex flex-col max-h-[500px] bg-surface border-default">
                    <CardHeader>
                        <CardTitle className="text-main">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto pr-2 custom-scrollbar flex-grow">
                        {recentActivity.length > 0 ? (
                            <ul className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <li key={activity.id} className="flex gap-3">
                                        <div className="mt-1">
                                            <div className="p-2 bg-background rounded-full border border-default">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                        </div>
                                        <div className="pb-2 border-b border-default w-full last:border-0">
                                            <p className="text-sm font-medium text-main">{activity.title}</p>
                                            <p className="text-xs text-muted mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-muted">
                                <InfoIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No recent activity.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
    <Card className="flex items-center p-5 gap-5 hover:shadow-md transition-shadow bg-surface border-default">
        <div className="p-3 bg-primary/10 rounded-xl">{icon}</div>
        <div>
            <dd className="text-2xl font-bold text-main">{value}</dd>
            <dt className="text-sm font-medium text-muted">{title}</dt>
        </div>
    </Card>
);

const QuickActionButton: React.FC<{ to: string; icon: React.ReactNode; label: string; disabled?: boolean }> = ({ to, icon, label, disabled }) => {
    const Content = (
        <div className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-default hover:bg-background transition-all hover:border-primary cursor-pointer h-full bg-surface",
            disabled && "opacity-50 cursor-not-allowed hover:bg-surface hover:border-default"
        )}>
            <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
            <span className="text-sm font-medium text-main">{label}</span>
        </div>
    );

    return disabled ? Content : <Link to={to} className="block h-full">{Content}</Link>;
};

const ActivityBarChart: React.FC<{ data: { displayDate: string, count: number }[] }> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count), 5); // Ensure at least some height

    return (
        <div className="h-[160px] w-full flex items-end justify-between gap-2 pt-4">
            {data.map((d, i) => {
                const barHeight = (d.count / maxCount) * 100;
                return (
                    <div key={i} className="flex flex-col items-center flex-1 group relative">
                        <div className="w-full max-w-[30px] bg-background rounded-t-md relative h-full flex items-end overflow-hidden border border-default border-b-0">
                            <div
                                className="w-full bg-primary rounded-t-sm transition-all duration-500 group-hover:bg-primary/80"
                                style={{ height: `${Math.max(barHeight, 0)}%` }} // Min height for visibility if 0? No, 0 should be empty.
                            ></div>
                        </div>
                        <span className="text-[10px] text-muted mt-2">{d.displayDate}</span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-default text-main text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            {d.count} Submissions
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Icons
const LibraryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
);
const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
);
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const PlusCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);
const HelpCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const LogInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
);
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);
const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z" /><path d="M5 22v-5l-1.9-4.8-4.8-1.9 4.8-1.9L5 5v5" /><path d="M19 22v-5l1.9-4.8 4.8-1.9-4.8-1.9L19 5v5" /></svg>;
const AreaChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 12v5h12V8l-5 5-4-4Z" /></svg>;
const ClipboardEditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M10.4 12.6a2 2 0 0 1 3 3L8 21l-4 1 1-4Z" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5.5" /><path d="M4 13.5V6a2 2 0 0 1 2-2h2" /></svg>;

export default MentorDashboard;
