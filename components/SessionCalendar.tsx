
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO, isToday } from 'date-fns';
import { TutoringSession } from '../types';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { Card } from './ui/Card';

// Icons
const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;

interface SessionCalendarProps {
    sessions: TutoringSession[];
    onSessionClick: (session: TutoringSession) => void;
    onDateClick?: (date: Date) => void;
    className?: string;
}

export const SessionCalendar: React.FC<SessionCalendarProps> = ({ sessions, onSessionClick, onDateClick, className }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getSessionsForDay = (date: Date) => {
        return sessions.filter(session => isSameDay(parseISO(session.startTime), date));
    };

    return (
        <Card className={cn("p-4 md:p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                            <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={goToToday}>Today</Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 py-2">
                        {day}
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
                {days.map((day, i) => {
                    const daySessions = getSessionsForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isDayToday = isToday(day);

                    return (
                        <div 
                            key={day.toISOString()}
                            className={cn(
                                "min-h-[100px] border rounded-lg p-2 flex flex-col transition-colors relative group",
                                isCurrentMonth ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "bg-slate-50 dark:bg-slate-950/50 border-transparent text-slate-400 dark:text-slate-600",
                                isDayToday && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900",
                                onDateClick && isCurrentMonth && "cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700"
                            )}
                            onClick={() => onDateClick && isCurrentMonth && onDateClick(day)}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                    isDayToday ? "bg-indigo-600 text-white" : "text-slate-700 dark:text-slate-300"
                                )}>
                                    {format(day, dateFormat)}
                                </span>
                            </div>
                            
                            <div className="flex-1 mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                {daySessions.map(session => (
                                    <button
                                        key={session.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSessionClick(session);
                                        }}
                                        className={cn(
                                            "w-full text-left text-xs px-2 py-1 rounded truncate transition-colors block",
                                            session.status === 'completed' 
                                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                : session.status === 'cancelled'
                                                    ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 line-through"
                                                    : "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                        )}
                                        title={`${format(parseISO(session.startTime), 'HH:mm')} - ${session.topic}`}
                                    >
                                        <span className="font-semibold mr-1">{format(parseISO(session.startTime), 'HH:mm')}</span>
                                        {session.topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
