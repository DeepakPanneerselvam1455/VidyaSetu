import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, CourseMaterial } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { Input } from '../../components/ui/Input';

// --- ICONS ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const SearchXIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="14" y1="8" x2="8" y2="14"/><line x1="8" y1="8" x2="14" y2="14"/></svg>;
const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>;
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>;
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>;
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;
const ChatBubbleLeftRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.75 6.75 0 006.75-6.75v-2.5a.75.75 0 011.5 0v2.5a8.25 8.25 0 01-8.25 8.25c-1.255 0-2.443-.28-3.527-.786a.75.75 0 01.277-1.455zM19.25 10.5a.75.75 0 000-1.5h-2.5a.75.75 0 000 1.5h2.5z" clipRule="evenodd" /><path d="M14.25 6a.75.75 0 000-1.5h-2.5a.75.75 0 000 1.5h2.5z" /><path fillRule="evenodd" d="M12 2.25a8.25 8.25 0 00-8.25 8.25v2.5a.75.75 0 001.5 0v-2.5a6.75 6.75 0 016.75-6.75c1.255 0 2.443.28 3.527.786a.75.75 0 10.554-1.392A9.707 9.707 0 0012 2.25z" clipRule="evenodd" /><path d="M15.75 9a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z" /></svg>;

// --- HELPER COMPONENTS ---
const getMaterialIcon = (type: CourseMaterial['type']) => {
    switch(type) {
        case 'link': return <LinkIcon className="w-5 h-5 text-blue-400 shrink-0" />;
        case 'pdf': return <FileTextIcon className="w-5 h-5 text-red-400 shrink-0" />;
        case 'video': return <VideoIcon className="w-5 h-5 text-purple-400 shrink-0" />;
        default: return null;
    }
}

interface CourseWithProgress extends Course {
    progress: number;
}

const StudentMyCourses: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseWithProgress[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<CourseWithProgress[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewedMaterials, setViewedMaterials] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Record<string, 'materials' | 'discussions' | null>>({});

    const calculateProgress = (course: Course, viewed: Set<string>): number => {
        if (!course.materials || course.materials.length === 0) {
            return 0; // Show 0 if no materials, so 'Start Course' is shown
        }
        const viewedCount = course.materials.filter(m => viewed.has(m.id)).length;
        return Math.round((viewedCount / course.materials.length) * 100);
    };
    
    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [assignedCourses, viewedMaterialIds] = await Promise.all([
                api.getAssignedCoursesForStudent(user.id),
                api.getViewedMaterialsForStudent(user.id)
            ]);
            
            const viewedSet = new Set(viewedMaterialIds);
            setViewedMaterials(viewedSet);

            const coursesWithProgress = assignedCourses.map(course => ({
                ...course,
                progress: calculateProgress(course, viewedSet)
            }));
            setCourses(coursesWithProgress);

        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = courses.filter(course =>
            course.title.toLowerCase().includes(lowercasedFilter) ||
            course.instructorName.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredCourses(filtered);
    }, [searchTerm, courses]);


    const handleMaterialClick = async (materialId: string) => {
        if (!user) return;
        await api.markMaterialAsViewed(user.id, materialId);
        setViewedMaterials(prev => {
            const newSet = new Set<string>(prev);
            newSet.add(materialId);
            setCourses(currentCourses => currentCourses.map(course => ({
                ...course,
                progress: calculateProgress(course, newSet)
            })));
            return newSet;
        });
    };

    const toggleSection = (courseId: string, section: 'materials' | 'discussions') => {
        setExpandedSections(prev => ({
            ...prev,
            [courseId]: prev[courseId] === section ? null : section
        }));
    };
    
    if (isLoading) {
        return <div className="text-center p-8 text-white">Loading your courses...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">My Courses</h1>
                    <p className="text-slate-300">Your assigned courses and learning materials.</p>
                </div>
                <div className="relative w-full md:w-auto">
                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search courses or instructors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full md:w-64 !bg-[#1E293B] !border-slate-700 text-white placeholder:text-slate-400"
                        aria-label="Search my courses"
                    />
                </div>
            </div>

            {courses.length > 0 ? (
                filteredCourses.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {filteredCourses.map(course => (
                            <Card key={course.id} className="bg-[#1E293B] border border-slate-700 text-white flex flex-col overflow-hidden">
                                <CardContent className="p-6 flex-grow">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-white">{course.title}</h2>
                                            <p className="text-sm text-slate-300 mt-1 line-clamp-2">{course.description}</p>
                                        </div>
                                        <Button
                                            className="shrink-0 flex items-center gap-2"
                                            onClick={() => toggleSection(course.id, 'materials')}
                                        >
                                            {course.progress > 0 ? (
                                                <>Continue <ArrowRightIcon className="w-4 h-4" /></>
                                            ) : (
                                                <>Start Course <PlayIcon className="w-4 h-4" /></>
                                            )}
                                        </Button>
                                    </div>
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-slate-300">Progress</span>
                                            <span className="text-sm font-bold text-white">{course.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-2">
                                            <div className="bg-violet-600 h-2 rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }}></div>
                                        </div>
                                    </div>
                                </CardContent>
                                
                                <div className="border-t border-slate-700 grid grid-cols-2">
                                    <button onClick={() => toggleSection(course.id, 'materials')} className="flex items-center justify-center gap-2 p-4 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors border-r border-slate-700">
                                        Materials ({course.materials.length})
                                        <ChevronDownIcon className={cn('w-5 h-5 transition-transform', expandedSections[course.id] === 'materials' && 'rotate-180')} />
                                    </button>
                                    <button onClick={() => toggleSection(course.id, 'discussions')} className="flex items-center justify-center gap-2 p-4 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors">
                                        Discussions (1)
                                        <ChevronDownIcon className={cn('w-5 h-5 transition-transform', expandedSections[course.id] === 'discussions' && 'rotate-180')} />
                                    </button>
                                </div>

                                {expandedSections[course.id] === 'materials' && (
                                    <div className="p-6 border-t border-slate-700 bg-black/10">
                                        {course.materials.length > 0 ? (
                                            <ul className="space-y-3">
                                                {course.materials.map(material => (
                                                    <li key={material.id}>
                                                        <a href={material.url} target="_blank" rel="noopener noreferrer" onClick={() => handleMaterialClick(material.id)} className="flex items-center gap-3 p-3 rounded-md border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                                                            {getMaterialIcon(material.type)}
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="font-semibold text-slate-200 truncate">{material.title}</p>
                                                            </div>
                                                            {viewedMaterials.has(material.id) && <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-center text-slate-300 py-4">No materials available for this course.</p>
                                        )}
                                    </div>
                                )}
                                {expandedSections[course.id] === 'discussions' && (
                                    <div className="p-6 border-t border-slate-700 bg-black/10 text-center">
                                        <p className="text-sm text-slate-300">Discussions feature coming soon.</p>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg text-white">
                        <SearchXIcon className="w-16 h-16 mx-auto text-slate-500" />
                        <p className="mt-4 text-lg font-semibold">No Courses Found</p>
                        <p className="text-slate-300">Your search for "{searchTerm}" did not match any courses.</p>
                    </div>
                )
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg text-white">
                    <BookIcon className="w-16 h-16 mx-auto text-violet-500" />
                    <p className="mt-4 text-lg font-semibold">No Courses Assigned</p>
                    <p className="text-slate-300">Your instructor hasn't assigned any courses to you yet.</p>
                </div>
            )}
        </div>
    );
};

export default StudentMyCourses;