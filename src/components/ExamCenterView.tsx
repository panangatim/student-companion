/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Clock,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  Trash2,
  BookOpen,
  X,
} from 'lucide-react';
import { Exam, ExamChapter } from '../types';

interface ExamCenterViewProps {
  studentId: string;
  exams: Exam[];
  onAddExam: (exam: Omit<Exam, 'id' | 'created_at'>) => void;
  onUpdateExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onStartStudySession: (subject: string, topic: string) => void;
}

export const ExamCenterView: React.FC<ExamCenterViewProps> = ({
  studentId,
  exams,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onStartStudySession,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [examDate, setExamDate] = useState('');
  const [chaptersInput, setChaptersInput] = useState('');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const handleToggleChapterStatus = (exam: Exam, chapterId: string) => {
    const updatedChapters = exam.chapters.map((ch) => {
      if (ch.id === chapterId) {
        const nextStatus: 'completed' | 'needs_revision' | 'not_started' =
          ch.status === 'not_started'
            ? 'needs_revision'
            : ch.status === 'needs_revision'
            ? 'completed'
            : 'not_started';
        return { ...ch, status: nextStatus };
      }
      return ch;
    });
    onUpdateExam({ ...exam, chapters: updatedChapters });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !examDate) return;

    const parsedChapters: ExamChapter[] = chaptersInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name, i) => ({
        id: `ch_${Date.now()}_${i}`,
        name,
        status: 'not_started',
      }));

    if (parsedChapters.length === 0) {
      parsedChapters.push({
        id: `ch_${Date.now()}_0`,
        name: 'Unit Core Concepts',
        status: 'not_started',
      });
    }

    onAddExam({
      student_id: studentId,
      title: title.trim(),
      subject,
      exam_date: examDate,
      chapters: parsedChapters,
      revision_notes: 'Created via Exam Center.',
    });

    setIsAddModalOpen(false);
    setTitle('');
    setChaptersInput('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-black uppercase tracking-wider font-heading mb-1.5">
            <Award className="w-3.5 h-3.5" />
            Exam Center
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Exams &amp; Test Preparation 🎯
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Break big exams down into manageable revision chapters and day-by-day study sessions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto font-heading"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Exam</span>
        </button>
      </div>

      {/* Exams Grid */}
      <div className="space-y-5">
        {exams.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-2">
            <div className="text-4xl">🌟</div>
            <h3 className="text-base font-black text-slate-800 font-heading">
              No upcoming exams added
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your next school test or quiz to get an automatic countdown and study plan!
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black"
            >
              + Add First Exam
            </button>
          </div>
        ) : (
          exams.map((ex) => {
            const examD = new Date(ex.exam_date);
            const diffDays = Math.ceil(
              (examD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            const completedCount = ex.chapters.filter((c) => c.status === 'completed').length;
            const needsRevisionCount = ex.chapters.filter(
              (c) => c.status === 'needs_revision'
            ).length;
            const notStartedCount = ex.chapters.filter((c) => c.status === 'not_started').length;

            return (
              <div
                key={ex.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-sm space-y-5 hover:border-purple-300 transition-all"
              >
                {/* Top Title & Countdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 font-heading">
                        {ex.subject}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Date: {ex.exam_date}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 font-heading">{ex.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="px-3.5 py-2 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-right">
                      <span className="text-lg font-black font-heading">
                        {diffDays <= 0 ? 'Today!' : `${diffDays} days`}
                      </span>
                      <span className="text-[10px] text-purple-700 block font-bold">remaining</span>
                    </div>
                    <button
                      onClick={() => onDeleteExam(ex.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Delete exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Chapter Checklist */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider font-heading">
                      Chapters / Topics ({completedCount}/{ex.chapters.length} Mastered)
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Tap chapter to cycle status: ✅ Mastered → 🟡 Needs Revision → 🔴 Not Started
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ex.chapters.map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => handleToggleChapterStatus(ex, ch.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          ch.status === 'completed'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : ch.status === 'needs_revision'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold truncate pr-2">{ch.name}</span>
                        <span className="text-xs shrink-0 font-black">
                          {ch.status === 'completed'
                            ? '✅ Mastered'
                            : ch.status === 'needs_revision'
                            ? '🟡 Needs Rev'
                            : '🔴 Not Started'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Study Plan Roadmap */}
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-4 border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-black uppercase text-purple-950 font-heading">
                        AI Recommended Revision Plan
                      </h4>
                    </div>
                    <button
                      onClick={() =>
                        onStartStudySession(
                          ex.subject,
                          ex.chapters.find((c) => c.status !== 'completed')?.name || ex.title
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1 font-heading"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Start Today&apos;s Revision</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-purple-700 uppercase block font-extrabold">
                        Today
                      </span>
                      <span className="text-slate-900">
                        25 min: {ex.chapters[1]?.name || ex.chapters[0]?.name}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-purple-700 uppercase block font-extrabold">
                        Tomorrow
                      </span>
                      <span className="text-slate-900">
                        30 min: {ex.chapters[2]?.name || 'Problem Practice'}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-purple-700 uppercase block font-extrabold">
                        Day Before Exam
                      </span>
                      <span className="text-slate-900">20 min: Full Flashcard Review</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Exam Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-purple-200 relative my-auto animate-star-pop space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Schedule New Exam 🎯
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Exam Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Mid-Term, Maths Chapter Test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 text-sm font-semibold rounded-2xl border border-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject:</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 text-sm font-semibold rounded-2xl border border-slate-200 bg-white"
                  >
                    <option value="Science">Science 🔬</option>
                    <option value="Mathematics">Mathematics 📐</option>
                    <option value="English">English 📚</option>
                    <option value="Social Studies">Social Studies 🌍</option>
                    <option value="Computer Science">Computer Science 💻</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Date:</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full p-3 text-sm font-semibold rounded-2xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chapters / Topics (One per line):
                </label>
                <textarea
                  rows={4}
                  placeholder={`Chapter 4: Plant Respiration\nChapter 5: Photosynthesis\nChapter 6: Cell Organelles`}
                  value={chaptersInput}
                  onChange={(e) => setChaptersInput(e.target.value)}
                  className="w-full p-3 text-sm font-semibold rounded-2xl border border-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md"
                >
                  Save &amp; Generate Plan 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
