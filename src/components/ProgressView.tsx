/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Sparkles,
  Award,
  CheckCircle2,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { Task, BehaviorStat, Student } from '../types';
import { narrateTrendWithGemini } from '../lib/gemini';

interface ProgressViewProps {
  student: Student;
  tasks: Task[];
  stats: BehaviorStat[];
  currentStreak: number;
}

const BADGES = [
  { id: 'first_quest', title: 'First Quest', emoji: '🌱', req: 'Complete 1 task', minTasks: 1 },
  { id: 'streak_3', title: 'Sparky Streak', emoji: '⚡', req: '3-Day Study Streak', minStreak: 3 },
  { id: 'streak_7', title: 'Fire Starter', emoji: '🔥', req: '7-Day Study Streak', minStreak: 7 },
  { id: 'star_collector', title: 'Star Hunter', emoji: '⭐', req: 'Earn 50+ Stars', minStars: 50 },
  { id: 'super_scholar', title: 'Super Scholar', emoji: '🏆', req: 'Complete 10 tasks', minTasks: 10 },
];

export const ProgressView: React.FC<ProgressViewProps> = ({
  student,
  tasks,
  stats,
  currentStreak,
}) => {
  const [trendSentence, setTrendSentence] = useState<string>('');
  const [isLoadingTrend, setIsLoadingTrend] = useState<boolean>(false);

  const completedTasks = tasks.filter((t) => t.status === 'done');
  const totalStars = student.stars || 0;

  // Level calculation
  const level = Math.floor(totalStars / 50) + 1;
  const starsInLevel = totalStars % 50;
  const levelProgress = Math.min(100, Math.round((starsInLevel / 50) * 100));

  const loadTrendSentence = async () => {
    if (tasks.length === 0) {
      setTrendSentence('Welcome! Finish your first quest to start building your personal study superpower!');
      return;
    }

    setIsLoadingTrend(true);
    try {
      const sentence = await narrateTrendWithGemini(stats, student.name);
      setTrendSentence(sentence);
    } catch (err) {
      setTrendSentence(`You're building great momentum, ${student.name}! Keep up the steady work.`);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  useEffect(() => {
    loadTrendSentence();
  }, [student.id, tasks.length]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* HERO LEVEL & TROPHY CARD */}
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl sm:text-4xl shadow-inner border border-white/30 animate-gentle-bounce shrink-0">
              {student.avatar || '🚀'}
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/25 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1">
                <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-200 shrink-0" />
                Level {level} Scholar
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold font-heading tracking-tight truncate">
                {student.name}&apos;s Trophy Room 🏆
              </h2>
              <p className="text-[11px] sm:text-xs text-white/90 font-medium">
                {totalStars} total learning stars collected!
              </p>
            </div>
          </div>

          {/* Counters row */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 shrink-0">
            {/* Streak Counter */}
            <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-200 text-base sm:text-lg font-black font-heading">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-300 shrink-0" />
                {currentStreak}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-white/80 tracking-wider">
                Day Streak
              </div>
            </div>

            {/* Quests Done */}
            <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-200 text-base sm:text-lg font-black font-heading">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                {completedTasks.length}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-white/80 tracking-wider">
                Quests Done
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold mb-1">
            <span>Next Level ({starsInLevel} / 50 stars)</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="w-full h-2.5 sm:h-3 rounded-full bg-black/20 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-200 transition-all duration-500 shadow-sm"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI STUDY BUDDY COACH */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-100 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-900 font-heading">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
            <span>Study Buddy Insights ✨</span>
          </div>
          <button
            onClick={loadTrendSentence}
            disabled={isLoadingTrend}
            className="text-xs text-slate-400 hover:text-amber-600 flex items-center gap-1 font-bold transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingTrend ? 'animate-spin' : ''}`} />
            <span>Check again</span>
          </button>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm font-bold text-amber-950">
          {isLoadingTrend ? (
            <span className="text-slate-400 font-normal">Analyzing your awesome progress...</span>
          ) : (
            `"${trendSentence || "Finish homework across different days to unlock personalized study tips!"}"`
          )}
        </div>
      </div>

      {/* BADGES & SUPERPOWERS */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-100 shadow-2xs space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading flex items-center gap-1.5">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            Badges &amp; Achievements
          </h3>
          <p className="text-xs text-slate-500">
            Keep completing homework and building study streaks to unlock all badges!
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {BADGES.map((badge, idx) => {
            const isUnlocked =
              (badge.minTasks && completedTasks.length >= badge.minTasks) ||
              (badge.minStreak && currentStreak >= badge.minStreak) ||
              (badge.minStars && totalStars >= badge.minStars);

            const isLast = idx === BADGES.length - 1;

            return (
              <div
                key={badge.id}
                className={`p-3 rounded-xl sm:rounded-2xl border-2 text-center transition-all ${
                  isLast ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isUnlocked
                    ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-orange-50 shadow-2xs'
                    : 'border-slate-100 bg-slate-50/60 opacity-50 grayscale'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1">{badge.emoji}</div>
                <div className="text-xs font-black text-slate-800 font-heading truncate">
                  {badge.title}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {isUnlocked ? 'Unlocked! ⭐' : badge.req}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUBJECT MASTERY */}
      {stats.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-100 shadow-2xs space-y-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
              Subject Mastery
            </h3>
            <p className="text-xs text-slate-500">
              How consistently you finish assignments for each subject.
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {stats.map((item) => (
              <div
                key={item.subject}
                className="p-3 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs sm:text-sm font-black text-slate-800 font-heading">
                    {item.subject}
                  </span>
                  <span className="text-[11px] sm:text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    {item.completion_rate_7d}%
                  </span>
                </div>
                <div className="w-full h-2 sm:h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, item.completion_rate_7d))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
