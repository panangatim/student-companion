/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Camera,
  Mic,
  MicOff,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  Trash2,
  Tag,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Task, DiaryType, TaskPriority } from '../types';
import { extractTaskWithGemini } from '../lib/gemini';

interface DiaryViewProps {
  studentId: string;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
}

const DIARY_CATEGORIES: { key: DiaryType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All Entries', icon: '📖' },
  { key: 'homework', label: 'Homework', icon: '📝' },
  { key: 'classwork', label: 'Classwork', icon: '🎒' },
  { key: 'teacher_note', label: 'Teacher Notes', icon: '👩‍🏫' },
  { key: 'project', label: 'Projects', icon: '🔬' },
  { key: 'exam', label: 'Exams', icon: '🎯' },
  { key: 'event', label: 'School Events', icon: '🎪' },
];

export const DiaryView: React.FC<DiaryViewProps> = ({
  studentId,
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleStatus,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DiaryType | 'all'>('all');
  const [quickText, setQuickText] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerMockSuccess, setScannerMockSuccess] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'all') return true;
    return (t.entry_type || 'homework') === selectedCategory;
  });

  // Speech Recognition
  const toggleSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuickText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setSpeechError('Microphone permission needed or quiet input.');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setSpeechError('Unable to access microphone.');
      setIsListening(false);
    }
  };

  // Smart Quick Add submit
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    setIsProcessingAi(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const parsed = await extractTaskWithGemini(quickText.trim(), todayStr);

      // Determine entry type heuristically
      const lower = quickText.toLowerCase();
      let type: DiaryType = 'homework';
      if (lower.includes('classwork') || lower.includes('class notes')) type = 'classwork';
      else if (lower.includes('teacher said') || lower.includes('teacher') || lower.includes('bring'))
        type = 'teacher_note';
      else if (lower.includes('project')) type = 'project';
      else if (lower.includes('test') || lower.includes('exam')) type = 'exam';
      else if (lower.includes('assembly') || lower.includes('sports day') || lower.includes('event'))
        type = 'event';

      onAddTask({
        student_id: studentId,
        subject: parsed.subject || 'General',
        title: parsed.description,
        description: quickText.trim(),
        assigned_date: todayStr,
        due_date: parsed.due_date || todayStr,
        status: 'pending',
        source: isListening ? 'voice' : 'typed',
        estimated_minutes: parsed.estimated_minutes || 30,
        entry_type: type,
        priority: 'normal',
      });

      setQuickText('');
    } catch (err) {
      console.error('Quick add error:', err);
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Mock scanner trigger
  const handleMockScanUpload = () => {
    setScannerMockSuccess(true);
    setTimeout(() => {
      onAddTask({
        student_id: studentId,
        subject: 'Science',
        title: 'Science Worksheet: Plant Cells Diagram',
        description: 'Completed from scanned school diary sheet.',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'pending',
        source: 'camera',
        estimated_minutes: 30,
        entry_type: 'homework',
        teacher_name: 'Dr. Rao',
      });
      setShowScannerModal(false);
      setScannerMockSuccess(false);
    }, 1800);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider font-heading mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Digital School Diary
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            My School Diary 📖
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Your central record for homework, classwork, teacher instructions, and school events.
          </p>
        </div>

        <button
          onClick={() => setShowScannerModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Diary / Page</span>
        </button>
      </div>

      {/* Smart Quick-Add Bar */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-4 sm:p-5 border border-indigo-100 shadow-sm">
        <form onSubmit={handleQuickAdd} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-indigo-950 font-heading flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Smart Quick-Add (Type or Speak)</span>
            </label>
            <span className="text-[11px] text-indigo-700 font-semibold hidden sm:inline">
              e.g. &ldquo;Maths exercise 5.2 due tomorrow&rdquo;
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 sm:p-2 border-2 border-indigo-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
            <input
              type="text"
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="What did teacher assign today? (e.g. Science Chapter 4 questions due Friday)"
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              disabled={isProcessingAi}
            />

            <button
              type="button"
              onClick={toggleSpeech}
              title="Speak thought"
              className={`p-2.5 rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={!quickText.trim() || isProcessingAi}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center gap-1.5 shrink-0 font-heading"
            >
              {isProcessingAi ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Diary</span>
                </>
              )}
            </button>
          </div>

          {speechError && (
            <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{speechError}</span>
            </p>
          )}
        </form>
      </div>

      {/* Categories Filter Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DIARY_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          const count =
            cat.key === 'all'
              ? tasks.length
              : tasks.filter((t) => (t.entry_type || 'homework') === cat.key).length;

          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-2 rounded-2xl text-xs font-black font-heading transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Diary Entries List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-2">
            <div className="text-4xl">📝</div>
            <h3 className="text-base font-black text-slate-800 font-heading">
              No entries in this section yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the Smart Quick-Add bar above to record your homework, classwork, or teacher instructions!
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === 'done';
            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'border-slate-200 bg-slate-50/60 opacity-70'
                    : 'border-slate-200 hover:border-indigo-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => onToggleStatus(t.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-indigo-500" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-heading">
                        {t.entry_type || 'Homework'}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {t.subject}
                      </span>
                      {t.teacher_name && (
                        <span className="text-[10px] font-semibold text-slate-500 italic">
                          Teacher: {t.teacher_name}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-black text-slate-900 font-heading ${
                        isDone ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {t.title || t.description}
                    </h4>

                    {t.title && t.description && t.title !== t.description && (
                      <p className="text-xs text-slate-600 font-medium">{t.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due {t.due_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {t.estimated_minutes || 30} mins
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onDeleteTask(t.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Homework Scanner Modal Mockup */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-indigo-200 relative my-auto animate-star-pop space-y-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              📸
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Homework Diary Scanner
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Take a photo of your school diary page, blackboard assignment, or printed worksheet.
                Buddy AI will automatically extract subjects and due dates!
              </p>
            </div>

            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 bg-indigo-50/40 text-center space-y-2">
              <Camera className="w-8 h-8 text-indigo-500 mx-auto" />
              <p className="text-xs font-bold text-indigo-900">
                Tap below to simulate scanning a page
              </p>
              <button
                onClick={handleMockScanUpload}
                disabled={scannerMockSuccess}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
              >
                {scannerMockSuccess ? 'Analyzing image with Buddy AI...' : 'Capture Sample Diary Photo'}
              </button>
            </div>

            {scannerMockSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-pulse">
                ✨ Extracted: Science Worksheet (Due tomorrow)! Adding to diary...
              </div>
            )}

            <button
              onClick={() => setShowScannerModal(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
