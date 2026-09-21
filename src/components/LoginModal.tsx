/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, Lock, Trash2, Users } from 'lucide-react';
import { Student } from '../types';
import { PilotDataStore } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (student: Student) => void;
  currentStudentId?: string;
  onOpenCreateNew: () => void;
  onStudentDeleted?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  currentStudentId,
  onOpenCreateNew,
  onStudentDeleted,
}) => {
  const [pinPromptStudent, setPinPromptStudent] = useState<Student | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const students = PilotDataStore.getStudents();

  const handleSelect = (s: Student) => {
    if (s.pin && s.pin.length > 0) {
      setPinPromptStudent(s);
      setEnteredPin('');
      setPinError('');
      return;
    }
    PilotDataStore.setCurrentStudent(s);
    onSelectStudent(s);
    onClose();
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptStudent) return;

    if (enteredPin === pinPromptStudent.pin) {
      PilotDataStore.setCurrentStudent(pinPromptStudent);
      onSelectStudent(pinPromptStudent);
      setPinPromptStudent(null);
      onClose();
    } else {
      setPinError('Incorrect PIN! Please try again.');
    }
  };

  const handleDelete = (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this buddy profile and their tasks?')) {
      // Remove student
      const updated = students.filter((s) => s.id !== studentId);
      localStorage.setItem('study_buddy_students_v2', JSON.stringify(updated));
      if (onStudentDeleted) onStudentDeleted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-amber-200 relative my-8 animate-star-pop">
        <button
          id="close-login-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {pinPromptStudent ? (
          /* PIN Entry Screen */
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{pinPromptStudent.avatar}</div>
              <h3 className="text-xl font-extrabold text-slate-900 font-heading">
                Enter PIN for {pinPromptStudent.name}
              </h3>
              <p className="text-xs text-slate-500">
                Type your 4-digit passcode to switch to this profile.
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {pinError}
              </div>
            )}

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="4-digit PIN"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-center tracking-widest text-lg font-bold rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPinPromptStudent(null)}
                className="flex-1 py-2.5 rounded-xl border font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm"
              >
                Unlock 🔓
              </button>
            </div>
          </form>
        ) : (
          /* Student Selector Screen */
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 mb-1.5 font-heading">
                <Users className="w-3.5 h-3.5" /> Study Buddy Profiles
              </div>
              <h2 className="text-xl font-black text-slate-900 font-heading">
                Switch Student Profile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pick your profile or create a new one for a sibling or friend!
              </p>
            </div>

            {/* Profiles List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {students.map((s) => {
                const isSelected = s.id === currentStudentId;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50 shadow-2xs'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-inner">
                        {s.avatar || '🚀'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 font-heading truncate">
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{s.class}</span>
                          <span>•</span>
                          <span className="text-amber-700 font-bold">
                            ⭐ {s.stars || 0} stars
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      ) : (
                        <button
                          onClick={(e) => handleDelete(e, s.id)}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                          title="Delete profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create New Profile Button */}
            <button
              id="create-new-buddy-btn"
              onClick={() => {
                onClose();
                onOpenCreateNew();
              }}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add a New Buddy Profile</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
