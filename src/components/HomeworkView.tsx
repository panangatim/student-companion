/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookCheck,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Filter,
  Flame,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, TaskPriority, TaskDifficulty, TaskStatus } from '../types';

interface HomeworkViewProps {
  tasks: Task[];
  onToggleStatus: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenLogModal: () => void;
}

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  tasks,
  onToggleStatus,
  onDeleteTask,
  onOpenLogModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done' | 'overdue'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Subjects set
  const subjects = Array.from(new Set(tasks.map((t) => t.subject)));

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const isOverdue = t.status !== 'done' && t.due_date < todayStr;
    if (statusFilter === 'done' && t.status !== 'done') return false;
    if (statusFilter === 'pending' && (t.status === 'done' || isOverdue)) return false;
    if (statusFilter === 'overdue' && !isOverdue) return false;

    if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
    return true;
  });

  const handleCheck = (taskId: string, currentStatus: string) => {
    if (currentStatus !== 'done') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    }
    onToggleStatus(taskId);
  };

  const getPriorityStyle = (priority?: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-amber-100/70 text-amber-900 border-amber-300';
      case 'low':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider font-heading mb-1.5">
            <BookCheck className="w-3.5 h-3.5" />
            Homework Manager
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Homework &amp; Assignments 📝
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Track, prioritize, and complete your school homework with clear focus.
          </p>
        </div>

        <button
          onClick={onOpenLogModal}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto font-heading"
        >
          <Plus className="w-4 h-4" />
          <span>New Homework Quest</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: 'all', label: 'All Quests' },
            { key: 'pending', label: 'To Do' },
            { key: 'done', label: 'Completed' },
            { key: 'overdue', label: 'Needs Attention' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all font-heading ${
                statusFilter === item.key
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {subjects.length > 0 && (
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Homework Cards */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-2">
            <div className="text-4xl">🌟</div>
            <h3 className="text-base font-black text-slate-800 font-heading">
              No homework matching this view!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Everything in this category is clear. Keep up the high streak!
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === 'done';
            const isOverdue = !isDone && t.due_date < todayStr;

            return (
              <div
                key={t.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'border-slate-200 bg-slate-50/70 opacity-70'
                    : isOverdue
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-slate-200 hover:border-indigo-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => handleCheck(t.id, t.status)}
                    className="mt-1 shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 hover:border-indigo-500" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-heading">
                        {t.subject}
                      </span>
                      {t.priority && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getPriorityStyle(
                            t.priority
                          )}`}
                        >
                          {t.priority.toUpperCase()} PRIORITY
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Catch up soon!
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-base font-black text-slate-900 font-heading ${
                        isDone ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {t.title || t.description}
                    </h4>

                    {t.title && t.description && t.title !== t.description && (
                      <p className="text-xs text-slate-600 font-medium">{t.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {t.due_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {t.estimated_minutes || 30} mins
                      </span>
                      {t.teacher_name && (
                        <span className="italic text-slate-500">
                          Teacher: {t.teacher_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onDeleteTask(t.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Delete quest"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
