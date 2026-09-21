/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookHeart,
  Smile,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reflection, BehaviorStat, TaskSource } from '../types';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../lib/speech';

interface WeeklyReflectionViewProps {
  studentId: string;
  reflections: Reflection[];
  stats: BehaviorStat[];
  onAddReflection: (ref: {
    student_id: string;
    week_start: string;
    prompt_answered: string;
    response_text: string;
    mood?: string;
    source: TaskSource;
  }) => void;
}

const MOODS = [
  { emoji: '🚀', label: 'Unstoppable!' },
  { emoji: '🌟', label: 'Super Proud' },
  { emoji: '😄', label: 'Happy & Good' },
  { emoji: '💪', label: 'Worked Hard' },
  { emoji: '😅', label: 'Tired but Tried' },
];

const PROMPT_QUESTION = 'What worked awesome this week? What is one thing you will try next week?';

export const WeeklyReflectionView: React.FC<WeeklyReflectionViewProps> = ({
  studentId,
  reflections,
  onAddReflection,
}) => {
  const [responseText, setResponseText] = useState('');
  const [selectedMood, setSelectedMood] = useState('🌟');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [detectedSource, setDetectedSource] = useState<TaskSource>('typed');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Derive this week's start date
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  const weekStartStr = monday.toISOString().split('T')[0];

  const toggleRecording = () => {
    setSpeechError('');
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechError('Microphone not supported in this browser. Please type your reflection.');
      return;
    }

    const rec = createSpeechRecognizer(
      (transcript) => {
        setResponseText(transcript);
        setDetectedSource('voice');
      },
      (err) => {
        setSpeechError(err);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (rec) {
      rec.start();
      setIsRecording(true);
      setDetectedSource('voice');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    onAddReflection({
      student_id: studentId,
      week_start: weekStartStr,
      prompt_answered: PROMPT_QUESTION,
      response_text: responseText.trim(),
      mood: selectedMood,
      source: detectedSource,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#fbbf24', '#f43f5e', '#10b981'],
      });
    } catch (e) {}

    setResponseText('');
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-5 sm:p-6 border-2 border-amber-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full font-heading flex items-center gap-1.5">
            <BookHeart className="w-3.5 h-3.5 text-rose-500" />
            My Weekly Star Journal
          </span>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Week of {weekStartStr}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          How did your week go? 💭
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Reflecting on what worked helps you plan easier study times. Plus, each weekly entry earns +20 bonus stars! ⭐
        </p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-5 sm:p-6 border-2 border-amber-100 shadow-sm space-y-4">
        {/* Mood Selector */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
            How are you feeling about your studies this week?
          </label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => setSelectedMood(m.emoji)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border-2 font-bold text-xs transition-all ${
                  selectedMood === m.emoji
                    ? 'border-amber-400 bg-amber-100/70 text-amber-950 scale-105 shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-lg">{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-sm font-extrabold text-amber-950">
          ✨ {PROMPT_QUESTION}
        </div>

        {isSavedRecently && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-xs sm:text-sm font-extrabold flex items-center justify-between animate-star-pop">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Journal entry saved! +20 Stars awarded to your trophy room! ⭐
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Speak or write your thoughts:
            </label>
            <button
              type="button"
              onClick={toggleRecording}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Listening... Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-amber-600" />
                  <span>🎤 Speak Thoughts</span>
                </>
              )}
            </button>
          </div>

          {speechError && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          <textarea
            rows={4}
            value={responseText}
            onChange={(e) => {
              setResponseText(e.target.value);
              setDetectedSource('typed');
            }}
            placeholder="e.g. Doing my math homework right after school helped me relax in the evening. Reading took a little longer so I will start earlier next time!"
            className="w-full p-4 text-sm font-semibold rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 focus:outline-none transition-all"
            required
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 font-medium">
              Private journal entry for your growth
            </span>
            <button
              type="submit"
              disabled={!responseText.trim()}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Save &amp; Collect 20 Stars! ⭐</span>
            </button>
          </div>
        </form>
      </div>

      {/* PAST ENTRIES */}
      <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-5 sm:p-6 border-2 border-amber-100 shadow-sm space-y-3">
        <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
          My Journal History ({reflections.length})
        </h3>

        {reflections.length === 0 ? (
          <div className="text-xs sm:text-sm text-slate-400 text-center py-6">
            No reflections yet! Write your first entry above to record your learning journey.
          </div>
        ) : (
          <div className="space-y-3">
            {reflections.map((ref) => (
              <div
                key={ref.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-lg">{ref.mood || '🌟'}</span>
                    <span>Week of {ref.week_start}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-200/80 px-2 py-0.5 rounded-md text-slate-700">
                    Via {ref.source}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed">
                  &quot;{ref.response_text}&quot;
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
