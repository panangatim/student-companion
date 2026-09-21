/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Check,
  AlertCircle,
  Keyboard,
  Smile,
} from 'lucide-react';
import { TaskSource } from '../types';
import { extractTaskWithGemini } from '../lib/gemini';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../lib/speech';

interface LogTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: {
    subject: string;
    description: string;
    due_date: string;
    estimated_minutes: number;
    source: TaskSource;
  }) => void;
  studentId: string;
}

const COMMON_SUBJECTS = [
  { name: 'Mathematics', emoji: '📐' },
  { name: 'Science', emoji: '🔬' },
  { name: 'English', emoji: '📚' },
  { name: 'Social Studies', emoji: '🌍' },
  { name: 'Computer Science', emoji: '💻' },
  { name: 'Art', emoji: '🎨' },
  { name: 'General', emoji: '📝' },
];

const PRESET_IDEAS = [
  'Math worksheet Exercise 3.2',
  'Read Chapter 4 and take notes',
  'Science plant cell diagram',
  'History project map due Friday',
];

function getRelativeDateStr(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
}

export const LogTaskModal: React.FC<LogTaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [detectedSource, setDetectedSource] = useState<TaskSource>('typed');

  // Confirmation & Editing state
  const [confirmedSubject, setConfirmedSubject] = useState('Mathematics');
  const [confirmedDescription, setConfirmedDescription] = useState('');
  const [confirmedDueDate, setConfirmedDueDate] = useState(getRelativeDateStr(1));
  const [confirmedMinutes, setConfirmedMinutes] = useState(30);
  const [hasExtracted, setHasExtracted] = useState(false);

  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setInputText('');
      setIsRecording(false);
      setSpeechError('');
      setHasExtracted(false);
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleRecording = () => {
    setSpeechError('');
    if (isRecording) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechError('Microphone speech recognition is not supported in this browser. You can type your homework below!');
      return;
    }

    const rec = createSpeechRecognizer(
      (transcript, isFinal) => {
        setInputText(transcript);
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
      recognizerRef.current = rec;
      rec.start();
      setIsRecording(true);
      setDetectedSource('voice');
    }
  };

  const handleExtractTask = async () => {
    if (!inputText.trim()) return;

    setIsExtracting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const result = await extractTaskWithGemini(inputText.trim(), todayStr);

      setConfirmedSubject(result.subject || 'General');
      setConfirmedDescription(result.description || inputText.trim());
      setConfirmedDueDate(result.due_date || getRelativeDateStr(1));
      setConfirmedMinutes(result.estimated_minutes || 30);
      setHasExtracted(true);
    } catch (e) {
      // Fallback
      setConfirmedSubject('General');
      setConfirmedDescription(inputText.trim());
      setConfirmedDueDate(getRelativeDateStr(1));
      setConfirmedMinutes(30);
      setHasExtracted(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = () => {
    if (!confirmedDescription.trim()) return;

    onSaveTask({
      subject: confirmedSubject,
      description: confirmedDescription.trim(),
      due_date: confirmedDueDate,
      estimated_minutes: confirmedMinutes,
      source: detectedSource,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border-4 border-amber-200 relative my-8 animate-star-pop max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="close-log-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 mb-2 font-heading">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            New Homework Quest
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            What are you working on? 📝
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tell me using your voice or type it in. Study Buddy will organize it for you!
          </p>
        </div>

        {!hasExtracted ? (
          <div className="space-y-5">
            {/* BIG SPEECH RECORDING HERO */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-50 to-orange-50/60 border-2 border-amber-200 text-center space-y-3 shadow-inner">
              <button
                id="voice-record-toggle-btn"
                type="button"
                onClick={toggleRecording}
                className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full mx-auto flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse-ring scale-110 shadow-rose-300'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white hover:scale-105 shadow-amber-300'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>

              <div>
                <div className="text-sm font-extrabold text-slate-800 font-heading">
                  {isRecording ? 'Listening to you... Tap to Stop!' : 'Tap Microphone to Speak!'}
                </div>
                <div className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Say something like: <em>&quot;Math homework exercise 4 due tomorrow&quot;</em>
                </div>
              </div>
            </div>

            {speechError && (
              <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{speechError}</span>
              </div>
            )}

            {/* TYPED INPUT AREA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-slate-500" />
                  Or write it out:
                </span>
                {inputText && (
                  <button
                    onClick={() => setInputText('')}
                    className="text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <textarea
                id="task-text-input"
                rows={3}
                placeholder="e.g. Science friction questions 1 to 5 due Friday"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setDetectedSource('typed');
                }}
                className="w-full p-3.5 text-sm font-semibold rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 focus:outline-none transition-all"
              />
            </div>

            {/* Quick Preset Ideas */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick ideas (tap to insert):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => {
                      setInputText(idea);
                      setDetectedSource('typed');
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 font-semibold border border-slate-200 transition-colors"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Next / Extract Button */}
            <button
              id="extract-task-btn"
              type="button"
              disabled={!inputText.trim() || isExtracting}
              onClick={handleExtractTask}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isExtracting ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>Organizing your assignment...</span>
                </>
              ) : (
                <>
                  <span>Next: Check Quest Details</span>
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* STEP 2: Kid-Friendly Quest Confirmation */
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-between">
              <span>✨ Everything looks good! Review and tweak if needed:</span>
              <button
                onClick={() => setHasExtracted(false)}
                className="text-amber-700 underline text-xs font-bold hover:text-amber-900"
              >
                Back to Voice
              </button>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Subject:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {COMMON_SUBJECTS.map((sub) => (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => setConfirmedSubject(sub.name)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      confirmedSubject === sub.name
                        ? 'border-amber-400 bg-amber-50 text-amber-950 shadow-2xs'
                        : 'border-slate-100 hover:border-slate-200 text-slate-700 bg-slate-50/60'
                    }`}
                  >
                    <span>{sub.emoji}</span>
                    <span className="truncate">{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                What do you need to do?
              </label>
              <input
                id="confirmed-description-input"
                type="text"
                value={confirmedDescription}
                onChange={(e) => setConfirmedDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Due Date Buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                When is it due?
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { label: 'Today ⚡', val: getRelativeDateStr(0) },
                  { label: 'Tomorrow 🌅', val: getRelativeDateStr(1) },
                  { label: 'In 2 Days 📅', val: getRelativeDateStr(2) },
                  { label: 'In 5 Days 🗓️', val: getRelativeDateStr(5) },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setConfirmedDueDate(item.val)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-extrabold border-2 transition-all ${
                      confirmedDueDate === item.val
                        ? 'bg-amber-400 text-amber-950 border-amber-400 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={confirmedDueDate}
                onChange={(e) => setConfirmedDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Estimated Minutes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Estimated study time:
              </label>
              <div className="flex items-center gap-2">
                {[15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setConfirmedMinutes(mins)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                      confirmedMinutes === mins
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setHasExtracted(false)}
                className="py-3 px-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-100 font-bold text-slate-600 text-xs transition-colors"
              >
                Back
              </button>
              <button
                id="save-task-btn"
                type="button"
                onClick={handleSave}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Add to My Quests! 🚀</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
