/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  ChevronRight,
  Flame,
  Star,
  Plus,
  Play,
  ArrowRight,
  BrainCircuit,
  BookOpen,
  Award,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, Task, Exam, StudySession } from '../types';

interface HomeDashboardProps {
  student: Student;
  tasks: Task[];
  exams: Exam[];
  studySessions: StudySession[];
  currentStreak: number;
  onToggleTask: (taskId: string) => void;
  onOpenLogModal: () => void;
  onStartStudySession: (subject: string, topic: string) => void;
  onNavigateTab: (tab: string) => void;
  onAskBuddyPrompt: (prompt: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  student,
  tasks,
  exams,
  studySessions,
  currentStreak,
  onToggleTask,
  onOpenLogModal,
  onStartStudySession,
  onNavigateTab,
  onAskBuddyPrompt,
}) => {
  // Time of day greeting
  const hour = new Date().getHours();
  const greetingTime =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Today's tasks
  const todayTasks = tasks.filter((t) => t.due_date <= todayStr || t.status === 'pending');
  const completedToday = tasks.filter(
    (t) => t.status === 'done' && (t.completed_at?.startsWith(todayStr) || t.due_date === todayStr)
  ).length;
  const totalToday = Math.max(todayTasks.length, completedToday);
  const completionPercentage =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 100;

  // Next exam
  const upcomingExams = exams
    .filter((e) => e.exam_date >= todayStr)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const nextExam = upcomingExams[0];

  // Dynamic Next Best Step
  let nextActionTitle = 'Review your daily homework plan';
  let nextActionDesc = 'Check off your pending assignments to stay ahead.';
  let nextActionSubject = 'General';
  let nextActionTopic = 'Daily Review';
  let nextActionMinutes = 20;

  if (nextExam) {
    const examDate = new Date(nextExam.exam_date);
    const today = new Date();
    const diffDays = Math.max(
      1,
      Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
    const pendingChapter =
      nextExam.chapters.find((c) => c.status !== 'completed')?.name || 'Key concepts';
    nextActionSubject = nextExam.subject;
    nextActionTopic = `${nextExam.title}: ${pendingChapter}`;
    nextActionTitle = `${nextExam.subject} Revision`;
    nextActionDesc = `You have your ${nextExam.title} in ${diffDays} day${
      diffDays > 1 ? 's' : ''
    }. Spend ${nextActionMinutes} minutes reviewing ${pendingChapter} today.`;
  } else {
    const pendingHighTask = todayTasks.find((t) => t.status === 'pending' && t.priority === 'high');
    if (pendingHighTask) {
      nextActionSubject = pendingHighTask.subject;
      nextActionTopic = pendingHighTask.title || pendingHighTask.description;
      nextActionTitle = `Finish ${pendingHighTask.subject} Quest`;
      nextActionDesc = `High priority: "${pendingHighTask.title || pendingHighTask.description}" is due. Spending 25 mins now keeps your streak going!`;
      nextActionMinutes = pendingHighTask.estimated_minutes || 25;
    }
  }

  const handleTaskCheck = (taskId: string, currentStatus: string) => {
    if (currentStatus !== 'done') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    }
    onToggleTask(taskId);
  };

  const getSubjectBadge = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'maths':
      case 'math':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📐' };
      case 'science':
      case 'physics':
      case 'chemistry':
      case 'biology':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🔬' };
      case 'english':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: '📚' };
      case 'social studies':
      case 'social science':
      case 'history':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🌍' };
      case 'computer science':
      case 'computer':
        return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: '💻' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: '⭐' };
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Header Hero Greeting */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-200 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                {todayFormatted}
              </span>
              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1 bg-amber-400/20 px-2.5 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {currentStreak}-day streak!
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-heading">
              {greetingTime}, {student.name.split(' ')[0]} 👋
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium mt-1 max-w-lg">
              Let&apos;s make today a productive learning day. Plan, focus, and earn your stars!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onStartStudySession(nextActionSubject, nextActionTopic)}
              className="px-4 py-2.5 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-700" />
              <span>Study Session</span>
            </button>
            <button
              onClick={onOpenLogModal}
              className="px-4 py-2.5 rounded-2xl bg-indigo-500/50 hover:bg-indigo-500/70 border border-white/20 text-white font-extrabold text-xs sm:text-sm backdrop-blur-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Quest</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Today's Progress Bar / Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Progress Card */}
        <div className="sm:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-heading">
                Today&apos;s Progress
              </span>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                {completedToday} of {totalToday} Quests Done
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600 font-heading">
                {completionPercentage}%
              </span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, completionPercentage)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-2.5">
            {completionPercentage === 100
              ? '🌟 All quests completed! You are ahead of schedule!'
              : `${totalToday - completedToday} more quest${
                  totalToday - completedToday > 1 ? 's' : ''
                } remaining to finish today.`}
          </p>
        </div>

        {/* Stars / Trophy Quick Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 font-heading">
              Star Vault
            </span>
            <span className="text-2xl">⭐</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-amber-950 font-heading">
              {student.stars || 0}
            </div>
            <p className="text-xs font-bold text-amber-800/80">Learning Stars</p>
          </div>
          <button
            onClick={() => onNavigateTab('progress')}
            className="text-[11px] font-black text-amber-900 hover:text-amber-950 flex items-center gap-1 group"
          >
            <span>View Trophy Room</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 3. ⭐ Next Best Step Recommendation Card */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-black uppercase tracking-wider backdrop-blur-xs font-heading">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Your Next Best Step
          </div>
          <h3 className="text-lg sm:text-xl font-black font-heading text-white">
            {nextActionTitle}
          </h3>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
            {nextActionDesc}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onStartStudySession(nextActionSubject, nextActionTopic)}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-slate-900" />
            <span>Start Now ({nextActionMinutes}m)</span>
          </button>
          <button
            onClick={() => onNavigateTab('calendar')}
            className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs transition-colors"
          >
            Plan Later
          </button>
        </div>
      </div>

      {/* 4. Today's Plan (Interactive Task Checklist) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              🎯
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                Today&apos;s Quests
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Tasks scheduled for completion today
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors font-heading"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
            <div className="text-3xl mb-2">🎉</div>
            <h4 className="text-sm font-black text-slate-800 font-heading">
              You&apos;re all clear for today!
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No pending tasks. Relax, read a book, or plan ahead for tomorrow!
            </p>
            <button
              onClick={onOpenLogModal}
              className="mt-3.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all"
            >
              + Log New Homework
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map((t) => {
              const badge = getSubjectBadge(t.subject);
              const isDone = t.status === 'done';

              return (
                <div
                  key={t.id}
                  onClick={() => handleTaskCheck(t.id, t.status)}
                  className={`group p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-slate-50/70 border-slate-200 opacity-60'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-indigo-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border font-heading flex items-center gap-1 ${badge.bg}`}
                        >
                          <span>{badge.icon}</span>
                          <span>{t.subject}</span>
                        </span>
                        {t.priority === 'high' && !isDone && (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> High Priority
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs sm:text-sm font-bold text-slate-800 truncate ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {t.title || t.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {t.estimated_minutes || 30}m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Upcoming Horizons & Ask Buddy Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Upcoming Deadlines & Tests */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <h4 className="text-sm font-black text-slate-900 font-heading">
                Coming Up This Week
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 font-heading"
            >
              Full Calendar →
            </button>
          </div>

          <div className="space-y-2">
            {upcomingExams.slice(0, 2).map((ex) => (
              <div
                key={ex.id}
                onClick={() => onNavigateTab('exams')}
                className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      Exam
                    </span>
                    <span className="text-xs font-black text-purple-950 font-heading">
                      {ex.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-700/80 font-medium mt-0.5">
                    {ex.chapters.length} chapters · Focus revision active
                  </p>
                </div>
                <span className="text-xs font-black text-purple-900 bg-white px-2.5 py-1 rounded-xl shadow-2xs">
                  {ex.exam_date}
                </span>
              </div>
            ))}

            {tasks
              .filter((t) => t.due_date > todayStr && t.status !== 'done')
              .slice(0, 2)
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => onNavigateTab('homework')}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      {t.subject}
                    </span>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                      {t.title || t.description}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    Due {t.due_date}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Ask Buddy Quick Suggestions */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/60 rounded-3xl p-5 border border-indigo-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🤖</span>
              <h4 className="text-sm font-black text-slate-900 font-heading">
                Ask Buddy Anything
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">
              Tap a suggestion or ask Buddy to explain concepts, plan studies, or quiz you.
            </p>
          </div>

          <div className="space-y-1.5">
            {[
              'What should I study now?',
              'Help me prepare for Friday’s Science test',
              'Explain photosynthesis simply',
              'Quiz me on Science',
            ].map((promptText) => (
              <button
                key={promptText}
                onClick={() => onAskBuddyPrompt(promptText)}
                className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-xs font-bold text-slate-700 hover:text-indigo-900 flex items-center justify-between transition-all group"
              >
                <span className="truncate">{promptText}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('buddy')}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Open Full Buddy Companion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
