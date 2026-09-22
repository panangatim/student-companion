/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Target,
  Flame,
  CheckCircle2,
  X,
  Plus,
  Sparkles,
  Award,
} from 'lucide-react';
import { Goal, Habit } from '../types';

interface GoalsHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  habits: Habit[];
  onToggleGoal: (goalId: string) => void;
  onToggleHabit: (habitId: string) => void;
}

export const GoalsHabitsModal: React.FC<GoalsHabitsModalProps> = ({
  isOpen,
  onClose,
  goals,
  habits,
  onToggleGoal,
  onToggleHabit,
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'habits'>('goals');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-4 border-indigo-200 relative my-auto animate-star-pop space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all font-heading ${
                activeTab === 'goals'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Goals 🎯
            </button>
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all font-heading ${
                activeTab === 'habits'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Study Habits 🔥
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Goals List */}
        {activeTab === 'goals' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider font-heading">
                Learning Targets
              </span>
            </div>

            <div className="space-y-2.5">
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
                return (
                  <div
                    key={g.id}
                    onClick={() => onToggleGoal(g.id)}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                          {g.category}
                        </span>
                        <span className="text-xs font-black text-slate-900 font-heading">
                          {g.title}
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-600">
                        {g.current_value} / {g.target_value} {g.unit}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Habits List */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider font-heading">
                Daily Study Habits
              </span>
            </div>

            <div className="space-y-2.5">
              {habits.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onToggleHabit(h.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    h.completed_today
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{h.emoji}</span>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-slate-900 block font-heading">
                        {h.title}
                      </span>
                      <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {h.current_streak} days continuous habit
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-black font-heading transition-all ${
                      h.completed_today
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {h.completed_today ? 'Done Today! ✅' : 'Mark Done'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
