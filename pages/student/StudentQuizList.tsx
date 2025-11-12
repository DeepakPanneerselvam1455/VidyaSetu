
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { Quiz, QuizAttempt } from '../../types';
import { useAuth } from '../../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { buttonVariants } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';

interface QuizWithDetails extends Quiz {
    courseTitle: string;
    isCompleted: boolean;
    dueDate?: string;
    score?: number;
    totalPoints?: number;
}

const StudentQuizList: React.FC = () => {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState<QuizWithDetails[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: 'title' | 'courseTitle' | 'difficulty' | 'status'; direction: 'ascending' | 'descending' }>({ key: 'title', direction: 'ascending' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuizData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [assignedQuizzes, attempts] = await Promise.all([
                    api.getAssignedQuizzesForStudent(user.id),
                    api.getStudentProgress(user.id)
                ]);
                
                const attemptsMap = new Map<string, QuizAttempt>(attempts.map(a => [a.quizId, a]));

                const quizzesWithDetails = assignedQuizzes.map(quiz => {
                    const attempt = attemptsMap.get(quiz.id);
                    return {
                        ...quiz,
                        isCompleted: !!attempt,
                        score: attempt?.score,
                        totalPoints: attempt?.totalPoints,
                    };
                });

                setQuizzes(quizzesWithDetails);
            } catch (error) {
                console.error("Failed to fetch assigned quizzes and progress", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuizData();
    }, [user]);

    useEffect(() => {
        let result = [...quizzes];

        // Filter by Search Term
        if (searchTerm) {
            result = result.filter(q =>
                q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        // Filter by Difficulty
        if (difficultyFilter !== 'All') {
            result = result.filter(q => q.difficulty === difficultyFilter);
        }

        // Sort
        result.sort((a, b) => {
            const { key, direction } = sortConfig;
            
            if (key === 'status') {
                // Not completed (false) should come before completed (true) in ascending order
                if (a.isCompleted < b.isCompleted) return direction === 'ascending' ? -1 : 1;
                if (a.isCompleted > b.isCompleted) return direction === 'ascending' ? 1 : -1;
                return 0;
            } else if (key === 'difficulty') {
                const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                const aOrder = difficultyOrder[a.difficulty];
                const bOrder = difficultyOrder[b.difficulty];

                if (aOrder < bOrder) return direction === 'ascending' ? -1 : 1;
                if (aOrder > bOrder) return direction === 'ascending' ? 1 : -1;
                return 0;
            } else {
                // Handles 'title' and 'courseTitle'
                const aVal = a[key].toLowerCase();
                const bVal = b[key].toLowerCase();
                if (aVal < bVal) return direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return direction === 'ascending' ? 1 : -1;
                return 0;
            }
        });

        setFilteredQuizzes(result);
    }, [searchTerm, difficultyFilter, quizzes, sortConfig]);
    
    if (isLoading) {
        return <div className="text-center p-8 dark:text-white">Loading quizzes...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-white">My Assigned Quizzes</h1>
                    <p className="text-slate-500 dark:text-slate-300">Quizzes assigned to you by your instructors.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Input 
                        placeholder="Search quizzes..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-auto md:w-48"
                    />
                    <Select 
                        value={difficultyFilter}
                        onChange={e => setDifficultyFilter(e.target.value)}
                        className="w-full sm:w-auto"
                        aria-label="Filter by difficulty"
                    >
                        <option value="All">All Difficulties</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </Select>
                    <Select
                        value={`${sortConfig.key}-${sortConfig.direction}`}
                        onChange={e => {
                            const [key, direction] = e.target.value.split('-');
                            setSortConfig({ key: key as any, direction: direction as any });
                        }}
                        className="w-full sm:w-auto md:w-52"
                        aria-label="Sort quizzes"
                    >
                        <option value="title-ascending">Title (A-Z)</option>
                        <option value="title-descending">Title (Z-A)</option>
                        <option value="courseTitle-ascending">Course (A-Z)</option>
                        <option value="courseTitle-descending">Course (Z-A)</option>
                        <option value="difficulty-ascending">Difficulty (Easy to Hard)</option>
                        <option value="difficulty-descending">Difficulty (Hard to Easy)</option>
                        <option value="status-ascending">Status (To Do First)</option>
                        <option value="status-descending">Status (Completed First)</option>
                    </Select>
                </div>
            </div>

            {filteredQuizzes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredQuizzes.map(quiz => {
                        const { isCompleted } = quiz;
                        const buttonText = isCompleted ? 'Retake Quiz' : 'Take Quiz';
                        const buttonVariant = isCompleted ? 'outline' : 'default';
                        const isPastDue = !isCompleted && quiz.dueDate && new Date(quiz.dueDate) < new Date();

                        return (
                            <Card key={quiz.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{quiz.title}</CardTitle>
                                    <CardDescription>{quiz.courseTitle}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {isCompleted ? (
                                            <Badge variant="success"><CheckIcon className="w-[12px] h-[12px] mr-1"/>Completed</Badge>
                                        ) : isPastDue ? (
                                            <Badge variant="destructive">Past Due</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">To Do</Badge>
                                        )}
                                        <Badge variant="secondary">{quiz.difficulty}</Badge>
                                        <span className="text-sm text-slate-500 dark:text-slate-300">{quiz.questions.length} Questions</span>
                                    </div>
                                    {quiz.dueDate && (
                                        <div className={cn("text-sm flex items-center gap-2", isPastDue ? "text-red-600" : "text-slate-500 dark:text-slate-300")}>
                                            <CalendarIcon className="w-[14px] h-[14px]" />
                                            <span>Due on {new Date(quiz.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                     {isCompleted && typeof quiz.score !== 'undefined' && (
                                        <div className="pt-2">
                                            <p className="text-sm font-semibold">Your Score: <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{quiz.score}/{quiz.totalPoints}</span></p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Link to={`/student/quiz/${quiz.id}`} className={cn(buttonVariants({ variant: buttonVariant }), 'w-full')}>{buttonText}</Link>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <PartyPopperIcon className="w-[62px] h-[62px] mx-auto text-indigo-500" />
                    <p className="mt-4 text-lg font-semibold dark:text-white">Woohoo! No quizzes found.</p>
                    <p className="text-slate-500 dark:text-slate-300">
                        {searchTerm || difficultyFilter !== 'All' ? 'Try adjusting your filters.' : 'Enjoy the break or get ready for the next challenge!'}
                    </p>
                </div>
            )}
        </div>
    );
};

const PartyPopperIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6z"/><path d="M12 5v.01"/><path d="M16 13v-3"/><path d="M8 13v-3"/><path d="M10 21v-3.47a2 2 0 0 1 1-1.73l2-1.15a2 2 0 0 0 1-1.73V13"/><path d="m19 13-2-2.5"/><path d="m5 13 2-2.5"/><path d="m12 5-1.5-1.5"/><path d="m14.5 3.5 1-1"/><path d="m9.5 3.5-1-1"/></svg>;
const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);


export default StudentQuizList;
