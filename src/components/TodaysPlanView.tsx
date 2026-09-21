/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plus,
  Volume2,
  VolumeX,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  Trash2,
  Smile,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, BehaviorStat } from '../types';
import { generateAdaptiveDailyPlan } from '../lib/adaptivePlanning';
import { readAloud, stopSpeaking, isSpeechSynthesisSupported } from '../lib/speech';

interface TodaysPlanViewProps {
  tasks: Task[];
  stats: BehaviorStat[];
  currentStreak: number;
  onOpenLogModal: () => void;
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

const SUBJECT_EMOJIS: Record<string, string> = {
  Mathematics: '📐',
  Math: '📐',
  Science: '🔬',
  English: '📚',
  Reading: '📖',
  'Social Science': '🌍',
  'Social Studies': '🌍',
  History: '🏛️',
  Geography: '🗺️',
  Hindi: '🇮🇳',
  'Computer Science': '💻',
  Coding: '💻',
  Art: '🎨',
  Music: '🎵',
  General: '📝',
};

export const TodaysPlanView: React.FC<TodaysPlanViewProps> = ({
  tasks,
  stats,
  currentStreak,
  onOpenLogModal,
  onToggleTaskStatus,
  onDeleteTask,
}) => {
  const [availableMinutes, setAvailableMinutes] = useState(60);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Generate adaptive plan using rule-based engine
  const { planItems, totalEstimatedMinutes, unplannedCount } =
    generateAdaptiveDailyPlan(tasks, stats, availableMinutes);

  const completedTodayCount = tasks.filter(
    (t) =>
      t.status === 'done' &&
      t.completed_at &&
      t.completed_at.startsWith(new Date().toISOString().split('T')[0])
  ).length;

  const handleTaskCheck = (taskId: string, currentStatus: string) => {
    if (currentStatus !== 'done') {
      // Fire confetti celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'],
        });
      } catch (e) {}

      const compliments = [
        'Awesome job! Quest completed! ⭐ +15 Stars',
        'You crushed it! High five! ✋ ⭐ +15 Stars',
        'Super fast! Look at you go! 🚀 ⭐ +15 Stars',
        'Boom! Another assignment finished! 🏆 ⭐ +15 Stars',
      ];
      const randomMsg = compliments[Math.floor(Math.random() * compliments.length)];
      setCelebrationMessage(randomMsg);
      setTimeout(() => setCelebrationMessage(''), 4000);
    }
    onToggleTaskStatus(taskId, currentStatus);
  };

  const handleReadAloud = () => {
    if (isReadingAloud) {
      stopSpeaking();
      setIsReadingAloud(false);
      return;
    }

    if (planItems.length === 0) {
      readAloud('Hurray! Your study plan is all clear. Have fun playing or relaxing!');
      return;
    }

    let speechText = `Here is your game plan for today. You have ${planItems.length} quests to tackle. `;
    planItems.forEach((item, idx) => {
      speechText += `Quest ${idx + 1}: ${item.task.subject}. ${item.task.description}. Estimated time: ${item.estimated_minutes} minutes. `;
    });

    setIsReadingAloud(true);
    readAloud(speechText, () => setIsReadingAloud(false));
  };

  const getSubjectEmoji = (subject: string) => {
    return SUBJECT_EMOJIS[subject] || '📝';
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Celebratory Banner on completion */}
      {celebrationMessage && (
        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white font-extrabold text-xs sm:text-base flex items-center justify-between shadow-lg animate-star-pop">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200 fill-yellow-200 shrink-0" />
            <span className="truncate">{celebrationMessage}</span>
          </div>
          <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-100 shrink-0" />
        </div>
      )}

      {/* Top Friendly Header & Study Time Goal */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b-2 border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
                🎯 Today&apos;s Quests
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                {currentStreak} Day Streak!
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 sm:mt-2 font-heading tracking-tight">
              Ready to Learn Today? 🌟
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Smart study order calculated to keep you stress-free and on track!
            </p>
          </div>

          {/* Voice Read-Aloud Button */}
          {isSpeechSynthesisSupported() && (
            <button
              id="read-plan-aloud-btn"
              onClick={handleReadAloud}
              className={`self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-extrabold border-2 transition-all shadow-2xs shrink-0 ${
                isReadingAloud
                  ? 'bg-amber-300 text-amber-950 border-amber-400 animate-pulse'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
              title="Listen to your plan read aloud!"
            >
              {isReadingAloud ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-800" />
                  <span>Stop Reading</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Read to Me 📢</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Study Time Available Selector */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-50/50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-amber-100">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">⏰</span>
            <span className="text-xs sm:text-sm font-bold text-slate-700">
              Study Time Goal:
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-200 font-heading">
              {availableMinutes} mins
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[15, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => setAvailableMinutes(mins)}
                className={`text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border-2 font-black transition-all shrink-0 ${
                  availableMinutes === mins
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs scale-105'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BIG PLAYFUL PRIMARY ACTION: Log Homework */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3">
        <button
          id="primary-voice-log-btn"
          onClick={onOpenLogModal}
          className="sm:col-span-3 py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center text-lg shadow-inner">
            🎤
          </div>
          <span className="sm:hidden">Tell Me Homework (Voice / Text)</span>
          <span className="hidden sm:inline">Tell Me Your Homework (Voice or Text)</span>
        </button>

        <button
          id="secondary-typed-log-btn"
          onClick={onOpenLogModal}
          className="sm:col-span-1 py-3 px-3 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition-all"
        >
          <Plus className="w-4 h-4 text-amber-600" />
          <span>Type Task</span>
        </button>
      </div>

      {/* QUESTS LIST */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 font-heading flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quests to Complete
          </h3>
          {planItems.length > 0 && (
            <span className="text-[11px] sm:text-xs text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 sm:px-2.5 py-0.5 rounded-lg">
              ~{totalEstimatedMinutes} mins
            </span>
          )}
        </div>

        {/* Empty State when no tasks exist */}
        {tasks.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-2 border-dashed border-amber-200 text-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-200 to-orange-200 text-amber-900 mx-auto flex items-center justify-center text-2xl sm:text-3xl shadow-inner animate-gentle-bounce">
              📚
            </div>
            <div>
              <h4 className="text-lg sm:text-2xl font-extrabold text-slate-900 font-heading">
                No Homework Quests Logged Yet!
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                Tap the big microphone button above to tell Study Buddy what homework was assigned today!
              </p>
            </div>

            <button
              onClick={onOpenLogModal}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add My First Assignment 🚀</span>
            </button>
          </div>
        ) : planItems.length === 0 ? (
          /* All Scheduled Tasks Completed */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-2 border-emerald-200 text-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-2xl sm:text-3xl shadow-inner animate-star-pop">
              🎉
            </div>
            <div>
              <h4 className="text-lg sm:text-2xl font-extrabold text-slate-900 font-heading">
                All Quests Cleared for Today! 🏆
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                You finished all your study goals! Enjoy your free time, read a fun book, or relax with your family.
              </p>
            </div>
            <button
              onClick={onOpenLogModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Got something new? Add quest</span>
            </button>
          </div>
        ) : (
          planItems.map((item, index) => {
            const isLate = item.is_overdue;
            return (
              <div
                key={item.task.id}
                id={`task-card-${item.task.id}`}
                className={`bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 transition-all shadow-2xs hover:shadow-xs ${
                  isLate
                    ? 'border-rose-300 bg-rose-50/30'
                    : index === 0
                    ? 'border-amber-300 ring-2 ring-amber-300/40'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-4">
                  {/* Checkbox */}
                  <button
                    id={`toggle-task-${item.task.id}`}
                    onClick={() => handleTaskCheck(item.task.id, item.task.status)}
                    className="mt-0.5 text-slate-300 hover:text-emerald-500 hover:scale-110 active:scale-95 transition-all shrink-0"
                    title="Mark finished and win stars!"
                  >
                    <Circle className="w-6 h-6 sm:w-7 sm:h-7 hover:fill-emerald-50 stroke-[2.5]" />
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                      {/* Subject with emoji */}
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-extrabold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                        <span>{getSubjectEmoji(item.task.subject)}</span>
                        <span>{item.task.subject}</span>
                      </span>

                      {isLate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Due Soon!
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Due: {item.task.due_date}
                        </span>
                      )}

                      <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {item.estimated_minutes}m
                      </span>

                      {/* Delete button */}
                      {onDeleteTask && (
                        <button
                          onClick={() => onDeleteTask(item.task.id)}
                          className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors ml-auto"
                          title="Delete quest"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {item.task.description}
                    </div>

                    {/* Tip / Reason */}
                    <div className="mt-2 flex items-start gap-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] sm:text-xs text-amber-950 font-medium">
                      <span className="font-extrabold text-amber-800 shrink-0">
                        💡 Tip:
                      </span>
                      <span>{item.reason}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {unplannedCount > 0 && (
          <div className="p-3 text-center text-xs font-semibold text-slate-500 bg-white/60 rounded-2xl border border-slate-200">
            +{unplannedCount} more upcoming task{unplannedCount > 1 ? 's' : ''} in queue. Slide study time above to tackle more!
          </div>
        )}
      </div>

      {/* Completed Today Counter */}
      {completedTodayCount > 0 && (
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 text-xs sm:text-sm font-extrabold shadow-2xs">
          <span className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            Awesome! {completedTodayCount} quest{completedTodayCount > 1 ? 's' : ''} finished today!
          </span>
          <span className="text-[11px] sm:text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            🔥 Streak Active!
          </span>
        </div>
      )}
    </div>
  );
};
