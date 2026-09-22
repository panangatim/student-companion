/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  X,
  Clock,
  Sparkles,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySession } from '../types';

interface StudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialTopic?: string;
  initialMinutes?: number;
  onSaveSession: (session: Omit<StudySession, 'id' | 'completed_at'>) => void;
}

const MOOD_RATINGS: { key: 'easy' | 'good' | 'difficult' | 'need_help'; emoji: string; label: string }[] = [
  { key: 'easy', emoji: '😀', label: 'Easy' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'difficult', emoji: '😐', label: 'Difficult' },
  { key: 'need_help', emoji: '😟', label: 'Need Help' },
];

export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  isOpen,
  onClose,
  initialSubject = 'Science',
  initialTopic = 'Concept Revision',
  initialMinutes = 25,
  onSaveSession,
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [topic, setTopic] = useState(initialTopic);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedMood, setSelectedMood] = useState<'easy' | 'good' | 'difficult' | 'need_help'>('good');
  const [reflectionNotes, setReflectionNotes] = useState('');

  useEffect(() => {
    setSubject(initialSubject);
    setTopic(initialTopic);
    setMinutes(initialMinutes);
    setSecondsLeft(initialMinutes * 60);
    setIsActive(false);
    setIsFinished(false);
  }, [initialSubject, initialTopic, initialMinutes, isOpen]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      handleFinishSession();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  if (!isOpen) return null;

  const handleFinishSession = () => {
    setIsActive(false);
    setIsFinished(true);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
    });
  };

  const handleSaveAndClose = () => {
    const actualMinutes = Math.max(1, Math.round((minutes * 60 - secondsLeft) / 60));
    onSaveSession({
      student_id: '',
      subject,
      topic,
      duration_minutes: actualMinutes,
      mood_rating: selectedMood,
      notes: reflectionNotes,
    });
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = ((minutes * 60 - secondsLeft) / (minutes * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-indigo-200 relative my-auto animate-star-pop space-y-5 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {!isFinished ? (
          <>
            {/* Session Header */}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-heading">
                Focused Study Experience
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-heading mt-2">
                {subject} Study Session
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">Topic: {topic}</p>
            </div>

            {/* Circular / Pulsing Timer Ring */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full border-4 transition-all duration-300 ${
                  isActive ? 'border-indigo-500 animate-pulse-ring' : 'border-slate-200'
                }`}
              />
              <div className="text-center">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-heading block">
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-xs font-bold text-slate-400 mt-1 block">
                  {isActive ? 'Keep focused!' : 'Ready to begin'}
                </span>
              </div>
            </div>

            {/* Quick Goal Prompt */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs font-extrabold text-amber-950">
              🎯 Today&apos;s goal: Focus completely on {topic} without distraction.
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsActive(!isActive)}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 font-heading"
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isActive ? 'Pause' : 'Start Focus'}</span>
              </button>

              <button
                onClick={handleFinishSession}
                className="px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition-all font-heading"
              >
                Finish Session
              </button>
            </div>
          </>
        ) : (
          /* Post-Session Reflection Step */
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
              🎉
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 font-heading">
                Fantastic Focus!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You studied for {Math.max(1, Math.round((minutes * 60 - secondsLeft) / 60))} minutes.
                How did this session feel?
              </p>
            </div>

            {/* Mood selector */}
            <div className="grid grid-cols-4 gap-2">
              {MOOD_RATINGS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMood(m.key)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedMood === m.key
                      ? 'bg-indigo-50 border-indigo-400 scale-105 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl block mb-1">{m.emoji}</span>
                  <span className="text-[11px] font-black text-slate-800">{m.label}</span>
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Optional study notes: What clicked? What was tricky?"
              value={reflectionNotes}
              onChange={(e) => setReflectionNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none"
            />

            <button
              onClick={handleSaveAndClose}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-95 font-heading"
            >
              Save Session &amp; Earn Stars! ⭐
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
