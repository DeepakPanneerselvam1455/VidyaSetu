
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { isDemoMode } from '../lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import ChatBot from './ChatBot';

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);

const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const LayoutDashboardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ClipboardListIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const VideoIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>;
const MessageCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;
const HeartHandshakeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.28 3.6-1.28 5.1 0 1.26 1.08 1.26 2.83 0 3.91l-1.71 1.47a6.5 6.5 0 0 1-9.5 0L12.59 19c-1.26-1.08-1.26-2.83 0-3.91 1.5-1.28 3.6-1.28 5.1 0Z"/><path d="M7 14c-1.49-1.28-3.6-1.28-5.1 0-1.26 1.08-1.26 2.83 0 3.91l1.71 1.47a6.5 6.5 0 0 0 9.5 0L11.41 19c1.26-1.08 1.26-2.83 0-3.91-1.5-1.28-3.6-1.28-5.1 0Z"/><path d="M12 22v-4"/><path d="M12 14c4.42 0 8-3.58 8-8a8 8 0 0 0-16 0c0 4.42 3.58 8 8 8Z"/></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const GenerateQuizIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <path d="m12 14.3-1.45 1.05.5-1.7-1.3-1.2h1.7L12 10l.55 2.45h1.7l-1.3 1.2.5 1.7L12 14.3z" />
    </svg>
);
const FileAnalyticsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-4"/><path d="M8 18v-2"/><path d="M16 18v-6"/></svg>;
const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const ShieldXIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/></svg>;
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;

const iconClass = "w-[18px] h-[18px] mr-3 shrink-0";

const navConfig = {
    student: {
        title: 'Student Dashboard',
        links: [
            { to: '/student', label: 'Dashboard', icon: <LayoutDashboardIcon className={iconClass} /> },
            { to: '/student/my-courses', label: 'My Courses', icon: <BookOpenIcon className={iconClass} /> },
            { to: '/student/quizzes', label: 'Take Quiz', icon: <ClipboardListIcon className={iconClass} /> },
            { to: '/student/progress', label: 'Progress', icon: <TrendingUpIcon className={iconClass} /> },
            { to: '/student/tutoring', label: 'Virtual Tutoring', icon: <VideoIcon className={iconClass} /> },
            { to: '/student/mentorship', label: 'Find a Mentor', icon: <HeartHandshakeIcon className={iconClass} /> },
            { to: '/forums', label: 'Community Forums', icon: <MessageCircleIcon className={iconClass} /> },
        ]
    },
    mentor: {
        title: 'Instructor Dashboard',
        links: [
            { to: '/mentor', label: 'Dashboard', icon: <LayoutDashboardIcon className={iconClass} /> },
            { to: '/mentor/courses', label: 'My Courses', icon: <BookOpenIcon className={iconClass} /> },
            { to: '/mentor/add-course', label: 'Add Course', icon: <PlusIcon className={iconClass} /> },
            { to: '/mentor/generate-quiz', label: 'Generate Quiz', icon: <GenerateQuizIcon className={iconClass} /> },
            { to: '/mentor/progress', label: 'Student Progress', icon: <UsersIcon className={iconClass} /> },
            { to: '/mentor/tutoring', label: 'Tutoring', icon: <VideoIcon className={iconClass} /> },
            { to: '/mentor/mentorship', label: 'Mentorship', icon: <HeartHandshakeIcon className={iconClass} /> },
            { to: '/forums', label: 'Community Forums', icon: <MessageCircleIcon className={iconClass} /> },
        ]
    },
    admin: {
        title: 'Admin Dashboard',
        links: [
            { to: '/admin', label: 'Dashboard', icon: <LayoutDashboardIcon className={iconClass} /> },
            { to: '/admin/users', label: 'Manage Users', icon: <UsersIcon className={iconClass} /> },
            { to: '/admin/analytics', label: 'Course Analytics', icon: <BarChartIcon className={iconClass} /> },
            { to: '/admin/progress', label: 'Student Progress', icon: <TrendingUpIcon className={iconClass} /> },
            { to: '/admin/reports', label: 'Reports', icon: <FileAnalyticsIcon className={iconClass} /> },
            { to: '/admin/settings', label: 'Settings', icon: <SettingsIcon className={iconClass} /> },
            { to: '/admin/moderation', label: 'Moderation', icon: <ShieldCheckIcon className={iconClass} /> },
            { to: '/admin/security', label: 'Security', icon: <ShieldXIcon className={iconClass} /> },
            { to: '/forums', label: 'Forums (Moderate)', icon: <MessageCircleIcon className={iconClass} /> },
        ]
    }
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isDemo, setIsDemo] = useState(isDemoMode());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleDemoMode = () => setIsDemo(true);
        window.addEventListener('skillforge_demo_mode_active', handleDemoMode);
        return () => window.removeEventListener('skillforge_demo_mode_active', handleDemoMode);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const role = user?.role || 'student';
    const config = navConfig[role as keyof typeof navConfig] || navConfig.student;

    const SidebarContent = () => (
        <>
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    SkillForge
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                    {config.title}
                </p>
            </div>
            
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
                {config.links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )
                        }
                    >
                        {link.icon}
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </>
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-50 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div 
                  className="w-72 h-full bg-white dark:bg-slate-900 animate-in slide-in-from-left duration-300 flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-end p-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                      <XIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  <SidebarContent />
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-8">
                    <div className="flex-1 flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="md:hidden" 
                          onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <MenuIcon className="w-6 h-6" />
                        </Button>
                        
                        {isDemo && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800/50">
                                <InfoIcon className="w-3.5 h-3.5" />
                                <span>Demo Mode (Local Storage)</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">{user?.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-none">{user?.email}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-sm ring-2 ring-white dark:ring-slate-900 shadow-sm">
                                {user?.name?.charAt(0) || '?'}
                            </div>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                                        <ChevronDownIcon className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                        {theme === 'dark' ? (
                                            <div className="flex items-center"><SunIcon className="mr-2 h-4 w-4" /> Light Mode</div>
                                        ) : (
                                            <div className="flex items-center"><MoonIcon className="mr-2 h-4 w-4" /> Dark Mode</div>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto p-6 md:p-8 max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
            
            <ChatBot />
        </div>
    );
};

export default Layout;
