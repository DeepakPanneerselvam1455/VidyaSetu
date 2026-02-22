import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ActivityLogEntry, subscribe, unsubscribe, getActivityLog, formatTimeAgo } from '../../lib/activityLog';
import { cn } from '../../lib/utils';
import { Users, GraduationCap, Presentation, Shield, Library, FileQuestion, UserPlus, BookUp, FileCheck, LogIn, UserMinus, Info, PlusCircle, FileBarChart, Settings, ShieldCheck, ShieldX } from '../../components/ui/Icons';

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

        const fetchActivityLog = async () => {
            setRecentActivity(await getActivityLog());
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
            case 'user_create': return <UserPlus className="w-[18px] h-[18px]" style={{ color: 'var(--primary)' }} />;
            case 'course_create': return <BookUp className="w-[18px] h-[18px]" style={{ color: 'var(--color-success)' }} />;
            case 'quiz_submit': return <FileCheck className="w-[18px] h-[18px]" style={{ color: 'var(--accent-secondary)' }} />;
            case 'user_login': return <LogIn className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />;
            case 'user_delete': return <UserMinus className="w-[18px] h-[18px]" style={{ color: 'var(--color-error)' }} />;
            default: return <Info className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />;
        }
    };


    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <Card hover={false}>
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome to the Admin Panel!</CardTitle>
                    <CardDescription>Manage users, courses, and system settings.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
                <StatCard icon={<Users className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Total Users" value={stats.users} />
                <StatCard icon={<GraduationCap className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Students" value={stats.students} />
                <StatCard icon={<Presentation className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Instructors" value={stats.mentors} />
                <StatCard icon={<Shield className="w-[22px] h-[22px]" style={{ color: 'var(--accent-neutral, var(--accent-secondary))' }} />} title="Admins" value={stats.admins} />
                <StatCard icon={<Library className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Total Courses" value={stats.courses} />
                <StatCard icon={<FileQuestion className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Total Quizzes" value={stats.quizzes} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/users/create"><UserPlus className="w-[14px] h-[14px]" />Add User</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/analytics"><PlusCircle className="w-[14px] h-[14px]" />Create Course</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/reports"><FileBarChart className="w-[14px] h-[14px]" />View Reports</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/settings"><Settings className="w-[14px] h-[14px]" />Settings</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/moderation"><ShieldCheck className="w-[14px] h-[14px]" />Moderation</Link></Button>
                        <Button asChild className="flex items-center gap-2"><Link to="/admin/security"><ShieldX className="w-[14px] h-[14px]" />Security</Link></Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Recent System Activity</CardTitle></CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <ul className="space-y-4">
                                {recentActivity.slice(0, 5).map((activity) => (
                                    <li key={activity.id} className="flex items-start gap-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                                        <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--card-bg)' }}>{getActivityIcon(activity.type)}</div>
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--text-main)' }}>{activity.title}</p>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatTimeAgo(activity.timestamp)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>No system activity yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
};


const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
    <Card className="flex flex-col items-center text-center p-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--kpi-icon-chip)', border: '1px solid var(--kpi-icon-chip-border, var(--border-default))' }}>{icon}</div>
        <dd className="text-3xl font-bold mt-2" style={{ color: 'var(--text-heading, var(--text-main))' }}>{value}</dd>
        <dt className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</dt>
    </Card>
);

export default AdminDashboard;
