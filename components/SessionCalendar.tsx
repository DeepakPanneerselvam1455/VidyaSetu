
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO, isToday } from 'date-fns';
import { TutoringSession } from '../types';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { Card } from './ui/Card';

const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;

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
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-heading, var(--text-main))' }}>
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={prevMonth} className="h-11 w-11 md:h-8 md:w-8">
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth} className="h-11 w-11 md:h-8 md:w-8">
                            <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={goToToday}>Today</Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-semibold py-2" style={{ color: 'var(--text-muted)' }}>
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 lg:gap-2">
                {days.map((day) => {
                    const daySessions = getSessionsForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isDayToday = isToday(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "min-h-[100px] border rounded-lg p-2 flex flex-col transition-colors relative group",
                                isDayToday && "ring-2 ring-offset-2",
                                onDateClick && isCurrentMonth && "cursor-pointer"
                            )}
                            style={{
                                backgroundColor: isCurrentMonth ? 'var(--card-bg)' : 'var(--surface-nested, var(--kpi-icon-chip))',
                                borderColor: isCurrentMonth ? 'var(--border-default)' : 'transparent',
                                color: isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)',
                                ...(isDayToday ? { '--tw-ring-color': 'var(--primary)', '--tw-ring-offset-color': 'var(--card-bg)' } as React.CSSProperties : {}),
                            }}
                            onClick={() => onDateClick && isCurrentMonth && onDateClick(day)}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                )}
                                    style={{
                                        backgroundColor: isDayToday ? 'var(--primary)' : 'transparent',
                                        color: isDayToday ? 'var(--primary-foreground)' : 'var(--text-main)',
                                    }}>
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
                                        className="w-full text-left text-xs px-2 py-1 rounded truncate transition-colors block"
                                        style={{
                                            backgroundColor: session.status === 'completed'
                                                ? 'var(--surface-nested, var(--kpi-icon-chip))'
                                                : session.status === 'cancelled'
                                                    ? 'rgba(220, 38, 38, 0.1)'
                                                    : 'var(--kpi-icon-chip)',
                                            color: session.status === 'completed'
                                                ? 'var(--text-muted)'
                                                : session.status === 'cancelled'
                                                    ? 'var(--color-error)'
                                                    : 'var(--primary)',
                                            textDecoration: session.status === 'cancelled' ? 'line-through' : 'none',
                                        }}
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
