
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, Quiz, Question } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';

// --- ICONS ---
const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;
const Wand2Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/><path d="M5 22v-5l-1.9-4.8-4.8-1.9 4.8-1.9L5 5v5"/><path d="M19 22v-5l1.9-4.8 4.8-1.9-4.8-1.9L19 5v5"/></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/><path d="M5 22v-5l-1.9-4.8-4.8-1.9 4.8-1.9L5 5v5"/><path d="M19 22v-5l1.9-4.8 4.8-1.9-4.8-1.9L19 5v5"/></svg>;
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const XIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

const MentorManualQuiz: React.FC = () => {
    const { courseId: paramCourseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState(paramCourseId || '');
    const [title, setTitle] = useState('');
    const [instructorName, setInstructorName] = useState(user?.name || '');
    const [quizLayout, setQuizLayout] = useState<'multiple-choice' | 'short-answer' | 'mixed'>('mixed');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [duration, setDuration] = useState<number>(15);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // AI State
    const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
    const [suggestions, setSuggestions] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            try {
                const allCourses = await api.getCourses();
                const mentorCourses = allCourses.filter(c => c.mentorId === user.id);
                setCourses(mentorCourses);
                
                if (paramCourseId) {
                    const active = mentorCourses.find(c => c.id === paramCourseId);
                    if (active) setTitle(`${active.title} Quiz`);
                } else if (mentorCourses.length > 0) {
                    setSelectedCourseId(mentorCourses[0].id);
                    setTitle(`${mentorCourses[0].title} Quiz`);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load courses.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [user, paramCourseId]);

    const handleCourseChange = (id: string) => {
        setSelectedCourseId(id);
        const course = courses.find(c => c.id === id);
        if (course) setTitle(`${course.title} Quiz`);
    }

    const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        (newQuestions[index] as any)[field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options) {
            newQuestions[qIndex].options![oIndex] = value;
        }
        setQuestions(newQuestions);
    };
    
    const handleDeleteQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleAddQuestion = () => {
        const type = quizLayout === 'mixed' ? 'multiple-choice' : quizLayout;
        const newQuestion: Question = {
            id: `new-q-${Date.now()}`,
            type: type,
            question: '',
            options: type === 'multiple-choice' ? ['', '', '', ''] : undefined,
            correctAnswer: '',
            points: 10,
            bloomsTaxonomy: 'Remembering'
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    const handleSaveQuiz = async () => {
        if (!selectedCourseId || !user) return;
        if (questions.length === 0) {
            setError("Please add at least one question.");
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const newQuiz: Omit<Quiz, 'id' | 'createdAt'> = {
                courseId: selectedCourseId,
                title,
                questions,
                difficulty,
                createdBy: user.id,
                duration,
                aiInvolvement: 'assisted'
            };
            await api.createQuiz(newQuiz);
            navigate(`/mentor/course/${selectedCourseId}`);
        } catch (err: any) {
            setError(err.message || "Failed to create quiz.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleGetSuggestions = async (index: number) => {
        const question = questions[index];
        const activeCourse = courses.find(c => c.id === selectedCourseId);
        if (!question.question.trim() || !question.correctAnswer.trim()) {
            alert("Please type a question and correct answer first so AI can provide specific suggestions.");
            return;
        }
        setAiLoading(prev => ({...prev, [question.id]: true}));
        try {
            const suggestion = await api.getQuestionAISuggestion(question, activeCourse?.title || 'General Course');
            setSuggestions(prev => ({...prev, [question.id]: suggestion}));
        } catch (err) {
            console.error("AI Suggestion failed", err);
        } finally {
            setAiLoading(prev => ({...prev, [question.id]: false}));
        }
    };

    const applySuggestion = (qIndex: number, type: 'question' | 'options' | 'taxonomy') => {
        const q = questions[qIndex];
        const sug = suggestions[q.id];
        if (!sug) return;

        const newQuestions = [...questions];
        if (type === 'question') newQuestions[qIndex].question = sug.improvedQuestion;
        if (type === 'options') newQuestions[qIndex].options = sug.suggestedOptions;
        if (type === 'taxonomy') newQuestions[qIndex].bloomsTaxonomy = sug.bloomsTaxonomy;

        setQuestions(newQuestions);
    };

    const discardSuggestion = (qId: string) => {
        setSuggestions(prev => {
            const next = {...prev};
            delete next[qId];
            return next;
        });
    };


    if (isLoading) return <div className="text-center p-8">Loading Quiz Builder...</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link to="/mentor/generate-quiz" className="text-sm text-indigo-600 hover:underline">← Back to Selection</Link>
                    <h1 className="text-4xl font-bold tracking-tight mt-1">Manual Quiz Builder</h1>
                    <p className="text-slate-500 dark:text-slate-400">Design your assessment from scratch with creative control.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/mentor/generate-quiz')}>Cancel</Button>
                    <Button onClick={handleSaveQuiz} disabled={isSaving || questions.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
                        {isSaving && <LoaderIcon className="w-4 h-4 mr-2" />}
                        Save Quiz
                    </Button>
                </div>
            </div>

            <Card className="bg-white dark:bg-slate-950 border-indigo-100 dark:border-indigo-900/30 shadow-sm overflow-hidden">
                <div className="h-1 bg-violet-500" />
                <CardHeader>
                    <CardTitle className="text-xl">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Target Course</label>
                        <Select value={selectedCourseId} onChange={e => handleCourseChange(e.target.value)}>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Quiz Title</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Weekly Mastery Quiz" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Instructor Name</label>
                        <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Default Layout</label>
                        <Select value={quizLayout} onChange={e => setQuizLayout(e.target.value as any)}>
                            <option value="mixed">Mixed (Recommended)</option>
                            <option value="multiple-choice">Multiple Choice Only</option>
                            <option value="short-answer">Short Answer Only</option>
                        </Select>
                    </div>
                </CardContent>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-0">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Difficulty Level</label>
                        <Select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Timer (minutes)</label>
                        <Input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} min={1} />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h2 className="text-2xl font-bold">Questions ({questions.length})</h2>
                    <Button onClick={handleAddQuestion} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <PlusCircleIcon className="w-4 h-4 mr-2" />
                        Add New Question
                    </Button>
                </div>

                {questions.map((q, index) => {
                    const suggestion = suggestions[q.id];
                    const isLoadingSug = aiLoading[q.id];

                    return (
                        <div key={q.id} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                            <Card className="lg:col-span-2 relative group overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm transition-shadow hover:shadow-md">
                                <CardHeader className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-900/50 py-3 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-white dark:bg-slate-900">Q{index + 1}</Badge>
                                        <div className="flex gap-2">
                                            <Badge 
                                                variant={q.type === 'multiple-choice' ? 'default' : 'secondary'} 
                                                className="cursor-pointer"
                                                onClick={() => handleQuestionChange(index, 'type', q.type === 'multiple-choice' ? 'short-answer' : 'multiple-choice')}
                                            >
                                                {q.type === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold flex justify-between text-slate-700 dark:text-slate-300">
                                            <span>Question Text</span>
                                            {q.bloomsTaxonomy && <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wider">{q.bloomsTaxonomy}</Badge>}
                                        </label>
                                        <Textarea 
                                            value={q.question} 
                                            onChange={e => handleQuestionChange(index, 'question', e.target.value)} 
                                            placeholder="Write your question..."
                                            rows={3} 
                                            className="bg-white dark:bg-slate-950"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            {q.type === 'multiple-choice' ? (
                                                <>
                                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Options</label>
                                                    {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex items-center gap-3 group/opt">
                                                            <input 
                                                                type="radio" 
                                                                name={`correct-${q.id}`} 
                                                                checked={opt === q.correctAnswer && opt !== ''} 
                                                                onChange={() => handleQuestionChange(index, 'correctAnswer', opt)} 
                                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <Input 
                                                                value={opt} 
                                                                onChange={e => handleOptionChange(index, oIdx, e.target.value)} 
                                                                placeholder={`Option ${oIdx + 1}`}
                                                                className={cn(
                                                                    "bg-white dark:bg-slate-950",
                                                                    opt === q.correctAnswer && opt !== '' && "border-green-500 ring-1 ring-green-500"
                                                                )}
                                                            />
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400">
                                                    <p className="text-xs">Short Answer Mode Enabled</p>
                                                    <p className="text-[10px] mt-1">Students will type their answer.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Correct Answer Key</label>
                                                <Input 
                                                    value={q.correctAnswer} 
                                                    onChange={e => handleQuestionChange(index, 'correctAnswer', e.target.value)} 
                                                    placeholder="The expected correct response"
                                                    className="bg-white dark:bg-slate-950"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Blooms Taxonomy</label>
                                                    <Select value={q.bloomsTaxonomy} onChange={e => handleQuestionChange(index, 'bloomsTaxonomy', e.target.value)}>
                                                        <option value="Remembering">Remembering</option>
                                                        <option value="Understanding">Understanding</option>
                                                        <option value="Applying">Applying</option>
                                                        <option value="Analyzing">Analyzing</option>
                                                        <option value="Evaluating">Evaluating</option>
                                                        <option value="Creating">Creating</option>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Points</label>
                                                    <Input 
                                                        type="number" 
                                                        value={q.points} 
                                                        onChange={e => handleQuestionChange(index, 'points', parseInt(e.target.value) || 0)} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 justify-center py-2">
                                     <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleGetSuggestions(index)}
                                        disabled={isLoadingSug}
                                        className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 gap-2"
                                    >
                                        {isLoadingSug ? <LoaderIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                        Analyze with AI
                                    </Button>
                                </CardFooter>
                            </Card>

                            <div className="flex flex-col gap-4">
                                {isLoadingSug ? (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 dark:border-indigo-900/30 rounded-xl p-8 bg-indigo-50/20">
                                        <LoaderIcon className="w-10 h-10 text-indigo-400 mb-3" />
                                        <p className="text-sm font-medium text-indigo-600 animate-pulse text-center">Consulting AI Pedagogical Expert...</p>
                                    </div>
                                ) : suggestion ? (
                                    <div className="flex flex-col gap-3 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bg-indigo-600 rounded">
                                                    <SparklesIcon className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">AI Feedback</span>
                                            </div>
                                            <button onClick={() => discardSuggestion(q.id)} className="text-slate-400 hover:text-red-500">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10">
                                            <CardHeader className="p-3 pb-1">
                                                <p className="text-[10px] font-bold text-indigo-600 uppercase">Improved Phrasing</p>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0">
                                                <p className="text-xs text-slate-800 dark:text-slate-200 italic mb-2">"{suggestion.improvedQuestion}"</p>
                                                <Button size="sm" variant="outline" onClick={() => applySuggestion(index, 'question')} className="h-7 text-[10px] w-full border-indigo-200 hover:bg-indigo-50">
                                                    Apply This Wording
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        {suggestion.suggestedOptions && suggestion.suggestedOptions.length > 0 && (
                                            <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10">
                                                <CardHeader className="p-3 pb-1">
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase">Suggested Distractors</p>
                                                </CardHeader>
                                                <CardContent className="p-3 pt-0">
                                                    <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1 mb-2 list-disc pl-3">
                                                        {suggestion.suggestedOptions.map((o: string, i: number) => (
                                                            <li key={i}>{o}</li>
                                                        ))}
                                                    </ul>
                                                    <Button size="sm" variant="outline" onClick={() => applySuggestion(index, 'options')} className="h-7 text-[10px] w-full border-indigo-200 hover:bg-indigo-50">
                                                        Use AI Options
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        )}
                                        
                                        <div className="p-3 bg-slate-100 dark:bg-slate-900 border rounded-lg">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Reasoning</p>
                                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">{suggestion.reasoning}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 opacity-60">
                                        <BotIcon className="w-10 h-10 text-slate-300 mb-3" />
                                        <p className="text-[11px] text-center text-slate-500 leading-relaxed">
                                            Click "Analyze with AI" to get professional feedback on your question's pedagogical quality.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {questions.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <PlusCircleIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold">Your quiz has no questions</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-1 mb-6">Manually add your first question and optionally use AI to refine it.</p>
                        <Button onClick={handleAddQuestion} className="bg-indigo-600 hover:bg-indigo-700">Add First Question</Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};

const BotIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;

export default MentorManualQuiz;
