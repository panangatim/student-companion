/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Star,
  Flame,
  PlusCircle,
  ChevronDown,
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
    <header className="bg-white/95 backdrop-blur-md border-b-2 border-amber-100 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200 text-lg sm:text-xl">
            🎒
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-none font-heading">
                Study Buddy
              </h1>
              <span className="hidden md:inline-flex items-center text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full">
                ✨ FOR STUDENTS
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-amber-800/80 truncate hidden sm:block">
              Daily homework planner &amp; habit tracker
            </p>
          </div>
        </div>

        {/* Right Section: Stars, Streak & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {currentStudent && (
            <>
              {/* Star Counter */}
              <div
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-900 shadow-2xs"
                title="Your earned learning stars!"
              >
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400" />
                <span className="text-xs sm:text-sm font-extrabold font-heading">
                  {currentStudent.stars || 0}
                </span>
                <span className="text-[10px] text-amber-700 hidden lg:inline font-bold">
                  stars
                </span>
              </div>

              {/* Streak Badge */}
              <div
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-200 text-orange-900 shadow-2xs"
                title={`${currentStreak} day study streak!`}
              >
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 fill-orange-400" />
                <span className="text-xs sm:text-sm font-extrabold font-heading">
                  {currentStreak}d
                </span>
              </div>

              {/* Active Profile Pill */}
              <button
                id="header-profile-button"
                onClick={onOpenSwitchProfile}
                className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all text-left group"
                title="Switch buddy or edit profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center text-base sm:text-xl shadow-2xs group-hover:scale-105 transition-transform">
                  {currentStudent.avatar || '🚀'}
                </div>
                <div className="hidden sm:block min-w-0 text-left">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[70px] sm:max-w-[110px]">
                    {currentStudent.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate hidden md:block">
                    {currentStudent.class}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </button>
            </>
          )}

          {!currentStudent && (
            <button
              onClick={onOpenNewProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-sm transition-all"
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
