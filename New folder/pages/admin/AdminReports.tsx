import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import * as api from '../../lib/api';
import { Course, QuizAttempt, User, Quiz } from '../../types';

interface ReportStats {
    activeUsers: number;
    avgSessionDuration: string;
    loginSuccessRate: string;
    avgCompletionRate: number;
    newEnrollments: number;
    avgScore: number;
    totalAttempts: number;
    lowestAvgScoreCourse: number;
    highestAvgScoreCourse: number;
}

const AdminReports: React.FC = () => {
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const generateReport = async () => {
            setIsLoading(true);
            try {
                const [users, courses, allAttempts, allQuizzes] = await Promise.all([
                    api.getUsers(),
                    api.getCourses(),
                    api.getAllAttempts(),
                    api.getQuizzes(),
                ]);

                const filteredAttempts = allAttempts.filter(attempt => {
                    const attemptDate = new Date(attempt.submittedAt);
                    return attemptDate >= new Date(startDate) && attemptDate <= new Date(endDate);
                });

                // User Engagement
                const activeUsers = users.length; // Simple metric for mock data

                // Course & Quiz Performance
                let totalScoreSum = 0;
                const courseScores: { [courseId: string]: { total: number, count: number } } = {};

                filteredAttempts.forEach(attempt => {
                    totalScoreSum += (attempt.score / attempt.totalPoints) * 100;
                    const quiz = allQuizzes.find(q => q.id === attempt.quizId);
                    if (quiz) {
                        if (!courseScores[quiz.courseId]) {
                            courseScores[quiz.courseId] = { total: 0, count: 0 };
                        }
                        courseScores[quiz.courseId].total += (attempt.score / attempt.totalPoints) * 100;
                        courseScores[quiz.courseId].count++;
                    }
                });

                const avgScore = filteredAttempts.length > 0 ? Math.round(totalScoreSum / filteredAttempts.length) : 0;

                const courseAverages = Object.values(courseScores)
                    .map(data => data.count > 0 ? data.total / data.count : 0)
                    .filter(avg => avg > 0);
                
                const lowestAvgScoreCourse = courseAverages.length > 0 ? Math.round(Math.min(...courseAverages)) : 0;
                const highestAvgScoreCourse = courseAverages.length > 0 ? Math.round(Math.max(...courseAverages)) : 0;

                setStats({
                    activeUsers,
                    avgSessionDuration: '24m 15s', // Mock
                    loginSuccessRate: '88%', // Mock
                    avgCompletionRate: avgScore, // Using avg quiz score as a proxy
                    newEnrollments: filteredAttempts.length, // Using attempts as a proxy
                    avgScore,
                    totalAttempts: filteredAttempts.length,
                    lowestAvgScoreCourse,
                    highestAvgScoreCourse,
                });

            } catch (error) {
                console.error("Failed to generate report", error);
            } finally {
                setIsLoading(false);
            }
        };

        generateReport();
    }, [startDate, endDate]);
    
    const handleExport = () => {
        console.log(`Exporting report from ${startDate} to ${endDate}`);
        alert(`A report from ${startDate} to ${endDate} would be exported.`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Reports</h1>
                    <p className="text-slate-500 dark:text-slate-400">Generate and view detailed reports on platform activity.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40"/>
                    <span className="text-slate-500">to</span>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40"/>
                    <Button variant="outline" onClick={handleExport}>
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>
            
            {isLoading ? <p>Generating report...</p> : !stats ? <p>Could not load report data.</p> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>User Engagement</CardTitle>
                            <CardDescription>Metrics on user activity and retention.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex justify-around text-center">
                                <div>
                                    <p className="text-2xl font-bold">{stats.activeUsers}</p>
                                    <p className="text-sm text-slate-500">Total Users</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.avgSessionDuration}</p>
                                    <p className="text-sm text-slate-500">Avg. Session Duration</p>
                                </div>
                                 <div>
                                    <p className="text-2xl font-bold">{stats.loginSuccessRate}</p>
                                    <p className="text-sm text-slate-500">Login Success Rate</p>
                                </div>
                           </div>
                           <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                                <p className="text-sm text-slate-500">[Chart: Daily Active Users]</p>
                           </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Course Performance</CardTitle>
                            <CardDescription>Insights into course popularity and completion.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex justify-around text-center">
                                <div>
                                    <p className="text-2xl font-bold">{stats.avgCompletionRate}%</p>
                                    <p className="text-sm text-slate-500">Avg. Quiz Score</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.newEnrollments}</p>
                                    <p className="text-sm text-slate-500">Quiz Attempts in Period</p>
                                </div>
                           </div>
                           <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                                <p className="text-sm text-slate-500">[Chart: Top 5 Most Popular Courses]</p>
                           </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Quiz & Assessment Analytics</CardTitle>
                            <CardDescription>Overall performance in quizzes across all courses.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{stats.avgScore}%</p>
                                    <p className="text-sm text-slate-500">Avg. Score</p>
                                </div>
                                 <div>
                                    <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                                    <p className="text-sm text-slate-500">Total Attempts</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-600">{stats.lowestAvgScoreCourse}%</p>
                                    <p className="text-sm text-slate-500">Lowest Avg. Score (Course)</p>
                                </div>
                                 <div>
                                    <p className="text-2xl font-bold text-blue-600">{stats.highestAvgScoreCourse}%</p>
                                    <p className="text-sm text-slate-500">Highest Avg. Score (Course)</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Most Difficult Questions (Lowest correct %):</h4>
                                <ul className="text-sm space-y-2 list-decimal list-inside bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                                    <li>"What is the output of `console.log(typeof null)`?" - <span className="font-semibold">32% Correct</span></li>
                                    <li>"Explain the concept of 'hoisting' in JavaScript." - <span className="font-semibold">41% Correct</span></li>
                                    <li>"Which hook is used for managing state in a functional component?" - <span className="font-semibold">45% Correct</span></li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);


export default AdminReports;
