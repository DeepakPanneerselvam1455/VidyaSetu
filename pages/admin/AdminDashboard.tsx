
import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ActivityLogEntry, subscribe, unsubscribe, getActivityLog, formatTimeAgo } from '../../lib/activityLog';
import { cn } from '../../lib/utils';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ users: 0, mentors: 0, students: 0, admins: 0, courses: 0, quizzes: 0 });
    const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [users, courses, quizzes] = await Promise.all([
                    api.getUsers(),
                    api.getCourses(),
                    api.getCourses().then(courses => Promise.all(courses.map(c => api.getQuizzesByCourse(c.id)))).then(quizzes => quizzes.flat()),
                ]);

                setStats({
                    users: users.length,
                    mentors: users.filter(u => u.role === 'mentor').length,
                    students: users.filter(u => u.role === 'student').length,
                    admins: users.filter(u => u.role === 'admin').length,
                    courses: courses.length,
                    quizzes: quizzes.length,
                });

            } catch (error) {
                console.error("Failed to fetch admin dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        const fetchActivityLog = () => {
            setRecentActivity(getActivityLog());
        };

        const handleNewLog = (newLog: ActivityLogEntry) => {
            setRecentActivity(prev => [newLog, ...prev].slice(0, 10)); // Keep it capped
        };

        fetchDashboardData();
        fetchActivityLog();
        subscribe(handleNewLog);
        
        return () => unsubscribe(handleNewLog);
    }, []);

    const getActivityIcon = (type: ActivityLogEntry['type']) => {
        switch (type) {
            case 'user_create': return <UserPlusIcon className="w-[18px] h-[18px] text-blue-500" />;
            case 'course_create': return <BookUpIcon className="w-[18px] h-[18px] text-green-500" />;
            case 'quiz_submit': return <FileCheckIcon className="w-[18px] h-[18px] text-indigo-500" />;
            case 'user_login': return <LogInIcon className="w-[18px] h-[18px] text-slate-500" />;
            case 'user_delete': return <UserMinusIcon className="w-[18px] h-[18px] text-red-500" />;
            default: return <InfoIcon className="w-[18px] h-[18px] text-gray-500" />;
        }
    };


    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-950/50">
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome to the Admin Panel!</CardTitle>
                    <CardDescription>Manage users, courses, and system settings.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
                <StatCard icon={<UsersIcon className="w-[22px] h-[22px] text-indigo-500" />} title="Total Users" value={stats.users} />
                <StatCard icon={<GraduationCapIcon className="w-[22px] h-[22px] text-indigo-500" />} title="Students" value={stats.students} />
                <StatCard icon={<PresentationIcon className="w-[22px] h-[22px] text-indigo-500" />} title="Instructors" value={stats.mentors} />
                <StatCard icon={<ShieldIcon className="w-[22px] h-[22px] text-indigo-500" />} title="Admins" value={stats.admins} />
                <StatCard icon={<LibraryIcon className="w-[22px] h-[22px] text-indigo-500" />} title="Total Courses" value={stats.courses} />
                <StatCard icon={<FileQuestionIcon className="w-[22px] h-[22px] text-indigo-500" />} title="Total Quizzes" value={stats.quizzes} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/users/create"><UserPlusIcon className="w-[14px] h-[14px]"/>Add User</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/analytics"><PlusCircleIcon className="w-[14px] h-[14px]" />Create Course</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/reports"><FileBarChartIcon className="w-[14px] h-[14px]" />View Reports</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/settings"><SettingsIcon className="w-[14px] h-[14px]" />Settings</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/moderation"><ShieldCheckIcon className="w-[14px] h-[14px]" />Moderation</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/security"><ShieldXIcon className="w-[14px] h-[14px]" />Security</Link></Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Recent System Activity</CardTitle></CardHeader>
                    <CardContent>
                       {recentActivity.length > 0 ? (
                            <ul className="space-y-4">
                                {recentActivity.slice(0, 5).map((activity) => (
                                    <li key={activity.id} className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full">{getActivityIcon(activity.type)}</div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-200">{activity.title}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{formatTimeAgo(activity.timestamp)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-slate-500 dark:text-slate-400 text-center py-4">No system activity yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
};


const StatCard: React.FC<{icon: React.ReactNode; title: string; value: string | number}> = ({ icon, title, value }) => (
    <Card className="flex flex-col items-center text-center p-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">{icon}</div>
        <dd className="text-3xl font-bold mt-2">{value}</dd>
        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</dt>
    </Card>
);

// Icons
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const GraduationCapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const PresentationIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="M7 21h10"/><path d="M12 16v5"/></svg>;
const ShieldIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const LibraryIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>;
const FileQuestionIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M10 10.3c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2"/><path d="M12 17h.01"/></svg>;
const UserPlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
const BookUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v14H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M12 13V7"/><path d="m9 10 3-3 3 3"/></svg>;
const FileCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>;
const LogInIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
const UserMinusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
const FileBarChartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M8 18v-1"/><path d="M16 18v-3"/></svg>;
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const ShieldXIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/></svg>;

export default AdminDashboard;
