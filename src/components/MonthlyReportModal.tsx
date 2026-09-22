/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  Printer,
  X,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
  Star,
  BookOpen,
} from 'lucide-react';
import { Student, Task, Exam, StudySession } from '../types';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  tasks: Task[];
  exams: Exam[];
  studySessions: StudySession[];
  currentStreak: number;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-indigo-200 relative my-auto animate-star-pop space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-heading">
              Official Learning Certificate
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-700 flex items-center gap-1.5 font-heading"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div className="text-4xl">🎓</div>
            <h2 className="text-2xl font-black text-slate-900 font-heading">
              Monthly Learning Growth Report
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              Study Buddy Digital Companion · {student.name} ({student.class})
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block">
                Completion Rate
              </span>
              <span className="text-xl font-black text-indigo-600 font-heading">
                {completionRate}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block">
                Total Focus Time
              </span>
              <span className="text-xl font-black text-slate-900 font-heading">
                {Math.round(totalMins / 60)} hrs
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block">
                Study Streak
              </span>
              <span className="text-xl font-black text-amber-600 font-heading">
                {currentStreak} Days
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block">
                Total Stars
              </span>
              <span className="text-xl font-black text-amber-900 font-heading">
                {student.stars || 45} ⭐
              </span>
            </div>
          </div>

          {/* Subject Activity */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider font-heading">
              Subject Highlights
            </h4>
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs font-medium text-slate-700">
              <p>
                • <strong>Mathematics:</strong> Completed Decimal &amp; Fraction practice sets with high consistency.
              </p>
              <p>
                • <strong>Science:</strong> Actively preparing Chapter 4 &amp; 5 revision topics for the upcoming Mid-Term.
              </p>
              <p>
                • <strong>English:</strong> Story writing and reading assignments turned in on schedule.
              </p>
            </div>
          </div>

          {/* Teacher / Parent Signature Box */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-400 font-bold">
            <div>
              <span>Student Signature: __________________</span>
            </div>
            <div>
              <span>Parent / Teacher: __________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
