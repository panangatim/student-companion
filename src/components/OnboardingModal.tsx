/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, User, BookOpen, Shield, Heart } from 'lucide-react';
import { Student } from '../types';
import { PilotDataStore, hashPin } from '../lib/supabase';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (student: Student) => void;
  canCancel?: boolean;
  onClose?: () => void;
}

const AVATAR_OPTIONS = [
  { emoji: '🚀', label: 'Space' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🦉', label: 'Owl' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '⚡', label: 'Hero' },
  { emoji: '🐼', label: 'Panda' },
  { emoji: '🐬', label: 'Dolphin' },
  { emoji: '⚽', label: 'Sport' },
  { emoji: '🦄', label: 'Magic' },
];

const GRADE_SUGGESTIONS = [
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'High School',
];

const SUBJECT_OPTIONS = [
  { name: 'Mathematics', emoji: '📐' },
  { name: 'Science', emoji: '🔬' },
  { name: 'English', emoji: '📚' },
  { name: 'Social Studies', emoji: '🌍' },
  { name: 'Computer Science', emoji: '💻' },
  { name: 'Art & Music', emoji: '🎨' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  canCancel = false,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🚀');
  const [grade, setGrade] = useState('Grade 6');
  const [school, setSchool] = useState('');
  const [favoriteSubject, setFavoriteSubject] = useState('Science');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name or nickname!');
      return;
    }

    const hashedPin = pin.trim() ? await hashPin(pin.trim()) : '';

    const created = PilotDataStore.createStudent({
      name: name.trim(),
      username: name.trim().toLowerCase().replace(/\s+/g, ''),
      pin: hashedPin,
      class: grade.trim() || 'Student',
      school: school.trim(),
      avatar: selectedAvatar,
      favorite_subject: favoriteSubject,
    });

    onComplete(created);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl border-4 border-amber-200 relative my-auto animate-star-pop max-h-[90dvh] overflow-y-auto">
        {/* Top Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-400 text-white shadow-md mb-2 sm:mb-3 animate-gentle-bounce text-2xl sm:text-3xl">
            {selectedAvatar}
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Welcome to Study Buddy! ✨
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Let&apos;s set up your profile so you can track homework, earn stars, and build awesome study habits!
          </p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pick Your Avatar:
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {AVATAR_OPTIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSelectedAvatar(item.emoji)}
                  className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border-2 transition-all ${
                    selectedAvatar === item.emoji
                      ? 'border-amber-400 bg-amber-50 scale-105 shadow-2xs'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/70 hover:bg-slate-50'
                  }`}
                  title={item.label}
                >
                  <span className="text-xl sm:text-2xl">{item.emoji}</span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 truncate max-w-full">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              Your Name or Nickname:
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              placeholder="e.g. Maya, Alex, or Sam"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200/50 transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Grade / Class */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              Grade or Class:
            </label>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5">
              {GRADE_SUGGESTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
                    grade === g
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type custom class (e.g. Class 7-A)"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {/* Favorite Subject */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Favorite Subject (optional):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SUBJECT_OPTIONS.map((sub) => (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => setFavoriteSubject(sub.name)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left truncate ${
                    favoriteSubject === sub.name
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-2xs font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{sub.emoji}</span>
                  <span className="truncate">{sub.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* School Name & Optional PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-0.5">
                School (optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Lincoln Middle"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-0.5">
                Secret 4-digit PIN (optional):
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="e.g. 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-300"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center gap-2.5">
            {canCancel && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-3 rounded-2xl border-2 border-slate-200 hover:bg-slate-100 font-bold text-slate-600 text-xs sm:text-sm transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              id="complete-onboarding-btn"
              type="submit"
              className="flex-2 w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Let&apos;s Start Learning!</span>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </form>

        <div className="mt-3 text-center">
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            100% private to this device. No tracking or email needed.
          </span>
        </div>
      </div>
    </div>
  );
};
