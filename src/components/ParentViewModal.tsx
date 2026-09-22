/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Users,
  X,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { Student, Task, Exam, StudySession } from '../types';

interface ParentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  tasks: Task[];
  exams: Exam[];
  studySessions: StudySession[];
  currentStreak: number;
}

export const ParentViewModal: React.FC<ParentViewModalProps> = ({
  isOpen,
  onClose,
  student,
  tasks,
  exams,
  studySessions,
  currentStreak,
}) => {
  if (!isOpen) return null;

  const completed = tasks.filter((t) => t.status === 'done');
  const completionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 100;
  const totalMins = studySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  const upcomingExam = exams[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-4 border-indigo-200 relative my-auto animate-star-pop space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-heading flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Parent Companion View
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900 font-heading">
            {student.name}&apos;s Weekly Highlights 🌿
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            A respectful, high-level overview designed to celebrate your child&apos;s learning habits without micromanagement.
          </p>
        </div>

        {/* Weekly Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
              Homework Turned In
            </span>
            <span className="text-2xl font-black text-emerald-950 font-heading">
              {completionRate}%
            </span>
            <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
              {completed.length} of {tasks.length} tasks
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 block">
              Focused Study Time
            </span>
            <span className="text-2xl font-black text-indigo-950 font-heading">
              {hours}h {mins}m
            </span>
            <span className="text-[11px] text-indigo-700 font-bold block mt-0.5">
              {studySessions.length} active sessions
            </span>
          </div>
        </div>

        {/* Upcoming Milestone & Consistency */}
        <div className="space-y-2.5">
          {upcomingExam && (
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-700">Upcoming Test</span>
                <p className="text-xs font-black text-purple-950">{upcomingExam.title}</p>
              </div>
              <span className="text-xs font-black text-purple-900 bg-white px-2.5 py-1 rounded-xl shadow-2xs">
                {upcomingExam.exam_date}
              </span>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500">Learning Consistency</span>
              <p className="text-xs font-black text-slate-800">
                {currentStreak}-day continuous study habit
              </p>
            </div>
            <span className="text-sm">🔥</span>
          </div>
        </div>

        {/* Encouragement Note */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs font-bold text-amber-950 flex items-start gap-2">
          <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Tip for this week: Ask {student.name.split(' ')[0]} how Chapter 4 Science is going and
            celebrate their {currentStreak}-day study streak!
          </span>
        </div>
      </div>
    </div>
  );
};
