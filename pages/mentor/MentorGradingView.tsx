
import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, Quiz, QuizAttempt, User, Question } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';

// --- NEW DATA STRUCTURES ---
interface SubmissionData {
    attempt: QuizAttempt;
    quizTitle: string;
    quiz: Quiz;
}

interface StudentSubmissions {
    studentId: string;
    studentName: string;
    submissions: SubmissionData[];
    averageScore: number;
    submissionCount: number;
}


// --- REFACTORED MAIN COMPONENT ---
const MentorGradingView: React.FC<{ course: Course }> = ({ course }) => {
    const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmissions[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const [quizzes, allAttempts, users] = await Promise.all([
                api.getQuizzesByCourse(course.id),
                api.getAllAttempts(),
                api.getUsers(),
            ]);

            const quizMap = quizzes.reduce((acc, q) => { acc[q.id] = q; return acc; }, {} as { [id: string]: Quiz });
            const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as { [id: string]: User });
            const quizIdsInCourse = new Set(quizzes.map(q => q.id));

            const courseAttempts = allAttempts.filter(a => quizIdsInCourse.has(a.quizId));

            const submissionsByStudent: { [studentId: string]: StudentSubmissions } = {};

            for (const attempt of courseAttempts) {
                const studentId = attempt.studentId;
                if (!userMap[studentId]) continue;

                if (!submissionsByStudent[studentId]) {
                    submissionsByStudent[studentId] = {
                        studentId,
                        studentName: userMap[studentId].name,
                        submissions: [],
                        averageScore: 0,
                        submissionCount: 0,
                    };
                }

                const quiz = quizMap[attempt.quizId];
                if(quiz) {
                    submissionsByStudent[studentId].submissions.push({
                        attempt,
                        quizTitle: quiz.title,
                        quiz
                    });
                }
            }

            // Calculate stats and sort
            const formattedData = Object.values(submissionsByStudent).map(studentData => {
                const totalScore = studentData.submissions.reduce((acc, sub) => acc + (sub.attempt.score / sub.attempt.totalPoints * 100), 0);
                studentData.averageScore = studentData.submissions.length > 0 ? Math.round(totalScore / studentData.submissions.length) : 0;
                studentData.submissionCount = studentData.submissions.length;
                studentData.submissions.sort((a,b) => new Date(b.attempt.submittedAt).getTime() - new Date(a.attempt.submittedAt).getTime());
                return studentData;
            }).sort((a,b) => a.studentName.localeCompare(b.studentName));


            setStudentSubmissions(formattedData);
        } catch (error) {
            console.error("Failed to fetch submissions for grading", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchSubmissions();
    }, [course]);

    if (isLoading) return <p>Loading submissions...</p>;

    return (
        <div className="space-y-4">
            {studentSubmissions.length > 0 ? (
                studentSubmissions.map(studentData => (
                    <StudentGradingCard
                        key={studentData.studentId}
                        studentData={studentData}
                        isExpanded={expandedStudentId === studentData.studentId}
                        onToggle={() => setExpandedStudentId(prev => prev === studentData.studentId ? null : studentData.studentId)}
                        onGradingComplete={fetchSubmissions}
                    />
                ))
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <CoffeeIcon className="w-12 h-12 mx-auto text-slate-400" />
                    <p className="mt-4 text-lg font-semibold">All Caught Up!</p>
                    <p className="text-slate-500 dark:text-slate-400">No submissions are waiting for your review in this course.</p>
                </div>
            )}
        </div>
    );
};

// --- STUDENT EXPANDABLE CARD ---
const StudentGradingCard: React.FC<{ 
    studentData: StudentSubmissions; 
    isExpanded: boolean; 
    onToggle: () => void; 
    onGradingComplete: () => void;
}> = ({ studentData, isExpanded, onToggle, onGradingComplete }) => {
    const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

    const getPerformanceStatus = (score: number) => {
        if (score >= 80) return { label: 'Excellent', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
        if (score >= 50) return { label: 'Average', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
        return { label: 'Needs Improvement', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
    };

    const performance = getPerformanceStatus(studentData.averageScore);

    return (
        <Card>
            <CardHeader onClick={onToggle} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-center">
                    <CardTitle>{studentData.studentName}</CardTitle>
                     <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <Badge variant="outline">{studentData.submissionCount} Submission(s)</Badge>
                        <Badge className={performance.className}>{performance.label} ({studentData.averageScore}%)</Badge>
                        <ChevronDownIcon className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="pt-4 border-t dark:border-slate-700 space-y-3">
                    {studentData.submissions.map(submission => {
                        const unansweredCount = submission.quiz.questions.reduce((count, q) => {
                            const answer = submission.attempt.answers[q.id];
                            if (answer === undefined || answer === null || String(answer).trim() === '') {
                                return count + 1;
                            }
                            return count;
                        }, 0);
                        
                        return (
                            <div 
                                key={submission.attempt.id} 
                                className={cn(
                                    "border dark:border-slate-700 rounded-lg",
                                    unansweredCount > 0 && !submission.attempt.gradedAt && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                                )}
                            >
                                <div 
                                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                                    onClick={() => setExpandedAttemptId(prev => prev === submission.attempt.id ? null : submission.attempt.id)}
                                >
                                    <div>
                                        <p className="font-semibold">{submission.quizTitle}</p>
                                        <p className="text-sm text-slate-500">Submitted: {new Date(submission.attempt.submittedAt).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {unansweredCount > 0 && (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                {unansweredCount} Unanswered
                                            </Badge>
                                        )}
                                        {submission.attempt.gradedAt ? <Badge variant="success">Graded</Badge> : <Badge variant="secondary">Pending Review</Badge>}
                                        <p className="font-bold text-lg">{submission.attempt.overriddenScore ?? submission.attempt.score}/{submission.attempt.totalPoints}</p>
                                        <ChevronDownIcon className={cn("w-5 h-5 transition-transform", expandedAttemptId === submission.attempt.id && "rotate-180")} />
                                    </div>
                                </div>
                                {expandedAttemptId === submission.attempt.id && (
                                    <div className="p-4 border-t dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20">
                                        <AttemptGradingForm
                                            key={submission.attempt.id} // Re-mount component on selection change
                                            submission={submission}
                                            onSave={() => {
                                                setExpandedAttemptId(null);
                                                onGradingComplete();
                                            }}
                                            onCancel={() => setExpandedAttemptId(null)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            )}
        </Card>
    )
}

const feedbackSnippets = [
    { label: "Partially Correct", text: "Good effort, but this is partially correct. Review the material on this topic." },
    { label: "Elaborate", text: "Correct answer! Can you elaborate more on why this is the case?" },
    { label: "Incorrect", text: "This is incorrect. Please revisit the section in the course materials covering this concept." },
    { label: "On Right Track", text: "You're on the right track, but missed a key detail." },
    { label: "Excellent", text: "Excellent explanation!" },
];


// --- INLINE GRADING FORM ---
const AttemptGradingForm: React.FC<{ submission: SubmissionData; onSave: () => void; onCancel: () => void; }> = ({ submission, onSave, onCancel }) => {
    const { user: mentor } = useAuth();
    const [editableAttempt, setEditableAttempt] = useState<QuizAttempt>(JSON.parse(JSON.stringify(submission.attempt)));
    const [isSaving, setIsSaving] = useState(false);

    const handleFeedbackChange = (questionId: string, text: string) => {
        setEditableAttempt(prev => ({
            ...prev,
            feedback: { ...prev.feedback, [questionId]: text },
        }));
    };
    
    const handleSnippetClick = (questionId: string, snippet: string) => {
        setEditableAttempt(prev => {
            const currentFeedback = prev.feedback?.[questionId] || '';
            const newFeedback = currentFeedback ? `${currentFeedback}\n${snippet}` : snippet;
            return {
                ...prev,
                feedback: { ...prev.feedback, [questionId]: newFeedback },
            };
        });
    };

    const handleOverrideScore = (question: Question, isCorrect: boolean) => {
        const studentAnswer = editableAttempt.answers[question.id] || "";
        const wasCorrect = studentAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        
        if (isCorrect === wasCorrect) return; // No change needed

        const scoreChange = isCorrect ? question.points : -question.points;
        const currentScore = editableAttempt.overriddenScore ?? editableAttempt.score;
        
        setEditableAttempt(prev => ({
            ...prev,
            overriddenScore: currentScore + scoreChange,
            feedback: { ...prev.feedback, [question.id]: isCorrect ? "Marked as correct." : "Marked as incorrect." }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateQuizAttempt({
                ...editableAttempt,
                gradedBy: mentor?.id,
                gradedAt: new Date().toISOString(),
            });
            onSave();
        } catch (error) {
            console.error("Failed to save grade", error);
        } finally {
            setIsSaving(false);
        }
    };

    const quiz = submission.quiz;

    return (
        <div className="space-y-4">
            {quiz.questions.map((q, index) => {
                const studentAnswer = editableAttempt.answers[q.id] || "Not Answered";
                const isCorrect = studentAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                return (
                    <Card key={q.id} className={cn(isCorrect ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10')}>
                        <CardHeader>
                            <p className="font-semibold">{index + 1}. {q.question}</p>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong className="text-slate-500">Student's Answer:</strong> {studentAnswer}</p>
                            <p><strong className="text-slate-500">Correct Answer:</strong> {q.correctAnswer}</p>
                            {q.type === 'short-answer' && (
                                <div className="flex items-center gap-2 pt-2">
                                    <Button size="sm" variant="outline" onClick={() => handleOverrideScore(q, true)}>Mark Correct</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleOverrideScore(q, false)}>Mark Incorrect</Button>
                                </div>
                            )}
                             <Textarea
                                value={editableAttempt.feedback?.[q.id] || ''}
                                onChange={e => handleFeedbackChange(q.id, e.target.value)}
                                placeholder="Provide feedback for this question..."
                                className="mt-2"
                                rows={2}
                            />
                            <div className="mt-2">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Quick Feedback:</p>
                                <div className="flex flex-wrap gap-1">
                                    {feedbackSnippets.map(snippet => (
                                        <Button
                                            type="button"
                                            key={snippet.label}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-auto py-1 px-2"
                                            onClick={() => handleSnippetClick(q.id, snippet.text)}
                                            title={snippet.text}
                                        >
                                            {snippet.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Overall Feedback & Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                     <Textarea
                        value={editableAttempt.overallFeedback || ''}
                        onChange={e => setEditableAttempt(prev => ({...prev, overallFeedback: e.target.value}))}
                        placeholder="Provide overall feedback for the attempt..."
                        rows={3}
                    />
                    <div className="flex items-center gap-4">
                        <label className="font-medium">Final Score</label>
                        <Input
                            type="number"
                            className="w-24"
                            value={editableAttempt.overriddenScore ?? editableAttempt.score}
                            onChange={e => setEditableAttempt(prev => ({...prev, overriddenScore: parseInt(e.target.value) || 0}))}
                        />
                         <span className="text-slate-500">/ {editableAttempt.totalPoints}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t dark:border-slate-700">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Grade'}</Button>
            </div>
        </div>
    )
}

// --- ICONS ---
const CoffeeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>;
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

export default MentorGradingView;