import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { Course, Quiz, Question } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { cn } from '../../lib/utils';
import Dialog from '../../components/ui/Dialog';

// --- ICONS ---
const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;
const Wand2Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/><path d="M5 22v-5"/><path d="M19 22v-5"/><path d="M5 2h14"/><path d="M5 2h14"/></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const GitCompareArrowsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="3" /><path d="M5 9v12" /><circle cx="19" cy="18" r="3" /><path d="M19 15V6" /><path d="m15 9-3-3 3-3" /><path d="m9 21 3-3-3-3" /></svg>;


const MentorEditQuiz: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // AI State
    const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!quizId) return;
            try {
                const quizData = await api.getQuizById(quizId);
                if (!quizData) throw new Error("Quiz not found.");
                setQuiz(quizData);
                const courseData = await api.getCourseById(quizData.courseId);
                setCourse(courseData);
            } catch (err: any) {
                setError(err.message || "Failed to load quiz data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleQuizChange = (field: keyof Quiz, value: any) => {
        setQuiz(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
        setQuiz(prev => {
            if (!prev) return null;
            const newQuestions = [...prev.questions];
            (newQuestions[index] as any)[field] = value;
            return { ...prev, questions: newQuestions };
        });
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        setQuiz(prev => {
            if (!prev) return null;
            const newQuestions = [...prev.questions];
            if (newQuestions[qIndex].options) {
                newQuestions[qIndex].options![oIndex] = value;
            }
            return { ...prev, questions: newQuestions };
        });
    };
    
    const handleDeleteQuestion = (index: number) => {
        setQuiz(prev => prev ? ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }) : null);
    };
    
    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: `new-q-${Date.now()}`,
            type: 'multiple-choice',
            question: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            points: 10,
        };
        setQuiz(prev => prev ? ({ ...prev, questions: [...prev.questions, newQuestion] }) : null);
    };

    const handleSaveChanges = async () => {
        if (!quiz) return;
        setIsSaving(true);
        setError(null);
        try {
            await api.updateQuiz(quiz);
            navigate(`/mentor/course/${quiz.courseId}`);
        } catch (err: any) {
            setError(err.message || "Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleImproveQuestion = async (index: number) => {
        if (!quiz) return;
        const question = quiz.questions[index];
        setAiLoading(prev => ({...prev, [question.id]: true}));
        setError(null);
        try {
            const improved = await api.improveQuestionWithAI(question, quiz);
            setQuiz(prev => {
                if (!prev) return null;
                const newQuestions = [...prev.questions];
                newQuestions[index] = {
                    ...newQuestions[index],
                    ...improved
                };
                return { ...prev, questions: newQuestions };
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAiLoading(prev => ({...prev, [question.id]: false}));
        }
    };
    
    const handleGenerateOptions = async (index: number) => {
        if (!quiz) return;
        const question = quiz.questions[index];
        setAiLoading(prev => ({...prev, [`${question.id}-opts`]: true}));
        setError(null);
        try {
            const newOptions = await api.generateAlternativeOptionsWithAI(question);
            handleQuestionChange(index, 'options', newOptions);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAiLoading(prev => ({...prev, [`${question.id}-opts`]: false}));
        }
    };


    if (isLoading) return <div className="text-center p-8">Loading Quiz Editor...</div>;
    if (!quiz || !course) return <div className="text-center p-8 text-red-500">{error || "Quiz could not be loaded."}</div>;

    return (
        <div className="space-y-6">
            <div>
                <Link to={`/mentor/course/${quiz.courseId}`} className="text-sm text-indigo-600 hover:underline">← Back to Course</Link>
                <h1 className="text-4xl font-bold tracking-tight mt-1">Edit Quiz</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                    <CardDescription>Update the general information for your quiz.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="quizTitle" className="block text-sm font-medium mb-1">Quiz Title</label>
                        <Input id="quizTitle" value={quiz.title} onChange={e => handleQuizChange('title', e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="quizDifficulty" className="block text-sm font-medium mb-1">Difficulty</label>
                        <Select id="quizDifficulty" value={quiz.difficulty} onChange={e => handleQuizChange('difficulty', e.target.value)}>
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="quizDuration" className="block text-sm font-medium mb-1">Duration (minutes)</label>
                        <Select id="quizDuration" value={quiz.duration || 5} onChange={e => handleQuizChange('duration', parseInt(e.target.value))}>
                            <option value={5}>5</option><option value={10}>10</option><option value={15}>15</option><option value={30}>30</option>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Questions ({quiz.questions.length})</CardTitle>
                    <CardDescription>Edit, add, or remove questions below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {quiz.questions.map((q, index) => (
                        <Card key={q.id} className="bg-slate-50 dark:bg-slate-900/50">
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(index)}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Question Text</label>
                                    <div className="flex items-start gap-2">
                                        <Textarea value={q.question} onChange={e => handleQuestionChange(index, 'question', e.target.value)} rows={3} />
                                        <Button variant="outline" size="sm" onClick={() => handleImproveQuestion(index)} disabled={aiLoading[q.id]} className="h-auto">
                                            {aiLoading[q.id] ? <LoaderIcon className="w-4 h-4" /> : <Wand2Icon className="w-4 h-4" />}<span className="ml-2 hidden sm:inline">Improve with AI</span>
                                        </Button>
                                    </div>
                                </div>
                                
                                {q.type === 'multiple-choice' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium">Options</label>
                                            <Button variant="outline" size="sm" onClick={() => handleGenerateOptions(index)} disabled={aiLoading[`${q.id}-opts`]}>
                                                {aiLoading[`${q.id}-opts`] ? <LoaderIcon className="w-4 h-4" /> : <Wand2Icon className="w-4 h-4" />}<span className="ml-2 hidden sm:inline">Suggest Options</span>
                                            </Button>
                                        </div>
                                        {q.options?.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input type="radio" name={`correct-${q.id}`} checked={opt === q.correctAnswer} onChange={() => handleQuestionChange(index, 'correctAnswer', opt)} />
                                                <Input value={opt} onChange={e => handleOptionChange(index, i, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'short-answer' && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Correct Answer</label>
                                        <Input value={q.correctAnswer} onChange={e => handleQuestionChange(index, 'correctAnswer', e.target.value)} />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Points</label>
                                    <Input type="number" value={q.points} onChange={e => handleQuestionChange(index, 'points', parseInt(e.target.value))} className="w-24" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={handleAddQuestion}><PlusCircleIcon className="w-4 h-4 mr-2" />Add Question</Button>
                </CardFooter>
            </Card>
            
             <CardFooter className="flex justify-end gap-2 px-0">
                {error && <p className="text-sm text-red-500 mr-auto">{error}</p>}
                <Button variant="outline" onClick={() => navigate(`/mentor/course/${quiz.courseId}`)}>Cancel</Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <LoaderIcon className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </CardFooter>
        </div>
    );
};

export default MentorEditQuiz;
