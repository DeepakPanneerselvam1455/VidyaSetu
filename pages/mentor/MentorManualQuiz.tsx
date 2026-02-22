
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
import {
    LoaderIcon,
    Wand2Icon,
    TrashIcon,
    PlusCircleIcon,
    SparklesIcon,
    CheckIcon,
    XIcon,
    BotIcon
} from '../../components/ui/Icons';

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
        setAiLoading(prev => ({ ...prev, [question.id]: true }));
        try {
            const suggestion = await api.getQuestionAISuggestion(question, activeCourse?.title || 'General Course');
            setSuggestions(prev => ({ ...prev, [question.id]: suggestion }));
        } catch (err) {
            console.error("AI Suggestion failed", err);
        } finally {
            setAiLoading(prev => ({ ...prev, [question.id]: false }));
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
            const next = { ...prev };
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
                    <p style={{ color: 'var(--text-secondary)' }}>Design your assessment from scratch with creative control.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/mentor/generate-quiz')}>Cancel</Button>
                    <Button onClick={handleSaveQuiz} disabled={isSaving || questions.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
                        {isSaving && <LoaderIcon className="w-4 h-4 mr-2" />}
                        Save Quiz
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
                <div className="h-1 bg-violet-500" />
                <CardHeader>
                    <CardTitle className="text-xl">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Target Course</label>
                        <Select value={selectedCourseId} onChange={e => handleCourseChange(e.target.value)}>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Quiz Title</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Weekly Mastery Quiz" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Instructor Name</label>
                        <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Default Layout</label>
                        <Select value={quizLayout} onChange={e => setQuizLayout(e.target.value as any)}>
                            <option value="mixed">Mixed (Recommended)</option>
                            <option value="multiple-choice">Multiple Choice Only</option>
                            <option value="short-answer">Short Answer Only</option>
                        </Select>
                    </div>
                </CardContent>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-0">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Difficulty Level</label>
                        <Select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Timer (minutes)</label>
                        <Input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} min={1} />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-default)' }}>
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
                            <Card className="lg:col-span-2 relative group overflow-hidden shadow-sm transition-shadow hover:shadow-md" style={{ borderColor: 'var(--border-default)' }}>
                                <CardHeader className="flex-row items-center justify-between py-3 border-b" style={{ backgroundColor: 'var(--kpi-icon-chip)', borderColor: 'var(--border-default)' }}>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" style={{ backgroundColor: 'var(--card-bg)' }}>Q{index + 1}</Badge>
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
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                                            <span>Question Text</span>
                                            {q.bloomsTaxonomy && <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wider">{q.bloomsTaxonomy}</Badge>}
                                        </label>
                                        <Textarea
                                            value={q.question}
                                            onChange={e => handleQuestionChange(index, 'question', e.target.value)}
                                            placeholder="Write your question..."
                                            rows={3}
                                            className=""
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            {q.type === 'multiple-choice' ? (
                                                <>
                                                    <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Options</label>
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
                                                                    "",
                                                                    opt === q.correctAnswer && opt !== '' && "border-green-500 ring-1 ring-green-500"
                                                                )}
                                                            />
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center" style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}>
                                                    <p className="text-xs">Short Answer Mode Enabled</p>
                                                    <p className="text-[10px] mt-1">Students will type their answer.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Correct Answer Key</label>
                                                <Input
                                                    value={q.correctAnswer}
                                                    onChange={e => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                                                    placeholder="The expected correct response"
                                                    className=""
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Blooms Taxonomy</label>
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
                                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Points</label>
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
                                <CardFooter className="border-t justify-center py-2" style={{ backgroundColor: 'var(--kpi-icon-chip)', borderColor: 'var(--border-default)' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleGetSuggestions(index)}
                                        disabled={isLoadingSug}
                                        className="gap-2" style={{ color: 'var(--primary)' }}
                                    >
                                        {isLoadingSug ? <LoaderIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                        Analyze with AI
                                    </Button>
                                </CardFooter>
                            </Card>

                            <div className="flex flex-col gap-4">
                                {isLoadingSug ? (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8" style={{ borderColor: 'var(--primary)', backgroundColor: 'color-mix(in srgb, var(--primary) 5%, transparent)' }}>
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

                                        <Card className="ai-card-glow">
                                            <CardHeader className="p-3 pb-1">
                                                <p className="text-[10px] font-bold text-indigo-600 uppercase">Improved Phrasing</p>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0">
                                                <p className="text-xs italic mb-2" style={{ color: 'var(--text-main)' }}>"{suggestion.improvedQuestion}"</p>
                                                <Button size="sm" variant="outline" onClick={() => applySuggestion(index, 'question')} className="h-7 text-[10px] w-full border-indigo-200 hover:bg-indigo-50">
                                                    Apply This Wording
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        {suggestion.suggestedOptions && suggestion.suggestedOptions.length > 0 && (
                                            <Card className="ai-card-glow">
                                                <CardHeader className="p-3 pb-1">
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase">Suggested Distractors</p>
                                                </CardHeader>
                                                <CardContent className="p-3 pt-0">
                                                    <ul className="text-[10px] space-y-1 mb-2 list-disc pl-3" style={{ color: 'var(--text-secondary)' }}>
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

                                        <div className="p-3 border rounded-lg" style={{ backgroundColor: 'var(--kpi-icon-chip)', borderColor: 'var(--border-default)' }}>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Reasoning</p>
                                            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{suggestion.reasoning}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 opacity-60" style={{ borderColor: 'var(--border-strong)' }}>
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
                    <div className="text-center py-20 rounded-xl border-2 border-dashed" style={{ backgroundColor: 'var(--kpi-icon-chip)', borderColor: 'var(--border-strong)' }}>
                        <PlusCircleIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold">Your quiz has no questions</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-1 mb-6">Manually add your first question and optionally use AI to refine it.</p>
                        <Button onClick={handleAddQuestion} className="bg-indigo-600 hover:bg-indigo-700">Add First Question</Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 border rounded-lg text-red-600 text-sm" style={{ backgroundColor: 'color-mix(in srgb, red 10%, transparent)', borderColor: 'color-mix(in srgb, red 30%, transparent)' }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default MentorManualQuiz;
