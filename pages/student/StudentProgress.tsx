
import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { QuizAttempt, Quiz, Course } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface TopicPerformance {
    topic: string;
    averageScore: number;
    attempts: number;
}

const StudentProgress: React.FC = () => {
    const { user } = useAuth();
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [quizzes, setQuizzes] = useState<{ [id: string]: Quiz }>({});
    const [courses, setCourses] = useState<{ [id: string]: Course }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [userAttempts, allQuizzes, allCourses] = await Promise.all([
                    api.getStudentProgress(user.id),
                    api.getQuizzes(),
                    api.getCourses()
                ]);
                
                setAttempts(userAttempts.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()));
                
                const quizzesMap = allQuizzes.reduce((acc, quiz) => {
                    acc[quiz.id] = quiz;
                    return acc;
                }, {} as { [id: string]: Quiz });
                setQuizzes(quizzesMap);

                const coursesMap = allCourses.reduce((acc, course) => {
                    acc[course.id] = course;
                    return acc;
                }, {} as { [id: string]: Course });
                setCourses(coursesMap);

            } catch (error) {
                console.error("Failed to fetch student progress", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const chartData = useMemo(() => {
        return attempts.map(attempt => ({
            name: quizzes[attempt.quizId]?.title || 'Quiz',
            score: attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0,
            date: new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })).slice(-10); // last 10 attempts
    }, [attempts, quizzes]);

    const topicPerformance = useMemo((): TopicPerformance[] => {
        const performance: { [topic: string]: { totalScore: number, count: number } } = {};

        attempts.forEach(attempt => {
            const quiz = quizzes[attempt.quizId];
            if (quiz) {
                const course = courses[quiz.courseId];
                if (course) {
                    const topic = course.title; // Using course title as the main topic
                    if (!performance[topic]) {
                        performance[topic] = { totalScore: 0, count: 0 };
                    }
                    performance[topic].totalScore += attempt.totalPoints > 0 ? (attempt.score / attempt.totalPoints) * 100 : 0;
                    performance[topic].count++;
                }
            }
        });

        return Object.entries(performance).map(([topic, data]) => ({
            topic,
            attempts: data.count,
            averageScore: Math.round(data.totalScore / data.count),
        })).sort((a,b) => b.averageScore - a.averageScore);
    }, [attempts, quizzes, courses]);
    
    const summaryStats = useMemo(() => {
        if (attempts.length === 0) {
            return {
                overallAverageScore: 0,
                completedQuizzes: 0,
                bestTopic: null,
                topicToImprove: null,
            };
        }
        const totalScore = attempts.reduce((acc, a) => acc + (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0), 0);
        const overallAverageScore = Math.round(totalScore / attempts.length);
        const completedQuizzes = attempts.length;
        const bestTopic = topicPerformance.length > 0 ? topicPerformance[0] : null;
        const topicToImprove = topicPerformance.length > 1 ? topicPerformance[topicPerformance.length - 1] : null;

        return {
            overallAverageScore,
            completedQuizzes,
            bestTopic,
            topicToImprove,
        };
    }, [attempts, topicPerformance]);
    
    const detailedAttempts = useMemo(() => {
        return [...attempts]
            .reverse()
            .map(attempt => {
                const quiz = quizzes[attempt.quizId];
                const course = quiz ? courses[quiz.courseId] : null;
                const percentage = attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0;
                return {
                    ...attempt,
                    quizTitle: quiz?.title || 'Unknown Quiz',
                    courseTitle: course?.title || 'Unknown Course',
                    difficulty: quiz?.difficulty,
                    percentage,
                };
            });
    }, [attempts, quizzes, courses]);


    // SVG Line Chart constants and calculations
    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 220; // Increased height for X-axis labels
    const PADDING = 30;
    const Y_AXIS_LABELS = [0, 25, 50, 75, 100];

    const pointCoordinates = useMemo(() => {
        if (chartData.length < 2) return [];
        return chartData.map((data, index) => {
            const x = PADDING + (index / (chartData.length - 1)) * (SVG_WIDTH - 2 * PADDING);
            const y = (SVG_HEIGHT - PADDING) - (data.score / 100) * (SVG_HEIGHT - 2 * PADDING);
            return { x, y };
        });
    }, [chartData]);

    const pathData = useMemo(() => {
        if (pointCoordinates.length < 2) return '';
        return pointCoordinates
            .map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`)
            .join(' ');
    }, [pointCoordinates]);
    
    const getPerformanceColor = (score: number): string => {
        if (score >= 75) return 'bg-green-600';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-red-600';
    };

    const getDifficultyBadgeVariant = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | undefined): 'success' | 'secondary' | 'destructive' => {
        switch (difficulty) {
            case 'Beginner': return 'success';
            case 'Intermediate': return 'secondary';
            case 'Advanced': return 'destructive';
            default: return 'secondary';
        }
    }

    if (isLoading) {
        return <div className="text-center p-8">Loading progress...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <StatCard 
                    icon={<PercentIcon className="w-[30px] h-[30px] text-blue-500" />} 
                    title="Overall Average Score" 
                    value={`${summaryStats.overallAverageScore}%`} 
                    description="Across all completed quizzes"
                />
                <StatCard 
                    icon={<CheckCircle2Icon className="w-[30px] h-[30px] text-green-500" />} 
                    title="Quizzes Completed" 
                    value={summaryStats.completedQuizzes} 
                    description="Total quizzes you have taken"
                />
                <StatCard 
                    icon={<AwardIcon className="w-[30px] h-[30px] text-yellow-500" />} 
                    title="Best Topic" 
                    value={summaryStats.bestTopic ? summaryStats.bestTopic.topic : 'N/A'}
                    description={summaryStats.bestTopic ? `Avg score: ${summaryStats.bestTopic.averageScore}%` : 'Complete a quiz to find out'}
                />
                <StatCard 
                    icon={<TrendingDownIcon className="w-[30px] h-[30px] text-red-500" />} 
                    title="Needs Improvement" 
                    value={summaryStats.topicToImprove ? summaryStats.topicToImprove.topic : 'N/A'}
                    description={summaryStats.topicToImprove ? `Avg score: ${summaryStats.topicToImprove.averageScore}%` : 'Keep learning!'}
                />
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Performance Trend</CardTitle>
                        <CardDescription>Your scores on the last {chartData.length} quizzes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 1 ? (
                            <div className="relative w-full h-80" onMouseLeave={() => setHoveredIndex(null)}>
                                <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full" aria-labelledby="chart-title" role="img">
                                    <title id="chart-title">Line chart showing quiz score trend</title>
                                    {Y_AXIS_LABELS.map(label => {
                                        const y = (SVG_HEIGHT - PADDING) - (label / 100) * (SVG_HEIGHT - 2 * PADDING);
                                        return (
                                            <g key={label} className="text-slate-400 dark:text-slate-600">
                                                <text x={PADDING - 10} y={y + 3} textAnchor="end" className="text-xs fill-current">{label}%</text>
                                                <line x1={PADDING} x2={SVG_WIDTH - PADDING} y1={y} y2={y} className="stroke-current opacity-50" strokeDasharray="2,4" />
                                            </g>
                                        );
                                    })}
                                    <line x1={PADDING} x2={SVG_WIDTH - PADDING} y1={SVG_HEIGHT - PADDING} y2={SVG_HEIGHT - PADDING} className="stroke-current text-slate-300 dark:text-slate-700" />
                                    {pointCoordinates.map(({ x }, index) => (
                                        <text
                                            key={`x-label-${index}`}
                                            x={x}
                                            y={SVG_HEIGHT - PADDING + 15}
                                            textAnchor="middle"
                                            className="text-xs fill-current text-slate-500 dark:text-slate-400"
                                        >
                                            {chartData[index].date}
                                        </text>
                                    ))}
                                    <path d={pathData} fill="none" strokeWidth="2" className="text-indigo-500 stroke-current" />
                                    {pointCoordinates.map(({ x, y }, index) => (
                                        <g key={index}>
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={hoveredIndex === index ? 7 : 4}
                                                className="text-indigo-500 fill-current transition-all stroke-white dark:stroke-slate-900"
                                                strokeWidth={hoveredIndex === index ? 2 : 0}
                                            />
                                            <rect x={x - 10} y={y - 10} width="20" height="20" fill="transparent" onMouseEnter={() => setHoveredIndex(index)} />
                                        </g>
                                    ))}
                                </svg>
                                {hoveredIndex !== null && (
                                    <div
                                        className="absolute p-2 text-sm bg-slate-900 text-white rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity z-10 animate-in fade-in-0 zoom-in-95"
                                        style={{
                                            left: `${(pointCoordinates[hoveredIndex].x / SVG_WIDTH) * 100}%`,
                                            top: `${(pointCoordinates[hoveredIndex].y / SVG_HEIGHT) * 100}%`,
                                            marginTop: '-10px'
                                        }}
                                    >
                                        <p className="font-semibold whitespace-nowrap">{chartData[hoveredIndex].name}</p>
                                        <p>Score: <span className="font-bold">{chartData[hoveredIndex].score}%</span></p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10 h-80 flex flex-col items-center justify-center">
                                <BarChartIcon className="w-[46px] h-[46px] text-slate-400 mb-2" />
                                <p className="font-semibold">Not Enough Data</p>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    {attempts.length < 2 ? "Complete at least two quizzes to see your trend!" : "Take a quiz to start tracking your progress."}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Performance by Topic</CardTitle>
                        <CardDescription>Your average scores by course.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topicPerformance.length > 0 ? (
                            <ul className="space-y-3">
                                {topicPerformance.map(item => (
                                    <li key={item.topic}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">{item.topic}</span>
                                            <span className="text-sm font-bold">{item.averageScore}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${getPerformanceColor(item.averageScore)}`}
                                                style={{ width: `${item.averageScore}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-slate-500 text-right mt-1">{item.attempts} attempt(s)</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-slate-500 dark:text-slate-400 text-center py-8">No topic data available yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Recent Attempts</CardTitle>
                    <CardDescription>A detailed log of your last 5 quiz attempts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {detailedAttempts.length > 0 ? (
                        <div className="space-y-4">
                            {detailedAttempts.slice(0, 5).map(attempt => (
                                <div key={attempt.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{attempt.quizTitle}</h3>
                                            {attempt.difficulty && <Badge variant={getDifficultyBadgeVariant(attempt.difficulty)}>{attempt.difficulty}</Badge>}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            From course: {attempt.courseTitle}
                                        </p>
                                    </div>
                                    <div className="w-full sm:w-64 space-y-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm font-medium">Score: {attempt.score}/{attempt.totalPoints}</span>
                                            <span className="text-lg font-bold">{attempt.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${attempt.percentage}%` }}></div>
                                        </div>
                                         <p className="text-xs text-slate-500 text-right">
                                            Submitted on: {new Date(attempt.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-16">
                            <HistoryIcon className="w-[46px] h-[46px] text-slate-400 mx-auto mb-2" />
                            <p className="font-semibold">No History Yet</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Your quiz attempts will be logged here once you complete them.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const StatCard: React.FC<{
    icon: React.ReactNode; 
    title: string; 
    value: string | number;
    description?: string;
}> = ({ icon, title, value, description }) => (
    <Card className="flex items-center p-6 gap-6">
        <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg shrink-0">{icon}</div>
        <div className="overflow-hidden">
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</dt>
            <dd className="text-3xl font-bold truncate">{value}</dd>
            {description && <p className="text-xs text-slate-500 truncate">{description}</p>}
        </div>
    </Card>
);

const PercentIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const CheckCircle2Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>;
const TrendingDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>;
const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;

export default StudentProgress;
