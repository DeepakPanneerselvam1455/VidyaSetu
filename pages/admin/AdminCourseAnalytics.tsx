
import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../lib/api';
import { Course, User, QuizAttempt, Quiz } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface CourseAnalytics {
    course: Course;
    mentorName: string;
    quizCount: number;
    attemptCount: number;
    averageScore: number;
}

type SortKey = 'course.title' | 'mentorName' | 'quizCount' | 'attemptCount' | 'averageScore';

const AdminCourseAnalytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
    const [mentors, setMentors] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'attemptCount', direction: 'descending' });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [courses, users, allAttempts, allQuizzes] = await Promise.all([
                api.getCourses(),
                api.getUsers(),
                api.getAllAttempts(),
                api.getQuizzes()
            ]);

            setMentors(users.filter(u => u.role === 'mentor'));

            const usersMap = users.reduce((acc, u) => {
                acc[u.id] = u.name;
                return acc;
            }, {} as { [id: string]: string });

            const quizzesByCourse = allQuizzes.reduce((acc, quiz) => {
                (acc[quiz.courseId] = acc[quiz.courseId] || []).push(quiz);
                return acc;
            }, {} as { [courseId: string]: Quiz[] });

            const courseAnalytics = courses.map(course => {
                const courseQuizzes = quizzesByCourse[course.id] || [];
                const courseQuizIds = new Set(courseQuizzes.map(q => q.id));
                const courseAttempts = allAttempts.filter(a => courseQuizIds.has(a.quizId));

                let averageScore = 0;
                if (courseAttempts.length > 0) {
                    const total = courseAttempts.reduce((sum, a) => sum + (a.score / a.totalPoints * 100), 0);
                    averageScore = Math.round(total / courseAttempts.length);
                }
                
                return {
                    course,
                    mentorName: usersMap[course.mentorId] || 'Unknown',
                    quizCount: courseQuizzes.length,
                    attemptCount: courseAttempts.length,
                    averageScore
                };
            });

            setAnalytics(courseAnalytics);
        } catch (error) {
            console.error("Failed to fetch course analytics", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleActionClick = (course: Course, action: 'edit' | 'delete' | 'detail') => {
        setSelectedCourse(course);
        if (action === 'edit') setIsEditModalOpen(true);
        if (action === 'delete') setIsDeleteModalOpen(true);
        if (action === 'detail') setIsDetailModalOpen(true);
    };
    
    const sortedAnalytics = useMemo(() => {
        let sortableItems = [...analytics];
        if (!sortConfig) return sortableItems;

        sortableItems.sort((a, b) => {
            const { key, direction } = sortConfig;
            
            const getVal = (item: CourseAnalytics, key: SortKey) => {
                switch(key) {
                    case 'course.title': return item.course.title.toLowerCase();
                    case 'mentorName': return item.mentorName.toLowerCase();
                    default: return item[key];
                }
            };

            const aValue = getVal(a, key);
            const bValue = getVal(b, key);

            if (aValue < bValue) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [analytics, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return <span className="ml-1 text-xs">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>;
    };


    if (isLoading) {
        return <div className="text-center p-8 dark:text-white">Loading analytics...</div>;
    }

    const TableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode, className?: string }> = ({ sortKey, children, className }) => (
        <th scope="col" className={`px-6 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${className}`} onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                {children}
                {getSortIndicator(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-white">Course Management & Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-300">Oversee engagement, performance, and manage all courses.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>Create Course</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-white">
                                <tr>
                                    <TableHeader sortKey="course.title">Course</TableHeader>
                                    <TableHeader sortKey="mentorName">Instructor</TableHeader>
                                    <TableHeader sortKey="quizCount" className="text-center">Quizzes</TableHeader>
                                    <TableHeader sortKey="attemptCount" className="text-center">Total Attempts</TableHeader>
                                    <TableHeader sortKey="averageScore" className="text-center">Avg. Score</TableHeader>
                                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAnalytics.map(({ course, mentorName, quizCount, attemptCount, averageScore }) => (
                                    <tr key={course.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                        <td className="px-6 py-4 font-medium">{course.title}</td>
                                        <td className="px-6 py-4">{mentorName}</td>
                                        <td className="px-6 py-4 text-center">{quizCount}</td>
                                        <td className="px-6 py-4 text-center">{attemptCount}</td>
                                        <td className="px-6 py-4 font-bold text-center">{attemptCount > 0 ? `${averageScore}%` : 'N/A'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="outline" size="sm" onClick={() => handleActionClick(course, 'detail')}>View Details</Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleActionClick(course, 'edit')}>Edit</Button>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleActionClick(course, 'delete')}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <CreateCourseDialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCourseCreated={fetchData}
                mentors={mentors}
            />
            {selectedCourse && (
                <>
                    <CourseDetailDialog 
                        isOpen={isDetailModalOpen}
                        onClose={() => setIsDetailModalOpen(false)}
                        course={selectedCourse}
                    />
                    <EditCourseDialog
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onCourseUpdated={fetchData}
                        course={selectedCourse}
                        mentors={mentors}
                    />
                    <DeleteCourseDialog
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onCourseDeleted={fetchData}
                        course={selectedCourse}
                    />
                </>
            )}
        </div>
    );
};

// --- DIALOGS ---
const CourseForm: React.FC<{
    course?: Course;
    mentors: User[];
    onSave: (courseData: Omit<Course, 'id' | 'createdAt'>) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}> = ({ course, mentors, onSave, onClose, isSaving }) => {
    const [title, setTitle] = useState(course?.title || '');
    const [description, setDescription] = useState(course?.description || '');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(course?.difficulty || 'Beginner');
    const [topics, setTopics] = useState(course?.topics.join(', ') || '');
    const [mentorId, setMentorId] = useState(course?.mentorId || (mentors.length > 0 ? mentors[0].id : ''));
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!mentorId) {
            setError('Please select an instructor.');
            return;
        }
        try {
            const mentor = mentors.find(m => m.id === mentorId);
            await onSave({
                title,
                description,
                difficulty,
                topics: topics.split(',').map(t => t.trim()).filter(Boolean),
                materials: course?.materials || [],
                mentorId,
                instructorName: mentor?.name || '',
                institutionName: course?.institutionName || 'SkillForge Academy',
                publishDate: course?.publishDate || new Date().toISOString().split('T')[0],
                language: course?.language || 'English',
            });
            onClose();
        } catch(err) {
            setError('Failed to save course. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
             <div>
                <label htmlFor="mentorId" className="block text-sm font-medium mb-1">Instructor</label>
                <Select id="mentorId" value={mentorId} onChange={e => setMentorId(e.target.value)} required>
                    <option value="" disabled>Select an instructor</option>
                    {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Select>
            </div>
            <div>
                <label htmlFor="difficulty" className="block text-sm font-medium mb-1">Difficulty</label>
                <Select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as any)} required>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                </Select>
            </div>
            <div>
                <label htmlFor="topics" className="block text-sm font-medium mb-1">Topics (comma-separated)</label>
                <Input id="topics" value={topics} onChange={e => setTopics(e.target.value)} placeholder="e.g. Variables, Functions, Arrays" required />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
        </form>
    );
};

interface CreateCourseDialogProps { isOpen: boolean; onClose: () => void; onCourseCreated: () => void; mentors: User[]; }
const CreateCourseDialog: React.FC<CreateCourseDialogProps> = ({ isOpen, onClose, onCourseCreated, mentors }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (courseData: Omit<Course, 'id' | 'createdAt'>) => {
        setIsSubmitting(true);
        // Admin create dialog doesn't handle materials, so we ensure it's an empty array.
        const apiData = { ...courseData, materials: courseData.materials || [] };
        await api.createCourse(apiData);
        onCourseCreated();
        setIsSubmitting(false);
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Create New Course">
            <CourseForm
                onSave={handleSave}
                onClose={onClose}
                isSaving={isSubmitting}
                mentors={mentors}
            />
        </Dialog>
    );
}

interface EditCourseDialogProps { isOpen: boolean; onClose: () => void; onCourseUpdated: () => void; course: Course; mentors: User[]; }
const EditCourseDialog: React.FC<EditCourseDialogProps> = ({ isOpen, onClose, onCourseUpdated, course, mentors }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (!isOpen) setIsSubmitting(false);
    }, [isOpen]);

    const handleSave = async (courseData: Omit<Course, 'id' | 'createdAt'>) => {
        setIsSubmitting(true);
        await api.updateCourse({ ...course, ...courseData });
        onCourseUpdated();
        setIsSubmitting(false);
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Edit Course">
            <CourseForm
                course={course}
                onSave={handleSave}
                onClose={onClose}
                isSaving={isSubmitting}
                mentors={mentors}
            />
        </Dialog>
    );
}

interface DeleteCourseDialogProps { isOpen: boolean; onClose: () => void; onCourseDeleted: () => void; course: Course; }
const DeleteCourseDialog: React.FC<DeleteCourseDialogProps> = ({ isOpen, onClose, onCourseDeleted, course }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await api.deleteCourse(course.id);
            onCourseDeleted();
            onClose();
        } catch (err) {
            console.error("Failed to delete course", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Delete Course"
            description={`Are you sure you want to delete "${course.title}"? This will also remove associated quizzes and cannot be undone.`}
        >
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete Course'}</Button>
            </div>
        </Dialog>
    );
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Course Progress</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{value}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-700">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

interface CourseDetailDialogProps { isOpen: boolean; onClose: () => void; course: Course; }
const CourseDetailDialog: React.FC<CourseDetailDialogProps> = ({ isOpen, onClose, course }) => {
    const [studentProgress, setStudentProgress] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const [quizzes, allAttempts, allUsers, allViewed] = await Promise.all([
                    api.getQuizzesByCourse(course.id),
                    api.getAllAttempts(),
                    api.getUsers(),
                    api.getAllViewedMaterials()
                ]);

                const courseQuizIds = new Set(quizzes.map(q => q.id));
                const courseAttempts = allAttempts.filter(a => courseQuizIds.has(a.quizId));
                const studentIds = [...new Set(courseAttempts.map(a => a.studentId))];
                const usersMap = new Map(allUsers.map(u => [u.id, u.name]));
                
                const progressData = studentIds.map(studentId => {
                    const attempts = courseAttempts.filter(a => a.studentId === studentId);
                    const viewedSet = new Set(allViewed[studentId] || []);
                    const progress = course.materials.length > 0
                        ? Math.round((course.materials.filter(m => viewedSet.has(m.id)).length / course.materials.length) * 100)
                        : 100;
                    
                    return {
                        studentId,
                        studentName: usersMap.get(studentId) || 'Unknown',
                        attempts,
                        progress,
                    };
                });
                
                setStudentProgress(progressData);
            } catch (err) {
                console.error("Failed to load course details", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen, course]);

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Student Progress: ${course.title}`} description="Detailed view of student activity in this course.">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto mt-4 pr-4 -mr-4">
                {isLoading ? <p>Loading details...</p> : studentProgress.length === 0 ? <p className="text-slate-500 text-center py-4">No students have attempted quizzes for this course yet.</p> : (
                    studentProgress.map(data => (
                        <div key={data.studentId} className="p-4 border rounded-lg dark:border-slate-700">
                            <h4 className="font-semibold">{data.studentName}</h4>
                            <ProgressBar value={data.progress} />
                            <div className="mt-3">
                                <p className="text-xs font-semibold uppercase text-slate-500">Attempt History</p>
                                <ul className="text-sm space-y-1 mt-1">
                                    {data.attempts.map((att: QuizAttempt) => (
                                        <li key={att.id} className="flex justify-between items-center p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded">
                                            <span>Quiz on {new Date(att.submittedAt).toLocaleDateString()}</span>
                                            <span className="font-semibold">{Math.round((att.score / att.totalPoints) * 100)}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="flex justify-end pt-6">
                <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
        </Dialog>
    );
};

export default AdminCourseAnalytics;