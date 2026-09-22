/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, X, Play, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Task, Exam, StudySession } from '../types';

interface SubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  exams: Exam[];
  studySessions: StudySession[];
  onStartStudySession: (subject: string, topic: string) => void;
}

const SUBJECT_CONFIGS = [
  { name: 'Science', emoji: '🔬', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 text-emerald-800' },
  { name: 'Mathematics', emoji: '📐', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 text-blue-800' },
  { name: 'English', emoji: '📚', color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50 text-purple-800' },
  { name: 'Social Studies', emoji: '🌍', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 text-amber-800' },
  { name: 'Computer Science', emoji: '💻', color: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50 text-cyan-800' },
];

export const SubjectsModal: React.FC<SubjectsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  exams,
  studySessions,
  onStartStudySession,
}) => {
  const [activeSubject, setActiveSubject] = useState<string>('Science');

  if (!isOpen) return null;

  const currentConf = SUBJECT_CONFIGS.find((s) => s.name === activeSubject) || SUBJECT_CONFIGS[0];
  const subjectTasks = tasks.filter((t) => t.subject.toLowerCase() === activeSubject.toLowerCase());
  const completedCount = subjectTasks.filter((t) => t.status === 'done').length;
  const subjectExams = exams.filter((e) => e.subject.toLowerCase() === activeSubject.toLowerCase());
  const subjectSessions = studySessions.filter(
    (s) => s.subject.toLowerCase() === activeSubject.toLowerCase()
  );
  const totalMins = subjectSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border-4 border-indigo-200 relative my-auto animate-star-pop space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-heading">
              My Subjects
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject Tab Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SUBJECT_CONFIGS.map((sub) => (
            <button
              key={sub.name}
              onClick={() => setActiveSubject(sub.name)}
              className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap font-heading ${
                activeSubject === sub.name
                  ? 'bg-indigo-600 text-white shadow-xs scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{sub.emoji}</span>
              <span>{sub.name}</span>
            </button>
          ))}
        </div>

        {/* Active Subject Details */}
        <div className="space-y-4">
          <div
            className={`p-5 rounded-3xl bg-gradient-to-r ${currentConf.color} text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md`}
          >
            <div>
              <span className="text-3xl block mb-1">{currentConf.emoji}</span>
              <h3 className="text-2xl font-black font-heading">{currentConf.name}</h3>
              <p className="text-xs text-white/80 font-semibold">
                {completedCount} of {subjectTasks.length} quests completed · {totalMins} mins studied
              </p>
            </div>

            <button
              onClick={() => {
                onStartStudySession(currentConf.name, `${currentConf.name} Revision`);
                onClose();
              }}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs shadow-md active:scale-95 transition-all self-start sm:self-auto flex items-center gap-1.5 font-heading"
            >
              <Play className="w-3.5 h-3.5 fill-slate-900" />
              <span>Start Study Session</span>
            </button>
          </div>

          {/* Quests & Upcoming Tests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-500 font-heading block">
                Active Quests ({subjectTasks.length})
              </span>
              {subjectTasks.length === 0 ? (
                <p className="text-xs text-slate-400">No active homework in this subject.</p>
              ) : (
                subjectTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className="text-xs font-bold text-slate-800 truncate">
                    • {t.title || t.description}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-500 font-heading block">
                Upcoming Tests ({subjectExams.length})
              </span>
              {subjectExams.length === 0 ? (
                <p className="text-xs text-slate-400">No upcoming tests scheduled.</p>
              ) : (
                subjectExams.map((e) => (
                  <div key={e.id} className="text-xs font-bold text-purple-900">
                    🎯 {e.title} ({e.exam_date})
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
