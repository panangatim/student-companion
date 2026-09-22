/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Filter,
  Eye,
  X,
} from 'lucide-react';
import { Task, Exam, StudySession } from '../types';

interface LearningCalendarViewProps {
  tasks: Task[];
  exams: Exam[];
  studySessions: StudySession[];
  onToggleTask: (taskId: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

export const LearningCalendarView: React.FC<LearningCalendarViewProps> = ({
  tasks,
  exams,
  studySessions,
  onToggleTask,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Today helpers
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar matrix for month view
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Prev month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(year, month - 1, day);
    calendarDays.push({
      dateStr: d.toISOString().split('T')[0],
      dayNumber: day,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    calendarDays.push({
      dateStr: d.toISOString().split('T')[0],
      dayNumber: i,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill out 35 or 42 cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    calendarDays.push({
      dateStr: d.toISOString().split('T')[0],
      dayNumber: i,
      isCurrentMonth: false,
    });
  }

  // Combine items by date
  const getItemsForDate = (dateStr: string) => {
    const items: {
      id: string;
      title: string;
      subject: string;
      type: 'homework' | 'exam' | 'study' | 'project' | 'event';
      isDone: boolean;
      raw: any;
    }[] = [];

    // Tasks due
    tasks.forEach((t) => {
      if (t.due_date === dateStr) {
        items.push({
          id: t.id,
          title: t.title || t.description,
          subject: t.subject,
          type: (t.entry_type as any) || 'homework',
          isDone: t.status === 'done',
          raw: t,
        });
      }
    });

    // Exams
    exams.forEach((ex) => {
      if (ex.exam_date === dateStr) {
        items.push({
          id: ex.id,
          title: `🎯 ${ex.title}`,
          subject: ex.subject,
          type: 'exam',
          isDone: false,
          raw: ex,
        });
      }
    });

    // Study Sessions
    studySessions.forEach((ss) => {
      if (ss.completed_at.startsWith(dateStr)) {
        items.push({
          id: ss.id,
          title: `⏱ Study: ${ss.topic}`,
          subject: ss.subject,
          type: 'study',
          isDone: true,
          raw: ss,
        });
      }
    });

    if (filterCategory === 'all') return items;
    return items.filter((it) => it.type === filterCategory);
  };

  const getItemColor = (type: string, isDone: boolean) => {
    if (isDone) return 'bg-slate-100 text-slate-500 line-through';
    switch (type) {
      case 'exam':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-black';
      case 'study':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'project':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'event':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-200';
    }
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Calendar Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider font-heading mb-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            Learning Calendar
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            {monthName} 📅
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Visual overview of homework due dates, exams, revision sessions, and school milestones.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'month' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'week' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'day' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Day
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Items' },
          { key: 'homework', label: 'Homework 📝' },
          { key: 'exam', label: 'Exams 🎯' },
          { key: 'study', label: 'Study Sessions ⏱' },
          { key: 'project', label: 'Projects 🔬' },
          { key: 'event', label: 'School Events 🎪' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterCategory(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              filterCategory === f.key
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Month View Matrix */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-black text-slate-600 uppercase tracking-wider font-heading">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const items = getItemsForDate(cell.dateStr);

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  className={`min-h-[100px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'
                  } ${isToday ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center font-heading ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {items.length > 0 && (
                      <span className="text-[10px] font-extrabold text-slate-400">
                        {items.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {items.slice(0, 3).map((it) => (
                      <div
                        key={it.id}
                        onClick={() => setSelectedItem(it)}
                        className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-lg border truncate cursor-pointer transition-all hover:scale-[1.02] ${getItemColor(
                          it.type,
                          it.isDone
                        )}`}
                        title={it.title}
                      >
                        {it.title}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-[9px] font-black text-indigo-600 pl-1">
                        +{items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week / Day View simple list fallback */}
      {viewMode !== 'month' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-black text-slate-900 font-heading">
            {viewMode === 'week' ? 'Week Schedule' : 'Day View'}
          </h3>
          <div className="space-y-2">
            {getItemsForDate(todayStr).map((it) => (
              <div
                key={it.id}
                onClick={() => setSelectedItem(it)}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer ${getItemColor(
                  it.type,
                  it.isDone
                )}`}
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {it.subject} · {it.type}
                  </span>
                  <p className="text-sm font-black">{it.title}</p>
                </div>
                <button className="text-xs font-bold underline">Details</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal when Item is clicked */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-indigo-200 relative my-auto animate-star-pop space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                {selectedItem.type.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs font-extrabold text-slate-400">
                {selectedItem.subject}
              </span>
              <h3 className="text-lg font-black text-slate-900 font-heading mt-0.5">
                {selectedItem.title}
              </h3>
            </div>

            {selectedItem.raw?.description && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {selectedItem.raw.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Status: {selectedItem.isDone ? '✅ Completed' : '⏳ Pending'}</span>
              {selectedItem.raw?.due_date && <span>Due: {selectedItem.raw.due_date}</span>}
            </div>

            {selectedItem.raw && selectedItem.type !== 'exam' && selectedItem.type !== 'study' && (
              <button
                onClick={() => {
                  onToggleTask(selectedItem.id);
                  setSelectedItem(null);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all shadow-sm font-heading"
              >
                {selectedItem.isDone ? 'Mark as Pending' : 'Mark as Done! 🎉'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
