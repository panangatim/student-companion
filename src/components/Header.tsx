/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Star,
  Flame,
  Users,
  PlusCircle,
  LogOut,
  ChevronDown,
  Award,
} from 'lucide-react';
import { Student } from '../types';

interface HeaderProps {
  currentStudent: Student | null;
  currentStreak: number;
  onOpenSwitchProfile: () => void;
  onOpenNewProfile: () => void;
  onOpenSummaryView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStudent,
  currentStreak,
  onOpenSwitchProfile,
  onOpenNewProfile,
}) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b-2 border-amber-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200 text-xl animate-gentle-bounce">
            🎒
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 leading-none font-heading">
                Study Buddy
              </h1>
              <span className="hidden sm:inline-flex items-center text-[10px] font-extrabold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                ✨ FOR STUDENTS
              </span>
            </div>
            <p className="text-[11px] font-semibold text-amber-800/80 truncate">
              Daily homework planner &amp; habit tracker
            </p>
          </div>
        </div>

        {/* Right Section: Stars, Streak & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentStudent && (
            <>
              {/* Star Counter */}
              <div
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 text-amber-900 shadow-2xs"
                title="Your earned learning stars!"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-400 animate-star-pop" />
                <span className="text-xs sm:text-sm font-extrabold font-heading">
                  {currentStudent.stars || 0}
                </span>
                <span className="text-[10px] text-amber-700 hidden md:inline font-bold">
                  stars
                </span>
              </div>

              {/* Streak Badge */}
              <div
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-gradient-to-r from-orange-50 to-rose-50 border-2 border-orange-200 text-orange-900 shadow-2xs"
                title={`${currentStreak} day study streak!`}
              >
                <Flame className="w-4 h-4 text-orange-500 fill-orange-400" />
                <span className="text-xs sm:text-sm font-extrabold font-heading">
                  {currentStreak}d
                </span>
              </div>

              {/* Active Profile Pill */}
              <button
                id="header-profile-button"
                onClick={onOpenSwitchProfile}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-300 transition-all text-left group"
                title="Switch buddy or edit profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center text-lg sm:text-xl shadow-2xs group-hover:scale-105 transition-transform">
                  {currentStudent.avatar || '🚀'}
                </div>
                <div className="hidden sm:block min-w-0 text-left">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[80px] sm:max-w-[110px]">
                    {currentStudent.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate">
                    {currentStudent.class}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </button>
            </>
          )}

          {!currentStudent && (
            <button
              onClick={onOpenNewProfile}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Profile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
