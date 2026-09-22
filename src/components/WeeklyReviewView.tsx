/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Calendar,
  CheckCircle2,
  BookOpen,
  Clock,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Student, Task, Exam, StudySession } from '../types';

interface WeeklyReviewViewProps {
  student: Student;
  tasks: Task[];
  exams: Exam[];
  studySessions: StudySession[];
  onBack: () => void;
  onStartStudySession: (subject: string, topic: string) => void;
}

export const WeeklyReviewView: React.FC<WeeklyReviewViewProps> = ({
  student,
  tasks,
  exams,
  studySessions,
  onBack,
  onStartStudySession,
}) => {
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const studyHours = Math.floor(totalStudyMinutes / 60);
  const studyMins = totalStudyMinutes % 60;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          title="Back to progress"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider font-heading">
            <Sparkles className="w-3.5 h-3.5" />
            Weekly Learning Reflection
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            My Week in Review 📓
          </h2>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
          <div className="text-3xl mb-1">🎯</div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {completedTasks.length} Quests
          </div>
          <span className="text-xs font-bold text-slate-400">Completed this week</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
          <div className="text-3xl mb-1">📚</div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            5 Topics
          </div>
          <span className="text-xs font-bold text-slate-400">Mastered &amp; Reviewed</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
          <div className="text-3xl mb-1">⏱</div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {studyHours}h {studyMins}m
          </div>
          <span className="text-xs font-bold text-slate-400">Active study time</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
          <div className="text-3xl mb-1">📈</div>
          <div className="text-2xl font-black text-emerald-600 font-heading">
            +15% Growth
          </div>
          <span className="text-xs font-bold text-slate-400">Higher on-time pace</span>
        </div>
      </div>

      {/* Next Week & Focus Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Week Horizon */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900 font-heading">
              Next Week Priorities
            </h3>
          </div>

          <div className="space-y-2.5">
            {exams.slice(0, 2).map((ex) => (
              <div key={ex.id} className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
                <span className="text-[10px] font-black uppercase text-purple-700 block">
                  Upcoming Exam
                </span>
                <span className="text-xs font-black text-purple-950 font-heading">
                  {ex.title} — {ex.exam_date}
                </span>
              </div>
            ))}
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
              <span className="text-[10px] font-black uppercase text-blue-700 block">
                Project Milestone
              </span>
              <span className="text-xs font-black text-blue-950 font-heading">
                Computer Science Python Graphics Project
              </span>
            </div>
          </div>
        </div>

        {/* One Thing to Focus On */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 sm:p-6 border border-amber-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-200/70 px-3 py-1 rounded-full font-heading">
              ⭐ One Thing To Focus On
            </span>
            <h3 className="text-lg font-black text-amber-950 font-heading mt-3">
              Start Science revision 20 minutes earlier
            </h3>
            <p className="text-xs font-semibold text-amber-900/80 leading-relaxed mt-1">
              Your Science Mid-Term test is coming up on Friday. Setting aside 20 minutes right after
              school will help you master Chapter 5 and 6 without any last-minute stress!
            </p>
          </div>

          <button
            onClick={() => onStartStudySession('Science', 'Chapter 5: Photosynthesis Revision')}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-2xl shadow-md transition-all font-heading text-center"
          >
            Schedule 20m Science Focus Now 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
