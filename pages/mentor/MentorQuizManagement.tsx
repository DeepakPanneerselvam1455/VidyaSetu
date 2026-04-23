
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, Quiz, Question, User } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button, buttonVariants } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';
import { HelpCircleIcon } from '../../components/ui/Icons';

interface MentorQuizManagementProps {
    isTabView?: boolean;
    course?: Course;
}

const MentorQuizManagement: React.FC<MentorQuizManagementProps> = ({ isTabView = false, course: courseProp }) => {
    const { courseId: paramCourseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(courseProp || null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(!courseProp);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

    const courseId = courseProp?.id || paramCourseId;

    const fetchQuizzes = async () => {
        if(courseId) {
            setIsLoading(true);
            try {
                const courseQuizzes = await api.getQuizzesByCourse(courseId);
                setQuizzes(courseQuizzes);
            } catch (err) {
                console.error("Failed to fetch quizzes", err);
            } finally {
                setIsLoading(false);
            }
        }
    }

    useEffect(() => {
        const fetchCourseData = async () => {
            if (!courseId || courseProp) {
                if (courseProp) {
                    setCourse(courseProp);
                    await fetchQuizzes();
                }
                return;
            };
            setIsLoading(true);
            try {
                const courseData = await api.getCourseById(courseId);
                setCourse(courseData);
                if (courseData) {
                    const courseQuizzes = await api.getQuizzesByCourse(courseData.id);
                    setQuizzes(courseQuizzes);
                }
            } catch (error) {
                console.error("Failed to fetch course and quizzes", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourseData();
    }, [courseId, courseProp]);


    const handleAssignClick = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsAssignModalOpen(true);
    };

    const handleDeleteClick = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsDeleteModalOpen(true);
    };

    if (isLoading && !course) {
        return <div className="text-center p-8">Loading quizzes...</div>;
    }
    
    if (!course) {
        return <div className="text-center p-8">Course not found.</div>;
    }

    return (
        <div className="space-y-6">
            {!isTabView ? (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link to="/mentor/courses" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>← Back to Courses</Link>
                        <h1 className="text-3xl font-bold tracking-tight">{course.title} Quizzes</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage and assign quizzes for this course.</p>
                    </div>
                     <Link to="/mentor/generate-quiz"><Button>Create New Quiz</Button></Link>
                </div>
            ) : (
                <div className="flex justify-end">
                    <Link to="/mentor/generate-quiz"><Button>Create New Quiz</Button></Link>
                </div>
            )}
            
            {quizzes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {quizzes.map(quiz => (
                       <Card key={quiz.id} className="flex flex-col card-themed">
                            <CardHeader>
                                <CardTitle>{quiz.title}</CardTitle>
                                <CardDescription>A quiz based on this course's topics.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">{quiz.difficulty}</Badge>
                                    <Badge variant="outline">{quiz.questions.length} Questions</Badge>
                                     {quiz.duration && <Badge variant="outline">{quiz.duration} min</Badge>}
                                </div>
                                {course.topics.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Course Topics</p>
                                        <div className="flex flex-wrap gap-1">
                                            {course.topics.map(topic => (
                                                <Badge key={topic} variant="outline">{topic}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="grid grid-cols-3 gap-2">
                                 <Button variant="default" size="sm" onClick={() => handleAssignClick(quiz)}>
                                    Assign
                                 </Button>
                                 <Link to={`/mentor/quiz/${quiz.id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                                    Edit
                                 </Link>
                                 <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(quiz)}>
                                    Delete
                                 </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm py-16 px-6 text-center">
                    {/* Icon bubble */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 mb-5">
                        <HelpCircleIcon className="w-8 h-8 text-indigo-500" />
                    </div>

                    {/* Text */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Quizzes Yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                        Create your first quiz to start assessing your students on this course.
                    </p>

                    {/* CTA */}
                    <Link to="/mentor/generate-quiz">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create New Quiz
                        </button>
                    </Link>
                </div>
            )}
            
            {selectedQuiz && (
                <>
                    <AssignQuizDialog 
                        isOpen={isAssignModalOpen}
                        onClose={() => setIsAssignModalOpen(false)}
                        quiz={selectedQuiz}
                    />
                    <DeleteQuizDialog
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        quiz={selectedQuiz}
                        onQuizDeleted={fetchQuizzes}
                    />
                </>
            )}
        </div>
    );
};


// --- DIALOGS ---

interface AssignQuizDialogProps { isOpen: boolean; onClose: () => void; quiz: Quiz; }
const AssignQuizDialog: React.FC<AssignQuizDialogProps> = ({ isOpen, onClose, quiz }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if(isOpen) {
            api.getUsers().then(allUsers => {
                setStudents(allUsers.filter(u => u.role === 'student'));
            });
            api.getQuizAssignments(quiz.id).then(assigned => {
                setAssignedStudentIds(assigned);
            }).catch(() => setAssignedStudentIds([]));
            
            // Reset state on open
            setSelectedStudentIds([]);
            setDueDate('');
            setError('');
            setSuccessMessage('');
        }
    }, [isOpen]);

    const handleStudentSelect = (studentId: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        const unassignedStudents = students.filter(s => !assignedStudentIds.includes(s.id));
        if (selectedStudentIds.length === unassignedStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(unassignedStudents.map(s => s.id));
        }
    };

    const handleAssign = async () => {
        if (selectedStudentIds.length === 0) {
            setError("Please select at least one student.");
            return;
        }
        setIsAssigning(true);
        setError('');
        try {
            await api.createQuizAssignments(quiz.id, selectedStudentIds, dueDate || undefined);
            setSuccessMessage(`Quiz successfully assigned to ${selectedStudentIds.length} student(s).`);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch(err) {
            setError("Failed to assign quiz.");
        } finally {
            setIsAssigning(false);
        }
    };
    
    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Assign Quiz: ${quiz.title}`}>
            <div className="space-y-5">
                {successMessage ? (
                    <div className="text-center py-10 px-6 bg-green-50 rounded-xl border border-green-100">
                        <p className="font-bold text-green-700 text-base">{successMessage}</p>
                    </div>
                ) : (
                    <>
                        {/* ── Student Selection ── */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Select Students
                            </label>

                            <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
                                {/* Select All row */}
                                <label
                                    htmlFor="select-all"
                                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-indigo-50 transition-colors duration-150 select-none"
                                >
                                    <input
                                        type="checkbox"
                                        id="select-all"
                                        className="w-4 h-4 rounded border-gray-400 text-indigo-600 accent-indigo-600 cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
                                        checked={selectedStudentIds.length === students.filter(s => !assignedStudentIds.includes(s.id)).length && students.filter(s => !assignedStudentIds.includes(s.id)).length > 0}
                                        onChange={handleSelectAll}
                                    />
                                    <span className="font-semibold text-sm text-gray-800">Select All</span>
                                </label>

                                {/* Student list */}
                                <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                                    {students.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-6 px-4">No students available.</p>
                                    ) : (
                                        students.map(student => {
                                            const isAssigned = assignedStudentIds.includes(student.id);
                                            return (
                                                <label
                                                    key={student.id}
                                                    htmlFor={`student-${student.id}`}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-3 transition-colors duration-150 select-none",
                                                        isAssigned
                                                            ? "bg-gray-50 cursor-not-allowed"
                                                            : "cursor-pointer hover:bg-indigo-50"
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        id={`student-${student.id}`}
                                                        className="w-4 h-4 rounded border-gray-400 text-indigo-600 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
                                                        checked={isAssigned || selectedStudentIds.includes(student.id)}
                                                        disabled={isAssigned}
                                                        onChange={() => handleStudentSelect(student.id)}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-sm font-medium truncate",
                                                            isAssigned ? "text-gray-400" : "text-gray-800"
                                                        )}>
                                                            {student.name}
                                                        </p>
                                                        <p className={cn(
                                                            "text-xs truncate",
                                                            isAssigned ? "text-gray-300" : "text-gray-500"
                                                        )}>
                                                            {student.email}
                                                        </p>
                                                    </div>
                                                    {isAssigned && (
                                                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                                                            Assigned
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {selectedStudentIds.length > 0 && (
                                <p className="text-xs text-indigo-600 font-medium mt-1.5">
                                    {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                                </p>
                            )}
                        </div>

                        {/* ── Due Date ── */}
                        <div>
                            <label htmlFor="due-date" className="block text-sm font-semibold text-gray-800 mb-1.5">
                                Due Date <span className="font-normal text-gray-400">(Optional)</span>
                            </label>
                            <input
                                id="due-date"
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm cursor-pointer transition-colors duration-150 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                                {error}
                            </p>
                        )}

                        {/* ── Actions ── */}
                        <div className="flex justify-end gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAssign}
                                disabled={isAssigning || selectedStudentIds.length === 0}
                                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 shadow-sm"
                            >
                                {isAssigning ? 'Assigning…' : 'Assign Quiz'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    )
}

interface DeleteQuizDialogProps { isOpen: boolean; onClose: () => void; quiz: Quiz; onQuizDeleted: () => void; }
const DeleteQuizDialog: React.FC<DeleteQuizDialogProps> = ({ isOpen, onClose, quiz, onQuizDeleted }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.deleteQuiz(quiz.id);
            onQuizDeleted();
            onClose();
        } catch (err) {
            console.error("Failed to delete quiz", err);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Delete Quiz"
            description={`Are you sure you want to delete "${quiz.title}"? This action will also remove all associated student attempts and cannot be undone.`}
        >
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Quiz'}</Button>
            </div>
        </Dialog>
    );
}



export default MentorQuizManagement;
